<script lang="ts" setup>
import type { Column, RollupAggregation, Database, Table } from '../../types/database'
import { getAggregationLabel } from '../../utils/rollupCalculator'

const props = defineProps<{
  columns: Column[]
  database: Database
  modelValue: {
    relationField: string
    aggregateField: string
    aggregation: RollupAggregation
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
}>()

// Local state
const config = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Get relation columns
const relationColumns = computed(() => {
  return props.columns.filter(c => c.type === 'relation' && c.relationConfig)
})

// Get selected relation column
const selectedRelationColumn = computed(() => {
  return props.columns.find(c => c.field === config.value.relationField || c.id === config.value.relationField)
})

// Get columns from the related table (for aggregate field selection)
const relatedTableColumns = computed(() => {
  if (!selectedRelationColumn.value?.relationConfig) return []
  
  const relatedTableId = selectedRelationColumn.value.relationConfig.tableId
  const relatedTable = props.database.tables.find(t => t.id === relatedTableId)
  
  if (!relatedTable) return []
  
  // Filter to show only aggregatable fields (number, date)
  return relatedTable.columns.filter(c => {
    // For count/count-unique, all fields are valid
    if (config.value.aggregation === 'count' || config.value.aggregation === 'count-unique') {
      return c.type !== 'attachment' && c.type !== 'relation'
    }
    // For date aggregations, show only date fields
    if (config.value.aggregation === 'earliest' || config.value.aggregation === 'latest') {
      return c.type === 'date'
    }
    // For numeric aggregations, show only number fields
    return c.type === 'number' || c.type === 'fx' || c.type === 'rollup'
  })
})

// Aggregation options
const aggregationOptions: { value: RollupAggregation; label: string; description: string; dataTypes: string[] }[] = [
  { value: 'count', label: 'Count', description: 'Count all related records', dataTypes: ['all'] },
  { value: 'count-unique', label: 'Count Unique', description: 'Count unique values', dataTypes: ['all'] },
  { value: 'sum', label: 'Sum', description: 'Sum of all values', dataTypes: ['number'] },
  { value: 'avg', label: 'Average', description: 'Average of all values', dataTypes: ['number'] },
  { value: 'min', label: 'Minimum', description: 'Smallest value', dataTypes: ['number'] },
  { value: 'max', label: 'Maximum', description: 'Largest value', dataTypes: ['number'] },
  { value: 'median', label: 'Median', description: 'Middle value', dataTypes: ['number'] },
  { value: 'range', label: 'Range', description: 'Difference between max and min', dataTypes: ['number'] },
  { value: 'earliest', label: 'Earliest', description: 'Earliest date', dataTypes: ['date'] },
  { value: 'latest', label: 'Latest', description: 'Latest date', dataTypes: ['date'] }
]

// Update relation field
function handleRelationFieldChange(value: string) {
  config.value = {
    ...config.value,
    relationField: value,
    aggregateField: '', // Reset aggregate field when relation changes
  }
}

// Update aggregate field
function handleAggregateFieldChange(value: string) {
  config.value = {
    ...config.value,
    aggregateField: value
  }
}

// Update aggregation
function handleAggregationChange(value: RollupAggregation) {
  // Reset aggregate field if it's no longer valid for the new aggregation type
  const currentField = config.value.aggregateField
  const newConfig = {
    ...config.value,
    aggregation: value
  }
  
  // Check if current field is still valid
  if (currentField && selectedRelationColumn.value?.relationConfig) {
    const relatedTableId = selectedRelationColumn.value.relationConfig.tableId
    const relatedTable = props.database.tables.find(t => t.id === relatedTableId)
    
    if (relatedTable) {
      const currentColumn = relatedTable.columns.find(c => c.field === currentField)
      
      if (currentColumn) {
        // Check if field is valid for new aggregation type
        const isValid = isFieldValidForAggregation(currentColumn, value)
        if (!isValid) {
          newConfig.aggregateField = '' // Reset if not valid
        }
      }
    }
  }
  
  config.value = newConfig
}

// Helper to check if a field is valid for an aggregation type
function isFieldValidForAggregation(column: Column, aggregation: RollupAggregation): boolean {
  // Count/count-unique works with any field
  if (aggregation === 'count' || aggregation === 'count-unique') {
    return column.type !== 'attachment' && column.type !== 'relation'
  }
  // Date aggregations need date fields
  if (aggregation === 'earliest' || aggregation === 'latest') {
    return column.type === 'date'
  }
  // Numeric aggregations need number fields
  return column.type === 'number' || column.type === 'fx' || column.type === 'rollup'
}
</script>

<template>
  <div class="rollup-column-config">
    <el-form-item label="Relation Field" required>
      <el-select
        :model-value="config.relationField"
        placeholder="Select a relation field"
        style="width: 100%"
        @change="handleRelationFieldChange"
      >
        <el-option
          v-for="col in relationColumns"
          :key="col.id"
          :label="col.title"
          :value="col.field"
        />
      </el-select>
      <div class="field-hint">
        Select which relation field contains the records to aggregate
      </div>
    </el-form-item>

    <el-form-item label="Aggregate Field" required>
      <el-select
        :model-value="config.aggregateField"
        placeholder="Select a field to aggregate"
        style="width: 100%"
        :disabled="!config.relationField"
        @change="handleAggregateFieldChange"
      >
        <el-option
          v-for="col in relatedTableColumns"
          :key="col.id"
          :label="`${col.title} (${col.type})`"
          :value="col.field"
        />
      </el-select>
      <div class="field-hint">
        <template v-if="config.relationField">
          Select the field from related records to aggregate
          <span v-if="relatedTableColumns.length === 0" style="color: var(--app-warning-color)">
            (No aggregatable fields available for current aggregation type)
          </span>
        </template>
        <template v-else>
          Select a relation field first
        </template>
      </div>
    </el-form-item>

    <el-form-item label="Aggregation Function" required>
      <el-select
        :model-value="config.aggregation"
        placeholder="Select aggregation function"
        style="width: 100%"
        @change="handleAggregationChange"
      >
        <el-option
          v-for="option in aggregationOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        >
          <div class="aggregation-option">
            <div class="option-label">{{ option.label }}</div>
            <div class="option-description">{{ option.description }}</div>
          </div>
        </el-option>
      </el-select>
      <div class="field-hint">
        Choose how to aggregate the values from related records
      </div>
    </el-form-item>

    <div class="config-preview">
      <div class="preview-label">Preview:</div>
      <div class="preview-text">
        <template v-if="config.relationField && config.aggregateField && config.aggregation">
          {{ getAggregationLabel(config.aggregation) }} of 
          <strong>{{ relatedTableColumns.find(c => c.field === config.aggregateField)?.title || config.aggregateField }}</strong> 
          from related records in 
          <strong>{{ selectedRelationColumn?.title || config.relationField }}</strong>
        </template>
        <span v-else class="preview-placeholder">
          Configure all fields to see preview
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rollup-column-config {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.field-hint {
  margin-top: var(--app-space-xxs);
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
}

.aggregation-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-weight: 500;
  color: var(--app-text-color-primary);
}

.option-description {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
}

.config-preview {
  padding: var(--app-space-m);
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-s);
  border: 1px solid var(--app-border-color);
}

.preview-label {
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  color: var(--app-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--app-space-xs);
}

.preview-text {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-primary);
  line-height: 1.5;

  strong {
    color: var(--app-primary-color);
    font-weight: 600;
  }
}

.preview-placeholder {
  color: var(--app-text-color-placeholder);
  font-style: italic;
}
</style>

