


import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { newClientApi } from 'api'


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
export function generateFieldName(title: string): string {
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
export function generateUniqueFieldNames(titles: string[]): string[] {
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
export function detectAndFlattenHeaders(jsonData: any[][]): { headers: string[]; headerRowCount: number } {
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
export function detectColumnType(samples: any[], excelFormat?: string): { type: ColumnFieldType; properties: Record<string, any> } {
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
export function cellValueToString(value: any, dateFormat?: string, fieldType?: ColumnFieldType, fieldProperties?: Record<string, any>): string {
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
 * Check if a file is an Excel file
 */
export function isExcelFile(file: File): boolean {
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
  const validExtensions = ['xlsx', 'xls', 'csv']
  const extension = file.name.split('.').pop()?.toLowerCase()

  return validTypes.includes(file.type) || validExtensions.includes(extension || '')
}

export function useImportBatch() {
  /**
   * Import Excel file directly without dialog
   */
  let entityId = ''
  let parentFolderId = ''
  const uploadProgress = ref(0)
  const isImporting = ref(false)
  const selectedFile = ref<File | null>(null)
  const errorMessage = ref('')
  function initData(data: any) {
    entityId = data.entityId
    parentFolderId = data.parentFolderId
  }

  async function importExcelFile(file: File) {
    try {
      isImporting.value = true
      console.log('importExcelFile', file, entityId, parentFolderId)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reference_entity_id', entityId)
      if (parentFolderId) formData.append('parent_folder_id', parentFolderId)
      uploadProgress.value = 0
      const {
        data: { job_id }
      }: any = await newClientApi.postDynamicDbImportUpload(formData)
      if (job_id) {
        const result: any = await checkJobStatus(job_id, uploadProgress)
        return result
      } else {
        throw new Error('No job ID returned from server')
      }
    } catch (error) {
      console.error('importExcelFile error', error)
      isImporting.value = false
      return {
        status: 'failed',
        hasErrorReport: false
      }
    } finally {
      isImporting.value = false
    }
  }
  function reset() {
    selectedFile.value = null
    errorMessage.value = ''
    uploadProgress.value = 0
  }
  return {
    initData,
    importExcelFile,
    isExcelFile,
    isImporting,
    selectedFile,
    errorMessage,
    uploadProgress,
    reset
  }
}
async function checkJobStatus(jobId: string, uploadProgress: Ref<number>) {
  const {
    data: { status, progress: progressValue, error_report_url, sheets }
  }: any = await newClientApi.getDynamicDbImportJobidStatus(jobId)
  uploadProgress.value = progressValue
  if (status === 'completed') {
    const result: any = {
      status,
      hasErrorReport: !!error_report_url,
      jobId
    }
    if (error_report_url && sheets && sheets.length > 0) {
      let errorMessage = ''
      for (const sheet of sheets) {
        if (sheet.skipped_rows > 0) {
          errorMessage += `<b>Sheet: ${sheet.sheet_name}</b>`
          errorMessage += `<div>Skipped rows: ${sheet.skipped_rows}</div>`
          errorMessage += `<br>`
        }
      }
      if (errorMessage) {
        result.errorMessage = errorMessage
      }
    }
    return result
  } else if(status === 'failed') {
    return {
      status,
      hasErrorReport: false,
      jobId
    }
  } else {
    const promise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        const result: any = await checkJobStatus(jobId, uploadProgress)
        if (result.status === 'completed') {
          resolve(result)
        }
      }, 1000)
    })
    return promise
  }
}
