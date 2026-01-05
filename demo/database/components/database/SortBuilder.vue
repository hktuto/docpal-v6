<script lang="ts" setup>
import type { Column, SortConfig } from '../../types/database'
import { Delete, Plus, SortUp, SortDown } from '@element-plus/icons-vue'

const props = defineProps<{
  columns: Column[]
  sorting: SortConfig[]
}>()

const emit = defineEmits<{
  add: [sort: SortConfig]
  update: [index: number, sort: SortConfig]
  remove: [index: number]
  clear: []
}>()

// Get available columns (not already used in sorting)
const availableColumns = computed(() => {
  const usedFields = props.sorting.map(s => s.field)
  return props.columns.filter(c => !usedFields.includes(c.field))
})

// Handle field change
function handleFieldChange(index: number, field: string) {
  const currentSort = props.sorting[index]
  emit('update', index, {
    field,
    order: currentSort.order
  })
}

// Handle order change
function handleOrderChange(index: number, order: 'asc' | 'desc') {
  const currentSort = props.sorting[index]
  emit('update', index, {
    ...currentSort,
    order
  })
}

// Toggle order
function handleToggleOrder(index: number) {
  const currentSort = props.sorting[index]
  const newOrder = currentSort.order === 'asc' ? 'desc' : 'asc'
  handleOrderChange(index, newOrder)
}

// Add new sort
function handleAddSort() {
  const firstAvailable = availableColumns.value[0]
  if (!firstAvailable) return
  
  emit('add', {
    field: firstAvailable.field,
    order: 'asc'
  })
}

// Remove sort
function handleRemoveSort(index: number) {
  emit('remove', index)
}

// Clear all sorts
function handleClearAll() {
  emit('clear')
}

// Get column title by field
function getColumnTitle(field: string): string {
  const col = props.columns.find(c => c.field === field)
  return col?.title || field
}
</script>

<template>
  <div class="sort-builder">
    <div v-if="sorting.length === 0" class="empty-state">
      <p>No sorting applied</p>
    </div>
    
    <div v-else class="sort-list">
      <div
        v-for="(sort, index) in sorting"
        :key="index"
        class="sort-row"
      >
        <span class="sort-index">{{ index + 1 }}.</span>
        
        <!-- Field selector -->
        <el-select
          :model-value="sort.field"
          placeholder="Field"
          size="small"
          class="field-select"
          @update:model-value="(val) => handleFieldChange(index, val)"
        >
          <!-- Current field -->
          <el-option
            :label="getColumnTitle(sort.field)"
            :value="sort.field"
          />
          <!-- Other available fields -->
          <el-option
            v-for="col in availableColumns"
            :key="col.field"
            :label="col.title"
            :value="col.field"
          />
        </el-select>
        
        <!-- Order toggle button -->
        <el-button-group class="order-toggle">
          <el-button
            size="small"
            :type="sort.order === 'asc' ? 'primary' : 'default'"
            @click="handleOrderChange(index, 'asc')"
          >
            <el-icon><SortUp /></el-icon>
            Asc
          </el-button>
          <el-button
            size="small"
            :type="sort.order === 'desc' ? 'primary' : 'default'"
            @click="handleOrderChange(index, 'desc')"
          >
            <el-icon><SortDown /></el-icon>
            Desc
          </el-button>
        </el-button-group>
        
        <!-- Remove button -->
        <el-button
          :icon="Delete"
          text
          size="small"
          type="danger"
          @click="handleRemoveSort(index)"
        />
      </div>
    </div>
    
    <div class="sort-footer">
      <el-button
        :icon="Plus"
        text
        size="small"
        type="primary"
        :disabled="availableColumns.length === 0"
        @click="handleAddSort"
      >
        Add sort
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sort-builder {
  // No padding - parent handles it
}

.empty-state {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
  
  p {
    margin: 0;
  }
}

.sort-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.sort-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.sort-index {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
  min-width: 20px;
}

.field-select {
  flex: 1;
  min-width: 140px;
}

.order-toggle {
  flex-shrink: 0;
}

.sort-footer {
  margin-top: var(--app-space-s);
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--app-border-color);
}
</style>

