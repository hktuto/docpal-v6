// Database System Types

// Column data types supported
export type ColumnType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'single-select'
  | 'multi-select'
  | 'checkbox'
  | 'switch'
  | 'attachment'
  | 'rating'
  | 'url'
  | 'email'
  | 'user'
  | 'relation'
  | 'fx'
  | 'rollup'    // Aggregate from related records

// View types supported
export type ViewType = 
  | 'table'     // Default grid view
  | 'kanban'    // Grouped by status/category
  | 'gantt'     // Timeline view with dates
  | 'calendar'  // Calendar view
  | 'gallery'   // Card-based gallery

// View visibility/ownership
export type ViewVisibility = 'personal' | 'shared'

// Share permission level
export type SharePermission = 'view' | 'edit'

// Dashboard scope
export type DashboardScope = 
  | 'database'  // Aggregate across all tables
  | 'table'     // Aggregate for a specific table
  | 'record'    // Detail view for a specific record

// Widget types for dashboards
export type WidgetType =
  | 'stat'          // Single number/metric
  | 'chart-bar'     // Bar chart
  | 'chart-line'    // Line chart
  | 'chart-pie'     // Pie chart
  | 'chart-donut'   // Donut chart
  | 'table'         // Mini table
  | 'list'          // Simple list
  | 'relations'     // Related records (for record-level)

// Select option for single/multi select columns
export interface SelectOption {
  id: string
  label: string
  color?: string
}

// User reference
export interface UserRef {
  id: string
  name: string
  avatar?: string
  email?: string
}

// Attachment file
export interface AttachmentFile {
  id: string
  name: string
  url: string
  size: number
  type: string
}

// Relation configuration
export interface RelationConfig {
  tableId: string
  displayField: string
  multiple?: boolean
}

// Function expression configuration
export interface FxConfig {
  expression: string
  resultType: 'text' | 'number' | 'date'
}

// Rollup aggregation types
export type RollupAggregation =
  | 'count'          // Count of related records
  | 'count-unique'   // Count of unique values
  | 'sum'            // Sum of values
  | 'avg'            // Average of values
  | 'min'            // Minimum value
  | 'max'            // Maximum value
  | 'median'         // Median value
  | 'range'          // Max - Min
  | 'earliest'       // Earliest date
  | 'latest'         // Latest date

// Rollup configuration
export interface RollupConfig {
  relationField: string         // Which relation field to use
  aggregateField: string         // Which field in related records to aggregate
  aggregation: RollupAggregation // Type of aggregation
}

// Display format for number columns
export type NumberDisplayFormat = 
  | 'plain'       // 1234.56
  | 'currency'    // $1,234.56
  | 'compact'     // 1.2K, 3.5M, 1.2B
  | 'percentage'  // 75%
  | 'accounting'  // (1,234.56) for negative

// Display format for date columns
export type DateDisplayFormat =
  | 'date'        // 2024-01-15
  | 'datetime'    // 2024-01-15 14:30
  | 'time'        // 14:30
  | 'relative'    // 2 days ago
  | 'custom'      // Use custom format string

// Display format for text columns
export type TextDisplayFormat =
  | 'plain'       // As-is
  | 'uppercase'   // ALL CAPS
  | 'lowercase'   // all lowercase
  | 'capitalize'  // First Letter Capitalized
  | 'truncate'    // First N chars...

// Display configuration for columns
export interface DisplayConfig {
  // For numbers
  numberFormat?: NumberDisplayFormat
  currencySymbol?: string      // e.g., '$', '€', '¥'
  currencyPosition?: 'prefix' | 'suffix'
  showThousandsSeparator?: boolean
  prefix?: string              // Custom prefix text
  suffix?: string              // Custom suffix text
  
  // For dates
  dateFormat?: DateDisplayFormat
  customDateFormat?: string    // e.g., 'YYYY-MM-DD HH:mm'
  
  // For text
  textFormat?: TextDisplayFormat
  truncateLength?: number      // For truncate format
}

// Column definition
export interface Column {
  id: string
  field: string
  title: string
  type: ColumnType
  width?: number
  required?: boolean
  // Type-specific options
  options?: SelectOption[] // for single-select, multi-select
  relationConfig?: RelationConfig // for relation type
  fxConfig?: FxConfig // for fx type
  rollupConfig?: RollupConfig // for rollup type
  maxRating?: number // for rating type (default 5)
  dateFormat?: string // for date type (legacy, use displayConfig)
  decimalPlaces?: number // for number type
  // Display configuration
  displayConfig?: DisplayConfig
}

