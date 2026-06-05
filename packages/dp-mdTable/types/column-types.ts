// types/column-types.ts

// 字段类型枚举
export enum ColumnFieldType {
  MultiText = '1', // 多行文本
  Number = '2', // 数字
  SingleSelect = '3', // 单选
  MultiSelect = '4', // 多选
  DateTime = '5', // 日期
  Document = '6', // 附件
  //TwoWayLink = 7,      // 双向关联
  URL = '8', // 网址
  Email = '9', // 邮箱
  Phone = '10', // 电话
  Checkbox = '11', // 勾选
  Rating = '12', // 评分
  User = '13', // 成员
  Relation = '14', // 关联
  VirtualColumn = '15',    // 关联字段所在行的其他字段
  Formula = '16', // 智能公式 number only
  // Aggregation = 15, // sum, avg ,min, max of multiple related records ( all line item total amount in a quotation )
  // Currency = 17,       // 货币
  // Percent = 18,        // 百分比
  Text = '19', // 标题/单行文本
  // AutoNumber = 20,     // 自增数字
  CreatedTime = '21', // 创建时间
  LastModifiedTime = '22', // 修改时间
  CreatedBy = '23', // 创建人
  LastModifiedBy = '24', // 修改人
  //OneWayLink = 26,     // 单向关联
  AggVirtualColumn = '27', // 聚合虚拟列
  DocPalDoc = '28', // DocPal 文档
}
export const reverseColumnFieldType = Object.fromEntries(
  Object.entries(ColumnFieldType).map(([key, value]) => [value, key])
);
export interface FieldOption {
  id: string
  name: string
  color: string
}
export enum FieldColor {
  Default = 0,
  Red = 1,
  Green = 2,
  Blue = 3,
  Yellow = 4,
  Purple = 5,
  Cyan = 6,
  Gray = 7
}
export type TimeZone =
  | 'Pacific/Midway'
  | 'Pacific/Honolulu'
  | 'America/Anchorage'
  | 'America/Los_Angeles'
  | 'America/Denver'
  | 'America/Chicago'
  | 'America/New_York'
  | 'America/Sao_Paulo'
  | 'Atlantic/Azores'
  | 'Europe/London'
  | 'Europe/Paris'
  | 'Europe/Istanbul'
  | 'Africa/Cairo'
  | 'Europe/Moscow'
  | 'Asia/Dubai'
  | 'Asia/Karachi'
  | 'Asia/Kolkata'
  | 'Asia/Bangkok'
  | 'Asia/Shanghai'
  | 'Asia/Tokyo'
  | 'Australia/Sydney'
  | 'Pacific/Auckland'
  | 'local'
  | string // other time zone string

export type MultiTextConfig = {
  defaultValue: string
  maxLength: number // default 1000,
}
export type NumberConfig = {
  symbol: string // $ or % or other,
  precision: number // default 2,
  symbolAlign: string // where to put the symbol: 'left', 'right', or 'default'
  showThouComma?: boolean // whether to show thousand separator
}

export type SingleSelectConfig = {
  options: FieldOption[]
}

export type MultiSelectConfig = {
  options: FieldOption[]
}

export type DateTimeConfig = {
  autoFill: boolean
  dateFormat: string
  timeZone: TimeZone
  timeFormat: number
}

export type DocumentConfig = {
  isMultiple: boolean
}

export type DocPalDocCellValue = {
  id: string
  name: string
  mimeType?: string
}

export type DocPalDocConfig = Record<string, never>

export type URLConfig = {
  openInNewTab: boolean
}

export type EmailConfig = {
  // 9: Email
}

export type PhoneConfig = {
  includeCountryCode: boolean // if yes the phone number will be like +86 13800138000
}

export type CheckboxConfig = {
  trueIcon: string
  falseIcon: string
}

export type RatingConfig = {
  maxRating: number
  allowHalf: boolean
  allowClear: boolean
}

export type MemberConfig = {
  isMultiple: boolean
}

export type RelationConfig = {
  relationTableId: string
  displayField: string
  isMultiple: boolean
}

export type FormulaConfig = {
  expression: string
  returnType: 'number' | 'text' | 'date' | 'boolean'
}

export type CurrencyConfig = {
  symbol: string // $ or % or other,
  precision: number // default 2,
  symbolAlign: string // where to put the symbol: 'left', 'right', or 'default'
  showThouComma?: boolean // whether to show thousand separator
}

export type PercentConfig = {
  precision: number // default 2,
}

export type TextConfig = {
  defaultValue: string
}

export type CreatedTimeConfig = {}

