import * as XLSX from 'xlsx'
import { newClientApi, postDynamicActions } from 'api'
import { ElMessage } from 'element-plus'
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

    // Data rows
    const rows: Record<string, any>[] = []
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      const record: Record<string, any> = {}
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const header = headers[colIdx]
        const value = row[colIdx]
        record[header] = value !== undefined && value !== null ? value : ''
      }
      rows.push(record)
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

  // Transform rows using mapping
  const mappedRows = rows.map((row, index) => {
    const record: Record<string, any> = {}
    for (const mapping of activeMapping) {
      if (mapping.excelColumn in row) {
        record[mapping.tableField!] = row[mapping.excelColumn]
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
