import { ColumnFieldType } from '../utils/tableColumnType'
import type { DataTableColumnType, DataTableType, TableMigrationType } from '../utils/db/schema/table'
import { v7 as uuidv7 } from 'uuid'

/**
 * Helper composable for generating database schema from dataTableColumns
 * and managing table migrations
 */
export function useTableSchema() {
  const { query, exec } = usePglite()

  /**
   * Generate a valid PostgreSQL table name from workspace ID and slug
   * Format: {workspace_id with - replaced by _}_{slug}
   */
  function generateTableName(workspaceId: string, slug: string): string {
    const sanitizedWorkspaceId = workspaceId.replace(/-/g, '_')
    const sanitizedSlug = slug.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
    return `dt_${sanitizedWorkspaceId}_${sanitizedSlug}`
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
   * Reserved column names that cannot be used as slugs
   * These are used by the system or PostgreSQL
   */
  const RESERVED_COLUMN_NAMES = [
    'id', 'created_at', 'created_by', 'updated_at', 'updated_by',
    'oid', 'tableoid', 'xmin', 'cmin', 'xmax', 'cmax', 'ctid'
  ]

  /**
   * Generate a field name from a title
   * Used for system columns and as fallback
   */
  function generateFieldName(title: string): string {
    let field = title
      .toLowerCase()
      .trim()
      .replace(/[\s\-\.]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .replace(/^(\d)/, 'col_$1')
      || 'column'
    
    // If field is a reserved name, prefix with 'col_'
    if (RESERVED_COLUMN_NAMES.includes(field)) {
      field = `col_${field}`
    }
    
    return field
  }

  /**
   * Get default system columns that every table should have
   */
  function getDefaultColumns(workspaceId: string, dataTableId: string, createdBy?: string): Partial<DataTableColumnType>[] {
    const now = new Date().toISOString()
    return [
      {
        id: uuidv7(),
        dataTableId,
        workspaceId,
        field: 'created_at',
        title: 'Created At',
        type: ColumnFieldType.CreatedTime,
        required: false,
        properties: {},
        createdBy,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv7(),
        dataTableId,
        workspaceId,
        field: 'created_by',
        title: 'Created By',
        type: ColumnFieldType.CreatedBy,
        required: false,
        properties: {},
        createdBy,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv7(),
        dataTableId,
        workspaceId,
        field: 'updated_at',
        title: 'Updated At',
        type: ColumnFieldType.LastModifiedTime,
        required: false,
        properties: {},
        createdBy,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv7(),
        dataTableId,
        workspaceId,
        field: 'updated_by',
        title: 'Updated By',
        type: ColumnFieldType.LastModifiedBy,
        required: false,
        properties: {},
        createdBy,
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  /**
   * Map ColumnFieldType to PostgreSQL column type
   */
  function mapFieldTypeToSqlType(fieldType: ColumnFieldType): string {
    switch (fieldType) {
      case ColumnFieldType.Number:
      case ColumnFieldType.Currency:
      case ColumnFieldType.Percent:
      case ColumnFieldType.Rating:
        return 'NUMERIC'
      case ColumnFieldType.Checkbox:
        return 'BOOLEAN'
      case ColumnFieldType.DateTime:
      case ColumnFieldType.CreatedTime:
      case ColumnFieldType.LastModifiedTime:
        return 'TIMESTAMP WITH TIME ZONE'
      case ColumnFieldType.Member:
      case ColumnFieldType.CreatedBy:
      case ColumnFieldType.LastModifiedBy:
      case ColumnFieldType.Relation:
        return 'UUID'
      case ColumnFieldType.MultiSelect:
      case ColumnFieldType.Document:
        return 'JSONB'
      case ColumnFieldType.Text:
      case ColumnFieldType.MultiText:
      case ColumnFieldType.SingleSelect:
      case ColumnFieldType.URL:
      case ColumnFieldType.Email:
      case ColumnFieldType.Phone:
      case ColumnFieldType.Formula:
      default:
        return 'TEXT'
    }
  }

  /**
   * Get the SQL column name from a column definition
   * Uses field if available, otherwise generates from title
   */
  function getColumnSqlName(column: Partial<DataTableColumnType>): string {
    if (column.field) {
      return column.field
    }
    // Fallback: generate from title
    return generateFieldName(column.title || 'column')
  }

  /**
   * Generate CREATE TABLE SQL statement from columns
   */
  function generateCreateTableSql(tableName: string, columns: Partial<DataTableColumnType>[]): string {
    const columnDefinitions: string[] = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()'
    ]

    // Add user-defined columns
    for (const column of columns) {
      if (!column.field && !column.title) continue
      
      const colName = getColumnSqlName(column)
      const sqlType = mapFieldTypeToSqlType(column.type as ColumnFieldType)
      const notNull = column.required ? ' NOT NULL' : ''
      
      columnDefinitions.push(`"${colName}" ${sqlType}${notNull}`)
    }

    // Add system columns
    columnDefinitions.push(
      'created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
      'created_by UUID',
      'updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
      'updated_by UUID'
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
   * Generate ALTER TABLE SQL for adding a column
   */
  function generateAddColumnSql(tableName: string, column: Partial<DataTableColumnType>): string {
    if (!column.field && !column.title) throw new Error('Column field or title is required')
    
    const colName = getColumnSqlName(column)
    const sqlType = mapFieldTypeToSqlType(column.type as ColumnFieldType)
    const notNull = column.required ? ' NOT NULL' : ''
    
    return `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${colName}" ${sqlType}${notNull};`
  }

  /**
   * Create the actual data table in the database
   */
  async function createDataTable(
    dataTable: Partial<DataTableType>,
    columns: Partial<DataTableColumnType>[],
    createdBy?: string
  ): Promise<{ dataTable: DataTableType; columns: DataTableColumnType[]; migration: TableMigrationType }> {
    const dataTableId = dataTable.id || uuidv7()
    const now = new Date().toISOString()
    
    // Generate table name
    const tableName = generateTableName(dataTable.workspaceId!, dataTable.slug!)
    
    // Filter out system columns from user columns (we'll add them separately)
    const systemColumnTypes = [
      ColumnFieldType.CreatedTime,
      ColumnFieldType.LastModifiedTime,
      ColumnFieldType.CreatedBy,
      ColumnFieldType.LastModifiedBy
    ]
    const userColumns = columns.filter(c => !systemColumnTypes.includes(c.type as ColumnFieldType))
    
    // Generate the CREATE TABLE SQL
    const createSql = generateCreateTableSql(tableName, userColumns)
    const dropSql = generateDropTableSql(tableName)
    
    // Create the data_tables record
    const dataTableRecord: DataTableType = {
      id: dataTableId,
      name: dataTable.name!,
      slug: dataTable.slug!,
      tableName,
      workspaceId: dataTable.workspaceId!,
      description: dataTable.description || null,
      icon: dataTable.icon || null,
      formJson: null,
      cardJson: null,
      detailJson: null,
      listJson: null,
      createdBy: createdBy || null,
      updateToken: null,
      createdAt: now,
      updatedAt: now
    }
    
    // Insert data_tables record
    await query(
      `INSERT INTO data_tables (id, name, slug, table_name, workspace_id, description, icon, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        dataTableRecord.id,
        dataTableRecord.name,
        dataTableRecord.slug,
        dataTableRecord.tableName,
        dataTableRecord.workspaceId,
        dataTableRecord.description,
        dataTableRecord.icon,
        dataTableRecord.createdBy,
        dataTableRecord.createdAt,
        dataTableRecord.updatedAt
      ]
    )
    
    // Prepare all columns (user columns + system columns)
    const defaultColumns = getDefaultColumns(dataTable.workspaceId!, dataTableId, createdBy)
    const allColumns = [
      ...userColumns.map(col => ({
        ...col,
        id: col.id || uuidv7(),
        dataTableId,
        workspaceId: dataTable.workspaceId!,
        // Ensure field exists - generate from title if missing
        field: col.field || generateFieldName(col.title || 'column'),
        createdBy,
        createdAt: now,
        updatedAt: now
      })),
      ...defaultColumns
    ]
    
    // Insert all column records
    for (const column of allColumns) {
      await query(
        `INSERT INTO data_table_columns (id, data_table_id, workspace_id, field, title, type, required, properties, validation_rules, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          column.id,
          column.dataTableId,
          column.workspaceId,
          column.field,
          column.title,
          column.type,
          column.required || false,
          JSON.stringify(column.properties || {}),
          JSON.stringify(column.validationRules || null),
          column.createdBy,
          column.createdAt,
          column.updatedAt
        ]
      )
    }
    
    // Create the actual PostgreSQL table
    await exec(createSql)
    
    // Create migration record
    const migrationId = uuidv7()
    const migration: TableMigrationType = {
      id: migrationId,
      dataTableId,
      version: 1,
      migrationSql: createSql,
      rollbackSql: dropSql,
      description: `Initial table creation for ${dataTable.name}`,
      createdBy: createdBy || null,
      updateToken: null,
      executedAt: now
    }
    
    await query(
      `INSERT INTO table_migrations (id, data_table_id, version, migration_sql, rollback_sql, description, created_by, executed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        migration.id,
        migration.dataTableId,
        migration.version,
        migration.migrationSql,
        migration.rollbackSql,
        migration.description,
        migration.createdBy,
        migration.executedAt
      ]
    )
    
    return {
      dataTable: dataTableRecord,
      columns: allColumns as DataTableColumnType[],
      migration
    }
  }

  /**
   * Import data rows into the created table
   */
  async function importDataRows(
    tableName: string,
    columns: Partial<DataTableColumnType>[],
    rows: Record<string, any>[],
    createdBy?: string
  ): Promise<number> {
    if (rows.length === 0) return 0
    
    // Filter out system columns
    const systemColumnTypes = [
      ColumnFieldType.CreatedTime,
      ColumnFieldType.LastModifiedTime,
      ColumnFieldType.CreatedBy,
      ColumnFieldType.LastModifiedBy
    ]
    const userColumns = columns.filter(c => !systemColumnTypes.includes(c.type as ColumnFieldType))
    
    let importedCount = 0
    
    for (const row of rows) {
      const columnNames: string[] = []
      const placeholders: string[] = []
      const values: any[] = []
      let paramIndex = 1
      
      // Add user data columns - use field for SQL column name, title for row data lookup
      for (const column of userColumns) {
        if (!column.field && !column.title) continue
        const colName = getColumnSqlName(column)
        // Row data is keyed by title (from Excel headers)
        const value = row[column.title!]
        
        columnNames.push(`"${colName}"`)
        placeholders.push(`$${paramIndex}`)
        values.push(value !== undefined ? value : null)
        paramIndex++
      }
      
      // Add system columns
      columnNames.push('created_by', 'updated_by')
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
   * Delete a data table and its metadata
   */
  async function deleteDataTable(dataTableId: string): Promise<void> {
    // Get the table info first
    const tables = await query<DataTableType[]>(
      'SELECT * FROM data_tables WHERE id = $1',
      [dataTableId]
    )
    
    if (tables.length === 0) return
    
    const table = tables[0] as DataTableType
    
    // Drop the actual table
    await exec(generateDropTableSql(table.tableName))
    
    // Delete migrations
    await query('DELETE FROM table_migrations WHERE data_table_id = $1', [dataTableId])
    
    // Delete columns
    await query('DELETE FROM data_table_columns WHERE data_table_id = $1', [dataTableId])
    
    // Delete table record
    await query('DELETE FROM data_tables WHERE id = $1', [dataTableId])
  }

  return {
    generateTableName,
    generateSlug,
    generateFieldName,
    getDefaultColumns,
    mapFieldTypeToSqlType,
    getColumnSqlName,
    generateCreateTableSql,
    generateDropTableSql,
    generateAddColumnSql,
    createDataTable,
    importDataRows,
    deleteDataTable
  }
}
