import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import type {
  CaseTableRecord,
  CaseFieldRecord,
  CaseViewRecord,
  FieldDisplayStructure,
  FieldBusinessType,
  FieldDatabaseType,
  CaseTableInsert
} from '../utils/db/schema/newTableSchema'
import { v7 as uuidv7 } from 'uuid'
import { getCurrentUserId } from './useCurrentUser'

/**
 * Helper composable for generating database schema from caseFields
 * and managing table migrations
 */
export function useTableSchema() {
  const { query, exec } = usePglite()

  /**
   * Generate a valid PostgreSQL table name from entity ID and slug
   * Format: ct_{entity_id with - replaced by _}_{slug}
   */
  function generateTableName(entityId: string, slug: string): string {
    const sanitizedEntityId = entityId.replace(/-/g, '_')
    const sanitizedSlug = slug
      .replace(/-/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase()
    return `ct_${sanitizedEntityId}_${sanitizedSlug}`
  }

  /**
   * Generate a view name from table name
   */
  function generateViewName(tableName: string, viewSlug: string): string {
    return `${tableName}_${viewSlug.replace(/-/g, '_')}`
  }

  /**
   * Generate a slug from a table name
   */
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Reserved column names that cannot be used as field names
   * These are used by the system or PostgreSQL
   */
  const RESERVED_COLUMN_NAMES = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'oid', 'tableoid', 'xmin', 'cmin', 'xmax', 'cmax', 'ctid']

  /**
   * Generate a field name from a title
   * Used for system columns and as fallback
   */
  function generateFieldName(title: string): string {
    let field =
      title
        .toLowerCase()
        .trim()
        .replace(/[\s\-\.]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .replace(/^(\d)/, 'col_$1') || 'column'

    // If field is a reserved name, prefix with 'col_'
    if (RESERVED_COLUMN_NAMES.includes(field)) {
      field = `col_${field}`
    }

    return field
  }

  /**
   * Map ColumnFieldType to business type
   */
  function mapFieldTypeToBusinessType(fieldType: ColumnFieldType): FieldBusinessType {
    switch (fieldType) {
      case ColumnFieldType.Number:
      case ColumnFieldType.Rating:
        return 'number'
      case ColumnFieldType.Checkbox:
        return 'boolean'
      case ColumnFieldType.DateTime:
      case ColumnFieldType.CreatedTime:
      case ColumnFieldType.LastModifiedTime:
        return 'date'
      case ColumnFieldType.Relation:
        return 'relation'
      case ColumnFieldType.Formula:
        return 'formula'
      case ColumnFieldType.Aggregation:
        return 'aggregation'
      default:
        return 'text'
    }
  }

  /**
   * Map ColumnFieldType to database type
   */
  function mapFieldTypeToDatabaseType(fieldType: ColumnFieldType): FieldDatabaseType {
    switch (fieldType) {
      case ColumnFieldType.Number:
      case ColumnFieldType.Rating:
        return 'numeric'
      case ColumnFieldType.Checkbox:
        return 'boolean'
      case ColumnFieldType.DateTime:
      case ColumnFieldType.CreatedTime:
      case ColumnFieldType.LastModifiedTime:
        return 'timestamp'
      case ColumnFieldType.User:
      case ColumnFieldType.CreatedBy:
      case ColumnFieldType.LastModifiedBy:
      case ColumnFieldType.Relation:
        return 'uuid'
      case ColumnFieldType.MultiSelect:
      case ColumnFieldType.Document:
        return 'jsonb'
      default:
        return 'text'
    }
  }

  /**
   * Map ColumnFieldType to PostgreSQL column type for CREATE TABLE
   */
  function mapFieldTypeToSqlType(fieldType: ColumnFieldType): string {
    switch (fieldType) {
      case ColumnFieldType.Number:
      case ColumnFieldType.Rating:
        return 'NUMERIC'
      case ColumnFieldType.Checkbox:
        return 'BOOLEAN'
      case ColumnFieldType.DateTime:
      case ColumnFieldType.CreatedTime:
      case ColumnFieldType.LastModifiedTime:
        return 'TIMESTAMP WITH TIME ZONE'
      case ColumnFieldType.User:
      case ColumnFieldType.CreatedBy:
      case ColumnFieldType.LastModifiedBy:
      case ColumnFieldType.Relation:
        return 'UUID'
      case ColumnFieldType.MultiSelect:
      case ColumnFieldType.Document:
        return 'JSONB'
      default:
        return 'TEXT'
    }
  }

  /**
   * Get default system columns that every table should have
   */
  function getDefaultFields(tableId: string, createdBy?: string): Partial<CaseFieldRecord>[] {
    const now = new Date()
    const createDisplayStructure = (type: ColumnFieldType): FieldDisplayStructure => ({
      type,
      properties: {}
    })

    return [
      {
        id: uuidv7(),
        tableId,
        fieldName: 'createdAt',
        fieldNameAlias: 'Created At',
        businessType: 'date',
        fieldType: 'timestamp',
        isRequired: false,
        isHidden: false,
        displayStructure: createDisplayStructure(ColumnFieldType.CreatedTime),
        createdBy,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv7(),
        tableId,
        fieldName: 'createdBy',
        fieldNameAlias: 'Created By',
        businessType: 'text',
        fieldType: 'uuid',
        isRequired: false,
        isHidden: false,
        displayStructure: createDisplayStructure(ColumnFieldType.CreatedBy),
        createdBy,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv7(),
        tableId,
        fieldName: 'updatedAt',
        fieldNameAlias: 'Updated At',
        businessType: 'date',
        fieldType: 'timestamp',
        isRequired: false,
        isHidden: false,
        displayStructure: createDisplayStructure(ColumnFieldType.LastModifiedTime),
        createdBy,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv7(),
        tableId,
        fieldName: 'updatedBy',
        fieldNameAlias: 'Updated By',
        businessType: 'text',
        fieldType: 'uuid',
        isRequired: false,
        isHidden: false,
        displayStructure: createDisplayStructure(ColumnFieldType.LastModifiedBy),
        createdBy,
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  /**
   * Generate CREATE TABLE SQL statement from fields
   */
  function generateCreateTableSql(tableName: string, fields: Partial<CaseFieldRecord>[]): string {
    const columnDefinitions: string[] = ['id UUID PRIMARY KEY DEFAULT gen_random_uuid()']

    // Add user-defined columns (filter out system columns)
    const systemFieldTypes: ColumnFieldType[] = [
      ColumnFieldType.CreatedTime,
      ColumnFieldType.LastModifiedTime,
      ColumnFieldType.CreatedBy,
      ColumnFieldType.LastModifiedBy
    ]

    for (const field of fields) {
      if (!field.fieldName) continue
      const displayType = field.displayStructure?.type
      if (displayType && systemFieldTypes.includes(displayType)) continue

      const sqlType = displayType ? mapFieldTypeToSqlType(displayType) : 'TEXT'
      const notNull = field.isRequired ? ' NOT NULL' : ''

      columnDefinitions.push(`"${field.fieldName}" ${sqlType}${notNull}`)
    }

    // Add system columns
    columnDefinitions.push(
      '"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
      '"createdBy" UUID',
      '"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
      '"updatedBy" UUID'
    )

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columnDefinitions.join(',\n  ')}\n);`
  }

  /**
   * Generate DROP TABLE SQL statement
   */
  function generateDropTableSql(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}" CASCADE;`
  }

  /**
   * Create a new case table with fields and default view
   */
  async function createCaseTable(
    tableData: Partial<CaseTableRecord>,
    fields: Partial<CaseFieldRecord>[],
    createdBy?: string
  ): Promise<{ table: CaseTableRecord; fields: CaseFieldRecord[]; view: CaseViewRecord }> {
    const tableId = tableData.id || uuidv7()
    const now = new Date()

    // Generate table name
    const tableName = generateTableName(tableData.entityId!, tableData.name || 'table')

    // Generate view name and ID for default view
    const viewName = generateViewName(tableName, 'default')
    const viewId = uuidv7()

    // Filter out system columns from user columns (we'll add them separately)
    const systemFieldTypes: ColumnFieldType[] = [
      ColumnFieldType.CreatedTime,
      ColumnFieldType.LastModifiedTime,
      ColumnFieldType.CreatedBy,
      ColumnFieldType.LastModifiedBy
    ]
    const userFields = fields.filter((f) => {
      const displayType = f.displayStructure?.type
      return !displayType || !systemFieldTypes.includes(displayType)
    })

    // Generate the CREATE TABLE SQL
    const createSql = generateCreateTableSql(tableName, userFields)

    // Create the case_tables record
    const tableRecord: CaseTableInsert = {
      id: tableId,
      name: tableData.name!,
      status: 'A',
      description: tableData.description || null,
      tableName,
      viewName: viewId,
      entityId: tableData.entityId!,
      formStructure: null,
      createdBy: createdBy || getCurrentUserId(),
      createdAt: now,
      updatedBy: createdBy || getCurrentUserId(),
      updatedAt: now
    }

    // Insert case_tables record
    await query(
      `INSERT INTO case_tables (id, name, status, description, "tableName", "viewName", "entityId", "suggestionStatus", "createdBy", "createdAt", "updatedBy", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        tableRecord.id,
        tableRecord.name,
        tableRecord.status,
        tableRecord.description,
        tableRecord.tableName,
        tableRecord.viewName,
        tableRecord.entityId,
        'none', // Initial suggestion status
        tableRecord.createdBy,
        tableRecord.createdAt,
        tableRecord.updatedBy,
        tableRecord.updatedAt
      ]
    )

    // Prepare all fields (user fields + system fields)
    const defaultFields = getDefaultFields(tableId, createdBy)
    const allFields: Partial<CaseFieldRecord>[] = [
      ...userFields.map(
        (field) =>
          ({
            ...field,
            id: field.id || uuidv7(),
            tableId,
            fieldName: field.fieldName || generateFieldName(field.fieldNameAlias || 'column'),
            businessType: field.businessType || mapFieldTypeToBusinessType(field.displayStructure?.type || ColumnFieldType.Text),
            fieldType: field.fieldType || mapFieldTypeToDatabaseType(field.displayStructure?.type || ColumnFieldType.Text),
            createdBy,
            createdAt: now,
            updatedAt: now
          }) as Partial<CaseFieldRecord>
      ),
      ...defaultFields
    ]

    // Batch insert all field records
    if (allFields.length > 0) {
      const fieldValues: any[] = []
      const valueSets: string[] = []
      let paramIndex = 1

      for (const field of allFields) {
        const placeholders = []
        for (let i = 0; i < 17; i++) {
          placeholders.push(`$${paramIndex++}`)
        }
        valueSets.push(`(${placeholders.join(', ')})`)
        
        const currentUserId = createdBy || getCurrentUserId()
        fieldValues.push(
          field.id,
          field.tableId,
          field.fieldName,
          field.fieldNameAlias,
          field.businessType || 'text',
          field.fieldType || 'text',
          JSON.stringify(field.displayStructure || null),
          field.isRequired || false,
          field.isHidden || false,
          field.isArray || false,
          field.isUnique || false,
          field.defaultValue || null,
          field.fieldLength || 0,
          currentUserId,
          field.createdAt,
          currentUserId,
          field.updatedAt
        )
      }

      const batchSql = `INSERT INTO case_fields (
        id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
        "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
        "defaultValue", "fieldLength", "createdBy", "createdAt", "updatedBy", "updatedAt"
      ) VALUES ${valueSets.join(', ')}`
      
      await query(batchSql, fieldValues)
    }

    // Create the actual PostgreSQL table
    await exec(createSql)

    // Create default view
    const viewRecord: CaseViewRecord = {
      id: viewId,
      name: 'Default View',
      description: 'Default table view',
      viewName,
      filter: null,
      sorting: null,
      grouping: null,
      tableId,
      isDefault: true,
      entityId: tableData.entityId!,
      fields: allFields.map((f) => f.fieldName!),
      createdBy: createdBy || getCurrentUserId(),
      createdAt: now,
      updatedBy: createdBy || getCurrentUserId(),
      updatedAt: now
    }

    await query(
      `INSERT INTO case_views (
        id, name, description, "viewName", filter, sorting, grouping,
        "tableId", "isDefault", "entityId", fields, "createdBy", "createdAt", "updatedBy", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        viewRecord.id,
        viewRecord.name,
        viewRecord.description,
        viewRecord.viewName,
        JSON.stringify(viewRecord.filter),
        JSON.stringify(viewRecord.sorting),
        JSON.stringify(viewRecord.grouping),
        viewRecord.tableId,
        viewRecord.isDefault,
        viewRecord.entityId,
        viewRecord.fields,
        viewRecord.createdBy,
        viewRecord.createdAt,
        viewRecord.updatedBy,
        viewRecord.updatedAt
      ]
    )

    return {
      table: tableRecord as CaseTableRecord,
      fields: allFields as CaseFieldRecord[],
      view: viewRecord
    }
  }

  /**
   * Import data rows into the created table
   */
  async function importDataRows(tableName: string, fields: Partial<CaseFieldRecord>[], rows: Record<string, any>[], createdBy?: string): Promise<number> {
    if (rows.length === 0) return 0

    // Filter out system fields
    const systemFieldTypes: ColumnFieldType[] = [
      ColumnFieldType.CreatedTime,
      ColumnFieldType.LastModifiedTime,
      ColumnFieldType.CreatedBy,
      ColumnFieldType.LastModifiedBy
    ]
    const userFields = fields.filter((f) => {
      const displayType = f.displayStructure?.type
      return !displayType || !systemFieldTypes.includes(displayType)
    })

    let importedCount = 0

    for (const row of rows) {
      const columnNames: string[] = []
      const placeholders: string[] = []
      const values: any[] = []
      let paramIndex = 1

      // Add user data columns - use fieldName for SQL column, fieldNameAlias for row data lookup
      for (const field of userFields) {
        if (!field.fieldName) continue
        // Row data is keyed by fieldNameAlias (from Excel headers)
        const value = row[field.fieldNameAlias!]

        columnNames.push(`"${field.fieldName}"`)
        placeholders.push(`$${paramIndex}`)
        values.push(value !== undefined ? value : null)
        paramIndex++
      }

      // Add system columns
      columnNames.push('"createdBy"', '"updatedBy"')
      placeholders.push(`$${paramIndex}`, `$${paramIndex + 1}`)
      values.push(createdBy || null, createdBy || null)

      const sql = `INSERT INTO "${tableName}" (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`

      try {
        await query(sql, values)
        importedCount++
      } catch (error) {
        console.error('Error importing row:', error, row)
      }
    }

    return importedCount
  }

  /**
   * Delete a case table and its metadata
   */
  async function deleteCaseTable(tableId: string): Promise<void> {
    // Get the table info first
    const tables = await query<CaseTableRecord>('SELECT * FROM case_tables WHERE id = $1', [tableId])

    if (tables.length === 0) return

    const table = tables[0]

    // Drop the actual table
    await exec(generateDropTableSql(table.tableName))

    // Delete views
    await query('DELETE FROM case_views WHERE "tableId" = $1', [tableId])

    // Delete fields
    await query('DELETE FROM case_fields WHERE "tableId" = $1', [tableId])

    // Delete table record
    await query('DELETE FROM case_tables WHERE id = $1', [tableId])
  }

  /**
   * Get table by ID
   */
  async function getCaseTableById(tableId: string): Promise<CaseTableRecord | null> {
    const tables = await query<CaseTableRecord>('SELECT * FROM case_tables WHERE id = $1', [tableId])
    return tables[0] || null
  }

  /**
   * Get fields for a table
   */
  async function getFieldsByTableId(tableId: string): Promise<CaseFieldRecord[]> {
    const fields = await query<CaseFieldRecord>('SELECT * FROM case_fields WHERE "tableId" = $1', [tableId])
    return fields
  }

  /**
   * Get views for a table
   */
  async function getViewsByTableId(tableId: string): Promise<CaseViewRecord[]> {
    const views = await query<CaseViewRecord>('SELECT * FROM case_views WHERE "tableId" = $1 ORDER BY "isDefault" DESC, name ASC', [tableId])
    return views
  }

  /**
   * Get default view for a table
   */
  async function getDefaultView(tableId: string): Promise<CaseViewRecord | null> {
    const views = await query<CaseViewRecord>('SELECT * FROM case_views WHERE "tableId" = $1 AND "isDefault" = true LIMIT 1', [tableId])
    return views[0] || null
  }

  return {
    generateTableName,
    generateViewName,
    generateSlug,
    generateFieldName,
    getDefaultFields,
    mapFieldTypeToBusinessType,
    mapFieldTypeToDatabaseType,
    mapFieldTypeToSqlType,
    generateCreateTableSql,
    generateDropTableSql,
    createCaseTable,
    importDataRows,
    deleteCaseTable,
    getCaseTableById,
    getFieldsByTableId,
    getViewsByTableId,
    getDefaultView
  }
}
