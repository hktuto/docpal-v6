<script lang="ts" setup>
import type { Table, Row, Column, DetailViewWidget, Database } from '../../types/database'
import { useTable } from '../../composables/useDatabase'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { formatDate as formatDateValue, formatNumber as formatNumberValue } from '../../utils/displayFormatter'
import { Close, Edit, Check } from '@element-plus/icons-vue'

const props = defineProps<{
  database: Database
  table: Table
  recordId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { getRowById, getRelatedRows, resolveRelation, resolveUser, updateRow, getTableById, calculateRollupValue } = useTable(props.database.id, props.table.id)

// Get the current record
const record = computed(() => getRowById(props.table.id, props.recordId))

// Get record display title
const recordTitle = computed(() => {
  if (!record.value) return ''
  // Try to find a title/name field
  const titleField = props.table.columns.find(c => 
    c.field === 'title' || 
    c.field === 'name' || 
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

// Get layout configuration
const layout = computed(() => props.table.detailViewLayout)

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

// Get column by ID
function getColumnById(columnId: string): Column | undefined {
  return props.table.columns.find(c => c.id === columnId || c.field === columnId)
}

// Format field value for display
function formatFieldValue(column: Column, value: any): string {
  if (value === null || value === undefined) return '-'
  
  switch (column.type) {
    case 'date':
      return formatDateValue(value, column)
    case 'number':
      return formatNumberValue(value, column)
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
    case 'rollup':
      // Rollup values are calculated, not stored
      return '-'
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
  return table.columns
    .filter(c => c.type !== 'relation' && c.type !== 'attachment')
    .slice(0, 4)
}

function getSelectColor(value: string, column: Column): string {
  if (!column.options) return '#6b7280'
  const option = column.options.find(o => o.id === value)
  return option?.color || '#6b7280'
}
</script>

<template>
  <div class="record-detail-with-layout">
    <div class="detail-header">
      <div class="header-left">
        <el-breadcrumb separator=">">
          <el-breadcrumb-item>{{ database.name }}</el-breadcrumb-item>
          <el-breadcrumb-item>
            <a href="javascript:void(0)" @click="emit('close')">{{ table.name }}</a>
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ recordTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button v-if="!isEditing" :icon="Edit" @click="startEdit">Edit</el-button>
        <template v-else>
          <el-button :icon="Check" type="primary" @click="saveEdit">Save</el-button>
          <el-button @click="cancelEdit">Cancel</el-button>
        </template>
        <el-button :icon="Close" @click="emit('close')">Close</el-button>
      </div>
    </div>

    <div class="detail-content">
      <div v-if="!layout || !layout.widgets || layout.widgets.length === 0" class="default-layout">
        <!-- Default layout: show all fields in a simple grid -->
        <div class="field-grid">
          <div
            v-for="column in table.columns.filter(c => c.type !== 'attachment')"
            :key="column.id"
            class="field-item"
          >
            <div class="field-label">{{ column.title }}</div>
            <div class="field-value">
              <template v-if="isEditing">
                <el-input
                  v-if="column.type === 'text'"
                  v-model="editData[column.field]"
                />
                <el-input
                  v-else-if="column.type === 'textarea'"
                  v-model="editData[column.field]"
                  type="textarea"
                  :rows="3"
                />
                <el-input-number
                  v-else-if="column.type === 'number'"
                  v-model="editData[column.field]"
                  style="width: 100%"
                />
                <span v-else>{{ formatFieldValue(column, record?.[column.field]) }}</span>
              </template>
              <template v-else>
                <el-tag
                  v-if="column.type === 'single-select' && record?.[column.field]"
                  :style="{ backgroundColor: getSelectColor(record[column.field], column) + '20', color: getSelectColor(record[column.field], column), borderColor: getSelectColor(record[column.field], column) }"
                >
                  {{ formatFieldValue(column, record[column.field]) }}
                </el-tag>
                <span v-else>{{ formatFieldValue(column, record?.[column.field]) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Layout -->
      <GridLayout
        v-else
        :layout="layout.widgets"
        :col-num="layout.colNum || 12"
        :row-height="layout.rowHeight || 60"
        :is-draggable="false"
        :is-resizable="false"
        :vertical-compact="true"
        :use-css-transforms="true"
        :margin="[12, 12]"
      >
        <GridItem
          v-for="widget in layout.widgets"
          :key="widget.id"
          :x="widget.x"
          :y="widget.y"
          :w="widget.w"
          :h="widget.h"
          :i="widget.id"
          :static="true"
        >
          <!-- Field Widget -->
          <div v-if="widget.type === 'field' && widget.config.fieldId" class="widget-card">
            <template v-if="getColumnById(widget.config.fieldId)">
              <div class="field-label">{{ getColumnById(widget.config.fieldId)!.title }}</div>
              <div class="field-value">
                <!-- Rollup fields (read-only, calculated) -->
                <template v-if="getColumnById(widget.config.fieldId)!.type === 'rollup' && record">
                  <span class="rollup-value">
                    {{ formatFieldValue(getColumnById(widget.config.fieldId)!, calculateRollupValue(getColumnById(widget.config.fieldId)!, record)) }}
                  </span>
                </template>
                <!-- Editable fields -->
                <template v-else-if="isEditing">
                  <el-input
                    v-if="getColumnById(widget.config.fieldId)!.type === 'text'"
                    v-model="editData[getColumnById(widget.config.fieldId)!.field]"
                  />
                  <el-input
                    v-else-if="getColumnById(widget.config.fieldId)!.type === 'textarea'"
                    v-model="editData[getColumnById(widget.config.fieldId)!.field]"
                    type="textarea"
                    :rows="3"
                  />
                  <el-input-number
                    v-else-if="getColumnById(widget.config.fieldId)!.type === 'number'"
                    v-model="editData[getColumnById(widget.config.fieldId)!.field]"
                    style="width: 100%"
                  />
                  <span v-else>{{ formatFieldValue(getColumnById(widget.config.fieldId)!, record?.[getColumnById(widget.config.fieldId)!.field]) }}</span>
                </template>
                <!-- Display mode -->
                <template v-else>
                  {{ formatFieldValue(getColumnById(widget.config.fieldId)!, record?.[getColumnById(widget.config.fieldId)!.field]) }}
                </template>
              </div>
            </template>
          </div>

          <!-- Section Widget -->
          <div v-else-if="widget.type === 'section'" class="widget-card section-widget">
            <div class="section-title">{{ widget.config.title || 'Section' }}</div>
            <div class="section-fields">
              <div
                v-for="fieldId in widget.config.fieldIds"
                :key="fieldId"
                class="section-field"
              >
                <template v-if="getColumnById(fieldId)">
                  <div class="field-label">{{ getColumnById(fieldId)!.title }}</div>
                  <div class="field-value">
                    {{ formatFieldValue(getColumnById(fieldId)!, record?.[getColumnById(fieldId)!.field]) }}
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Relations Widget -->
          <div v-else-if="widget.type === 'relations' && widget.config.relationFieldId" class="widget-card relations-widget">
            <template v-if="getColumnById(widget.config.relationFieldId)">
              <div class="relations-title">{{ getColumnById(widget.config.relationFieldId)!.title }}</div>
              <div class="relations-list">
                <div
                  v-for="relatedRow in getRelatedData(getColumnById(widget.config.relationFieldId)!)"
                  :key="relatedRow.id"
                  class="related-item"
                >
                  <div
                    v-for="col in getRelatedTableColumns(getColumnById(widget.config.relationFieldId)!.relationConfig!.tableId)"
                    :key="col.id"
                    class="related-field"
                  >
                    <span class="related-label">{{ col.title }}:</span>
                    <span class="related-value">{{ formatFieldValue(col, relatedRow[col.field]) }}</span>
                  </div>
                </div>
                <div v-if="getRelatedData(getColumnById(widget.config.relationFieldId)!).length === 0" class="no-relations">
                  No related records
                </div>
              </div>
            </template>
          </div>
        </GridItem>
      </GridLayout>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.record-detail-with-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--app-bg-color-page);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-m) var(--app-space-l);
  background: var(--app-paper);
  border-bottom: 1px solid var(--app-border-color);
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

.header-actions {
  display: flex;
  gap: var(--app-space-s);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-l);
}

.default-layout {
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--app-space-m);
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.field-label {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color-secondary);
}

.field-value {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
}

.rollup-value {
  font-weight: 600;
  color: var(--app-success-color);
}

.widget-card {
  height: 100%;
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  padding: var(--app-space-m);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.section-widget {
  .section-title {
    font-size: var(--app-font-size-m);
    font-weight: 600;
    color: var(--app-text-color-primary);
    margin-bottom: var(--app-space-s);
    padding-bottom: var(--app-space-s);
    border-bottom: 1px solid var(--app-border-color);
  }

  .section-fields {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }

  .section-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.relations-widget {
  .relations-title {
    font-size: var(--app-font-size-m);
    font-weight: 600;
    color: var(--app-text-color-primary);
    margin-bottom: var(--app-space-s);
    padding-bottom: var(--app-space-s);
    border-bottom: 1px solid var(--app-border-color);
  }

  .relations-list {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }

  .related-item {
    padding: var(--app-space-s);
    background: var(--app-fill-color);
    border-radius: var(--app-border-radius-s);
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xxs);
  }

  .related-field {
    display: flex;
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-s);
  }

  .related-label {
    font-weight: 500;
    color: var(--app-text-color-secondary);
  }

  .related-value {
    color: var(--app-text-color-primary);
  }

  .no-relations {
    text-align: center;
    padding: var(--app-space-l);
    color: var(--app-text-color-placeholder);
    font-size: var(--app-font-size-s);
  }
}

:deep(.vue-grid-layout) {
  background: transparent;
}

:deep(.vue-grid-item) {
  transition: none;
}
</style>

