import { useTableViewsInject } from './useTableViews'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import dayjs from 'dayjs'
import { getAggColumns } from '@packages/dp-mdTable/composables/useCount'
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
          ?.map((rule: any) => {
            if (isDateField(rule.field)) {
              let value = rule.value
              if (rule.operator === 'EQ') {
                return {
                  type: 'AND',
                  value: [
                    {
                      column: rule.field,
                      type: 'GTE',
                      value: dayjs(value).startOf('day').valueOf()
                    },
                    {
                      column: rule.field,
                      type: 'LTE',
                      value: dayjs(value).endOf('day').valueOf()
                    }
                  ]
                }
              } else if (['GT', 'LTE'].includes(rule.operator)) {
                value = dayjs(value).endOf('day').valueOf()
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
          })
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
