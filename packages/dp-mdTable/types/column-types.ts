// types/column-types.ts

// 字段类型枚举
export enum ColumnFieldType {
  MultiText = 1,      // 多行文本
  Number = 2,          // 数字
  SingleSelect = 3,    // 单选
  MultiSelect = 4,     // 多选
  DateTime = 5,        // 日期
  Attachment = 6,      // 附件
  TwoWayLink = 7,      // 双向关联
  URL = 8,             // 网址
  Email = 9,           // 邮箱
  Phone = 10,          // 电话
  Checkbox = 11,       // 勾选
  Rating = 12,         // 评分
  Member = 13,         // 成员
  MagicLink = 14,      // 神奇引用/关联
  VirtualColumn = 15,  // 虚拟列 - 从关联字段提取的单独显示列
  Formula = 16,        // 智能公式
  Currency = 17,       // 货币
  Percent = 18,        // 百分比
  Text = 19,           // 标题/单行文本
  // AutoNumber = 20,     // 自增数字
  CreatedTime = 21,    // 创建时间
  LastModifiedTime = 22, // 修改时间
  CreatedBy = 23,      // 创建人
  LastModifiedBy = 24, // 修改人
  //OneWayLink = 26,     // 单向关联
}

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
  titleConfig?: {
    icon?: string
    useHTML?: boolean
    content?: string
  }
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
