<script lang="ts" setup>
import type { Table, View, Row, Column, SelectOption, Database } from '../../../types/database'
import { useTable } from '../../../composables/useDatabase'

const props = defineProps<{
  database: Database
  table: Table
  view: View
}>()

const emit = defineEmits<{
  openRecord: [tableId: string, recordId: string]
}>()

const { queryRows, resolveRelation, resolveUser, updateRow } = useTable(props.database.id, props.table.id)

// Search state
const searchQuery = defineModel<string>('searchQuery', { default: '' })

// Get the groupBy column for Kanban
const kanbanGroupByField = computed(() => props.view.config?.groupByField || '')

const kanbanGroupByColumn = computed(() => {
  return props.table.columns.find(c => c.field === kanbanGroupByField.value)
})

// Get all options for the groupBy column (these become the kanban columns)
const kanbanColumns = computed(() => {
  // select column logic
  if(kanbanGroupByColumn.value?.type === 'single-select'){
    return kanbanGroupByColumn.value.options
  }
  if(kanbanGroupByColumn.value?.type === 'relation'){

  }
  // fallback to options empty array
  return kanbanGroupByColumn.value?.options || []
})

// Get view-configured filters and sorting
const viewFilters = computed(() => props.view.config?.filters || [])
const viewSorting = computed(() => props.view.config?.sorting || [])

const flatData = ref<any[]>([])
const debouncedGetTableData = useDebounceFn(getTableData, 300)
async function getTableData() {
  const result = await queryRows({
    search: searchQuery.value,
    filters: viewFilters.value,
    sort: viewSorting.value
  })
  flatData.value = result
}

const columns = ref<(SelectOption & {data:any[]})[]>([])
const debouncedCalculateColumns = useDebounceFn(calculateColumns, 300)
async function calculateColumns(){
  let emptyColumns: (SelectOption & {data:any[]})= {
    id: '__uncategorized__',
    label: 'Uncategorized',
    color: '',
    data: []
  }
  // select column logic
  if(kanbanGroupByColumn.value?.type === 'single-select'){
    columns.value = (kanbanGroupByColumn.value?.options || []).map(option => ({
      ...option,
      data: flatData.value.filter(row => {
        if(!row[kanbanGroupByColumn.value?.field || '']) {
          emptyColumns.data.push(row)
          return false
        }
        if(Array.isArray(row[kanbanGroupByColumn.value?.field || ''])){
          return row[kanbanGroupByColumn.value?.field || ''].includes(option.id)
        }else{
          return row[kanbanGroupByColumn.value?.field || ''] === option.id
        }
      })
    }))
  }
  // relation column logic
  // check if flatData is ready, if not, return empty array
  if(!flatData.value.length) {
    columns.value = []
    return
  }
  if(kanbanGroupByColumn.value?.type === 'relation'){
    // get all unique values from the relation column
    const uniqueValues = [...new Set(flatData.value.reduce((acc: any[], row: any) => {
      const value = row[kanbanGroupByColumn.value?.field || '']
      if(value) {
        if(Array.isArray(value)){
          acc.push(...value)
        }else{
          acc.push(value)
        }
      }
      return acc
    }, []))]
    let columnOptions: (SelectOption & {data:any[]})[] = []
    for(const value of uniqueValues){
      const label = resolveRelation(kanbanGroupByColumn.value?.relationConfig?.tableId || '', value, kanbanGroupByColumn.value?.relationConfig?.displayField || '')
      columnOptions.push({
        id: value,
        label: Array.isArray(label) ? label.join(', ') : label,
        color: '',
        data: flatData.value.filter(row => {
          if(!row[kanbanGroupByColumn.value?.field || '']) {
            emptyColumns.data.push(row)
            return false
          }
          if(Array.isArray(row[kanbanGroupByColumn.value?.field || ''])){
            return row[kanbanGroupByColumn.value?.field || ''].includes(value)
          }else{
            return row[kanbanGroupByColumn.value?.field || ''] === value
          }
        })
      })
    }
    columns.value = columnOptions
    return
  }
  // user column logic
  if(kanbanGroupByColumn.value?.type === 'user'){
    const uniqueValues = [...new Set(flatData.value.reduce((acc: any[], row: any) => {
      const value = row[kanbanGroupByColumn.value?.field || '']
      if(value) {
        if(Array.isArray(value)){
          acc.push(...value)
        }else{
          acc.push(value)
        }
      }
      return acc
    }, []))]
    let columnOptions: (SelectOption & {data:any[]})[] = []
    for(const value of uniqueValues){
      const label = resolveUser(value)?.name || value
      columnOptions.push({
        id: value,
        label: label,
        color: '',
        data: flatData.value.filter(row => {
          if(!row[kanbanGroupByColumn.value?.field || '']) {
            emptyColumns.data.push(row)
            return false
          }
          return row[kanbanGroupByColumn.value?.field || ''] === value
        })
      })
    }
    columns.value = columnOptions
    return
  }
}

