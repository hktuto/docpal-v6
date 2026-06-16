<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-calendar-widget">
      <FullCalendar :options="calendarOptions" />
    </div>
  </DashboardCard>
  <DbCalendarWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions, EventClickArg, DatesSetArg } from '@fullcalendar/core'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { SingleDatabaseContextKey } from '../../composables/useSignleDatabase'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const records = ref<any[]>([])
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayTitle = computed(() => props.setting?.label || 'Calendar')

const startField = computed(() => props.setting?.startField || '')
const endField = computed(() => props.setting?.endField || '')
const titleField = computed(() => props.setting?.titleField || '')

const dateRange = ref({ start: 0, end: 0 })

const dbContext = inject(SingleDatabaseContextKey, null)

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

const calendarEvents = computed(() => {
  const sField = startField.value
  const tField = titleField.value
  if (!sField) return []

  return records.value.map((row: any) => {
    const start = row[sField]
    const end = endField.value ? row[endField.value] : start

    const label = tField && row[tField] ? row[tField] : row.id

    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null

    return {
      id: row.id,
      title: label || row.id,
      start: startDate ? formatDate(startDate) : '',
      end: endDate ? formatDate(endDate) : '',
      allDay: true,
      extendedProps: { raw: row }
    }
  })
})

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: ''
  },
  buttonText: {
    today: 'today',
    month: 'month'
  },
  navLinks: false,
  editable: false,
  selectable: false,
  dayMaxEvents: true,
  events: [],
  eventClick: (info: EventClickArg) => {
    handleEventClick(info.event.extendedProps.raw)
  },
  datesSet: async (dateInfo: DatesSetArg) => {
    updateDateRange(dateInfo.start, dateInfo.end)
    await fetchData()
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

function handleEventClick(row: any) {
  if (!dbContext || !props.setting?.tableId || !row?.id) return
  dbContext.databaseMenuRouteParams.value.detailType = 'record'
  dbContext.databaseMenuRouteParams.value.recordId = row.id
  dbContext.databaseMenuRouteParams.value.tableId = props.setting.tableId
  dbContext.databaseMenuRouteParams.value.pageType = 'detail'
}

async function fetchData() {
  const { tableId, limit } = props.setting || {}
  if (!tableId || !startField.value) return
  if (!dateRange.value.start || !dateRange.value.end) return

  loading.value = true
  try {
    const conditions: any[] = []

    // Overlap query: events that intersect with the visible range
    // startField < range.end AND (endField > range.start OR startField > range.start when no endField)
    conditions.push({
      column: startField.value,
      type: 'LT',
      value: dateRange.value.end
    })

    if (endField.value) {
      conditions.push({
        column: endField.value,
        type: 'GT',
        value: dateRange.value.start
      })
    } else {
      conditions.push({
        column: startField.value,
        type: 'GT',
        value: dateRange.value.start
      })
    }

    const { data }: any = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      conditions: conditions.length ? [{ type: 'AND', value: conditions }] : undefined,
      pagination: {
        pageSize: limit || 200,
        pageNum: 1
      }
    })
    records.value = data?.data || []
  } catch (error) {
    console.error('Failed to fetch calendar data:', error)
    records.value = []
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => [props.setting?.tableId, props.setting?.startField, props.setting?.endField, props.setting?.titleField],
  () => {
    // Reset and refetch when config changes; datesSet on FullCalendar will trigger initial fetch
    if (dateRange.value.start && dateRange.value.end) {
      fetchData()
    }
  },
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchData
)

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-calendar-widget {
  height: 100%;
  padding: var(--app-space-xs);

  :deep(.fc) {
    height: 100%;
    font-size: 13px;
  }

  :deep(.fc-toolbar-title) {
    font-size: 16px;
    font-weight: 500;
  }

  :deep(.fc-button) {
    text-transform: capitalize;
    font-size: 12px;
    padding: 4px 10px;
  }

  :deep(.fc-daygrid-day-number) {
    font-size: 12px;
  }

  :deep(.fc-event) {
    font-size: 11px;
    cursor: pointer;
  }
}
</style>
