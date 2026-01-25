import type { CaseFieldRecord, CaseTableRecord, CaseViewRecord } from '../utils/db/schema/newTableSchema'
import { TableDataContextKey, type TableDataContext } from '#imports'
import { buildGroupByQuery, buildSelectQuery, type FilterRule, type SortRule } from './useQueryBuilder'
import { ensurePlainArray } from './useTableFields'

export interface UseTableDataProviderOptions {
  physicalTableName: Ref<string>
  fields: Ref<CaseFieldRecord[]>
  currentView: Ref<CaseViewRecord | null>
  columnFilterRules: Ref<any[]>
  columnSortRules: Ref<any[]>
  columnGroupRules: Ref<any[]>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  getField: (fieldName: string) => CaseFieldRecord | undefined
}

export function useTableDataProvider(options: UseTableDataProviderOptions) {
  const {
    physicalTableName,
    fields,
    currentView,
    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    query,
    getField
  } = options

  const loading = ref(false)
  const error = ref<Error | null>(null)
  const tableData = ref<any[]>([])
  const queryParams = ref<any>({})
  
  // State to track which group index is the current group
  const groupListIndex = ref<number>(0)

  /**
   * Fetch relation display data for all relation fields
   * This fetches ALL displayFieldNames for each relation field (not just what's in view.fields)
   * The column renderer decides what to show based on view.fields
   */
  async function fetchRelationDisplayData(data: any[]): Promise<void> {
    if (data.length === 0) return

    // Get all relation fields that have displayFieldNames
    const relationFields = fields.value.filter(
      (f) => f.businessType === 'relation' && f.relationTableId && f.displayFieldNames?.length
    )

    for (const field of relationFields) {
      // Get the target table info
      const targetTableData = await query<CaseTableRecord>(
        `SELECT * FROM case_tables WHERE id = $1`,
        [field.relationTableId]
      )
      if (targetTableData.length === 0) continue

      const targetTable = targetTableData[0]

      // Use displayFieldNames directly - no need to query for field names
      const displayFieldNames = field.displayFieldNames

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

      // Fetch all display fields in one query
      const selectFields = ['id', ...displayFieldNames.map((f) => `"${f}"`)].join(', ')
      const relatedRecords = await query<Record<string, any>>(
        `SELECT ${selectFields} FROM "${targetTable.tableName}" WHERE id = ANY($1)`,
        [Array.from(relationIds)]
      )

      // Build lookup maps for each display field
      const displayMaps = new Map<string, Map<string, any>>()
      for (const displayFieldName of displayFieldNames) {
        const displayMap = new Map<string, any>()
        for (const record of relatedRecords) {
          displayMap.set(record.id, record[displayFieldName])
        }
        displayMaps.set(displayFieldName, displayMap)
      }

      // Add display values to each row using dot notation
      for (const displayFieldName of displayFieldNames) {
        const displayKey = `${field.fieldName}.${displayFieldName}`
        const displayMap = displayMaps.get(displayFieldName)!

        for (const row of data) {
          const value = row[field.fieldName]
          if (value) {
            if (Array.isArray(value)) {
              row[displayKey] = value.map((id) => displayMap.get(id) || id)
            } else {
              row[displayKey] = displayMap.get(value) || value
            }
          } else {
            row[displayKey] = null
          }
        }
      }
    }
  }

  /**
   * Query table data with optional filter
   */
  async function queryTableData(filter: Record<string, any> = {}): Promise<any[]> {
    if (!physicalTableName.value || !currentView.value) {
      throw new Error('physicalTableName and currentView are required')
    }

    // Build SELECT query using helper
    const { sql, queryValues } = buildSelectQuery(
      physicalTableName.value,
      filter,
      columnFilterRules.value as FilterRule[],
      columnSortRules.value as SortRule[]
    )

    const data = await query(sql, queryValues)

    // Fetch display values for all relation fields
    await fetchRelationDisplayData(data)
    console.log('data', data)
    return data
  }

  /**
   * Get aggregate child data
   */
  async function getAggChildData(params: any = {}): Promise<any[]> {
    if (!columnGroupRules.value || columnGroupRules.value.length === 0 || groupListIndex.value >= columnGroupRules.value.length) {
      // No more aggregates to process - return actual row data
      const filterData: Record<string, any> = params.row?.__filter_data || {}
      return await queryTableData(filterData)
    }

    const nextAggregate = columnGroupRules.value[groupListIndex.value]
    return await getGroupApi(params, nextAggregate)
  }

  /**
   * Get grouped data for aggregation
   */
  async function getGroupApi(
    params: any = {},
    aggregate: { id: string; field: string; order: string }
  ): Promise<any[]> {
    const latestGroupFilter: Record<string, any> = params.row?.__filter_data || {}

    if (!physicalTableName.value || !currentView.value) {
      throw new Error('physicalTableName and currentView are required')
    }

    if (!aggregate) {
      groupListIndex.value++
      return []
    }

    const groupRule = aggregate
    const groupField = groupRule.field
    const sortOrder = groupRule.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    if (!groupField) {
      groupListIndex.value++
      return []
    }

    const firstColumnField = currentView.value.fields[0]
    if (!firstColumnField) {
      groupListIndex.value++
      return []
    }

    const groupFieldRecord = getField(groupField)
    const groupTitle = groupFieldRecord?.fieldNameAlias || groupField

    const { sql, queryValues } = buildGroupByQuery(
      physicalTableName.value,
      groupField,
      sortOrder as 'ASC' | 'DESC',
      latestGroupFilter,
      columnFilterRules.value as FilterRule[]
    )

    const rawData = await query<{ [key: string]: any; count: number }>(sql, queryValues)

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

  /**
   * Get table data (main entry point)
   */
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

  /**
   * Refresh table data
   */
  async function refresh(): Promise<void> {
    await getTableData()
  }

  /**
   * Add a new row
   */
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

      const targetTableData = await query<CaseTableRecord>(
        `SELECT * FROM case_tables WHERE id = $1`,
        [relField.relationTableId]
      )
      if (targetTableData.length === 0) continue

      const targetTable = targetTableData[0]

      const targetFieldData = await query<CaseFieldRecord>(
        `SELECT * FROM case_fields WHERE id = $1`,
        [relField.lookupFieldId]
      )
      if (targetFieldData.length === 0) continue

      const targetField = targetFieldData[0]

      const matches = await query<{ id: string }>(
        `SELECT id FROM "${targetTable.tableName}" WHERE "${targetField.fieldName}" = $1`,
        [sourceValue]
      )

      if (matches.length > 0) {
        const uniqueIds = [...new Set(matches.map((m) => m.id))]
        await query(
          `UPDATE "${physicalTableName.value}" SET "${relField.fieldName}" = $1 WHERE id = $2`,
          [uniqueIds, newRow.id]
        )
        newRow[relField.fieldName] = uniqueIds
      }
    }

    tableData.value.push(newRow)
  }

  /**
   * Update rows
   */
  async function updateRow(rows: any[]): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }

    const internalFields = new Set(['__filter_data', 'isAggregate', '__count'])

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

        const index = tableData.value.findIndex((item) => item.id === row.id)
        if (index !== -1) {
          tableData.value[index] = { ...tableData.value[index], ...data[0] }
        }
      } catch (err) {
        console.error(`Failed to update row ${row.id}:`, err)
        throw err
      }
    }
  }

  /**
   * Delete a row by ID
   */
  async function deleteRow(ids: string | string[]): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }
    if (!ids) {
      throw new Error('row id is required')
    }
    if (Array.isArray(ids)) {
      const sql = `DELETE FROM "${physicalTableName.value}" WHERE id = ANY($1)`
      const queryValues = [ids]
      await query(sql, queryValues)
    } else {
      const sql = `DELETE FROM "${physicalTableName.value}" WHERE id = $1`
      const queryValues = [ids]
      await query(sql, queryValues)
    }
    // tableData.value = tableData.value.filter((item) => item.id !== id)
  }

  // Provide TableDataContext using dp-mdTable's key
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
    deleteRow
  } as TableDataContext)

  return {
    loading,
    error,
    tableData,
    queryParams,
    getTableData,
    getAggChildData,
    refresh,
    addRow,
    updateRow,
    deleteRow
  }
}
