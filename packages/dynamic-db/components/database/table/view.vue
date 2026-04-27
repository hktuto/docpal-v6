<template>
  <div style="height: 100%" v-if="tableId">
    <MdCard v-if="currentView?.type === 'card'" :table-id="tableId" :extra-column-config="extraColumnConfig" :editable="true" />
    <MdKanban v-else-if="currentView?.type === 'kanban'" :table-id="tableId" :extra-column-config="extraColumnConfig" />
    <MdGantt v-else-if="currentView?.type === 'gantt'" :table-id="tableId" :extra-column-config="extraColumnConfig" />
    <MdCalendar v-else-if="currentView?.type === 'calendar'" :table-id="tableId" :extra-column-config="extraColumnConfig" />
    <MdTable v-else :table-id="tableId" :extra-column-config="extraColumnConfig" />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { useTableViewsInject } from '../../../composables/table/useTableViews'
import { useDBParams } from '../../../composables/table/useDBParams'
import { useRelationConfigInject } from '../../../composables/table/useRelationConfig'
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
const { navigateToItem, findItemById, menuState } = useSingleDatabaseContext()
const { getPageParams, columns } = useDBParams()
const { getRelationFieldConfig } = useRelationConfigInject()

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

function navigateToTableMenu(tableId: string) {
  const tableItem = findItemById(menuState.value.items, tableId)
  navigateToItem(tableItem)
}
provide('viewTools', { getPageParams, columns, tableFields, navigateToTableMenu, getRelationFieldConfig })
</script>

<style lang="scss" scoped></style>
