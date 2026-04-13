<template>
  <div style="height: 100%" v-if="tableId">
    <MdCard v-if="currentView?.type === 'card'" :table-id="tableId" :extra-column-config="extraColumnConfig" :editable="true" />
    <MdTable v-else :table-id="tableId" :extra-column-config="extraColumnConfig" />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  dataTableId: string
}>()
const tableId = computed(() => props.dataTableId)
const {
  currentView,
  tableFields,
  deleteField,
  updateField,
  addField,
  updatedViewColumnsConfig,
  saveColumnOrder,
  columnFilterRules,
  columnSortRules,
  columnGroupRules,
  updateViewFilterSortGroup,
  viewStyleConfig
} = useTableViewsInject()
const columns = computed(() => currentView.value?.displayColumns)

const extraColumnConfig = computed(() => {
  const data = {
    columns,
    deleteColumn: deleteField,
    updateColumn: updateField,
    addColumn: addField,
    tableFields,
    updatedViewColumnsConfig,
    saveColumnOrder,

    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    updateViewFilterSortGroup,
    viewStyleConfig
  }
  return data
})
const isDateField = (field: string) => {
  const column = columns.value.find((col: any) => col.field === field)
  return column?.business_type === ColumnFieldType.DateTime
}
function getFilterRules() {
  if (!columnFilterRules.value) {
    return []
  }
  const filterRules = {
    value:
      columnFilterRules.value?.conditions?.map((rule: any) => {
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
          return {
            column: rule.field,
            type: rule.operator,
            value: rule.value
          }
        }
      }) || [],
    type: columnFilterRules.value?.conjunction || 'AND'
  }
  return [filterRules]
}
function getSortRules() {
  return (
    columnSortRules.value?.map((rule: any) => {
      console.log('rule', rule)
      return {
        column: rule.field,
        desc: rule.desc
      }
    }) || []
  )
}
function getColumns() {
  return columns.value.map((col: any) => {
    return {
      name: col.field
    }
  })
}
function getPageParams() {
  const params = {
    // dryRun: true,
  }
  if (columnFilterRules.value && columnFilterRules.value.conditions.length > 0) {
    params.conditions = getFilterRules()
  }
  if (columns.value) {
    params.columns = [
      {
        name: '*'
      }
    ]
  }
  if (columnSortRules.value && columnSortRules.value.length > 0) {
    params.orderBy = getSortRules()
  }
  return params
}

provide('viewTools', { getPageParams })
</script>

<style lang="scss" scoped></style>
