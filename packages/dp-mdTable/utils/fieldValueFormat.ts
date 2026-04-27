/**
 * 字段值格式化工具（合并 formatNumber、formatDateTime、getSelectOption(s)、formatFieldValue）
 * 供 Card、CardPreview、TableInfo 等统一使用
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { FieldInfo } from '@packages/dp-mdTable/types/view-config'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface SelectOptionLike {
  id: string
  label?: string
  name?: string
  color: string
}

/**
 * 根据 value 与 properties.options 取单选选项
 */
export function getSelectOption(
  value: any,
  properties: Record<string, any> = {}
): SelectOptionLike | null {
  if (value == null) return null
  const options = properties?.options || []
  const opt = options.find((o: any) => o.id === value)
  return opt || null
}

/**
 * 根据 value（数组）与 properties.options 取多选选项列表
 */
export function getSelectOptions(
  value: any,
  properties: Record<string, any> = {}
): SelectOptionLike[] {
  if (!value || !Array.isArray(value)) return []
  const options = properties?.options || []
  return value.map((id: string) => options.find((o: any) => o.id === id)).filter(Boolean)
}

/**
 * 按字段配置格式化日期时间（支持 dateFormat、includeTime、dateTimeFormat、timezone）
 */
export function formatDateTime(value: any, properties: Record<string, any> = {}): string {
  if (!value) return '-'
  const { dateFormat, includeTime, dateTimeFormat, timezone: tz } = properties
  try {
    const format =
      includeTime && dateTimeFormat
        ? `${dateFormat || 'YYYY-MM-DD'} ${dateTimeFormat}`
        : dateFormat || 'YYYY-MM-DD'
    let displayValue = dayjs(value).format(format)
    if (includeTime && tz) {
      displayValue = dayjs(value).tz(tz).format(format)
    }
    return displayValue
  } catch {
    return String(value)
  }
}

/**
 * 按字段配置格式化数字（precision、showThouComma）
 */
export function formatNumber(value: any, properties: Record<string, any> = {}): string {
  if (value === null || value === undefined || isNaN(Number(value))) return '-'
  const { precision = 0, showThouComma } = properties
  let formatted = Number(value).toFixed(precision)
  if (showThouComma) {
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  return formatted
}

/**
 * 按字段配置格式化百分比（value 为 0–1，precision）
 */
export function formatPercent(value: any, properties: Record<string, any> = {}): string {
  if (value === null || value === undefined || isNaN(Number(value))) return '-'
  const { precision = 0 } = properties
  return `${(Number(value) * 100).toFixed(precision)}%`
}

/**
 * 通用字段值转显示文本（对象取 name/displayName/email，否则 String）
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object' && value !== null && 'name' in value) {
    return (value as any).name ?? (value as any).displayName ?? (value as any).email ?? '-'
  }
  return String(value)
}

/**
 * 根据字段类型与配置格式化字段值（用于 TableInfo 等需按类型分支的场景）
 */
export function formatFieldValueByType(
  value: any,
  field: Pick<FieldInfo, 'type' | 'properties'>
): string {
  if (value === null || value === undefined) return '-'
  const properties = field.properties || {}

  switch (field.type) {
    case ColumnFieldType.CreatedTime:
    case ColumnFieldType.LastModifiedTime:
    case ColumnFieldType.DateTime:
      return formatDateTime(value, properties)

    case ColumnFieldType.Checkbox:
      return value ? '✓' : '✗'

    case ColumnFieldType.Rating: {
      const max = properties.max || 5
      const rating = Number(value) || 0
      return '★'.repeat(Math.min(rating, max)) + '☆'.repeat(Math.max(0, max - rating))
    }

    case ColumnFieldType.Number:
      return formatNumber(value, properties)

    case 17: // Currency（枚举未导出时用数字）
      return formatNumber(value, properties)

    case 18: // Percent（枚举未导出时用数字）
      return formatPercent(value, properties)

    case ColumnFieldType.MultiSelect:
      if (Array.isArray(value)) {
        const options = getSelectOptions(value, properties)
        return options.map(o => o.label ?? o.name).join(', ') || value.join(', ')
      }
      return String(value)

    case ColumnFieldType.User:
      return formatFieldValue(value)

    default:
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
  }
}
