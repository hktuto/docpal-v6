import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { getAggColumns } from '@packages/dp-mdTable/composables/useCount'
import { convertFilterRuleToCondition } from './PostgreSQLHelper'

export interface PageParamsOptions {
  group?: boolean
  orderBy?: boolean
}

export interface PageParamsInput {
  columnFilterRules?: {
    conditions?: any[]
    conjunction?: string
  } | null
  columnSortRules?: Array<{ field?: string; order?: string }> | null
  columnGroupRules?: Array<{ field: string; order?: string }> | null
  columns?: any[]
}

function isDateField(columns: any[] | undefined, field: string) {
  const column = columns?.find((col: any) => col.field === field)
  return column?.business_type === ColumnFieldType.DateTime
}

const OPERATORS_WITHOUT_VALUE = ['IS_NULL', 'IS_NOT_NULL', 'DUPLICATE']

function isEmptyFilterValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => item == null || item === '')
  }
  return false
}

function shouldKeepFilterCondition(rule: any): boolean {
  if (!rule?.field || !rule?.operator) return false
  if (OPERATORS_WITHOUT_VALUE.includes(rule.operator)) return true
  return !isEmptyFilterValue(rule.value)
}

function buildFilterRules(columnFilterRules: PageParamsInput['columnFilterRules'], columns?: any[]) {
  if (!columnFilterRules) {
    return []
  }
  const filterRules = {
    value:
      columnFilterRules.conditions
        ?.filter(shouldKeepFilterCondition)
        .map((rule: any) => convertFilterRuleToCondition(rule, (field) => isDateField(columns, field)))
        .filter((rule: any) => (rule.column && rule.type) || rule.type === 'AND') || [],
    type: columnFilterRules.conjunction || 'AND'
  }
  return [filterRules]
}

function buildSortRules(columnSortRules: PageParamsInput['columnSortRules']) {
  return (
    columnSortRules?.reduce((acc: any[], rule) => {
      if (rule.field) {
        acc.push({
          column: rule.field,
          desc: rule.order === 'desc'
        })
      }
      return acc
    }, []) || []
  )
}

export function buildPageParams(
  input: PageParamsInput,
  options: PageParamsOptions = {}
) {
  const { group = true, orderBy = true } = options
  const { columnFilterRules, columnSortRules, columnGroupRules, columns } = input
  const params: Record<string, any> = {}
  if (columnFilterRules && columnFilterRules.conditions?.length) {
    const conditions = buildFilterRules(columnFilterRules, columns)
    if (conditions[0].value?.length) {
      params.conditions = conditions
    }
  } else {
    params.conditions = []
  }

  if (columns) {
    params.columns = [{ name: '*' }]
  }

  if (group && columnGroupRules?.length) {
    params.groupBy = {
      columns: [columnGroupRules[0].field]
    }
    const aggColumns = getAggColumns(columns || [])
    params.columns = [
      { name: columnGroupRules[0].field },
      ...aggColumns,
      {
        name: '*',
        alias: '__count',
        aggFunc: 'COUNT'
      }
    ]
    params.orderBy = [
      {
        column: columnGroupRules[0].field,
        desc: columnGroupRules[0].order === 'desc'
      }
    ]
  } else if (columnSortRules?.length && orderBy) {
    const sortOrderBy = buildSortRules(columnSortRules)
    if (sortOrderBy.length) {
      params.orderBy = sortOrderBy
    }
  }
  console.log('params', params)
  return params
}
