<script lang="ts" setup>
import { ScheduleXCalendar } from '@schedule-x/vue'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
import { createResizePlugin } from '@schedule-x/resize'
import { createCurrentTimePlugin } from '@schedule-x/current-time'
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'
import {
  createCalendar,
  createViewDay,
  createViewMonthGrid,
  createViewWeek,
  type CalendarEventExternal
} from '@schedule-x/calendar'
import '@schedule-x/theme-default/dist/index.css'

const props = defineProps<{
  tableId: string
  startField: string
  endField: string
  titleField: string
  isFullDayField: string
}>()

const emit = defineEmits<{
  'event-click': [event: any]
  'date-click': [date: string]
}>()

const viewerRef = ref()
const showCalendar = ref(false)
const eventsServicePlugin = createEventsServicePlugin()
const calendarControls = createCalendarControlsPlugin()

// Inject viewTools from parent
const viewTools: any = inject('viewTools')

// Use table data like groupList.vue
const { tableData, getTableData, updateRow, addRow } = useTableData(props.tableId, viewerRef)

const MdFormPopoverRef = ref()
const selectedRow = ref<any>()

let calendarApp: any

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateTime(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

/** Convert schedule-x date string ('YYYY-MM-DD' or 'YYYY-MM-DD HH:mm') to timestamp (ms) */
function parseScheduleXDate(dateStr: string): number {
  // Replace '-' with '/' so Date parses in local time (matching ElDatePicker valueFormat: 'x')
  return new Date(dateStr.replace(/-/g, '/')).getTime()
}

function isDateTimeField(fieldName: string): boolean {
  const field = viewTools?.columns?.value?.find((f: any) => f.field_name === fieldName)
  if (!field) return false
  const ds = field.display_structure
  return ds?.type === 'datetime' || ds?.includeTime === true
}

const dateFieldsHaveTime = computed(() => {
  return isDateTimeField(props.startField) || isDateTimeField(props.endField)
})

const calendarEvents = computed<CalendarEventExternal[]>(() => {
  return tableData.value.map((row: any) => {
    const start = row[props.startField]
    const end = props.endField ? row[props.endField] : start

    const label = props.titleField && row[props.titleField]
      ? row[props.titleField]
      : row.id

    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null

    // Determine if event is full-day
    let isFullDay = true
    if (dateFieldsHaveTime.value) {
      if (props.isFullDayField) {
        isFullDay = !!row[props.isFullDayField]
      } else {
        isFullDay = false
      }
    }

    return {
      id: row.id,
      title: label || row.id,
      start: startDate
        ? (isFullDay ? formatDate(startDate) : formatDateTime(startDate))
        : '',
      end: endDate
        ? (isFullDay ? formatDate(endDate) : formatDateTime(endDate))
        : '',
      raw: row
    }
  })
})

function setupCalendar() {
  showCalendar.value = false

  calendarApp = createCalendar({
    selectedDate: formatDate(new Date()),
    firstDayOfWeek: 1,
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    events: calendarEvents.value,
    callbacks: {
      onEventClick: (args: any) => {
        emit('event-click', args)
      },
      onClickDate: (args: string) => {
        emit('date-click', args)
      },
      onClickDateTime: (args: string) => {
        emit('date-click', args)
      },
      onEventUpdate: async (event: any) => {
        const row = event.raw
        if (!row || !row.id) return

        const payload: Record<string, any> = {}
        if (props.startField && event.start) {
          payload[props.startField] = parseScheduleXDate(event.start)
        }
        if (props.endField && event.end) {
          payload[props.endField] = parseScheduleXDate(event.end)
        }

        await updateRow(row.id, payload, props.tableId)
        await refresh()
      },
      onRangeUpdate: (range: { start: string; end: string }) => {
        handleRangeUpdate(range)
      }
    },
    plugins: [eventsServicePlugin, calendarControls, createDragAndDropPlugin(), createResizePlugin(), createCurrentTimePlugin()]
  })

  nextTick(async () => {
    showCalendar.value = true
    // Initial data load with current month range
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = getDayEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    updateDateRange(monthStart, monthEnd)
    await refresh()
  })
}

function updateDateRange(start: Date, end: Date) {
  if (viewTools?.dateRange) {
    viewTools.dateRange.value = {
      start: start.getTime(),
      end: end.getTime()
    }
  }
}

async function handleRangeUpdate(range: { start: string; end: string }) {
  updateDateRange(new Date(range.start), new Date(range.end))
  await refresh()
}

function getDayEnd(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

async function refresh() {
  tableData.value = []
  nextTick(async () => {
    await getTableData({ pageSize: 1000 })
    syncEvents()
  })
}

function syncEvents() {
  if (!calendarApp) return
  const existing = calendarApp.eventsService.getAll()
  existing.forEach((e: any) => calendarApp.eventsService.remove(e.id))
  calendarEvents.value.forEach((e: any) => calendarApp.eventsService.add(e))
}

// Form popover methods
function openDetail(item: any) {
  selectedRow.value = item
  MdFormPopoverRef.value?.open(item)
}

function openCreate(defaults?: Record<string, any>) {
  selectedRow.value = null
  MdFormPopoverRef.value?.open(defaults || {})
}

async function handleAddRowSubmit(data: any) {
  if (selectedRow.value) {
    await updateRow(selectedRow.value.id, data, props.tableId)
    selectedRow.value = null
  } else {
    await addRow(data)
  }
  await refresh()
}

watch(calendarEvents, () => {
  syncEvents()
}, { deep: true })

onMounted(() => {
  setupCalendar()
})

defineExpose({
  refresh,
  updateRow,
  addRow,
  openDetail,
  openCreate,
  calendarControls,
  calendarApp,
  eventsServicePlugin
})
</script>

<template>
  <div ref="viewerRef" class="calendar-viewer">
    <ScheduleXCalendar v-if="showCalendar" :calendar-app="calendarApp" />
    <MdFormPopover
      ref="MdFormPopoverRef"
      :columns="viewTools?.columns"
      :table-id="props.tableId"
      :systemFieldsTypes="viewTools?.systemFieldsTypes"
      :showMoveButtons="false"
      :showSourceButton="false"
      @submit="handleAddRowSubmit"
    />
  </div>
</template>

<style lang="scss" scoped>
.calendar-viewer {
  width: 100%;
  height: 100%;

  :deep(.sx-vue-calendar-wrapper) {
    height: 100%;
  }
}
</style>
