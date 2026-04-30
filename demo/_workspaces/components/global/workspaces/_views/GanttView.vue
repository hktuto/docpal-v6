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
  return props.view.viewSettings?.gantt?.startField || ''
})

const endField = computed(() => {
  return props.view.viewSettings?.gantt?.endField || ''
})

const percentField = computed(() => {
  return props.view.viewSettings?.gantt?.percentField || ''
})

const getFieldLabel = (fieldName: string) => {
  const field = props.tableView.fields.value.find(f => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

// Get task data for Gantt
const tasks = computed(() => {
  if (!startField.value || !endField.value) return []
  
  return props.tableView.tableData.value.map(row => {
    const start = row[startField.value]
    const end = row[endField.value]
    const percent = percentField.value ? (row[percentField.value] || 0) : 0
    
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
      percent,
      raw: row
    }
  }).filter(t => t.start && t.end)
})

// Calculate date range for the timeline
const dateRange = computed(() => {
  if (tasks.value.length === 0) {
    const now = new Date()
    return {
      start: now,
      end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  }
  
  const starts = tasks.value.map(t => t.start!.getTime())
  const ends = tasks.value.map(t => t.end!.getTime())
  
  return {
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends))
  }
})

// Calculate task bar position and width
function getTaskStyle(task: { start: Date | null; end: Date | null; percent: number }) {
  if (!task.start || !task.end) return {}
  
  const rangeStart = dateRange.value.start.getTime()
  const rangeEnd = dateRange.value.end.getTime()
  const rangeDuration = rangeEnd - rangeStart
  
  const taskStart = task.start.getTime()
  const taskEnd = task.end.getTime()
  
  const left = ((taskStart - rangeStart) / rangeDuration) * 100
  const width = ((taskEnd - taskStart) / rangeDuration) * 100
  
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.min(100 - left, width)}%`
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
</script>

<template>
  <div class="gantt-view-container">
    <!-- Configuration Info -->
    <div class="gantt-header">
      <div class="config-info">
        <span class="config-item">
          <span class="config-label">Start:</span>
          <el-tag size="small" type="info">{{ getFieldLabel(startField) }}</el-tag>
        </span>
        <span class="config-item">
          <span class="config-label">End:</span>
          <el-tag size="small" type="info">{{ getFieldLabel(endField) }}</el-tag>
        </span>
        <span v-if="percentField" class="config-item">
          <span class="config-label">Progress:</span>
          <el-tag size="small" type="success">{{ getFieldLabel(percentField) }}</el-tag>
        </span>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading gantt data...</span>
    </div>
    
    <!-- Gantt Chart -->
    <div v-else class="gantt-chart">
      <!-- Timeline Header -->
      <div class="timeline-header">
        <div class="task-labels-header">Task</div>
        <div class="timeline-dates">
          <span class="date-label">{{ formatDate(dateRange.start) }}</span>
          <span class="date-label">{{ formatDate(dateRange.end) }}</span>
        </div>
      </div>
      
      <!-- Task Rows -->
      <div class="gantt-body">
        <div 
          v-for="task in tasks" 
          :key="task.id" 
          class="gantt-row"
        >
          <div class="task-label" :title="task.label">
            {{ task.label }}
          </div>
          <div class="task-timeline">
            <div 
              class="task-bar" 
              :style="getTaskStyle(task)"
            >
              <div 
                v-if="percentField" 
                class="task-progress" 
                :style="{ width: `${task.percent}%` }"
              />
              <span class="task-bar-label">{{ task.label }}</span>
            </div>
          </div>
        </div>
        
        <!-- No data state -->
        <div v-if="tasks.length === 0" class="empty-gantt">
          <Icon name="material-symbols:view-timeline-outline" class="empty-icon" />
          <p>No tasks to display</p>
          <p class="hint">Add records with start and end dates to see them on the timeline</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gantt-view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
}

.gantt-header {
  padding: var(--app-space-m);
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.config-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-l);
  flex-wrap: wrap;
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

.gantt-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timeline-header {
  display: flex;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}

.task-labels-header {
  width: 200px;
  flex-shrink: 0;
  padding: var(--app-space-m);
  font-weight: 600;
  border-right: 1px solid var(--el-border-color);
}

.timeline-dates {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: var(--app-space-m);
  
  .date-label {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }
}

.gantt-body {
  flex: 1;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  &:hover {
    background: var(--el-fill-color-light);
  }
}

.task-label {
  width: 200px;
  flex-shrink: 0;
  padding: var(--app-space-m);
  border-right: 1px solid var(--el-border-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--app-font-size-s);
}

.task-timeline {
  flex: 1;
  position: relative;
  height: 40px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 10%,
    var(--el-border-color-lighter) 10%,
    var(--el-border-color-lighter) 10.5%
  );
}

.task-bar {
  position: absolute;
  top: 8px;
  height: 24px;
  background: var(--el-color-primary);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 var(--app-space-s);
  min-width: 20px;
}

.task-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--el-color-success);
}

.task-bar-label {
  position: relative;
  z-index: 1;
  font-size: var(--app-font-size-xs);
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-gantt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl);
  color: var(--el-text-color-secondary);
  text-align: center;
  
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
