<script lang="ts" setup>
import type { Dashboard, DashboardWidget, Database } from '../../types/database'
import { GridLayout, GridItem } from 'grid-layout-plus'
import UnifiedHeader from './UnifiedHeader.vue'
import type { BreadcrumbItem, HeaderAction } from './UnifiedHeader.vue'

const props = defineProps<{
  database: Database
  dashboard: Dashboard
}>()

const emit = defineEmits<{
  back: []
}>()

// Use the database prop directly (no need to look it up)

// Edit mode
const editMode = ref(false)

// Layout state (reactive copy of dashboard widgets with grid positions)
const layout = ref<Array<DashboardWidget & { i: string; x: number; y: number; w: number; h: number }>>([])

// Initialize layout from dashboard widgets
watchEffect(() => {
  layout.value = props.dashboard.widgets.map((widget, index) => ({
    ...widget,
    i: widget.id,
    x: widget.x ?? (index % 4) * 3,
    y: widget.y ?? Math.floor(index / 4) * 2,
    w: widget.width ?? 3,
    h: widget.height ?? 2
  }))
})

// Grid configuration
const colNum = 12
const rowHeight = 80

// Calculate widget data
function getWidgetData(widget: DashboardWidget): any {
  if (!props.database) return null
  
  switch (widget.type) {
    case 'stat':
      return getStatData(widget)
    case 'chart-pie':
    case 'chart-bar':
      return getChartData(widget)
    default:
      return null
  }
}

function getStatData(widget: DashboardWidget): number {
  if (!props.database || !widget.config.tableId) return 0
  
  const table = props.database.tables.find(t => t.id === widget.config.tableId)
  if (!table) return 0
  
  switch (widget.config.aggregation) {
    case 'count':
      return table.rows.length
    case 'sum':
      if (!widget.config.field) return 0
      return table.rows.reduce((sum, row) => sum + (Number(row[widget.config.field!]) || 0), 0)
    case 'avg':
      if (!widget.config.field) return 0
      const values = table.rows.map(row => Number(row[widget.config.field!]) || 0)
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    default:
      return table.rows.length
  }
}

function getChartData(widget: DashboardWidget): { labels: string[]; values: number[] } {
  if (!props.database || !widget.config.tableId || !widget.config.groupByField) {
    return { labels: [], values: [] }
  }
  
  const table = props.database.tables.find(t => t.id === widget.config.tableId)
  if (!table) return { labels: [], values: [] }
  
  const column = table.columns.find(c => c.field === widget.config.groupByField)
  const groupCounts: Record<string, number> = {}
  
  for (const row of table.rows) {
    const fieldValue: any = row[widget.config.groupByField!]
    const key = String(fieldValue || 'Unknown')
    groupCounts[key] = (groupCounts[key] || 0) + 1
  }
  
  const labels: string[] = []
  const values: number[] = []
  
  if (column?.options) {
    for (const [key, count] of Object.entries(groupCounts)) {
      const option = column.options.find(o => o.id === key)
      labels.push(option?.label || key)
      values.push(count)
    }
  } else {
    for (const [key, count] of Object.entries(groupCounts)) {
      labels.push(key)
      values.push(count)
    }
  }
  
  return { labels, values }
}

function getWidgetColor(index: number): string {
  const colors = [
    'var(--app-primary-color)',
    'var(--app-success-color)',
    'var(--app-warning-color)',
    'var(--app-danger-color)',
    'var(--app-info-color)'
  ]
  return colors[index % colors.length]
}

function toggleEditMode() {
  editMode.value = !editMode.value
}

function handleLayoutUpdate() {
  // Sync layout back to widgets (would save to backend in real app)
  console.log('Layout updated:', layout.value)
}

function handleDeleteWidget(widgetId: string) {
  const index = layout.value.findIndex(w => w.id === widgetId)
  if (index !== -1) {
    layout.value.splice(index, 1)
  }
}

// Breadcrumb for UnifiedHeader
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    to: () => emit('back')
  },
  {
    label: props.dashboard.name
  }
])

// Header actions for UnifiedHeader
const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'edit-mode',
    label: editMode.value ? 'Exit Edit Mode' : 'Edit Dashboard',
    action: toggleEditMode
  },
  {
    code: 'add-widget',
    label: 'Add Widget',
    action: () => { /* TODO: implement add widget */ }
  },
  {
    code: 'dashboard-settings',
    label: 'Dashboard Settings',
    divided: true,
    action: () => { /* TODO: implement dashboard settings */ }
  },
  {
    code: 'share',
    label: 'Share Dashboard',
    action: () => { /* TODO: implement share */ }
  },
  {
    code: 'export-pdf',
    label: 'Export as PDF',
    divided: true,
    action: () => { /* TODO: implement export */ }
  }
])
</script>

