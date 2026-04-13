/**
 * Formula Evaluator for calculated fields
 * 
 * Syntax:
 * - {field_name} - Reference to another field's value
 * - Standard math operators: +, -, *, /, ()
 * - Percentage: value% (e.g., 15% becomes 0.15)
 * 
 * Example formulas:
 * - {unit_price} * {qty}
 * - ({unit_price} * {qty}) * (1 - {discount}/100)
 * - (({unit_price} * {qty}) * (1 - {discount}/100)) * (1 + {tax}/100)
 */

export interface FormulaContext {
  [fieldName: string]: any
}

export interface FormulaResult {
  value: number | null
  error: string | null
}

/**
 * Extract field references from a formula
 * Supports both {field_name} and plain field_name syntax
 */
export function extractFieldReferences(formula: string, availableFields?: string[]): string[] {
  const matches: string[] = []
  
  // First, find {field_name} patterns
  const bracedRegex = /\{([^}]+)\}/g
  let match
  while ((match = bracedRegex.exec(formula)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1])
    }
  }
  
  // Also find plain field names if availableFields is provided
  if (availableFields) {
    // Sort by length descending to match longer names first
    const sortedFields = [...availableFields].sort((a, b) => b.length - a.length)
    for (const field of sortedFields) {
      // Match field name as a whole word (not inside braces already)
      const plainRegex = new RegExp(`(?<!\\{)\\b${escapeRegex(field)}\\b(?!\\})`, 'g')
      if (plainRegex.test(formula) && !matches.includes(field)) {
        matches.push(field)
      }
    }
  }
  
  return matches
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Normalize formula by converting plain field names to {field_name} format
 */
export function normalizeFormula(formula: string, availableFields: string[]): string {
  let normalized = formula
  
  // Sort by length descending to match longer names first (e.g., "unitPrice" before "unit")
  const sortedFields = [...availableFields].sort((a, b) => b.length - a.length)
  
  for (const field of sortedFields) {
    // Match field name as a whole word that's not already in braces
    const regex = new RegExp(`(?<!\\{)\\b${escapeRegex(field)}\\b(?!\\})`, 'g')
    normalized = normalized.replace(regex, `{${field}}`)
  }
  
  return normalized
}

/**
 * Validate formula syntax
 * Returns error message if invalid, null if valid
 * Supports both {field_name} and plain field_name syntax
 */
export function validateFormula(formula: string, availableFields: string[]): string | null {
  if (!formula || !formula.trim()) {
    return 'Formula cannot be empty'
  }
  
  // Normalize the formula first (convert plain field names to {field} format)
  const normalized = normalizeFormula(formula, availableFields)
  
  // Check for balanced parentheses
  let parenCount = 0
  for (const char of normalized) {
    if (char === '(') parenCount++
    if (char === ')') parenCount--
    if (parenCount < 0) return 'Unbalanced parentheses'
  }
  if (parenCount !== 0) return 'Unbalanced parentheses'
  
  // Check for valid field references in the normalized formula
  const referencedFields = extractFieldReferences(normalized)
  for (const field of referencedFields) {
    if (!availableFields.includes(field)) {
      return `Unknown field: ${field}`
    }
  }
  
  // Check for invalid characters (only allow safe math operations)
  // Replace {field_name} patterns with 0
  const sanitized = normalized.replace(/\{[^}]+\}/g, '0')
  // Allow: digits, spaces, operators, parentheses, percentage, decimal points
  const validChars = /^[\d\s+\-*/().%]+$/
  if (!validChars.test(sanitized)) {
    // Find what character is invalid for a better error message
    const invalidChar = sanitized.match(/[^\d\s+\-*/().%]/)
    if (invalidChar) {
      return `Invalid character: "${invalidChar[0]}". Only numbers and math operators (+, -, *, /, %) are allowed.`
    }
    return 'Formula contains invalid characters'
  }
  
  return null
}

/**
 * Evaluate a formula with the given context
 * Supports both {field_name} and plain field_name syntax
 */
export function evaluateFormula(formula: string, context: FormulaContext): FormulaResult {
  try {
    if (!formula || !formula.trim()) {
      return { value: null, error: 'Empty formula' }
    }
    
    // Get available fields from context
    const availableFields = Object.keys(context)
    
    // Normalize the formula first (convert plain field names to {field} format)
    let expression = normalizeFormula(formula, availableFields)
    
    // Step 1: Replace field references with actual values
    const fieldRegex = /\{([^}]+)\}/g
    expression = expression.replace(fieldRegex, (match, fieldName) => {
      const value = context[fieldName]
      if (value === undefined || value === null) {
        return '0'
      }
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return '0'
      }
      return String(numValue)
    })
    
    // Step 2: Handle percentage notation (e.g., 15% becomes 0.15)
    // Pattern: number followed by % (not inside a division)
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, num) => {
      return `(${num}/100)`
    })
    
    // Step 3: Sanitize - only allow safe characters
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '')
    
    // Step 4: Validate the expression doesn't contain dangerous patterns
    if (/[a-zA-Z_$]/.test(sanitized)) {
      return { value: null, error: 'Invalid expression' }
    }
    
    // Step 5: Evaluate using Function constructor (safer than eval)
    // We've already sanitized to only contain numbers and math operators
    const result = new Function(`return (${sanitized})`)()
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return { value: null, error: 'Invalid result' }
    }
    
    // Round to reasonable precision
    return { value: Math.round(result * 100) / 100, error: null }
    
  } catch (err) {
    return { value: null, error: 'Formula error' }
  }
}

/**
 * Format a formula for display with syntax highlighting hints
 */
export function formatFormulaForDisplay(formula: string): { text: string; type: 'field' | 'operator' | 'number' }[] {
  const parts: { text: string; type: 'field' | 'operator' | 'number' }[] = []
  
  let remaining = formula
  const regex = /(\{[^}]+\})|([+\-*/()%])|(\d+(?:\.\d+)?)/g
  let match
  let lastIndex = 0
  
  while ((match = regex.exec(formula)) !== null) {
    // Add any text between matches
    if (match.index > lastIndex) {
      const text = formula.slice(lastIndex, match.index).trim()
      if (text) {
        parts.push({ text, type: 'operator' })
      }
    }
    
    if (match[1]) {
      // Field reference
      parts.push({ text: match[1], type: 'field' })
    } else if (match[2]) {
      // Operator
      parts.push({ text: match[2], type: 'operator' })
    } else if (match[3]) {
      // Number
      parts.push({ text: match[3], type: 'number' })
    }
    
    lastIndex = regex.lastIndex
  }
  
  return parts
}

/**
 * Suggest formula completions based on available fields
 */
export function getFormulaSuggestions(
  partialFormula: string,
  cursorPosition: number,
  availableFields: { field: string; title: string }[]
): { field: string; title: string }[] {
  // Check if we're inside a field reference
  const beforeCursor = partialFormula.slice(0, cursorPosition)
  const openBrace = beforeCursor.lastIndexOf('{')
  const closeBrace = beforeCursor.lastIndexOf('}')
  
  if (openBrace > closeBrace) {
    // We're inside an open brace, filter fields
    const searchText = beforeCursor.slice(openBrace + 1).toLowerCase()
    return availableFields.filter(f => 
      f.field.toLowerCase().includes(searchText) ||
      f.title.toLowerCase().includes(searchText)
    )
  }
  
  return []
}

