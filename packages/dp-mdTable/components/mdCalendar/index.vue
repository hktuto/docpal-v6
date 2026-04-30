<script lang="ts" setup>
import { useMDCalendar, type MDCalendarProps } from '../../composables/mdCalendar/useMDCalendar'
import Toolbar from './toolbar.vue'
import { useDBParams } from '../../../dynamic-db/composables/table/useDBParams'
import CalendarViewer from './calendarViewer.vue'
const props = withDefaults(defineProps<MDCalendarProps>(), {
  tableId: '',
  editable: false,
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
}>()

const { columns, systemFieldsTypes, tableFields, viewStyleConfig } = useMDCalendar(props)
const { getPageParams: globalGetPageParams } = useDBParams()

const calendarSettingRef = ref()
const viewerRef = ref()

const startField = computed(() => viewStyleConfig.value?.startField || '')
const endField = computed(() => viewStyleConfig.value?.endField || '')
const titleField = computed(() => viewStyleConfig.value?.titleField || '')
const isFullDayField = computed(() => viewStyleConfig.value?.isFullDayField || '')

// Shared date range ref — updated by calendarViewer, read by getPageParams
// Stores timestamps (milliseconds) for API filter conditions
const dateRange = ref({ start: 0, end: 0 })

function getPageParams() {
  const globalParams = globalGetPageParams()
  const params: any = globalParams

  if (!params.conditions || !params.conditions.length) {
    params.conditions = [{ type: 'AND', value: [] }]
  }

  // Add date range filter if available
  // FIXME: Backend has a bug with GTE/LTE operators. Temporarily using GT/LT as workaround.
  if (dateRange.value.start && dateRange.value.end && startField.value) {
    const rangeConditions = []

    rangeConditions.push({
      column: startField.value,
      type: 'LT',
      value: dateRange.value.end
    })

    if (endField.value) {
      rangeConditions.push({
        column: endField.value,
        type: 'GT',
        value: dateRange.value.start
      })
    } else {
      rangeConditions.push({
        column: startField.value,
        type: 'GT',
        value: dateRange.value.start
      })
    }

    if (params.conditions[0].type === 'AND') {
      params.conditions[0].value.push(...rangeConditions)
    } else {
      params.conditions = [{
        type: 'AND',
        value: [...rangeConditions, params.conditions]
      }]
    }
  }

  params.columns = [{ name: '*' }]
  return params
}

provide('viewTools', { getPageParams, columns, tableFields, dateRange, systemFieldsTypes })

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

function handleFilterChange(rules: any) {
  props.extraColumnConfig?.updateViewFilterSortGroup?.('filterInfo', rules)
  viewerRef.value?.refresh()
}

function handleSortChange(rules: any) {
  props.extraColumnConfig?.updateViewFilterSortGroup?.('sortInfo', rules)
  viewerRef.value?.refresh()
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

function handleAddRow() {
  viewerRef.value?.openCreate()
}

onMounted(() => {
  initSetting()
})
</script>

<template>
  <div class="calendarViewContainer">
    <Toolbar
      :available-columns="columns"
      @refresh="emit('refresh')"
      @search="emit('search', $event)"
      @open-settings="openSetting"
      @filter-change="handleFilterChange"
      @sort-change="handleSortChange"
      @add-row="handleAddRow"
    />
    <div v-if="viewStyleConfig?.startField && viewStyleConfig?.endField" class="calendar-wrapper">
      <CalendarViewer
        ref="viewerRef"
        :table-id="props.tableId"
        :start-field="startField"
        :end-field="endField"
        :title-field="titleField"
        :is-full-day-field="isFullDayField"
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
