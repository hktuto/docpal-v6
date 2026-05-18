<template>
  <div class="table-view-root" v-if="tableId">
    <div ref="tableViewMainRef" class="table-view-main" style="position: relative;">
      <MdCard
          v-if="currentView?.type === 'card'"
          :canManageTable="canManageTable"
          :canEditTable="canEditTable"
          :is-mirror="isMirror"
          :table-id="tableId"
          :extra-column-config="extraColumnConfig"
          :editable="true" />
      <MdKanban
          v-else-if="currentView?.type === 'kanban'"
          :canManageTable="canManageTable"
          :canEditTable="canEditTable"
          :is-mirror="isMirror"
          :table-id="tableId"
          :extra-column-config="extraColumnConfig" />
      <MdCalendar
          v-else-if="currentView?.type === 'calendar'"
          :canManageTable="canManageTable"
          :canEditTable="canEditTable"
          :is-mirror="isMirror"
          :table-id="tableId"
          :extra-column-config="extraColumnConfig" />
      <MdTable v-else
          :canManageTable="canManageTable"
          :canEditTable="canEditTable"
          :is-mirror="isMirror"
          :table-id="tableId"
          :extra-column-config="extraColumnConfig"
          @cell-mouseenter="handleCellMouseEnter"
          @cell-mouseleave="handleCellMouseLeave"
          @start-edit="startEditHandler"
          @exit-edit="exitCellEdit"
          @exit-edit-row="exitRowEdit"
          @expand-click="startEditRowHandler"
          />
      <DatabaseAwarenessFloatingTags :get-element="getTableCell" :container-ref="tableBodyRef" />
    </div>

    <div v-if="panelVisible" class="table-view-panel">
      <div class="panel-header">
        <span class="panel-title">{{ panelTitle }}</span>
        <button class="panel-close" tabindex="0" @click="handleClosePanel" @keydown.enter="handleClosePanel">
          <Icon name="lucide:x" size="16" />
        </button>
      </div>
      <div class="panel-body">
        <DatabaseSettingAutomation
          v-if="panelType === 'automation'"
          :master-table-id="tableId"
        />
      </div>
    </div>
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
  canEditTable: boolean,
  canManageTable: boolean,
}>()
const tableId = computed(() => props.dataTableId)
const {
  currentView,
  tableFields,
  deleteField,
  updateField,
  addField,
  updatedViewColumnsConfig,
  updateViewColumnCountMethod,
  saveColumnOrder,
  columnFilterRules,
  columnSortRules,
  columnGroupRules,
  updateViewFilterSortGroup,
  viewStyleConfig
} = useTableViewsInject()
const { navigateToItem, findItemById, menuState, databaseMenuRouteParams, addItem } = useSingleDatabaseContext()
const { getPageParams, columns } = useDBParams()
const { getRelationFieldConfig, setSingleRelationConfig } = useRelationConfigInject()
const addMirrorBus = useEventBus(EventType.ADD_MIRROR)


// hocuspocus logic
const { setAwareness, localAwareness, updatedRows } = inject('databaseHocuspocus')

const tableViewMainRef = ref<HTMLElement>()
const tableBodyRef = ref<HTMLElement | null>(null)

function updateTableBodyRef() {
  tableBodyRef.value = tableViewMainRef.value?.querySelector('.vxe-table--body-wrapper') as HTMLElement | null
}

onMounted(() => {
  nextTick(updateTableBodyRef)
})

watch(currentView, () => {
  nextTick(updateTableBodyRef)
})

function handleCellMouseEnter(params: any) {
  if (!localAwareness.value.focus.editingRow && !localAwareness.value.focus.editingCell) {
    setAwareness({
      rowId: params.row.id,
      cellId: params.column.field,
      status: undefined
    })
  }
}
function exitCellEdit(params: any) {
  console.log("exit edit")
  setAwareness({
    rowId: params.row.id,
    cellId: params.column.field,
    editingRow: false,
    editingCell: false,
    status: 'saved'
  })
}
function exitRowEdit() {
  setAwareness({
    rowId: null,
    cellId:null,
    editingRow: false,
    editingCell: false,
    status: 'saved'
  })
}
function startEditHandler(params: any) {
  setAwareness({
    rowId: params.row.id,
    cellId: params.column.field,
    editingRow: false,
    editingCell: true,
    status: 'editing'
  })
}
function handleCellMouseLeave(params: any) {
}
function startEditRowHandler(params: any) {
  if(params.mode && params.mode !== 'edit') return
  setAwareness({
    rowId: params.row.id,
    editingRow: true,
    editingCell: false,
    status: 'editing'
  })
}
function getTableCell(focus: any) {
  const selector = `tr[rowid="${focus.rowId}"] td[colid="${focus.cellId}"] .vxe-cell`
  return {
    element: document.querySelector(selector) as HTMLElement | null,
    type: 'table-cell',
    selector
  }
}

watch(updatedRows, (rows) => {
  if (rows.length === 0) return
  for (const row of rows) {
    // TODO: refresh row data for row.rowId
    console.log('[remote edit]', row.userName, 'saved row', row.rowId)
  }
})



const extraColumnConfig = computed(() => {
  const data = {
    columns,
    deleteColumn: deleteField,
    updateColumn: updateField,
    addColumn: addField,
    tableFields,
    currentView,
    updatedViewColumnsConfig,
    updateViewColumnCountMethod,
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
const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
provide('viewTools', {
  columnFilterRules,
  columnSortRules,
  columnGroupRules,
  viewStyleConfig,
  getPageParams,
  columns,
  tableFields,
  navigateToTableMenu,
  getRelationFieldConfig,
  setSingleRelationConfig,
  mirrorList,
  updatedViewColumnsConfig,
  updateViewColumnCountMethod,
  saveColumnOrder,
  updateViewFilterSortGroup,
  systemFieldsTypes,
  tableId,
  menuId: computed(() => databaseMenuRouteParams.value.detailId)
})

// Side panel state
const panelVisible = ref(false)
const panelType = ref<string | null>(null)

const panelTitle = computed(() => {
  const titles: Record<string, string> = {
    automation: 'Automation'
  }
  return titles[panelType.value || ''] || 'Panel'
})

const openSidePanelBus = useEventBus(EventType.OPEN_SIDE_PANEL)
const closeSidePanelBus = useEventBus(EventType.CLOSE_SIDE_PANEL)

const stopOpenSidePanel = openSidePanelBus.on((payload: any) => {
  panelType.value = payload?.type || null
  panelVisible.value = true
})

const stopCloseSidePanel = closeSidePanelBus.on(() => {
  panelVisible.value = false
})

function handleClosePanel() {
  panelVisible.value = false
}

onBeforeUnmount(() => {
  stopOpenSidePanel()
  stopCloseSidePanel()
})
</script>

<style lang="scss" scoped>
.table-view-root {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.table-view-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.table-view-panel {
  width: 380px;
  min-width: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-paper);
  border-left: 1px solid var(--app-grey-850);
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--app-space-m);
    border-bottom: 1px solid var(--app-grey-850);

    .panel-title {
      font-size: var(--app-font-size-m);
      font-weight: 600;
    }

    .panel-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      background: transparent;
      border: none;
      color: var(--app-grey-500);
      cursor: pointer;
      border-radius: var(--app-border-radius);
      transition: all 0.2s;

      &:hover {
        background: var(--app-grey-100);
        color: var(--app-grey-900);
      }
    }
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--app-space-m);
  }
}
</style>
