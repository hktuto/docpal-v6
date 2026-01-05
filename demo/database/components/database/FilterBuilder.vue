<script lang="ts" setup>
import type { Column, FilterCondition } from '../../types/database'
import { Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps<{
  columns: Column[]
  filters: FilterCondition[]
}>()

const emit = defineEmits<{
  add: [filter: FilterCondition]
  update: [index: number, filter: FilterCondition]
  remove: [index: number]
  clear: []
}>()

// Operator options based on column type
function getOperators(columnType: string): { value: string; label: string }[] {
  const textOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ]
  
  const numberOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less than or equal' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ]
  
  const selectOperators = [
    { value: 'equals', label: 'Is' },
    { value: 'in', label: 'Is any of' },
    { value: 'notIn', label: 'Is none of' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ]
  
  const booleanOperators = [
    { value: 'equals', label: 'Is' }
  ]
  
  switch (columnType) {
    case 'number':
    case 'rating':
      return numberOperators
    case 'single-select':
    case 'multi-select':
    case 'user':
    case 'relation':
      return selectOperators
    case 'checkbox':
    case 'switch':
      return booleanOperators
    case 'date':
      return numberOperators
    default:
      return textOperators
  }
}

// Check if operator needs a value input
function needsValue(operator: string): boolean {
  return !['isEmpty', 'isNotEmpty'].includes(operator)
}

// Get column by field name
function getColumnByField(field: string): Column | undefined {
  return props.columns.find(c => c.field === field)
}

// Handle field change
function handleFieldChange(index: number, field: string) {
  const column = getColumnByField(field)
  const operators = column ? getOperators(column.type) : []
  const firstOperator = operators[0]?.value || 'equals'
  
  emit('update', index, {
    field,
    operator: firstOperator as FilterCondition['operator'],
    value: ''
  })
}

// Handle operator change
function handleOperatorChange(index: number, operator: string) {
  const currentFilter = props.filters[index]
  emit('update', index, {
    ...currentFilter,
    operator: operator as FilterCondition['operator'],
    value: needsValue(operator) ? currentFilter.value : null
  })
}

// Handle value change
function handleValueChange(index: number, value: any) {
  const currentFilter = props.filters[index]
  emit('update', index, {
    ...currentFilter,
    value
  })
}

// Add new filter
function handleAddFilter() {
  const firstColumn = props.columns[0]
  if (!firstColumn) return
  
  const operators = getOperators(firstColumn.type)
  
  emit('add', {
    field: firstColumn.field,
    operator: operators[0]?.value as FilterCondition['operator'] || 'equals',
    value: ''
  })
}

// Remove filter
function handleRemoveFilter(index: number) {
  emit('remove', index)
}

// Clear all filters
function handleClearAll() {
  emit('clear')
}
</script>

<template>
  <div class="filter-builder">
    <div v-if="filters.length === 0" class="empty-state">
      <p>No filters applied</p>
    </div>
    
    <div v-else class="filter-list">
      <div
        v-for="(filter, index) in filters"
        :key="index"
        class="filter-row"
      >
        <!-- Field selector -->
        <el-select
          :model-value="filter.field"
          placeholder="Field"
          size="small"
          class="field-select"
          @update:model-value="(val) => handleFieldChange(index, val)"
        >
          <el-option
            v-for="col in columns"
            :key="col.field"
            :label="col.title"
            :value="col.field"
          />
        </el-select>
        
        <!-- Operator selector -->
        <el-select
          :model-value="filter.operator"
          placeholder="Operator"
          size="small"
          class="operator-select"
          @update:model-value="(val) => handleOperatorChange(index, val)"
        >
          <el-option
            v-for="op in getOperators(getColumnByField(filter.field)?.type || 'text')"
            :key="op.value"
            :label="op.label"
            :value="op.value"
          />
        </el-select>
        
        <!-- Value input (conditional) -->
        <template v-if="needsValue(filter.operator)">
          <!-- Select options for single-select columns -->
          <el-select
            v-if="getColumnByField(filter.field)?.type === 'single-select'"
            :model-value="filter.value"
            placeholder="Value"
            size="small"
            class="value-input"
            :multiple="filter.operator === 'in' || filter.operator === 'notIn'"
            @update:model-value="(val) => handleValueChange(index, val)"
          >
            <el-option
              v-for="opt in getColumnByField(filter.field)?.options || []"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>
          
          <!-- Boolean for checkbox/switch -->
          <el-select
            v-else-if="['checkbox', 'switch'].includes(getColumnByField(filter.field)?.type || '')"
            :model-value="filter.value"
            placeholder="Value"
            size="small"
            class="value-input"
            @update:model-value="(val) => handleValueChange(index, val)"
          >
            <el-option label="Yes" :value="true" />
            <el-option label="No" :value="false" />
          </el-select>
          
          <!-- Number input -->
          <el-input-number
            v-else-if="['number', 'rating'].includes(getColumnByField(filter.field)?.type || '')"
            :model-value="filter.value"
            placeholder="Value"
            size="small"
            class="value-input"
            controls-position="right"
            @update:model-value="(val) => handleValueChange(index, val)"
          />
          
          <!-- Date picker -->
          <el-date-picker
            v-else-if="getColumnByField(filter.field)?.type === 'date'"
            :model-value="filter.value"
            type="date"
            placeholder="Value"
            size="small"
            class="value-input"
            value-format="YYYY-MM-DD"
            @update:model-value="(val) => handleValueChange(index, val)"
          />
          
          <!-- Default text input -->
          <el-input
            v-else
            :model-value="filter.value"
            placeholder="Value"
            size="small"
            class="value-input"
            @update:model-value="(val) => handleValueChange(index, val)"
          />
        </template>
        
        <!-- Remove button -->
        <el-button
          :icon="Delete"
          text
          size="small"
          type="danger"
          @click="handleRemoveFilter(index)"
        />
      </div>
    </div>
    
    <div class="filter-footer">
      <el-button
        :icon="Plus"
        text
        size="small"
        type="primary"
        @click="handleAddFilter"
      >
        Add filter
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filter-builder {
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

.filter-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.field-select {
  width: 140px;
}

.operator-select {
  width: 140px;
}

.value-input {
  flex: 1;
  min-width: 100px;
}

.filter-footer {
  margin-top: var(--app-space-s);
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--app-border-color);
}
</style>

