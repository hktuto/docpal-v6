import type { Row, Column, RollupAggregation } from '../types/database'

/**
 * Calculate rollup value for a given record based on related records
 */
export function calculateRollup(
  relatedRecords: Row[],
  aggregateField: string,
  aggregation: RollupAggregation
): number | string | null {
  if (!relatedRecords || relatedRecords.length === 0) {
    return aggregation === 'count' || aggregation === 'count-unique' ? 0 : null
  }

  // Extract values from related records
  const values = relatedRecords
    .map(r => r[aggregateField])
    .filter(v => v !== null && v !== undefined && v !== '')

  if (values.length === 0 && aggregation !== 'count' && aggregation !== 'count-unique') {
    return null
  }

  switch (aggregation) {
    case 'count':
      return relatedRecords.length

    case 'count-unique':
      return new Set(values).size

    case 'sum':
      return values.reduce((sum, val) => sum + Number(val || 0), 0)

    case 'avg':
      if (values.length === 0) return null
      const sum = values.reduce((acc, val) => acc + Number(val || 0), 0)
      return sum / values.length

    case 'min':
      if (values.length === 0) return null
      return Math.min(...values.map(v => Number(v)))

    case 'max':
      if (values.length === 0) return null
      return Math.max(...values.map(v => Number(v)))

    case 'median':
      if (values.length === 0) return null
      const sorted = values.map(v => Number(v)).sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid]

    case 'range':
      if (values.length === 0) return null
      const nums = values.map(v => Number(v))
      return Math.max(...nums) - Math.min(...nums)

    case 'earliest':
      if (values.length === 0) return null
      const dates = values.map(v => new Date(v).getTime()).filter(d => !isNaN(d))
      if (dates.length === 0) return null
      return new Date(Math.min(...dates)).toISOString()

    case 'latest':
      if (values.length === 0) return null
      const latestDates = values.map(v => new Date(v).getTime()).filter(d => !isNaN(d))
      if (latestDates.length === 0) return null
      return new Date(Math.max(...latestDates)).toISOString()

    default:
      return null
  }
}

/**
 * Get display label for aggregation type
 */
export function getAggregationLabel(aggregation: RollupAggregation): string {
  const labels: Record<RollupAggregation, string> = {
    'count': 'Count',
    'count-unique': 'Count Unique',
    'sum': 'Sum',
    'avg': 'Average',
    'min': 'Minimum',
    'max': 'Maximum',
    'median': 'Median',
    'range': 'Range',
    'earliest': 'Earliest',
    'latest': 'Latest'
  }
  return labels[aggregation] || aggregation
}

