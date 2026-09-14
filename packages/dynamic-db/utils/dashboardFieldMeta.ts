import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

const BUSINESS_TYPE_ALIASES: Record<string, string> = {
  date: ColumnFieldType.DateTime,
  DateTime: ColumnFieldType.DateTime,
  createdTime: ColumnFieldType.CreatedTime,
  CreatedTime: ColumnFieldType.CreatedTime,
  lastModifiedTime: ColumnFieldType.LastModifiedTime,
  LastModifiedTime: ColumnFieldType.LastModifiedTime
}

export function normalizeBusinessType(businessType: unknown): string {
  const bt = String(businessType ?? '')
  return BUSINESS_TYPE_ALIASES[bt] ?? bt
}

export function isDateBusinessType(businessType: unknown): boolean {
  const bt = normalizeBusinessType(businessType)
  return bt === ColumnFieldType.DateTime
    || bt === ColumnFieldType.CreatedTime
    || bt === ColumnFieldType.LastModifiedTime
}

export function resolveDateFormat(
  fieldMeta?: { display_structure?: Record<string, any>; properties?: Record<string, any> } | null,
  savedDateFormat?: string,
  fallback = 'YYYY-MM-DD'
): string {
  if (savedDateFormat) return savedDateFormat
  return fieldMeta?.display_structure?.dateFormat
    || fieldMeta?.properties?.dateFormat
    || fallback
}

export interface ResolvedColumnConfigItem {
  field: string
  width?: number
  visible: boolean
  businessType: string
  dateFormat: string
}

export function resolveWidgetColumnConfig(
  setting: Record<string, any> | undefined,
  fieldMetaMap: Record<string, any>
): ResolvedColumnConfigItem[] {
  const savedConfig = setting?.columnConfig
  if (Array.isArray(savedConfig) && savedConfig.length) {
    return savedConfig.map((col: any) => {
      const fieldMeta = fieldMetaMap[col.field]
      return {
        field: col.field,
        width: col.width,
        visible: col.visible !== false,
        businessType: normalizeBusinessType(col.businessType || fieldMeta?.business_type),
        dateFormat: resolveDateFormat(fieldMeta, col.dateFormat)
      }
    })
  }

  const widths = setting?.columnWidths || {}
  const hidden = new Set(setting?.hiddenColumns || [])
  return (setting?.columns || []).map((field: string) => {
    const fieldMeta = fieldMetaMap[field]
    return {
      field,
      width: widths[field],
      visible: !hidden.has(field),
      businessType: normalizeBusinessType(fieldMeta?.business_type),
      dateFormat: resolveDateFormat(fieldMeta)
    }
  })
}
