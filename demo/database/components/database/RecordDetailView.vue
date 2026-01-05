<script lang="ts" setup>
import type { Table, Row, Column, Dashboard, DashboardWidget, Database } from '../../types/database'
import { useTable } from '../../composables/useDatabase'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { evaluateFormula } from '../../utils/formulaEvaluator'
import UnifiedHeader from './UnifiedHeader.vue'
import type { BreadcrumbItem, HeaderAction } from './UnifiedHeader.vue'

const props = defineProps<{
  database: Database
  table: Table
  recordId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { getRowById, getRelatedRows, resolveRelation, resolveUser, updateRow, getTableById } = useTable(props.database.id, props.table.id)

// Get the current record
const record = computed(() => getRowById(props.table.id, props.recordId))

// Get record display title
const recordTitle = computed(() => {
  if (!record.value) return ''
  // Try to find a title/name field
  const titleField = props.table.columns.find(c => 
    c.field === 'title' || 
    c.field === 'name' || 
    c.field === 'quotationNo' ||
    c.field === 'contractNo' ||
    c.field === 'companyName' ||
    c.field === 'contactPerson' ||
    c.field === 'description' ||
    c.field === 'id'
  )
  if (titleField) {
    return record.value[titleField.field] || props.recordId
  }
  // Fallback to first column value
  if (props.table.columns[0]) {
    return record.value[props.table.columns[0].field] || props.recordId
  }
  return props.recordId
})

// Get record-level dashboard for this table
const recordDashboard = computed(() => {
  return props.database.dashboards.find(d => d.scope === 'record' && d.tableId === props.table.id)
})

// Get relation columns (for showing related data)
const relationColumns = computed(() => {
  return props.table.columns.filter(c => c.type === 'relation' && c.relationConfig)
})

// Editing state
const isEditing = ref(false)
const editData = ref<Record<string, any>>({})

function startEdit() {
  if (record.value) {
    editData.value = { ...record.value }
    isEditing.value = true
  }
}

function cancelEdit() {
  isEditing.value = false
  editData.value = {}
}

function saveEdit() {
  if (record.value) {
    updateRow(props.recordId, editData.value)
    isEditing.value = false
  }
}

// Format field value for display
function formatFieldValue(column: Column, value: any): string {
  if (value === null || value === undefined) return '-'
  
  switch (column.type) {
    case 'date':
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'number':
      if (typeof value !== 'number') return String(value)
      return value.toLocaleString('en-US', {
        minimumFractionDigits: column.decimalPlaces || 0,
        maximumFractionDigits: column.decimalPlaces || 0
      })
    case 'fx':
      // For fx columns, we need to calculate the value
      return String(value) // Will be calculated separately
    case 'single-select':
      const option = column.options?.find(o => o.id === value)
      return option?.label || value
    case 'multi-select':
      if (!Array.isArray(value)) return value
      return value.map(v => {
        const opt = column.options?.find(o => o.id === v)
        return opt?.label || v
      }).join(', ')
    case 'user':
      const user = resolveUser(value)
      return user?.name || value
    case 'relation':
      if (!column.relationConfig) return String(value)
      const display = resolveRelation(column.relationConfig.tableId, value, column.relationConfig.displayField)
      return Array.isArray(display) ? display.join(', ') : display
    case 'checkbox':
    case 'switch':
      return value ? 'Yes' : 'No'
    case 'rating':
      return '★'.repeat(value || 0) + '☆'.repeat((column.maxRating || 5) - (value || 0))
    case 'attachment':
      return Array.isArray(value) ? `${value.length} file(s)` : '-'
    default:
      return String(value)
  }
}

// Get related rows for a relation column
function getRelatedData(column: Column): Row[] {
  if (!record.value || !column.relationConfig) return []
  
  const relatedIds = record.value[column.field]
  if (!relatedIds) return []
  
  const relatedTable = getTableById(column.relationConfig.tableId)
  if (!relatedTable) return []
  
  if (Array.isArray(relatedIds)) {
    return relatedTable.rows.filter(r => relatedIds.includes(r.id))
  }
  
  const row = relatedTable.rows.find(r => r.id === relatedIds)
  return row ? [row] : []
}

// Get display columns for related table
function getRelatedTableColumns(tableId: string): Column[] {
  const table = getTableById(tableId)
  if (!table) return []
  // Return first 4 non-relation columns for display
  return table.columns
    .filter(c => c.type !== 'relation' && c.type !== 'attachment')
    .slice(0, 4)
}

function getSelectColor(value: string, column: Column): string {
  if (!column.options) return '#6b7280'
  const option = column.options.find(o => o.id === value)
  return option?.color || '#6b7280'
}

// Evaluate formula for the current record
function evaluateFormulaColumn(column: Column): string {
  if (!record.value || !column.fxConfig?.expression) {
    return '-'
  }
  
  // Build context from record data
  const context: Record<string, any> = {}
  for (const col of props.table.columns) {
    if (col.id !== column.id) {
      context[col.field] = record.value[col.field]
    }
  }
  
  const result = evaluateFormula(column.fxConfig.expression, context)
  
  if (result.error) {
    return '⚠️ Error'
  }
  
  if (result.value === null) {
    return '-'
  }
  
  return result.value.toLocaleString('en-US', {
    minimumFractionDigits: column.decimalPlaces || 0,
    maximumFractionDigits: column.decimalPlaces || 2
  })
}

// ============ Record Dashboard (Grid Layout) ============
const dashboardEditMode = ref(false)

// Build a layout for the record-level dashboard
const dashboardLayout = computed(() => {
  if (!recordDashboard.value) return []
  
  return recordDashboard.value.widgets.map((widget, index) => ({
    ...widget,
    i: widget.id,
    x: widget.x ?? (index % 4) * 3,
    y: widget.y ?? Math.floor(index / 4) * 2,
    w: widget.width ?? 3,
    h: widget.height ?? 2
  }))
})

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

// Calculate widget data for this specific record
function getWidgetData(widget: DashboardWidget): any {
  if (!record.value) return null
  
  switch (widget.type) {
    case 'stat':
      // For record-level stats, show a field value
      if (widget.config.field) {
        return record.value[widget.config.field]
      }
      return 0
    case 'relations':
      // Show related records count
      if (widget.config.relationField) {
        const relCol = props.table.columns.find(c => c.field === widget.config.relationField)
        if (relCol) {
          return getRelatedData(relCol).length
        }
      }
      return 0
    default:
      return null
  }
}

// Breadcrumb for UnifiedHeader
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    to: () => emit('close')
  },
  {
    label: props.table.name,
    to: () => emit('close')
  },
  {
    label: recordTitle.value
  }
])

