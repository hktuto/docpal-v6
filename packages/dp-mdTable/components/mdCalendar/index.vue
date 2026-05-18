<script lang="ts" setup>
import { useMDCalendar, type MDCalendarProps } from '../../composables/mdCalendar/useMDCalendar'

import { Setting } from '@element-plus/icons-vue'
import CalendarViewer from './calendarViewer.vue'
const props = withDefaults(defineProps<MDCalendarProps>(), {
  tableId: '',
  editable: false,
  isMirror: false,
  canEditTable: false,
  canManageTable: false,
  extraColumnConfig: () => ({
    columns: ref([]),
    deleteColumn: () => {},
    updateColumn: () => {},
    addColumn: () => {},
    tableFields: ref([]),
    updatedViewColumnsConfig: () => {},
    saveColumnOrder: () => {},
    columnFilterRules: ref([]),
    columnGroupRules: ref([]),
    columnSortRules: ref([])
  })
})

const emit = defineEmits<{
  refresh: []
  search: [value: string]
  'start-edit-row': [row: any]
  'exit-edit-row': [row?: any]
}>()

const { columns, systemFieldsTypes, viewStyleConfig } = useMDCalendar(props)

const calendarSettingRef = ref()
const viewerRef = ref()

const startField = computed(() => viewStyleConfig.value?.startField || '')
const endField = computed(() => viewStyleConfig.value?.endField || '')
const titleField = computed(() => viewStyleConfig.value?.titleField || '')
const isFullDayField = computed(() => viewStyleConfig.value?.isFullDayField || '')

function initSetting() {
  const style = viewStyleConfig.value
  if (!style || !style.startField || !style.endField) {
    nextTick(() => {
      openSetting()
    })
  }
}

function openSetting() {
  calendarSettingRef.value?.open()
}

function handleRefresh() {
  emit('refresh')
  viewerRef.value?.refresh()
}
function handleStartEditRow(row: any) {
  emit('start-edit-row', row)
}

function handleExitEditRow(row?: any) {
  emit('exit-edit-row', row)
}

function handleEventClick(event: any) {
  viewerRef.value?.openDetail(event.raw || event)
}

function handleDateClick(date: string) {
  viewerRef.value?.openCreate({
    [startField.value]: date,
    [endField.value]: date
  })
}

onMounted(() => {
  initSetting()
})
</script>

<template>
  <div class="calendarViewContainer">
    <ToolsBar
     v-if="viewStyleConfig?.startField && viewStyleConfig?.endField"
     :showMirrorButton="!isMirror && canManageTable"
     :showAutomationButton="!isMirror && canManageTable"
     :showAddRowButton="canEditTable"
      :showGroupingButton="false"
      @refresh="handleRefresh"
    >
      <template #toolbar-right>
        <el-button v-if="!isMirror" text :icon="Setting" @click="openSetting">
          Setting
        </el-button>
      </template>
    </ToolsBar>
    <div v-if="viewStyleConfig?.startField && viewStyleConfig?.endField" class="calendar-wrapper">
      <CalendarViewer
        ref="viewerRef"
        :table-id="props.tableId"
        :start-field="startField"
        :end-field="endField"
        :title-field="titleField"
        :is-full-day-field="isFullDayField"
        @start-edit-row="handleStartEditRow"
        @exit-edit-row="handleExitEditRow"
        @event-click="handleEventClick"
        @date-click="handleDateClick"
      />
    </div>
    <div v-else class="no-config">
      <el-empty description="Calendar view not configured">
        <ElButton type="primary" @click="openSetting">Configure Calendar</ElButton>
      </el-empty>
    </div>
    <MdCalendarSettingDialog ref="calendarSettingRef" />
  </div>
</template>

<style lang="scss" scoped>
.calendarViewContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}

.calendar-wrapper {
  flex: 1;
  overflow: hidden;
  background: var(--app-paper);
  border-radius: var(--app-border-radius-s);
}

.no-config {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
