import * as XLSX from 'xlsx'
import { v7 as uuidv7 } from 'uuid'
import type { CaseTreeRecord, CaseFieldRecord, FieldDisplayStructure } from '../utils/db/schema/newTableSchema'
import { ColumnFieldType } from '../utils/tableColumnType'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

interface ImportField extends Partial<CaseFieldRecord> {
  originalIdx?: number
}

interface SheetData {
  name: string
  tableName: string
  slug: string
  headers: string[]
  fields: Partial<CaseFieldRecord>[]
  rows: Record<string, any>[]
}

interface ImportBatchResult {
  success: boolean
  duplicates?: string[]
  tablesCreated?: { id: string; name: string }[]
  error?: string
}

/**
 * Reserved column names that cannot be used as field names
 */
const RESERVED_COLUMN_NAMES = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'oid', 'tableoid', 'xmin', 'cmin', 'xmax', 'cmax', 'ctid']

/**
 * Generate a field name from a title
 */
function generateFieldName(title: string): string {
  let field =
    title
      .toLowerCase()
      .trim()
      .replace(/[\s\-\.]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .replace(/^(\d)/, 'col_$1') || 'column'

  if (RESERVED_COLUMN_NAMES.includes(field)) {
    field = `col_${field}`
  }

  return field
}

/**
 * Generate unique field names for columns
 */
function generateUniqueFieldNames(titles: string[]): string[] {
  const fieldCounts: Record<string, number> = {}
  const fields: string[] = []

  for (const title of titles) {
    let baseField = generateFieldName(title)
    if (fieldCounts[baseField] !== undefined) {
      fieldCounts[baseField]++
      fields.push(`${baseField}_${fieldCounts[baseField]}`)
    } else {
      fieldCounts[baseField] = 1
      fields.push(baseField)
    }
  }

  return fields
}

/**
 * Detect the column type based on cell values
 */
function detectColumnType(samples: any[], excelFormat?: string): { type: ColumnFieldType; properties: Record<string, any> } {
  if (samples.length === 0) {
    return { type: ColumnFieldType.Text, properties: { defaultValue: '' } }
  }

  // Check for Date type - first check if we have Excel format string
  if (excelFormat && isExcelDateFormat(excelFormat)) {
    const dateFormat = excelFormatToDateFormat(excelFormat)
    return {
      type: ColumnFieldType.DateTime,
      properties: {
        autoFill: false,
        dateFormat,
        timeZone: 'local',
        timeFormat: dateFormat.includes('HH') || dateFormat.includes('hh') ? 24 : undefined
      }
    }
  }

  // Check for Number type
  const numberCount = samples.filter((v) => !isNaN(v) && !isNaN(parseFloat(v))s).length
  if (numberCount >= samples.length * 0.8) {
    return {
      type: ColumnFieldType.Number,
      properties: { symbol: '', precision: 2, symbolAlign: 2 }
    }
  }

  // Check for Boolean type
  const boolCount = samples.filter((v) => typeof v === 'boolean').length
  if (boolCount >= samples.length * 0.8) {
    return {
      type: ColumnFieldType.Checkbox,
      properties: { trueIcon: 'check', falseIcon: '' }
    }
  }

  // Check for text patterns
  const stringValues = samples.filter((v) => typeof v === 'string')
  if (stringValues.length > 0) {
    // Check for Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailCount = stringValues.filter((v) => emailPattern.test(v)).length
    if (emailCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.Email, properties: {} }
    }

    // Check for URL pattern
    const urlPattern = /^https?:\/\//i
    const urlCount = stringValues.filter((v) => urlPattern.test(v)).length
    if (urlCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.URL, properties: { openInNewTab: true } }
    }

    // Check for Phone pattern
    const phonePattern = /^[\+\d\s\-\(\)]{7,}$/
    const phoneCount = stringValues.filter((v) => phonePattern.test(v)).length
    if (phoneCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.Phone, properties: { includeCountryCode: false } }
    }
  }

  // Default to Text
  return { type: ColumnFieldType.Text, properties: { defaultValue: '' } }
}

/**
 * Check if an Excel format string is a date format
 */