// Get all rows for Kanban (no pagination, but apply filters/sorting)
const kanbanRows = computed(() => {
  const result = queryRows({ 
    search: searchQuery.value,
    filters: viewFilters.value,
    sort: viewSorting.value
  })
  return result
})

// Group rows by the groupBy field
const kanbanGroupedRows = computed(() => {
  const grouped: Record<string, Row[]> = {}
  
  // Initialize all columns with empty arrays
  for (const col of kanbanColumns.value) {
    grouped[col.id] = []
  }
  // Add uncategorized column
  grouped['__uncategorized__'] = []
  
  // Group rows
  for (const row of kanbanRows.value) {
    const value = row[kanbanGroupByField.value]
    if (value && grouped[value]) {
      grouped[value].push(row)
    } else {
      grouped['__uncategorized__'].push(row)
    }
  }
  
  return grouped
})

// Get first non-groupBy text column for card title
const kanbanTitleColumn = computed(() => {
  return props.table.columns.find(c => 
    c.type === 'text' && c.field !== kanbanGroupByField.value
  ) || props.table.columns[0]
})

// Get a few display columns for the card
const kanbanDisplayColumns = computed(() => {
  return props.table.columns
    .filter(c => 
      c.field !== kanbanGroupByField.value && 
      c.field !== kanbanTitleColumn.value?.field &&
      c.type !== 'attachment' &&
      c.type !== 'textarea'
    )
    .slice(0, 3)
})

// Handle card click
function handleKanbanCardClick(row: Row) {
  emit('openRecord', props.table.id, row.id)
}

// Handle drag start
const draggedCard = ref<Row | null>(null)

function handleDragStart(event: DragEvent, row: Row) {
  draggedCard.value = row
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', row.id)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(event: DragEvent, columnId: string) {
  event.preventDefault()
  if (!draggedCard.value) return
  
  // Update the row's groupBy field
  const newValue = columnId === '__uncategorized__' ? null : columnId
  updateRow(draggedCard.value.id, { [kanbanGroupByField.value]: newValue })
  
  draggedCard.value = null
}

function handleDragEnd() {
  draggedCard.value = null
}

// Formatters
function formatDate(value: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatNumber(value: number, decimals?: number): string {
  if (typeof value !== 'number') return String(value)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals || 0,
    maximumFractionDigits: decimals || 0
  })
}

function getSelectLabel(value: string, options?: SelectOption[]): string {
  if (!options) return value
  const option = options.find(o => o.id === value)
  return option?.label || value
}

// Get display value for a card field
function getCardFieldValue(row: Row, column: Column): string {
  const value = row[column.field]
  if (value === null || value === undefined) return '-'
  
  switch (column.type) {
    case 'user':
      const user = resolveUser(value)
      return user?.name || '-'
    case 'relation':
      if (!column.relationConfig) return '-'
      const display = resolveRelation(column.relationConfig.tableId, value, column.relationConfig.displayField)
      return Array.isArray(display) ? display.slice(0, 2).join(', ') : display
    case 'date':
      return formatDate(value)
    case 'number':
    case 'fx':
      return formatNumber(value, column.decimalPlaces)
    case 'single-select':
      return getSelectLabel(value, column.options)
    default:
      return String(value)
  }
}


</script>

