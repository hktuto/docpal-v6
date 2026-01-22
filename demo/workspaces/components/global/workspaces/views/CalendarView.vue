<script setup lang="ts">
import type { CaseViewRecord } from '../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  view: CaseViewRecord
  tableView: ReturnType<typeof useTableView>
}>()

const emit = defineEmits<{
  saveView: []
}>()

const startField = computed(() => {
  return props.view.viewSettings?.calendar?.startField || ''
})

const endField = computed(() => {
  return props.view.viewSettings?.calendar?.endField || ''
})

const getFieldLabel = (fieldName: string) => {
  const field = props.tableView.fields.value.find(f => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

// Current month for calendar display
const currentDate = ref(new Date())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

// Get days in month
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

// Generate calendar days
const calendarDays = computed(() => {
  const days: { day: number; date: Date; isCurrentMonth: boolean }[] = []
  
  // Previous month days
  const prevMonthDays = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    days.push({
      day,
      date: new Date(currentYear.value, currentMonth.value - 1, day),
      isCurrentMonth: false
    })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth.value; day++) {
    days.push({
      day,
      date: new Date(currentYear.value, currentMonth.value, day),
      isCurrentMonth: true
    })
  }
  
  // Next month days (fill to complete 6 rows)
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      day,
      date: new Date(currentYear.value, currentMonth.value + 1, day),
      isCurrentMonth: false
    })
  }
  
  return days
})

// Get events for the calendar
const events = computed(() => {
  if (!startField.value) return []
  
  return props.tableView.tableData.value.map(row => {
    const start = row[startField.value]
    const end = endField.value ? row[endField.value] : start
    
    // Get first text field as label
    const labelField = props.tableView.fields.value.find(f => 
      f.businessType === 'text' && f.fieldName !== startField.value && f.fieldName !== endField.value
    )
    const label = labelField ? row[labelField.fieldName] : row.id
    
    return {
      id: row.id,
      label,
      start: start ? new Date(start) : null,
      end: end ? new Date(end) : null,
      raw: row
    }
  }).filter(e => e.start)
})

// Get events for a specific day
function getEventsForDay(date: Date) {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  
  return events.value.filter(event => {
    if (!event.start) return false
    const eventStart = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
    const eventEnd = event.end 
      ? new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate() + 1) 
      : new Date(eventStart.getTime() + 24 * 60 * 60 * 1000)
    
    return eventStart < dayEnd && eventEnd > dayStart
  })
}

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

function goToToday() {
  currentDate.value = new Date()
}

const monthName = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const isLoading = ref(true)

async function loadData() {
  isLoading.value = true
  try {
    await props.tableView.getTableData()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
</script>

<template>
  <div class="calendar-view-container">
    <!-- Configuration Info -->
    <div class="calendar-header">
      <div class="config-info">
        <span class="config-item">
          <span class="config-label">Start:</span>
          <el-tag size="small" type="info">{{ getFieldLabel(startField) }}</el-tag>
        </span>
        <span class="config-item">
          <span class="config-label">End:</span>
          <el-tag size="small" type="info">{{ getFieldLabel(endField) }}</el-tag>
        </span>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading calendar data...</span>
    </div>
    
    <!-- Calendar -->
    <div v-else class="calendar">
      <!-- Month Navigation -->
      <div class="month-navigation">
        <el-button size="small" @click="prevMonth">
          <Icon name="material-symbols:chevron-left" />
        </el-button>
        <span class="month-title">{{ monthName }}</span>
        <el-button size="small" @click="nextMonth">
          <Icon name="material-symbols:chevron-right" />
        </el-button>
        <el-button size="small" type="primary" plain @click="goToToday">Today</el-button>
      </div>
      
      <!-- Week Days Header -->
      <div class="weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">
          {{ day }}
        </div>
      </div>
      
      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div 
          v-for="(dayInfo, index) in calendarDays" 
          :key="index"
          class="calendar-day"
          :class="{ 
            'other-month': !dayInfo.isCurrentMonth,
            'today': dayInfo.date.toDateString() === new Date().toDateString()
          }"
        >
          <div class="day-number">{{ dayInfo.day }}</div>
          <div class="day-events">
            <div 
              v-for="event in getEventsForDay(dayInfo.date).slice(0, 3)" 
              :key="event.id"
              class="event-item"
              :title="event.label"
            >
              {{ event.label }}
            </div>
            <div 
              v-if="getEventsForDay(dayInfo.date).length > 3" 
              class="more-events"
            >
              +{{ getEventsForDay(dayInfo.date).length - 3 }} more
            </div>
          </div>
        </div>
      </div>
      
      <!-- No data state -->
      <div v-if="events.length === 0" class="empty-calendar">
        <Icon name="material-symbols:calendar-month-outline" class="empty-icon" />
        <p>No events to display</p>
        <p class="hint">Add records with dates to see them on the calendar</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.calendar-view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
}

.calendar-header {
  padding: var(--app-space-m);
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.config-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-l);
}

.config-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  
  .config-label {
    color: var(--el-text-color-secondary);
    font-size: var(--app-font-size-s);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    font-size: 32px;
  }
}

.calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--app-space-m);
  overflow: hidden;
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
  
  .month-title {
    font-size: var(--app-font-size-l);
    font-weight: 600;
    min-width: 180px;
    text-align: center;
  }
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
}

.weekday {
  padding: var(--app-space-s);
  text-align: center;
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 1px;
  flex: 1;
  background: var(--el-border-color);
}

.calendar-day {
  background: var(--el-bg-color);
  padding: var(--app-space-xs);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  
  &.other-month {
    background: var(--el-fill-color-light);
    
    .day-number {
      color: var(--el-text-color-placeholder);
    }
  }
  
  &.today {
    .day-number {
      background: var(--el-color-primary);
      color: white;
    }
  }
}

.day-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: var(--app-font-size-s);
  font-weight: 500;
  margin-bottom: var(--app-space-xs);
}

.day-events {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.event-item {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  padding: 2px var(--app-space-xs);
  border-radius: 2px;
  font-size: var(--app-font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  
  &:hover {
    background: var(--el-color-primary-light-7);
  }
}

.more-events {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  padding: 2px var(--app-space-xs);
}

.empty-calendar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl);
  color: var(--el-text-color-secondary);
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: var(--app-space-m);
    color: var(--el-text-color-placeholder);
  }
  
  p {
    margin: 0;
  }
  
  .hint {
    font-size: var(--app-font-size-s);
    margin-top: var(--app-space-xs);
  }
}
</style>
