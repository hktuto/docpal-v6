// types/view-config.ts
// Type definitions for customizable record views (Form, Card, Detail, List)

/**
 * Advanced customization options for views and fields
 * Allows power users to add custom CSS, JS, or templates
 */
export interface AdvancedConfig {
  /** Custom CSS styles to apply */
  customCSS?: string
  /** Custom JavaScript for dynamic behavior */
  customJS?: string
  /** Custom Vue template for rendering */
  template?: string
}

/**
 * Base field configuration for all view types
 * Used in Card, Form, Detail, and List views
 */
export interface ViewFieldConfig {
  /** Field name from the table */
  fieldName: string
  /** Grid column span (1-12, default: 6) */
  colSpan?: number
  /** Optional label override (uses field alias if not set) */
  label?: string
  /** Hide this field in the view */
  hidden?: boolean
  /** Field-level advanced customization */
  advanced?: AdvancedConfig
}

/**
 * Card view configuration
 * Used for hover previews, kanban cards, gallery cards, relation dropdowns
 */
export interface CardViewConfig {
  /** Fields to display in the card */
  fields: ViewFieldConfig[]
  /** Field to use as card title (displays prominently at top) */
  titleField?: string
  /** Field to use as subtitle (displays below title) */
  subtitleField?: string
  /** Attachment field to use as cover image */
  coverField?: string
  /** Card-level advanced customization */
  advanced?: AdvancedConfig
}

/**
 * Form view configuration
 * Used for create/edit record forms
 */
export interface FormViewConfig {
  /** Fields to display in the form */
  fields: ViewFieldConfig[]
  /** Form layout: single column or multi-column */
  layout?: 'single' | 'multi'
  /** Show field labels inline or above */
  labelPosition?: 'top' | 'left'
  /** Form-level advanced customization */
  advanced?: AdvancedConfig
}

/**
 * Detail view configuration
 * Dashboard-like widget layout for viewing record details
 */
export interface DetailViewConfig {
  /** Widgets to display */
  widgets: DetailViewWidget[]
  /** Number of grid columns (default: 12) */
  colNum?: number
  /** Row height in pixels (default: 60) */
  rowHeight?: number
  /** Detail view-level advanced customization */
  advanced?: AdvancedConfig
}

/**
 * Widget types for detail view
 */
export type DetailViewWidgetType =
  | 'field'           // Single field display
  | 'section'         // Group of fields
  | 'relations'       // Related records table
  | 'timeline'        // Activity timeline
  | 'stats'           // Quick statistics
  | 'TableInfo'       // Table info widget (Phase 1)
  | 'RelatedTableList' // Related table list widget (Phase 1)

/**
 * Widget configuration for detail view
 */
export interface DetailViewWidget {
  /** Unique widget ID */
  id: string
  /** Widget type */
  type: DetailViewWidgetType
  /** Grid x position */
  x: number
  /** Grid y position */
  y: number
  /** Grid width (columns) */
  w: number
  /** Grid height (rows) */
  h: number
  /** Widget-specific configuration */
  config: {
    /** For 'field' type: which field to display */
    fieldId?: string
    /** For 'section' type: section title */
    title?: string
    /** For 'section' type: fields in the section */
    fieldIds?: string[]
    /** For 'relations' type: which relation field */
    relationFieldId?: string
    /** For 'relations' type: columns to show from related table */
    displayColumns?: string[]
  }
  /** Widget-level advanced customization */
  advanced?: AdvancedConfig
}

/**
 * List view configuration
 * Used for dropdown lists, relation pickers, search results
 */
export interface ListViewConfig {
  /** Fields to display in each list item */
  fields: ViewFieldConfig[]
  /** Field to use as primary display */
  primaryField?: string
  /** Field to use as secondary/description */
  secondaryField?: string
  /** Show avatar/icon from this field */
  avatarField?: string
  /** List-level advanced customization */
  advanced?: AdvancedConfig
}

/**
 * Complete form structure for a table
 * Stored in case_tables.formStructure
 */
export interface FormStructure {
  /** Form view configuration (create/edit) */
  form?: FormViewConfig
  /** Card view configuration (hover, kanban, gallery) */
  card?: CardViewConfig
  /** Detail view configuration (record dashboard) */
  detail?: DetailViewConfig
  /** List view configuration (dropdowns, pickers) */
  list?: ListViewConfig
}

/**
 * Helper type for generating default configs
 */
export interface FieldInfo {
  fieldName: string
  fieldNameAlias: string
  type: string
  isSystem?: boolean
  /** Field properties (e.g., options for select fields) */
  properties?: Record<string, any>
}

/**
 * Generate a default card view config from table fields
 */
export function generateDefaultCardConfig(fields: FieldInfo[]): CardViewConfig {
  // Filter out system fields and complex types
  const displayableFields = fields.filter(f => 
    !f.isSystem && 
    f.type !== 6 && // Attachment
    f.type !== 14   // MagicLink (relation)
  )

  // Find title field (first text field)
  const titleField = displayableFields.find(f => f.type === 19 || f.type === 1)?.fieldName

  // Take first 4-5 fields for display
  const cardFields = displayableFields.slice(0, 5).map(f => ({
    fieldName: f.fieldName,
    colSpan: 6 // Default to 2-column layout
  }))

  return {
    fields: cardFields,
    titleField
  }
}

/**
 * Generate a default list view config from table fields
 */
export function generateDefaultListConfig(fields: FieldInfo[]): ListViewConfig {
  const displayableFields = fields.filter(f => 
    !f.isSystem && 
    f.type !== 6 && // Attachment
    f.type !== 14   // MagicLink
  )

  const primaryField = displayableFields.find(f => f.type === 19 || f.type === 1)?.fieldName
  const secondaryField = displayableFields.find(f => 
    f.fieldName !== primaryField && (f.type === 19 || f.type === 1)
  )?.fieldName

  return {
    fields: displayableFields.slice(0, 3).map(f => ({
      fieldName: f.fieldName,
      colSpan: 12
    })),
    primaryField,
    secondaryField
  }
}

/**
 * Generate a default form view config from table fields
 * Excludes system fields, formulas, and virtual columns
 */
export function generateDefaultFormConfig(fields: FieldInfo[]): FormViewConfig {
  // Filter out fields not suitable for forms
  const formFields = fields.filter(f => 
    !f.isSystem && 
    f.type !== 6 && // Attachment (handled separately)
    f.type !== 14 && // MagicLink (relation)
    f.type !== 16 && // Formula (read-only)
    f.type !== 15    // VirtualColumn (read-only)
  )

  const viewFields: ViewFieldConfig[] = formFields.map(f => ({
    fieldName: f.fieldName,
    colSpan: 12, // Default to full width for forms
    required: f.type !== 11 // Checkbox fields not required by default
  }))

  return {
    fields: viewFields,
    layout: 'multi',
    labelPosition: 'top',
    labelWidth: 120
  }
}
