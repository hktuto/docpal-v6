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
      <div class="calendar-header">
        <el-button link size="small" @click="prevMonth">
          <Icon name="lucide:chevron-left" size="16" />
        </el-button>
        <span class="calendar-month">{{ monthLabel }}</span>
        <el-button link size="small" @click="nextMonth">
          <Icon name="lucide:chevron-right" size="16" />
        </el-button>
      </div>
      <div class="calendar-grid">
        <div v-for="d in weekDays" :key="d" class="calendar-weekday">{{ d }}</div>
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          class="calendar-day"
          :class="{ 'is-other-month': cell.otherMonth, 'is-today': cell.isToday }"
        >
          <span class="day-number">{{ cell.day }}</span>
          <div class="day-events">
            <div
              v-for="evt in cell.events.slice(0, 3)"
              :key="evt.id"
              class="day-event"
              :title="evt.title"
              @click="handleEventClick(evt)"
            >
              {{ evt.title }}
            </div>
            <div v-if="cell.events.length > 3" class="day-more">+{{ cell.events.length - 3 }} more</div>
          </div>
        </div>
      </div>
    </div>
  </DashboardCard>
  <DbCalendarWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import dayjs from 'dayjs'
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

const currentMonth = ref(dayjs().startOf('month'))

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthLabel = computed(() => currentMonth.value.format('MMMM YYYY'))

const calendarCells = computed(() => {
  const start = currentMonth.value.startOf('month')
  const end = currentMonth.value.endOf('month')
  const startDay = start.day()
  const daysInMonth = end.date()

  const cells: any[] = []

  // Previous month padding
  const prevMonthEnd = start.subtract(1, 'day')
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthEnd.subtract(i, 'day')
    cells.push({
      key: `prev-${d.format('YYYY-MM-DD')}`,
      day: d.date(),
      otherMonth: true,
      isToday: false,
      events: []
    })
  }

  // Current month
  const today = dayjs().format('YYYY-MM-DD')
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = start.date(d).format('YYYY-MM-DD')
    const events = getEventsForDate(dateStr)
    cells.push({
      key: dateStr,
      day: d,
      otherMonth: false,
      isToday: dateStr === today,
      events
    })
  }

  // Next month padding to fill 6 rows (42 cells)
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    const d = end.add(i, 'day')
    cells.push({
      key: `next-${d.format('YYYY-MM-DD')}`,
      day: d.date(),
      otherMonth: true,
      isToday: false,
      events: []
    })
  }

  return cells
})

function getEventsForDate(dateStr: string): any[] {
  const sField = startField.value
  const tField = titleField.value || 'name'
  if (!sField) return []

  const result: any[] = []
  for (const row of records.value) {
    const startVal = row[sField]
    const endVal = endField.value ? row[endField.value] : startVal
    if (!startVal) continue

    const evtStart = dayjs(startVal).format('YYYY-MM-DD')
    const evtEnd = endVal ? dayjs(endVal).format('YYYY-MM-DD') : evtStart

    if (dateStr >= evtStart && dateStr <= evtEnd) {
      result.push({
        id: row.id,
        title: row[tField] || 'Untitled',
        raw: row
      })
    }
  }
  return result
}

function prevMonth() {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
  fetchData()
}

function nextMonth() {
  currentMonth.value = currentMonth.value.add(1, 'month')
  fetchData()
}

const dbContext = inject(SingleDatabaseContextKey, null)

function handleEventClick(evt: any) {
  if (!dbContext || !props.setting?.tableId || !evt.id) return
  dbContext.databaseMenuRouteParams.value.detailType = 'record'
  dbContext.databaseMenuRouteParams.value.recordId = evt.id
  dbContext.databaseMenuRouteParams.value.tableId = props.setting.tableId
  dbContext.databaseMenuRouteParams.value.pageType = 'detail'
}

async function fetchData() {
  const { tableId, limit } = props.setting || {}
  if (!tableId || !startField.value) return
  loading.value = true
  try {
    const monthStart = currentMonth.value.startOf('month').valueOf()
    const monthEnd = currentMonth.value.endOf('month').valueOf()

    const conditions: any[] = [
      {
        column: startField.value,
        type: 'GTE',
        value: monthStart
      },
      {
        column: startField.value,
        type: 'LTE',
        value: monthEnd
      }
    ]

    const { data }: any = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      conditions: [{ type: 'AND', value: conditions }],
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
    fetchData()
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
  display: flex;
  flex-direction: column;
  padding: var(--app-space-xs);
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-xs);
}
.calendar-month {
  font-weight: 600;
  font-size: var(--app-font-size-m);
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  gap: 1px;
  background-color: var(--el-border-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
}
.calendar-weekday {
  background-color: var(--el-fill-color-light);
  padding: 4px;
  text-align: center;
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  color: var(--app-text-color-secondary);
}
.calendar-day {
  background-color: var(--el-bg-color);
  padding: 4px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  &.is-other-month {
    background-color: var(--el-fill-color-lighter);
    color: var(--el-text-color-secondary);
  }
  &.is-today {
    background-color: var(--el-color-primary-light-9);
    .day-number {
      color: var(--el-color-primary);
      font-weight: 700;
    }
  }
}
.day-number {
  font-size: var(--app-font-size-xs);
  line-height: 1.2;
}
.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.day-event {
  font-size: 10px;
  padding: 1px 4px;
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.day-more {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  padding: 0 4px;
}
</style>
