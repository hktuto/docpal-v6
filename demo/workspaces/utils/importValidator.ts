/**
 * Pre-Import Validation Utility
 *
 * Validates Excel/CSV data before import to catch common issues early
 */

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: {
    totalRows: number
    totalColumns: number
    errorCount: number
    warningCount: number
  }
}

export interface ValidationError {
  type: 'required' | 'data_type' | 'unique' | 'length' | 'format' | 'foreign_key' | 'structure'
  message: string
  severity: 'error' | 'warning'
  rowIndex?: number // 1-based, including header
  columnName?: string
  columnIndex?: number // 0-based
  value?: any
  suggestedFix?: string
}

export interface ValidationWarning {
  type: 'empty_column' | 'potential_duplicate' | 'inconsistent_format' | 'data_pattern'
  message: string
  rowIndex?: number
  columnName?: string
  value?: any
  suggestion?: string
}

export interface ColumnDefinition {
  name: string
  displayName?: string
  dataType?: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime'
  required?: boolean
  unique?: boolean
  maxLength?: number
  minLength?: number
  pattern?: RegExp | string
  patternDescription?: string
  foreignKeyTable?: string
  foreignKeyColumn?: string
}

/**
 * Validate data before import
 */
export function validateImportData(
  data: Record<string, any>[],
  columns: ColumnDefinition[],
  options?: {
    checkDuplicates?: boolean
    checkRequired?: boolean
    checkDataTypes?: boolean
    checkLengths?: boolean
    checkPatterns?: boolean
    maxRows?: number
    maxColumns?: number
  }
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  const config = {
    checkDuplicates: true,
    checkRequired: true,
    checkDataTypes: true,
    checkLengths: true,
    checkPatterns: true,
    maxRows: 10000,
    maxColumns: 100,
    ...options
  }

  // Basic structure validation
  if (!data || !Array.isArray(data)) {
    errors.push({
      type: 'structure',
      message: 'Invalid data format. Expected an array of objects.',
      severity: 'error'
    })
    return createValidationResult(errors, warnings, data)
  }

  if (data.length === 0) {
    errors.push({
      type: 'structure',
      message: 'No data to import. The file appears to be empty.',
      severity: 'error'
    })
    return createValidationResult(errors, warnings, data)
  }

  if (data.length > config.maxRows) {
    warnings.push({
      type: 'data_pattern',
      message: `Large dataset detected (${data.length} rows). Import may take longer than usual.`,
      suggestion: 'Consider splitting the file into smaller batches for better performance.'
    })
  }

  // Create column mapping for easier access
  const columnMap = new Map<string, ColumnDefinition>()
  columns.forEach(col => {
    columnMap.set(col.name, col)
    if (col.displayName) {
      columnMap.set(col.displayName, col)
    }
  })

  // Check for duplicate column names in data
  const firstRow = data[0]
  const dataColumns = Object.keys(firstRow)
  const columnNameCounts = new Map<string, number>()

  dataColumns.forEach(col => {
    columnNameCounts.set(col, (columnNameCounts.get(col) || 0) + 1)
  })

  for (const [colName, count] of columnNameCounts) {
    if (count > 1) {
      errors.push({
        type: 'structure',
        message: `Duplicate column name found: "${colName}" appears ${count} times.`,
        severity: 'error',
        columnName: colName
      })
    }
  }

  // Validate each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowIndex = i + 2 // +1 for 1-based, +1 for header row

    // Validate each column in the row
    for (const [colName, value] of Object.entries(row)) {
      const columnDef = columnMap.get(colName)

      if (!columnDef) {
        // Column not defined in schema - warning only
        warnings.push({
          type: 'structure',
          message: `Column "${colName}" is not defined in the table schema.`,
          rowIndex,
          columnName: colName,
          suggestion: 'This column will be ignored during import unless added to the table schema.'
        })
        continue
      }

      // Check required fields
      if (config.checkRequired && columnDef.required && isEmptyValue(value)) {
        errors.push({
          type: 'required',
          message: `Required field "${colName}" is empty.`,
          severity: 'error',
          rowIndex,
          columnName: colName,
          value,
          suggestedFix: `Add a value to "${colName}" in row ${rowIndex}.`
        })
      }

      // Skip further validation for empty values (unless required)
      if (isEmptyValue(value)) {
        continue
      }

      // Check data types
      if (config.checkDataTypes && columnDef.dataType) {
        const typeError = validateDataType(value, columnDef.dataType, colName)
        if (typeError) {
          errors.push({
            ...typeError,
            rowIndex,
            columnName: colName,
            value
          })
        }
      }

      // Check length constraints
      if (config.checkLengths) {
        const lengthError = validateLength(value, columnDef, colName)
        if (lengthError) {
          errors.push({
            ...lengthError,
            rowIndex,
            columnName: colName,
            value
          })
        }
      }

      // Check pattern constraints
      if (config.checkPatterns && columnDef.pattern) {
        const patternError = validatePattern(value, columnDef, colName)
        if (patternError) {
          errors.push({
            ...patternError,
            rowIndex,
            columnName: colName,
            value
          })
        }
      }
    }
  }

  // Check for duplicate values in unique columns
  if (config.checkDuplicates) {
    const uniqueColumns = columns.filter(col => col.unique)
    for (const columnDef of uniqueColumns) {
      const colName = columnDef.displayName || columnDef.name
      const values = new Map<any, number[]>() // value -> row indices

      for (let i = 0; i < data.length; i++) {
        const value = data[i][colName]
        if (!isEmptyValue(value)) {
          const existing = values.get(value) || []
          existing.push(i + 2) // Store row indices
          values.set(value, existing)
        }
      }

      // Find duplicates
      for (const [value, rowIndices] of values) {
        if (rowIndices.length > 1) {
          errors.push({
            type: 'unique',
            message: `Duplicate value "${value}" found in unique column "${colName}".`,
            severity: 'error',
            columnName: colName,
            value,
            suggestedFix: `Remove duplicate values in rows: ${rowIndices.join(', ')}. Each value must be unique in this column.`
          })
        }
      }
    }
  }

  // Check for columns with mostly empty values
  if (data.length > 10) { // Only check if we have enough data
    for (const colName of dataColumns) {
      const columnDef = columnMap.get(colName)
      if (!columnDef) continue

      const emptyCount = data.filter(row => isEmptyValue(row[colName])).length
      const emptyPercentage = (emptyCount / data.length) * 100

      if (emptyPercentage > 80) { // More than 80% empty
        warnings.push({
          type: 'empty_column',
          message: `Column "${colName}" has ${emptyPercentage.toFixed(1)}% empty values.`,
          columnName: colName,
          suggestion: 'Consider if this column is necessary or if default values should be used.'
        })
      }
    }
  }

  return createValidationResult(errors, warnings, data)
}

