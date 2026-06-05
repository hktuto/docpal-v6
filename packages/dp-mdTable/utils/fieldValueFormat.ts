/**
 * 字段值格式化工具（合并 formatNumber、formatDateTime、getSelectOption(s)、formatFieldValue）
 * 供 Card、CardPreview、TableInfo 等统一使用
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { FieldInfo } from '@packages/dp-mdTable/types/view-config'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { buildRelationArray } from './relationHelper'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface SelectOptionLike {
  id: string
  label?: string
  name?: string
  color: string
}

/**
 * 按字段配置格式化日期时间（支持 dateFormat、includeTime、dateTimeFormat、timezone）
 */
export function formatDateTime(value: any, properties: Record<string, any> = {}): string {
  if (!value) return '-'
  const _value = isNaN(Number(value)) ? value : Number(value)
  const { dateFormat, includeTime, dateTimeFormat, timezone: tz } = properties
  try {
    const format = includeTime && dateTimeFormat ? `${dateFormat || 'YYYY-MM-DD'} ${dateTimeFormat}` : dateFormat || 'YYYY-MM-DD'
    let displayValue = dayjs(_value).format(format)
    if (includeTime && tz) {
      displayValue = dayjs(_value).tz(tz).format(format)
    }
    return displayValue
  } catch {
    return String(_value)
  }
}

/**
 * 按字段配置格式化数字（precision、showThouComma）
 */
export function formatNumber(value: any, properties: Record<string, any> = {}): string {
  if (value === null || value === undefined || isNaN(Number(value))) return '-'
  const { precision = 0, showThouComma, symbol, symbolAlign } = properties
  let formatted = Number(value).toFixed(precision)
  if (showThouComma) {
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  if (symbol) {
    if (symbolAlign === 'left') {
      formatted = symbol + formatted
    } else {
      formatted = formatted + symbol
    }
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
export interface TableFieldLike {
  field_name: string
  business_type?: string
  display_structure?: Record<string, any>
}

export interface FormatTableFieldDisplayOptions {
  viewTools?: {
    getRelationFieldConfig?: (tableId: string, fieldId: string) => { field_name: string } | undefined
  }
  separator?: string
}

export function resolveSelectLabel(val: unknown, options: SelectOptionLike[]): string {
  const option = options.find(
    (o) => o.id === val || (o as any).value === val || o.label === val || (o as any).name === val
  )
  return option?.label ?? option?.name ?? String(val ?? '')
}

function formatVirtualColumnValues(values: any[], config: Record<string, any>, separator: string): string {
  if (!values.length) {
    return ''
  }

  const displayFieldType = config.display_field_type?.toString()
  const selectOptions: SelectOptionLike[] = config.properties?.options ?? config.options ?? []
  const fieldProps = config.properties ?? config

  switch (displayFieldType) {
    case ColumnFieldType.SingleSelect:
      return values.map((val) => resolveSelectLabel(val, selectOptions)).join(separator)
    case ColumnFieldType.MultiSelect:
      return values
        .map((val) => {
          const ids = Array.isArray(val) ? val : [val]
          return ids.map((id) => resolveSelectLabel(id, selectOptions)).join(separator)
        })
        .join(separator)
    case ColumnFieldType.Number:
      return values.map((val) => formatNumber(val, fieldProps)).join(separator)
    case ColumnFieldType.DateTime:
      return values.map((val) => formatDateTime(val, fieldProps)).join(separator)
    case ColumnFieldType.Checkbox:
      if (values.length === 1) {
        return values[0] ? '✓' : '✗'
      }
      return `${values.filter(Boolean).length}/${values.length} ✓`
    case ColumnFieldType.Rating: {
      const max = config.max ?? fieldProps.max ?? 5
      if (values.length === 1) {
        const rating = Number(values[0]) || 0
        return '★'.repeat(Math.min(rating, max)) + '☆'.repeat(Math.max(0, max - rating))
      }
      const avg = values.reduce((sum, v) => sum + (Number(v) || 0), 0) / values.length
      return `Avg: ${avg.toFixed(1)} ★`
    }
    default:
      return values
        .map((v) => (v == null || v === '' ? '-' : String(v)))
        .filter((v) => v !== '-')
        .join(separator)
  }
}

/**
 * 按 tableFields 字段配置格式化显示值（分组树节点、看板等场景）
 */
export function formatTableFieldDisplayValue(
  rawValue: any,
  field: TableFieldLike,
  row?: Record<string, any>,
  options: FormatTableFieldDisplayOptions = {}
): string {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return ''
  }

  const businessType = field.business_type?.toString()
  const displayStructure = field.display_structure || {}
  const separator = options.separator ?? ', '

  if (businessType === ColumnFieldType.SingleSelect) {
    return resolveSelectLabel(rawValue, displayStructure.options || [])
  }

  if (businessType === ColumnFieldType.MultiSelect) {
    const ids = Array.isArray(rawValue) ? rawValue : [rawValue]
    return ids
      .map((id) => resolveSelectLabel(id, displayStructure.options || []))
      .filter(Boolean)
      .join(separator)
  }

  if (businessType === ColumnFieldType.Relation && row) {
    const displayFieldId = displayStructure.display_field_ids?.[0]
    const displayField = options.viewTools?.getRelationFieldConfig?.(
      displayStructure.relation_table_id,
      displayFieldId
    )
    if (displayField) {
      const relationArray = buildRelationArray(row, field.field_name, displayField.field_name)
      const labels = relationArray
        .map((item) => item[displayField.field_name])
        .filter((v) => v != null && v !== '' && v !== '-')
      if (labels.length) {
        return labels.join(separator)
      }
    }
    return formatFieldValue(rawValue)
  }

  if (
    (businessType === ColumnFieldType.VirtualColumn || businessType === ColumnFieldType.AggVirtualColumn) &&
    row
  ) {
    const relationFieldName = displayStructure.relation_field_name
    const displayFieldName = displayStructure.display_field_name
    if (relationFieldName && displayFieldName) {
      const relationArray = buildRelationArray(row, relationFieldName, displayFieldName)
      const values = relationArray.map((item) => item[displayFieldName])
      return formatVirtualColumnValues(values, displayStructure, separator)
    }
  }

  return formatFieldValueByType(rawValue, {
    type: businessType as FieldInfo['type'],
    properties: displayStructure
  })
}

export function formatFieldValueByType(value: any, field: Pick<FieldInfo, 'type' | 'properties'>): string {
  if (value === null || value === undefined) return '-'
  const properties = field.properties || {}
  switch (field.type) {
    case ColumnFieldType.SingleSelect: {
      const options: SelectOptionLike[] = properties.options || []
      return resolveSelectLabel(value, options)
    }

    case ColumnFieldType.MultiSelect: {
      const ids = Array.isArray(value) ? value : [value]
      const options: SelectOptionLike[] = properties.options || []
      return ids.map((id) => resolveSelectLabel(id, options)).filter(Boolean).join(', ')
    }

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

    case ColumnFieldType.User:
      return formatFieldValue(value)

    case ColumnFieldType.DocPalDoc: {
      return value?.name || value?.id || '-'
    }

    default:
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
  }
}