export function isExcelDateFormat(format: string): boolean {
  if (!format || format === 'General') return false
  console.log('format', format)
  // Remove locale prefix like [$-F800]
  const cleanFormat = format.replace(/\[\$-[^\]]*\]/g, '')

  // Check for date patterns
  const datePatterns = [
    /[dy]/i, // day, year
    /[m]/i, // month
    /[h]/i, // hour
    /[s]/i // second
  ]

  // Excel date formats often contain these patterns
  const hasDatePattern = datePatterns.some((pattern) => pattern.test(cleanFormat))

  // Also check for common date format strings
  const commonDateFormats = ['yyyy', 'yy', 'mmmm', 'mmm', 'mm', 'm', 'dddd', 'ddd', 'dd', 'd', 'hh', 'h', 'ss', 's', 'am/pm', 'a/p']

  const hasDateFormat = commonDateFormats.some((df) => cleanFormat.toLowerCase().includes(df.toLowerCase()))

  return hasDatePattern || hasDateFormat
}

/**
 * Convert Excel format string to dayjs date format
 */
export function excelFormatToDateFormat(excelFormat: string): string {
  if (!excelFormat) return 'YYYY-MM-DD HH:mm:ss'

  // Remove locale prefix
  let format = excelFormat.replace(/\[\$-[^\]]*\]/g, '')

  // Unescape escaped characters
  format = format.replace(/\\/g, '')

  // Map Excel format codes to dayjs format codes
  const formatMap: Array<{ pattern: RegExp; replacement: string }> = [
    // Years - must be exact matches (not part of other patterns)
    { pattern: /(?<![dy])yyyy(?![dy])/gi, replacement: 'YYYY' },
    { pattern: /(?<![dy])yy(?![dy])/gi, replacement: 'YY' },

    // Months - full and abbreviated (not part of other patterns)
    { pattern: /(?<![m])mmmm(?![m])/gi, replacement: 'MMMM' }, // January
    { pattern: /(?<![m])mmm(?![m])/gi, replacement: 'MMM' }, // Jan

    // Days - handle with negative lookaround to avoid partial matches
    { pattern: /(?<![d])dddd(?![d])/gi, replacement: 'dddd' }, // Monday
    { pattern: /(?<![d])ddd(?![d])/gi, replacement: 'ddd' }, // Mon
    { pattern: /(?<![d])dd(?![d])/gi, replacement: 'DD' }, // 01-31
    { pattern: /(?<![d])d(?![d])/gi, replacement: 'D' }, // 1-31

    // Seconds (not part of other patterns)
    { pattern: /(?<![s])ss(?![s])/gi, replacement: 'ss' },
    { pattern: /(?<![s])s(?![s])/gi, replacement: 's' },

    // AM/PM - exact matches
    { pattern: /am\/pm/gi, replacement: 'A' },
    { pattern: /a\/p/gi, replacement: 'A' },
    { pattern: /AM\/PM/gi, replacement: 'A' },
    { pattern: /A\/P/gi, replacement: 'A' }
  ]

  // First, handle hours and minutes which need context awareness
  let result = format

  // Check if AM/PM appears anywhere in the format (handle escaped versions)
  const hasAmPm =
    result.toLowerCase().includes('am/pm') ||
    result.toLowerCase().includes('a/p') ||
    result.toLowerCase().includes('am\\/pm') ||
    result.toLowerCase().includes('a\\/p')

  // Handle hours based on AM/PM presence
  if (hasAmPm) {
    // 12-hour format - use negative lookaround to avoid partial matches
    result = result.replace(/(?<![h])hh(?![h])/gi, 'hh')
    result = result.replace(/(?<![h])h(?![h])/gi, 'h')
  } else {
    // 24-hour format
    result = result.replace(/(?<![h])hh(?![h])/gi, 'HH')
    result = result.replace(/(?<![h])h(?![h])/gi, 'H')
  }

  // Handle minutes vs months - use negative lookaround
  // First, handle minutes: mm/m that appear in time context (after h/H or :)
  // We need to be careful to not match mm in date context like "mm/dd"

  // Pattern for minutes: mm or m that comes after h/H or : and before s/S or end
  // This handles: h:mm, hh:mm, :mm, h:mm:ss, etc.
  const minutePattern = /([hH:])\s*(mm?)(?=\s*[:sS]|$)/gi
  result = result.replace(minutePattern, (match, before, mm) => {
    // This is in time context, so it's minutes
    return before + (mm === 'mm' ? 'mm' : 'm')
  })

  // Now handle remaining mm/m patterns - these are months
  // Use negative lookaround: mm not preceded by h/H or : and not part of mmmm/mmm
  result = result.replace(/(?<![hH:m])mm(?![m])/gi, 'MM')
  result = result.replace(/(?<![hH:m])m(?![m])/gi, 'M')

  // Now replace all other patterns using the format map
  for (const { pattern, replacement } of formatMap) {
    result = result.replace(pattern, replacement)
  }

  // Clean up any remaining Excel-specific codes
  result = result.replace(/\[.*?\]/g, '')

  // Also remove escaped backslashes since we've already processed them
  result = result.replace(/\\/g, '')

  // If no date components found, return default
  if (!/[YMDHmsA]/.test(result)) {
    return 'YYYY-MM-DD'
  }

  return result
}

