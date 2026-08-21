export type DatabaseItem = {
  [key: string]: any
}

export type ViewType = 'table' | 'card' | 'kanban' | 'gantt' | 'calendar'
type Operator = 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty'

export type DatabaseMenuRouteParams = {
  detailId: string | null
  pageType: 'setting' | 'detail'
  detailType: 'folder' | 'master_table' | 'view' | 'dashboard' | 'root' | 'record' | string
  /** For record detail view: the record ID being viewed */
  recordId?: string | null
  /** For record detail view: the table ID the record belongs to */
  tableId?: string | null
  /** For master_table detail view: the item ID of the master table */
  item_id?: string | null
  parentId?: string | null
  viewId?: string | null
}

export type ViewConfig = {
  id: string
  name: string
  type: ViewType
  columns: ViewColumn[]
  sortInfo?: SortInfo[]
  groupInfo?: GroupInfo[]
  filterInfo?: FilterInfo
  rowHeightLevel: number // 行高
  displayColumns?: any[]
  style?: ViewStyle
  dashboard?: ViewDashboardConfig
  [key: string]: any
}

export type ViewDashboardLayoutItem = {
  x: number
  y: number
  w: number
  h: number
  i: string
  component: string
  label: string
  setting?: Record<string, any>
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export type ViewDashboardConfig = {
  layout: ViewDashboardLayoutItem[]
}

// 列定义
export interface ViewColumn {
  width?: number
  id: string
  hidden?: boolean
  countMethod?: string
  fixed?: 'left' | 'right'
}

// 排序规则
export interface SortInfo {
  desc: boolean
  fieldId: string
}

// 分组信息
export interface GroupInfo {
  desc: boolean
  fieldId: string
}

// 过滤条件
export interface FilterCondition {
  value?: string[]
  fieldId: string
  operator: Operator
  fieldType: any
  conditionId: string
}

// 过滤信息
export interface FilterInfo {
  conditions: FilterCondition[]
  conjunction: 'AND' | 'OR'
}

export interface ViewStyle {
  // Card Design
  cardCount?: number
  /** 作为封面的文档列 field_name */
  coverFieldId?: string
  isColNameVisible?: boolean
  isCoverFit?: boolean
  /** 是否显示封面区域（可与 coverFieldId 独立） */
  showCover?: boolean
  isBordered?: boolean
  isCompact?: boolean
  cardShadow?: 'none' | 'small' | 'hover'
  // Kanban Design
  selectedColumnId?: string | null
  [key: string]: any
}

export const cardStyleDefault: ViewStyle = {
  cardCount: 5,
  coverFieldId: '',
  isColNameVisible: true,
  isCoverFit: true
}

export const kanbanStyleDefault: ViewStyle = {
  selectedColumnId: null
}

export const ganttStyleDefault: ViewStyle = {
  startField: null,
  endField: null,
  percentField: null
}

export const calendarStyleDefault: ViewStyle = {
  startField: null,
  endField: null
}