/**
 * Validate data type
 */
function validateDataType(
  value: any,
  expectedType: ColumnDefinition['dataType'],
  columnName: string
): Omit<ValidationError, 'rowIndex' | 'columnName' | 'value'> | null {
  if (expectedType === 'number' || expectedType === 'integer') {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) {
      return {
        type: 'data_type',
        message: `"${value}" is not a valid number.`,
        severity: 'error',
        suggestedFix: `Enter a valid number in "${columnName}".`
      }
    }

    if (expectedType === 'integer' && !Number.isInteger(numValue)) {
      return {
        type: 'data_type',
        message: `"${value}" is not a valid integer (whole number).`,
        severity: 'error',
        suggestedFix: `Enter a whole number without decimals in "${columnName}".`
      }
    }
  }

  if (expectedType === 'boolean') {
    const boolValue = typeof value === 'string' ? value.toLowerCase() : value
    if (!['true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n'].includes(String(boolValue).toLowerCase())) {
      return {
        type: 'data_type',
        message: `"${value}" is not a valid boolean value.`,
        severity: 'error',
        suggestedFix: `Use true/false, yes/no, or 1/0 in "${columnName}".`
      }
    }
  }

  if (expectedType === 'date' || expectedType === 'datetime') {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return {
        type: 'data_type',
        message: `"${value}" is not a valid ${expectedType}.`,
        severity: 'error',
        suggestedFix: `Use a valid date format (YYYY-MM-DD) in "${columnName}".`
      }
    }
  }

  return null
}

/**
 * Validate length constraints
 */
function validateLength(
  value: any,
  columnDef: ColumnDefinition,
  columnName: string
): Omit<ValidationError, 'rowIndex' | 'columnName' | 'value'> | null {
  const strValue = String(value)

  if (columnDef.maxLength !== undefined && strValue.length > columnDef.maxLength) {
    return {
      type: 'length',
      message: `Value is too long (${strValue.length} characters, maximum ${columnDef.maxLength}).`,
      severity: 'error',
      suggestedFix: `Shorten the value in "${columnName}" to ${columnDef.maxLength} characters or less.`
    }
  }

  if (columnDef.minLength !== undefined && strValue.length < columnDef.minLength) {
    return {
      type: 'length',
      message: `Value is too short (${strValue.length} characters, minimum ${columnDef.minLength}).`,
      severity: 'error',
      suggestedFix: `Ensure the value in "${columnName}" has at least ${columnDef.minLength} characters.`
    }
  }

  return null
}

