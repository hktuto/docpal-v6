import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, unique } from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"
import { users } from "./user"
import type { ColumnFieldType, ColumnConfig } from "../../tableColumnType"


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
  detailJson: jsonb('detail_json'),
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
 * Aligned with ColumnConfig interface from dp-mdTable
 */
export const dataTableColumns = pgTable('data_table_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataTableId: uuid('data_table_id').notNull().references(() => dataTables.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  
  // Field name for SQL column (e.g., "full_name") - maps to ColumnConfig.field
  field: text('field').notNull(),
  
  // Display title (e.g., "Full Name") - maps to ColumnConfig.title
  title: text('title').notNull(),
  
  // Column type
  type: integer('type').$type<ColumnFieldType>().notNull(),
  
  // Column properties
  required: boolean('required').notNull().default(false),
  
  // Type-specific properties - maps to ColumnConfig.properties
  properties: jsonb('properties').$type<Record<string, any>>(),
  
  // Validation rules
  validationRules: jsonb('validation_rules').$type<ValidationRules>(),
  
  createdBy: uuid('created_by').references(() => users.id), // Who created this column
  updateToken: text('_update_token'), // Session token for filtering own changes in Electric sync
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
},(table) => ({
  uniqueFieldPerTable: unique('data_table_columns_table_field_unique').on(table.dataTableId, table.field),
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