/**
 * Check if a string is a valid date
 */
export function isDateString(str: string): boolean {
  if (typeof str !== 'string') return false

  // Try Date.parse first (handles many common formats)
  const timestamp = Date.parse(str)
  if (!isNaN(timestamp)) return true

  // Try dayjs parsing with common formats
  try {
    // Try common date formats
    const formats = [
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY/MM/DD',
      'MM-DD-YYYY',
      'DD-MM-YYYY',
      'YYYY.MM.DD',
      'MM.DD.YYYY',
      'DD.MM.YYYY',
      'MMMM D, YYYY', // January 15, 2024
      'D MMMM YYYY', // 15 January 2024
      'MMM D, YYYY', // Jan 15, 2024
      'D MMM YYYY', // 15 Jan 2024
      'YYYY-MM-DD HH:mm:ss',
      'MM/DD/YYYY HH:mm:ss',
      'DD/MM/YYYY HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'MM/DD/YYYY HH:mm',
      'DD/MM/YYYY HH:mm',
      'YYYY-MM-DDTHH:mm:ss', // ISO with T
      'YYYY-MM-DD HH:mm:ss.SSS' // ISO with milliseconds
    ]

    for (const format of formats) {
      const parsed = dayjs(str, format, true) // strict parsing
      if (parsed.isValid()) {
        return true
      }
    }

    return false
  } catch {
    return false
  }
}

/**
 * Guess date format from sample date strings
 */
export function guessDateFormatFromSamples(dateStrings: string[]): string {
  if (dateStrings.length === 0) return 'YYYY-MM-DD HH:mm:ss'

  // Try to detect common patterns
  const samples = dateStrings.slice(0, 5) // Use first 5 samples

  for (const sample of samples) {
    // Check for ISO format
    if (/^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/.test(sample)) {
      return 'YYYY-MM-DD HH:mm:ss'
    }

    // Check for date only ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(sample)) {
      return 'YYYY-MM-DD'
    }

    // Check for US format with slashes
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(sample)) {
      if (sample.includes(':')) {
        return 'MM/DD/YYYY HH:mm:ss'
      }
      return 'MM/DD/YYYY'
    }

    // Check for European format with slashes (already matched US format above)
    // This regex is the same as above, need different approach
    // Let's check if it could be DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(sample)) {
      const parts = sample.split('/')
      if (parts.length === 3) {
        const first = parseInt(parts[0])
        const second = parseInt(parts[1])
        if (first > 12 && second <= 12) {
          // First > 12, second <= 12, likely DD/MM/YYYY
          if (sample.includes(':')) {
            return 'DD/MM/YYYY HH:mm:ss'
          }
          return 'DD/MM/YYYY'
        } else if (first <= 12 && second > 12) {
          // First <= 12, second > 12, likely MM/DD/YYYY
          if (sample.includes(':')) {
            return 'MM/DD/YYYY HH:mm:ss'
          }
          return 'MM/DD/YYYY'
        }
      }
    }

    // Check for dot separators
    if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(sample)) {
      const parts = sample.split('.')
      if (parts.length === 3) {
        const first = parseInt(parts[0])
        const second = parseInt(parts[1])
        if (first > 12 && second <= 12) {
          // First > 12, second <= 12, likely DD.MM.YYYY
          if (sample.includes(':')) {
            return 'DD.MM.YYYY HH:mm:ss'
          }
          return 'DD.MM.YYYY'
        } else if (first <= 12 && second > 12) {
          // First <= 12, second > 12, likely MM.DD.YYYY
          if (sample.includes(':')) {
            return 'MM.DD.YYYY HH:mm:ss'
          }
          return 'MM.DD.YYYY'
        } else {
          // Ambiguous, default to DD.MM.YYYY (more common internationally)
          if (sample.includes(':')) {
            return 'DD.MM.YYYY HH:mm:ss'
          }
          return 'DD.MM.YYYY'
        }
      }
    }
  }

  // Default format
  return 'YYYY-MM-DD HH:mm:ss'
}

