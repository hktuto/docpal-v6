import { text, timestamp, uuid, pgTable, integer, jsonb, boolean } from 'drizzle-orm/pg-core'
import { users } from './user'
import type { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { view } from 'drizzle-orm/sqlite-core'

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Item types for the case tree navigation
 */
export type CaseTreeItemType = 'folder' | 'master_table' | 'view' | 'dashboard'

/**
 * Status for tables
 */
export type CaseTableStatus = 'A' | 'I' // Active | Inactive

/**
 * Suggestion status for relation analysis
 */
export type SuggestionStatus = 'none' | 'pending' | 'processing' | 'ready' | 'error' // none: not analyzed, pending: queued, processing: in progress, ready: has suggestions, error: analysis failed

/**
 * Business types for fields (backend logic)
 */
export type FieldBusinessType = 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'formula' | 'aggregation'

/**
 * Database field types (actual PostgreSQL types)
 */
export type FieldDatabaseType = 'text' | 'integer' | 'numeric' | 'boolean' | 'timestamp' | 'uuid' | 'uuid[]' | 'jsonb'

/**
 * Display structure for frontend column configuration
 * This contains all frontend-specific display settings
 */
export interface FieldDisplayStructure {
  /** Frontend column type enum */
  type: ColumnFieldType
  /** Column display properties (varies by type) */
  properties?: Record<string, any>
  /** Validation rules for the field */
  validationRules?: {
    required?: boolean
    unique?: boolean
    regex?: string
    custom?: string
    errorMessage?: string
  }
  /** Minimum column width in pixels */
  minWidth?: number
  /** Whether the column is sortable */
  sortable?: boolean
  /** Whether the column is filterable */
  filterable?: boolean
  /** Custom cell renderer */
  cellRenderer?: string
  /** Custom header renderer */
  headerRenderer?: string
}

/**
 * Form structure for table layouts
 * Combines formJson, cardJson, detailJson, listJson
 */
export interface FormStructure {
  form?: any
  card?: any
  detail?: any
  list?: any
}

/**
 * Filter configuration for views
 */
export interface ViewFilter {
  field: string
  operator: string
  value: any
}

/**
 * Sorting configuration for views
 */
export interface ViewSorting {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Grouping configuration for views
 */
export interface ViewGrouping {
  field: string
  collapsed?: boolean
}

/**
 * View type enum
 */
export type ViewType = 'table' | 'kanban' | 'gantt' | 'calendar'

/**
 * View-specific settings based on view type
 */
export interface ViewSettings {
  /** Kanban settings */
  kanban?: {
    groupByField: string // Required: field to group by
  }
  /** Gantt settings */
  gantt?: {
    startField: string // Required: start date field
    endField: string // Required: end date field
    percentField?: string // Optional: percent complete field
  }
  /** Calendar settings */
  calendar?: {
    startField: string // Required: start date field
    endField: string // Required: end date field
  }
}

// =============================================================================
// Table Schemas (using camelCase column names for PGlite demo)
// =============================================================================

export const caseType = pgTable('case_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  entityType: text('entityType').notNull().default('case'),
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedBy: uuid('updatedBy').references(() => users.id),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const caseTree = pgTable('case_tree', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference_entity_id: uuid('reference_entity_id').references(() => caseType.id),
  label: text('label').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  item_type: text('item_type').$type<CaseTreeItemType>().notNull().default('folder'),
  itemId: text('itemId'),
  parent_id: uuid('parent_id'),
  order: integer('order').notNull().default(0),
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedBy: uuid('updatedBy').references(() => users.id),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const caseTable = pgTable('case_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').$type<CaseTableStatus>().notNull().default('A'),
  description: text('description'),
  tableName: text('tableName').notNull().unique(),
  viewName: uuid('viewName'),
  reference_entity_id: uuid('reference_entity_id')
    .notNull()
    .references(() => caseType.id),
  formStructure: jsonb('formStructure').$type<FormStructure>(),
  suggestionStatus: text('suggestionStatus').$type<SuggestionStatus>().notNull().default('none'),
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedBy: uuid('updatedBy').references(() => users.id),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const caseField = pgTable('case_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  aggregationFieldName: text('aggregationFieldName'),
  aggregationMethod: text('aggregationMethod'),
  businessType: text('businessType').$type<FieldBusinessType>().notNull().default('text'),
  defaultValue: text('defaultValue'),
  displayStructure: jsonb('displayStructure').$type<FieldDisplayStructure>(),
  fieldLength: integer('fieldLength').notNull().default(0),
  fieldName: text('fieldName').notNull(), // related field id
  fieldNameAlias: text('fieldNameAlias').notNull(), // label
  fieldType: text('fieldType').$type<FieldDatabaseType>().notNull().default('text'),
  formulaExpression: text('formulaExpression'),
  isArray: boolean('isArray').notNull().default(false),
  isHidden: boolean('isHidden').notNull().default(false),
  isReference: boolean('isReference').default(false),
  isRequired: boolean('isRequired').notNull().default(false),
  isUnique: boolean('isUnique').default(false),
  tableId: uuid('tableId').references(() => caseTable.id),
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedBy: uuid('updatedBy').references(() => users.id),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  // Relation field configuration
  displayFieldNames: text('displayFieldNames').array().notNull().default([]), // Field names from target table to display
  relationFieldId: uuid('relationFieldId'),
  relationTableId: uuid('relationTableId').references(() => caseTable.id),
  // Lookup configuration for auto-resolving relations on new rows
  lookupColumnName: text('lookupColumnName'), // Source column in current table to match (e.g., "company_name")
  lookupFieldId: uuid('lookupFieldId') // Target field ID in relation table to match against
})

export const caseView = pgTable('case_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  viewName: text('viewName').notNull().unique(),
  viewType: text('viewType').$type<ViewType>().notNull().default('table'),
  viewSettings: jsonb('viewSettings').$type<ViewSettings>(),
  filter: jsonb('filter').$type<ViewFilter[]>(),
  sorting: jsonb('sorting').$type<ViewSorting[]>(),
  grouping: jsonb('grouping').$type<ViewGrouping[]>(),
  tableId: uuid('tableId')
    .notNull()
    .references(() => caseTable.id),
  isDefault: boolean('isDefault').notNull().default(false),
  reference_entity_id: uuid('reference_entity_id')
    .notNull()
    .references(() => caseType.id),
  fields: text('fields').array().notNull().default([]),
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedBy: uuid('updatedBy').references(() => users.id),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const relationSuggestion = pgTable('relation_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceTableId: uuid('sourceTableId').notNull().references(() => caseTable.id, { onDelete: 'cascade' }),
  sourceFieldId: uuid('sourceFieldId').notNull().references(() => caseField.id, { onDelete: 'cascade' }),
  targetTableId: uuid('targetTableId').notNull().references(() => caseTable.id, { onDelete: 'cascade' }),
  targetFieldId: uuid('targetFieldId').notNull().references(() => caseField.id, { onDelete: 'cascade' }),
  matchReason: text('matchReason').notNull(), // 'name_and_value' or 'value_only'
  matchCount: integer('matchCount').notNull(), // How many values matched
  totalCount: integer('totalCount').notNull(), // Total rows analyzed
  sampleValues: text('sampleValues').array().notNull().default([]), // Sample matching values
  suggestedType: text('suggestedType').notNull().default('multiple'), // Always 'multiple'
  status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'dismissed'
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedBy: uuid('updatedBy').references(() => users.id),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

// =============================================================================
// Audit Log Schema
// =============================================================================

/**
 * Audit operation types
 */
export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_INSERT' | 'BULK_UPDATE' | 'BULK_DELETE'

/**
 * Audit log status for rollback tracking
 */
export type AuditStatus = 'active' | 'rolled_back' | 'superseded'

/**
 * Audit log table - tracks all changes for rollback capability
 */
export const auditLog = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // What was changed
  tableName: text('tableName').notNull(), // Physical table name (e.g., "case_tables", "tbl_xxx")
  tableType: text('tableType').notNull().default('system'), // 'system' for schema tables, 'dynamic' for user tables
  recordId: uuid('recordId'), // The ID of the record that was changed (null for bulk operations)
  
  // Operation details
  operation: text('operation').$type<AuditOperation>().notNull(), // INSERT, UPDATE, DELETE, BULK_*
  
  // Change data (stored as JSONB for flexibility)
  oldValues: jsonb('oldValues'), // Previous state (null for INSERT)
  newValues: jsonb('newValues'), // New state (null for DELETE)
  changedFields: text('changedFields').array(), // List of field names that changed (for UPDATE)
  
  // Bulk operation support
  affectedRecordIds: uuid('affectedRecordIds').array(), // For bulk operations, list of all affected record IDs
  affectedCount: integer('affectedCount').default(1), // Number of records affected
  
  // Rollback support
  status: text('status').$type<AuditStatus>().notNull().default('active'),
  rolledBackAt: timestamp('rolledBackAt'), // When this change was rolled back
  rolledBackBy: uuid('rolledBackBy').references(() => users.id),
  rollbackAuditId: uuid('rollbackAuditId'), // Reference to the audit log that rolled this back
  
  // Context
  reference_entity_id: uuid('reference_entity_id').references(() => caseType.id), // Workspace context
  caseTableId: uuid('caseTableId').references(() => caseTable.id), // For dynamic table changes
  
  // Metadata
  description: text('description'), // Human-readable description of the change
  metadata: jsonb('metadata'), // Additional context (e.g., import source, batch ID)
  
  // Who and when
  createdBy: uuid('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow()
})

// =============================================================================
// Type Exports (inferred from schema)
// =============================================================================

export type CaseTypeRecord = typeof caseType.$inferSelect
export type CaseTypeInsert = typeof caseType.$inferInsert

export type CaseTreeRecord = typeof caseTree.$inferSelect
export type CaseTreeInsert = typeof caseTree.$inferInsert

export type CaseTableRecord = typeof caseTable.$inferSelect
export type CaseTableInsert = typeof caseTable.$inferInsert

export type CaseFieldRecord = typeof caseField.$inferSelect
export type CaseFieldInsert = typeof caseField.$inferInsert

export type CaseViewRecord = typeof caseView.$inferSelect
export type CaseViewInsert = typeof caseView.$inferInsert

export type RelationSuggestionRecord = typeof relationSuggestion.$inferSelect
export type RelationSuggestionInsert = typeof relationSuggestion.$inferInsert

export type AuditLogRecord = typeof auditLog.$inferSelect
export type AuditLogInsert = typeof auditLog.$inferInsert