// Row data (generic record)
export interface Row {
  id: string
  [key: string]: any
  createdAt: string
  updatedAt: string
  createdBy?: UserRef
}

// Visible column in a view (base table or related table column)
export interface VisibleColumn {
  id: string                       // Unique ID for this column selection
  columnId: string                 // Original column ID from source table
  field: string                    // Field name
  sourceTableId: string            // Which table this column is from
  sourceType: 'base' | 'relation'  // Is it from base table or related?
  relationField?: string           // If related, which relation field to traverse
  displayTitle?: string            // Optional custom display title
  width?: number                   // Column width override
  visible: boolean                 // Whether column is currently visible
  order: number                    // Display order
}

// Sharing configuration for a view
export interface SharedWith {
  type: 'user' | 'group' | 'role'
  id: string
  name: string
  permission: SharePermission      // View only or can edit config
  sharedAt?: string                // When it was shared
  sharedBy?: string                // User ID who shared
}

// View configuration
export interface ViewConfig {
  // Filtering (persisted)
  filters?: FilterCondition[]
  
  // Sorting (persisted)
  sorting?: SortConfig[]
  
  // Grouping (for Table view)
  groupBy?: {
    field: string                  // Primary field to group by (separate tables)
    secondaryField?: string        // Secondary field to group by (within table)
    collapsed?: string[]           // Array of group values that are collapsed
    showEmptyGroups?: boolean      // Show groups with no records
    aggregations?: {               // Aggregations to show in group headers
      field: string                // Which field to aggregate
      type: 'sum' | 'avg' | 'min' | 'max' | 'count'  // Aggregation type
    }[]
  }
  
  // For Kanban view
  kanban?: {
    groupByField: string
    showEmptyColumns?: boolean
    columnOrder?: string[]         // Order of kanban columns
  }
  
  // For Gantt view
  gantt?: {
    startDateField: string
    endDateField: string
    titleField: string
    showDependencies?: boolean
  }
  
  // For Calendar view
  calendar?: {
    dateField: string
    endDateField?: string          // For multi-day events
    titleField?: string
    colorField?: string            // Field to determine event color
  }
  
  // For Gallery view
  gallery?: {
    coverField?: string            // Attachment field for cover image
    titleField: string
    subtitleField?: string
    cardSize?: 'small' | 'medium' | 'large'
  }
  
  // Legacy fields (for backward compatibility)
  groupByField?: string
  startDateField?: string
  endDateField?: string
  dateField?: string
  coverField?: string
  titleField?: string
  visibleColumns?: string[]
  sortBy?: { field: string; order: 'asc' | 'desc' }[]
}

// View definition
export interface View {
  id: string
  name: string
  type: ViewType
  baseTableId?: string             // Which table this view is based on (for personal views)
  icon?: string
  isDefault?: boolean
  
  // Ownership & Sharing
  createdBy?: string               // User ID who created the view
  visibility?: ViewVisibility      // 'personal' | 'shared'
  sharedWith?: SharedWith[]        // Users/groups with access
  
  // Column Configuration
  columns?: VisibleColumn[]        // Columns to show (base + related)
  
  // View Configuration
  config?: ViewConfig
  
  // Timestamps
  createdAt?: string
  updatedAt?: string
}

// Detail view layout widget types
export type DetailViewWidgetType =
  | 'field'        // Single field display
  | 'section'      // Group of fields
  | 'relations'    // Related records
  | 'timeline'     // Activity timeline
  | 'stats'        // Quick stats

// Detail view widget configuration
export interface DetailViewWidget {
  id: string
  type: DetailViewWidgetType
  x: number        // Grid x position
  y: number        // Grid y position
  w: number        // Grid width (columns)
  h: number        // Grid height (rows)
  config: {
    // For 'field' type
    fieldId?: string
    
    // For 'section' type
    title?: string
    fieldIds?: string[]
    
    // For 'relations' type
    relationFieldId?: string
    displayColumns?: string[]
    
    // For 'timeline' type
    dateField?: string
    
    // For 'stats' type
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max'
    aggregationField?: string
  }
}

// Detail view layout configuration
export interface DetailViewLayout {
  widgets: DetailViewWidget[]
  colNum?: number  // Number of columns in grid (default 12)
  rowHeight?: number  // Row height in pixels (default 60)
}

