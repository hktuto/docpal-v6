<template>
  <div class="table-view-root" v-if="tableId">
    <div class="table-view-main">
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
          :extra-column-config="extraColumnConfig" />
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

// Awareness from global manager
const hocuspocusManager = useHocuspocusManager()
const tableAwareness = computed(() => {
  const room = hocuspocusManager.getRoomState(`dynamic-db:${databaseMenuRouteParams.value.detailId}`)
  if (!room) return []
  return room.awarenessStates.filter((s: any) => s.focus?.tableId === props.dataTableId)
})

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
  saveColumnOrder,
  updateViewFilterSortGroup,
  systemFieldsTypes,
  tableId,
  tableAwareness
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