export type LastModifiedTimeConfig = {}

export type CreatedByConfig = {}

export type LastModifiedByConfig = {}

export type ColumnConfig =
  | MultiTextConfig
  | NumberConfig
  | SingleSelectConfig
  | MultiSelectConfig
  | DateTimeConfig
  | DocumentConfig
  | DocPalDocConfig
  | URLConfig
  | EmailConfig
  | PhoneConfig
  | CheckboxConfig
  | RatingConfig
  | MemberConfig
  | RelationConfig
  | FormulaConfig
  | CurrencyConfig
  | PercentConfig
  | TextConfig
  | CreatedTimeConfig
  | LastModifiedTimeConfig
  | CreatedByConfig
  | LastModifiedByConfig

// 渲染模式
export enum RenderMode {
  View = 'view',
  Edit = 'edit'
}

// 渲染参数接口
export interface RenderParams {
  row: any
  column: any
  $table: any
  $grid?: any
}

// 统一模式渲染函数参数
export interface UnifiedRenderFunctionParams<T = any> {
  mode?: RenderMode
  options: Record<string, any>
  params: RenderParams
}

// 视图渲染函数参数（分离模式专用）
export interface ViewRenderFunctionParams<T = any> {
  options: Record<string, any>
  params: RenderParams
}

// 编辑渲染函数参数（分离模式专用）
export interface EditRenderFunctionParams<T = any> {
  options: Record<string, any>
  params: RenderParams
}


// 分离模式组件配置
export interface RenderComponentConfig<T = any> {
  name?: string  // 基础名称
  both?: {
    render?: (params: UnifiedRenderFunctionParams<T>) => any
    defaultOptions?: Record<string, any>
    props?: Record<string, any>
    name?: string,
    renderer?: any
  }
  view?: {
    name?: string
    props?: Record<string, any>
    render?: (params: ViewRenderFunctionParams<T>) => any
    defaultOptions?: Record<string, any>
    renderer?: any
  }
  edit?: {
    name?: string
    props?: Record<string, any>
    render?: (params: EditRenderFunctionParams<T>) => any
    defaultOptions?: Record<string, any>
    renderer?: any
  }
}

// 组件注册模式
export type ComponentConfig<T = any> = 
  | RenderComponentConfig<T>

// 选项接口定义
export interface SelectOption {
  value: string | number
  label: string
  color?: string
  icon?: string
}

export interface NumberOptions {
  precision?: number
  nullText?: string
  color?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

export interface DateTimeOptions {
  showSeconds?: boolean
  type?: 'date' | 'datetime'
}

export interface TextOptions {
  placeholder?: string
  maxLength?: number
}

export interface CurrencyOptions {
  currency?: string
  precision?: number
  step?: number
  placeholder?: string
}

/**
 * Settings for virtual columns that are persisted in the parent relation's displayStructure.virtualColumnSettings
 * These are specific to virtual column behavior, not rendering style (which comes from target field)
 */
export interface VirtualColumnSettings {
  aggregation?: 'first' | 'last' | 'all' | 'count'  // How to aggregate multiple values
  showUniqueOnly?: boolean         // Deduplicate values when multiple relations
  separator?: string               // Separator for text mode (default: ", ")
  linkToRecord?: boolean           // Click to navigate to related record
}

/**
 * Target field configuration injected into virtual column properties
 * This is loaded dynamically from the target table and contains the field's display settings
 */
export interface TargetFieldConfig {
  type: ColumnFieldType            // Target field's column type (e.g., SingleSelect, Number)
  properties: Record<string, any>  // Target field's display properties (e.g., options, format)
}

/**
 * Full options for virtual column rendering
 * Combines metadata, persisted settings, and dynamically loaded target config
 */
export interface VirtualColumnOptions {
  // Virtual column metadata
  sourceRelationField: string      // Parent relation field name (e.g., "rel_company")
  displayFieldName: string         // Display field from target table (e.g., "email")
  relationTableId?: string         // Target table ID for reference
  
  // Persisted settings (from displayStructure.virtualColumnSettings)
  aggregation?: 'first' | 'last' | 'all' | 'count'  // How to aggregate multiple values
  showUniqueOnly?: boolean         // Deduplicate values when multiple relations
  separator?: string               // Separator for text mode (default: ", ")
  linkToRecord?: boolean           // Click to navigate to related record
  
  // Dynamic target field config (loaded fresh each time, not persisted)
  targetFieldConfig?: TargetFieldConfig | null
  
  // Legacy - kept for backward compatibility but deprecated
  displayMode?: 'text' | 'chips' | 'list' | 'link'
}