/**
 * Convert a cell value to string
 * @param value The cell value to convert
 * @param dateFormat Optional date format to use for parsing date strings
 */
function cellValueToString(value: any, dateFormat?: string): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return ''
    }
    return value.toISOString()
  }

  if (typeof value === 'string') {
    // If we have a date format, try to parse with it first
    if (dateFormat) {
      // First try strict parsing with the exact format
      const parsedStrict = dayjs(value, dateFormat, true)
      if (parsedStrict.isValid()) {
        return parsedStrict.toISOString()
      }

      // If strict parsing fails, try non-strict parsing
      const parsedNonStrict = dayjs(value, dateFormat, false)
      if (parsedNonStrict.isValid()) {
        return parsedNonStrict.toISOString()
      }
    }

    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

/**
 * Read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Check if a file is an Excel file
 */
export function isExcelFile(file: File): boolean {
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
  const validExtensions = ['xlsx', 'xls', 'csv']
  const extension = file.name.split('.').pop()?.toLowerCase()

  return validTypes.includes(file.type) || validExtensions.includes(extension || '')
}

/**
 * Map ColumnFieldType to business type
 */
function mapToBusinessType(type: ColumnFieldType): string {
  switch (type) {
    case ColumnFieldType.Number:
    case ColumnFieldType.Rating:
      return 'number'
    case ColumnFieldType.Checkbox:
      return 'boolean'
    case ColumnFieldType.DateTime:
    case ColumnFieldType.CreatedTime:
    case ColumnFieldType.LastModifiedTime:
      return 'date'
    case ColumnFieldType.Relation:
      return 'relation'
    case ColumnFieldType.Formula:
      return 'formula'
    case ColumnFieldType.Aggregation:
      return 'aggregation'
    default:
      return 'text'
  }
}

/**
 * Map ColumnFieldType to database type
 */
function mapToDatabaseType(type: ColumnFieldType): string {
  switch (type) {
    case ColumnFieldType.Number:
    case ColumnFieldType.Rating:
      return 'numeric'
    case ColumnFieldType.Checkbox:
      return 'boolean'
    case ColumnFieldType.DateTime:
    case ColumnFieldType.CreatedTime:
    case ColumnFieldType.LastModifiedTime:
      return 'timestamp'
    case ColumnFieldType.User:
    case ColumnFieldType.CreatedBy:
    case ColumnFieldType.LastModifiedBy:
    case ColumnFieldType.Relation:
      return 'uuid'
    case ColumnFieldType.MultiSelect:
    case ColumnFieldType.Document:
      return 'jsonb'
    default:
      return 'text'
  }
}

export function useImportBatch() {
  const { menuState, saveMenuItemToDb, findItemById, workspace } = useSingleWorkspaceContext()
  const { createCaseTable, generateSlug } = useTableSchema()
  const { queueImportJobs } = useImportQueue()

  /**
   * Get all existing table names/slugs in the workspace
   */
  function getExistingTableNames(): { names: string[]; slugs: string[] } {
    const names: string[] = []
    const slugs: string[] = []

    function collectFromItems(items: any[]) {
      for (const item of items) {
        if (item.itemType === 'table') {
          names.push(item.label.toLowerCase())
          if (item.slug) {
            slugs.push(item.slug.toLowerCase())
          }
        }
        if (item.children) {
          collectFromItems(item.children)
        }
      }
    }

    collectFromItems(menuState.value.items)
    return { names, slugs }
  }

  /**
   * Generate unique table slug
   */
  function generateUniqueTableSlug(name: string, existingSlugs: string[]): string {
    let baseSlug = generateSlug(name)
    let slug = baseSlug
    let counter = 1

    while (existingSlugs.includes(slug.toLowerCase())) {
      counter++
      slug = `${baseSlug}-${counter}`
    }

    return slug
  }

  /**
   * Parse Excel file and extract sheet data
   */
  async function parseExcelFile(file: File, entityId: string): Promise<SheetData[]> {
    const data = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })

    const sheetNames = workbook.SheetNames || []
    if (sheetNames.length === 0) {
      throw new Error('No sheets found in the file')
    }

    const { slugs: existingSlugs } = getExistingTableNames()
    const parsedSheets: SheetData[] = []
    const usedSlugs = [...existingSlugs]

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName]

      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][]

      // Get headers from first row
      const headerRow = jsonData[0] || []
      const validHeaders = headerRow.filter((h: any) => h !== undefined && h !== null && String(h).trim() !== '').map((h: any) => String(h).trim())

      // Skip sheets with no valid headers
      if (validHeaders.length === 0) {
        continue
      }

      // Generate unique field names
      const fieldNames = generateUniqueFieldNames(validHeaders)

      // Get data rows (excluding header)
      const dataRows = jsonData.slice(1).filter((row: any[]) => row && !row.every((cell: any) => cell === undefined || cell === null || cell === ''))

      // Create field definitions with auto-detected types
      const fields: ImportField[] = validHeaders.map((header, idx) => {
        const originalIdx = headerRow.findIndex(
          (h: any, i: number) =>
            h !== undefined &&
            h !== null &&
            String(h).trim() === header &&
            headerRow.slice(0, i).filter((hh: any) => hh !== undefined && hh !== null && String(hh).trim() === header).length ===
              validHeaders.slice(0, idx).filter((vh) => vh === header).length
        )

        // Collect samples for type detection
        const samples: any[] = []
        for (let i = 0; i < Math.min(20, dataRows.length) && samples.length < 10; i++) {
          const value = dataRows[i]?.[originalIdx]
          if (value !== undefined && value !== null && value !== '') {
            samples.push(value)
          }
        }

        // Get Excel format string for this column if available
        let excelFormat: string | undefined
        // Try to get format from first data cell in this column
        const firstDataRowIndex = 1 // Row 0 is header
        if (firstDataRowIndex < jsonData.length) {
          const cellAddress = XLSX.utils.encode_cell({ r: firstDataRowIndex, c: originalIdx })
          const cell = sheet[cellAddress]
          if (cell && cell.z) {
            excelFormat = cell.z
          }
        }
        console.log('excelFormat', excelFormat)
        const { type, properties } = detectColumnType(samples, excelFormat)

        // Create display structure
        const displayStructure: FieldDisplayStructure = {
          type,
          properties
        }

        return {
          id: uuidv7(),
          fieldName: fieldNames[idx],
          fieldNameAlias: header,
          businessType: mapToBusinessType(type) as any,
          fieldType: mapToDatabaseType(type) as any,
          displayStructure,
          isRequired: false,
          isHidden: false,
          isArray: false,
          isUnique: false,
          fieldLength: 0,
          originalIdx // Store the original column index for row parsing
        }
      })
      // Parse data rows with proper value conversion
      const rows: Record<string, any>[] = []

      // Create a map from column index to field for quick lookup
      const fieldByColumnIndex: Record<number, ImportField> = {}
      fields.forEach((field) => {
        if (field.originalIdx !== undefined && field.originalIdx !== -1) {
          fieldByColumnIndex[field.originalIdx] = field
        }
      })

      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i]
        if (!rowData || rowData.every((cell: any) => cell === undefined || cell === null || cell === '')) {
          continue
        }

        const row: Record<string, any> = {}
        headerRow.forEach((header: any, idx: number) => {
          if (header !== undefined && header !== null && String(header).trim() !== '') {
            const colTitle = String(header).trim()
            const field = fieldByColumnIndex[idx]
            const dateFormat = field?.displayStructure?.type === ColumnFieldType.DateTime ? field.displayStructure.properties?.dateFormat : undefined
            row[colTitle] = cellValueToString(rowData[idx], dateFormat)
          }
        })
        rows.push(row)
      }

      // Generate unique table slug
      const tableSlug = generateUniqueTableSlug(sheetName, usedSlugs)
      usedSlugs.push(tableSlug.toLowerCase())

      parsedSheets.push({
        name: sheetName,
        tableName: sheetName,
        slug: tableSlug,
        headers: validHeaders,
        fields,
        rows
      })
    }

    return parsedSheets
  }

  /**
   * Import Excel file directly without dialog
   */
  async function importExcelFile(file: File, entityId: string, parentFolderId?: string | null): Promise<ImportBatchResult> {
    // Validate file type
    if (!isExcelFile(file)) {
      ElMessage.error('Please drop an Excel file (.xlsx, .xls) or CSV file (.csv)')
      return { success: false, error: 'Invalid file type' }
    }

    try {
      // Parse the Excel file
      const sheets = await parseExcelFile(file, entityId)

      if (sheets.length === 0) {
        ElMessage.warning('No valid sheets found in the file')
        return { success: false, error: 'No valid sheets found' }
      }

      // Check for duplicate table names
      const { names: existingNames } = getExistingTableNames()
      const duplicates = sheets.map((s) => s.tableName.toLowerCase()).filter((name) => existingNames.includes(name))

      if (duplicates.length > 0) {
        const duplicateList = [...new Set(duplicates)].join(', ')

        try {
          await ElMessageBox.confirm(
            `The following sheet names already exist as tables: ${duplicateList}. These sheets will be skipped. Continue importing the remaining sheets?`,
            'Duplicate Tables Found',
            {
              confirmButtonText: 'Continue',
              cancelButtonText: 'Cancel',
              type: 'warning'
            }
          )
        } catch {
          return { success: false, duplicates: [...new Set(duplicates)], error: 'User cancelled due to duplicates' }
        }

        // Filter out duplicate sheets
        const filteredSheets = sheets.filter((s) => !existingNames.includes(s.tableName.toLowerCase()))

        if (filteredSheets.length === 0) {
          ElMessage.warning('All sheets have duplicate names. No tables to import.')
          return { success: false, duplicates: [...new Set(duplicates)], error: 'All sheets are duplicates' }
        }

        return await createTablesFromSheets(filteredSheets, entityId, parentFolderId, file.name)
      }

      return await createTablesFromSheets(sheets, entityId, parentFolderId, file.name)
    } catch (error: any) {
      console.error('Error importing Excel file:', error)
      ElMessage.error(error.message || 'Failed to import Excel file')
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  /**
   * Create tables from parsed sheets
   */
  async function createTablesFromSheets(
    sheets: SheetData[],
    entityId: string,
    parentFolderId: string | null | undefined,
    fileName: string
  ): Promise<ImportBatchResult> {
    const createdTables: { id: string; name: string; physicalTableName: string; fields: any[]; rows: any[] }[] = []

    try {
      // Phase 1: Create tables, fields, views
      for (const sheet of sheets) {
        const tableId = uuidv7()

        // Create the case table structure
        const result = await createCaseTable(
          {
            id: tableId,
            name: sheet.tableName,
            entityId,
            description: `Imported from ${fileName} - Sheet: ${sheet.name}`
          },
          sheet.fields,
          undefined
        )

        // Create tree item
        const treeItem: Partial<CaseTreeRecord> = {
          id: uuidv7(),
          entityId,
          label: sheet.tableName,
          slug: sheet.slug,
          itemType: 'table',
          itemId: tableId,
          parentId: parentFolderId || null,
          order: 0
        }

        // Save tree item to database
        await saveMenuItemToDb(treeItem)

        // Add to local menu state
        if (parentFolderId) {
          const parentFolder = findItemById(menuState.value.items, parentFolderId)
          if (parentFolder && parentFolder.itemType === 'folder') {
            if (!parentFolder.children) {
              parentFolder.children = []
            }
            parentFolder.children.push(treeItem as any)
          } else {
            menuState.value.items.push(treeItem as any)
          }
        } else {
          menuState.value.items.push(treeItem as any)
        }

        createdTables.push({
          id: tableId,
          name: sheet.tableName,
          physicalTableName: result.table.tableName,
          fields: result.fields,
          rows: sheet.rows
        })
      }

      // Show success message
      const tableCount = createdTables.length
      const rowCount = createdTables.reduce((sum, t) => sum + t.rows.length, 0)

      if (rowCount > 0) {
        ElMessage.success(`${tableCount} table(s) created. Importing ${rowCount} rows in background...`)
      } else {
        ElMessage.success(`${tableCount} table(s) created successfully!`)
      }

      // Phase 2: Queue row imports for background processing
      if (rowCount > 0) {
        const importJobs = createdTables
          .filter((t) => t.rows.length > 0)
          .map((t) => ({
            tableName: t.id,
            tableDisplayName: t.name,
            physicalTableName: t.physicalTableName,
            columns: t.fields,
            rows: t.rows
          }))

        queueImportJobs(importJobs)
      }

      return {
        success: true,
        tablesCreated: createdTables.map((t) => ({ id: t.id, name: t.name }))
      }
    } catch (error: any) {
      console.error('Error creating tables:', error)
      ElMessage.error('Failed to create tables. Please try again.')
      return { success: false, error: error.message || 'Failed to create tables' }
    }
  }

  return {
    importExcelFile,
    isExcelFile
  }
}
