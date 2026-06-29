import { convertFilterRuleToCondition } from '../../utils/PostgreSQLHelper'

export interface FilterRule {
  id: string
  connector: 'AND' | 'OR'
  field: string
  operator: string
  value: string | number | Array<string | number>
}

export interface FilterRules {
  conditions: FilterRule[]
  conjunction: 'AND' | 'OR'
}

export interface SortRule {
  id: string
  field: string
  order: 'asc' | 'desc'
}

export interface RelatedRecordQueryParams {
  conditions: Array<{
    type: 'AND' | 'OR'
    value: any[]
  }>
  orderBy: Array<{ column: string; desc: boolean }>
}

function buildFilterConditionGroup(rules: FilterRules | undefined): any[] {
  if (!rules?.conditions?.length) return []

  const conditions = rules.conditions
    .map(rule => convertFilterRuleToCondition(rule as any, () => false))
    .filter(Boolean)

  if (conditions.length === 0) return []

  return [{
    type: rules.conjunction || 'AND',
    value: conditions
  }]
}

function buildOrderBy(rules: SortRule[] | undefined): Array<{ column: string; desc: boolean }> {
  return (rules || [])
    .filter(rule => rule.field)
    .map(rule => ({
      column: rule.field,
      desc: rule.order === 'desc'
    }))
}

export function useRelatedRecordParams() {
  function buildParams(
    recordIds: string[],
    persistedFilterRules: FilterRules | undefined,
    runtimeFilterRules: FilterRules | undefined,
    persistedSortRules: SortRule[] | undefined,
    runtimeSortRules: SortRule[] | undefined
  ): RelatedRecordQueryParams {
    const persistedConditions = buildFilterConditionGroup(persistedFilterRules)
    const runtimeConditions = buildFilterConditionGroup(runtimeFilterRules)

    return {
      conditions: [
        {
          type: 'AND',
          value: [
            { column: 'id', type: 'IN', value: recordIds },
            ...persistedConditions,
            ...runtimeConditions
          ]
        }
      ],
      orderBy: [
        ...buildOrderBy(persistedSortRules),
        ...buildOrderBy(runtimeSortRules)
      ]
    }
  }

  return { buildParams }
}
