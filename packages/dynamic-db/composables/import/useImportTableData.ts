import * as XLSX from 'xlsx'
import { newClientApi, postDynamicActions } from 'api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { isExcelFile } from './useImportBatch'

export interface ParsedSheet {
  sheetName: string
  headers: string[]
  rows: Record<string, any>[]
}

export interface ColumnMapping {
  excelColumn: string
  tableField: string | null
}

export type DuplicateStrategy = 'ignore' | 'update'

export interface ImportResult {
  created: number
  updated: number
  ignored: number
  errors: { row: number; message: string }[]
}

export interface TableField {
  field_name: string
  field_name_alias?: string
  business_type: string | ColumnFieldType
  display_structure?: Record<string, any>
}

const TRUTHY_VALUES = ['true', 'yes', 'y', '1', 'on', '是', '有']
const FALSY_VALUES = ['false', 'no', 'n', '0', 'off', '否', '无', '没有']

/**
 * Format a raw cell value according to the target field type and display structure
 */
export function formatCellValue(value: any, field: TableField): any {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const fieldType = String(field.business_type)
  const display = field.display_structure || {}

  switch (fieldType) {
    case ColumnFieldType.DateTime:
    case String(ColumnFieldType.DateTime): {
      // Excel date cells are JS Date objects when cellDates: true
      if (value instanceof Date) {
        return value.getTime()
      }
      // Try parsing as ISO string or common formats
      const parsed = dayjs(value)
      if (parsed.isValid()) {
        return parsed.valueOf()
      }
      return value
    }

    case ColumnFieldType.Number:
    case String(ColumnFieldType.Number):
    case ColumnFieldType.Rating:
    case String(ColumnFieldType.Rating): {
      if (typeof value === 'number') {
        return value
      }
      const str = String(value).trim()
      if (str === '') return undefined

      // Remove currency symbols and commas
      let clean = str
      const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', '₽', '₴', '₫', '₭', '₮', '₱', '₲', '₵', '₸', '₺', '₼', '₾', '₿', '%']
      for (const sym of currencySymbols) {
        if (clean.startsWith(sym)) {
          clean = clean.substring(sym.length).trim()
        } else if (clean.endsWith(sym)) {
          clean = clean.substring(0, clean.length - sym.length).trim()
        }
      }
      clean = clean.replace(/,/g, '').replace(/\s/g, '')

      const num = parseFloat(clean)
      return isNaN(num) ? value : num
    }

    case ColumnFieldType.Checkbox:
    case String(ColumnFieldType.Checkbox): {
      if (typeof value === 'boolean') {
        return value
      }
      const str = String(value).trim().toLowerCase()
      if (TRUTHY_VALUES.includes(str)) return true
      if (FALSY_VALUES.includes(str)) return false
      return Boolean(value)
    }

    case ColumnFieldType.SingleSelect:
    case String(ColumnFieldType.SingleSelect): {
      const options = display.options || []
      if (!options.length) return String(value)
      // If value already matches an option id, use it directly
      const byId = options.find((o: any) => String(o.id) === String(value))
      if (byId) return byId.id
      // Try matching by label or name
      const byLabel = options.find((o: any) =>
        String(o.label).trim().toLowerCase() === String(value).trim().toLowerCase() ||
        String(o.name).trim().toLowerCase() === String(value).trim().toLowerCase()
      )
      if (byLabel) return byLabel.id
      return String(value)
    }

    case ColumnFieldType.MultiSelect:
    case String(ColumnFieldType.MultiSelect): {
      const options = display.options || []
      if (!options.length) {
        // Split by common separators and return as array
        const parts = String(value).split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        return parts
      }
      const parts = String(value).split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      return parts.map((part: string) => {
        const byId = options.find((o: any) => String(o.id) === part)
        if (byId) return byId.id
        const byLabel = options.find((o: any) =>
          String(o.label).trim().toLowerCase() === part.toLowerCase() ||
          String(o.name).trim().toLowerCase() === part.toLowerCase()
        )
        return byLabel ? byLabel.id : part
      })
    }

    case ColumnFieldType.User:
    case String(ColumnFieldType.User): {
      // User fields store objects or arrays of objects
      // For import, try to keep as-is unless it's a plain string
      if (typeof value === 'object') return value
      return String(value)
    }

    case ColumnFieldType.Relation:
    case String(ColumnFieldType.Relation): {
      // Relation fields store arrays of IDs
      if (Array.isArray(value)) return value
      const parts = String(value).split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      return parts.length ? parts : String(value)
    }

    case ColumnFieldType.Document:
    case String(ColumnFieldType.Document): {
      if (Array.isArray(value)) return value
      return String(value)
    }

    case ColumnFieldType.URL:
    case String(ColumnFieldType.URL): {
      if (typeof value === 'object' && value !== null) return value
      return String(value)
    }

    case ColumnFieldType.Email:
    case String(ColumnFieldType.Email):
    case ColumnFieldType.Phone:
    case String(ColumnFieldType.Phone):
    case ColumnFieldType.Text:
    case String(ColumnFieldType.Text):
    case ColumnFieldType.MultiText:
    case String(ColumnFieldType.MultiText):
    default:
      return String(value)
  }
}

/**
 * Parse Excel or CSV file and return available sheets with headers and rows
 */
