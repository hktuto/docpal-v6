<script lang="ts" setup>
import type { Column, Row } from '../../types/database'
import { useDatabase, useTable } from '../../composables/useDatabase'

const props = defineProps<{
  databaseId: string
  tableId: string
  column: Column
  rowId: string
  modelValue: string | string[] | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const visible = ref(false)
const searchQuery = ref('')

const { getDatabaseById } = useDatabase()

// Get the related table's data
const relatedTable = computed(() => {
  if (!props.column.relationConfig?.tableId) return null
  const db = getDatabaseById(props.databaseId)
  return db?.tables.find(t => t.id === props.column.relationConfig?.tableId)
})

// Get related table composable for rows
const relatedTableData = computed(() => {
  if (!relatedTable.value) return { rows: [] }
  return useTable(props.databaseId, relatedTable.value.id)
})

// Current linked record IDs
const linkedIds = computed(() => {
  if (!props.modelValue) return []
  if (Array.isArray(props.modelValue)) return props.modelValue
  return [props.modelValue]
})

// Available records (excluding already linked ones for multi-select)
const availableRecords = computed(() => {
  const rows = relatedTableData.value.getRows() || []
  const displayField = props.column.relationConfig?.displayField || 'id'
  
  return rows
    .filter(row => {
      // Search filter
      if (searchQuery.value) {
        const value = String(row[displayField] || '').toLowerCase()
        if (!value.includes(searchQuery.value.toLowerCase())) {
          return false
        }
      }
      return true
    })
    .map(row => ({
      id: row.id,
      label: row[displayField] || row.id,
      isLinked: linkedIds.value.includes(row.id)
    }))
})

// Get display label for a row ID
function getDisplayLabel(rowId: string): string {
  const rows = relatedTableData.value.getRows() || []
  const row = rows.find(r => r.id === rowId)
  if (!row) return rowId
  return row[props.column.relationConfig?.displayField || 'id'] || rowId
}

// Toggle link for a record
function toggleLink(recordId: string) {
  const isMultiple = props.column.relationConfig?.multiple
  
  if (isMultiple) {
    const currentLinks = [...linkedIds.value]
    const index = currentLinks.indexOf(recordId)
    if (index >= 0) {
      currentLinks.splice(index, 1)
    } else {
      currentLinks.push(recordId)
    }
    emit('update:modelValue', currentLinks)
  } else {
    // Single select - toggle or set
    if (linkedIds.value.includes(recordId)) {
      emit('update:modelValue', '')
    } else {
      emit('update:modelValue', recordId)
      visible.value = false
    }
  }
}

// Unlink a record directly (from tag)
function unlinkRecord(recordId: string, event: Event) {
  event.stopPropagation()
  const isMultiple = props.column.relationConfig?.multiple
  
  if (isMultiple) {
    const currentLinks = linkedIds.value.filter(id => id !== recordId)
    emit('update:modelValue', currentLinks)
  } else {
    emit('update:modelValue', '')
  }
}
</script>

<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="300"
    trigger="click"
    @show="searchQuery = ''"
  >
    <template #reference>
      <div class="relation-display" @click="visible = true">
        <template v-if="linkedIds.length > 0">
          <el-tag
            v-for="id in linkedIds"
            :key="id"
            size="small"
            closable
            class="relation-tag"
            @close="unlinkRecord(id, $event)"
          >
            {{ getDisplayLabel(id) }}
          </el-tag>
        </template>
        <span v-else class="placeholder">Click to link...</span>
        <span class="add-more" v-if="linkedIds.length > 0 && column.relationConfig?.multiple">
          +
        </span>
      </div>
    </template>

    <div class="relation-linker-popover">
      <el-input
        v-model="searchQuery"
        placeholder="Search records..."
        size="small"
        clearable
        class="search-input"
      >
        <template #prefix>
          <span>🔍</span>
        </template>
      </el-input>

      <div class="records-list">
        <div v-if="availableRecords.length === 0" class="no-records">
          No records found
        </div>
        <div
          v-for="record in availableRecords"
          :key="record.id"
          class="record-item"
          :class="{ linked: record.isLinked }"
          @click="toggleLink(record.id)"
        >
          <el-checkbox
            v-if="column.relationConfig?.multiple"
            :model-value="record.isLinked"
            @click.stop
            @change="toggleLink(record.id)"
          />
          <span class="record-label">{{ record.label }}</span>
          <span v-if="record.isLinked && !column.relationConfig?.multiple" class="check-mark">
            ✓
          </span>
        </div>
      </div>

      <div class="footer-info" v-if="relatedTable">
        <span class="table-info">
          From: {{ relatedTable.name }}
        </span>
      </div>
    </div>
  </el-popover>
</template>

<style lang="scss" scoped>
.relation-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 4px 8px;
  min-height: 32px;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: border-color 0.2s;
  
  &:hover {
    border-color: var(--el-border-color);
    background: var(--app-grey-100);
  }
  
  .placeholder {
    color: var(--app-text-color-placeholder);
    font-size: var(--app-font-size-s);
  }
  
  .add-more {
    color: var(--el-color-primary);
    font-weight: bold;
    cursor: pointer;
  }
}

.relation-tag {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.relation-linker-popover {
  .search-input {
    margin-bottom: 8px;
  }
  
  .records-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }
  
  .no-records {
    padding: 16px;
    text-align: center;
    color: var(--app-text-color-placeholder);
  }
  
  .record-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: var(--app-grey-100);
    }
    
    &.linked {
      background: var(--el-color-primary-light-9);
    }
    
    .record-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .check-mark {
      color: var(--el-color-primary);
      font-weight: bold;
    }
  }
  
  .footer-info {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-light);
    
    .table-info {
      font-size: var(--app-font-size-xs);
      color: var(--app-text-color-secondary);
    }
  }
}
</style>

