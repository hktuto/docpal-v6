/**
 * SQL Query Builder Helpers
 * Provides utilities for building SQL WHERE clauses from filter rules and ORDER BY from sort rules
 */

export interface FilterRule {
  id: string
  connector: 'and' | 'or'
  field: string
  operator: string
  value: string | number
}

export interface SortRule {
  id: string
  field: string
  order: 'asc' | 'desc'
}

export interface FilterConditionResult {
  conditions: string[]
  values: any[]
  connector: string
}

export interface WhereClauseResult {
  whereClause: string
  queryValues: any[]
}

/**
 * Build SQL conditions from filter rules
 * @param filterRules - Array of filter rules
 * @param startIndex - Starting parameter index for SQL placeholders (default: 1)
 * @returns { conditions: string[], values: any[], connector: string }
 */
export function buildFilterConditions(
  filterRules: FilterRule[] = [],
  startIndex: number = 1
): FilterConditionResult {
  const conditions: string[] = []
  const values: any[] = []
  let connector = 'AND'

  if (!filterRules || filterRules.length === 0) {
    return { conditions, values, connector }
  }

  // Get connector from first rule
  connector = filterRules[0]?.connector?.toUpperCase() === 'OR' ? 'OR' : 'AND'

  let paramIndex = startIndex
  for (const rule of filterRules) {
    if (!rule.field || !rule.operator) continue

    const field = `"${rule.field}"`

    switch (rule.operator) {
      case 'eq':
        conditions.push(`${field} = $${paramIndex}`)
        values.push(rule.value)
        paramIndex++
        break
      case 'ne':
        conditions.push(`${field} != $${paramIndex}`)
        values.push(rule.value)
        paramIndex++
        break
      case 'gt':
        conditions.push(`${field} > $${paramIndex}`)
        values.push(rule.value)
        paramIndex++
        break
      case 'gte':
        conditions.push(`${field} >= $${paramIndex}`)
        values.push(rule.value)
        paramIndex++
        break
      case 'lt':
        conditions.push(`${field} < $${paramIndex}`)
        values.push(rule.value)
        paramIndex++
        break
      case 'lte':
        conditions.push(`${field} <= $${paramIndex}`)
        values.push(rule.value)
        paramIndex++
        break
      case 'contains':
        conditions.push(`${field} ILIKE $${paramIndex}`)
        values.push(`%${rule.value}%`)
        paramIndex++
        break
      case 'notContains':
        conditions.push(`${field} NOT ILIKE $${paramIndex}`)
        values.push(`%${rule.value}%`)
        paramIndex++
        break
      case 'empty':
        conditions.push(`(${field} IS NULL OR ${field} = '')`)
        break
      case 'notEmpty':
        conditions.push(`(${field} IS NOT NULL AND ${field} != '')`)
        break
      case 'duplicate':
        // Skip duplicate for now, requires subquery
        break
    }
  }

  return { conditions, values, connector }
}

/**
 * Build equality conditions from a simple key-value filter object
 * @param filter - Record of field names and values
 * @param startIndex - Starting parameter index for SQL placeholders
 * @returns { conditions: string[], values: any[] }
 */
export function buildEqualityConditions(
  filter: Record<string, any> = {},
  startIndex: number = 1
): { conditions: string[], values: any[] } {
  const conditions: string[] = []
  const values: any[] = []
  const filterKeys = Object.keys(filter)

  if (filterKeys.length === 0) {
    return { conditions, values }
  }

  filterKeys.forEach((key, index) => {
    values.push(filter[key])
    conditions.push(`"${key}" = $${startIndex + index}`)
  })

  return { conditions, values }
}

/**
 * Combine multiple condition sources into a final WHERE clause
 * @param groupFilter - Simple key-value filter (e.g., from __filter_data)
 * @param filterRules - Filter rules array (e.g., from columnFilterRules)
 * @returns { whereClause: string, queryValues: any[] }
 */
export function buildCombinedWhereClause(
  groupFilter: Record<string, any> = {},
  filterRules: FilterRule[] = []
): WhereClauseResult {
  const queryValues: any[] = []

  // Build group hierarchy conditions (always AND)
  const { conditions: groupConditions, values: groupValues } = buildEqualityConditions(groupFilter, 1)
  queryValues.push(...groupValues)

  // Build filter rules conditions
  const { conditions: filterConditions, values: filterValues, connector } = buildFilterConditions(
    filterRules,
    queryValues.length + 1
  )
  queryValues.push(...filterValues)

  // Combine into final WHERE clause
  let whereClause = ''
  if (groupConditions.length > 0 && filterConditions.length > 0) {
    const groupFilters = groupConditions.join(' AND ')
    const tableFilters = filterConditions.join(` ${connector} `)
    whereClause = `WHERE (${groupFilters}) AND (${tableFilters})`
  } else if (groupConditions.length > 0) {
    whereClause = `WHERE ${groupConditions.join(' AND ')}`
  } else if (filterConditions.length > 0) {
    whereClause = `WHERE ${filterConditions.join(` ${connector} `)}`
  }

  return { whereClause, queryValues }
}

/**
 * Build a GROUP BY query with WHERE clause
 * @param tableName - Physical table name
 * @param groupField - Field to group by
 * @param sortOrder - Sort order ('ASC' or 'DESC')
 * @param groupFilter - Simple key-value filter
 * @param filterRules - Filter rules array
 * @returns { sql: string, queryValues: any[] }
 */
export function buildGroupByQuery(
  tableName: string,
  groupField: string,
  sortOrder: 'ASC' | 'DESC' = 'ASC',
  groupFilter: Record<string, any> = {},
  filterRules: FilterRule[] = []
): { sql: string, queryValues: any[] } {
  const { whereClause, queryValues } = buildCombinedWhereClause(groupFilter, filterRules)

  const sql = `
    SELECT "${groupField}", COUNT(*)::int as count
    FROM "${tableName}"
    ${whereClause}
    GROUP BY "${groupField}"
    ORDER BY "${groupField}" ${sortOrder}
  `

  return { sql, queryValues }
}

/**
 * Build ORDER BY clause from sort rules
 * @param sortRules - Array of sort rules
 * @returns ORDER BY clause string (empty if no rules)
 */
export function buildOrderByClause(sortRules: SortRule[] = []): string {
  if (!sortRules || sortRules.length === 0) {
    return ''
  }

  const validRules = sortRules.filter(rule => rule.field)
  if (validRules.length === 0) {
    return ''
  }

  const orderParts = validRules.map(rule => {
    const direction = rule.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    return `"${rule.field}" ${direction}`
  })

  return `ORDER BY ${orderParts.join(', ')}`
}

/**
 * Build a SELECT * query with WHERE clause and ORDER BY
 * @param tableName - Physical table name
 * @param groupFilter - Simple key-value filter
 * @param filterRules - Filter rules array
 * @param sortRules - Sort rules array
 * @returns { sql: string, queryValues: any[] }
 */
export function buildSelectQuery(
  tableName: string,
  groupFilter: Record<string, any> = {},
  filterRules: FilterRule[] = [],
  sortRules: SortRule[] = []
): { sql: string, queryValues: any[] } {
  const { whereClause, queryValues } = buildCombinedWhereClause(groupFilter, filterRules)
  const orderByClause = buildOrderByClause(sortRules)

  const sql = `SELECT * FROM "${tableName}" ${whereClause} ${orderByClause}`.trim()

  return { sql, queryValues }
}
