import type { 
  CaseFieldRecord, 
  CaseViewRecord, 
  CaseTableRecord,
  FieldDisplayStructure,
  ViewFilter,
  ViewSorting,
  ViewGrouping
} from '../utils/db/schema/newTableSchema'

// Import context keys from dp-mdTable so MdTable can inject them
import { 
  ColumnContextKey,
  TableDataContextKey,  
  type ColumnContext, 
  type ColumnConfig,
  type TableDataContext 
} from '#imports'


export interface ViewContext {
  currentView: Ref<CaseViewRecord | null>
  views: Ref<CaseViewRecord[]>
  getViews: () => Promise<CaseViewRecord[]>
  getViewById: (viewId: string) => Promise<CaseViewRecord | null>
  setCurrentView: (view: CaseViewRecord) => void
  createView: (view: Partial<CaseViewRecord>) => Promise<CaseViewRecord>
  updateView: (viewId: string, updates: Partial<CaseViewRecord>) => Promise<void>
  deleteView: (viewId: string) => Promise<void>
}

export const ViewContextKey: InjectionKey<ViewContext> = Symbol('ViewContext')

export const useTableView = () => {
  const { query, exec } = usePglite()

  // Region: IDs and State
  const tableId = ref<string>('')         // case_tables.id
  const physicalTableName = ref<string>('') // case_tables.table_name (actual PG table)
  const entityId = ref<string>('')        // case_type.id
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const tableData = ref<any[]>([])
  const queryParams = ref<any>({})

  // Region: Table Data Logic
  async function getTableData(): Promise<any[]> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }
    loading.value = true
    try {
      const data = await query(`SELECT * FROM "${physicalTableName.value}"`)
      tableData.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<void> {
    await getTableData()
  }

  async function addRow(row: any): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }
    
    const columnNames = Object.keys(row).filter(k => k !== 'id')
    const placeholders = columnNames.map((_, i) => `$${i + 1}`)
    const values = columnNames.map(k => row[k])
    
    const sql = `INSERT INTO "${physicalTableName.value}" (${columnNames.map(c => `"${c}"`).join(', ')}) 
                 VALUES (${placeholders.join(', ')}) RETURNING *`
    const data = await query(sql, values)
    tableData.value.push(data[0])
  }

  async function updateRow(row: any): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }
    if (!row.id) {
      throw new Error('row id is required')
    }
    
    const updateKeys = Object.keys(row).filter(k => k !== 'id')
    const setClauses = updateKeys.map((k, i) => `"${k}" = $${i + 1}`)
    const values = [...updateKeys.map(k => row[k]), row.id]
    
    const sql = `UPDATE "${physicalTableName.value}" SET ${setClauses.join(', ')}, "updatedAt" = NOW() 
                 WHERE id = $${values.length} RETURNING *`
    const data = await query(sql, values)
    
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value[index] = data[0]
    }
  }

  async function deleteRow(id: string): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }
    if (!id) {
      throw new Error('row id is required')
    }
    await query(`DELETE FROM "${physicalTableName.value}" WHERE id = $1`, [id])
    tableData.value = tableData.value.filter(item => item.id !== id)
  }

  // Provide TableDataContext using dp-mdTable's key so MdTable can inject it
  // Adapt signatures to match dp-mdTable's expected interface
  provide(TableDataContextKey, {
    tableData,
    loading,
    error,
    queryParams,
    getTableData: async (params?: any) => {
      return await getTableData()
    },
    refresh,
    addRow: (row: any) => {
      addRow(row) // Fire and forget for sync interface
    },
    updateRow: (index: number, row: any) => {
      // dp-mdTable uses index-based update, but we use row.id
      const existingRow = tableData.value[index]
      if (existingRow) {
        updateRow({ ...row, id: existingRow.id })
      }
    },
    deleteRow: (index: number) => {
      // dp-mdTable uses index-based delete, but we use id
      const existingRow = tableData.value[index]
      if (existingRow?.id) {
        deleteRow(existingRow.id)
      }
    },
  } as TableDataContext)

  // Region: Field Logic
  const fields = ref<CaseFieldRecord[]>([])

  function getField(fieldName: string): CaseFieldRecord | undefined {
    return fields.value.find(item => item.fieldName === fieldName)
  }

  async function getAllFields(): Promise<CaseFieldRecord[]> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    const data = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1`,
      [tableId.value]
    )
    fields.value = data
    return data
  }

  async function addField(field: Partial<CaseFieldRecord>): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!field.fieldName || !field.fieldNameAlias) {
      throw new Error('fieldName and fieldNameAlias are required')
    }

    const now = new Date()
    const newField: Partial<CaseFieldRecord> = {
      ...field,
      id: field.id || crypto.randomUUID(),
      tableId: tableId.value,
      createdAt: now,
      updatedAt: now
    }

    await query(
      `INSERT INTO case_fields (
        id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
        "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
        "defaultValue", "fieldLength", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        newField.id,
        newField.tableId,
        newField.fieldName,
        newField.fieldNameAlias,
        newField.businessType || 'text',
        newField.fieldType || 'text',
        JSON.stringify(newField.displayStructure || null),
        newField.isRequired || false,
        newField.isHidden || false,
        newField.isArray || false,
        newField.isUnique || false,
        newField.defaultValue || null,
        newField.fieldLength || 0,
        newField.createdAt,
        newField.updatedAt
      ]
    )
    
    fields.value.push(newField as CaseFieldRecord)
  }

  async function updateField(fieldName: string, updates: Partial<CaseFieldRecord>): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!fieldName) {
      throw new Error('fieldName is required')
    }
    
    const field = getField(fieldName)
    if (!field?.id) {
      throw new Error('field not found')
    }
    
    const updateKeys = Object.keys(updates).filter(key => key !== 'id')
    if (updateKeys.length === 0) {
      return
    }
    
    // Column names now use camelCase in database
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    for (const key of updateKeys) {
      setClauses.push(`"${key}" = $${paramIndex}`)
      
      const value = (key === 'displayStructure') 
        ? JSON.stringify(updates[key as keyof CaseFieldRecord]) 
        : updates[key as keyof CaseFieldRecord]
      values.push(value)
      paramIndex++
    }
    
    // Always update updatedAt
    setClauses.push(`"updatedAt" = $${paramIndex}`)
    values.push(new Date().toISOString())
    paramIndex++
    
    // Add the WHERE clause parameter
    values.push(field.id)
    
    const sql = `UPDATE case_fields SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`
    await query(sql, values)
    
    // Update local state
    const index = fields.value.findIndex(f => f.fieldName === fieldName)
    if (index !== -1) {
      fields.value[index] = { ...fields.value[index], ...updates }
    }
  }

  async function deleteField(fieldName: string): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!fieldName) {
      throw new Error('fieldName is required')
    }
    await query(
      'DELETE FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2',
      [tableId.value, fieldName]
    )
    fields.value = fields.value.filter(item => item.fieldName !== fieldName)
  }

  // Region: Column mapping - convert CaseFieldRecord to ColumnConfig for dp-mdTable
  const columns = computed<ColumnConfig[]>(() => {
    return fields.value.map(field => fieldToColumnConfig(field))
  })

  const columnGroupRules = ref<any[]>([])

  /**
   * Convert CaseFieldRecord to ColumnConfig for dp-mdTable compatibility
   */
  function fieldToColumnConfig(field: CaseFieldRecord): ColumnConfig {
    return {
      id: field.id,
      dataTableId: field.tableId ?? undefined, // Convert null to undefined
      field: field.fieldName,
      title: field.fieldNameAlias,
      type: field.displayStructure?.type as any, // ColumnFieldType from displayStructure
      properties: field.displayStructure?.properties as Record<string, any> | undefined,
    }
  }

  /**
   * Convert ColumnConfig back to CaseFieldRecord for storage
   */
  function columnConfigToField(column: ColumnConfig): Partial<CaseFieldRecord> {
    return {
      id: column.id,
      tableId: column.dataTableId ?? null, // Convert undefined to null
      fieldName: column.field,
      fieldNameAlias: column.title,
      displayStructure: {
        type: column.type,
        properties: column.properties || {},
      } as unknown as FieldDisplayStructure,
    }
  }

  function getColumn(fieldName: string): ColumnConfig | undefined {
    const field = getField(fieldName)
    return field ? fieldToColumnConfig(field) : undefined
  }

  async function getAllColumns(): Promise<ColumnConfig[]> {
    const fieldRecords = await getAllFields()
    return fieldRecords.map(field => fieldToColumnConfig(field))
  }

  async function addColumn(column: ColumnConfig): Promise<void> {
    await addField(columnConfigToField(column))
  }

  async function deleteColumn(fieldName: string): Promise<void> {
    await deleteField(fieldName)
  }

  async function updateColumn(fieldName: string, updates: Partial<ColumnConfig>): Promise<void> {
    const fieldUpdates = columnConfigToField(updates as ColumnConfig)
    await updateField(fieldName, fieldUpdates)
  }

  // Provide ColumnContext using dp-mdTable's key so MdTable can inject it
  provide(ColumnContextKey, {
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    columns,
    columnGroupRules,
  } as ColumnContext)

  // Region: View Logic
  const currentView = ref<CaseViewRecord | null>(null)
  const views = ref<CaseViewRecord[]>([])

  async function getViews(): Promise<CaseViewRecord[]> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    const data = await query<CaseViewRecord>(
      `SELECT * FROM case_views WHERE "tableId" = $1 ORDER BY "isDefault" DESC, name ASC`,
      [tableId.value]
    )
    views.value = data
    
    // Set current view to default if not set
    if (!currentView.value && data.length > 0) {
      currentView.value = data.find(v => v.isDefault) || data[0]
    }
    
    return data
  }

  async function getViewById(viewId: string): Promise<CaseViewRecord | null> {
    const data = await query<CaseViewRecord>(
      `SELECT * FROM case_views WHERE id = $1`,
      [viewId]
    )
    return data[0] || null
  }

  function setCurrentView(view: CaseViewRecord): void {
    currentView.value = view
  }

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
        id, name, description, "viewName", filter, sorting, grouping,
        "tableId", "isDefault", "entityId", fields, "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        newView.id,
        newView.name,
        newView.description,
        newView.viewName,
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

  async function updateView(viewId: string, updates: Partial<CaseViewRecord>): Promise<void> {
    const now = new Date()
    
    const updateKeys = Object.keys(updates).filter(k => k !== 'id')
    if (updateKeys.length === 0) return
    
    // Column names now use camelCase in database
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    for (const key of updateKeys) {
      setClauses.push(`"${key}" = $${paramIndex}`)
      
      const value = ['filter', 'sorting', 'grouping'].includes(key)
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
    const index = views.value.findIndex(v => v.id === viewId)
    if (index !== -1) {
      views.value[index] = { ...views.value[index], ...updates, updatedAt: now }
    }
    if (currentView.value?.id === viewId) {
      currentView.value = { ...currentView.value, ...updates, updatedAt: now }
    }
  }

  async function deleteView(viewId: string): Promise<void> {
    await query(`DELETE FROM case_views WHERE id = $1`, [viewId])
    views.value = views.value.filter(v => v.id !== viewId)
    
    if (currentView.value?.id === viewId) {
      currentView.value = views.value.find(v => v.isDefault) || views.value[0] || null
    }
  }

  provide(ViewContextKey, {
    currentView,
    views,
    getViews,
    getViewById,
    setCurrentView,
    createView,
    updateView,
    deleteView,
  })

  /**
   * Initialize table view with IDs
   */
  async function initializeTableView(
    caseTableId: string,
    caseEntityId: string
  ): Promise<{ table: CaseTableRecord; fields: CaseFieldRecord[]; views: CaseViewRecord[] }> {
    tableId.value = caseTableId
    entityId.value = caseEntityId
    
    // Get table info
    const tableData = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [caseTableId]
    )
    
    if (tableData.length === 0) {
      throw new Error('Table not found')
    }
    
    const table = tableData[0]
    physicalTableName.value = table.tableName
    
    // Get fields and views
    const [fieldsData, viewsData] = await Promise.all([
      getAllFields(),
      getViews()
    ])
    
    return { table, fields: fieldsData, views: viewsData }
  }


  return {
    // IDs
    tableId,
    physicalTableName,
    entityId,
    
    // Table Data
    loading,
    error,
    tableData,
    queryParams,
    getTableData,
    refresh,
    addRow,
    updateRow,
    deleteRow,
    
    // Fields (CaseFieldRecord)
    fields,
    getField,
    getAllFields,
    addField,
    updateField,
    deleteField,
    
    // Columns (ColumnConfig - for dp-mdTable compatibility)
    columns,
    columnGroupRules,
    getColumn,
    getAllColumns,
    addColumn,
    updateColumn,
    deleteColumn,
    
    // Views
    currentView,
    views,
    getViews,
    getViewById,
    setCurrentView,
    createView,
    updateView,
    deleteView,
    
    // Initialize
    initializeTableView,
  }
}
