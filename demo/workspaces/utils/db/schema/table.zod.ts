import { z } from 'zod'

export const ColumnTypeSchema = z.enum([
  'text',
  'long_text',
  'number',
  'currency',
  'date',
  'checkbox',
  'switch',
  'email',
  'phone',
  'url',
  'select',
  'multi_select',
  'color',
  'geolocation',
  'relation',
  'lookup',
  'formula',
  'attachment'
])

export const ColumnConfigSchema = z.object({
  // Text
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  placeholder: z.string().optional(),
  pattern: z.string().optional(),
  allowMultiLine: z.boolean().optional(),
  
  // Number
  min: z.number().optional(),
  max: z.number().optional(),
  decimals: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  
  // Date
  displayFormat: z.enum(['date', 'datetime', 'time', 'duration']).optional(),
  formatString: z.string().optional(),
  timezone: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  
  // Checkbox/Switch
  trueIcon: z.string().optional(),
  falseIcon: z.string().optional(),
  trueLabel: z.string().optional(),
  falseLabel: z.string().optional(),
  
  // Select/Multi-select
  options: z.array(z.object({
    label: z.string(),
    value: z.string().optional(),
    color: z.string().optional()
  })).optional(),
  allowCustom: z.boolean().optional(),
  maxSelections: z.number().optional(),
  
  // Currency
  currency: z.string().optional(),
  symbol: z.string().optional(),
  symbolPosition: z.enum(['before', 'after']).optional(),
  precision: z.number().optional(),
  compactDisplay: z.boolean().optional(),
  compactThreshold: z.number().optional(),
  
  // Color
  colorFormat: z.enum(['hex', 'rgb', 'hsl']).optional(),
  allowAlpha: z.boolean().optional(),
  
  // Phone
  allowCountryCode: z.boolean().optional(),
  limitCountries: z.array(z.string()).optional(),
  
  // URL
  openInNewTab: z.boolean().optional(),
  
  // Relation
  targetTableId: z.string().optional(),
  displayColumnId: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  cascadeDelete: z.enum(['restrict', 'cascade', 'set_null']).optional(),
  
  // Lookup
  relationColumnId: z.string().optional(),
  targetColumnId: z.string().optional(),
  
  // Formula
  formula: z.string().optional(),
  returnType: z.enum(['number', 'text', 'date', 'boolean']).optional(),
  
  // Attachment
  showThumbnail: z.boolean().optional(),
  allowedTypes: z.array(z.string()).optional(),
  maxSize: z.number().optional(),
  maxFiles: z.number().optional(),
  
  // Generic
  description: z.string().optional(),
  helpText: z.string().optional()
})

export const ValidationRulesSchema = z.object({
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  regex: z.string().optional(),
  custom: z.string().optional(),
  errorMessage: z.string().optional()
})

export const DataTableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  tableName: z.string(),
  workspaceId: z.string().uuid(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  formJson: z.any().nullable(),
  cardJson: z.any().nullable(),
  dashboardJson: z.any().nullable(),
  listJson: z.any().nullable(),
  createdBy: z.string().uuid().nullable(),
  updateToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const DataTableColumnSchema = z.object({
  id: z.string().uuid(),
  dataTableId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string(),
  label: z.string(),
  type: ColumnTypeSchema,
  required: z.boolean(),
  order: z.number(),
  defaultValue: z.string().nullable(),
  isUnique: z.boolean(),
  isHidden: z.boolean(),
  isPrimaryDisplay: z.boolean(),
  config: ColumnConfigSchema.nullable(),
  validationRules: ValidationRulesSchema.nullable(),
  createdBy: z.string().uuid().nullable(),
  updateToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const TableMigrationSchema = z.object({
  id: z.string().uuid(),
  dataTableId: z.string().uuid(),
  version: z.number(),
  migrationSql: z.string(),
  rollbackSql: z.string().nullable(),
  description: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  updateToken: z.string().nullable(),
  executedAt: z.date()
})

export type DataTableZodType = z.infer<typeof DataTableSchema>
export type DataTableColumnZodType = z.infer<typeof DataTableColumnSchema>
export type TableMigrationZodType = z.infer<typeof TableMigrationSchema>
export type ColumnConfigZodType = z.infer<typeof ColumnConfigSchema>
export type ValidationRulesZodType = z.infer<typeof ValidationRulesSchema>