/**
 * Validate pattern constraints
 */
function validatePattern(
  value: any,
  columnDef: ColumnDefinition,
  columnName: string
): Omit<ValidationError, 'rowIndex' | 'columnName' | 'value'> | null {
  if (!columnDef.pattern) return null

  const strValue = String(value)
  const pattern = typeof columnDef.pattern === 'string' ? new RegExp(columnDef.pattern) : columnDef.pattern

  if (!pattern.test(strValue)) {
    return {
      type: 'format',
      message: `Value doesn't match the required format${columnDef.patternDescription ? `: ${columnDef.patternDescription}` : '.'}`,
      severity: 'error',
      suggestedFix: `Check the format of values in "${columnName}".`
    }
  }

  return null
}

/**
 * Check if value is empty
 */
function isEmptyValue(value: any): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
}

/**
 * Create validation result object
 */
function createValidationResult(
  errors: ValidationError[],
  warnings: ValidationWarning[],
  data: Record<string, any>[]
): ValidationResult {
  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = warnings.length + errors.filter(e => e.severity === 'warning').length

  return {
    isValid: errorCount === 0,
    errors,
    warnings,
    summary: {
      totalRows: data.length,
      totalColumns: data.length > 0 ? Object.keys(data[0]).length : 0,
      errorCount,
      warningCount
    }
  }
}

/**
 * Generate a user-friendly validation report
 */
export function generateValidationReport(result: ValidationResult): string {
  const { summary, errors, warnings } = result

  const report: string[] = []

  report.push('=== Import Validation Report ===')
  report.push('')
  report.push(`Summary:`)
  report.push(`  • Total rows: ${summary.totalRows}`)
  report.push(`  • Total columns: ${summary.totalColumns}`)
  report.push(`  • Errors found: ${summary.errorCount}`)
  report.push(`  • Warnings: ${summary.warningCount}`)
  report.push('')

  if (errors.length > 0) {
    report.push('Errors:')
    const errorGroups = groupBy(errors, 'type')

    for (const [type, typeErrors] of Object.entries(errorGroups)) {
      const errorTypeNames: Record<string, string> = {
        'required': 'Missing Required Values',
        'data_type': 'Invalid Data Types',
        'unique': 'Duplicate Values',
        'length': 'Length Violations',
        'format': 'Format Errors',
        'foreign_key': 'Foreign Key Issues',
        'structure': 'Structural Issues'
      }

      report.push(`  ${errorTypeNames[type] || type}:`)

      // Show first 3 errors of each type
      typeErrors.slice(0, 3).forEach(error => {
        let line = `    • `
        if (error.rowIndex) line += `Row ${error.rowIndex}: `
        if (error.columnName) line += `"${error.columnName}": `
        line += error.message
        report.push(line)
      })

      if (typeErrors.length > 3) {
        report.push(`    ... and ${typeErrors.length - 3} more`)
      }
      report.push('')
    }
  }

  if (warnings.length > 0) {
    report.push('Warnings:')
    warnings.slice(0, 5).forEach(warning => {
      let line = `  • `
      if (warning.rowIndex) line += `Row ${warning.rowIndex}: `
      if (warning.columnName) line += `"${warning.columnName}": `
      line += warning.message
      if (warning.suggestion) {
        line += ` (${warning.suggestion})`
      }
      report.push(line)
    })

    if (warnings.length > 5) {
      report.push(`  ... and ${warnings.length - 5} more warnings`)
    }
    report.push('')
  }

  if (result.isValid) {
    report.push('✅ Validation passed! Your data is ready for import.')
  } else {
    report.push('❌ Validation failed. Please fix the errors above before importing.')
  }

  return report.join('\n')
}

/**
 * Group array items by a key
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Get validation statistics for display
 */
export function getValidationStats(result: ValidationResult) {
  const errorTypes = result.errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const warningTypes = result.warnings.reduce((acc, warning) => {
    acc[warning.type] = (acc[warning.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const columnsWithErrors = new Set<string>()
  result.errors.forEach(error => {
    if (error.columnName) {
      columnsWithErrors.add(error.columnName)
    }
  })

  return {
    errorTypes,
    warningTypes,
    columnsWithErrors: Array.from(columnsWithErrors),
    totalErrors: result.summary.errorCount,
    totalWarnings: result.summary.warningCount
  }
}
