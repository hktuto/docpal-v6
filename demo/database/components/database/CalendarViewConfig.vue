<script lang="ts" setup>
import type { Column } from '../../types/database'

const props = defineProps<{
  columns: Column[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const dateColumns = computed(() => {
  return props.columns.filter(c => c.type === 'date')
})

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <el-form-item label="Date Field" required>
    <el-select
      v-model="value"
      placeholder="Select date field"
      style="width: 100%"
    >
      <el-option
        v-for="col in dateColumns"
        :key="col.id"
        :label="col.title"
        :value="col.field"
      />
    </el-select>
    <div v-if="dateColumns.length === 0" class="config-hint">
      No date fields available. Calendar requires a date field.
    </div>
  </el-form-item>
</template>

<style lang="scss" scoped>
.config-hint {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-warning-color);
}
</style>

