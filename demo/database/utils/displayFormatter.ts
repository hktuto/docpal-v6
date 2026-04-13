/**
 * Display Formatter Utility
 * Formats values according to column display configuration
 */

import type { Column, DisplayConfig } from '../types/database'

/**
 * Format a number value based on display configuration
 */
export function formatNumber(value: number | null | undefined, column: Column): string {
  if (value === null || value === undefined) return '-'
  if (typeof value !== 'number' || isNaN(value)) return String(value)
  
  const config = column.displayConfig || {}
  const format = config.numberFormat || 'plain'
  const decimalPlaces = column.decimalPlaces ?? 2
  
  let result = ''
  
  switch (format) {
    case 'currency':
      result = formatCurrency(value, config, decimalPlaces)
      break
      
    case 'compact':
      result = formatCompact(value, decimalPlaces)
      break
      
    case 'percentage':
      result = formatPercentage(value, decimalPlaces)
      break
      
    case 'accounting':
      result = formatAccounting(value, config, decimalPlaces)
      break
      
    case 'plain':
    default:
      result = formatPlain(value, config, decimalPlaces)
      break
  }
  
  // Apply custom prefix/suffix if not already handled
  if (format !== 'currency' && format !== 'percentage') {
    if (config.prefix) {
      result = config.prefix + result
    }
    if (config.suffix) {
      result = result + config.suffix
    }
  }
  
  return result
}

/**
 * Format as plain number with optional thousands separator
 */
function formatPlain(value: number, config: DisplayConfig, decimalPlaces: number): string {
  const useThousands = config.showThousandsSeparator !== false
  
  if (useThousands) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    })
  }
  
  return value.toFixed(decimalPlaces)
}

/**
 * Format as currency
 */
function formatCurrency(value: number, config: DisplayConfig, decimalPlaces: number): string {
  const symbol = config.currencySymbol || '$'
  const position = config.currencyPosition || 'prefix'
  
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  })
  
  const sign = value < 0 ? '-' : ''
  
  if (position === 'prefix') {
    return `${sign}${symbol}${formatted}`
  } else {
    return `${sign}${formatted}${symbol}`
  }
}

/**
 * Format as compact (K, M, B, T)
 */
function formatCompact(value: number, decimalPlaces: number): string {
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  if (absValue >= 1e12) {
    return sign + (absValue / 1e12).toFixed(decimalPlaces) + 'T'
  }
  if (absValue >= 1e9) {
    return sign + (absValue / 1e9).toFixed(decimalPlaces) + 'B'
  }
  if (absValue >= 1e6) {
    return sign + (absValue / 1e6).toFixed(decimalPlaces) + 'M'
  }
  if (absValue >= 1e3) {
    return sign + (absValue / 1e3).toFixed(decimalPlaces) + 'K'
  }
  
  return sign + absValue.toFixed(decimalPlaces)
}

/**
 * Format as percentage
 */
function formatPercentage(value: number, decimalPlaces: number): string {
  // Assumes value is already in percentage form (e.g., 75 = 75%)
  return value.toFixed(decimalPlaces) + '%'
}

/**
 * Format as accounting (negative in parentheses)
 */
function formatAccounting(value: number, config: DisplayConfig, decimalPlaces: number): string {
  const symbol = config.currencySymbol || ''
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  })
  
  if (value < 0) {
    return `(${symbol}${formatted})`
  }
  
  return `${symbol}${formatted}`
}

/**
 * Format a date value based on display configuration
 */
export function formatDate(value: string | Date | null | undefined, column: Column): string {
  if (!value) return '-'
  
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return String(value)
  
  const config = column.displayConfig || {}
  const format = config.dateFormat || 'date'
  
  switch (format) {
    case 'datetime':
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
    case 'relative':
      return formatRelativeDate(date)
      
    case 'custom':
      return formatCustomDate(date, config.customDateFormat || 'YYYY-MM-DD')
      
    case 'date':
    default:
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
  }
}

/**
 * Format as relative date (e.g., "2 days ago")
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)
  
  if (diffSecs < 0) {
    // Future date
    const absDiffDays = Math.abs(diffDays)
    if (absDiffDays === 0) return 'Today'
    if (absDiffDays === 1) return 'Tomorrow'
    if (absDiffDays < 7) return `In ${absDiffDays} days`
    if (absDiffDays < 30) return `In ${Math.abs(diffWeeks)} weeks`
    return `In ${Math.abs(diffMonths)} months`
  }
  
  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`
  if (diffMonths < 12) return `${diffMonths} months ago`
  return `${diffYears} years ago`
}

/**
 * Format date with custom format string
 * Supports: YYYY, MM, DD, HH, mm, ss
 */
function formatCustomDate(date: Date, format: string): string {
  const tokens: Record<string, string> = {
    'YYYY': date.getFullYear().toString(),
    'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
    'DD': date.getDate().toString().padStart(2, '0'),
    'HH': date.getHours().toString().padStart(2, '0'),
    'mm': date.getMinutes().toString().padStart(2, '0'),
    'ss': date.getSeconds().toString().padStart(2, '0')
  }
  
  let result = format
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(token, value)
  }
  
  return result
}

/**
 * Format a text value based on display configuration
 */
export function formatText(value: string | null | undefined, column: Column): string {
  if (value === null || value === undefined) return '-'
  if (typeof value !== 'string') return String(value)
  
  const config = column.displayConfig || {}
  const format = config.textFormat || 'plain'
  
  switch (format) {
    case 'uppercase':
      return value.toUpperCase()
      
    case 'lowercase':
      return value.toLowerCase()
      
    case 'capitalize':
      return value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
    case 'truncate':
      const maxLength = config.truncateLength || 50
      if (value.length <= maxLength) return value
      return value.slice(0, maxLength) + '...'
      
    case 'plain':
    default:
      return value
  }
}

/**
 * Get display preview for a format configuration
 */
export function getFormatPreview(format: string, config: DisplayConfig): string {
  const sampleNumber = 1234567.89
  const sampleDate = new Date()
  const sampleText = 'Hello World Example Text'
  
  // Create a mock column for formatting
  const mockColumn: Partial<Column> = {
    displayConfig: config,
    decimalPlaces: 2
  }
  
  switch (format) {
    case 'plain':
      return formatNumber(sampleNumber, mockColumn as Column)
    case 'currency':
      return formatNumber(sampleNumber, { ...mockColumn, displayConfig: { ...config, numberFormat: 'currency' } } as Column)
    case 'compact':
      return formatNumber(sampleNumber, { ...mockColumn, displayConfig: { ...config, numberFormat: 'compact' } } as Column)
    case 'percentage':
      return formatNumber(75, { ...mockColumn, displayConfig: { ...config, numberFormat: 'percentage' } } as Column)
    case 'accounting':
      return formatNumber(-sampleNumber, { ...mockColumn, displayConfig: { ...config, numberFormat: 'accounting' } } as Column)
    default:
      return String(sampleNumber)
  }
}

