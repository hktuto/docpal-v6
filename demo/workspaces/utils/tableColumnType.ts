export enum ColumnFieldType {
  MultiText = 1,      // 多行文本
  Number = 2,          // 数字
  SingleSelect = 3,    // 单选
  MultiSelect = 4,     // 多选
  DateTime = 5,        // 日期
  Document = 6,      // 附件
  //TwoWayLink = 7,      // 双向关联
  URL = 8,             // 网址
  Email = 9,           // 邮箱
  Phone = 10,          // 电话
  Checkbox = 11,       // 勾选
  Rating = 12,         // 评分
  Member = 13,         // 成员
  Relation= 14,       // 关联
  // MagicLookUp = 15,    // 神奇引用/查找
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

export enum FieldColor {
  Default = 0,
  Red = 1,
  Green = 2,
  Blue = 3,
  Yellow = 4,
  Purple = 5,
  Cyan = 6,
  Gray = 7,
}

export enum SymbolAlign {
  Left = 0,
  Right = 1,
  Default = 2,
}

export interface FieldOption {
  id: string;
  name: string;
  color: string;
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
  | string; // other time zone string


export type MultiTextConfig = {
  defaultValue: string,
  maxLength: number, // default 1000,
}

export type NumberConfig = {
  symbol: string, // $ or % or other,
  precision: number, // default 2,
  symbolAlign: number // where to put the symbol, left or right or Default(left),
}

export type SingleSelectConfig = {
  options: FieldOption[],
}

export type MultiSelectConfig = {
  options: FieldOption[],
}

export type DateTimeConfig = {
  autoFill: boolean,
  dateFormat: string,
  timeZone: TimeZone,
  timeFormat: number,
}

export type DocumentConfig = {
  isMultiple: boolean,
}

export type URLConfig = {
  openInNewTab: boolean,
}

export type EmailConfig = {
  // 9: Email
}

export type PhoneConfig = {
  includeCountryCode: boolean, // if yes the phone number will be like +86 13800138000
}

export type CheckboxConfig = {
  trueIcon: string,
  falseIcon: string,
}

export type RatingConfig = {
  maxRating: number,
  allowHalf: boolean,
  allowClear: boolean,
}

export type MemberConfig = {
  isMultiple: boolean,
}

export type RelationConfig = {
  relationTableId: string,
  displayField: string,
  isMultiple: boolean,
}

export type FormulaConfig = {
  expression: string,
  returnType: 'number' | 'text' | 'date' | 'boolean',
}

export type CurrencyConfig = {
  symbol: string, // $ or % or other,
  precision: number, // default 2,
  symbolAlign: number
}

export type PercentConfig = {
  precision: number, // default 2,
}

export type TextConfig = {
  defaultValue: string,
}

export type CreatedTimeConfig = {
}

export type LastModifiedTimeConfig = {
}

export type CreatedByConfig = {
}

export type LastModifiedByConfig = {
}

export type ColumnConfig = MultiTextConfig | NumberConfig | SingleSelectConfig | MultiSelectConfig | DateTimeConfig | DocumentConfig | URLConfig | EmailConfig | PhoneConfig | CheckboxConfig | RatingConfig | MemberConfig | RelationConfig | FormulaConfig | CurrencyConfig | PercentConfig | TextConfig | CreatedTimeConfig | LastModifiedTimeConfig | CreatedByConfig | LastModifiedByConfig;

