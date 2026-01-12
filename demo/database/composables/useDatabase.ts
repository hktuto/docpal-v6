import type { Database, Table, Row, View, Column, Dashboard, FilterCondition, SortConfig, TableQueryParams, MockUser, NavItem, NavItemType } from '../types/database'
import crmData from '../data/crm-database-new2.json'
import usersData from '../data/sales-users-new.json'
import groupsRolesData from '../data/groups-roles.json'
import { calculateRollup } from '../utils/rollupCalculator'

// Types for groups and roles
export interface Group {
  id: string
  name: string
  description?: string
  memberCount?: number
}

export interface Role {
  id: string
  name: string
  description?: string
}

// Reactive state for databases
const databases = ref<Database[]>([])
const users = ref<MockUser[]>([])
const groups = ref<Group[]>([])
const roles = ref<Role[]>([])
const isLoaded = ref(false)

// Initialize data
function initializeData() {
  if (isLoaded.value) return
  
  databases.value = JSON.parse(JSON.stringify(crmData.databases)) as Database[]
  users.value = JSON.parse(JSON.stringify(usersData.users)) as MockUser[]
  groups.value = JSON.parse(JSON.stringify(groupsRolesData.groups)) as Group[]
  roles.value = JSON.parse(JSON.stringify(groupsRolesData.roles)) as Role[]
  isLoaded.value = true
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function useDatabase() {
  // Initialize on first use
  initializeData()

  function resetData() {
    databases.value = JSON.parse(JSON.stringify(crmData.databases)) as Database[]
    users.value = JSON.parse(JSON.stringify(usersData.users)) as MockUser[]
    groups.value = JSON.parse(JSON.stringify(groupsRolesData.groups)) as Group[]
    roles.value = JSON.parse(JSON.stringify(groupsRolesData.roles)) as Role[]
    console.log('resetData')
    console.log(databases.value[0].navigation)
  }
  // Get all databases
  function getDatabases(): Database[] {
    return databases.value
  }

  // Get database by ID
  function getDatabaseById(id: string): Database | undefined {
    return databases.value.find(db => db.id === id)
  }

  // Create new database
  function createDatabase(data: Partial<Database>): Database {
    const now = new Date().toISOString()
    const newDb: Database = {
      id: generateId('db'),
      name: data.name || 'New Database',
      description: data.description || '',
      icon: data.icon || 'database',
      color: data.color || '#3b82f6',
      tables: [],
      dashboards: [],
      createdAt: now,
      updatedAt: now,
      ...data
    }
    databases.value.push(newDb)
    return newDb
  }

  // Update database
  function updateDatabase(id: string, data: Partial<Database>): Database | undefined {
    const index = databases.value.findIndex(db => db.id === id)
    if (index === -1) return undefined
    
    databases.value[index] = {
      ...databases.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return databases.value[index]
  }

  // Delete database
  function deleteDatabase(id: string): boolean {
    const index = databases.value.findIndex(db => db.id === id)
    if (index === -1) return false
    
    databases.value.splice(index, 1)
    return true
  }

  // Get all users
  function getUsers(): MockUser[] {
    return users.value
  }

  // Get user by ID
  function getUserById(id: string): MockUser | undefined {
    return users.value.find(u => u.id === id)
  }

  // Get all groups
  function getGroups(): Group[] {
    return groups.value
  }

  // Get group by ID
  function getGroupById(id: string): Group | undefined {
    return groups.value.find(g => g.id === id)
  }

  // Get all roles
  function getRoles(): Role[] {
    return roles.value
  }

  // Get role by ID
  function getRoleById(id: string): Role | undefined {
    return roles.value.find(r => r.id === id)
  }

  // Create new table in a database
  function createTable(databaseId: string, data: Partial<Table>): Table | undefined {
    const db = getDatabaseById(databaseId)
    if (!db) return undefined
    
    const now = new Date().toISOString()
    const newTable: Table = {
      id: generateId('tbl'),
      name: data.name || 'New Table',
      description: data.description || '',
      icon: data.icon || 'database',
      columns: data.columns || [
        // Default with a Name column
        {
          id: generateId('col'),
          field: 'name',
          title: 'Name',
          type: 'text',
          width: 200,
          required: true
        }
      ],
      rows: [],
      views: data.views || [
        // Default with a Table view
        {
          id: generateId('view'),
          name: 'All Records',
          type: 'table',
          isDefault: true,
          config: {}
        }
      ],
      titleField: 'name',
      createdAt: now,
      updatedAt: now,
      ...data
    }
    
    db.tables.push(newTable)
    db.updatedAt = now
    
    return newTable
  }

  // Update table
  function updateTable(databaseId: string, tableId: string, data: Partial<Table>): Table | undefined {
    const db = getDatabaseById(databaseId)
    if (!db) return undefined
    
    const index = db.tables.findIndex(t => t.id === tableId)
    if (index === -1) return undefined
    
    db.tables[index] = {
      ...db.tables[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    db.updatedAt = new Date().toISOString()
    
    return db.tables[index]
  }

  // Delete table
  function deleteTable(databaseId: string, tableId: string): boolean {
    const db = getDatabaseById(databaseId)
    if (!db) return false
    
    const index = db.tables.findIndex(t => t.id === tableId)
    if (index === -1) return false
    
    db.tables.splice(index, 1)
    db.updatedAt = new Date().toISOString()
    
    return true
  }

  // Get dashboards for a database
  function getDashboards(databaseId: string): Dashboard[] {
    const db = getDatabaseById(databaseId)
    return db?.dashboards || []
  }

  // Get dashboard by ID
  function getDashboardById(databaseId: string, dashboardId: string): Dashboard | undefined {
    const db = getDatabaseById(databaseId)
    return db?.dashboards.find(d => d.id === dashboardId)
  }

  // Create a new dashboard
  function createDashboard(databaseId: string, data: Partial<Dashboard>): Dashboard | undefined {
    const db = databases.value.find(d => d.id === databaseId)
    if (!db) return undefined
    
    const newDashboard: Dashboard = {
      id: generateId('dash'),
      name: data.name || 'New Dashboard',
      icon: data.icon || 'data-analysis',
      scope: data.scope || 'database',
      tableId: data.tableId,
      widgets: data.widgets || []
    }
    
    db.dashboards.push(newDashboard)
    db.updatedAt = new Date().toISOString()
    
    return newDashboard
  }

  // Update database navigation
  function updateNavigation(databaseId: string, navigation: NavItem[]): boolean {
    const db = databases.value.find(d => d.id === databaseId)
    if (!db) return false
    
    db.navigation = navigation
    db.updatedAt = new Date().toISOString()
    return true
  }

  // Add navigation item to a parent (null = root level)
  function addNavigationItem(
    databaseId: string,
    parentId: string | null,
    itemType: NavItemType,
    data?: Partial<NavItem>
  ): NavItem | null {
    const db = databases.value.find(d => d.id === databaseId)
    if (!db) return null
    
    // Initialize navigation if doesn't exist
    if (!db.navigation) {
      db.navigation = []
    }
    
    const newItem: NavItem = {
      id: generateId('nav'),
      type: itemType,
      label: data?.label || `New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      icon: data?.icon,
      targetId: data?.targetId,
      targetTableId: data?.targetTableId,
      children: itemType === 'folder' ? [] : undefined,
      isExpanded: itemType === 'folder' ? true : undefined,
      ...data
    }
    
    if (parentId === null) {
      // Add to root
      db.navigation.push(newItem)
    } else {
      // Find parent and add to its children
      const added = addToParent(db.navigation, parentId, newItem)
      if (!added) return null
    }
    
    db.updatedAt = new Date().toISOString()
    return newItem
  }

  // Helper to add item to parent's children
  function addToParent(items: NavItem[], parentId: string, newItem: NavItem): boolean {
    for (const item of items) {
      if (item.id === parentId && item.type === 'folder') {
        if (!item.children) item.children = []
        item.children.push(newItem)
        return true
      }
      if (item.type === 'folder' && item.children) {
        if (addToParent(item.children, parentId, newItem)) {
          return true
        }
      }
    }
    return false
  }

  // Remove navigation item
  function removeNavigationItem(databaseId: string, itemId: string): boolean {
    const db = databases.value.find(d => d.id === databaseId)
    if (!db || !db.navigation) return false
    
    const removed = removeFromTree(db.navigation, itemId)
    if (removed) {
      db.updatedAt = new Date().toISOString()
    }
    return removed
  }

  // Helper to remove item from tree
  function removeFromTree(items: NavItem[], itemId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        items.splice(i, 1)
        return true
      }
      if (items[i].type === 'folder' && items[i].children) {
        if (removeFromTree(items[i].children!, itemId)) {
          return true
        }
      }
    }
    return false
  }

  // Update navigation item
  function updateNavigationItem(databaseId: string, itemId: string, data: Partial<NavItem>): NavItem | null {
    const db = databases.value.find(d => d.id === databaseId)
    if (!db || !db.navigation) return null
    
    const item = findInTree(db.navigation, itemId)
    if (!item) return null
    
    Object.assign(item, data)
    db.updatedAt = new Date().toISOString()
    return item
  }

  // Helper to find item in tree
  function findInTree(items: NavItem[], itemId: string): NavItem | null {
    for (const item of items) {
      if (item.id === itemId) return item
      if (item.type === 'folder' && item.children) {
        const found = findInTree(item.children, itemId)
        if (found) return found
      }
    }
    return null
  }

  function findParent(items: NavItem[], itemId: string): NavItem | null {
    for (const item of items) {
      if(item.children?.find(child => child.targetId === itemId)) return item
      if(item.type === 'folder' && item.children) {
        const found = findParent(item.children, itemId)
        if (found) return found
      }
    }
    return null
  }

  // Export database to JSON (for saving changes)
  function exportDatabaseToJSON(databaseId: string): string {
    const db = getDatabaseById(databaseId)
    if (!db) return ''
    
    const exportData = {
      databases: [db]
    }
    return JSON.stringify(exportData, null, 2)
  }

  // Export all databases to JSON
  function exportAllDatabasesToJSON(): string {
    const exportData = {
      databases: databases.value
    }
    return JSON.stringify(exportData, null, 2)
  }

  // Export users to JSON
  function exportUsersToJSON(): string {
    const exportData = {
      users: users.value
    }
    return JSON.stringify(exportData, null, 2)
  }

  // Download JSON file helper
  function downloadJSON(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export and download database
  function exportAndDownloadDatabase(databaseId: string, filename?: string): void {
    const json = exportDatabaseToJSON(databaseId)
    if (json) {
      const db = getDatabaseById(databaseId)
      const name = filename || `${db?.name?.toLowerCase().replace(/\s+/g, '-') || 'database'}-export.json`
      downloadJSON(json, name)
    }
  }

  // Export and download all data (databases + users)
  function exportAndDownloadAllData(): void {
    // Export databases
    downloadJSON(exportAllDatabasesToJSON(), 'crm-database.json')
    
    // Export users
    downloadJSON(exportUsersToJSON(), 'sales-users.json')
  }

  return {
    databases: computed(() => databases.value),
    users: computed(() => users.value),
    groups: computed(() => groups.value),
    roles: computed(() => roles.value),
    findParent,
    getDatabases,
    getDatabaseById,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    getUsers,
    getUserById,
    getGroups,
    getGroupById,
    getRoles,
    getRoleById,
    createTable,
    updateTable,
    deleteTable,
    getDashboards,
    getDashboardById,
    createDashboard,
    // Navigation
    updateNavigation,
    addNavigationItem,
    removeNavigationItem,
    updateNavigationItem,
    // Export functions
    exportDatabaseToJSON,
    exportAllDatabasesToJSON,
    exportUsersToJSON,
    downloadJSON,
    exportAndDownloadDatabase,
    exportAndDownloadAllData,
    resetData
  }
}

export function useTable(databaseId: string, tableId: string) {
  initializeData()

  // Get the database and table
  const database = computed(() => databases.value.find(db => db.id === databaseId))
  const table = computed(() => database.value?.tables.find(t => t.id === tableId))

  // Get table by ID (for relations)
  function getTableById(tblId: string): Table | undefined {
    for (const db of databases.value) {
      const tbl = db.tables.find(t => t.id === tblId)
      if (tbl) return tbl
    }
    return undefined
  }

  // Get view by ID
  function getViewById(viewId: string): View | undefined {
    return table.value?.views.find(v => v.id === viewId)
  }

  // Get default view
  function getDefaultView(): View | undefined {
    return table.value?.views.find(v => v.isDefault) || table.value?.views[0]
  }

  // Get row by ID from any table
  function getRowById(tblId: string, rowId: string): Row | undefined {
    const tbl = getTableById(tblId)
    return tbl?.rows.find(r => r.id === rowId)
  }

  // Get multiple rows by IDs
  function getRowsByIds(tblId: string, rowIds: string[]): Row[] {
    const tbl = getTableById(tblId)
    if (!tbl) return []
    return tbl.rows.filter(r => rowIds.includes(r.id))
  }

  // Apply filters to rows
  function applyFilters(rows: Row[], filters: FilterCondition[]): Row[] {
    return rows.filter(row => {
      return filters.every(filter => {
        const value = row[filter.field]
        console.log('value', value, filter)
        switch (filter.operator) {
          case 'equals':
            return value === filter.value
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'gt':
            return Number(value) > Number(filter.value)
          case 'lt':
            return Number(value) < Number(filter.value)
          case 'gte':
            return Number(value) >= Number(filter.value)
          case 'lte':
            return Number(value) <= Number(filter.value)
          case 'in':
            if(Array.isArray(value)) {
              return value.some(v => filter.value.includes(v))
            }else{
              return Array.isArray(filter.value) && filter.value.includes(value)
            }
          case 'notIn':
            return Array.isArray(filter.value) && !filter.value.includes(value)
          case 'isEmpty':
            return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
          case 'isNotEmpty':
            return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)
          default:
            return true
        }
      })
    })
  }

  // Apply sorting to rows
  function applySort(rows: Row[], sort: SortConfig[]): Row[] {
    if (!sort || sort.length === 0) return rows
    
    return [...rows].sort((a, b) => {
      for (const s of sort) {
        const aVal = a[s.field]
        const bVal = b[s.field]
        
        let comparison = 0
        if (aVal < bVal) comparison = -1
        else if (aVal > bVal) comparison = 1
        
        if (comparison !== 0) {
          return s.order === 'desc' ? -comparison : comparison
        }
      }
      return 0
    })
  }

  // Query table rows with filters, sorting, and pagination
  function queryRows(params: TableQueryParams = {}): Row[] {
    if (!table.value) return []
    
    let result = [...table.value.rows]
    
    // Apply search
    if (params.search ) {
      const searchLower = params.search.toLowerCase()
      const keywords = searchLower.split(' ')
      result = result.filter(row => {
        return keywords.every(keyword => {
          return Object.values(row).some(val => 
            String(val).toLowerCase().includes(keyword.trim())
          )
        })
      })
    }
    
    // Apply filters
    if (params.filters && params.filters.length > 0) {
      result = applyFilters(result, params.filters)
    }
    
    // Apply sorting
    if (params.sort && params.sort.length > 0) {
      result = applySort(result, params.sort)
    }
    
    return result
  }

  // Get all rows
  function getRows(): Row[] {
    return table.value?.rows || []
  }

  // Create row
  function createRow(data: Partial<Row>): Row | undefined {
    if (!table.value) return undefined
    
    const now = new Date().toISOString()
    const newRow: Row = {
      id: generateId('row'),
      createdAt: now,
      updatedAt: now,
      ...data
    }
    table.value.rows.push(newRow)
    return newRow
  }

  // Update row
  function updateRow(rowId: string, data: Partial<Row>): Row | undefined {
    if (!table.value) return undefined
    
    const index = table.value.rows.findIndex(r => r.id === rowId)
    if (index === -1) return undefined
    
    table.value.rows[index] = {
      ...table.value.rows[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return table.value.rows[index]
  }

  // Delete row
  function deleteRow(rowId: string): boolean {
    if (!table.value) return false
    
    const index = table.value.rows.findIndex(r => r.id === rowId)
    if (index === -1) return false
    
    table.value.rows.splice(index, 1)
    return true
  }

  // Resolve relation display value
  function resolveRelation(tableId: string, rowId: string | string[], displayField: string): string | string[] {
    if (Array.isArray(rowId)) {
      return rowId.map(id => {
        const row = getRowById(tableId, id)
        return row ? String(row[displayField] || '') : ''
      }).filter(Boolean)
    }
    
    const row = getRowById(tableId, rowId)
    return row ? String(row[displayField] || '') : ''
  }

  // Get user display info
  function resolveUser(userId: string): MockUser | undefined {
    return users.value.find(u => u.id === userId)
  }

  // Get related rows for a record (for record-level dashboards)
  function getRelatedRows(recordId: string, relationField: string): Row[] {
    if (!table.value) return []
    
    const record = table.value.rows.find(r => r.id === recordId)
    if (!record) return []
    
    const column = table.value.columns.find(c => c.field === relationField)
    if (!column || column.type !== 'relation' || !column.relationConfig) return []
    
    const relatedIds = record[relationField]
    if (!relatedIds) return []
    
    const relatedTable = getTableById(column.relationConfig.tableId)
    if (!relatedTable) return []
    
    if (Array.isArray(relatedIds)) {
      return relatedTable.rows.filter(r => relatedIds.includes(r.id))
    }
    
    const row = relatedTable.rows.find(r => r.id === relatedIds)
    return row ? [row] : []
  }

  // Calculate rollup value for a column and record
  function calculateRollupValue(column: Column, row: Row): number | string | null {
    if (!column.rollupConfig || !table.value) return null

    const { relationField, aggregateField, aggregation } = column.rollupConfig

    // Find the relation column
    const relationColumn = table.value.columns.find(c => c.field === relationField || c.id === relationField)
    if (!relationColumn || relationColumn.type !== 'relation' || !relationColumn.relationConfig) {
      return null
    }

    // Get related record IDs
    const relatedIds = row[relationColumn.field]
    if (!relatedIds) return aggregation === 'count' || aggregation === 'count-unique' ? 0 : null

    // Get related table
    const relatedTable = getTableById(relationColumn.relationConfig.tableId)
    if (!relatedTable) return null

    // Get related rows
    let relatedRows: Row[] = []
    if (Array.isArray(relatedIds)) {
      relatedRows = relatedTable.rows.filter(r => relatedIds.includes(r.id))
    } else {
      const relatedRow = relatedTable.rows.find(r => r.id === relatedIds)
      if (relatedRow) relatedRows = [relatedRow]
    }

    // Calculate the rollup
    return calculateRollup(relatedRows, aggregateField, aggregation)
  }

  // Create a new view for the table
  function createView(data: Partial<View>): View | undefined {
    if (!table.value) return undefined
    
    const newView: View = {
      id: generateId('view'),
      name: data.name || 'New View',
      type: data.type || 'table',
      isDefault: false,
      config: data.config || {},
      ...data
    }
    table.value.views.push(newView)
    return newView
  }

  // Update a view
  function updateView(viewId: string, data: Partial<View>): View | undefined {
    if (!table.value) return undefined
    
    const index = table.value.views.findIndex(v => v.id === viewId)
    if (index === -1) return undefined
    
    table.value.views[index] = {
      ...table.value.views[index],
      ...data
    }
    return table.value.views[index]
  }

  // Delete a view
  function deleteView(viewId: string): boolean {
    if (!table.value) return false
    
    // Don't delete if it's the only view
    if (table.value.views.length <= 1) return false
    
    const index = table.value.views.findIndex(v => v.id === viewId)
    if (index === -1) return false
    
    table.value.views.splice(index, 1)
    return true
  }

  // Create a new column
  function createColumn(data: Partial<Column>): Column | undefined {
    if (!table.value) return undefined
    
    const newColumn: Column = {
      id: generateId('col'),
      field: data.field || `field_${Date.now()}`,
      title: data.title || 'New Column',
      type: data.type || 'text',
      width: data.width || 150,
      ...data
    }
    table.value.columns.push(newColumn)
    return newColumn
  }

  // Update a column
  function updateColumn(columnId: string, data: Partial<Column>): Column | undefined {
    if (!table.value) return undefined
    
    const index = table.value.columns.findIndex(c => c.id === columnId)
    if (index === -1) return undefined
    
    table.value.columns[index] = {
      ...table.value.columns[index],
      ...data
    }
    return table.value.columns[index]
  }

  // Delete a column
  function deleteColumn(columnId: string): boolean {
    if (!table.value) return false
    
    // Don't delete if it's the only column
    if (table.value.columns.length <= 1) return false
    
    const index = table.value.columns.findIndex(c => c.id === columnId)
    if (index === -1) return false
    
    // Also remove the field from all rows
    const column = table.value.columns[index]
    for (const row of table.value.rows) {
      delete row[column.field]
    }
    
    table.value.columns.splice(index, 1)
    return true
  }

  // Reorder columns
  function reorderColumns(columnIds: string[]): boolean {
    if (!table.value) return false
    
    const reordered: Column[] = []
    for (const id of columnIds) {
      const col = table.value.columns.find(c => c.id === id)
      if (col) reordered.push(col)
    }
    
    if (reordered.length === table.value.columns.length) {
      table.value.columns = reordered
      return true
    }
    return false
  }

  return {
    database,
    table,
    getTableById,
    getViewById,
    getDefaultView,
    getRowById,
    getRowsByIds,
    queryRows,
    getRows,
    createRow,
    updateRow,
    deleteRow,
    resolveRelation,
    resolveUser,
    getRelatedRows,
    calculateRollupValue,
    createView,
    updateView,
    deleteView,
    // Column CRUD
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
  }
}
