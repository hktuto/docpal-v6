<template>
  <div class="table-view-root" v-if="tableId">
    <div ref="tableViewMainRef" class="table-view-main" style="position: relative">
      <MdCard
        v-if="currentView?.type === 'card'"
        ref="mdCardRef"
        :canManageTable="canManageTable"
        :canEditTable="canEditTable"
        :is-mirror="isMirror"
        :table-id="tableId"
        :extra-column-config="extraColumnConfig"
        :editable="canEditTable"
        @exit-edit-row="exitRowEdit"
        @start-edit-row="startEditRowHandler"
        @row-context-menu="handleRowContextMenu"
      />
      <MdKanban
        v-else-if="currentView?.type === 'kanban'"
        :canManageTable="canManageTable"
        :canEditTable="canEditTable"
        :is-mirror="isMirror"
        :table-id="tableId"
        :extra-column-config="extraColumnConfig"
        @exit-edit-row="exitRowEdit"
        @start-edit-row="startEditRowHandler"
      />
      <MdCalendar
        v-else-if="currentView?.type === 'calendar'"
        :canManageTable="canManageTable"
        :canEditTable="canEditTable"
        :is-mirror="isMirror"
        :table-id="tableId"
        :extra-column-config="extraColumnConfig"
        @exit-edit-row="exitRowEdit"
        @start-edit-row="startEditRowHandler"
      />
      <MdTable
        v-else
        ref="mdTableRef"
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
        @row-context-menu="handleRowContextMenu"
        @column-config-edit-start="handleColumnConfigEditStart"
        @column-config-edit-finish="handleColumnConfigEditFinish"
      />
      <ToolsContextMenuPopover ref="contextMenuRef" />
      <DatabaseAwarenessFloatingTags :viewType="currentView?.type" :get-element="getTableCell" :container-ref="tableBodyRef" />
      <div v-show="false">
        <WorkflowPopoverNewTask />
      </div>
    </div>

    <div v-if="panelVisible" class="table-view-panel">
      <div class="panel-header">
        <span class="panel-title">{{ panelTitle }}</span>
        <button class="panel-close" tabindex="0" @click="handleClosePanel" @keydown.enter="handleClosePanel">
          <Icon name="lucide:x" size="16" />
        </button>
      </div>
      <div class="panel-body">
        <DatabaseSettingAutomation v-if="panelType === 'automation'" :master-table-id="tableId" />
        <DatabaseSettingAuditLog v-if="panelType === 'auditLog'" :master-table-id="tableId" />
        <DatabaseTableImportDataSidebar
          v-if="panelType === 'importData'"
          :table-id="tableId"
          :table-name="tableName"
          :table-fields="tableFields"
          @close="handleClosePanel"
          @success="handleImportSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { EventType, useEventBus } from 'eventbus'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { useRowContextMenuActions } from '@packages/dp-mdTable/composables/useRowContextMenuActions'