export async function parseImportFile(file: File): Promise<ParsedSheet[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: true })

  const parsedSheets: ParsedSheet[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (rawData.length === 0) continue

    // Simple header detection: first row
    const headers = rawData[0].map((h: any) => String(h).trim()).filter((h: string) => h !== '')
    if (headers.length === 0) continue

    // Data rows — skip rows where every cell is empty
    const rows: Record<string, any>[] = []
    let consecutiveEmptyRows = 0
    const MAX_CONSECUTIVE_EMPTY_ROWS = 5

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      const record: Record<string, any> = {}
      let hasValue = false

      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const header = headers[colIdx]
        const value = row[colIdx]
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          hasValue = true
        }
        record[header] = value !== undefined && value !== null ? value : ''
      }

      if (hasValue) {
        consecutiveEmptyRows = 0
        rows.push(record)
      } else {
        consecutiveEmptyRows++
        // Stop parsing after too many consecutive empty rows to avoid trailing blanks
        if (consecutiveEmptyRows >= MAX_CONSECUTIVE_EMPTY_ROWS) {
          break
        }
      }
    }

    parsedSheets.push({ sheetName, headers, rows })
  }

  return parsedSheets
}

/**
 * Query existing records by matching values on a specific field
 */
export async function queryExistingRecords(
  tableId: string,
  fieldName: string,
  values: any[]
): Promise<Record<string, any>[]> {
  if (!values.length) return []

  const uniqueValues = [...new Set(values)].filter((v) => v !== '' && v !== null && v !== undefined)
  if (!uniqueValues.length) return []

  // Query in batches of 100 to avoid overly large IN clauses
  const batchSize = 100
  const allRecords: Record<string, any>[] = []

  for (let i = 0; i < uniqueValues.length; i += batchSize) {
    const batch = uniqueValues.slice(i, i + batchSize)
    const { data }: any = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      conditions: [
        {
          type: 'IN',
          column: fieldName,
          value: batch
        }
      ],
      pagination: {
        pageSize: batch.length,
        pageNum: 0
      }
    })
    if (data?.data?.length) {
      allRecords.push(...data.data)
    }
  }

  return allRecords
}

/**
 * Import rows into an existing table with column mapping and duplicate handling
 */
export async function importRowsToTable(
  tableId: string,
  rows: Record<string, any>[],
  columnMapping: ColumnMapping[],
  uniqueField: string | null,
  duplicateStrategy: DuplicateStrategy,
  tableFields: TableField[],
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    ignored: 0,
    errors: []
  }

  // Build active mapping (only mapped columns)
  const activeMapping = columnMapping.filter((m) => m.tableField)

  if (!activeMapping.length) {
    ElMessage.warning('No columns mapped')
    return result
  }

  // Build field info lookup
  const fieldMap = new Map<string, TableField>()
  for (const field of tableFields) {
    fieldMap.set(field.field_name, field)
  }

  // Transform rows using mapping and format values
  const mappedRows = rows.map((row, index) => {
    const record: Record<string, any> = {}
    for (const mapping of activeMapping) {
      if (mapping.excelColumn in row) {
        const field = mapping.tableField ? fieldMap.get(mapping.tableField) : undefined
        const rawValue = row[mapping.excelColumn]
        if (field) {
          record[mapping.tableField!] = formatCellValue(rawValue, field)
        } else {
          record[mapping.tableField!] = rawValue
        }
      }
    }
    return { record, originalIndex: index }
  })

  // If unique field is set, query existing records
  let existingMap = new Map<string, string>() // value -> row id
  if (uniqueField && activeMapping.some((m) => m.tableField === uniqueField)) {
    const uniqueValues = mappedRows.map((r) => r.record[uniqueField])
    const existingRecords = await queryExistingRecords(tableId, uniqueField, uniqueValues)
    for (const rec of existingRecords) {
      const key = String(rec[uniqueField])
      existingMap.set(key, rec.id)
    }
  }

  // Track processed unique values within this import batch to avoid creating duplicates
  const processedUniqueValues = new Set<string>()

  // Process rows
  const total = mappedRows.length
  for (let i = 0; i < mappedRows.length; i++) {
    const { record, originalIndex } = mappedRows[i]

    try {
      if (uniqueField && record[uniqueField] !== undefined) {
        const uniqueValue = String(record[uniqueField])
        const existingId = existingMap.get(uniqueValue)

        if (existingId) {
          if (duplicateStrategy === 'ignore') {
            result.ignored++
            continue
          } else if (duplicateStrategy === 'update') {
            await newClientApi.putDynamicDbTableTableidDataDataid(tableId, existingId, { data: record })
            result.updated++
            continue
          }
        }

        // Check if we already created a record with this unique value in the current batch
        if (processedUniqueValues.has(uniqueValue)) {
          result.ignored++
          continue
        }
        processedUniqueValues.add(uniqueValue)
      }

      // Create new record
      await newClientApi.postDynamicDbTableTableidData(tableId, { data: record })
      result.created++
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unknown error'
      result.errors.push({ row: originalIndex + 2, message }) // +2 for header row and 1-based
    }

    if (onProgress) {
      onProgress(i + 1, total)
    }

    // Small delay to avoid overwhelming the server
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  return result
}

export { isExcelFile }
