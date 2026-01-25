import type { CaseFieldRecord, CaseViewRecord, CaseTableRecord, FieldDisplayStructure } from '../utils/db/schema/newTableSchema'
import { ColumnContextKey, type ColumnContext, type ColumnConfig } from '#imports'
import type { OrdersParam } from '@nicepkg/dp-mdTable/composables/useColumns'
import { ensurePlainArray } from './useTableFields'

export interface UseTableColumnsOptions {
  tableId: Ref<string>
  entityId: Ref<string>
  physicalTableName: Ref<string>
  fields: Ref<CaseFieldRecord[]>
  currentView: Ref<CaseViewRecord | null>
  columnFilterRules: Ref<any[]>
  columnSortRules: Ref<any[]>
  columnGroupRules: Ref<any[]>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  exec: (sql: string) => Promise<any>
  getField: (fieldName: string) => CaseFieldRecord | undefined
  updateView: (viewId: string, updates: Partial<CaseViewRecord>) => Promise<void>
  addField: (field: Partial<CaseFieldRecord>, addToDefaultView?: boolean) => Promise<CaseFieldRecord>
  updateFieldFn: (fieldName: string, updates: Partial<CaseFieldRecord>) => Promise<void>
  deleteField: (fieldName: string) => Promise<void>
}

// Relation column type constant
const RELATION_TYPE = 14 // ColumnFieldType.MagicLink = Relation