// Table definition
export interface Table {
  id: string
  name: string
  icon?: string
  description?: string
  columns: Column[]
  rows: Row[]
  views: View[]
  // Table settings
  tableType?: TableType
  permissionAssignments?: TablePermissionAssignment[]
  rowLevelConditions?: RowLevelCondition[]
  detailViewLayout?: DetailViewLayout  // NEW: Custom detail view layout
  createdAt?: string
  updatedAt?: string
  createdBy?: UserRef
}

// Dashboard widget
export interface DashboardWidget {
  id: string
  title: string
  type: WidgetType
  width: number   // Grid columns (for grid-layout-plus)
  height: number  // Grid rows
  x?: number      // Grid x position
  y?: number      // Grid y position
  config: {
    // For stat widget
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max'
    field?: string
    
    // For chart widgets
    groupByField?: string
    valueField?: string
    
    // For table/list widgets
    tableId?: string
    columns?: string[]
    limit?: number
    
    // For relations widget (record-level)
    relationField?: string  // Which relation column to show
  }
}

// Dashboard definition
export interface Dashboard {
  id: string
  name: string
  icon?: string
  scope: DashboardScope
  tableId?: string        // Required if scope is 'table' or 'record'
  widgets: DashboardWidget[]
}

// Permission types
export type Permission = 'read' | 'write' | 'delete' | 'manage'

// Table permission types
export type TablePermission = 'view' | 'create' | 'edit' | 'manage'

// Table type
export type TableType = 'private' | 'public'

// Permission subject (who the permission is assigned to)
export interface PermissionSubject {
  type: 'user' | 'group' | 'role'
  id: string
  name?: string
}

// Table permission assignment
export interface TablePermissionAssignment {
  id: string
  subject: PermissionSubject
  permissions: TablePermission[]
}

// Row-level security condition
export interface RowLevelCondition {
  id: string
  name: string
  subject: PermissionSubject
  conditions: FilterCondition[]
  enabled: boolean
}

// Permission assignment (for database level)
export interface PermissionAssignment {
  userId?: string
  roleId?: string
  permissions: Permission[]
}

// Database definition
export interface Database {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  tables: Table[]
  dashboards: Dashboard[]  // Dashboards at database level
  navigation?: NavItem[]   // Custom sidebar navigation structure
  permissions?: PermissionAssignment[]
  createdAt: string
  updatedAt: string
  createdBy?: UserRef
}

// Filter condition
export interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty'
  value: any
}

// Sort configuration
export interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

// Query params for table data
export interface TableQueryParams {
  filters?: FilterCondition[]
  sort?: SortConfig[]
  page?: number
  pageSize?: number
  search?: string
}

// Mock users for demo
export interface MockUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

// Navigation context for the app
export interface NavigationContext {
  databaseId?: string
  tableId?: string
  viewId?: string
  recordId?: string
  dashboardId?: string
}

// Navigation item type
export type NavItemType = 'folder' | 'table' | 'view' | 'dashboard'

// Navigation item for custom sidebar menu
export interface NavItem {
  id: string                       // Unique identifier
  type: NavItemType                // Type of navigation item
  label: string                    // Display name in navigation
  icon?: string                    // Optional custom icon (icon name)
  description?: string             // Rich text description (especially for folders)
  targetId?: string                // For non-folder items: ID of the table/view/dashboard
  targetTableId?: string           // For views: the table the view belongs to
  children?: NavItem[]             // For folders: nested items
  isExpanded?: boolean             // For folders: expand/collapse state (default: false)
}

// Related table metadata (for column selector)
export interface RelatedTableInfo {
  relationField: string            // Field name in base table (e.g., 'company')
  relationColumn: Column           // The relation column definition
  relatedTableId: string           // ID of related table
  relatedTableName: string         // Name of related table
  relatedTableIcon?: string        // Icon of related table
  columns: Column[]                // Available columns from related table
  relationType: 'single' | 'multiple'  // Based on relationConfig.multiple
}

// Resolved column for rendering (computed at runtime)
export interface ResolvedColumn {
  id: string                       // Unique identifier
  field: string                    // Field path (e.g., 'company__name' for related)
  title: string                    // Display title
  type: ColumnType                 // Column type
  width?: number                   // Column width
  sourceType: 'base' | 'relation'  // Where the column comes from
  relationField?: string           // If related, the relation field
  originalColumn: Column           // Reference to original column definition
}
