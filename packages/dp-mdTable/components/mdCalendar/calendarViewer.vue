<script lang="ts" setup>
import FullCalendar from '@fullcalendar/vue3'
import type { CalendarOptions, EventClickArg, DateClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useMDCalendarInject } from '../../composables/mdCalendar/useMDCalendar'

const props = defineProps<{
  tableId: string
  startField: string
  endField: string
  titleField: string
  isFullDayField: string
  canEditTable: boolean
}>()

const emit = defineEmits<{
  'event-click': [event: any]
  'date-click': [date: string],
  'start-edit-row': [row: any],
  'exit-edit-row': [row?: any]
}>()

const viewerRef = ref()
const { columns, systemFieldsTypes, currentEditing  } = useMDCalendarInject()

const dateRange = ref({ start: 0, end: 0 })

const extraParams = computed(() => {
  const conditions: any[] = []
  if (dateRange.value.start && dateRange.value.end && props.startField) {
    conditions.push({
      column: props.startField,
      type: 'LT',
      value: dateRange.value.end
    })
    if (props.endField) {
      conditions.push({
        column: props.endField,
        type: 'GT',
        value: dateRange.value.start
      })
    } else {
      conditions.push({
        column: props.startField,
        type: 'GT',
        value: dateRange.value.start
      })
    }
  }
  if (conditions.length) {
    return {
      conditions: [
        {
          type: 'AND',
          value: conditions
        }
      ]
    }
  }
  return {}
})

// Use table data like groupList.vue
const { tableData, getTableData, updateRow, addRow } = useTableData(props.tableId, viewerRef)

const MdFormPopoverRef = ref()
const selectedRow = ref<any>()

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

function isDateTimeField(fieldName: string): boolean {
  const field = columns.value?.find((f: any) => f.field_name === fieldName)
  if (!field) return false
  const ds = field.display_structure
  return ds?.type === 'datetime' || ds?.includeTime === true
}

const dateFieldsHaveTime = computed(() => {
  return isDateTimeField(props.startField) || isDateTimeField(props.endField)
})

const calendarEvents = computed(() => {
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
      allDay: isFullDay,
      extendedProps: {
        raw: row
      }
    }
  })
})

function eventClassName(arg: EventClickArg) {
  const classes = ['calendar_' + arg.event.id]
  if(arg.event.extendedProps.raw.__deleted) classes.push('deleted')
  return classes
}

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  editable: props.canEditTable,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  buttonText: {
    today: 'today',
    month: 'month',
    week: 'week',
    day: 'day',
    list: 'list'
  },
  navLinks: true,
  editable: true,
  selectable: true,
  dayMaxEvents: true,
  events: [],
  eventClassNames: eventClassName,
  eventClick: (info: EventClickArg) => {
    if(info.event.extendedProps.raw.__deleted) return
    emit('event-click', info.event.extendedProps.raw)
  },
  dateClick: (info: DateClickArg) => {
    emit('date-click', info.dateStr)
  },
  eventAllow: (info: EventAllowArg) => {
    const row = info.event.extendedProps.raw
      if(row.__deleted) return false
     const mode = currentEditing.value.includes(row.id)  ? 'default' : (props.canEditTable ? 'edit' : 'default')
     return mode === 'edit'
  },
  eventDrop: async (info: EventDropArg) => {
    const row = info.event.extendedProps.raw
    if (!row || !row.id) return

    const payload: Record<string, any> = {}
    if (props.startField && info.event.start) {
      payload[props.startField] = info.event.start.getTime()
    }
    if (props.endField && info.event.end) {
      payload[props.endField] = info.event.end.getTime()
    }

    await updateRow(row.id, payload, props.tableId)
    await refresh()
  },
  eventResize: async (info: any) => {
    if(info.event.extendedProps.raw.__deleted) return
    const row = info.event.extendedProps.raw
    if (!row || !row.id) return

    const payload: Record<string, any> = {}
    if (props.startField && info.event.start) {
      payload[props.startField] = info.event.start.getTime()
    }
    if (props.endField && info.event.end) {
      payload[props.endField] = info.event.end.getTime()
    }

    await updateRow(row.id, payload, props.tableId)
    await refresh()
  },
  datesSet: async (dateInfo: DatesSetArg) => {
    updateDateRange(dateInfo.start, dateInfo.end)
    await refresh()
  }
})

watch(calendarEvents, (newEvents) => {
  calendarOptions.value.events = newEvents
}, { deep: true })

function updateDateRange(start: Date, end: Date) {
  dateRange.value = {
    start: start.getTime(),
    end: end.getTime()
  }
}

async function refresh() {
  tableData.value = []
  await nextTick()
  await getTableData({ pageSize: 1000 }, extraParams.value)
}

// Form popover methods
function openDetail(item: any) {
  if(item.__deleted) return
  selectedRow.value = item
   const mode = currentEditing.value.includes(item.id)  ? 'default' : (props.canEditTable ? 'edit' : 'default')
  MdFormPopoverRef.value?.open(item, mode)
  console.log("openDetail", item, mode)
  if(mode === 'edit') {
    emit('start-edit-row', {row:item, mode: 'edit'})
  }
}

function openCreate(defaults?: Record<string, any>) {
  selectedRow.value = null
  MdFormPopoverRef.value?.open(defaults || {})
}
function handleCloseModalForm(){
  emit('exit-edit-row')
}
async function handleAddRowSubmit(data: any) {
  if (selectedRow.value) {
    await updateRow(selectedRow.value.id, data, props.tableId)
    selectedRow.value = null
    emit('exit-edit-row')
  } else {
    await addRow(data)
  }
  await refresh()
}

onMounted(async () => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = getDayEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  updateDateRange(monthStart, monthEnd)
  await refresh()
})

function getDayEnd(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

defineExpose({
  refresh,
  updateRow,
  addRow,
  openDetail,
  openCreate
})
</script>

<template>
  <div ref="viewerRef" class="calendar-viewer">
    <FullCalendar
        :options="calendarOptions"
    />
    <MdFormPopover
      ref="MdFormPopoverRef"
      :columns="columns"
      :table-id="props.tableId"
      :systemFieldsTypes="systemFieldsTypes"
      :showMoveButtons="false"
      :showSourceButton="false"

      @closed="handleCloseModalForm"
      @submit="handleAddRowSubmit"
    />
  </div>
</template>

<style lang="scss" scoped>
.calendar-viewer {
  width: 100%;
  height: 100%;

  :deep(.fc) {
    height: 100%;
    font-size: 14px;
  }

  :deep(.fc-toolbar-title) {
    font-size: 20px;
    font-weight: 500;
  }

  :deep(.fc-button) {
    text-transform: capitalize;
  }
  :deep(.fc-event){
      &.deleted {
          --fc-event-text-color: var(--app-grey-200);
          background: var(--app-grey-800) !important;
          color: var(--app-grey-200) !important;
          border-color:  var(--app-grey-800) !important;
          cursor: not-allowed;
          .fc-event-title fc-sticky{
              text-decoration: line-through;
          }
      }
  }
}
</style>
