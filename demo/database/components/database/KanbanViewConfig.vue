<script lang="ts" setup>
import type { Column } from '../../types/database'

const props = defineProps<{
  columns: Column[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
const columnTypeOptions = [
  "single-select",
  "relation",
  "user"
]
const selectColumns = computed(() => {
  return props.columns.filter(c => columnTypeOptions.includes(c.type))
})

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <el-form-item label="Group By Field" required>
    <el-select
      v-model="value"
      placeholder="Select a field to group by"
      style="width: 100%"
    >
      <el-option
        v-for="col in selectColumns"
        :key="col.id"
        :label="col.title"
        :value="col.field"
      />
    </el-select>
    <div v-if="selectColumns.length === 0" class="config-hint">
      No single-select fields available. Kanban requires a field with options to group by.
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

