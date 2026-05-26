import * as XLSX from 'xlsx'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import {
  detectAndFlattenHeaders,
  detectColumnType,
  generateUniqueFieldNames,
  cellValueToString
} from './useImportBatch'

export interface ParsedSheet {
  /** Original Excel sheet name */
  sheetName: string
  /** Predicted table name (sanitized from sheet name) */
  predictedTableName: string
  /** Flattened column headers */
  headers: string[]
  /** Generated DB field names for each header */
  fieldNames: string[]
  /** Inferred column types */
  columnTypes: ColumnFieldType[]
  /** First N data rows (after header rows) keyed by fieldName */
  sampleRows: Record<string, any>[]
}

const MAX_PARSE_ROWS = 1000
const SAMPLE_ROW_COUNT = 100

/**
 * Read an Excel/CSV file client-side and extract headers, field names,
 * inferred types, and sample rows for each sheet.
 */
export async function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: true })

  const parsedSheets: ParsedSheet[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (rawData.length === 0) continue

    // Limit total rows parsed per sheet
    const limitedData = rawData.slice(0, MAX_PARSE_ROWS)

    // Detect and flatten headers
    const { headers, headerRowCount } = detectAndFlattenHeaders(limitedData)
    if (headers.length === 0) continue

    // Generate DB-safe field names
    const fieldNames = generateUniqueFieldNames(headers)

    // Extract sample data rows
    const dataRows = limitedData.slice(headerRowCount, headerRowCount + SAMPLE_ROW_COUNT)

    // Detect column types from sample values
    const columnTypes: ColumnFieldType[] = []
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const samples = dataRows
        .map((row) => row[colIdx])
        .filter((v) => v !== undefined && v !== null && v !== '')

      // Attempt to read Excel format for this column from the first data cell
      let excelFormat: string | undefined
      const firstDataRowIdx = headerRowCount + 1 // 1-based for XLSX cell addresses
      if (firstDataRowIdx <= limitedData.length) {
        const cellRef = XLSX.utils.encode_cell({ r: firstDataRowIdx - 1, c: colIdx })
        const cell = sheet[cellRef]
        if (cell && typeof cell.z === 'string') {
          excelFormat = cell.z
        }
      }

      const detected = detectColumnType(samples, excelFormat)
      columnTypes.push(detected.type)
    }

    // Normalize rows into Record<string, any> keyed by fieldName
    const sampleRows: Record<string, any>[] = []
    for (const row of dataRows) {
      const record: Record<string, any> = {}
      for (let colIdx = 0; colIdx < fieldNames.length; colIdx++) {
        const fieldName = fieldNames[colIdx]
        const value = row[colIdx]
        const colType = columnTypes[colIdx]
        record[fieldName] = cellValueToString(value, undefined, colType)
      }
      sampleRows.push(record)
    }

    // Sanitize sheet name into a predicted table name
    const predictedTableName = sheetName
      .replace(/[\/\\?%*:|"<>\s\-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 64) || 'Imported_Table'

    parsedSheets.push({
      sheetName,
      predictedTableName,
      headers,
      fieldNames,
      columnTypes,
      sampleRows
    })
  }

  return parsedSheets
}
