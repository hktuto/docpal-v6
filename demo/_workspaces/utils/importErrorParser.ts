/**
 * Import Error Parser Utility
 *
 * Converts technical database error messages into user-friendly error messages
 * for Excel/CSV import operations.
 */

export interface ParsedImportError {
  /** Original technical error message */
  technicalError: string
  /** User-friendly error message */
  userFriendlyMessage: string
  /** Type of error for categorization */
  errorType: 'validation' | 'constraint' | 'data_type' | 'unique' | 'null' | 'foreign_key' | 'length' | 'format' | 'unknown'
  /** Affected column name if available */
  columnName?: string
  /** Suggested fix for the user */
  suggestedFix?: string
  /** Additional context about the error */
  context?: Record<string, any>
}

/**
 * Parse a database error message and convert it to a user-friendly format
 */
export function parseImportError(
  errorMessage: string,
  rowData?: Record<string, any>,
  columnMapping?: Record<string, string> // Maps display names to SQL column names
): ParsedImportError {
  const technicalError = errorMessage.trim()

  // Try to extract column name from error message
  const columnName = extractColumnName(technicalError, columnMapping)

  // Get the actual value that caused the error
  const problematicValue = columnName && rowData ? getValueFromRow(rowData, columnName, columnMapping) : undefined

  // Parse based on common PostgreSQL error patterns
  const parsed = parsePostgreSQLError(technicalError, columnName, problematicValue)

  return {
    technicalError,
    userFriendlyMessage: parsed.message,
    errorType: parsed.type,
    columnName: parsed.columnName || columnName,
    suggestedFix: parsed.suggestedFix,
    context: {
      problematicValue,
      ...parsed.context
    }
  }
}

/**
 * Extract column name from PostgreSQL error messages
 */
function extractColumnName(errorMessage: string, columnMapping?: Record<string, string>): string | undefined {
  // Common PostgreSQL error patterns
  const patterns = [
    // null value in column "email" violates not-null constraint
    /column\s+"([^"]+)"\s+/i,
    // duplicate key value violates unique constraint "users_email_key"
    /constraint\s+"[^_]+_([^_]+)_[^"]+"/i,
    // value too long for type character varying(255)
    /for type\s+\w+\s*\(\s*(\d+)\s*\)/i,
    // invalid input syntax for type integer: "abc"
    /for type\s+(\w+):/i
  ]

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern)
    if (match && match[1]) {
      const extracted = match[1]

      // Try to map SQL column name back to display name
      if (columnMapping) {
        const displayName = Object.keys(columnMapping).find((key) => columnMapping[key] === extracted || key === extracted)
        return displayName || extracted
      }

      return extracted
    }
  }

  return undefined
}

/**
 * Parse PostgreSQL specific error messages
 */
