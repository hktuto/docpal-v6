import { useTableViewsInject } from './useTableViews'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { getAggColumns } from '@packages/dp-mdTable/composables/useCount'
import { convertFilterRuleToCondition } from '../../utils/PostgreSQLHelper'
export function useDBParams() {
  const { currentView, columnFilterRules, columnSortRules, columnGroupRules, updateViewFilterSortGroup, viewStyleConfig } = useTableViewsInject()
  const columns = computed(() => currentView.value?.displayColumns)
  const isDateField = (field: string) => {
    const column = columns.value?.find((col: any) => col.field === field)
    return column?.business_type === ColumnFieldType.DateTime
  }
  function getFilterRules() {
    if (!columnFilterRules.value) {
      return []
    }
    const filterRules = {
      value:
        columnFilterRules.value?.conditions
          ?.map((rule: any) => convertFilterRuleToCondition(rule, isDateField))
          .filter((rule: any) => rule.column && rule.type) || [],
      type: columnFilterRules.value?.conjunction || 'AND'
    }
    return [filterRules]
  }
  function getSortRules() {
    return (
      columnSortRules.value?.reduce((acc: any, rule: any) => {
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

  function getPageParams(getGroup: boolean = true, getOrderBy: boolean = true) {
    const params: any = {
      // dryRun: true,
    }
    if (columnFilterRules.value && columnFilterRules.value.conditions.length > 0) {
      const conditions = getFilterRules()
      if (conditions[0].value && conditions[0].value.length > 0) {
        params.conditions = conditions
      }
    }
    if (columns.value) {
      params.columns = [
        {
          name: '*'
        }
      ]
    }

    if (getGroup && columnGroupRules.value && columnGroupRules.value.length > 0) {
      params.groupBy = {
        columns: [columnGroupRules.value[0].field]
      }
      const aggColumns = getAggColumns(columns.value || [])
      params.columns = [
        { name: columnGroupRules.value[0].field },
        ...aggColumns,
        {
          name: '*', // 字段名
          alias: '__count', // [可选] 别名
          aggFunc: 'COUNT' // [可选] 聚合函数: COUNT, SUM, MAX, MIN, AVG
        }
      ]
      params.orderBy = [
        {
          column: columnGroupRules.value[0].field,
          desc: columnGroupRules.value[0].order === 'desc'
        }
      ]
    } else if (columnSortRules.value && columnSortRules.value.length > 0 && getOrderBy) {
      const orderBy = getSortRules()
      if (orderBy.length > 0) {
        params.orderBy = orderBy
      }
    }
    return params
  }
  return {
    getPageParams,
    columns
  }
}

export default useDBParams
