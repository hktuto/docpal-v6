<script lang="ts" setup>
import type { Column, Row } from '../../types/database'
import { useDatabase } from '../../composables/useDatabase'
import { formatDate as formatDateValue, formatNumber as formatNumberValue } from '../../utils/displayFormatter'


const props = defineProps<{
  databaseId: string
  tableId: string
  recordIds: string[]
  displayField?: string
  fieldTitle?: string
}>()

const emit = defineEmits<{
  viewRecord: [tableId: string, recordId: string]
}>()

const { getDatabaseById } = useDatabase()
const popoverDialogRef = ref()

// Get the related records and table
const relatedRecords = computed(() => {
  const database = getDatabaseById(props.databaseId)
  if (!database) return []
  
  const table = database.tables.find(t => t.id === props.tableId)
  if (!table) return []
  
  return props.recordIds
    .map(id => table.rows.find(r => r.id === id))
    .filter(Boolean) as Row[]
})

const relatedTable = computed(() => {
  const database = getDatabaseById(props.databaseId)
  if (!database) return null
  
  return database.tables.find(t => t.id === props.tableId) || null
})

// Get display title for a record (from displayField or first text column)
function getRecordTitle(record: Row): string {
  if (!record || !relatedTable.value) return 'Unknown'
  
  if (props.displayField) {
    return String(record[props.displayField] || 'Untitled')
  }
  
  // Find first text or textarea column
  const textColumn = relatedTable.value.columns.find(c => c.type === 'text' || c.type === 'textarea')
  if (textColumn) {
    return String(record[textColumn.field] || 'Untitled')
  }
  
  return 'Untitled'
}

// Get key fields to display for a record (first 3 non-relation fields)
function getDisplayFields(record: Row): { label: string; value: string; column: Column; displayOptions?: any }[] {
  if (!record || !relatedTable.value) return []
  
  const fieldsToShow: { label: string; value: string; column: Column; displayOptions?: any }[] = []
  const allColumns = JSON.parse(JSON.stringify(relatedTable.value.columns))
  // because title is using first text column, so we need to skip the title column
  let titleColumn
  if (props.displayField) {
    titleColumn = allColumns.find((c: any) => c.field === props.displayField)
  } else {
    titleColumn = allColumns.find((c: any) => c.type === 'text' || c.type === 'textarea')
  }
  if (titleColumn) {
    allColumns.splice(allColumns.indexOf(titleColumn), 1)
  }
  for (const column of allColumns) {
    // Skip relation fields and very long text fields
    if (column.type === 'relation' || column.type === 'textarea' || column.type === 'attachment') {
      continue
    }
    
    const value = record[column.field]
    if (value !== null && value !== undefined && value !== '') {
      fieldsToShow.push({
        label: column.title,
        value: formatFieldValue(value, column),
        column,
        displayOptions: getDisplayOptions(column, value)
      })
    }
    
    if (fieldsToShow.length >= 3) break
  }
  
  return fieldsToShow
}

function getDisplayOptions(column: Column, value: any): any {
  if (column.type === 'single-select') {
    return column.options?.find(o => o.id === value)
  }
  return null
}

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

function handleViewRecord(recordId: string) {
  emit('viewRecord', props.tableId, recordId)
  popoverDialogRef.value?.close()
}

function handleOpenPopover(event: Event) {
  popoverDialogRef.value?.open(event.currentTarget)
}
</script>

<template>
  <div class="relation-list-popover-trigger" @click="handleOpenPopover">
    <Icon name="mdi:dots-vertical" />
  </div>

  <UiPopoverDialog
    ref="popoverDialogRef"
    :width="400"
    placement="bottom-start"
    :close-on-click-outside="true"
  >
    <div v-if="relatedRecords.length > 0 && relatedTable" class="relation-list-popover-content">
      <div class="popover-header">
        <div class="header-info">
          <div class="table-name">{{ fieldTitle || relatedTable.name }}</div>
          <div class="record-count">{{ relatedRecords.length }} {{ relatedRecords.length === 1 ? 'record' : 'records' }}</div>
        </div>
      </div>

      <div class="popover-body">
        <div class="records-list">
          <div
            v-for="record in relatedRecords"
            :key="record.id"
            class="record-item"
          >
            <div class="record-header">
              <div class="record-title">{{ getRecordTitle(record) }}</div>
              <el-button 
                type="primary" 
                text 
                size="small" 
                @click="handleViewRecord(record.id)"
              >
                View
              </el-button>
            </div>
            
            <div v-if="getDisplayFields(record).length > 0" class="field-list">
              <div
                v-for="field in getDisplayFields(record)"
                :key="field.label"
                class="field-item"
              >
                <div class="field-label">{{ field.label }}:</div>
                <div class="field-value">
                  <template v-if="field.column.type === 'single-select'">
                    <el-tag
                      :style="{ 
                        backgroundColor: field.displayOptions?.color + '20', 
                        color: field.displayOptions?.color, 
                        borderColor: field.displayOptions?.color 
                      }"
                      size="small"
                    >
                      {{ field.value }}
                    </el-tag>
                  </template>
                  <template v-else>
                    {{ field.value }}
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="relation-list-popover-content">
      <div class="error-state">
        <span>No records found</span>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
  .relation-list-popover-trigger{
    position: absolute;
    height: 100%;
    top: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
.relation-list-popover-content {
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

.header-info {
  flex: 1;
  min-width: 0;
}

.table-name {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  font-weight: 600;
}

.record-count {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  margin-top: 2px;
}

.popover-body {
  max-height: 400px;
  overflow-y: auto;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.record-item {
  padding: var(--app-space-s);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  background: var(--app-fill-color-lighter);
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-fill-color);
    box-shadow: var(--app-shadow-s);
  }
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-xs);
}

.record-title {
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
}

.field-label {
  color: var(--app-text-color-secondary);
  font-weight: 500;
  flex-shrink: 0;
}

.field-value {
  color: var(--app-text-color-primary);
  word-break: break-word;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-state {
  padding: var(--app-space-l);
  text-align: center;
  color: var(--app-text-color-secondary);
}
</style>