<template>
  <div class="dashboard-view">
    <!-- Unified Header -->
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'dashboard',
        database: props.database,
        dashboard: props.dashboard
      }"
      :actions="headerActions"
      :show-collaborators="true"
    />

    <!-- Dashboard Grid -->
    <div class="dashboard-content" :class="{ 'edit-mode': editMode }">
      <GridLayout
        v-model:layout="layout"
        :col-num="colNum"
        :row-height="rowHeight"
        :margin="[12, 12]"
        :is-draggable="editMode"
        :is-resizable="editMode"
        :responsive="true"
        :vertical-compact="true"
        :prevent-collision="false"
        :use-css-transforms="true"
        @layout-updated="handleLayoutUpdate"
      >
        <GridItem
          v-for="(item, index) in layout"
          :key="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          :min-w="2"
          :min-h="2"
          class="widget-item"
        >
          <div class="widget-card">
            <!-- Widget Header -->
            <div class="widget-header">
              <h3 class="widget-title">{{ item.title }}</h3>
              <el-button
                v-if="editMode"
                class="delete-widget-btn"
                text
                size="small"
                type="danger"
                @click="handleDeleteWidget(item.id)"
              >
                ×
              </el-button>
            </div>
            
            <!-- Widget Content -->
            <div class="widget-content">
              <!-- Stat Widget -->
              <template v-if="item.type === 'stat'">
                <div class="stat-widget">
                  <div class="stat-value" :style="{ color: getWidgetColor(index) }">
                    {{ getWidgetData(item)?.toLocaleString() || 0 }}
                  </div>
                  <div class="stat-label">{{ item.config.aggregation || 'count' }}</div>
                </div>
              </template>

              <!-- Pie/Bar Chart Widget -->
              <template v-else-if="item.type === 'chart-pie' || item.type === 'chart-bar'">
                <div class="chart-widget">
                  <div
                    v-for="(label, idx) in getWidgetData(item)?.labels || []"
                    :key="label"
                    class="chart-item"
                  >
                    <div class="chart-bar-container">
                      <div
                        class="chart-bar"
                        :style="{
                          width: `${(getWidgetData(item)?.values[idx] / Math.max(...(getWidgetData(item)?.values || [1]))) * 100}%`,
                          backgroundColor: getWidgetColor(idx)
                        }"
                      />
                    </div>
                    <div class="chart-label">
                      <span class="label-text">{{ label }}</span>
                      <span class="label-value">{{ getWidgetData(item)?.values[idx] }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Table Widget -->
              <template v-else-if="item.type === 'table'">
                <div class="table-widget">
                  <p class="widget-placeholder">Table data widget</p>
                </div>
              </template>

              <!-- Relations Widget -->
              <template v-else-if="item.type === 'relations'">
                <div class="relations-widget">
                  <p class="widget-placeholder">Related records will appear here</p>
                </div>
              </template>

              <!-- Default placeholder -->
              <template v-else>
                <div class="widget-placeholder">
                  <p>{{ item.type }} widget</p>
                </div>
              </template>
            </div>
          </div>
        </GridItem>
      </GridLayout>
      
      <!-- Empty state -->
      <div v-if="layout.length === 0" class="empty-dashboard">
        <div class="empty-icon">📊</div>
        <h3>No widgets yet</h3>
        <p>Add widgets to customize your dashboard</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-m);
  border-bottom: 1px solid var(--app-border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-xl);
  font-weight: var(--app-font-weight-title);
  color: var(--app-text-color-primary);
  margin: 0;

  .dashboard-icon {
    font-size: var(--app-font-size-xl);
  }
}

.dashboard-content {
  flex: 1;
  overflow: auto;
  padding: var(--app-space-m);
  position: relative;
  
  &.edit-mode {
    background-color: var(--app-grey-950);
    background-size: calc((100% - 20px) / 12) calc(92px);
    background-image:
      linear-gradient(to right, var(--app-border-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--app-border-color) 1px, transparent 1px);
  }
}

.widget-item {
  touch-action: none;
}

.widget-card {
  height: 100%;
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-s) var(--app-space-m);
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-fill-color-lighter);
}

.widget-title {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color-primary);
  margin: 0;
}

.delete-widget-btn {
  font-size: var(--app-font-size-m);
}

.widget-content {
  flex: 1;
  padding: var(--app-space-m);
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.stat-widget {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .stat-value {
    font-size: 48px;
    font-weight: var(--app-font-weight-title);
    line-height: 1;
  }

  .stat-label {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-placeholder);
    text-transform: uppercase;
    margin-top: var(--app-space-xs);
  }
}

.chart-widget {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.chart-item {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.chart-bar-container {
  height: 8px;
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  border-radius: var(--app-border-radius-s);
  transition: width 0.3s ease;
}

.chart-label {
  display: flex;
  justify-content: space-between;
  font-size: var(--app-font-size-s);

  .label-text {
    color: var(--app-text-color-secondary);
  }

  .label-value {
    color: var(--app-text-color-primary);
    font-weight: 500;
  }
}

.table-widget,
.relations-widget,
.widget-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-color-placeholder);
  
  p {
    margin: 0;
  }
}

.empty-dashboard {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--app-text-color-secondary);
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: var(--app-space-m);
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 var(--app-space-xs) 0;
    font-size: var(--app-font-size-l);
    color: var(--app-text-color-primary);
  }
  
  p {
    margin: 0;
    font-size: var(--app-font-size-m);
  }
}

// Grid layout overrides
:deep(.vue-grid-item) {
  &.vue-grid-placeholder {
    background: var(--el-color-primary-light-8);
    border: 2px dashed var(--el-color-primary);
    border-radius: var(--app-border-radius-m);
  }
}
</style>