<template>
  <div class="kanban-view">
    <!-- No groupBy field configured -->
    <div v-if="!kanbanGroupByColumn" class="kanban-error">
      <p>⚠️ Kanban view requires a "Group By" field to be configured.</p>
      <p class="hint">Edit this view and select a single-select field to group by.</p>
    </div>

    <!-- Kanban Board -->
    <div v-else class="kanban-board">
      <!-- Kanban Columns -->
      <div
        v-for="col in kanbanColumns"
        :key="col.id"
        class="kanban-column"
        @dragover="handleDragOver"
        @drop="handleDrop($event, col.id)"
      >
        <div class="kanban-column-header">
          <div
            class="column-color-dot"
            :style="{ backgroundColor: col.color }"
          />
          <span class="column-title">{{ col.label }}</span>
          <span class="column-count">{{ kanbanGroupedRows[col.id]?.length || 0 }}</span>
        </div>

        <div class="kanban-column-content">
          <div
            v-for="row in kanbanGroupedRows[col.id]"
            :key="row.id"
            class="kanban-card"
            draggable="true"
            @click="handleKanbanCardClick(row)"
            @dragstart="handleDragStart($event, row)"
            @dragend="handleDragEnd"
          >
            <div class="card-title">
              {{ row[kanbanTitleColumn?.field || ''] || 'Untitled' }}
            </div>
            <div class="card-fields">
              <div
                v-for="displayCol in kanbanDisplayColumns"
                :key="displayCol.id"
                class="card-field"
              >
                <span class="field-label">{{ displayCol.title }}:</span>
                <span class="field-value">
                  <template v-if="displayCol.type === 'user' && row[displayCol.field]">
                    <el-avatar :size="16" :src="resolveUser(row[displayCol.field])?.avatar" />
                    {{ resolveUser(row[displayCol.field])?.name }}
                  </template>
                  <template v-else>
                    {{ getCardFieldValue(row, displayCol) }}
                  </template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Uncategorized Column -->
      <div
        v-if="kanbanGroupedRows['__uncategorized__']?.length > 0"
        class="kanban-column uncategorized"
        @dragover="handleDragOver"
        @drop="handleDrop($event, '__uncategorized__')"
      >
        <div class="kanban-column-header">
          <span class="column-title">Uncategorized</span>
          <span class="column-count">{{ kanbanGroupedRows['__uncategorized__']?.length || 0 }}</span>
        </div>

        <div class="kanban-column-content">
          <div
            v-for="row in kanbanGroupedRows['__uncategorized__']"
            :key="row.id"
            class="kanban-card"
            draggable="true"
            @click="handleKanbanCardClick(row)"
            @dragstart="handleDragStart($event, row)"
            @dragend="handleDragEnd"
          >
            <div class="card-title">
              {{ row[kanbanTitleColumn?.field || ''] || 'Untitled' }}
            </div>
            <div class="card-fields">
              <div
                v-for="displayCol in kanbanDisplayColumns"
                :key="displayCol.id"
                class="card-field"
              >
                <span class="field-label">{{ displayCol.title }}:</span>
                <span class="field-value">{{ getCardFieldValue(row, displayCol) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.kanban-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.kanban-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  border: 1px solid var(--app-border-color);
  color: var(--app-text-color-secondary);

  p {
    margin: 0 0 var(--app-space-xs) 0;
  }

  .hint {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-placeholder);
  }
}

.kanban-board {
  flex: 1;
  display: flex;
  gap: var(--app-space-m);
  overflow-x: auto;
  padding-bottom: var(--app-space-s);
}

.kanban-column {
  flex: 0 0 300px;
  min-width: 300px;
  max-width: 300px;
  background: var(--app-fill-color-lighter);
  border-radius: var(--app-border-radius-m);
  display: flex;
  flex-direction: column;
  max-height: 100%;

  &.uncategorized {
    .kanban-column-header {
      background: var(--app-fill-color);
    }
  }
}

.kanban-column-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m) var(--app-border-radius-m) 0 0;
}

.column-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.column-title {
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-primary);
  flex: 1;
}

.column-count {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  background: var(--app-fill-color);
  padding: 2px 8px;
  border-radius: var(--app-border-radius-s);
}

.kanban-column-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.kanban-card {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  padding: var(--app-space-s);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: var(--app-primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.card-title {
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-primary);
  margin-bottom: var(--app-space-xs);
  line-height: 1.3;
}

.card-fields {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.card-field {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
}

.field-label {
  color: var(--app-text-color-placeholder);
  flex-shrink: 0;
}

.field-value {
  color: var(--app-text-color-secondary);
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

