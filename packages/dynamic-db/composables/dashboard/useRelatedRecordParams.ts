import { convertFilterRuleToCondition, FilterCondition } from '../../utils/PostgreSQLHelper'

export interface FilterRule {
  id: string
  /** Mirrors the runtime shape emitted by `ToolsFilterConfigPopover`; ignored here in favor of `FilterRules.conjunction`. */
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

export interface RelatedRecordCondition {
  column: string
  type: string
  value?: any
}

export interface RelatedRecordConditionGroup {
  type: 'AND' | 'OR'
  value: Array<RelatedRecordCondition | RelatedRecordConditionGroup>
}

export interface RelatedRecordQueryParams {
  conditions: RelatedRecordConditionGroup[]
  orderBy: Array<{ column: string; desc: boolean }>
}

function buildFilterConditionGroup(rules: FilterRules | undefined): RelatedRecordConditionGroup[] {
  if (!rules?.conditions?.length) return []

  const conditions: FilterCondition[] = rules.conditions.map((rule) =>
    convertFilterRuleToCondition({ field: rule.field, operator: rule.operator, value: rule.value }, () => false)
  )

  if (conditions.length === 0) return []

  return [
    {
      type: rules.conjunction || 'AND',
      value: conditions
    }
  ] as RelatedRecordConditionGroup[]
}

function buildOrderBy(rules: SortRule[] | undefined): Array<{ column: string; desc: boolean }> {
  return (rules || [])
    .filter((rule) => rule.field)
    .map((rule) => ({
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
          value: [{ column: 'id', type: 'IN', value: recordIds }, ...persistedConditions, ...runtimeConditions]
        }
      ],
      orderBy: [...buildOrderBy(persistedSortRules), ...buildOrderBy(runtimeSortRules)]
    }
  }

  return { buildParams }
}
