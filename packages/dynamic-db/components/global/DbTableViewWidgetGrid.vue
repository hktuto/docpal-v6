<template>
  <MdTable
    ref="mdTableRef"
    :table-id="tableId"
    :editable="false"
    :can-edit-table="false"
    :can-manage-table="false"
    :extra-column-config="extraColumnConfig"
  />
</template>

<script setup lang="ts">
import { useTableViewsInject } from '../../composables/table/useTableViews'
import { useDBParams } from '../../composables/table/useDBParams'
import { useRelationConfigInject } from '../../composables/table/useRelationConfig'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

// Consumer side of the contexts provided by DbTableViewWidget (Vue inject()
// only reads ancestor provides — hence the provider/consumer split).
const props = defineProps<{
  tableId: string
}>()

const mdTableRef = ref()

const { currentView, tableFields, columnFilterRules, columnSortRules, columnGroupRules, viewStyleConfig } = useTableViewsInject()
const { getPageParams, columns } = useDBParams()
const { getRelationFieldConfig, setSingleRelationConfig } = useRelationConfigInject()

const systemFieldsTypes = [
  ColumnFieldType.CreatedTime,
  ColumnFieldType.LastModifiedTime,
  ColumnFieldType.CreatedBy,
  ColumnFieldType.LastModifiedBy
]

// Read-only contract: mutation entry points exist (some mdTable internals throw
// when missing) but never persist changes from a dashboard widget.
const noop = () => {}
const noopAsync = async () => {}
const widgetMenuId = computed(() => `dashboard-widget-${currentView.value?.id || ''}`)

const extraColumnConfig = computed(() => ({
  columns,
  deleteColumn: noopAsync,
  updateColumn: noopAsync,
  addColumn: noopAsync,
  tableFields,
  currentView,
  updatedViewColumnsConfig: noop,
  updateViewColumnCountMethod: noopAsync,
  updateViewColumnWidth: noopAsync,
  saveColumnOrder: noop,
  columnFilterRules,
  columnSortRules,
  columnGroupRules,
  updateViewFilterSortGroup: noopAsync,
  viewStyleConfig,
  menuId: widgetMenuId
}))

provide('viewTools', {
  columnFilterRules,
  columnSortRules,
  columnGroupRules,
  viewStyleConfig,
  getPageParams,
  columns,
  tableFields,
  navigateToTableMenu: noop,
  canManageTable: computed(() => false),
  getRelationFieldConfig,
  setSingleRelationConfig,
  mirrorList: ref([]),
  updatedViewColumnsConfig: noop,
  updateViewColumnCountMethod: noopAsync,
  updateViewColumnWidth: noopAsync,
  saveColumnOrder: noop,
  refreshColumnConfig: noopAsync,
  updateViewFilterSortGroup: noopAsync,
  systemFieldsTypes,
  tableId: computed(() => props.tableId),
  menuId: widgetMenuId
})

defineExpose({
  gridRef: computed(() => mdTableRef.value?.gridRef),
  // Rows only: refreshTableData → useTableData.refresh → grid commitProxy.
  // MdTable does not expose useCount's getAgg, so footer aggregate counts
  // cannot be refreshed from here (see DbTableViewWidget live-update note).
  refresh: () => {
    mdTableRef.value?.refreshTableData?.({ silent: true, keepPage: true })
  }
})
</script>
