// types/column-types.ts

// 字段类型枚举
export enum ColumnFieldType {
  SingleText = 1,      // 多行文本
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
  MagicLookUp = 15,    // 神奇引用/查找
  Formula = 16,        // 智能公式
  Currency = 17,       // 货币
  Percent = 18,        // 百分比
  Text = 19,           // 标题/单行文本
  AutoNumber = 20,     // 自增数字
  CreatedTime = 21,    // 创建时间
  LastModifiedTime = 22, // 修改时间
  CreatedBy = 23,      // 创建人
  LastModifiedBy = 24, // 修改人
  OneWayLink = 26,     // 单向关联
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