function parsePostgreSQLError(
  errorMessage: string,
  columnName?: string,
  problematicValue?: any
): {
  message: string
  type: ParsedImportError['errorType']
  columnName?: string
  suggestedFix?: string
  context?: Record<string, any>
} {
  const lowerError = errorMessage.toLowerCase()

  // NULL constraint violation
  if (lowerError.includes('null value') && lowerError.includes('not-null constraint')) {
    return {
      message: columnName
        ? `"${columnName}" cannot be empty. Please provide a value for this column.`
        : 'A required field is empty. Please fill in all required fields.',
      type: 'null',
      columnName,
      suggestedFix: columnName ? `Add a value to the "${columnName}" column in your Excel file.` : 'Check your Excel file for empty required fields.',
      context: { constraintType: 'NOT NULL' }
    }
  }

  // UNIQUE constraint violation
  if (lowerError.includes('duplicate key') && lowerError.includes('unique constraint')) {
    return {
      message: columnName
        ? `The value "${problematicValue}" in "${columnName}" already exists. Each value must be unique.`
        : 'Duplicate value found. This value already exists in the database.',
      type: 'unique',
      columnName,
      suggestedFix: columnName ? `Use a different value for "${columnName}" or remove the duplicate entry.` : 'Check for duplicate values in your data.',
      context: {
        constraintType: 'UNIQUE',
        duplicateValue: problematicValue
      }
    }
  }

  // Data type errors
  if (lowerError.includes('invalid input syntax')) {
    const typeMatch = errorMessage.match(/for type (\w+)/i)
    const dataType = typeMatch ? typeMatch[1] : 'unknown'

    // Check if the problematic value is an empty string
    if (problematicValue === '' || problematicValue === null || problematicValue === undefined) {
      return {
        message: columnName
          ? `Empty value found in numeric column "${columnName}". Use a number or leave the cell completely blank.`
          : 'Empty value found in numeric column.',
        type: 'data_type',
        columnName,
        suggestedFix: columnName
          ? `Enter a valid number in "${columnName}" or delete the cell content completely (not just empty string).`
          : 'Check for empty cells in numeric columns.',
        context: {
          expectedType: dataType,
          actualValue: problematicValue,
          isEmptyValue: true
        }
      }
    }

    return {
      message: columnName ? `"${problematicValue}" is not a valid ${dataType} value for "${columnName}".` : `Invalid ${dataType} value found.`,
      type: 'data_type',
      columnName,
      suggestedFix: columnName ? getDataTypeSuggestion(dataType, columnName) : `Check your data for invalid ${dataType} values.`,
      context: {
        expectedType: dataType,
        actualValue: problematicValue
      }
    }
  }

  // Length/Size errors
  if (lowerError.includes('value too long') || lowerError.includes('exceeds maximum length')) {
    const lengthMatch = errorMessage.match(/\((\d+)\)/)
    const maxLength = lengthMatch ? parseInt(lengthMatch[1]) : undefined

    return {
      message: columnName
        ? `"${columnName}" value is too long${maxLength ? ` (maximum ${maxLength} characters)` : ''}.`
        : 'Value exceeds maximum allowed length.',
      type: 'length',
      columnName,
      suggestedFix: columnName
        ? `Shorten the value in "${columnName}" to ${maxLength ? `${maxLength} characters or less` : 'a shorter length'}.`
        : 'Check for values that are too long.',
      context: {
        maxLength,
        actualLength: typeof problematicValue === 'string' ? problematicValue.length : undefined
      }
    }
  }

  // Foreign key constraint violation
  if (lowerError.includes('foreign key constraint') || lowerError.includes('violates foreign key constraint')) {
    // Check if the problematic value is an empty string or null
    if (problematicValue === '' || problematicValue === null || problematicValue === undefined) {
      return {
        message: columnName
          ? `Empty value found in foreign key column "${columnName}". Use a valid reference or leave the cell completely blank.`
          : 'Empty value found in foreign key column.',
        type: 'foreign_key',
        columnName,
        suggestedFix: columnName
          ? `Enter a valid reference in "${columnName}" or delete the cell content completely.`
          : 'Check for empty cells in foreign key columns.',
        context: { constraintType: 'FOREIGN KEY', isEmptyValue: true }
      }
    }

    return {
      message: columnName
        ? `The value "${problematicValue}" in "${columnName}" doesn't exist in the related table.`
        : 'Referenced value not found in related table.',
      type: 'foreign_key',
      columnName,
      suggestedFix: columnName
        ? `Make sure "${problematicValue}" exists in the related table before importing.`
        : 'Check all foreign key references in your data.',
      context: { constraintType: 'FOREIGN KEY' }
    }
  }

  // Check constraint violation
  if (lowerError.includes('check constraint')) {
    return {
      message: columnName ? `"${problematicValue}" doesn't meet the requirements for "${columnName}".` : "Value doesn't meet validation requirements.",
      type: 'validation',
      columnName,
      suggestedFix: columnName ? `Check the validation rules for "${columnName}" and correct the value.` : 'Review your data against validation rules.',
      context: { constraintType: 'CHECK' }
    }
  }

  // Format/Pattern errors (common for email, phone, etc.)
  if (lowerError.includes('invalid format') || lowerError.includes('does not match pattern')) {
    return {
      message: columnName ? `"${problematicValue}" has an invalid format for "${columnName}".` : 'Invalid format detected.',
      type: 'format',
      columnName,
      suggestedFix: columnName
        ? `Make sure values in "${columnName}" follow the correct format (e.g., email@example.com for emails).`
        : 'Check data formats in your file.',
      context: { actualValue: problematicValue }
    }
  }

  // Default fallback - try to make it more readable
  return {
    message: makeErrorMessageReadable(errorMessage, columnName, problematicValue),
    type: 'unknown',
    columnName,
    suggestedFix: 'Check your data and try again. If the problem persists, contact support.',
    context: { originalError: errorMessage }
  }
}

/**
 * Make technical error messages more readable
 */
function makeErrorMessageReadable(errorMessage: string, columnName?: string, problematicValue?: any): string {
  let message = errorMessage

  // Remove technical details
  message = message.replace(/violates\s+\w+\s+constraint\s+"[^"]+"/gi, '')
  message = message.replace(/column\s+"[^"]+"/gi, columnName ? `"${columnName}"` : 'this field')
  message = message.replace(/null value/i, 'empty value')
  message = message.replace(/input syntax/i, 'format')

  // Capitalize first letter and add period
  message = message.trim()
  if (message.length > 0) {
    message = message.charAt(0).toUpperCase() + message.slice(1)
    if (!message.endsWith('.') && !message.endsWith('!') && !message.endsWith('?')) {
      message += '.'
    }
  }

  // Add context if available
  if (columnName && problematicValue !== undefined) {
    message = `Error in "${columnName}" with value "${problematicValue}": ${message}`
  } else if (columnName) {
    message = `Error in "${columnName}": ${message}`
  }

  return message || 'An error occurred during import.'
}

/**
 * Get value from row data using column name
 */
