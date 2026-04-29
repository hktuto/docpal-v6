<template>
  <div style="height: 100%" v-if="tableId">
    <MdCard v-if="currentView?.type === 'card'" :is-mirror="isMirror" :table-id="tableId" :extra-column-config="extraColumnConfig" :editable="true" />
    <MdKanban v-else-if="currentView?.type === 'kanban'" :is-mirror="isMirror" :table-id="tableId" :extra-column-config="extraColumnConfig" />
    <MdGantt v-else-if="currentView?.type === 'gantt'" :is-mirror="isMirror" :table-id="tableId" :extra-column-config="extraColumnConfig" />
    <MdCalendar v-else-if="currentView?.type === 'calendar'" :is-mirror="isMirror" :table-id="tableId" :extra-column-config="extraColumnConfig" />
    <MdTable v-else :is-mirror="isMirror" :table-id="tableId" :extra-column-config="extraColumnConfig" />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { EventType, useEventBus } from 'eventbus'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { useTableViewsInject } from '../../../composables/table/useTableViews'
import { useDBParams } from '../../../composables/table/useDBParams'
import { useRelationConfigInject } from '../../../composables/table/useRelationConfig'
const props = defineProps<{
  dataTableId: string
  isMirror: boolean
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
const { navigateToItem, findItemById, menuState, databaseMenuRouteParams, addItem } = useSingleDatabaseContext()
const { getPageParams, columns } = useDBParams()
const { getRelationFieldConfig } = useRelationConfigInject()
const addMirrorBus = useEventBus(EventType.ADD_MIRROR)

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
async function handleAddMirror() {
  const name = `Mirror of ${currentView?.value?.name}`
  const newItem = await addItem(databaseMenuRouteParams.value.parentId, 'view', {
    name,
    tableId: tableId.value,
    viewId: currentView?.value?.id
  })
  navigateToTableMenu(newItem.id)
}
const stopAddMirror = addMirrorBus.on(() => {
  handleAddMirror()
})
onBeforeUnmount(() => {
  stopAddMirror()
})

const mirrorList = ref<any[]>([])
function getMirrorListForTable(list: any[]) {
  const mirrorList = []
  list.forEach((item) => {
    if (item.metadata?.tableId === tableId.value && item.metadata?.viewId === currentView?.value?.id) {
      mirrorList.push(item)
    }
    if (item.children) {
      mirrorList.push(...getMirrorListForTable(item.children))
    }
  })
  return mirrorList
}
watch(
  () => currentView.value?.id,
  (newVal) => {
    if (props.isMirror) {
      mirrorList.value = []
    } else {
      mirrorList.value = getMirrorListForTable(menuState.value.items)
      console.log('mirrorList', mirrorList.value)
    }
  },
  { immediate: true }
)
provide('viewTools', {
  getPageParams,
  columns,
  tableFields,
  navigateToTableMenu,
  getRelationFieldConfig,
  mirrorList,
  updatedViewColumnsConfig,
  saveColumnOrder
})
</script>

<style lang="scss" scoped></style>
