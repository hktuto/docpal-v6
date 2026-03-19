import type { CaseFieldRecord, FieldDisplayStructure } from '../utils/db/schema/newTableSchema'
import { getCurrentUserId } from '../useCurrentUser'

/**
 * Field Context for field management
 */
export interface FieldContext {
  fields: Ref<CaseFieldRecord[]>
  getField: (fieldName: string) => CaseFieldRecord | undefined
  getAllFields: () => Promise<CaseFieldRecord[]>
  addField: (field: Partial<CaseFieldRecord>, addToDefaultView?: boolean) => Promise<CaseFieldRecord>
  updateField: (fieldName: string, updates: Partial<CaseFieldRecord>) => Promise<void>
  deleteField: (fieldName: string) => Promise<void>
}

export const FieldContextKey: InjectionKey<FieldContext> = Symbol('FieldContext')

/**
 * Ensure arrays are plain JavaScript arrays for PGlite compatibility
 * PGlite uses Web Workers which can't clone Proxy objects or other non-cloneable types
 */
export const ensurePlainArray = <T>(arr: T[] | readonly T[]): T[] => {
  return Array.isArray(arr) ? [...arr] : (arr as T[])
}

export interface UseTableFieldsOptions {
  tableId: Ref<string>
  physicalTableName: Ref<string>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  exec: (sql: string) => Promise<any>
  // Optional callbacks for when fields change
  onFieldAdded?: (field: CaseFieldRecord) => void
  onFieldUpdated?: (field: CaseFieldRecord) => void
  onFieldDeleted?: (fieldName: string) => void
}

export function useTableFields(options: UseTableFieldsOptions) {
  const { tableId, physicalTableName, query, exec, onFieldAdded, onFieldUpdated, onFieldDeleted } = options

  const fields = ref<CaseFieldRecord[]>([])

  /**
   * Get a field by field name
   */
  function getField(fieldName: string): CaseFieldRecord | undefined {
    // Handle dot notation (e.g., "rel_company.name" -> "rel_company")
    const baseFieldName = fieldName.includes('.') ? fieldName.split('.')[0] : fieldName
    return fields.value.find((item) => item.fieldName === baseFieldName)
  }

  /**
   * Get all fields for the current table
   */
  async function getAllFields(): Promise<CaseFieldRecord[]> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    const data = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1`, [tableId.value])
    fields.value = data
    return data
  }

  /**
   * Add a new field
   * @param field - Field data to create
   * @param addToDefaultView - Whether to add to default view (default: false, caller handles view update)
   */
  async function addField(field: Partial<CaseFieldRecord>, addToDefaultView: boolean = false): Promise<CaseFieldRecord> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!field.fieldName || !field.fieldNameAlias) {
      throw new Error('fieldName and fieldNameAlias are required')
    }

    const now = new Date()
    const currentUserId = getCurrentUserId()
    const newField: Partial<CaseFieldRecord> = {
      ...field,
      id: field.id || crypto.randomUUID(),
      tableId: tableId.value,
      createdBy: currentUserId,
      createdAt: now,
      updatedBy: currentUserId,
      updatedAt: now
    }

    const newFieldData = await query(
      `INSERT INTO case_fields (
        id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
        "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
        "defaultValue", "fieldLength", "createdBy", "createdAt", "updatedBy", "updatedAt",
        "isReference", "relationTableId", "displayFieldNames", "lookupColumnName", "lookupFieldId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
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
        newField.createdBy,
        newField.createdAt,
        newField.updatedBy,
        newField.updatedAt,
        newField.isReference || false,
        newField.relationTableId || null,
        newField.displayFieldNames || [],
        newField.lookupColumnName || null,
        newField.lookupFieldId || null
      ]
    )

    const createdField = newFieldData[0] as CaseFieldRecord
    fields.value.push(createdField)
    
    onFieldAdded?.(createdField)
    
    return createdField
  }

  /**
   * Update an existing field
   */
  async function updateField(fieldName: string, updates: Partial<CaseFieldRecord>): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!fieldName) {
      throw new Error('fieldName is required')
    }

    // Extract base field name if it's in dot notation
    const baseFieldName = fieldName.includes('.') ? fieldName.split('.')[0] : fieldName

    const field = getField(baseFieldName)
    if (!field) {
      throw new Error('field not found')
    }

    const updateKeys = Object.keys(updates).filter((key) => key !== 'id')
    if (updateKeys.length === 0) {
      return
    }

    // Check if this is a data type change
    const isBusinessTypeChange = updates.businessType && updates.businessType !== field.businessType
    const isFieldTypeChange = updates.fieldType && updates.fieldType !== field.fieldType
    const isTypeChange = isBusinessTypeChange || isFieldTypeChange

    // Handle data type changes
    if (isTypeChange && physicalTableName.value) {
      const oldType = field.fieldType
      const newType = updates.fieldType || field.fieldType
      const oldBusinessType = field.businessType
      const newBusinessType = updates.businessType || field.businessType

      const canConvert = await handleDataTypeConversion(baseFieldName, oldType, newType, oldBusinessType, newBusinessType)

      if (!canConvert) {
        throw new Error('Cannot convert data type. Please clear the column data first.')
      }
    }

    // Build update query
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const key of updateKeys) {
      setClauses.push(`"${key}" = $${paramIndex}`)

      let value = updates[key as keyof CaseFieldRecord]

      // Handle special types for PGlite compatibility
      if (key === 'displayStructure') {
        value = JSON.stringify(value)
      } else if (key === 'displayFieldNames' && Array.isArray(value)) {
        value = ensurePlainArray(value) as any
      }

      values.push(value)
      paramIndex++
    }

    // Always update updatedAt and updatedBy
    setClauses.push(`"updatedAt" = $${paramIndex}`)
    values.push(new Date().toISOString())
    paramIndex++

    setClauses.push(`"updatedBy" = $${paramIndex}`)
    values.push(getCurrentUserId())
    paramIndex++

    // Add the WHERE clause parameter
    values.push(field.id)

    const sql = `UPDATE case_fields SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`
    await query(sql, values)

    // Update local state
    const index = fields.value.findIndex((f) => f.fieldName === baseFieldName)
    if (index !== -1) {
      fields.value[index] = { ...fields.value[index], ...updates }
      onFieldUpdated?.(fields.value[index])
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
   * Delete a field
   */
  async function deleteField(fieldName: string): Promise<void> {
    if (!tableId.value) {
      throw new Error('tableId is required')
    }
    if (!fieldName) {
      throw new Error('fieldName is required')
    }
    
    await query('DELETE FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2', [tableId.value, fieldName])
    fields.value = fields.value.filter((item) => item.fieldName !== fieldName)
    
    onFieldDeleted?.(fieldName)
  }

  // Provide context
  provide(FieldContextKey, {
    fields,
    getField,
    getAllFields,
    addField,
    updateField,
    deleteField
  })

  return {
    fields,
    getField,
    getAllFields,
    addField,
    updateField,
    deleteField
  }
}

/**
 * Use the field context from a parent component
 */
export function useFieldContext(): FieldContext {
  const context = inject(FieldContextKey)
  if (!context) {
    throw new Error('FieldContext not found. Make sure useTableFields is called in a parent component.')
  }
  return context
}