function getValueFromRow(rowData: Record<string, any>, columnName: string, columnMapping?: Record<string, string>): any {
  // Try direct match first
  if (rowData[columnName] !== undefined) {
    return rowData[columnName]
  }

  // Try case-insensitive match
  const lowerColumnName = columnName.toLowerCase()
  for (const key in rowData) {
    if (key.toLowerCase() === lowerColumnName) {
      return rowData[key]
    }
  }

  // Try reverse mapping if columnMapping is provided
  if (columnMapping) {
    // Find display name that maps to this SQL column name
    const displayName = Object.keys(columnMapping).find((key) => columnMapping[key] === columnName)
    if (displayName && rowData[displayName] !== undefined) {
      return rowData[displayName]
    }
  }

  return undefined
}

/**
 * Generate a summary of import errors for display
 */
export function generateErrorSummary(errors: ParsedImportError[]): {
  totalErrors: number
  errorTypes: Record<string, number>
  columnsWithErrors: string[]
  summaryMessage: string
} {
  const errorTypes: Record<string, number> = {}
  const columns = new Set<string>()

  errors.forEach((error) => {
    errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1
    if (error.columnName) {
      columns.add(error.columnName)
    }
  })

  const totalErrors = errors.length
  const columnsWithErrors = Array.from(columns)

  // Generate a friendly summary message
  let summaryMessage = ''
  if (totalErrors === 1) {
    summaryMessage = '1 error found during import.'
  } else {
    summaryMessage = `${totalErrors} errors found during import.`
  }

  if (columnsWithErrors.length > 0) {
    if (columnsWithErrors.length === 1) {
      summaryMessage += ` Affected column: ${columnsWithErrors[0]}.`
    } else if (columnsWithErrors.length <= 3) {
      summaryMessage += ` Affected columns: ${columnsWithErrors.join(', ')}.`
    } else {
      summaryMessage += ` ${columnsWithErrors.length} columns have errors.`
    }
  }

  // Add most common error type
  const mostCommonType = Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0]
  if (mostCommonType) {
    const [type, count] = mostCommonType
    const typeNames: Record<string, string> = {
      null: 'missing values',
      unique: 'duplicate values',
      data_type: 'incorrect data types',
      length: 'values too long',
      format: 'format errors',
      validation: 'validation errors'
    }

    const friendlyType = typeNames[type] || type
    summaryMessage += ` Most common issue: ${friendlyType} (${count} ${count === 1 ? 'error' : 'errors'}).`
  }

  return {
    totalErrors,
    errorTypes,
    columnsWithErrors,
    summaryMessage
  }
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: ParsedImportError, rowIndex: number): string {
  const parts = []

  // Add row information
  parts.push(`Row ${rowIndex}:`)

  // Add column if available
  if (error.columnName) {
    parts.push(`Column "${error.columnName}"`)
  }

  // Add user-friendly message
  parts.push(error.userFriendlyMessage)

  // Add suggested fix if available
  if (error.suggestedFix) {
    parts.push(`Suggestion: ${error.suggestedFix}`)
  }

  return parts.join(' - ')
}

/**
 * Get appropriate suggestion for data type errors
 */
function getDataTypeSuggestion(dataType: string, columnName: string): string {
  const suggestions: Record<string, string> = {
    integer: `Make sure all values in "${columnName}" are whole numbers (e.g., 1, 42, 100).`,
    numeric: `Make sure all values in "${columnName}" are numbers (e.g., 123, 45.67, -10.5).`,
    number: `Make sure all values in "${columnName}" are numbers (e.g., 123, 45.67, -10.5).`,
    decimal: `Make sure all values in "${columnName}" are decimal numbers (e.g., 1.23, 45.67, 100.0).`,
    float: `Make sure all values in "${columnName}" are floating-point numbers (e.g., 1.23, 45.67, -10.5).`,
    boolean: `Make sure all values in "${columnName}" are boolean values (e.g., true, false, yes, no, 1, 0).`,
    date: `Make sure all values in "${columnName}" are valid dates (e.g., 2023-12-31, 2023/12/31).`,
    datetime: `Make sure all values in "${columnName}" are valid date-times (e.g., 2023-12-31 14:30:00).`,
    timestamp: `Make sure all values in "${columnName}" are valid timestamps (e.g., 2023-12-31 14:30:00).`,
    time: `Make sure all values in "${columnName}" are valid times (e.g., 14:30:00, 09:15 AM).`
  }

  return suggestions[dataType.toLowerCase()] || `Make sure all values in "${columnName}" are valid ${dataType} values.`
}

/**
 * Check if error is likely a data validation error (vs system error)
 */
export function isDataValidationError(errorType: ParsedImportError['errorType']): boolean {
  const validationErrorTypes: ParsedImportError['errorType'][] = ['null', 'unique', 'data_type', 'length', 'format', 'validation']
  return validationErrorTypes.includes(errorType)
}