// Header actions for UnifiedHeader
const headerActions = computed<HeaderAction[]>(() => {
  if (isEditing.value) {
    return [
      {
        code: 'save',
        label: 'Save Changes',
        action: saveEdit
      },
      {
        code: 'cancel',
        label: 'Cancel',
        action: cancelEdit
      }
    ]
  }
  
  return [
    {
      code: 'edit',
      label: 'Edit Record',
      action: startEdit
    },
    {
      code: 'duplicate',
      label: 'Duplicate',
      action: () => { /* TODO: implement duplicate */ }
    },
    {
      code: 'share',
      label: 'Share Record',
      divided: true,
      action: () => { /* TODO: implement share */ }
    },
    {
      code: 'export',
      label: 'Export',
      action: () => { /* TODO: implement export */ }
    },
    {
      code: 'delete',
      label: 'Delete Record',
      danger: true,
      divided: true,
      action: () => {
        if (confirm('Are you sure you want to delete this record?')) {
          // TODO: implement delete
          emit('close')
        }
      }
    }
  ]
})
</script>

<template>
  <div class="record-detail">
    <!-- Unified Header -->
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'record',
        database: props.database,
        table: props.table,
        recordId: props.recordId
      }"
      :actions="headerActions"
      :show-collaborators="false"
    />
      
    <div v-if="record" class="detail-content">
      <!-- Record Fields -->
      <div class="fields-section">
        <h3 class="section-title">Details</h3>
        <div class="fields-grid">
          <div
            v-for="column in table.columns.filter(c => c.type !== 'relation')"
            :key="column.id"
            class="field-item"
          >
            <label class="field-label">{{ column.title }}</label>
            
            <!-- Display mode -->
            <template v-if="!isEditing">
              <!-- Single Select with color -->
              <template v-if="column.type === 'single-select'">
                <el-tag
                  v-if="record[column.field]"
                  :style="{ 
                    backgroundColor: getSelectColor(record[column.field], column) + '20', 
                    color: getSelectColor(record[column.field], column),
                    borderColor: getSelectColor(record[column.field], column)
                  }"
                >
                  {{ formatFieldValue(column, record[column.field]) }}
                </el-tag>
                <span v-else class="field-value empty">-</span>
              </template>

              <!-- User with avatar -->
              <template v-else-if="column.type === 'user'">
                <div v-if="record[column.field]" class="user-display">
                  <el-avatar :size="24" :src="resolveUser(record[column.field])?.avatar" />
                  <span>{{ resolveUser(record[column.field])?.name }}</span>
                </div>
                <span v-else class="field-value empty">-</span>
              </template>

              <!-- Rating -->
              <template v-else-if="column.type === 'rating'">
                <el-rate :model-value="record[column.field] || 0" disabled :max="column.maxRating || 5" />
              </template>

              <!-- Switch/Checkbox -->
              <template v-else-if="column.type === 'switch'">
                <el-tag :type="record[column.field] ? 'success' : 'info'">
                  {{ record[column.field] ? 'Active' : 'Inactive' }}
                </el-tag>
              </template>

              <!-- URL -->
              <template v-else-if="column.type === 'url'">
                <el-link v-if="record[column.field]" :href="record[column.field]" target="_blank" type="primary">
                  {{ record[column.field] }}
                </el-link>
                <span v-else class="field-value empty">-</span>
              </template>

              <!-- Email -->
              <template v-else-if="column.type === 'email'">
                <el-link v-if="record[column.field]" :href="`mailto:${record[column.field]}`" type="primary">
                  {{ record[column.field] }}
                </el-link>
                <span v-else class="field-value empty">-</span>
              </template>

              <!-- Formula (fx) - Calculated -->
              <template v-else-if="column.type === 'fx'">
                <span class="field-value fx-value" :title="column.fxConfig?.expression">
                  {{ evaluateFormulaColumn(column) }}
                  <small class="fx-hint">(formula)</small>
                </span>
              </template>

              <!-- Default -->
              <template v-else>
                <span class="field-value" :class="{ empty: !record[column.field] }">
                  {{ formatFieldValue(column, record[column.field]) }}
                </span>
              </template>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <el-input
                v-if="column.type === 'text' || column.type === 'email' || column.type === 'url'"
                v-model="editData[column.field]"
              />
              <el-input
                v-else-if="column.type === 'textarea'"
                v-model="editData[column.field]"
                type="textarea"
                :rows="2"
              />
              <el-input-number
                v-else-if="column.type === 'number'"
                v-model="editData[column.field]"
                :precision="column.decimalPlaces || 0"
                style="width: 100%"
              />
              <el-date-picker
                v-else-if="column.type === 'date'"
                v-model="editData[column.field]"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
              <el-select
                v-else-if="column.type === 'single-select'"
                v-model="editData[column.field]"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in column.options"
                  :key="opt.id"
                  :label="opt.label"
                  :value="opt.id"
                />
              </el-select>
              <el-switch
                v-else-if="column.type === 'switch'"
                v-model="editData[column.field]"
              />
              <el-rate
                v-else-if="column.type === 'rating'"
                v-model="editData[column.field]"
                :max="column.maxRating || 5"
              />
              <span v-else-if="column.type === 'fx'" class="field-value fx-value">
                {{ evaluateFormulaColumn(column) }}
                <small class="fx-hint">(calculated)</small>
              </span>
              <span v-else class="field-value">
                {{ formatFieldValue(column, record[column.field]) }}
              </span>
            </template>
          </div>
        </div>
      </div>

      <!-- Record Dashboard (if available) -->
      <div v-if="recordDashboard && dashboardLayout.length > 0" class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Dashboard</h3>
          <el-button
            size="small"
            :type="dashboardEditMode ? 'primary' : 'default'"
            @click="dashboardEditMode = !dashboardEditMode"
          >
            {{ dashboardEditMode ? '✓ Done' : '✏️ Edit' }}
          </el-button>
        </div>
        
        <div class="dashboard-grid" :class="{ 'edit-mode': dashboardEditMode }">
          <GridLayout
            :layout="dashboardLayout"
            :col-num="12"
            :row-height="60"
            :margin="[12, 12]"
            :is-draggable="dashboardEditMode"
            :is-resizable="dashboardEditMode"
            :responsive="true"
            :vertical-compact="true"
            :use-css-transforms="true"
          >
            <GridItem
              v-for="(item, index) in dashboardLayout"
              :key="item.i"
              :x="item.x"
              :y="item.y"
              :w="item.w"
              :h="item.h"
              :i="item.i"
              :min-w="2"
              :min-h="2"
              class="dashboard-widget-item"
            >
              <div class="dashboard-widget-card">
                <div class="widget-header">
                  <span class="widget-title">{{ item.title }}</span>
                </div>
                <div class="widget-content">
                  <!-- Stat widget -->
                  <template v-if="item.type === 'stat'">
                    <div class="stat-display">
                      <span class="stat-value" :style="{ color: getWidgetColor(index) }">
                        {{ getWidgetData(item) ?? '-' }}
                      </span>
                    </div>
                  </template>
                  
                  <!-- Relations widget -->
                  <template v-else-if="item.type === 'relations'">
                    <div class="relations-display">
                      <span class="count">{{ getWidgetData(item) }}</span>
                      <span class="label">Related Records</span>
                    </div>
                  </template>
                  
                  <!-- Default -->
                  <template v-else>
                    <span class="placeholder">{{ item.type }}</span>
                  </template>
                </div>
              </div>
            </GridItem>
          </GridLayout>
        </div>
      </div>

      <!-- Related Records (360 View) -->
      <div v-for="column in relationColumns" :key="column.id" class="relations-section">
        <h3 class="section-title">
          {{ column.title }}
          <span class="relation-count">({{ getRelatedData(column).length }})</span>
        </h3>
        
        <div v-if="getRelatedData(column).length > 0" class="related-table">
          <el-table :data="getRelatedData(column)" stripe border size="small">
            <el-table-column
              v-for="relCol in getRelatedTableColumns(column.relationConfig!.tableId)"
              :key="relCol.id"
              :prop="relCol.field"
              :label="relCol.title"
              :min-width="120"
            >
              <template #default="{ row }">
                {{ formatFieldValue(relCol, row[relCol.field]) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-else class="empty-relations">
          <p>No {{ column.title.toLowerCase() }} linked</p>
        </div>
      </div>
    </div>

    <!-- Record not found -->
    <div v-else class="not-found">
      <p>Record not found</p>
      <el-button @click="emit('close')">Go Back</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.record-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-s) var(--app-space-m);
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-paper);
}