export function useTableColumns(options: UseTableColumnsOptions) {
  const {
    tableId,
    entityId,
    physicalTableName,
    fields,
    currentView,
    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    query,
    exec,
    getField,
    updateView,
    addField,
    updateFieldFn,
    deleteField
  } = options

  const columns = ref<ColumnConfig[]>([])
  const addColumnPopoverRef = ref()
  const gridRef = ref<any>()

  /**
   * Convert CaseFieldRecord to ColumnConfig for dp-mdTable compatibility
   */
  function fieldToColumnConfig(field: CaseFieldRecord): ColumnConfig {
    const width = Math.max(field.fieldNameAlias.length * 13, 100) + 20
    const headerAlign = field.displayStructure?.type === 2 ? 'right' : 'left'

    // Build properties from displayStructure.properties
    let properties = field.displayStructure?.properties as Record<string, any> | undefined

    // For relation fields, merge displayFieldNames from field record into properties
    if (field.businessType === 'relation') {
      properties = {
        ...properties,
        displayFieldNames: field.displayFieldNames || [],
        relationTableId: field.relationTableId,
        // Set displayField to first field name for backward compatibility
        displayField: field.displayFieldNames?.[0] || ''
      }
    }

    return {
      id: field.id,
      dataTableId: field.tableId ?? undefined,
      field: field.fieldName,
      title: field.fieldNameAlias,
      width,
      type: field.displayStructure?.type as any,
      properties,
      headerAlign
    }
  }

  /**
   * Create a virtual column config for a relation display field
   * Virtual columns are view-specific and show one display field from a relation
   * Uses type 15 (VirtualColumn) instead of type 14 (MagicLink)
   */
  function createVirtualColumnConfig(
    relationField: CaseFieldRecord,
    displayFieldName: string
  ): ColumnConfig {
    const width = Math.max(displayFieldName.length * 13, 100) + 20
    
    return {
      id: `${relationField.id}_${displayFieldName}`,
      dataTableId: relationField.tableId ?? undefined,
      field: `${relationField.fieldName}.${displayFieldName}`,
      title: `${relationField.fieldNameAlias} (${displayFieldName})`,
      width,
      type: 15, // ColumnFieldType.VirtualColumn
      properties: {
        sourceRelationField: relationField.fieldName,
        displayFieldName: displayFieldName,
        relationTableId: relationField.relationTableId,
        displayMode: 'text',
        aggregation: 'all',
        showUniqueOnly: false,
        separator: ', '
      },
      headerAlign: 'left'
    }
  }

  /**
   * Get a column by field name
   */
  function getColumn(fieldName: string): ColumnConfig | undefined {
    const field = getField(fieldName)
    return field ? fieldToColumnConfig(field) : undefined
  }

  /**
   * Get all columns based on current view's fields
   * 
   * Column types:
   * - Regular field: "company_name" -> normal column
   * - Relation column: "rel_company" -> shows all displayFieldNames combined
   * - Virtual column: "rel_company.email" -> shows one display field separately
   */
  async function getAllColumns(): Promise<ColumnConfig[]> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    const columnsData = currentView.value.fields.reduce<ColumnConfig[]>((result, viewFieldName) => {
      if (viewFieldName.includes('.')) {
        console.log('viewFieldName', viewFieldName)
        // Virtual column: rel_company.email
        const [relationFieldName, displayFieldName] = viewFieldName.split('.')
        const field = getField(relationFieldName)
        
        if (field && field.businessType === 'relation') {
          const virtualColumnConfig = createVirtualColumnConfig(field, displayFieldName)
          console.log('virtualColumnConfig', virtualColumnConfig)
          result.push(virtualColumnConfig)
        }
      } else {
        // Regular or relation column
        const field = getField(viewFieldName)
        if (field) {
          result.push(fieldToColumnConfig(field))
        }
      }
     
      return result
    }, [])
    console.log('result', columnsData)
    columns.value = columnsData
    return columnsData
  }

  /**
   * Add a virtual column (extract one display field from a relation as a separate column)
   */
  async function addVirtualColumn(
    relationFieldName: string,
    displayFieldName: string,
    position?: { targetColumn: string; side: 'left' | 'right' }
  ): Promise<void> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    const virtualFieldName = `${relationFieldName}.${displayFieldName}`
    
    // Check if virtual column already exists
    if (currentView.value.fields.includes(virtualFieldName)) {
      throw new Error(`Virtual column ${virtualFieldName} already exists`)
    }

    let updatedFields = [...currentView.value.fields]

    if (position) {
      // Insert at specific position
      const targetIndex = updatedFields.indexOf(position.targetColumn)
      if (targetIndex !== -1) {
        const insertIndex = position.side === 'left' ? targetIndex : targetIndex + 1
        updatedFields.splice(insertIndex, 0, virtualFieldName)
      } else {
        updatedFields.push(virtualFieldName)
      }
    } else {
      // Find the relation column and insert after it
      const relationIndex = updatedFields.indexOf(relationFieldName)
      if (relationIndex !== -1) {
        updatedFields.splice(relationIndex + 1, 0, virtualFieldName)
      } else {
        updatedFields.push(virtualFieldName)
      }
    }

    await updateView(currentView.value.id, { fields: updatedFields })
    await getAllColumns()
  }

  /**
   * Remove a virtual column
   */
  async function removeVirtualColumn(virtualFieldName: string): Promise<void> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    if (!virtualFieldName.includes('.')) {
      throw new Error('Not a virtual column')
    }

    const updatedFields = currentView.value.fields.filter((f) => f !== virtualFieldName)
    await updateView(currentView.value.id, { fields: updatedFields })
    await getAllColumns()
  }

  /**
   * Add a new column (creates field + adds to view)
   */
  async function addColumn(
    column: ColumnConfig,
    targetColumnName?: string,
    position?: 'left' | 'right'
  ): Promise<void> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    const isRelationType = column.type === RELATION_TYPE
    let fieldName = column.field

    // For new relation columns, generate proper field name
    if (isRelationType && column.properties?.relationTableId) {
      const targetTableData = await query<CaseTableRecord>(
        `SELECT name FROM case_tables WHERE id = $1`,
        [column.properties.relationTableId]
      )
      if (targetTableData.length > 0) {
        const targetTableName = targetTableData[0].name
        const sanitizedTitle = column.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
        const sanitizedTargetName = targetTableName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
        fieldName = `rel_${sanitizedTitle}_to_${sanitizedTargetName}`
      }
    }

    // Prepare field data
    const fieldData = await prepareFieldData(column, isRelationType, fieldName)

    // Create physical column for relation fields
    if (isRelationType && physicalTableName.value) {
      try {
        await exec(`ALTER TABLE "${physicalTableName.value}" ADD COLUMN "${fieldName}" uuid[]`)
      } catch (e) {
        console.warn('Could not add column (may already exist):', e)
      }
    }

    // Create the field
    const newField = await addField(fieldData, false)

    // Add to view at correct position
    let updatedFields = [...currentView.value.fields]
    
    if (targetColumnName) {
      const targetIndex = updatedFields.indexOf(targetColumnName)
      if (targetIndex !== -1) {
        const insertIndex = position === 'left' ? targetIndex : targetIndex + 1
        updatedFields.splice(insertIndex, 0, fieldName)
      } else {
        updatedFields.push(fieldName)
      }
    } else {
      updatedFields.push(fieldName)
    }

    await updateView(currentView.value.id, { fields: updatedFields })
    await getAllColumns()

    // Open popover to let user configure
    if (targetColumnName) {
      nextTick(() => {
        const index = columns.value.findIndex((col) => col.field === fieldName)
        if (index !== -1) {
          setTimeout(() => {
            const tableElement = gridRef.value?.$el
            const headerItem = tableElement?.querySelector(`.vxe-header--column:nth-child(${index + 2}) .mdTableHeader-trigger`)
            if (headerItem) {
              addColumnPopoverRef.value?.show(headerItem, columns.value[index])
            }
          }, 100)
        }
      })
    }
  }

  /**
   * Prepare field data based on column type
   */
  async function prepareFieldData(
    column: ColumnConfig,
    isRelationType: boolean,
    fieldName: string
  ): Promise<Partial<CaseFieldRecord>> {
    if (isRelationType) {
      if (!column.properties?.relationTableId) {
        throw new Error('relationTableId is required for relation columns')
      }

      const targetTableData = await query<CaseTableRecord>(
        `SELECT * FROM case_tables WHERE id = $1`,
        [column.properties.relationTableId]
      )
      if (targetTableData.length === 0) {
        throw new Error('Target table not found')
      }
      const targetTable = targetTableData[0]

      // Get display field names - prioritize displayFieldNames array over single displayField
      let displayFieldNames: string[] = []
      if (column.properties?.displayFieldNames?.length) {
        // Use the array directly (already contains field names)
        displayFieldNames = [...column.properties.displayFieldNames]
      } else if (column.properties?.displayField) {
        // Fallback: use single displayField for backwards compatibility
        displayFieldNames = [column.properties.displayField]
      }

      return {
        fieldName,
        fieldNameAlias: column.title,
        businessType: 'relation',
        fieldType: 'uuid[]',
        isArray: true,
        isReference: true,
        relationTableId: column.properties.relationTableId,
        displayFieldNames,
        displayStructure: {
          type: column.type,
          properties: {
            ...column.properties,
            relationTableName: targetTable.tableName
          }
        } as unknown as FieldDisplayStructure
      }
    } else {
      return {
        fieldName,
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

  /**
   * Update a column
   */
  async function updateColumn(fieldName: string, updates: Partial<ColumnConfig>): Promise<void> {
    // Check if this is a virtual column (has dot notation like "rel_company.email")
    const isVirtualColumn = fieldName.includes('.')
    
    if (isVirtualColumn) {
      // Virtual columns are view-level only - don't update the parent relation field
      // Just update the local column config and refresh
      console.log('Updating virtual column settings:', fieldName, updates)
      
      // Update the column in the local columns array with the new settings
      const columnIndex = columns.value.findIndex(col => col.field === fieldName)
      if (columnIndex !== -1) {
        const existingColumn = columns.value[columnIndex]
        columns.value[columnIndex] = {
          ...existingColumn,
          ...updates,
          properties: {
            ...existingColumn.properties,
            ...updates.properties
          }
        }
      }
      
      // Note: Virtual column settings are transient (not persisted to database)
      // They will be rebuilt from the parent relation when the view is reloaded
      // TODO: Consider storing virtual column settings in view.fieldSettings or similar
      return
    }
    
    const existingField = getField(fieldName)

    if (!existingField) {
      throw new Error('Field not found')
    }

    // Build field updates from column config
    const fieldUpdates: Partial<CaseFieldRecord> = {}

    if (updates.title) {
      fieldUpdates.fieldNameAlias = updates.title
    }

    if (updates.type !== undefined || updates.properties !== undefined) {
      fieldUpdates.displayStructure = {
        type: updates.type ?? existingField.displayStructure?.type,
        properties: updates.properties ?? existingField.displayStructure?.properties ?? {}
      } as FieldDisplayStructure
    }

    // Handle displayFieldNames update for relation fields
    if (existingField.businessType === 'relation' && updates.properties?.displayFieldNames) {
      fieldUpdates.displayFieldNames = updates.properties.displayFieldNames
    }

    if (Object.keys(fieldUpdates).length > 0) {
      await updateFieldFn(fieldName, fieldUpdates)
    }
    console.log('fieldUpdates', fieldUpdates)
    await getAllColumns()
  }

  /**
   * Delete a column
   */
  async function deleteColumn(fieldName: string): Promise<void> {
    if (!currentView.value) {
      throw new Error('No current view')
    }

    // Check if this is a virtual column
    if (fieldName.includes('.')) {
      // Just remove from view, don't delete the underlying field
      await removeVirtualColumn(fieldName)
      return
    }

    // Delete the field
    await deleteField(fieldName)

    // Remove from view (including any virtual columns derived from this field)
    const updatedFields = currentView.value.fields.filter(
      (f) => f !== fieldName && !f.startsWith(`${fieldName}.`)
    )
    await updateView(currentView.value.id, { fields: updatedFields })
    await getAllColumns()
  }

  /**
   * Save column order after drag-drop
   */
  function saveColumnOrder(newOrder: OrdersParam): void {
    if (!currentView.value) {
      return
    }

    const { newColumn, oldColumn, dragPos } = newOrder
    const originalColumns = [...columns.value]
    const currentColumns = [...originalColumns]

    const draggedColumnIndex = currentColumns.findIndex((col) => col.field === oldColumn.field)
    const targetColumnIndex = currentColumns.findIndex((col) => col.field === newColumn.field)

    if (draggedColumnIndex === -1 || targetColumnIndex === -1 || draggedColumnIndex === targetColumnIndex) {
      return
    }

    const [draggedColumn] = currentColumns.splice(draggedColumnIndex, 1)

    let insertIndex = targetColumnIndex
    if (draggedColumnIndex < targetColumnIndex) {
      insertIndex = dragPos === 'left' ? Math.max(0, targetColumnIndex - 1) : targetColumnIndex
    } else {
      insertIndex = dragPos === 'left' ? targetColumnIndex : targetColumnIndex + 1
    }

    insertIndex = Math.max(0, Math.min(insertIndex, currentColumns.length))
    currentColumns.splice(insertIndex, 0, draggedColumn)

    const newFieldOrder = currentColumns.map((col) => col.field)
    currentView.value = { ...currentView.value, fields: newFieldOrder }

    updateView(currentView.value.id, { fields: newFieldOrder })
      .then(() => {
        console.log('Column order saved successfully')
      })
      .catch((error) => {
        console.error('Failed to save column order:', error)
        columns.value = originalColumns
        if (currentView.value) {
          currentView.value = { ...currentView.value, fields: originalColumns.map((col) => col.field) }
        }
      })
  }

  /**
   * Get available tables for relation (filtered by entityId)
   */
  async function getAvailableTablesForRelation(excludeCurrentTable: boolean = false): Promise<CaseTableRecord[]> {
    if (!entityId.value) {
      throw new Error('Entity ID not available')
    }

    try {
      const whereClause = excludeCurrentTable && tableId.value
        ? `WHERE status = 'A' AND "entityId" = $1 AND id != $2`
        : `WHERE status = 'A' AND "entityId" = $1`

      const params = excludeCurrentTable && tableId.value
        ? [entityId.value, tableId.value]
        : [entityId.value]

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
      const tableFields = await query<CaseFieldRecord>(
        `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "fieldNameAlias"`,
        [targetTableId]
      )
      return tableFields
    } catch (error) {
      console.error('Error loading fields for table:', error)
      throw error
    }
  }

  /**
   * Get existing relation to a target table (if any)
   * Returns the relation field if it exists, null otherwise
   */
  async function getExistingRelationToTable(targetTableId: string): Promise<CaseFieldRecord | null> {
    try {
      const existingRelations = await query<CaseFieldRecord>(
        `SELECT * FROM case_fields 
         WHERE "tableId" = $1 
         AND "businessType" = 'relation' 
         AND "relationTableId" = $2`,
        [tableId.value, targetTableId]
      )
      return existingRelations.length > 0 ? existingRelations[0] : null
    } catch (error) {
      console.error('Error checking existing relation:', error)
      return null
    }
  }

  /**
   * Get all relation fields for the current table
   */
  function getRelationFields(): CaseFieldRecord[] {
    return fields.value.filter(f => f.businessType === 'relation')
  }

  // Provide ColumnContext
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
    getAvailableTablesForRelation,
    getFieldsForTable,
    getExistingRelationToTable,
    getRelationFields,
    addVirtualColumn,
    tableId,
    entityId
  } as ColumnContext)

  return {
    columns,
    addColumnPopoverRef,
    gridRef,
    getColumn,
    getAllColumns,
    addColumn,
    updateColumn,
    deleteColumn,
    saveColumnOrder,
    addVirtualColumn,
    removeVirtualColumn,
    getAvailableTablesForRelation,
    getFieldsForTable,
    getExistingRelationToTable,
    getRelationFields,
    fieldToColumnConfig,
    createVirtualColumnConfig
  }
}
