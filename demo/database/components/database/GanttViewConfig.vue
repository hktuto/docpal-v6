<script lang="ts" setup>
import type { Column } from '../../types/database'

const props = defineProps<{
  columns: Column[]
  titleField: string
  startDateField: string
  endDateField: string
}>()

const emit = defineEmits<{
  'update:titleField': [value: string]
  'update:startDateField': [value: string]
  'update:endDateField': [value: string]
}>()

const dateColumns = computed(() => {
  return props.columns.filter(c => c.type === 'date')
})

const textColumns = computed(() => {
  return props.columns.filter(c => c.type === 'text' || c.type === 'textarea')
})

const titleValue = computed({
  get: () => props.titleField,
  set: (val) => emit('update:titleField', val)
})

const startDateValue = computed({
  get: () => props.startDateField,
  set: (val) => emit('update:startDateField', val)
})

const endDateValue = computed({
  get: () => props.endDateField,
  set: (val) => emit('update:endDateField', val)
})
</script>

<template>
  <el-form-item label="Title Field">
    <el-select
      v-model="titleValue"
      placeholder="Select title field"
      style="width: 100%"
    >
      <el-option
        v-for="col in textColumns"
        :key="col.id"
        :label="col.title"
        :value="col.field"
      />
    </el-select>
  </el-form-item>
  <el-form-item label="Start Date Field" required>
    <el-select
      v-model="startDateValue"
      placeholder="Select start date field"
      style="width: 100%"
    >
      <el-option
        v-for="col in dateColumns"
        :key="col.id"
        :label="col.title"
        :value="col.field"
      />
    </el-select>
  </el-form-item>
  <el-form-item label="End Date Field" required>
    <el-select
      v-model="endDateValue"
      placeholder="Select end date field"
      style="width: 100%"
    >
      <el-option
        v-for="col in dateColumns"
        :key="col.id"
        :label="col.title"
        :value="col.field"
      />
    </el-select>
  </el-form-item>
  <div v-if="dateColumns.length < 2" class="config-hint">
    Gantt view requires at least 2 date fields (start and end dates).
  </div>
</template>

<style lang="scss" scoped>
.config-hint {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-warning-color);
}
</style>

