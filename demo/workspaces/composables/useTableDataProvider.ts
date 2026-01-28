import type { CaseFieldRecord, CaseTableRecord, CaseViewRecord } from '../utils/db/schema/newTableSchema'
import { TableDataContextKey, type TableDataContext } from '#imports'
import { buildGroupByQuery, buildSelectQuery, type FilterRule, type SortRule } from './useQueryBuilder'
import { ensurePlainArray } from './useTableFields'
import { useCurrentUser } from './useCurrentUser'
import { useAuditLog } from './useAuditLog'

export interface UseTableDataProviderOptions {
  physicalTableName: Ref<string>
  fields: Ref<CaseFieldRecord[]>
  currentView: Ref<CaseViewRecord | null>
  columnFilterRules: Ref<any[]>
  columnSortRules: Ref<any[]>
  columnGroupRules: Ref<any[]>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  getField: (fieldName: string) => CaseFieldRecord | undefined
  // Audit logging options
  tableId?: Ref<string>
  entityId?: Ref<string>
  enableAuditLog?: boolean
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
    getField,
    tableId,
    entityId,
    enableAuditLog = true
  } = options

  const loading = ref(false)
  const error = ref<Error | null>(null)
  const tableData = ref<any[]>([])
  const queryParams = ref<any>({})
  
  // Current user management
  const { initCurrentUser, getCurrentUserId } = useCurrentUser()
  
  // Audit logging
  const { logInsert, logUpdate, logDelete, logBulkInsert, logBulkUpdate } = useAuditLog()
  
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

    // Ensure current user is initialized
    await initCurrentUser()

    // Add createdBy and updatedBy
    const currentUserId = getCurrentUserId()
    const rowWithUser = {
      ...row,
      createdBy: currentUserId,
      updatedBy: currentUserId
    }

    const columnNames = Object.keys(rowWithUser).filter((k) => k !== 'id')
    const placeholders = columnNames.map((_, i) => `$${i + 1}`)
    const values = columnNames.map((k) => rowWithUser[k])

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
        const currentUserId = getCurrentUserId()
        await query(
          `UPDATE "${physicalTableName.value}" SET "${relField.fieldName}" = $1, "updatedBy" = $3, "updatedAt" = NOW() WHERE id = $2`,
          [uniqueIds, newRow.id, currentUserId]
        )
        newRow[relField.fieldName] = uniqueIds
      }
    }

    tableData.value.push(newRow)

    // Log audit entry for the insert
    if (enableAuditLog) {
      try {
        await logInsert(physicalTableName.value, newRow.id, newRow, {
          tableType: 'dynamic',
          entityId: entityId?.value,
          caseTableId: tableId?.value
        })
      } catch (auditError) {
        console.warn('[Audit] Failed to log insert:', auditError)
      }
    }
  }

  /**
   * Update rows
   */
  async function updateRow(rows: any[]): Promise<void> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }

    // Ensure current user is initialized
    await initCurrentUser()

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

      // Get old values for audit logging
      let oldValues: Record<string, any> | null = null
      if (enableAuditLog) {
        const oldData = await query<Record<string, any>>(
          `SELECT * FROM "${physicalTableName.value}" WHERE id = $1`,
          [row.id]
        )
        if (oldData.length > 0) {
          oldValues = oldData[0]
        }
      }

      const currentUserId = getCurrentUserId()
      const setClauses = updateKeys.map((k, i) => `"${k}" = $${i + 1}`)
      // Add updatedBy to values
      const values = [...updateKeys.map((k) => row[k]), currentUserId, row.id]

      const sql = `UPDATE "${physicalTableName.value}" SET ${setClauses.join(', ')}, "updatedAt" = NOW(), "updatedBy" = $${values.length - 1}
                   WHERE id = $${values.length} RETURNING *`

      try {
        const data = await query(sql, values)

        const index = tableData.value.findIndex((item) => item.id === row.id)
        if (index !== -1) {
          tableData.value[index] = { ...tableData.value[index], ...data[0] }
        }

        // Log audit entry for the update
        if (enableAuditLog && oldValues) {
          try {
            await logUpdate(physicalTableName.value, row.id, oldValues, data[0], {
              tableType: 'dynamic',
              entityId: entityId?.value,
              caseTableId: tableId?.value
            })
          } catch (auditError) {
            console.warn('[Audit] Failed to log update:', auditError)
          }
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

    const idArray = Array.isArray(ids) ? ids : [ids]

    // Get old values for audit logging before deleting
    let deletedRecords: Array<{ id: string; data: Record<string, any> }> = []
    if (enableAuditLog) {
      const oldData = await query<Record<string, any>>(
        `SELECT * FROM "${physicalTableName.value}" WHERE id = ANY($1)`,
        [idArray]
      )
      deletedRecords = oldData.map(row => ({ id: row.id, data: row }))
    }

    // Perform the delete
    const sql = `DELETE FROM "${physicalTableName.value}" WHERE id = ANY($1)`
    await query(sql, [idArray])

    // Log audit entries for the delete
    if (enableAuditLog && deletedRecords.length > 0) {
      try {
        if (deletedRecords.length === 1) {
          await logDelete(physicalTableName.value, deletedRecords[0].id, deletedRecords[0].data, {
            tableType: 'dynamic',
            entityId: entityId?.value,
            caseTableId: tableId?.value
          })
        } else {
          await logBulkUpdate(physicalTableName.value, deletedRecords.map(r => ({
            id: r.id,
            oldData: r.data,
            newData: {}
          })), {
            tableType: 'dynamic',
            entityId: entityId?.value,
            caseTableId: tableId?.value,
            description: `Deleted ${deletedRecords.length} records from ${physicalTableName.value}`
          })
        }
      } catch (auditError) {
        console.warn('[Audit] Failed to log delete:', auditError)
      }
    }
  }

  /**
   * Upsert rows - update if exists (by lookup columns), insert if not
   * @param rows - Array of rows to upsert
   * @param lookupColumns - Column names to use for matching existing records
   * @param updateStrategy - 'all' to update all fields, 'non_empty' to skip empty values
   * @returns Object with counts of inserted and updated rows
   */
  async function upsertRows(
    rows: any[],
    lookupColumns: string[],
    updateStrategy: 'all' | 'non_empty' = 'all'
  ): Promise<{ inserted: number; updated: number; errors: { row: number; message: string }[] }> {
    if (!physicalTableName.value) {
      throw new Error('physicalTableName is required')
    }

    const result = { inserted: 0, updated: 0, errors: [] as { row: number; message: string }[] }
    const internalFields = new Set(['__filter_data', 'isAggregate', '__count'])

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Check if record exists based on lookup columns
        let existingId: string | null = null

        if (lookupColumns.length > 0) {
          const whereConditions: string[] = []
          const whereValues: any[] = []

          for (const col of lookupColumns) {
            if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
              whereConditions.push(`"${col}" = $${whereValues.length + 1}`)
              whereValues.push(row[col])
            }
          }

          if (whereConditions.length > 0) {
            const existing = await query<{ id: string }>(
              `SELECT id FROM "${physicalTableName.value}" WHERE ${whereConditions.join(' AND ')} LIMIT 1`,
              whereValues
            )

            if (existing.length > 0) {
              existingId = existing[0].id
            }
          }
        }

        if (existingId) {
          // Update existing record
          const updateKeys = Object.keys(row).filter((k) => {
            if (k === 'id' || internalFields.has(k) || k.includes('.')) return false
            if (updateStrategy === 'non_empty' && (row[k] === null || row[k] === undefined || row[k] === '')) {
              return false
            }
            return true
          })

          if (updateKeys.length > 0) {
            const currentUserId = getCurrentUserId()
            const setClauses = updateKeys.map((k, idx) => `"${k}" = $${idx + 1}`)
            const values = [...updateKeys.map((k) => row[k]), currentUserId, existingId]

            await query(
              `UPDATE "${physicalTableName.value}" SET ${setClauses.join(', ')}, "updatedAt" = NOW(), "updatedBy" = $${values.length - 1}
               WHERE id = $${values.length}`,
              values
            )
          }

          result.updated++
        } else {
          // Insert new record
          await addRow(row)
          result.inserted++
        }
      } catch (err: any) {
        result.errors.push({ row: i + 1, message: err.message || 'Unknown error' })
      }
    }

    return result
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
    deleteRow,
    upsertRows
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
    deleteRow,
    upsertRows
  }
}
