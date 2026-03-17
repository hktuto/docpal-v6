import type { CaseFieldRecord, CaseViewRecord, CaseTableRecord, FieldDisplayStructure } from '../../utils/db/schema/newTableSchema'
import { ElMessage } from 'element-plus'
import { getCurrentUserId } from '../useCurrentUser'
// Import sub-composables
import { newClientApi } from 'api'

// Re-export ViewContext for backwards compatibility
// export { ViewContextKey, type ViewContext }

/**
 * Main orchestrator composable for dynamic table view
 *
 * This composable coordinates all table-related functionality:
 * - Fields: Schema definition and management
 * - Views: Display configurations (columns, filters, sorts, groups)
 * - Columns: Field-to-column mapping with virtual column support
 * - Data: CRUD operations and relation data fetching
 */
export const useTableView = () => {
  const { query, exec } = usePglite()

  // Core IDs and state
  const tableId = ref<string>('')
  const physicalTableName = ref<string>('')
  const reference_entity_id = ref<string>('')

  // Initialize data provider (depends on fields, views, columns)
  // const dataComposable = useTableDataProvider({
  //   physicalTableName,
  //   query,
  //   // Audit logging options
  //   tableId,
  //   reference_entity_id,
  //   enableAuditLog: true
  // })

  /**
   * Initialize table view with table ID
   */
  async function initializeTableView(caseTableId: string): Promise<void> {
    tableId.value = caseTableId

    // Get table info
    const tableData = await newClientApi.postDynamicDbTableTableidDataPage(caseTableId, { pageNum: 0, pageSize: 9999 })
    console.log(tableData)
    if (tableData.length === 0) {
      throw new Error('Table not found')
    }

    const table = tableData[0]
    physicalTableName.value = table.tableName
    reference_entity_id.value = table.reference_entity_id

    if (!table.viewName) {
      throw new Error('Table viewName not found')
    }

  }

  /**
   * Initialize by view ID
   * Used when navigating directly to a view (not through a table)
   */
  async function initializeByView(viewId: string): Promise<void> {
    // Get view info
    const viewData = await query<CaseViewRecord>(`SELECT * FROM case_views WHERE id = $1`, [viewId])
    if (viewData.length === 0) {
      throw new Error('View not found')
    }

    const view = viewData[0]

    // Get the associated table info
    const tableData = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [view.tableId])
    if (tableData.length === 0) {
      throw new Error('Associated table not found')
    }

    const table = tableData[0]
    tableId.value = table.id
    physicalTableName.value = table.tableName
    reference_entity_id.value = table.reference_entity_id

    // Load fields

  }

  /**
   * Create a relation column from an existing column
   * Matches values from the source column with values in the target table's field
   * @param displayFieldNames - Array of field names to display (from target table)
   */
  async function createRelationFromColumn(
    sourceFieldName: string,
    targetTableId: string,
    targetFieldId: string,
    displayFieldNames: string[],
    relationColumnName: string
  ): Promise<void> {
    if (!tableId.value || !physicalTableName.value) {
      throw new Error('Table not initialized')
    }

    if (!displayFieldNames || displayFieldNames.length === 0) {
      throw new Error('At least one display field is required')
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

    // Check if a relation to this target table already exists
    const existingRelations = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields
       WHERE "tableId" = $1
       AND "businessType" = 'relation'
       AND "relationTableId" = $2`,
      [tableId.value, targetTableId]
    )

    let relationFieldName: string
    let isAddingToExistingRelation = false

    if (existingRelations.length > 0) {
      // Relation exists - merge display fields
      const relationField = existingRelations[0]
      relationFieldName = relationField.fieldName

      const currentDisplayFieldNames = relationField.displayFieldNames || []

      // Add only new field names that don't already exist
      const newFieldNames = displayFieldNames.filter((name) => !currentDisplayFieldNames.includes(name))

      if (newFieldNames.length === 0) {
        throw new Error(`All selected display fields are already in the relation to table "${targetTable.name}".`)
      }

      // Merge existing and new display field names
      const updatedDisplayFieldNames = [...currentDisplayFieldNames, ...newFieldNames]

      await query(
        `UPDATE case_fields
         SET "displayFieldNames" = $1, "updatedAt" = $2
         WHERE id = $3`,
        [ensurePlainArray(updatedDisplayFieldNames), new Date(), relationField.id]
      )

      isAddingToExistingRelation = true
    } else {
      // Create new relation field
      const now = new Date()

      const sanitizedTargetName = targetTable.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')

      relationFieldName = `rel_${sourceFieldName}_to_${sanitizedTargetName}`

      // Check if a field with this name already exists
      const existingFieldWithName = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2`, [
        tableId.value,
        relationFieldName
      ])

      if (existingFieldWithName.length > 0) {
        throw new Error(`A relation field "${relationFieldName}" already exists.`)
      }

      const newFieldId = crypto.randomUUID()

      const displayStructure: FieldDisplayStructure = {
        type: 14, // ColumnFieldType.Relation
        properties: {
          relationTableId: targetTableId,
          relationFieldId: targetFieldId
        }
      }

      const currentUserId = getCurrentUserId()
      await query(
        `INSERT INTO case_fields (
          id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
          "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
          "isReference", "relationTableId", "displayFieldNames",
          "lookupColumnName", "lookupFieldId",
          "createdBy", "createdAt", "updatedBy", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          newFieldId,
          tableId.value,
          relationFieldName,
          relationColumnName,
          'relation',
          'uuid[]',
          JSON.stringify(displayStructure),
          false,
          false,
          true,
          false,
          true,
          targetTableId,
          ensurePlainArray(displayFieldNames), // Convert to plain array to avoid DataCloneError
          sourceFieldName,
          targetFieldId,
          currentUserId,
          now,
          currentUserId,
          now
        ]
      )

      // Add the new relation column to the physical table
      await exec(`ALTER TABLE "${physicalTableName.value}" ADD COLUMN "${relationFieldName}" uuid[]`)

      // Populate the relation column by matching values
      const sourceRows = await query<Record<string, any>>(
        `SELECT id, "${sourceFieldName}" FROM "${physicalTableName.value}"
         WHERE "${sourceFieldName}" IS NOT NULL`
      )

      const targetRows = await query<Record<string, any>>(
        `SELECT id, "${targetField.fieldName}" FROM "${targetTable.tableName}"
         WHERE "${targetField.fieldName}" IS NOT NULL`
      )

      // Build lookup map
      const valueLookup = new Map<string, Set<string>>()
      for (const targetRow of targetRows) {
        const value = String(targetRow[targetField.fieldName])
        if (!valueLookup.has(value)) {
          valueLookup.set(value, new Set())
        }
        valueLookup.get(value)!.add(targetRow.id)
      }

      // Build batch updates
      const updates: Array<{ id: string; relationIds: string[] }> = []
      for (const sourceRow of sourceRows) {
        const sourceValue = String(sourceRow[sourceFieldName])
        const targetIds = valueLookup.get(sourceValue)

        if (targetIds && targetIds.size > 0) {
          updates.push({
            id: sourceRow.id,
            relationIds: Array.from(targetIds)
          })
        }
      }

      // Batch update
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
  }

  // Return combined API (maintains backwards compatibility)
  return {
    // IDs
    tableId,
    physicalTableName,
    reference_entity_id,

    // Table Data (from dataComposable)
    // loading: dataComposable.loading,
    // error: dataComposable.error,
    // tableData: dataComposable.tableData,
    // queryParams: dataComposable.queryParams,
    // getTableData: dataComposable.getTableData,
    // refresh: dataComposable.refresh,
    // addRow: dataComposable.addRow,
    // updateRow: dataComposable.updateRow,
    // deleteRow: dataComposable.deleteRow,
    // queryTableByName: dataComposable.queryTableByName,


    // Virtual columns (new!)

    // Initialize
    initializeTableView,
    initializeByView,

    // Relations
    createRelationFromColumn
  }
}
