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

/**
 * Info about a duplicate sheet that matches an existing table
 */
export interface DuplicateSheetInfo {
  sheetName: string
  sheetIndex: number
  existingTableId: string
  existingTableName: string
  rows: Record<string, any>[]
  headers: string[]
}

/**
 * Info about a skipped sheet and the reason
 */
export interface SkippedSheetInfo {
  sheetName: string
  sheetIndex: number
  reason: 'hidden' | 'no_headers' | 'empty'
  details?: string
}

interface ImportBatchResult {
  success: boolean
  duplicates?: string[]
  duplicateSheets?: DuplicateSheetInfo[]
  tablesCreated?: { id: string; name: string }[]
  tablesUpdated?: { id: string; name: string }[]
  skippedSheets?: SkippedSheetInfo[]
  error?: string
  /** When 'update' action is chosen, caller should handle duplicateSheets */
  action?: 'skip' | 'update' | 'cancelled'
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
 * Check if a value looks like a header (descriptive label) vs data
 * Headers are typically: longer text, contain spaces, descriptive words
 * Data is typically: short IDs, numbers, names, codes
 */
function looksLikeHeader(value: string): boolean {
  if (!value || value.trim() === '') return false

  const str = value.trim()
  const lowerStr = str.toLowerCase()

  // Common header keywords
  const headerKeywords = [
    'id',
    'no',
    'number',
    'name',
    'date',
    'time',
    'status',
    'type',
    'code',
    'description',
    'remark',
    'note',
    'amount',
    'price',
    'quantity',
    'total',
    'address',
    'email',
    'phone',
    'contact',
    'person',
    'company',
    'sales',
    'start',
    'end',
    'expiry',
    'update',
    'duration',
    'value',
    'item'
  ]

  // Check for header indicators
  const hasHeaderKeyword = headerKeywords.some((kw) => lowerStr.includes(kw))
  const hasMultipleWords = str.includes(' ') || str.includes('_')
  const isReasonableLength = str.length >= 3 && str.length <= 50
  const looksLikeLabel = /^[A-Za-z][A-Za-z0-9\s_\-\(\)\/]+$/.test(str)

  // Score the likelihood of being a header
  let score = 0
  if (hasHeaderKeyword) score += 2
  if (hasMultipleWords) score += 1
  if (isReasonableLength) score += 1
  if (looksLikeLabel) score += 1

  // Consider it a header if score >= 3
  return score >= 3
}

/**
 * Check if a row looks like a header row (most cells look like headers)
 */
function looksLikeHeaderRow(row: string[]): boolean {
  const nonEmptyCells = row.filter((cell) => cell !== '')
  if (nonEmptyCells.length === 0) return false

  const headerLikeCells = nonEmptyCells.filter((cell) => looksLikeHeader(cell))

  // If majority of cells look like headers, it's likely a header row
  return headerLikeCells.length >= nonEmptyCells.length * 0.5
}

/**
 * Detect multi-level headers and flatten them into single-level headers.
 * Returns the flattened headers and the number of rows that are part of the header.
 *
 * Example:
 *   Row 1: [Name, Name, Address, Address]  <- Group headers
 *   Row 2: [First, Last, City, Street]     <- Actual column headers
 *   Result: [Name_First, Name_Last, Address_City, Address_Street]
 */
function detectAndFlattenHeaders(jsonData: any[][]): { headers: string[]; headerRowCount: number } {
  if (jsonData.length === 0) {
    return { headers: [], headerRowCount: 0 }
  }

  // Find the last header row by analyzing the data pattern
  let headerRowCount = 1 // Default to 1 row header
  const maxCheckRows = Math.min(5, jsonData.length) // Check up to 5 rows

  // Get all potential header rows
  const potentialHeaderRows: string[][] = []
  for (let i = 0; i < maxCheckRows; i++) {
    const row = jsonData[i] || []
    const stringCells = row.map((cell) => (cell !== undefined && cell !== null ? String(cell).trim() : ''))
    potentialHeaderRows.push(stringCells)
  }

  // First, verify that row 0 looks like a header row
  const firstRowLooksLikeHeader = looksLikeHeaderRow(potentialHeaderRows[0])

  // Detect multi-level headers by looking for:
  // 1. Subsequent rows that also look like headers
  // 2. Alignment patterns (empty cells under group headers)
  // 3. Hierarchical structure where row 1+ completes row 0

  for (let i = 1; i < maxCheckRows; i++) {
    const prevRow = potentialHeaderRows[i - 1]
    const currRow = potentialHeaderRows[i]

    // Check if current row looks like headers
    const currLooksLikeHeader = looksLikeHeaderRow(currRow)

    // If the first row looks like headers but current row doesn't, stop here
    if (firstRowLooksLikeHeader && !currLooksLikeHeader) {
      break
    }

    // If neither row looks like headers, assume single-row headers
    if (!firstRowLooksLikeHeader && !currLooksLikeHeader) {
      break
    }

    // Check alignment - sub-headers often have content positioned under group headers
    const prevNonEmpty = prevRow.filter((h) => h !== '').length
    const currNonEmpty = currRow.filter((h) => h !== '').length

    let alignmentScore = 0
    let prevFilledCol = -1
    let hasEmptyUnderGroup = false

    for (let col = 0; col < Math.max(prevRow.length, currRow.length); col++) {
      const prevCell = prevRow[col] || ''
      const currCell = currRow[col] || ''

      // Track the last column with content in previous row
      if (prevCell !== '') {
        prevFilledCol = col
      }

      // If current row has content under a group header, increment score
      if (currCell !== '' && prevFilledCol !== -1) {
        alignmentScore++
      }

      // Check for empty cells under group headers (indicates multi-level)
      if (prevCell !== '' && currCell === '' && prevFilledCol === col) {
        hasEmptyUnderGroup = true
      }
    }

    // Multi-level header indicators:
    // 1. Current row looks like headers AND
    // 2. Good alignment with previous row AND
    // 3. Either has empty cells under groups OR fewer non-empty cells than prev
    const isMultiLevel =
      currLooksLikeHeader && alignmentScore >= currNonEmpty * 0.5 && (hasEmptyUnderGroup || currNonEmpty < prevNonEmpty || currNonEmpty <= prevNonEmpty * 0.8)

    if (isMultiLevel) {
      headerRowCount = i + 1
    } else {
      // This row doesn't look like a header row, stop here
      break
    }
  }

  // Now flatten the headers
  const maxCols = Math.max(...potentialHeaderRows.slice(0, headerRowCount).map((r) => r.length))
  const flattenedHeaders: string[] = []

  for (let col = 0; col < maxCols; col++) {
    const parts: string[] = []
    let lastGroupName = ''

    for (let rowIdx = 0; rowIdx < headerRowCount; rowIdx++) {
      const cell = potentialHeaderRows[rowIdx][col] || ''

      if (cell !== '') {
        // For the first row, use as group name
        if (rowIdx === 0) {
          lastGroupName = cell
          parts.push(cell)
        } else {
          // For subsequent rows, check if it's a sub-item or a new group
          // If it's more specific/detailed than previous, add it
          if (!parts.includes(cell) && cell !== lastGroupName) {
            parts.push(cell)
          }
        }
      } else if (rowIdx > 0 && lastGroupName !== '') {
        // Empty cell in sub-header row - inherit from the group above
        // but don't add duplicate
      }
    }

    // Combine parts with underscore, or use a default name
    const headerName = parts.length > 0 ? parts.join('_') : `Column_${col + 1}`
    flattenedHeaders.push(headerName)
  }

  // Clean up headers
  const cleanedHeaders = flattenedHeaders.map((h) => {
    // Remove newlines, excessive underscores, and clean up
    return h
      .replace(/\r\n|\r|\n/g, ' ') // Replace newlines with space
      .replace(/_+/g, '_') // Remove excessive underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .trim()
  })

  return { headers: cleanedHeaders, headerRowCount }
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

  // Helper function to parse numbers with currency symbols and commas
  function parseNumberWithSymbols(value: any): { parsed: number | null; symbol: string | null; hasComma: boolean; hasSpace: boolean; precision: number } {
    if (value === null || value === undefined) {
      return { parsed: null, symbol: null, hasComma: false, hasSpace: false, precision: 0 }
    }

    const strValue = String(value).trim()
    if (strValue === '') {
      return { parsed: null, symbol: null, hasComma: false, hasSpace: false, precision: 0 }
    }

    // Check for spaces between digits - if there are spaces between digits, it's likely not a number
    // (e.g., "123 456" could be a phone number or ID, not a number)
    const hasSpaceBetweenDigits = /\d\s+\d/.test(strValue)
    if (hasSpaceBetweenDigits) {
      return { parsed: null, symbol: null, hasComma: false, hasSpace: true, precision: 0 }
    }

    // Check for common currency symbols at start or end
    const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', '₽', '₴', '₫', '₭', '₮', '₱', '₲', '₵', '₸', '₺', '₼', '₾', '₿']
    let symbol = null
    let cleanStr = strValue

    // Check for symbol at start (with optional space after)
    for (const sym of currencySymbols) {
      if (cleanStr.startsWith(sym)) {
        symbol = sym
        cleanStr = cleanStr.substring(sym.length).trim()
        break
      }
    }

    // Check for symbol at end if not found at start
    if (!symbol) {
      for (const sym of currencySymbols) {
        if (cleanStr.endsWith(sym)) {
          symbol = sym
          cleanStr = cleanStr.substring(0, cleanStr.length - sym.length).trim()
          break
        }
      }
    }

    // Check for percent symbol
    if (!symbol && cleanStr.endsWith('%')) {
      symbol = '%'
      cleanStr = cleanStr.substring(0, cleanStr.length - 1).trim()
    }

    // Check for commas (thousand separators)
    const hasComma = cleanStr.includes(',')
    if (hasComma) {
      // Remove commas for parsing
      cleanStr = cleanStr.replace(/,/g, '')
    }

    // Check for spaces as thousand separators (common in European formats like "1 234.56")
    const hasSpaceAsSeparator = /\d\s\d/.test(cleanStr)
    if (hasSpaceAsSeparator) {
      // Remove spaces for parsing
      cleanStr = cleanStr.replace(/\s/g, '')
    }

    // Parse the number
    const parsed = parseFloat(cleanStr)
    if (isNaN(parsed)) {
      return { parsed: null, symbol: null, hasComma: false, hasSpace: hasSpaceBetweenDigits || hasSpaceAsSeparator, precision: 0 }
    }

    // Calculate precision (decimal places)
    let precision = 0
    const decimalMatch = cleanStr.match(/\.(\d+)/)
    if (decimalMatch) {
      precision = decimalMatch[1].length
    }

    return { parsed, symbol, hasComma, hasSpace: hasSpaceBetweenDigits || hasSpaceAsSeparator, precision }
  }

  // Check for Number type with improved detection
  const parsedNumbers = samples.map(parseNumberWithSymbols)
  const validNumbers = parsedNumbers.filter((n) => n.parsed !== null)

  // Check if there are too many values with spaces between digits (not numbers)
  const hasSpaceCount = parsedNumbers.filter((n) => n.hasSpace).length
  if (hasSpaceCount >= samples.length * 0.3) {
    // If 30% or more have spaces between digits, it's likely not a number column
    // Skip to next type detection
  } else if (validNumbers.length >= samples.length * 0.8) {
    // Calculate average precision
    const avgPrecision = Math.round(validNumbers.reduce((sum, n) => sum + n.precision, 0) / validNumbers.length)
    const precision = Math.min(Math.max(avgPrecision, 0), 6) // Clamp between 0 and 6

    // Check for common symbols
    const symbols = validNumbers.map((n) => n.symbol).filter((sym): sym is string => sym !== null)
    const symbolCounts: Record<string, number> = {}
    symbols.forEach((sym) => {
      symbolCounts[sym] = (symbolCounts[sym] || 0) + 1
    })

    // Find most common symbol
    let mostCommonSymbol = ''
    let maxCount = 0
    for (const [sym, count] of Object.entries(symbolCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostCommonSymbol = sym
      }
    }

    // Use symbol if it appears in majority of valid numbers with symbols
    const symbol = maxCount >= symbols.length * 0.8 ? mostCommonSymbol : ''

    // Check for commas
    const hasCommaCount = validNumbers.filter((n) => n.hasComma).length
    const showThouComma = hasCommaCount >= validNumbers.length * 0.8

    return {
      type: ColumnFieldType.Number,
      properties: {
        symbol,
        precision,
        symbolAlign: symbol ? 'left' : 'default',
        showThouComma
      }
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
 * Convert cell value to string for database storage
 * @param value The cell value to convert
 * @param dateFormat Optional date format to use for parsing date strings
 * @param fieldProperties Optional field properties for parsing numbers with symbols
 */
function cellValueToString(value: any, dateFormat?: string, fieldType?: ColumnFieldType, fieldProperties?: Record<string, any>): string {
  if (value === undefined || value === null) {
    return ''
  }

  // Note: Excel values come as strings when cellNF option is used
  // Dates will be string values that need to be parsed with dateFormat

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

    // Check if this might be a number with symbols (currency, commas, etc.)
    // Only parse as number if we have field type indicating it's a number field
    if (fieldType === ColumnFieldType.Number || fieldType === ColumnFieldType.Rating) {
      const trimmedValue = value.trim()
      if (trimmedValue !== '') {
        // Remove currency symbols and commas for parsing
        let cleanValue = trimmedValue

        // Remove common currency symbols
        const currencySymbols = ['$', '€', '£', '¥', '₹', '₩', '₽', '₴', '₫', '₭', '₮', '₱', '₲', '₵', '₸', '₺', '₼', '₾', '₿', '%']
        for (const symbol of currencySymbols) {
          if (cleanValue.startsWith(symbol)) {
            cleanValue = cleanValue.substring(symbol.length).trim()
          } else if (cleanValue.endsWith(symbol)) {
            cleanValue = cleanValue.substring(0, cleanValue.length - symbol.length).trim()
          }
        }

        // Remove thousand separators (commas)
        cleanValue = cleanValue.replace(/,/g, '')

        // Remove spaces that might be used as thousand separators (e.g., "1 234.56")
        cleanValue = cleanValue.replace(/\s/g, '')

        // Try to parse as number
        const parsedNumber = parseFloat(cleanValue)
        if (!isNaN(parsedNumber)) {
          return String(parsedNumber)
        }
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
  const { queueImportJobs, notifyImportCompleted } = useImportQueue()
  const { analyzeTableForRelations } = useRelationSuggestions()

  /**
   * Get all existing table names/slugs in the workspace
   */
  function getExistingTableNames(): { names: string[]; slugs: string[]; tableMap: Map<string, { id: string; name: string; dataTableId: string }> } {
    const names: string[] = []
    const slugs: string[] = []
    const tableMap = new Map<string, { id: string; name: string; dataTableId: string }>()

    function collectFromItems(items: any[]) {
      for (const item of items) {
        if (item.itemType === 'table') {
          const lowerName = item.label.toLowerCase()
          names.push(lowerName)
          if (item.slug) {
            slugs.push(item.slug.toLowerCase())
          }
          // Store table info by lowercase name for lookup
          tableMap.set(lowerName, {
            id: item.id,
            name: item.label,
            dataTableId: item.itemId
          })
        }
        if (item.children) {
          collectFromItems(item.children)
        }
      }
    }

    collectFromItems(menuState.value.items)
    return { names, slugs, tableMap }
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
  async function parseExcelFile(file: File, entityId: string): Promise<{ sheets: SheetData[]; skippedSheets: SkippedSheetInfo[] }> {
    const data = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })

    const sheetNames = workbook.SheetNames || []
    if (sheetNames.length === 0) {
      throw new Error('No sheets found in the file')
    }

    const { slugs: existingSlugs } = getExistingTableNames()
    const parsedSheets: SheetData[] = []
    const skippedSheets: SkippedSheetInfo[] = []
    const usedSlugs = [...existingSlugs]

    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i]
      const sheet = workbook.Sheets[sheetName]

      // Skip hidden sheets (Hidden = 1 means hidden in Excel UI)
      const wbSheet = (workbook as any).Workbook?.Sheets?.[i]
      if (wbSheet?.Hidden === 1) {
        console.log(`[useImportBatch] Skipping hidden sheet: '${sheetName}'`)
        skippedSheets.push({
          sheetName,
          sheetIndex: i,
          reason: 'hidden',
          details: 'Sheet is hidden in Excel'
        })
        continue
      }

      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][]

      // Check if sheet is completely empty
      const isEmpty = jsonData.length === 0 || jsonData.every((row) => !row || row.every((cell) => cell === undefined || cell === null || cell === ''))
      if (isEmpty) {
        console.log(`[useImportBatch] Skipping empty sheet: '${sheetName}'`)
        skippedSheets.push({
          sheetName,
          sheetIndex: i,
          reason: 'empty',
          details: 'Sheet contains no data'
        })
        continue
      }

      // Detect and flatten multi-level headers (for pivot table style sheets)
      const { headers: validHeaders, headerRowCount } = detectAndFlattenHeaders(jsonData)

      // Skip sheets with no valid headers
      if (validHeaders.length === 0) {
        console.log(`[useImportBatch] Skipping sheet '${sheetName}': no valid headers`)
        skippedSheets.push({
          sheetName,
          sheetIndex: i,
          reason: 'no_headers',
          details: 'No valid column headers found'
        })
        continue
      }

      if (headerRowCount > 1) {
        console.log(`[useImportBatch] Detected multi-level headers in '${sheetName}': ${headerRowCount} rows flattened to ${validHeaders.length} columns`)
      }

      // Generate unique field names
      const fieldNames = generateUniqueFieldNames(validHeaders)

      // Get data rows (excluding all header rows)
      const dataRows = jsonData
        .slice(headerRowCount)
        .filter((row: any[]) => row && !row.every((cell: any) => cell === undefined || cell === null || cell === ''))

      // Create field definitions with auto-detected types
      const fields: ImportField[] = validHeaders.map((header, idx) => {
        // For flattened headers, use the column index directly as original index
        const originalIdx = idx

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
        // Account for multi-level headers when getting cell address
        const firstDataRowIndex = headerRowCount // Use detected header row count
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

      for (let i = headerRowCount; i < jsonData.length; i++) {
        const rowData = jsonData[i]
        if (!rowData || rowData.every((cell: any) => cell === undefined || cell === null || cell === '')) {
          continue
        }

        const row: Record<string, any> = {}
        validHeaders.forEach((header: string, idx: number) => {
          const field = fieldByColumnIndex[idx]
          const dateFormat = field?.displayStructure?.type === ColumnFieldType.DateTime ? field.displayStructure.properties?.dateFormat : undefined
          const fieldType = field?.displayStructure?.type
          const fieldProperties = field?.displayStructure?.properties
          row[header] = cellValueToString(rowData[idx], dateFormat, fieldType, fieldProperties)
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

    const hiddenCount = sheetNames.length - parsedSheets.length - skippedSheets.length
    console.log(`[useImportBatch] Parsed ${parsedSheets.length} sheets, skipped ${skippedSheets.length} sheets from ${sheetNames.length} total`)

    return { sheets: parsedSheets, skippedSheets }
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
      const { sheets, skippedSheets } = await parseExcelFile(file, entityId)

      if (sheets.length === 0) {
        ElMessage.warning('No valid sheets found in the file')
        return { success: false, error: 'No valid sheets found', skippedSheets }
      }

      // Check for duplicate table names
      const { names: existingNames, tableMap } = getExistingTableNames()
      const duplicateSheetNames = sheets.map((s) => s.tableName.toLowerCase()).filter((name) => existingNames.includes(name))

      if (duplicateSheetNames.length > 0) {
        const uniqueDuplicates = [...new Set(duplicateSheetNames)]
        const duplicateList = uniqueDuplicates.join(', ')
        const newSheetsCount = sheets.length - uniqueDuplicates.length

        // Build message based on situation
        let message = `Found ${uniqueDuplicates.length} sheet(s) matching existing tables: ${duplicateList}.`
        if (newSheetsCount > 0) {
          message += ` ${newSheetsCount} new table(s) will be created.`
        }
        message += '\n\nWhat would you like to do?'

        try {
          const action = await ElMessageBox({
            title: 'Duplicate Tables Found',
            message,
            type: 'warning',
            showCancelButton: true,
            distinguishCancelAndClose: true,
            confirmButtonText: 'Update Existing',
            cancelButtonText: 'Skip Duplicates',
            closeOnClickModal: false
          })

          console.log('[useImportBatch] ElMessageBox action:', action, typeof action)

          // User clicked "Update Existing" - ElMessageBox resolves when confirm is clicked
          console.log('[useImportBatch] User chose to update existing')

          // Build duplicate sheet info for the caller to handle
          const duplicateSheets: DuplicateSheetInfo[] = []

          for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i]
            const lowerName = sheet.tableName.toLowerCase()
            const existingTable = tableMap.get(lowerName)

            if (existingTable) {
              console.log('[useImportBatch] Adding duplicate sheet:', sheet.name, '-> table:', existingTable)
              duplicateSheets.push({
                sheetName: sheet.name,
                sheetIndex: i,
                existingTableId: existingTable.dataTableId,
                existingTableName: existingTable.name,
                rows: sheet.rows,
                headers: sheet.headers
              })
            }
          }

          console.log('[useImportBatch] Total duplicate sheets:', duplicateSheets.length)

          // Create new tables (non-duplicates)
          const newSheets = sheets.filter((s) => !existingNames.includes(s.tableName.toLowerCase()))
          let createResult: ImportBatchResult = { success: true, tablesCreated: [] }

          if (newSheets.length > 0) {
            createResult = await createTablesFromSheets(newSheets, entityId, parentFolderId, file.name, skippedSheets)
          }

          const finalResult: ImportBatchResult = {
            ...createResult,
            action: 'update',
            duplicates: uniqueDuplicates,
            duplicateSheets,
            skippedSheets
          }
          console.log('[useImportBatch] Returning update result:', finalResult)
          console.log('[useImportBatch] About to return from importExcelFile')
          return finalResult
        } catch (actionResult) {
          // User clicked "Skip Duplicates" (cancel button) or closed the dialog
          if (actionResult === 'cancel') {
            // Skip duplicates and continue with new tables
            const filteredSheets = sheets.filter((s) => !existingNames.includes(s.tableName.toLowerCase()))

            if (filteredSheets.length === 0) {
              ElMessage.info('All sheets match existing tables. No new tables to import.')
              return {
                success: true,
                action: 'skip',
                duplicates: uniqueDuplicates,
                tablesCreated: [],
                skippedSheets
              }
            }

            const result = await createTablesFromSheets(filteredSheets, entityId, parentFolderId, file.name, skippedSheets)
            return { ...result, action: 'skip', duplicates: uniqueDuplicates, skippedSheets }
          }

          // User closed the dialog (X button or ESC)
          return {
            success: false,
            action: 'cancelled',
            duplicates: uniqueDuplicates,
            error: 'Import cancelled',
            skippedSheets
          }
        }
      }

      const result = await createTablesFromSheets(sheets, entityId, parentFolderId, file.name, skippedSheets)
      return { ...result, skippedSheets }
    } catch (error: any) {
      console.error('Error importing Excel file:', error)
      ElMessage.error(error.message || 'Failed to import Excel file')
      return { success: false, error: error.message || 'Unknown error', skippedSheets }
    }
  }

  /**
   * Create tables from parsed sheets
   */
  async function createTablesFromSheets(
    sheets: SheetData[],
    entityId: string,
    parentFolderId: string | null | undefined,
    fileName: string,
    skippedSheets: SkippedSheetInfo[] = []
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
            rows: t.rows,
            entityId // Pass entityId for relation analysis after import
          }))

        queueImportJobs(importJobs)
      } else {
        // No rows to import, but we still want to show a report
        // Create a report with empty jobs to show table creation summary
        const now = new Date().toISOString()
        const emptyReport: import('./useImportQueue').ImportReport = {
          id: uuidv7(),
          jobs: createdTables.map((t) => ({
            id: uuidv7(),
            tableName: t.id,
            tableDisplayName: t.name,
            physicalTableName: t.physicalTableName,
            columns: t.fields,
            rows: [],
            progress: { total: 0, imported: 0, errors: [] },
            status: 'completed' as const,
            startedAt: now,
            completedAt: now,
            entityId
          })),
          totalTables: tableCount,
          totalRowsAttempted: 0,
          totalRowsImported: 0,
          totalErrors: 0,
          startedAt: now,
          completedAt: now,
          skippedSheets
        }
        notifyImportCompleted(emptyReport)
      }

      return {
        success: true,
        tablesCreated: createdTables.map((t) => ({ id: t.id, name: t.name })),
        skippedSheets
      }
    } catch (error: any) {
      console.error('Error creating tables:', error)
      ElMessage.error('Failed to create tables. Please try again.')
      return { success: false, error: error.message || 'Failed to create tables', skippedSheets }
    }
  }

  return {
    importExcelFile,
    isExcelFile
  }
}
