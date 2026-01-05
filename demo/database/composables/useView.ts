import type {
  View,
  ViewType,
  ViewConfig,
  VisibleColumn,
  SharedWith,
  FilterCondition,
  SortConfig,
  Column,
  Table,
  RelatedTableInfo,
  ResolvedColumn,
  Row
} from '../types/database'
import { useDatabase, useTable } from './useDatabase'

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Composable for managing a single view
 * Provides view configuration, column management, filter/sort management, and sharing
 */
export function useView(databaseId: string, tableId: string, viewId?: string) {
  const { getDatabaseById } = useDatabase()
  const { table, getTableById, queryRows, resolveRelation, resolveUser } = useTable(databaseId, tableId)
  
  // Reactive view state
  const currentViewId = ref<string | undefined>(viewId)
  const hasUnsavedChanges = ref(false)
  
  // Get the database
  const database = computed(() => getDatabaseById(databaseId))
  
  // Get the current view
  const view = computed(() => {
    if (!table.value || !currentViewId.value) return null
    return table.value.views.find(v => v.id === currentViewId.value) || null
  })
  
  // ============ Related Tables ============
  
  /**
   * Get all related tables for the current table
   * This is used by the column selector to show related table columns
   */
  function getRelatedTables(): RelatedTableInfo[] {
    if (!table.value) return []
    
    const relatedTables: RelatedTableInfo[] = []
    
    for (const column of table.value.columns) {
      if (column.type === 'relation' && column.relationConfig) {
        const relatedTable = getTableById(column.relationConfig.tableId)
        if (relatedTable) {
          relatedTables.push({
            relationField: column.field,
            relationColumn: column,
            relatedTableId: relatedTable.id,
            relatedTableName: relatedTable.name,
            relatedTableIcon: relatedTable.icon,
            columns: relatedTable.columns.filter(c => 
              // Exclude relation columns pointing back to avoid circular references
              c.type !== 'relation' || c.relationConfig?.tableId !== tableId
            ),
            relationType: column.relationConfig.multiple ? 'multiple' : 'single'
          })
        }
      }
    }
    
    return relatedTables
  }
  
  /**
   * Get columns from a related table
   */
  function getRelatedTableColumns(relationField: string): Column[] {
    const relatedTables = getRelatedTables()
    const info = relatedTables.find(rt => rt.relationField === relationField)
    return info?.columns || []
  }
  
  // ============ Column Management ============
  
  /**
   * Get default visible columns (all base table columns, visible)
   */
  function getDefaultVisibleColumns(): VisibleColumn[] {
    if (!table.value) return []
    
    return table.value.columns.map((col, index) => ({
      id: generateId('vcol'),
      columnId: col.id,
      field: col.field,
      sourceTableId: tableId,
      sourceType: 'base' as const,
      visible: true,
      order: index,
      width: col.width
    }))
  }
  
  /**
   * Get current visible columns (from view or default)
   */
  const visibleColumns = computed((): VisibleColumn[] => {
    if (view.value?.columns && view.value.columns.length > 0) {
      return view.value.columns
    }
    return getDefaultVisibleColumns()
  })
  
  /**
   * Resolve visible columns to full column definitions for rendering
   */
  function resolveVisibleColumns(): ResolvedColumn[] {
    const columns = visibleColumns.value.filter(vc => vc.visible)
    const resolved: ResolvedColumn[] = []
    
    for (const vc of columns.sort((a, b) => a.order - b.order)) {
      if (vc.sourceType === 'base') {
        // Base table column
        const col = table.value?.columns.find(c => c.id === vc.columnId || c.field === vc.field)
        if (col) {
          resolved.push({
            id: vc.id,
            field: col.field,
            title: vc.displayTitle || col.title,
            type: col.type,
            width: vc.width || col.width,
            sourceType: 'base',
            originalColumn: col
          })
        }
      } else if (vc.sourceType === 'relation' && vc.relationField) {
        // Related table column
        const relationCol = table.value?.columns.find(c => c.field === vc.relationField)
        if (relationCol?.relationConfig) {
          const relatedTable = getTableById(relationCol.relationConfig.tableId)
          const col = relatedTable?.columns.find(c => c.id === vc.columnId || c.field === vc.field)
          if (col) {
            resolved.push({
              id: vc.id,
              field: `${vc.relationField}__${col.field}`,
              title: vc.displayTitle || `${relationCol.title} → ${col.title}`,
              type: col.type,
              width: vc.width || col.width,
              sourceType: 'relation',
              relationField: vc.relationField,
              originalColumn: col
            })
          }
        }
      }
    }
    
    return resolved
  }
  
  /**
   * Toggle column visibility
   */
  function toggleColumn(columnId: string, visible?: boolean): void {
    if (!view.value) return
    
    const columns = [...(view.value.columns || getDefaultVisibleColumns())]
    const index = columns.findIndex(c => c.id === columnId)
    
    if (index !== -1) {
      columns[index] = {
        ...columns[index],
        visible: visible !== undefined ? visible : !columns[index].visible
      }
      updateViewColumns(columns)
    }
    
    hasUnsavedChanges.value = true
  }
  
  /**
   * Add a column to the view
   */
  function addColumn(column: Omit<VisibleColumn, 'id' | 'order'>): void {
    if (!view.value) return
    
    const columns = [...(view.value.columns || getDefaultVisibleColumns())]
    const maxOrder = columns.reduce((max, c) => Math.max(max, c.order), 0)
    
    columns.push({
      ...column,
      id: generateId('vcol'),
      order: maxOrder + 1
    })
    
    updateViewColumns(columns)
    hasUnsavedChanges.value = true
  }
  
  /**
   * Remove a column from the view
   */
  function removeColumn(columnId: string): void {
    if (!view.value) return
    
    const columns = (view.value.columns || getDefaultVisibleColumns())
      .filter(c => c.id !== columnId)
    
    updateViewColumns(columns)
    hasUnsavedChanges.value = true
  }
  
  /**
   * Reorder columns
   */
  function reorderColumns(columnIds: string[]): void {
    if (!view.value) return
    
    const columns = [...(view.value.columns || getDefaultVisibleColumns())]
    
    columnIds.forEach((id, index) => {
      const col = columns.find(c => c.id === id)
      if (col) {
        col.order = index
      }
    })
    
    updateViewColumns(columns)
    hasUnsavedChanges.value = true
  }
  
  /**
   * Update view columns
   */
  function updateViewColumns(columns: VisibleColumn[]): void {
    if (!view.value || !table.value) return
    
    const viewIndex = table.value.views.findIndex(v => v.id === view.value!.id)
    if (viewIndex !== -1) {
      table.value.views[viewIndex] = {
        ...table.value.views[viewIndex],
        columns,
        updatedAt: new Date().toISOString()
      }
    }
  }
  
  // ============ Filter Management ============
  
  /**
   * Get current filters
   */
  const filters = computed((): FilterCondition[] => {
    return view.value?.config?.filters || []
  })
  
  /**
   * Add a filter
   */
  function addFilter(filter: FilterCondition): void {
    if (!view.value) return
    
    const currentFilters = [...(view.value.config?.filters || [])]
    currentFilters.push(filter)
    
    updateViewConfig({ filters: currentFilters })
    hasUnsavedChanges.value = true
  }
  
  /**
   * Update a filter
   */
  function updateFilter(index: number, filter: FilterCondition): void {
    if (!view.value) return
    
    const currentFilters = [...(view.value.config?.filters || [])]
    if (index >= 0 && index < currentFilters.length) {
      currentFilters[index] = filter
      updateViewConfig({ filters: currentFilters })
      hasUnsavedChanges.value = true
    }
  }
  
  /**
   * Remove a filter
   */
  function removeFilter(index: number): void {
    if (!view.value) return
    
    const currentFilters = [...(view.value.config?.filters || [])]
    currentFilters.splice(index, 1)
    
    updateViewConfig({ filters: currentFilters })
    hasUnsavedChanges.value = true
  }
  
  /**
   * Clear all filters
   */
  function clearFilters(): void {
    if (!view.value) return
    
    updateViewConfig({ filters: [] })
    hasUnsavedChanges.value = true
  }
  
  // ============ Group By Management ============
  
  /**
   * Get current groupBy configuration
   */
  const groupBy = computed(() => {
    return view.value?.config?.groupBy || null
  })
  
  /**
   * Set group by field
   */
  function setGroupBy(field: string | null): void {
    if (!view.value) return
    
    if (field) {
      updateViewConfig({ 
        groupBy: { 
          field,
          collapsed: [],
          showEmptyGroups: true
        } 
      })
    } else {
      // Clear groupBy
      const config = { ...view.value.config }
      delete config.groupBy
      updateViewConfig(config)
    }
    
    hasUnsavedChanges.value = true
  }
  
  /**
   * Toggle group collapsed state
   */
  function toggleGroupCollapsed(groupValue: string): void {
    if (!view.value?.config?.groupBy) return
    
    const collapsed = view.value.config.groupBy.collapsed || []
    const index = collapsed.indexOf(groupValue)
    
    if (index !== -1) {
      // Remove from collapsed
      collapsed.splice(index, 1)
    } else {
      // Add to collapsed
      collapsed.push(groupValue)
    }
    
    updateViewConfig({
      groupBy: {
        ...view.value.config.groupBy,
        collapsed: [...collapsed]
      }
    })
    
    hasUnsavedChanges.value = true
  }
  
  /**
   * Check if a group is collapsed
   */
  function isGroupCollapsed(groupValue: string): boolean {
    if (!view.value?.config?.groupBy) return false
    return (view.value.config.groupBy.collapsed || []).includes(groupValue)
  }
  
  // ============ Sort Management ============
  
  /**
   * Get current sorting
   */
  const sorting = computed((): SortConfig[] => {
    return view.value?.config?.sorting || []
  })
  
  /**
   * Add a sort
   */
  function addSort(sort: SortConfig): void {
    if (!view.value) return
    
    const currentSorting = [...(view.value.config?.sorting || [])]
    
    // Remove existing sort for same field
    const existingIndex = currentSorting.findIndex(s => s.field === sort.field)
    if (existingIndex !== -1) {
      currentSorting.splice(existingIndex, 1)
    }
    
    currentSorting.push(sort)
    updateViewConfig({ sorting: currentSorting })
    hasUnsavedChanges.value = true
  }
  
  /**
   * Update a sort
   */
  function updateSort(index: number, sort: SortConfig): void {
    if (!view.value) return
    
    const currentSorting = [...(view.value.config?.sorting || [])]
    if (index >= 0 && index < currentSorting.length) {
      currentSorting[index] = sort
      updateViewConfig({ sorting: currentSorting })
      hasUnsavedChanges.value = true
    }
  }
  
  /**
   * Remove a sort
   */
  function removeSort(index: number): void {
    if (!view.value) return
    
    const currentSorting = [...(view.value.config?.sorting || [])]
    currentSorting.splice(index, 1)
    
    updateViewConfig({ sorting: currentSorting })
    hasUnsavedChanges.value = true
  }
  
  /**
   * Clear all sorting
   */
  function clearSorting(): void {
    if (!view.value) return
    
    updateViewConfig({ sorting: [] })
    hasUnsavedChanges.value = true
  }
  
  // ============ View Config ============
  
  /**
   * Update view configuration
   */
  function updateViewConfig(config: Partial<ViewConfig>): void {
    if (!view.value || !table.value) return
    
    const viewIndex = table.value.views.findIndex(v => v.id === view.value!.id)
    if (viewIndex !== -1) {
      table.value.views[viewIndex] = {
        ...table.value.views[viewIndex],
        config: {
          ...table.value.views[viewIndex].config,
          ...config
        },
        updatedAt: new Date().toISOString()
      }
    }
  }
  
  /**
   * Update view type
   */
  function updateViewType(type: ViewType): void {
    if (!view.value || !table.value) return
    
    const viewIndex = table.value.views.findIndex(v => v.id === view.value!.id)
    if (viewIndex !== -1) {
      table.value.views[viewIndex] = {
        ...table.value.views[viewIndex],
        type,
        updatedAt: new Date().toISOString()
      }
    }
    
    hasUnsavedChanges.value = true
  }
  
  /**
   * Update view name
   */
  function updateViewName(name: string): void {
    if (!view.value || !table.value) return
    
    const viewIndex = table.value.views.findIndex(v => v.id === view.value!.id)
    if (viewIndex !== -1) {
      table.value.views[viewIndex] = {
        ...table.value.views[viewIndex],
        name,
        updatedAt: new Date().toISOString()
      }
    }
    
    hasUnsavedChanges.value = true
  }
  
  // ============ Sharing ============
  
  /**
   * Get shared users/groups
   */
  const sharedWith = computed((): SharedWith[] => {
    return view.value?.sharedWith || []
  })
  
  /**
   * Share view with a user/group
   */
  function shareWith(target: Omit<SharedWith, 'sharedAt' | 'sharedBy'>): void {
    if (!view.value || !table.value) return
    
    const currentShared = [...(view.value.sharedWith || [])]
    
    // Check if already shared
    const existingIndex = currentShared.findIndex(
      s => s.type === target.type && s.id === target.id
    )
    
    if (existingIndex !== -1) {
      // Update permission
      currentShared[existingIndex] = {
        ...currentShared[existingIndex],
        permission: target.permission
      }
    } else {
      // Add new share
      currentShared.push({
        ...target,
        sharedAt: new Date().toISOString()
      })
    }
    
    const viewIndex = table.value.views.findIndex(v => v.id === view.value!.id)
    if (viewIndex !== -1) {
      table.value.views[viewIndex] = {
        ...table.value.views[viewIndex],
        sharedWith: currentShared,
        visibility: 'shared',
        updatedAt: new Date().toISOString()
      }
    }
    
    hasUnsavedChanges.value = true
  }
  
  /**
   * Remove share
   */
  function removeShare(targetType: 'user' | 'group' | 'role', targetId: string): void {
    if (!view.value || !table.value) return
    
    const currentShared = (view.value.sharedWith || [])
      .filter(s => !(s.type === targetType && s.id === targetId))
    
    const viewIndex = table.value.views.findIndex(v => v.id === view.value!.id)
    if (viewIndex !== -1) {
      table.value.views[viewIndex] = {
        ...table.value.views[viewIndex],
        sharedWith: currentShared,
        visibility: currentShared.length > 0 ? 'shared' : 'personal',
        updatedAt: new Date().toISOString()
      }
    }
    
    hasUnsavedChanges.value = true
  }
  
  // ============ Data Resolution ============
  
  /**
   * Resolve a related field value from a row
   */
  function resolveRelatedFieldValue(row: Row, relationField: string, field: string): any {
    const relationCol = table.value?.columns.find(c => c.field === relationField)
    if (!relationCol?.relationConfig) return null
    
    const relatedId = row[relationField]
    if (!relatedId) return null
    
    // Handle multiple relations
    if (Array.isArray(relatedId)) {
      if (relatedId.length === 0) return null
      // Return first value or count for multiple
      const firstId = relatedId[0]
      const relatedTable = getTableById(relationCol.relationConfig.tableId)
      const relatedRow = relatedTable?.rows.find(r => r.id === firstId)
      
      if (relatedId.length > 1) {
        return `${relatedRow?.[field] || ''} (+${relatedId.length - 1})`
      }
      return relatedRow?.[field] || null
    }
    
    // Single relation
    const relatedTable = getTableById(relationCol.relationConfig.tableId)
    const relatedRow = relatedTable?.rows.find(r => r.id === relatedId)
    return relatedRow?.[field] || null
  }
  
  /**
   * Get cell value for a resolved column
   */
  function getCellValue(row: Row, resolvedColumn: ResolvedColumn): any {
    if (resolvedColumn.sourceType === 'base') {
      return row[resolvedColumn.originalColumn.field]
    }
    
    if (resolvedColumn.sourceType === 'relation' && resolvedColumn.relationField) {
      return resolveRelatedFieldValue(
        row,
        resolvedColumn.relationField,
        resolvedColumn.originalColumn.field
      )
    }
    
    return null
  }
  
  // ============ View Lifecycle ============
  
  /**
   * Save the view (mark as saved)
   */
  function saveView(): void {
    hasUnsavedChanges.value = false
    // In a real app, this would call the backend API
  }
  
  /**
   * Set the current view
   */
  function setViewId(id: string): void {
    currentViewId.value = id
    hasUnsavedChanges.value = false
  }
  
  /**
   * Create a new view
   */
  function createView(data: {
    name: string
    type?: ViewType
    baseTableId?: string
    createdBy?: string
  }): View | undefined {
    if (!table.value) return undefined
    
    const now = new Date().toISOString()
    const newView: View = {
      id: generateId('view'),
      name: data.name,
      type: data.type || 'table',
      baseTableId: data.baseTableId || tableId,
      isDefault: false,
      visibility: 'personal',
      createdBy: data.createdBy,
      columns: getDefaultVisibleColumns(),
      config: {},
      createdAt: now,
      updatedAt: now
    }
    
    table.value.views.push(newView)
    currentViewId.value = newView.id
    
    return newView
  }
  
  /**
   * Duplicate a view
   */
  function duplicateView(sourceViewId: string, newName: string): View | undefined {
    if (!table.value) return undefined
    
    const sourceView = table.value.views.find(v => v.id === sourceViewId)
    if (!sourceView) return undefined
    
    const now = new Date().toISOString()
    const newView: View = {
      ...JSON.parse(JSON.stringify(sourceView)), // Deep clone
      id: generateId('view'),
      name: newName,
      isDefault: false,
      visibility: 'personal',
      sharedWith: [],
      createdAt: now,
      updatedAt: now
    }
    
    // Generate new IDs for columns
    if (newView.columns) {
      newView.columns = newView.columns.map(c => ({
        ...c,
        id: generateId('vcol')
      }))
    }
    
    table.value.views.push(newView)
    
    return newView
  }
  
  /**
   * Delete a view
   */
  function deleteView(viewIdToDelete: string): boolean {
    if (!table.value) return false
    
    // Don't delete the last view or default view
    if (table.value.views.length <= 1) return false
    
    const viewToDelete = table.value.views.find(v => v.id === viewIdToDelete)
    if (viewToDelete?.isDefault) return false
    
    const index = table.value.views.findIndex(v => v.id === viewIdToDelete)
    if (index === -1) return false
    
    table.value.views.splice(index, 1)
    
    // If we deleted the current view, switch to default
    if (currentViewId.value === viewIdToDelete) {
      const defaultView = table.value.views.find(v => v.isDefault) || table.value.views[0]
      currentViewId.value = defaultView?.id
    }
    
    return true
  }
  
  return {
    // State
    view,
    table,
    database,
    currentViewId,
    hasUnsavedChanges,
    
    // Related tables
    getRelatedTables,
    getRelatedTableColumns,
    
    // Columns
    visibleColumns,
    resolveVisibleColumns,
    toggleColumn,
    addColumn,
    removeColumn,
    reorderColumns,
    updateViewColumns,
    getDefaultVisibleColumns,
    
    // Filters
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    
    // Grouping
    groupBy,
    setGroupBy,
    toggleGroupCollapsed,
    isGroupCollapsed,
    
    // Sorting
    sorting,
    addSort,
    updateSort,
    removeSort,
    clearSorting,
    
    // View config
    updateViewConfig,
    updateViewType,
    updateViewName,
    
    // Sharing
    sharedWith,
    shareWith,
    removeShare,
    
    // Data resolution
    resolveRelatedFieldValue,
    getCellValue,
    
    // View lifecycle
    saveView,
    setViewId,
    createView,
    duplicateView,
    deleteView
  }
}

