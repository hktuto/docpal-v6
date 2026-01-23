import type {
  CaseFieldRecord,
  CaseViewRecord,
  CaseTableRecord,
  FieldDisplayStructure,
  ViewFilter,
  ViewSorting,
  ViewGrouping,
  ViewType,
  ViewSettings
} from '../utils/db/schema/newTableSchema'

// Import context keys from dp-mdTable so MdTable can inject them
import { ColumnContextKey, TableDataContextKey, type ColumnContext, type ColumnConfig, type TableDataContext } from '#imports'
import { ElMessage } from 'element-plus'
import { buildGroupByQuery, buildSelectQuery, type FilterRule, type SortRule } from './useQueryBuilder'

export interface ViewContext {
  currentView: Ref<CaseViewRecord | null>
  views: Ref<CaseViewRecord[]>
  getViews: () => Promise<CaseViewRecord[]>
  getViewById: (viewId: string) => Promise<void>
  createView: (view: Partial<CaseViewRecord>) => Promise<CaseViewRecord>
  updateView: (viewId: string, updates: Partial<CaseViewRecord>) => Promise<void>
  deleteView: (viewId: string) => Promise<void>
}

export const ViewContextKey: InjectionKey<ViewContext> = Symbol('ViewContext')

export const useTableView = () => {
  const { query, exec } = usePglite()

  /**
   * Ensure arrays are plain JavaScript arrays for PGlite compatibility
   * PGlite uses Web Workers which can't clone Proxy objects or other non-cloneable types
   */
  const ensurePlainArray = <T>(arr: T[] | readonly T[]): T[] => {
    return Array.isArray(arr) ? [...arr] : (arr as T[])
  }

  // Region: IDs and State
  const tableId = ref<string>('') // case_tables.id
  const physicalTableName = ref<string>('') // case_tables.table_name (actual PG table)
  const entityId = ref<string>('') // case_type.id
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const tableData = ref<any[]>([])
  const queryParams = ref<any>({})

  async function getAggChildData(params: any = {}): Promise<any[]> {
    // Check if there's a next aggregate at current groupListIndex
    if (!columnGroupRules.value || columnGroupRules.value.length === 0 || groupListIndex.value >= columnGroupRules.value.length) {
      // No more aggregates to process - return actual row data filtered by __filter_data
      const filterData: Record<string, any> = params.row?.__filter_data || {}

      const data = await queryTableData(filterData)
      return data
    }

    // Get the next aggregate rule based on groupListIndex
    const nextAggregate = columnGroupRules.value[groupListIndex.value]

    // Call getGroupApi with the single aggregate rule
    // Note: getGroupApi will increment groupListIndex
    return await getGroupApi(params, nextAggregate)
  }
  // state to keep check of which grouo index is the current group
  const groupListIndex = ref<number>(0)
  async function getGroupApi(params: any = {}, aggregate: { id: string; field: string; order: string }): Promise<any[]> {
    // there maybe a row in params, if so that mean this is not the first aggregate
    const latestGroupFilter: Record<string, any> = params.row?.__filter_data || {}
    // Get group data from db
    // aggregate example: [{
    //   "id": "rule-1769081510151-0.08880262531953598",
    //   "field": "company_name",
    //   "order": "asc"
    // }]
    // Response format: [{ title: "Company Name", firstColumnField: "key1", count: 10, isAggregate: true, __filter_data: {...} }, ...]

    if (!physicalTableName.value || !currentView.value) {
      throw new Error('physicalTableName and currentView are required')
    }

    if (!aggregate) {
      groupListIndex.value++
      return []
    }

    // Get the first grouping rule (support single group for now)
    const groupRule = aggregate
    const groupField = groupRule.field
    const sortOrder = groupRule.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    if (!groupField) {
      groupListIndex.value++
      return []
    }

    // Get the first column's field name (grouped value is always displayed in col 0)
    const firstColumnField = currentView.value.fields[0]
    if (!firstColumnField) {
      groupListIndex.value++
      return []
    }

    // Get the group field's title from fields
    const groupFieldRecord = getField(groupField)
    const groupTitle = groupFieldRecord?.fieldNameAlias || groupField

    // Build the GROUP BY query using helper
    const { sql, queryValues } = buildGroupByQuery(
      physicalTableName.value,
      groupField,
      sortOrder as 'ASC' | 'DESC',
      latestGroupFilter,
      columnFilterRules.value as FilterRule[]
    )

    const rawData = await query<{ [key: string]: any; count: number }>(sql, queryValues)

    // Map the result with title first, then first column key with value, then isAggregate
    // Add __filter_data with accumulated filters including current group field and value
    const data = rawData.map((row) => ({
      title: groupTitle,
      [firstColumnField]: row[groupField],
      __count: row.count,
      isAggregate: true,
      __filter_data: {
        ...latestGroupFilter,
        [groupField]: row[groupField]
      }
    }))
    groupListIndex.value++
    return data
  }

  // Region: Table Data Logic

  /**
   * Reusable function to query table data with optional filter
   * @param filter - Record of field names and values to filter by (e.g., from __filter_data)
   * @returns Queried data with relation display fields resolved
   */
  async function queryTableData(filter: Record<string, any> = {}): Promise<any[]> {
    if (!physicalTableName.value || !currentView.value) {
      throw new Error('physicalTableName and currentView are required')
    }

    // Build SELECT query using helper (with filter and sort)
    const { sql, queryValues } = buildSelectQuery(physicalTableName.value, filter, columnFilterRules.value as FilterRule[], columnSortRules.value as SortRule[])

    const data = await query(sql, queryValues)

    // Parse view fields to find relation fields with display fields
    // Format: relationFieldName.displayFieldName
    const relationDisplayFields = new Map<string, Set<string>>() // relationFieldName -> Set of displayFieldNames

    for (const viewFieldName of currentView.value.fields) {
      if (viewFieldName.includes('.')) {
        const [relationFieldName, displayFieldName] = viewFieldName.split('.')
        if (!relationDisplayFields.has(relationFieldName)) {
          relationDisplayFields.set(relationFieldName, new Set())
        }
        relationDisplayFields.get(relationFieldName)!.add(displayFieldName)
      }
    }
    // Fetch display values for each relation field
    if (relationDisplayFields.size > 0 && data.length > 0) {
      for (const [relationFieldName, displayFieldNames] of relationDisplayFields.entries()) {
        const field = fields.value.find((f) => f.fieldName === relationFieldName)

        if (!field || field.businessType !== 'relation' || !field.relationTableId) continue

        // All relations are now arrays (uuid[])
        const isArray = field.isArray || true

        // Get the target table info
        const targetTableData = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [field.relationTableId])

        if (targetTableData.length === 0) continue

        const targetTable = targetTableData[0]

        // Collect all relation IDs from the data
        const relationIds = new Set<string>()
        for (const row of data) {
          const value = row[field.fieldName]
          if (value) {
            if (Array.isArray(value)) {
              value.forEach((id) => relationIds.add(id))
            } else {
              relationIds.add(value)
            }
          }
        }

        if (relationIds.size === 0) continue

        // Fetch all requested display fields in one query
        const displayFieldsList = Array.from(displayFieldNames)
        const selectFields = ['id', ...displayFieldsList.map((f) => `"${f}"`)].join(', ')

        const relatedRecords = await query<Record<string, any>>(
          `SELECT ${selectFields} FROM "${targetTable.tableName}"
           WHERE id = ANY($1)`,
          [Array.from(relationIds)]
        )

        // Build lookup maps for each display field: id -> display value
        const displayMaps = new Map<string, Map<string, any>>()
        for (const displayFieldName of displayFieldNames) {
          const displayMap = new Map<string, any>()
          for (const record of relatedRecords) {
            displayMap.set(record.id, record[displayFieldName])
          }
          displayMaps.set(displayFieldName, displayMap)
        }

        // Add display values to each row
        // Key format: relationFieldName.displayFieldName
        for (const displayFieldName of displayFieldNames) {
          const displayKey = `${field.fieldName}.${displayFieldName}`
          const displayMap = displayMaps.get(displayFieldName)!

          for (const row of data) {
            const value = row[field.fieldName]
            if (value) {
              if (Array.isArray(value)) {
                // Map each UUID to its display value
                row[displayKey] = value.map((id) => displayMap.get(id) || id)
              } else {
                // Single value (shouldn't happen anymore, but keep for safety)
                row[displayKey] = displayMap.get(value) || value
              }
            } else {
              row[displayKey] = null
            }
          }
        }
      }
    }
    console.log('data', data)
    return data
  }

  async function getTableData(params: any = {}, aggregate: any = []): Promise<any[]> {
    if (!physicalTableName.value || !currentView.value) {
      throw new Error('physicalTableName and currentView are required')
    }
    loading.value = true
    try {
      if (aggregate && aggregate?.length > 0) {
        groupListIndex.value = 0
        return await getGroupApi(params, aggregate[0])
      }

      const data = await queryTableData()
      tableData.value = data
      return JSON.parse(JSON.stringify(data))
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

    const columnNames = Object.keys(row).filter((k) => k !== 'id')
    const placeholders = columnNames.map((_, i) => `$${i + 1}`)
    const values = columnNames.map((k) => row[k])

    const sql = `INSERT INTO "${physicalTableName.value}" (${columnNames.map((c) => `"${c}"`).join(', ')})
                 VALUES (${placeholders.join(', ')}) RETURNING *`
    const data = await query(sql, values)
    const newRow = data[0]

    // Auto-resolve relations for new row using stored lookup config
    const relationFields = fields.value.filter(
      (f) => f.businessType === 'relation' && f.lookupColumnName && f.lookupFieldId && f.relationTableId
    )

    for (const relField of relationFields) {
      const sourceValue = row[relField.lookupColumnName!]
      if (!sourceValue) continue

      // Get target table info
      const targetTableData = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [relField.relationTableId])
      if (targetTableData.length === 0) continue

      const targetTable = targetTableData[0]

      // Get target field info
      const targetFieldData = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE id = $1`, [relField.lookupFieldId])
      if (targetFieldData.length === 0) continue

      const targetField = targetFieldData[0]

      // Find matching target rows
      const matches = await query<{ id: string }>(
        `SELECT id FROM "${targetTable.tableName}" WHERE "${targetField.fieldName}" = $1`,
        [sourceValue]
      )

      if (matches.length > 0) {
        // Deduplicate and update the relation column
        const uniqueIds = [...new Set(matches.map((m) => m.id))]
        await query(`UPDATE "${physicalTableName.value}" SET "${relField.fieldName}" = $1 WHERE id = $2`, [uniqueIds, newRow.id])

        // Update local row data
        newRow[relField.fieldName] = uniqueIds
      }
    }

    tableData.value.push(newRow)
  }

  async function updateRow(rows: any[]): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }

    // Internal fields added by table that should not be persisted
    const internalFields = new Set(['__filter_data', 'isAggregate', '__count'])

    // Process each row in the array
    for (const row of rows) {
      if (!row.id) {
        throw new Error('row id is required')
      }

      // Filter out internal fields and relation display fields (containing '.')
      const updateKeys = Object.keys(row).filter((k) => !internalFields.has(k) && !k.includes('.'))

      if (updateKeys.length === 0) {
        console.warn('No fields to update for row with id: ' + row.id)
        continue
      }

      const setClauses = updateKeys.map((k, i) => `"${k}" = $${i + 1}`)
      const values = [...updateKeys.map((k) => row[k]), row.id]

      const sql = `UPDATE "${physicalTableName.value}" SET ${setClauses.join(', ')}, "updatedAt" = NOW()
                   WHERE id = $${values.length} RETURNING *`

      try {
        const data = await query(sql, values)

        // Update local tableData with the returned row
        const index = tableData.value.findIndex((item) => item.id === row.id)
        if (index !== -1) {
          // Merge the updated data with existing row data to preserve internal fields
          tableData.value[index] = { ...tableData.value[index], ...data[0] }
        }
      } catch (error) {
        console.error(`Failed to update row ${row.id}:`, error)
        throw error
      }
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
    tableData.value = tableData.value.filter((item) => item.id !== id)
  }

  // Provide TableDataContext using dp-mdTable's key so MdTable can inject it
  // Adapt signatures to match dp-mdTable's expected interface
  provide(TableDataContextKey, {
    tableData,
    loading,
    error,
    queryParams,
    getTableData,
    getAggChildData,
    refresh,
    addRow,
    updateRow,
    deleteRow: (index: number) => {
      // dp-mdTable uses index-based delete, but we use id
      const existingRow = tableData.value[index]
      if (existingRow?.id) {
        deleteRow(existingRow.id)
      }
    }
  } as TableDataContext)

  // Region: Field Logic
  const fields = ref<CaseFieldRecord[]>([])

  function getField(fieldName: string): CaseFieldRecord | undefined {
    return fields.value.find((item) => item.fieldName === fieldName)
  }

  async function getAllFields(): Promise<CaseFieldRecord[]> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    const data = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1`, [tableId.value])
    fields.value = data
    return data
  }

  async function getDefaultView(): Promise<CaseViewRecord> {
    const data = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE "tableId" = $1 AND "isDefault" = true`, [tableId.value])
    return data[0]
  }

  async function addField(field: Partial<CaseFieldRecord>): Promise<CaseFieldRecord> {
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

    const newFieldData = await query(
      `INSERT INTO case_fields (
        id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
        "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
        "defaultValue", "fieldLength", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
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
    const defaultView = await getDefaultView()
    // get default view and add column to view
    if (defaultView) {
      const fields = new Set(JSON.parse(JSON.stringify(defaultView.fields)))
      fields.add(newFieldData[0].fieldName)

      await updateView(defaultView.id, { fields: Array.from(fields) as string[] })
      // await getAllColumns()
    }
    return newFieldData[0]
  }

  async function updateField(fieldName: string, updates: Partial<CaseFieldRecord>): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!fieldName) {
      throw new Error('fieldName is required')
    }

    // Extract base field name if it's in dot notation (e.g., "rel_company.name" -> "rel_company")
    const baseFieldName = fieldName.includes('.') ? fieldName.split('.')[0] : fieldName

    const field = getField(baseFieldName)
    if (!field) {
      throw new Error('field not found')
    }
    const updateKeys = Object.keys(updates).filter((key) => key !== 'id')
    if (updateKeys.length === 0) {
      return
    }

    // Check if this is a data type change (businessType or fieldType change)
    const isBusinessTypeChange = updates.businessType && updates.businessType !== field.businessType
    const isFieldTypeChange = updates.fieldType && updates.fieldType !== field.fieldType
    const isTypeChange = isBusinessTypeChange || isFieldTypeChange

    // Handle data type changes
    if (isTypeChange && physicalTableName.value) {
      const oldType = field.fieldType
      const newType = updates.fieldType || field.fieldType
      const oldBusinessType = field.businessType
      const newBusinessType = updates.businessType || field.businessType

      // Check if we can convert the data (use base field name for physical column)
      const canConvert = await handleDataTypeConversion(baseFieldName, oldType, newType, oldBusinessType, newBusinessType)

      if (!canConvert) {
        throw new Error('Cannot convert data type. Please clear the column data first.')
      }
    }

    // Handle relation field display field changes
    const isRelationDisplayFieldUpdate = field.businessType === 'relation' && updates.displayFieldIds
    if (isRelationDisplayFieldUpdate) {
      await handleRelationDisplayFieldUpdate(field, updates.displayFieldIds!)
    }

    // Column names now use camelCase in database
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const key of updateKeys) {
      setClauses.push(`"${key}" = $${paramIndex}`)

      let value = updates[key as keyof CaseFieldRecord]

      // Handle special types for PGlite compatibility
      if (key === 'displayStructure') {
        value = JSON.stringify(value)
      } else if (key === 'displayFieldIds' && Array.isArray(value)) {
        // Ensure arrays are plain JavaScript arrays (not Proxy or other non-cloneable objects)
        value = ensurePlainArray(value) as any
      }

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

    // Update local state (use base field name)
    const index = fields.value.findIndex((f) => f.fieldName === baseFieldName)
    if (index !== -1) {
      fields.value[index] = { ...fields.value[index], ...updates }
    }

    // If this is a relation field update, reload all columns to pick up new view fields
    if (isRelationDisplayFieldUpdate) {
      // Small delay to ensure all database updates are complete before reloading columns
      await initializeTableView(tableId.value)
      await gridRef.value?.commitProxy('reload')
    } else {
      // For non-relation updates, just update the affected columns
      columns.value.forEach((col, colIndex) => {
        const colBaseFieldName = col.field.includes('.') ? col.field.split('.')[0] : col.field
        if (colBaseFieldName === baseFieldName) {
          columns.value[colIndex] = fieldToColumnConfig(fields.value[index])
        }
      })
    }
  }

  /**
   * Handle data type conversion when updating a field
   * Returns true if conversion is successful or not needed, false if conversion failed
   */
  async function handleDataTypeConversion(
    fieldName: string,
    oldType: string,
    newType: string,
    oldBusinessType: string,
    newBusinessType: string
  ): Promise<boolean> {
    if (!physicalTableName.value) return false

    // If changing from/to relation, handle specially
    if (oldBusinessType === 'relation' || newBusinessType === 'relation') {
      // Changing to/from relation requires clearing data
      await query(`UPDATE "${physicalTableName.value}" SET "${fieldName}" = NULL`)

      // If changing column type in database, use ALTER TABLE
      if (oldType !== newType) {
        try {
          await exec(
            `ALTER TABLE "${physicalTableName.value}"
             ALTER COLUMN "${fieldName}" TYPE ${newType} USING NULL`
          )
        } catch (error) {
          console.error('Error altering column type:', error)
          return false
        }
      }
      return true
    }

    // Try to convert to text/string if possible
    if (newType === 'text' || newType === 'varchar') {
      try {
        await exec(
          `ALTER TABLE "${physicalTableName.value}"
           ALTER COLUMN "${fieldName}" TYPE text USING "${fieldName}"::text`
        )
        return true
      } catch (error) {
        console.error('Error converting to text:', error)
        // If conversion fails, clear the data
        await query(`UPDATE "${physicalTableName.value}" SET "${fieldName}" = NULL`)
        await exec(
          `ALTER TABLE "${physicalTableName.value}"
           ALTER COLUMN "${fieldName}" TYPE text`
        )
        return true
      }
    }

    // For other type changes, try direct conversion
    try {
      await exec(
        `ALTER TABLE "${physicalTableName.value}"
         ALTER COLUMN "${fieldName}" TYPE ${newType} USING "${fieldName}"::${newType}`
      )
      return true
    } catch (error) {
      console.error('Error converting column type:', error)
      // If conversion fails, clear the data
      await query(`UPDATE "${physicalTableName.value}" SET "${fieldName}" = NULL`)
      try {
        await exec(
          `ALTER TABLE "${physicalTableName.value}"
           ALTER COLUMN "${fieldName}" TYPE ${newType}`
        )
        return true
      } catch (alterError) {
        console.error('Error altering column after clearing:', alterError)
        return false
      }
    }
  }

  /**
   * Handle updates to relation field display fields
   * Replaces old display fields with new ones in the view
   */
  async function handleRelationDisplayFieldUpdate(field: CaseFieldRecord, newDisplayFieldIds: string[]): Promise<void> {
    if (!field.relationTableId || !currentView.value) return

    const oldDisplayFieldIds = field.displayFieldIds || []

    // Get old and new field names
    const oldFields =
      oldDisplayFieldIds.length > 0
        ? await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1 AND id = ANY($2)`, [
            field.relationTableId,
            ensurePlainArray(oldDisplayFieldIds)
          ])
        : []

    const newFields = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1 AND id = ANY($2)`, [
      field.relationTableId,
      ensurePlainArray(newDisplayFieldIds)
    ])

    // Build list of old and new view field names
    const oldViewFieldNames = oldFields.map((f) => `${field.fieldName}.${f.fieldName}`)
    const newViewFieldNames = newFields.map((f) => `${field.fieldName}.${f.fieldName}`)

    // Preserve field order: replace old fields with new ones at the same position
    const updatedFields = currentView.value.fields.reduce<string[]>((result, viewFieldName) => {
      // If this is one of the old relation fields, replace it with the new ones
      if (oldViewFieldNames.includes(viewFieldName)) {
        // Only add new fields once (at the position of the first old field)
        if (viewFieldName === oldViewFieldNames[0]) {
          return [...result, ...newViewFieldNames]
        }
        // Skip other old fields (they're being replaced)
        return result
      }
      // Keep all other fields in their original position
      return [...result, viewFieldName]
    }, [])

    // Update the view
    await query(`UPDATE case_views SET fields = $1, "updatedAt" = $2 WHERE id = $3`, [ensurePlainArray(updatedFields), new Date(), currentView.value.id])

    // Update local state
    currentView.value.fields = updatedFields
  }

  async function deleteField(fieldName: string): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!fieldName) {
      throw new Error('fieldName is required')
    }
    await query('DELETE FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2', [tableId.value, fieldName])
    fields.value = fields.value.filter((item) => item.fieldName !== fieldName)
    // remove field from default view
    const defaultView = await getDefaultView()
    if (defaultView) {
      const fields = new Set(JSON.parse(JSON.stringify(defaultView.fields)))
      fields.delete(fieldName)
      await updateView(defaultView.id, { fields: Array.from(fields) as string[] })
    }
  }

  // Region: Column mapping - convert CaseFieldRecord to ColumnConfig for dp-mdTable
  const columns = ref<ColumnConfig[]>([])
  const addColumnPopoverRef = ref()
  const columnGroupRules = ref<any[]>([])
  const columnFilterRules = ref<any[]>([])
  const columnSortRules = ref<any[]>([])
  const gridRef = ref<any>()
  /**
   * Convert CaseFieldRecord to ColumnConfig for dp-mdTable compatibility
   */
  function fieldToColumnConfig(field: CaseFieldRecord): ColumnConfig {
    // set column width by fieldNameAlias length
    const width = Math.max(field.fieldNameAlias.length * 13, 100) + 20
    // if field.displayStructure?.type is  2, set headerAlign to right
    const headerAlign = field.displayStructure?.type === 2 ? 'right' : 'left'

    return {
      id: field.id,
      dataTableId: field.tableId ?? undefined, // Convert null to undefined
      field: field.fieldName,
      title: field.fieldNameAlias,
      width,
      type: field.displayStructure?.type as any, // ColumnFieldType from displayStructure
      properties: field.displayStructure?.properties as Record<string, any> | undefined,
      headerAlign
    }
  }

  /**
   * Convert ColumnConfig back to CaseFieldRecord for storage
   */
  async function columnConfigToField(column: ColumnConfig): Promise<Partial<CaseFieldRecord>> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    // Extract base field name if it's in dot notation (e.g., "rel_company.name" -> "rel_company")
    const baseFieldName = column.field.includes('.') ? column.field.split('.')[0] : column.field
    const field = getField(baseFieldName)

    const baseUpdate: Partial<CaseFieldRecord> = {
      tableId: field?.tableId ?? currentView.value.tableId ?? null,
      fieldName: baseFieldName, // Use base field name, not the full dot notation
      fieldNameAlias: column.title,
      displayStructure: {
        type: column.type,
        properties: column.properties || {}
      } as unknown as FieldDisplayStructure
    }

    if (field) {
      baseUpdate.id = field.id
    }

    // Handle relation field updates - convert displayField to displayFieldIds
    if (field?.businessType === 'relation' && column.properties?.displayField && field.relationTableId) {
      try {
        // Get the target field by name to find its ID
        const targetFields = await query<CaseFieldRecord>(`SELECT id FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2`, [
          field.relationTableId,
          column.properties.displayField
        ])

        if (targetFields.length > 0) {
          // Add displayFieldIds to the update
          baseUpdate.displayFieldIds = [targetFields[0].id]
        }
      } catch (error) {
        console.error('Error converting displayField to displayFieldIds:', error)
      }
    }

    return baseUpdate
  }

  function getColumn(fieldName: string): ColumnConfig | undefined {
    const field = getField(fieldName)
    return field ? fieldToColumnConfig(field) : undefined
  }

  async function getAllColumns(): Promise<ColumnConfig[]> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    let columnsData = currentView.value.fields.reduce<ColumnConfig[]>((result: ColumnConfig[], viewFieldName: string) => {
      // Check if this is a relation field with display field (format: relationField.displayField)
      if (viewFieldName.includes('.')) {
        const [relationFieldName, displayFieldName] = viewFieldName.split('.')
        const field = getField(relationFieldName)

        if (field && field.businessType === 'relation') {
          // Create a virtual column config for this relation display field
          const columnConfig = fieldToColumnConfig(field)
          // Override the field name to include display field
          columnConfig.field = viewFieldName
          // Update title to show it's a display field
          columnConfig.title = `${field.fieldNameAlias} (${displayFieldName})`
          // Store the display field name in properties for rendering
          if (!columnConfig.properties) {
            columnConfig.properties = {}
          }
          columnConfig.properties.displayField = displayFieldName

          return [...result, columnConfig]
        }
      } else {
        // Regular field (no dot notation)
        const field = getField(viewFieldName)
        return field ? [...result, fieldToColumnConfig(field)] : result
      }

      return result
    }, [] as ColumnConfig[])

    columns.value = columnsData

    return columnsData
  }

  /**
   * Unified function to create or update a column field
   * Normalizes column config to field, handles create/update, returns viewFieldName
   */
  const RELATION_TYPE = 14 // MagicLink = Relation

  async function createOrUpdateColumnField(column: ColumnConfig): Promise<{
    field: CaseFieldRecord
    viewFieldName: string
    oldViewFieldName: string | null
  }> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    // 1. Check if field exists
    const baseFieldName = column.field.includes('.') ? column.field.split('.')[0] : column.field
    const existingField = getField(baseFieldName)
    const isUpdate = existingField !== undefined
    const isRelationType = column.type === RELATION_TYPE

    // 2. Determine viewFieldName format
    let viewFieldName = baseFieldName
    if (isRelationType && column.properties?.displayField) {
      viewFieldName = `${baseFieldName}.${column.properties.displayField}`
    }

    // Calculate oldViewFieldName for existing fields
    let oldViewFieldName: string | null = null
    if (isUpdate) {
      // Find current viewFieldName in view.fields
      const existingViewField = currentView.value.fields.find(
        (f) => f === baseFieldName || f.startsWith(`${baseFieldName}.`)
      )
      oldViewFieldName = existingViewField || baseFieldName
    }

    // 3. If existing field with type change - use transaction to delete + create
    if (isUpdate && existingField) {
      const oldIsRelation = existingField.businessType === 'relation'
      const newIsRelation = isRelationType

      if (oldIsRelation !== newIsRelation) {
        // Type changed between relation and non-relation - delete old, create new
        try {
          // Delete old field from case_fields
          await query('DELETE FROM case_fields WHERE id = $1', [existingField.id])
          fields.value = fields.value.filter((f) => f.id !== existingField.id)

          // Drop old physical column if it exists
          if (physicalTableName.value) {
            try {
              await exec(`ALTER TABLE "${physicalTableName.value}" DROP COLUMN IF EXISTS "${baseFieldName}"`)
            } catch (e) {
              console.warn('Could not drop old column:', e)
            }
          }

          // Now create new field (fall through to step 4)
        } catch (error) {
          console.error('Error during type change transaction:', error)
          throw error
        }
      } else {
        // Same type category - just update the existing field
        const fieldData = await prepareFieldData(column, isRelationType, baseFieldName)
        await updateField(baseFieldName, fieldData)
        const updatedField = { ...existingField, ...fieldData } as CaseFieldRecord

        return { field: updatedField, viewFieldName, oldViewFieldName }
      }
    }

    // 4. Prepare and create new field (for new fields or after type change delete)
    const fieldData = await prepareFieldData(column, isRelationType, baseFieldName)

    // Create physical column for relation fields
    if (isRelationType && physicalTableName.value) {
      try {
        await exec(`ALTER TABLE "${physicalTableName.value}" ADD COLUMN "${baseFieldName}" uuid[]`)
      } catch (e) {
        // Column might already exist if this is a type change
        console.warn('Could not add column (may already exist):', e)
      }
    }

    // Create the field record
    const newField = await addField(fieldData)

    return { field: newField, viewFieldName, oldViewFieldName }
  }

  /**
   * Prepare field data based on column type
   */
  async function prepareFieldData(
    column: ColumnConfig,
    isRelationType: boolean,
    baseFieldName: string
  ): Promise<Partial<CaseFieldRecord>> {
    if (isRelationType) {
      // Validate relation requirements
      if (!column.properties?.relationTableId) {
        throw new Error('relationTableId is required for relation columns')
      }
      if (!column.properties?.displayField) {
        throw new Error('displayField is required for relation columns')
      }

      // Get target table info
      const targetTableData = await query<CaseTableRecord>(
        `SELECT * FROM case_tables WHERE id = $1`,
        [column.properties.relationTableId]
      )
      if (targetTableData.length === 0) {
        throw new Error('Target table not found')
      }
      const targetTable = targetTableData[0]

      // Get display field ID
      const displayFieldData = await query<CaseFieldRecord>(
        `SELECT id FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2`,
        [column.properties.relationTableId, column.properties.displayField]
      )
      if (displayFieldData.length === 0) {
        throw new Error('Display field not found in target table')
      }
      const displayFieldId = displayFieldData[0].id

      return {
        fieldName: baseFieldName,
        fieldNameAlias: column.title,
        businessType: 'relation',
        fieldType: 'uuid', // Stored as uuid, isArray=true handles the array nature
        isArray: true,
        isReference: true,
        relationTableId: column.properties.relationTableId,
        displayFieldIds: [displayFieldId],
        displayStructure: {
          type: column.type,
          properties: {
            ...column.properties,
            relationTableName: targetTable.tableName
          }
        } as unknown as FieldDisplayStructure
      }
    } else {
      // Regular field - use existing columnConfigToField logic
      return {
        fieldName: baseFieldName,
        fieldNameAlias: column.title,
        businessType: 'text',
        fieldType: 'text',
        displayStructure: {
          type: column.type,
          properties: column.properties || {}
        } as unknown as FieldDisplayStructure
      }
    }
  }

  async function addColumn(column: ColumnConfig, targetColumnName: string, position: 'left' | 'right'): Promise<void> {
    // Create or update field using unified function
    const { viewFieldName } = await createOrUpdateColumnField(column)

    if (!targetColumnName) {
      return
    }

    // Position the viewFieldName in the view
    const fieldSet = new Set(JSON.parse(JSON.stringify(currentView.value?.fields)))
    fieldSet.add(viewFieldName)
    const fieldsArray = Array.from(fieldSet) as string[]

    // Find the index of the target column
    const targetIndex = fieldsArray.findIndex((field) => field === targetColumnName)
    if (targetIndex === -1) {
      return
    }

    // Remove the new field from its current position (end of array)
    const newFieldIndex = fieldsArray.findIndex((field) => field === viewFieldName)
    if (newFieldIndex !== -1) {
      fieldsArray.splice(newFieldIndex, 1)
    }

    // Calculate insert position based on position parameter
    let insertIndex = position === 'left' ? targetIndex : targetIndex + 1

    // Insert the new field at the correct position
    fieldsArray.splice(insertIndex, 0, viewFieldName)

    // Update the current view with the new field order
    if (currentView.value?.id) {
      await updateView(currentView.value.id, { fields: fieldsArray })
      await getAllColumns()
      nextTick(() => {
        // Open add column popover to let user update column properties
        const index = columns.value.findIndex((col) => col.field === viewFieldName)
        if (index !== -1) {
          setTimeout(() => {
            const tableElement = gridRef.value.$el
            const headerItem = tableElement.querySelector(`.vxe-header--column:nth-child(${index + 2}) .mdTableHeader-trigger`)
            if (headerItem) {
              addColumnPopoverRef.value.show(headerItem, columns.value[index])
            }
          }, 100)
        }
      })
    }
  }

  async function deleteColumn(fieldName: string): Promise<void> {
    await deleteField(fieldName)
    const currentViewFieldsSet = new Set(JSON.parse(JSON.stringify(currentView.value?.fields)))
    currentViewFieldsSet.delete(fieldName)
    if (currentView.value?.id) {
      await updateView(currentView.value.id, { fields: Array.from(currentViewFieldsSet) as string[] })
    }
    await getAllColumns()
  }

  function saveColumnOrder(newOrder: OrdersParam) {
    if (!currentView.value) {
      return
    }

    const { newColumn, oldColumn, dragPos } = newOrder

    // Get current columns array and save original for error recovery
    const originalColumns = [...columns.value]
    const currentColumns = [...originalColumns]

    // Find indices of the dragged and target columns
    // oldColumn: the column being dragged (moving)
    // newColumn: the drop target column
    const draggedColumnIndex = currentColumns.findIndex((col: ColumnConfig) => col.field === oldColumn.field)
    const targetColumnIndex = currentColumns.findIndex((col: ColumnConfig) => col.field === newColumn.field)

    if (draggedColumnIndex === -1 || targetColumnIndex === -1) {
      return
    }

    // If dragging to same position, no-op
    if (draggedColumnIndex === targetColumnIndex) {
      return
    }

    // Remove the dragged column from its current position
    const [draggedColumn] = currentColumns.splice(draggedColumnIndex, 1)

    // Calculate new position based on drag position and relative positions
    let insertIndex = targetColumnIndex

    if (draggedColumnIndex < targetColumnIndex) {
      // Moving from left to right
      if (dragPos === 'left') {
        // Insert to the left of target, but we've removed a column from before the target
        insertIndex = Math.max(0, targetColumnIndex - 1)
      } else {
        // dragPos === 'right'
        // Insert to the right of target, but we've removed a column from before the target
        insertIndex = targetColumnIndex
      }
    } else {
      // Moving from right to left (draggedColumnIndex > targetColumnIndex)
      if (dragPos === 'left') {
        // Insert to the left of target, target position unchanged
        insertIndex = targetColumnIndex
      } else {
        // dragPos === 'right'
        // Insert to the right of target, target position unchanged
        insertIndex = targetColumnIndex + 1
      }
    }

    // Ensure insertIndex is within bounds
    insertIndex = Math.max(0, Math.min(insertIndex, currentColumns.length))

    // Insert the dragged column at the new position
    currentColumns.splice(insertIndex, 0, draggedColumn)

    // Extract field names in new order
    const newFieldOrder = currentColumns.map((col) => col.field)

    // Update the current view's fields array immediately for UI consistency
    currentView.value = { ...currentView.value, fields: newFieldOrder }

    // Save to database
    updateView(currentView.value.id, { fields: newFieldOrder })
      .then(() => {
        console.log('Column order saved successfully')
      })
      .catch((error) => {
        console.error('Failed to save column order:', error)
        // Revert columns and view fields on error using original state
        columns.value = originalColumns
        if (currentView.value) {
          // Restore original field order
          currentView.value = { ...currentView.value, fields: originalColumns.map((col) => col.field) }
        }
      })
  }
  async function updateColumn(fieldName: string, updates: Partial<ColumnConfig>): Promise<void> {
    // Merge fieldName with updates to create a complete column config
    const baseFieldName = fieldName.includes('.') ? fieldName.split('.')[0] : fieldName
    const existingField = getField(baseFieldName)

    // Get existing type from field or use a default
    const existingType = existingField?.displayStructure?.type ?? 1 // Default to MultiText

    const mergedColumn: ColumnConfig = {
      field: baseFieldName,
      title: updates.title || existingField?.fieldNameAlias || '',
      type: (updates.type ?? existingType) as ColumnConfig['type'],
      properties: updates.properties
    }

    // Use unified function to handle create/update
    const { viewFieldName, oldViewFieldName } = await createOrUpdateColumnField(mergedColumn)

    // If viewFieldName changed, update view.fields
    if (currentView.value && oldViewFieldName && viewFieldName !== oldViewFieldName) {
      const updatedFields = currentView.value.fields.map((f) => (f === oldViewFieldName ? viewFieldName : f))
      await updateView(currentView.value.id, { fields: updatedFields })
    }

    // Reload columns to reflect changes
    await getAllColumns()
  }

  /**
   * Get available tables for relation (filtered by entityId, no duplicates)
   */
  async function getAvailableTablesForRelation(excludeCurrentTable: boolean = false): Promise<CaseTableRecord[]> {
    if (!entityId.value) {
      throw new Error('Entity ID not available')
    }

    try {
      // Get all tables from the same entity, use DISTINCT ON to avoid duplicates
      const whereClause =
        excludeCurrentTable && tableId.value ? `WHERE status = 'A' AND "entityId" = $1 AND id != $2` : `WHERE status = 'A' AND "entityId" = $1`

      const params = excludeCurrentTable && tableId.value ? [entityId.value, tableId.value] : [entityId.value]

      const tables = await query<CaseTableRecord>(
        `SELECT DISTINCT ON (name, "tableName") *
         FROM case_tables
         ${whereClause}
         ORDER BY name, "tableName", "createdAt" DESC`,
        params
      )
      return tables
    } catch (error) {
      console.error('Error loading available tables:', error)
      throw error
    }
  }

  /**
   * Get fields for a specific table
   */
  async function getFieldsForTable(targetTableId: string): Promise<CaseFieldRecord[]> {
    try {
      const fields = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "fieldNameAlias"`, [targetTableId])
      return fields
    } catch (error) {
      console.error('Error loading fields for table:', error)
      throw error
    }
  }

  // Provide ColumnContext using dp-mdTable's key so MdTable can inject it
  provide(ColumnContextKey, {
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    columns,
    saveColumnOrder,
    columnGroupRules,
    columnFilterRules,
    columnSortRules,
    addColumnPopoverRef,
    gridRef,
    // Relation helpers
    getAvailableTablesForRelation,
    getFieldsForTable,
    tableId,
    entityId
  } as ColumnContext)

  // Region: View Logic
  const currentView = ref<CaseViewRecord | null>(null)
  const views = ref<CaseViewRecord[]>([])
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

  async function getViewById(viewId: string): Promise<void> {
    const data = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE id = $1`, [viewId])
    if (!data || !data.length) {
      throw new Error(`View with id ${viewId} not found`)
    }
    currentView.value = data[0]
    // load filter, sort, group from view
    columnFilterRules.value = data[0].filter || []
    columnSortRules.value = data[0].sorting || []
    columnGroupRules.value = data[0].grouping || []
    if (!fields.value || !fields.value.length) {
      await getAllFields()
    }
    await getAllColumns()
    console.log('currentView', currentView.value)
    console.log('columns', columns.value)
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

  async function updateView(viewId: string, updates: Partial<CaseViewRecord>): Promise<void> {
    const now = new Date()

    const updateKeys = Object.keys(updates).filter((k) => k !== 'id')
    if (updateKeys.length === 0) return

    // Column names now use camelCase in database
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

  async function saveViewFilterSortGroup(): Promise<void> {
    if (!currentView.value?.id) {
      throw new Error('View not found')
    }
    return updateView(currentView.value?.id, {
      filter: columnFilterRules.value,
      sorting: columnSortRules.value,
      grouping: columnGroupRules.value
    })
  }

  async function deleteView(viewId: string): Promise<void> {
    await query(`DELETE FROM case_views WHERE id = $1`, [viewId])
    views.value = views.value.filter((v) => v.id !== viewId)

    if (currentView.value?.id === viewId) {
      currentView.value = views.value.find((v) => v.isDefault) || views.value[0] || null
    }
  }

  provide(ViewContextKey, {
    currentView,
    views,
    getViews,
    getViewById,
    createView,
    updateView,
    deleteView
  })

  /**
   * Initialize table view with IDs
   */
  async function initializeTableView(caseTableId: string): Promise<void> {
    tableId.value = caseTableId

    // Get table info
    const tableData = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [caseTableId])
    if (tableData.length === 0) {
      throw new Error('Table not found')
    }

    const table = tableData[0]
    physicalTableName.value = table.tableName
    entityId.value = table.entityId
    // Get fields and views
    // chekc if viewName in table
    if (!table.viewName) {
      throw new Error('Table viewName not found')
    }
    await getAllFields()
    await getViewById(table.viewName)
  }

  /**
   * Initialize view by view ID
   * This is used when navigating directly to a view (not through a table)
   * @param viewId - The view ID from case_views table
   */
  async function initializeByView(viewId: string): Promise<void> {
    // Get view info
    const viewData = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE id = $1`, [viewId])
    if (viewData.length === 0) {
      throw new Error('View not found')
    }

    const view = viewData[0]

    // Set the current view
    currentView.value = view

    // Load filter, sort, group from view
    columnFilterRules.value = view.filter || []
    columnSortRules.value = view.sorting || []
    columnGroupRules.value = view.grouping || []

    // Get the associated table info
    const tableData = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [view.tableId])
    if (tableData.length === 0) {
      throw new Error('Associated table not found')
    }

    const table = tableData[0]
    tableId.value = table.id
    physicalTableName.value = table.tableName
    entityId.value = table.entityId

    // Get all fields from the table
    await getAllFields()

    // Get columns for this view
    await getAllColumns()
  }

  /**
   * Create a relation column from an existing column
   * Matches values from the source column with values in the target table's field
   */
  async function createRelationFromColumn(
    sourceFieldName: string,
    targetTableId: string,
    targetFieldId: string,
    displayFieldId: string,
    relationColumnName: string
  ): Promise<void> {
    if (!tableId.value || !physicalTableName.value) {
      throw new Error('Table not initialized')
    }

    // Get source field
    const sourceField = getField(sourceFieldName)
    if (!sourceField) {
      throw new Error('Source field not found')
    }

    // Get target table info
    const targetTableData = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [targetTableId])
    if (targetTableData.length === 0) {
      throw new Error('Target table not found')
    }
    const targetTable = targetTableData[0]

    // Get target field (for matching)
    const targetFieldData = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE id = $1`, [targetFieldId])
    if (targetFieldData.length === 0) {
      throw new Error('Target field not found')
    }
    const targetField = targetFieldData[0]

    // Get display field (for showing in relation)
    const displayFieldData = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE id = $1`, [displayFieldId])
    if (displayFieldData.length === 0) {
      throw new Error('Display field not found')
    }
    const displayField = displayFieldData[0]

    // Check if a relation to this target table already exists
    const existingRelations = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields
       WHERE "tableId" = $1
       AND "businessType" = 'relation'
       AND "relationTableId" = $2`,
      [tableId.value, targetTableId]
    )

    let relationFieldName: string
    let relationField: CaseFieldRecord
    let isAddingToExistingRelation = false

    if (existingRelations.length > 0) {
      // Relation exists - check if display field is already in displayFieldIds
      relationField = existingRelations[0]
      relationFieldName = relationField.fieldName

      const currentDisplayFieldIds = relationField.displayFieldIds || []

      if (currentDisplayFieldIds.includes(displayFieldId)) {
        throw new Error(`Display field "${displayField.fieldNameAlias}" is already in the relation to table "${targetTable.name}".`)
      }

      // Add the new display field to the existing relation
      const updatedDisplayFieldIds = [...currentDisplayFieldIds, displayFieldId]

      await query(
        `UPDATE case_fields
         SET "displayFieldIds" = $1, "updatedAt" = $2
         WHERE id = $3`,
        [ensurePlainArray(updatedDisplayFieldIds), new Date(), relationField.id]
      )

      isAddingToExistingRelation = true
    } else {
      // Create new relation field
      const now = new Date()
      relationFieldName = `rel_${sourceFieldName}`
      const newFieldId = crypto.randomUUID()

      const displayStructure: FieldDisplayStructure = {
        type: 14, // ColumnFieldType.Relation
        properties: {
          relationTableId: targetTableId,
          relationFieldId: targetFieldId
        }
      }

      // Store the display field ID in displayFieldIds array (schema expects UUIDs)
      const displayFieldIds = [displayFieldId]

      await query(
        `INSERT INTO case_fields (
          id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
          "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
          "isReference", "relationTableId", "displayFieldIds",
          "lookupColumnName", "lookupFieldId",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          newFieldId,
          tableId.value,
          relationFieldName,
          relationColumnName,
          'relation',
          'uuid[]', // Always use array
          JSON.stringify(displayStructure),
          false,
          false,
          true, // isArray = true
          false,
          true,
          targetTableId,
          displayFieldIds,
          sourceFieldName, // Store lookup column for auto-relation on new rows
          targetFieldId, // Store lookup field for auto-relation on new rows
          now,
          now
        ]
      )
    }

    // Only create the physical column and populate data if this is a new relation
    if (existingRelations.length === 0) {
      // Add the new relation column to the physical table (always use array)
      await exec(`ALTER TABLE "${physicalTableName.value}" ADD COLUMN "${relationFieldName}" uuid[]`)

      // Now populate the relation column by matching values
      // Get all rows from source table with the source field values
      const sourceRows = await query<Record<string, any>>(
        `SELECT id, "${sourceFieldName}" FROM "${physicalTableName.value}"
         WHERE "${sourceFieldName}" IS NOT NULL`
      )

      // Get all rows from target table with the target field values
      const targetRows = await query<Record<string, any>>(
        `SELECT id, "${targetField.fieldName}" FROM "${targetTable.tableName}"
         WHERE "${targetField.fieldName}" IS NOT NULL`
      )

      // Build a lookup map: targetFieldValue -> Set of targetRowIds (deduplicated)
      const valueLookup = new Map<string, Set<string>>()
      for (const targetRow of targetRows) {
        const value = String(targetRow[targetField.fieldName])
        if (!valueLookup.has(value)) {
          valueLookup.set(value, new Set())
        }
        valueLookup.get(value)!.add(targetRow.id) // Set.add() auto-deduplicates
      }

      // Build batch updates for performance
      const updates: Array<{ id: string; relationIds: string[] }> = []
      for (const sourceRow of sourceRows) {
        const sourceValue = String(sourceRow[sourceFieldName])
        const targetIds = valueLookup.get(sourceValue)

        if (targetIds && targetIds.size > 0) {
          updates.push({
            id: sourceRow.id,
            relationIds: Array.from(targetIds) // Convert Set to Array for PostgreSQL
          })
        }
      }

      // Batch update all rows in a single query using VALUES clause
      if (updates.length > 0) {
        const valuesClauses = updates.map((_, i) => `($${i * 2 + 1}::uuid, $${i * 2 + 2}::uuid[])`).join(', ')
        const params = updates.flatMap((u) => [u.id, u.relationIds])

        await query(
          `UPDATE "${physicalTableName.value}" AS t
           SET "${relationFieldName}" = v.relation_ids
           FROM (VALUES ${valuesClauses}) AS v(id, relation_ids)
           WHERE t.id = v.id`,
          params
        )
      }
    }

    // Refresh fields
    await getAllFields()

    // Always add the new display field to the view (first time or adding to existing)
    if (currentView.value) {
      const viewFieldName = `${relationFieldName}.${displayField.fieldName}`
      const currentFields = [...currentView.value.fields]

      // Find the position of any existing display field from this relation
      const existingRelationFieldIndex = currentFields.findIndex((f) => f.startsWith(`${relationFieldName}.`))

      if (existingRelationFieldIndex !== -1) {
        // Insert the new display field right after the existing one
        currentFields.splice(existingRelationFieldIndex + 1, 0, viewFieldName)
      } else {
        // If no existing display field found, insert after source field
        const sourceFieldIndex = currentFields.indexOf(sourceFieldName)
        if (sourceFieldIndex !== -1) {
          currentFields.splice(sourceFieldIndex + 1, 0, viewFieldName)
        } else {
          // Fallback: append to end
          currentFields.push(viewFieldName)
        }
      }

      await updateView(currentView.value.id, { fields: currentFields })

      // Show appropriate success message
      if (isAddingToExistingRelation) {
        ElMessage.success(`Added "${displayField.fieldNameAlias}" display field`)
      } else {
        ElMessage.success(`Relation created with "${displayField.fieldNameAlias}" display field`)
      }
      await initializeTableView(tableId.value)
      await gridRef.value?.commitProxy('reload')
    }
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
    getAvailableTablesForRelation,

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
    createView,
    updateView,
    deleteView,
    saveViewFilterSortGroup,
    // Initialize
    initializeTableView,
    initializeByView,

    // Relations
    createRelationFromColumn
  }
}