.header-left {
  flex: 1;
  min-width: 0;

  :deep(.el-breadcrumb) {
    font-size: var(--app-font-size-l);
    
    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        font-weight: 400;
        color: var(--app-text-color-secondary);
        
        a {
          color: var(--app-text-color-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
          
          &:hover {
            color: var(--app-primary-color);
          }
        }
      }
      
      &:last-child .el-breadcrumb__inner {
        font-weight: 600;
        color: var(--app-text-color-primary);
      }
    }
    
    .el-breadcrumb__separator {
      margin: 0 var(--app-space-xs);
      color: var(--app-text-color-placeholder);
    }
  }
}

.header-right {
  display: flex;
  gap: var(--app-space-s);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-m);
  :deep(.el-link){
    justify-content: flex-start !important;
    width: auto;
    display: inline;
  }
}

.section-title {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--app-text-color-primary);
  margin: 0 0 var(--app-space-m) 0;
  padding-bottom: var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);

  .relation-count {
    font-weight: normal;
    color: var(--app-text-color-placeholder);
  }
}

.fields-section {
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-m);
  margin-bottom: var(--app-space-l);
  border: 1px solid var(--app-border-color);
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--app-space-m);
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.field-label {
  font-size: var(--app-font-size-s);
  font-weight: 500;
  color: var(--app-text-color-secondary);
}

