<script lang="ts" setup>
import type { Column, Row } from '../../types/database'
import { useDatabase } from '../../composables/useDatabase'
import { formatDate as formatDateValue, formatNumber as formatNumberValue } from '../../utils/displayFormatter'

const props = defineProps<{
  databaseId: string
  tableId: string
  recordId: string
  displayField?: string
}>()

const emit = defineEmits<{
  viewRecord: [tableId: string, recordId: string]
}>()

const { getDatabaseById } = useDatabase()

// Get the related record and table
const relatedRecord = computed(() => {
  const database = getDatabaseById(props.databaseId)
  if (!database) return null
  
  const table = database.tables.find(t => t.id === props.tableId)
  if (!table) return null
  
  return table.rows.find(r => r.id === props.recordId) || null
})

const relatedTable = computed(() => {
  const database = getDatabaseById(props.databaseId)
  if (!database) return null
  
  return database.tables.find(t => t.id === props.tableId) || null
})

// Get display title (from displayField or first text column)
const recordTitle = computed(() => {
  if (!relatedRecord.value || !relatedTable.value) return 'Unknown'
  
  if (props.displayField) {
    return String(relatedRecord.value[props.displayField] || 'Untitled')
  }
  
  // Find first text or textarea column
  const textColumn = relatedTable.value.columns.find(c => c.type === 'text' || c.type === 'textarea')
  if (textColumn) {
    return String(relatedRecord.value[textColumn.field] || 'Untitled')
  }
  
  return 'Untitled'
})

// Get key fields to display (first 4 non-relation fields)
const displayFields = computed(() => {
  if (!relatedRecord.value || !relatedTable.value) return []
  
  const fieldsToShow: { label: string; value: string; column: Column }[] = []
  const allColumns = JSON.parse(JSON.stringify(relatedTable.value.columns))
  // becasue title is using first text column, so we need to skip the title column
  let titleColumn;
  if(props.displayField) {
     titleColumn = allColumns.find((c:any) => c.field === props.displayField)
    
  }else {
    titleColumn = allColumns.find((c:any) => c.type === 'text' || c.type === 'textarea')
  }
  if (titleColumn ) {
    allColumns.splice(allColumns.indexOf(titleColumn), 1)
  }
  for (const column of allColumns) {
    // Skip relation fields and very long text fields
    if (column.type === 'relation' || column.type === 'textarea' || column.type === 'attachment') {
      continue
    }
    
    const value = relatedRecord.value[column.field]
    if (value !== null && value !== undefined && value !== '') {
      fieldsToShow.push({
        label: column.title,
        value: formatFieldValue(value, column),
        column
      })
    }
    
    if (fieldsToShow.length >= 4) break
  }
  
  return fieldsToShow
})

function formatFieldValue(value: any, column: Column): string {
  if (value === null || value === undefined) return '-'
  
  switch (column.type) {
    case 'date':
      return formatDateValue(value, column)
    case 'number':
      return formatNumberValue(value, column)
    case 'single-select':
      const option = column.options?.find(o => o.id === value)
      return option?.label || String(value)
    case 'checkbox':
    case 'switch':
      return value ? '✓ Yes' : '✗ No'
    case 'rating':
      const max = column.maxRating || 5
      return '★'.repeat(value || 0) + '☆'.repeat(max - (value || 0))
    case 'email':
    case 'url':
      return String(value)
    case 'user':
      // For user fields, we'd need to resolve the user
      return String(value)
    default:
      // Truncate long text
      const str = String(value)
      return str.length > 50 ? str.substring(0, 47) + '...' : str
  }
}

function convertTableNameToSingular(name: string): string {
  // Handle words ending in "ies" (e.g., companies -> company)
  if (name.endsWith('ies')) {
    return name.slice(0, -3) + 'y';
  }
  // handle special cases
  if(name.toLowerCase() ==='cases') return 'case'
  
  // Handle words ending in "ses", "xes", "zes" (e.g., addresses -> address, boxes -> box)
  if (name.endsWith('ses') || name.endsWith('xes') || name.endsWith('zes')) {
    return name.slice(0, -2);
  }
  
  // Handle words ending in "shes" or "ches" (e.g., wishes -> wish, watches -> watch)
  if (name.endsWith('shes') || name.endsWith('ches')) {
    return name.slice(0, -2);
  }
  

  
  // Return as-is if no plural pattern detected
  return name;
}

function handleViewRecord() {
  emit('viewRecord', props.tableId, props.recordId)
}
</script>

<template>
  <el-popover
    :width="320"
    trigger="hover"
    placement="top"
    :show-arrow="true"
    :offset="10"
    popper-class="relation-popover"
  >
    <template #reference>
      <slot />
    </template>

    <div v-if="relatedRecord && relatedTable" class="relation-popover-content">
      <div class="popover-header">
        <!-- <div class="table-icon">
          {{ relatedTable.icon ? (relatedTable.icon === 'database' ? '📊' : '📋') : '📋' }}
        </div> -->
        <div class="header-info">
          <div class="table-name">{{ convertTableNameToSingular(relatedTable.name) }}</div>
          <div class="record-title">{{ recordTitle }}</div>
        </div>
      </div>

      <div class="popover-body">
        <div v-if="displayFields.length > 0" class="field-list">
          <div
            v-for="field in displayFields"
            :key="field.label"
            class="field-item"
          >
            <div class="field-label">{{ field.label }}</div>
            <div class="field-value">{{ field.value }}</div>
          </div>
        </div>
        <div v-else class="no-fields">
          No additional fields to display
        </div>
      </div>

      <div class="popover-footer">
        <el-button type="primary" size="small" @click="handleViewRecord">
          View Record
        </el-button>
      </div>
    </div>

    <div v-else class="relation-popover-content">
      <div class="error-state">
        <span>Record not found</span>
      </div>
    </div>
  </el-popover>
</template>

<style lang="scss" scoped>
.relation-popover-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.popover-header {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-s);
  padding-bottom: var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
}

.table-icon {
  font-size: 24px;
  line-height: 1;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.table-name {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.record-title {
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popover-body {
  padding: var(--app-space-xs) 0;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  font-weight: 500;
}

.field-value {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  word-break: break-word;
  font-weight: 700;
}

.no-fields {
  text-align: center;
  padding: var(--app-space-m) 0;
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.popover-footer {
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--app-border-color);
  display: flex;
  justify-content: flex-end;
}

.error-state {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-secondary);
}
</style>

<style lang="scss">
// Global styles for the popover
.relation-popover.el-popover {
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>

