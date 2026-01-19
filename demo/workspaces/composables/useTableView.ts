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
import { ColumnContextKey, TableDataContextKey, type ColumnContext, type ColumnConfig, type TableDataContext } from '#imports'

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

  // Region: IDs and State
  const tableId = ref<string>('') // case_tables.id
  const physicalTableName = ref<string>('') // case_tables.table_name (actual PG table)
  const entityId = ref<string>('') // case_type.id
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const tableData = ref<any[]>([])
  const queryParams = ref<any>({})

  // Region: Table Data Logic
  async function getTableData(): Promise<any[]> {
    if (!physicalTableName.value || !currentView.value) {
      throw new Error('physicalTableName and currentView are required')
    }
    loading.value = true
    try {
      const data = await query(`SELECT * FROM "${physicalTableName.value}"`)
      
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
          const field = fields.value.find(f => f.fieldName === relationFieldName)
          
          if (!field || field.businessType !== 'relation' || !field.relationTableId) continue
          
          const allowMultiple = field.displayStructure?.properties?.allowMultiple || false
          
          // Get the target table info
          const targetTableData = await query<CaseTableRecord>(
            `SELECT * FROM case_tables WHERE id = $1`,
            [field.relationTableId]
          )
          
          if (targetTableData.length === 0) continue
          
          const targetTable = targetTableData[0]
          
          // Collect all relation IDs from the data
          const relationIds = new Set<string>()
          for (const row of data) {
            const value = row[field.fieldName]
            if (value) {
              if (Array.isArray(value)) {
                value.forEach(id => relationIds.add(id))
              } else {
                relationIds.add(value)
              }
            }
          }
          
          if (relationIds.size === 0) continue
          
          // Fetch all requested display fields in one query
          const displayFieldsList = Array.from(displayFieldNames)
          const selectFields = ['id', ...displayFieldsList.map(f => `"${f}"`)].join(', ')
          
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
                if (allowMultiple && Array.isArray(value)) {
                  row[displayKey] = value.map(id => displayMap.get(id) || id)
                } else {
                  row[displayKey] = displayMap.get(value) || value
                }
              }
            }
          }
        }
      }
      
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

    const columnNames = Object.keys(row).filter((k) => k !== 'id')
    const placeholders = columnNames.map((_, i) => `$${i + 1}`)
    const values = columnNames.map((k) => row[k])

    const sql = `INSERT INTO "${physicalTableName.value}" (${columnNames.map((c) => `"${c}"`).join(', ')})
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

    const updateKeys = Object.keys(row).filter((k) => k !== 'id')
    const setClauses = updateKeys.map((k, i) => `"${k}" = $${i + 1}`)
    const values = [...updateKeys.map((k) => row[k]), row.id]

    const sql = `UPDATE "${physicalTableName.value}" SET ${setClauses.join(', ')}, "updatedAt" = NOW()
                 WHERE id = $${values.length} RETURNING *`
    const data = await query(sql, values)

    const index = tableData.value.findIndex((item) => item.id === row.id)
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
    tableData.value = tableData.value.filter((item) => item.id !== id)
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
    console.log('fields', data)
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
    if(defaultView) {
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
    console.log(fieldName, baseFieldName, field)
    if (!field) {
      throw new Error('field not found')
    }
    console.log('updates', updates)
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
      const canConvert = await handleDataTypeConversion(
        baseFieldName,
        oldType,
        newType,
        oldBusinessType,
        newBusinessType
      )
      
      if (!canConvert) {
        throw new Error('Cannot convert data type. Please clear the column data first.')
      }
    }
    
    // Handle relation field display field changes
    if (field.businessType === 'relation' && updates.displayFieldIds) {
      await handleRelationDisplayFieldUpdate(field, updates.displayFieldIds)
    }

    // Column names now use camelCase in database
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const key of updateKeys) {
      setClauses.push(`"${key}" = $${paramIndex}`)
      console.log(key, updates[key as keyof CaseFieldRecord])
      const value = key === 'displayStructure' ? JSON.stringify(updates[key as keyof CaseFieldRecord]) : updates[key as keyof CaseFieldRecord]
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
    console.log('sql', sql, values)
    await query(sql, values)

    // Update local state (use base field name)
    const index = fields.value.findIndex((f) => f.fieldName === baseFieldName)
    if (index !== -1) {
      console.log(fields.value[index])
      fields.value[index] = { ...fields.value[index], ...updates }
      
      // Update all columns that reference this field (including dot notation variants)
      columns.value.forEach((col, colIndex) => {
        const colBaseFieldName = col.field.includes('.') ? col.field.split('.')[0] : col.field
        if (colBaseFieldName === baseFieldName) {
          columns.value[colIndex] = fieldToColumnConfig(fields.value[index])
        }
      })
    }
    // update columns
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
      await query(
        `UPDATE "${physicalTableName.value}" SET "${fieldName}" = NULL`
      )
      
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
        await query(
          `UPDATE "${physicalTableName.value}" SET "${fieldName}" = NULL`
        )
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
      await query(
        `UPDATE "${physicalTableName.value}" SET "${fieldName}" = NULL`
      )
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
   * Adds new display fields to the view if they don't exist
   */
  async function handleRelationDisplayFieldUpdate(
    field: CaseFieldRecord,
    newDisplayFieldIds: string[]
  ): Promise<void> {
    if (!field.relationTableId || !currentView.value) return
    
    const oldDisplayFieldIds = field.displayFieldIds || []
    const addedFieldIds = newDisplayFieldIds.filter(id => !oldDisplayFieldIds.includes(id))
    
    if (addedFieldIds.length === 0) return
    
    // Get the target table's fields to get field names
    const targetFields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 AND id = ANY($2)`,
      [field.relationTableId, addedFieldIds]
    )
    
    // Add new view fields for each added display field
    const currentFields = new Set(currentView.value.fields)
    
    for (const targetField of targetFields) {
      const viewFieldName = `${field.fieldName}.${targetField.fieldName}`
      currentFields.add(viewFieldName)
    }
    
    // Update the view
    await query(
      `UPDATE case_views SET fields = $1, "updatedAt" = $2 WHERE id = $3`,
      [Array.from(currentFields), new Date(), currentView.value.id]
    )
    
    // Update local state
    currentView.value.fields = Array.from(currentFields)
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
    if(defaultView) {
      const fields = new Set(JSON.parse(JSON.stringify(defaultView.fields)))
      fields.delete(fieldName)
      await updateView(defaultView.id, { fields: Array.from(fields) as string[] })
    }
  }

  // Region: Column mapping - convert CaseFieldRecord to ColumnConfig for dp-mdTable
  const columns = ref<ColumnConfig[]>([])
  const addColumnPopoverRef = ref()
  const columnGroupRules = ref<any[]>([])
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
  function columnConfigToField(column: ColumnConfig): Partial<CaseFieldRecord> {
    const field = getField(column.field)
    if(!currentView.value) {
      throw new Error('No current view')
    }
    if (!field) {
      return {
        tableId: currentView.value.tableId,
        fieldName: column.field,
        fieldNameAlias: column.title,
        displayStructure: {
          type: column.type,
          properties: column.properties || {}
        } as unknown as FieldDisplayStructure
      }
    }
    return {
      id: field.id,
      tableId: field.tableId ?? null, // Convert undefined to null
      fieldName: column.field,
      fieldNameAlias: column.title,
      displayStructure: {
        type: column.type,
        properties: column.properties || {}
      } as unknown as FieldDisplayStructure
    }
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


  async function addColumn(column: ColumnConfig, targetColumnName:string, position: 'left' | 'right'): Promise<void> {
    // new field is added to the default view, 
    const newField = await addField(columnConfigToField(column))
    if(!targetColumnName){
      return
    }
    // add new field to target column
    // make sure target column is in the current view
    const fieldSet = new Set(JSON.parse(JSON.stringify(currentView.value?.fields)))
    fieldSet.add(newField.fieldName as string)
    // change new field position base on targetColumnName and position
    const fieldsArray = Array.from(fieldSet) as string[]
    
    // Find the index of the target column
    const targetIndex = fieldsArray.findIndex((field) => field === targetColumnName)
    
    if (targetIndex === -1) {
      console.error('Target column not found in current view')
      return
    }
    
    // Remove the new field from its current position (end of array)
    const newFieldIndex = fieldsArray.findIndex((field) => field === newField.fieldName)
    if (newFieldIndex !== -1) {
      fieldsArray.splice(newFieldIndex, 1)
    }
    
    // Calculate insert position based on position parameter
    let insertIndex = position === 'left' ? targetIndex : targetIndex + 1
    
    // Insert the new field at the correct position
    fieldsArray.splice(insertIndex, 0, newField.fieldName as string)
    
    // Update the current view with the new field order
    if (currentView.value?.id) {
      await updateView(currentView.value.id, { fields: fieldsArray })
      await getAllColumns()
      nextTick(() => {
        // open add column popover to let user update column properties
        // step 1 get table header element
        // get index of new field
        const index = columns.value.findIndex((col) => col.field === newField.fieldName)
        if(index !== -1) {
          setTimeout(() => {
            const tableElement = gridRef.value.$el;
            // TODO : need to check if table have toggle checkbox, the index need to be adjusted
            const headerItem = tableElement.querySelector(`.vxe-header--column:nth-child(${index + 2}) .mdTableHeader-trigger`)
            console.log('headerItem', headerItem)
            if(headerItem) {
              
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
      console.error('No current view to save column order')
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

    console.log('draggedColumnIndex', draggedColumnIndex)
    console.log('targetColumnIndex', targetColumnIndex, dragPos)

    if (draggedColumnIndex === -1 || targetColumnIndex === -1) {
      console.error('Could not find columns to reorder', { draggedColumnIndex, targetColumnIndex })
      return
    }

    // If dragging to same position, no-op
    if (draggedColumnIndex === targetColumnIndex) {
      console.log('Column dropped in same position, no change needed')
      return
    }

    // Remove the dragged column from its current position
    const [draggedColumn] = currentColumns.splice(draggedColumnIndex, 1)
    console.log('draggedColumn', draggedColumn, currentColumns)

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
    console.log('newFieldOrder', newFieldOrder)

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
    const fieldUpdates = columnConfigToField(updates as ColumnConfig)
    await updateField(fieldName, fieldUpdates)
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
      const fields = await query<CaseFieldRecord>(
        `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "fieldNameAlias"`,
        [targetTableId]
      )
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
    if (!fields.value || !fields.value.length) {
      await getAllFields()
    }
    await getAllColumns()
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

    const updateKeys = Object.keys(updates).filter((k) => k !== 'id')
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
    const index = views.value.findIndex((v) => v.id === viewId)
    if (index !== -1) {
      views.value[index] = { ...views.value[index], ...updates, updatedAt: now }
    }
    if (currentView.value?.id === viewId) {
      currentView.value = { ...currentView.value, ...updates, updatedAt: now }
    }
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
   * Create a relation column from an existing column
   * Matches values from the source column with values in the target table's field
   */
  async function createRelationFromColumn(
    sourceFieldName: string,
    targetTableId: string,
    targetFieldId: string,
    displayFieldId: string,
    relationColumnName: string,
    allowMultiple: boolean = false
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
    const targetTableData = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [targetTableId]
    )
    if (targetTableData.length === 0) {
      throw new Error('Target table not found')
    }
    const targetTable = targetTableData[0]

    // Get target field (for matching)
    const targetFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [targetFieldId]
    )
    if (targetFieldData.length === 0) {
      throw new Error('Target field not found')
    }
    const targetField = targetFieldData[0]

    // Get display field (for showing in relation)
    const displayFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [displayFieldId]
    )
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
        [updatedDisplayFieldIds, new Date(), relationField.id]
      )
    } else {
      // Create new relation field
      const now = new Date()
      relationFieldName = `rel_${sourceFieldName}`
      const newFieldId = crypto.randomUUID()

      const displayStructure: FieldDisplayStructure = {
        type: 14, // ColumnFieldType.Relation
        properties: {
          relationTableId: targetTableId,
          relationFieldId: targetFieldId,
          allowMultiple
        }
      }

      // Store the display field ID in displayFieldIds array (schema expects UUIDs)
      const displayFieldIds = [displayFieldId]

      await query(
        `INSERT INTO case_fields (
          id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
          "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
          "isReference", "relationTableId", "displayFieldIds",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          newFieldId,
          tableId.value,
          relationFieldName,
          relationColumnName,
          'relation',
          allowMultiple ? 'uuid[]' : 'uuid',
          JSON.stringify(displayStructure),
          false,
          false,
          allowMultiple,
          false,
          true,
          targetTableId,
          displayFieldIds,
          now,
          now
        ]
      )
    }

    // Only create the physical column and populate data if this is a new relation
    if (existingRelations.length === 0) {
      // Add the new relation column to the physical table
      const columnType = allowMultiple ? 'uuid[]' : 'uuid'
      await exec(`ALTER TABLE "${physicalTableName.value}" ADD COLUMN "${relationFieldName}" ${columnType}`)

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

      if (allowMultiple) {
        // Build a lookup map: targetFieldValue -> array of targetRowIds
        const valueLookup = new Map<string, string[]>()
        for (const targetRow of targetRows) {
          const value = String(targetRow[targetField.fieldName])
          if (!valueLookup.has(value)) {
            valueLookup.set(value, [])
          }
          valueLookup.get(value)!.push(targetRow.id)
        }

        // Update each source row with all matched target row IDs
        for (const sourceRow of sourceRows) {
          const sourceValue = String(sourceRow[sourceFieldName])
          const targetIds = valueLookup.get(sourceValue)
          
          if (targetIds && targetIds.length > 0) {
            await query(
              `UPDATE "${physicalTableName.value}" 
               SET "${relationFieldName}" = $1 
               WHERE id = $2`,
              [targetIds, sourceRow.id]
            )
          }
        }
      } else {
        // Build a lookup map: targetFieldValue -> targetRowId (single)
        const valueLookup = new Map<string, string>()
        for (const targetRow of targetRows) {
          const value = String(targetRow[targetField.fieldName])
          valueLookup.set(value, targetRow.id)
        }

        // Update each source row with the matched target row ID
        for (const sourceRow of sourceRows) {
          const sourceValue = String(sourceRow[sourceFieldName])
          const targetId = valueLookup.get(sourceValue)
          
          if (targetId) {
            await query(
              `UPDATE "${physicalTableName.value}" 
               SET "${relationFieldName}" = $1 
               WHERE id = $2`,
              [targetId, sourceRow.id]
            )
          }
        }
      }
    }

    // Refresh fields and columns
    await getAllFields()
    
    // Add the new field to the current view, positioned right after the source field
    // Use format: relationFieldName.displayFieldName
    if (currentView.value) {
      const currentFields = [...currentView.value.fields]
      const sourceFieldIndex = currentFields.indexOf(sourceFieldName)
      const viewFieldName = `${relationFieldName}.${displayField.fieldName}`
      
      if (sourceFieldIndex !== -1) {
        // Insert the new relation field right after the source field
        currentFields.splice(sourceFieldIndex + 1, 0, viewFieldName)
      } else {
        // If source field not found in view, append to end
        currentFields.push(viewFieldName)
      }
      
      await updateView(currentView.value.id, { fields: currentFields })
      await getAllColumns()
    }
    
    // Refresh table data to show the new column with populated values
    nextTick(() => {
      gridRef.value?.commitProxy('reload')
    })
  }

  /**
   * Create a relation column in another table that links back to the current table
   * This is the reverse of createRelationFromColumn
   */
  async function createReverseRelationToOtherTable(
    sourceFieldName: string,
    targetTableId: string,
    targetFieldId: string,
    relationColumnName: string,
    displayFieldId: string,
    allowMultiple: boolean = false
  ): Promise<void> {
    if (!tableId.value || !physicalTableName.value) {
      throw new Error('Table not initialized')
    }

    // Get source field (in current table)
    const sourceField = getField(sourceFieldName)
    if (!sourceField) {
      throw new Error('Source field not found')
    }

    // Get display field (in current table)
    const displayFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [displayFieldId]
    )
    if (displayFieldData.length === 0) {
      throw new Error('Display field not found')
    }
    const displayField = displayFieldData[0]

    // Get target table info
    const targetTableData = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [targetTableId]
    )
    if (targetTableData.length === 0) {
      throw new Error('Target table not found')
    }
    const targetTable = targetTableData[0]

    // Get target field (field in target table to match against)
    const targetFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [targetFieldId]
    )
    if (targetFieldData.length === 0) {
      throw new Error('Target field not found')
    }
    const targetField = targetFieldData[0]

    // Check if the target table already has a relation back to the current table
    const existingRelations = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields 
       WHERE "tableId" = $1 
       AND "businessType" = 'relation' 
       AND "relationTableId" = $2`,
      [targetTableId, tableId.value]
    )
    
    // Get current table name for error message
    const currentTableData = await query<CaseTableRecord>(
      `SELECT name FROM case_tables WHERE id = $1`,
      [tableId.value]
    )
    const currentTableName = currentTableData[0]?.name || 'this table'
    
    let relationFieldName: string
    let relationField: CaseFieldRecord
    
    if (existingRelations.length > 0) {
      // Relation exists - check if display field is already in displayFieldIds
      relationField = existingRelations[0]
      relationFieldName = relationField.fieldName
      
      const currentDisplayFieldIds = relationField.displayFieldIds || []
      
      if (currentDisplayFieldIds.includes(displayFieldId)) {
        throw new Error(`Display field "${displayField.fieldNameAlias}" is already in the relation from "${targetTable.name}" to "${currentTableName}".`)
      }
      
      // Add the new display field to the existing relation
      const updatedDisplayFieldIds = [...currentDisplayFieldIds, displayFieldId]
      
      await query(
        `UPDATE case_fields 
         SET "displayFieldIds" = $1, "updatedAt" = $2 
         WHERE id = $3`,
        [updatedDisplayFieldIds, new Date(), relationField.id]
      )
    } else {
      // Create new relation field in the TARGET table
      const now = new Date()
      relationFieldName = `rel_to_${physicalTableName.value}`
      const newFieldId = crypto.randomUUID()

      // The display field should be the one selected by the user
      const displayStructure: FieldDisplayStructure = {
        type: 14, // ColumnFieldType.MagicLink
        properties: {
          relationTableId: tableId.value, // Links back to current table
          allowMultiple
        }
      }

      // Store the display field ID in displayFieldIds array (schema expects UUIDs)
      const displayFieldIds = [displayFieldId]

      // Insert the new relation field into target table's case_fields
      await query(
        `INSERT INTO case_fields (
          id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
          "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
          "isReference", "relationTableId", "displayFieldIds",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          newFieldId,
          targetTableId,           // Add to target table
          relationFieldName,
          relationColumnName,
          'relation',
          allowMultiple ? 'uuid[]' : 'uuid',
          JSON.stringify(displayStructure),
          false,
          false,
          allowMultiple,
          false,
          true,
          tableId.value,          // Links back to current table
          displayFieldIds,
          now,
          now
        ]
      )

      // Add the new relation column to the target table's physical table
      const columnType = allowMultiple ? 'uuid[]' : 'uuid'
      await exec(`ALTER TABLE "${targetTable.tableName}" ADD COLUMN "${relationFieldName}" ${columnType}`)
      
      // Now populate the relation column by matching values
      // Get all rows from current table (source)
      const sourceRows = await query<Record<string, any>>(
        `SELECT id, "${sourceFieldName}" FROM "${physicalTableName.value}" 
         WHERE "${sourceFieldName}" IS NOT NULL`
      )

      if (allowMultiple) {
        // Build a lookup map: sourceFieldValue -> array of sourceRowIds
        const valueLookup = new Map<string, string[]>()
        for (const sourceRow of sourceRows) {
          const value = String(sourceRow[sourceFieldName])
          if (!valueLookup.has(value)) {
            valueLookup.set(value, [])
          }
          valueLookup.get(value)!.push(sourceRow.id)
        }

        // Get all rows from target table
        const targetRows = await query<Record<string, any>>(
          `SELECT id, "${targetField.fieldName}" FROM "${targetTable.tableName}" 
           WHERE "${targetField.fieldName}" IS NOT NULL`
        )

        // Update each target row with all matched source row IDs
        for (const targetRow of targetRows) {
          const targetValue = String(targetRow[targetField.fieldName])
          const sourceIds = valueLookup.get(targetValue)
          
          if (sourceIds && sourceIds.length > 0) {
            await query(
              `UPDATE "${targetTable.tableName}" 
               SET "${relationFieldName}" = $1 
               WHERE id = $2`,
              [sourceIds, targetRow.id]
            )
          }
        }
      } else {
        // Build a lookup map: sourceFieldValue -> sourceRowId (single)
        const valueLookup = new Map<string, string>()
        for (const sourceRow of sourceRows) {
          const value = String(sourceRow[sourceFieldName])
          valueLookup.set(value, sourceRow.id)
        }

        // Get all rows from target table
        const targetRows = await query<Record<string, any>>(
          `SELECT id, "${targetField.fieldName}" FROM "${targetTable.tableName}" 
           WHERE "${targetField.fieldName}" IS NOT NULL`
        )

        // Update each target row with the matched source row ID
        for (const targetRow of targetRows) {
          const targetValue = String(targetRow[targetField.fieldName])
          const sourceId = valueLookup.get(targetValue)
          
          if (sourceId) {
            await query(
              `UPDATE "${targetTable.tableName}" 
               SET "${relationFieldName}" = $1 
               WHERE id = $2`,
              [sourceId, targetRow.id]
            )
          }
        }
      }
    }

    // Add the new field to the target table's default view
    // Use format: relationFieldName.displayFieldName
    const targetDefaultView = await query<CaseViewRecord>(
      `SELECT * FROM case_views WHERE "tableId" = $1 AND "isDefault" = true`,
      [targetTableId]
    )
    
    if (targetDefaultView.length > 0) {
      const defaultView = targetDefaultView[0]
      const fields = new Set(JSON.parse(JSON.stringify(defaultView.fields)))
      const viewFieldName = `${relationFieldName}.${displayField.fieldName}`
      fields.add(viewFieldName)

      await query(
        `UPDATE case_views SET fields = $1, "updatedAt" = $2 WHERE id = $3`,
        [Array.from(fields), new Date(), defaultView.id]
      )
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

    // Initialize
    initializeTableView,
    
    // Relations
    createRelationFromColumn,
    createReverseRelationToOtherTable
  }
}
