import dayjs from 'dayjs'

export interface FilterRuleInput {
  field: string
  operator: string
  value: string | number | Array<string | number>
}

export interface QueryCondition {
  column?: string
  type: string
  value?: string | number | Array<string | number>
}

export interface AndCondition {
  type: 'AND'
  value: QueryCondition[]
}

export type FilterCondition = QueryCondition | AndCondition

export function convertFilterRuleToCondition(
  rule: FilterRuleInput,
  isDateField: (field: string) => boolean
): FilterCondition {
  if (isDateField(rule.field)) {
    const dateValue = rule.value as string | number
    let value: string | number | Array<string | number> = rule.value
    if (rule.operator === 'EQ') {
      return {
        type: 'AND',
        value: [
          {
            column: rule.field,
            type: 'GTE',
            value: dayjs(dateValue).startOf('day').valueOf()
          },
          {
            column: rule.field,
            type: 'LTE',
            value: dayjs(dateValue).endOf('day').valueOf()
          }
        ]
      }
    } else if (['GT', 'LTE'].includes(rule.operator)) {
      value = dayjs(dateValue).endOf('day').valueOf()
    }
    return {
      column: rule.field,
      type: rule.operator,
      value
    }
  } else {
    let params: any = {}
    if (!['IS_NULL', 'IS_NOT_NULL', 'DUPLICATE'].includes(rule.operator)) {
      params.value = rule.value
      if (rule.operator === 'LIKE') {
        params.value = rule.value ? `%${rule.value}%` : ''
      }
    }

    return {
      column: rule.field,
      type: rule.operator,
      ...params
    }
  }
}