import { createDatabaseTableRowContextMenuEvents } from '../../../composables/useDatabaseTableRowContextMenu'
import { useTableViewsInject } from '../../../composables/table/useTableViews'
import { useDBParams } from '../../../composables/table/useDBParams'
import { useRelationConfigInject } from '../../../composables/table/useRelationConfig'
const props = defineProps<{
  dataTableId: string
  isMirror: boolean
  canEditTable: boolean
  canManageTable: boolean
}>()
const tableId = computed(() => props.dataTableId)
const tableName = computed(() => {
  const item = findItemById(menuState.value.items, tableId.value)
  return item?.name || ''
})
const {
  currentView,
  tableFields,
  getViews,
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
const addMirrorBus = useEventBus(EventType.MD_TABLE_ADD_MIRROR)


// hocuspocus logic
const { setAwareness, localAwareness, updatedRows, broadcastChange } = inject('databaseHocuspocus')

const mdTableRef = ref()
const mdCardRef = ref()

const tableRef = computed(() => {
  return currentView.value?.type === 'card' ? mdCardRef.value : mdTableRef.value
})

const tableViewMainRef = ref<HTMLElement>()
const tableBodyRef = ref<HTMLElement | null>(null)

function updateTableBodyRef() {
  if (databaseMenuRouteParams.value.detailType === 'table') {
    tableBodyRef.value = tableViewMainRef.value?.querySelector('.vxe-table--body-wrapper') as HTMLElement | null
  }
}

onMounted(() => {
  nextTick(updateTableBodyRef)
})

watch(currentView, () => {
  nextTick(updateTableBodyRef)
})

function handleCellMouseEnter(params: any) {
  if (!localAwareness.value.focus?.editingRow && !localAwareness.value.focus?.editingCell && !localAwareness.value.focus?.editingColumn) {
    setAwareness({
      rowId: params.row.id,
      cellId: params.column.field,
      status: undefined
    })
  }
}
function exitCellEdit(params: any) {
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
    cellId: null,
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
function handleCellMouseLeave(params: any) {}
function startEditRowHandler(params: any) {
  if (params.mode && params.mode !== 'edit') return
  setAwareness({
    rowId: params.row.id,
    editingRow: true,
    editingCell: false,
    status: 'editing'
  })
}

function getCurrentMenuId() {
  return databaseMenuRouteParams.value.tableId || databaseMenuRouteParams.value.detailId
}

const { contextMenuRef, handleRowContextMenu } = useRowContextMenuActions({
  tableRef,
  eventList: createDatabaseTableRowContextMenuEvents({
    tableId,
    canEditTable: computed(() => props.canEditTable),
    menuId: computed(() => getCurrentMenuId())
  })
})

const editingColumnField = ref<string | null>(null)

function handleColumnConfigEditStart(column: any) {
  if (!column?.field) return
  editingColumnField.value = column.field
  setAwareness({
    menuId: getCurrentMenuId(),
    rowId: null,
    cellId: column.field,
    editingRow: false,
    editingCell: false,
    editingColumn: true,
    status: 'editing'
  })
}

function handleColumnConfigEditFinish() {
  if (!editingColumnField.value) return
  setAwareness({
    menuId: getCurrentMenuId(),
    rowId: null,
    cellId: null,
    editingRow: false,
    editingCell: false,
    editingColumn: false,
    status: 'saved'
  })
  editingColumnField.value = null
}

function broadcastColumnConfigUpdated(fieldName?: string, fieldId?: string) {
  if (!broadcastChange) return
  broadcastChange({
    type: 'column_config_updated',
    tableId: tableId.value,
    menuId: getCurrentMenuId(),
    fieldName,
    fieldId,
    viewId: currentView.value?.id
  })
}

async function refreshColumnConfig(viewId?: string) {
  await getViews(viewId || currentView.value?.id, { silent: true })
}

async function handleUpdateColumn(fieldName: string, updates: any) {
  if (!fieldName) return
  await updateField(fieldName, updates)
  broadcastColumnConfigUpdated(fieldName)
}

async function handleAddColumn(newColumns: any[], targetFieldId = '', dragPos?: 'left' | 'right') {
  await addField(newColumns, targetFieldId, dragPos)
  broadcastColumnConfigUpdated(undefined, targetFieldId)
}

async function handleDeleteColumn(fieldId: string) {
  await deleteField(fieldId)
  broadcastColumnConfigUpdated(undefined, fieldId)
}

async function handleUpdatedViewColumnsConfig(updates: Array<{ id: string; hidden: boolean }>) {
  await updatedViewColumnsConfig(updates)
  broadcastColumnConfigUpdated()
}

async function handleUpdateViewColumnCountMethod(fieldId: string, countMethod: string) {
  await updateViewColumnCountMethod(fieldId, countMethod)
  broadcastColumnConfigUpdated(undefined, fieldId)
}

async function handleSaveColumnOrder(columnId: string, targetFieldId: string, dragPos: 'left' | 'right') {
  await saveColumnOrder(columnId, targetFieldId, dragPos)
  broadcastColumnConfigUpdated(undefined, columnId)
}

function getTableCell(focus: any) {
  const type = currentView.value?.type || 'table'
  if (type === 'kanban') {
    const selector = `#groupItem_${focus.rowId}`
    return {
      element: document.querySelector(selector) as HTMLElement | null,
      type: 'kanban-cell',
      selector
    }
  } else if (type === 'card') {
    const selector = `#cardItem_${focus.rowId}`
    const el = document.querySelector(selector) as HTMLElement | null
    console.log('getTableCell', focus, el)
    return {
      element: el,
      type: 'card-cell',
      selector
    }
  } else if (type === 'calendar') {
    const selector = `.calendar_${focus.rowId}`
    const el = document.querySelector(selector) as HTMLElement | null
    return {
      element: el,
      type: 'card-cell',
      selector
    }
  } else {
    if (!focus.cellId) {
      const selector = `tr[rowid="${focus.rowId}"] td:nth-child(2) .vxe-cell`
      return {
        element: document.querySelector(selector) as HTMLElement | null,
        type: 'table-cell',
        selector
      }
    } else {
      const selector = `tr[rowid="${focus.rowId}"] td[colid="${focus.cellId}"] .vxe-cell`
      return {
        element: document.querySelector(selector) as HTMLElement | null,
        type: 'table-cell',
        selector
      }
    }
  }
}

const extraColumnConfig = computed(() => {
  const data = {
    columns,
    deleteColumn: handleDeleteColumn,
    updateColumn: handleUpdateColumn,
    addColumn: handleAddColumn,
    tableFields,
    currentView,
    updatedViewColumnsConfig: handleUpdatedViewColumnsConfig,
    updateViewColumnCountMethod: handleUpdateViewColumnCountMethod,
    saveColumnOrder: handleSaveColumnOrder,

    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    updateViewFilterSortGroup,
    viewStyleConfig,
    menuId: computed(() => getCurrentMenuId())
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
  canManageTable: computed(() => props.canManageTable),
  getRelationFieldConfig,
  setSingleRelationConfig,
  mirrorList,
  updatedViewColumnsConfig: handleUpdatedViewColumnsConfig,
  updateViewColumnCountMethod: handleUpdateViewColumnCountMethod,
  saveColumnOrder: handleSaveColumnOrder,
  refreshColumnConfig,
  updateViewFilterSortGroup,
  systemFieldsTypes,
  tableId,
  menuId: computed(() => getCurrentMenuId())
})

// Side panel state
const panelVisible = ref(false)
const panelType = ref<string | null>(null)

const panelTitle = computed(() => {
  const titles: Record<string, string> = {
    automation: 'Automation',
    auditLog: 'Audit Log',
    importData: 'Import Data'
  }
  return titles[panelType.value || ''] || 'Panel'
})

function handleImportSuccess() {
  // Sidebar stays open on result step with countdown and auto-refresh
  // No action needed here
}

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
