import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, unique } from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"
import { users } from "./user"

/**
 * Column Types
 * Defines all supported column types for dynamic tables
 */
export type ColumnType = 
  | 'text'          // Short text (varchar)
  | 'long_text'     // Long text (text)
  | 'number'        // Numeric value
  | 'currency'      // Currency with formatting
  | 'date'          // Date/datetime
  | 'checkbox'      // Boolean checkbox
  | 'switch'        // Boolean switch
  | 'email'         // Email with validation
  | 'phone'         // Phone with formatting
  | 'url'           // URL with validation
  | 'select'        // Single select dropdown
  | 'multi_select'  // Multiple select
  | 'color'         // Color picker
  | 'geolocation'   // Lat/long coordinates
  | 'relation'      // Foreign key relation
  | 'lookup'        // Lookup value from relation
  | 'formula'       // Computed formula
  | 'attachment'    // File attachment

/**
 * Column Configuration
 * Type-specific configuration options
 */
export interface ColumnConfig {
  // Text
  maxLength?: number
  minLength?: number
  placeholder?: string
  pattern?: string
  allowMultiLine?: boolean
  
  // Number
  min?: number
  max?: number
  decimals?: number
  prefix?: string
  suffix?: string
  
  // Date
  displayFormat?: 'date' | 'datetime' | 'time' | 'duration'
  formatString?: string
  timezone?: string
  minDate?: string
  maxDate?: string
  
  // Checkbox/Switch
  trueIcon?: string
  falseIcon?: string
  trueLabel?: string
  falseLabel?: string
  
  // Select/Multi-select
  options?: Array<{ label: string; value?: string; color?: string }>
  allowCustom?: boolean
  maxSelections?: number
  
  // Currency
  currency?: string
  symbol?: string
  symbolPosition?: 'before' | 'after'
  precision?: number
  compactDisplay?: boolean
  compactThreshold?: number
  
  // Color
  colorFormat?: 'hex' | 'rgb' | 'hsl'
  allowAlpha?: boolean
  
  // Phone
  allowCountryCode?: boolean
  limitCountries?: string[]
  
  // URL
  openInNewTab?: boolean
  
  // Relation
  targetTableId?: string
  displayColumnId?: string
  allowMultiple?: boolean
  cascadeDelete?: 'restrict' | 'cascade' | 'set_null'
  
  // Lookup
  relationColumnId?: string
  targetColumnId?: string
  
  // Formula
  formula?: string
  returnType?: 'number' | 'text' | 'date' | 'boolean'
  
  // Attachment
  showThumbnail?: boolean
  allowedTypes?: string[]
  maxSize?: number // in MB
  maxFiles?: number
  
  // Generic
  description?: string
  helpText?: string
}

/**
 * Validation Rules
 * Custom validation logic for columns
 */
export interface ValidationRules {
  required?: boolean
  unique?: boolean
  regex?: string
  custom?: string // JavaScript function as string
  errorMessage?: string
}


/**
 * Data Tables
 * Metadata for user-created dynamic tables
 */
export const dataTables = pgTable('data_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  
  // Physical table name in PostgreSQL (e.g., dt_abc123)
  tableName: text('table_name').notNull().unique(),
  
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  
  description: text('description'),
  icon: text('icon'),
  
  // Layout configurations (for Phase 5+)
  formJson: jsonb('form_json'),
  cardJson: jsonb('card_json'),
  dashboardJson: jsonb('dashboard_json'),
  listJson: jsonb('list_json'),
  
  createdBy: uuid('created_by').references(() => users.id),
  updateToken: text('_update_token'), // Session token for filtering own changes in Electric sync
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueSlugPerWorkspace: unique('data_tables_workspace_slug_unique').on(table.workspaceId, table.slug),
}))

/**
 * Data Table Columns
 * Column definitions for dynamic tables
 */
export const dataTableColumns = pgTable('data_table_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataTableId: uuid('data_table_id').notNull().references(() => dataTables.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  
  // Column name in physical table (snake_case, e.g., full_name)
  name: text('name').notNull(),
  
  // Display label (e.g., "Full Name")
  label: text('label').notNull(),
  
  // Column type
  type: text('type').$type<ColumnType>().notNull(),
  
  // Column properties
  required: boolean('required').notNull().default(false),
  order: integer('order').notNull().default(0),
  defaultValue: text('default_value'),
  isUnique: boolean('is_unique').notNull().default(false),
  isHidden: boolean('is_hidden').notNull().default(false),
  isPrimaryDisplay: boolean('is_primary_display').notNull().default(false), // Main display field
  
  // Type-specific configuration
  config: jsonb('config').$type<ColumnConfig>(),
  
  // Validation rules
  validationRules: jsonb('validation_rules').$type<ValidationRules>(),
  
  createdBy: uuid('created_by').references(() => users.id), // Who created this column
  updateToken: text('_update_token'), // Session token for filtering own changes in Electric sync
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueNamePerTable: unique('data_table_columns_table_name_unique').on(table.dataTableId, table.name),
}))

/**
 * Table Migrations
 * Track schema changes for PGlite sync
 */
export const tableMigrations = pgTable('table_migrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataTableId: uuid('data_table_id').notNull().references(() => dataTables.id, { onDelete: 'cascade' }),
  
  version: integer('version').notNull(),
  migrationSql: text('migration_sql').notNull(),
  rollbackSql: text('rollback_sql'),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id), // Who executed this migration
  updateToken: text('_update_token'), // Session token for filtering own changes in Electric sync
  executedAt: timestamp('executed_at').notNull().defaultNow(),
})

// Types for use in application
export type DataTableType = typeof dataTables.$inferSelect

export type DataTableColumnType = typeof dataTableColumns.$inferSelect

export type TableMigrationType = typeof tableMigrations.$inferSelect