.field-value {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  
  &.empty {
    color: var(--app-text-color-placeholder);
  }
}

.user-display {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.relations-section {
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-m);
  margin-bottom: var(--app-space-m);
  border: 1px solid var(--app-border-color);
}

.related-table {
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
  :deep(.el-table .cell){
    font-size: var(--app-font-size-m);
  }
}

.empty-relations {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-placeholder);
  background: var(--app-fill-color-lighter);
  border-radius: var(--app-border-radius-s);

  p {
    margin: 0;
  }
}

.not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);
}

// Dashboard Section
.dashboard-section {
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-m);
  margin-bottom: var(--app-space-l);
  border: 1px solid var(--app-border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-m);
  padding-bottom: var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);
}

.dashboard-grid {
  min-height: 200px;
  
  &.edit-mode {
    background-color: var(--app-grey-950);
    background-size: calc((100% - 20px) / 12) calc(72px);
    background-image:
      linear-gradient(to right, var(--app-border-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--app-border-color) 1px, transparent 1px);
  }
}

.dashboard-widget-item {
  touch-action: none;
}

.dashboard-widget-card {
  height: 100%;
  background: var(--app-fill-color-lighter);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .widget-header {
    padding: var(--app-space-xs) var(--app-space-s);
    border-bottom: 1px solid var(--app-border-color);
    background: var(--app-paper);
    
    .widget-title {
      font-size: var(--app-font-size-xs);
      font-weight: 600;
      color: var(--app-text-color-secondary);
    }
  }
  
  .widget-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--app-space-s);
  }
}

.stat-display {
  text-align: center;
  
  .stat-value {
    font-size: 28px;
    font-weight: var(--app-font-weight-title);
  }
}

.relations-display {
  text-align: center;
  
  .count {
    display: block;
    font-size: 24px;
    font-weight: var(--app-font-weight-title);
    color: var(--app-primary-color);
  }
  
  .label {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-placeholder);
  }
}

.placeholder {
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.fx-value {
  font-family: var(--app-font-family-mono, monospace);
  color: var(--app-primary-color);
  cursor: help;
  
  .fx-hint {
    margin-left: var(--app-space-xxs);
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-placeholder);
    font-family: var(--app-font-family);
  }
}
</style>

