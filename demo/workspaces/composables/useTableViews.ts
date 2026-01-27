import type { CaseViewRecord, ViewFilter, ViewSorting, ViewGrouping } from '../utils/db/schema/newTableSchema'
import { ElMessage } from 'element-plus'
/**
 * View Context for view management
 */
export interface ViewContext {
  currentView: Ref<CaseViewRecord | null>
  views: Ref<CaseViewRecord[]>
  columnFilterRules: Ref<any[]>
  columnSortRules: Ref<any[]>
  columnGroupRules: Ref<any[]>
  getViews: () => Promise<CaseViewRecord[]>
  getViewById: (viewId: string) => Promise<void>
  getDefaultView: () => Promise<CaseViewRecord | null>
  createView: (view: Partial<CaseViewRecord>) => Promise<CaseViewRecord>
  updateView: (viewId: string, updates: Partial<CaseViewRecord>) => Promise<void>
  deleteView: (viewId: string) => Promise<void>
  saveViewFilterSortGroup: () => Promise<void>
}

export const ViewContextKey: InjectionKey<ViewContext> = Symbol('ViewContext')

export interface UseTableViewsOptions {
  tableId: Ref<string>
  entityId: Ref<string>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  // Optional callbacks
  onViewChanged?: (view: CaseViewRecord) => void
}

export function useTableViews(options: UseTableViewsOptions) {
  const { tableId, entityId, query, onViewChanged } = options

  const currentView = ref<CaseViewRecord | null>(null)
  const views = ref<CaseViewRecord[]>([])

  // Filter, sort, group rules - loaded from view
  const columnFilterRules = ref<any[]>([])
  const columnSortRules = ref<any[]>([])
  const columnGroupRules = ref<any[]>([])

  /**
   * Get all views for the current table
   */
  async function getViews(): Promise<CaseViewRecord[]> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    const data = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE "tableId" = $1 ORDER BY "isDefault" DESC, name ASC`, [tableId.value])
    views.value = data

    // Set current view to default if not set
    if (!currentView.value && data.length > 0) {
      currentView.value = data.find((v) => v.isDefault) || data[0]
    }

    return data
  }

  /**
   * Get the default view for the current table
   */
  async function getDefaultView(): Promise<CaseViewRecord | null> {
    if (!tableId.value) {
      return null
    }
    const data = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE "tableId" = $1 AND "isDefault" = true`, [tableId.value])
    return data[0] || null
  }

  /**
   * Get a view by ID and set it as current
   */
  async function getViewById(viewId: string): Promise<void> {
    const data = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE id = $1`, [viewId])
    if (!data || !data.length) {
      throw new Error(`View with id ${viewId} not found`)
    }

    currentView.value = data[0]

    // Load filter, sort, group from view
    columnFilterRules.value = data[0].filter || []
    columnSortRules.value = data[0].sorting || []
    columnGroupRules.value = data[0].grouping || []

    onViewChanged?.(data[0])
  }

  /**
   * Create a new view
   */
  async function createView(viewData: Partial<CaseViewRecord>): Promise<CaseViewRecord> {
    if (!tableId.value || !entityId.value) {
      throw new Error('tableId and entityId are required')
    }

    const now = new Date()
    const viewId = viewData.id || crypto.randomUUID()
    const viewName = viewData.viewName || `view_${viewId.replace(/-/g, '_')}`

    const newView: CaseViewRecord = {
      id: viewId,
      name: viewData.name || 'New View',
      description: viewData.description || null,
      viewName,
      viewType: viewData.viewType || 'table',
      viewSettings: viewData.viewSettings || null,
      filter: viewData.filter || null,
      sorting: viewData.sorting || null,
      grouping: viewData.grouping || null,
      tableId: tableId.value,
      isDefault: viewData.isDefault || false,
      entityId: entityId.value,
      fields: viewData.fields || [],
      createdBy: viewData.createdBy || null,
      createdAt: now,
      updatedBy: null,
      updatedAt: now
    }

    await query(
      `INSERT INTO case_views (
        id, name, description, "viewName", "viewType", "viewSettings", filter, sorting, grouping,
        "tableId", "isDefault", "entityId", fields, "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        newView.id,
        newView.name,
        newView.description,
        newView.viewName,
        newView.viewType,
        JSON.stringify(newView.viewSettings),
        JSON.stringify(newView.filter),
        JSON.stringify(newView.sorting),
        JSON.stringify(newView.grouping),
        newView.tableId,
        newView.isDefault,
        newView.entityId,
        newView.fields,
        newView.createdBy,
        newView.createdAt,
        newView.updatedAt
      ]
    )

    views.value.push(newView)
    return newView
  }

  /**
   * Update an existing view
   */
  async function updateView(viewId: string, updates: Partial<CaseViewRecord>): Promise<void> {
    const now = new Date()

    const updateKeys = Object.keys(updates).filter((k) => k !== 'id')
    if (updateKeys.length === 0) return

    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const key of updateKeys) {
      setClauses.push(`"${key}" = $${paramIndex}`)

      const value = ['filter', 'sorting', 'grouping', 'viewSettings'].includes(key)
        ? JSON.stringify(updates[key as keyof CaseViewRecord])
        : updates[key as keyof CaseViewRecord]
      values.push(value)
      paramIndex++
    }

    setClauses.push(`"updatedAt" = $${paramIndex}`)
    values.push(now)
    paramIndex++

    values.push(viewId)

    const sql = `UPDATE case_views SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`
    await query(sql, values)

    // Update local state
    const index = views.value.findIndex((v) => v.id === viewId)
    if (index !== -1) {
      views.value[index] = { ...views.value[index], ...updates, updatedAt: now }
    }
    if (currentView.value?.id === viewId) {
      currentView.value = { ...currentView.value, ...updates, updatedAt: now }
    }
  }

  /**
   * Save filter, sort, and group rules to current view
   */
  async function saveViewFilterSortGroup(): Promise<void> {
    if (!currentView.value?.id) {
      throw new Error('View not found')
    }
    return updateView(currentView.value.id, {
      filter: columnFilterRules.value as ViewFilter[],
      sorting: columnSortRules.value as ViewSorting[],
      grouping: columnGroupRules.value as ViewGrouping[]
    })
    ElMessage.success('View has saved ')
  }

  /**
   * Delete a view
   */
  async function deleteView(viewId: string): Promise<void> {
    await query(`DELETE FROM case_views WHERE id = $1`, [viewId])
    views.value = views.value.filter((v) => v.id !== viewId)

    if (currentView.value?.id === viewId) {
      currentView.value = views.value.find((v) => v.isDefault) || views.value[0] || null
    }
  }

  // Provide context
  provide(ViewContextKey, {
    currentView,
    views,
    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    getViews,
    getViewById,
    getDefaultView,
    createView,
    updateView,
    deleteView,
    saveViewFilterSortGroup
  })

  return {
    currentView,
    views,
    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    getViews,
    getViewById,
    getDefaultView,
    createView,
    updateView,
    deleteView,
    saveViewFilterSortGroup
  }
}

/**
 * Use the view context from a parent component
 */
export function useViewContext(): ViewContext {
  const context = inject(ViewContextKey)
  if (!context) {
    throw new Error('ViewContext not found. Make sure useTableViews is called in a parent component.')
  }
  return context
}
