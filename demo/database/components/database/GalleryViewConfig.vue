<script lang="ts" setup>
import type { Column } from '../../types/database'

const props = defineProps<{
  columns: Column[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textColumns = computed(() => {
  return props.columns.filter(c => c.type === 'text' || c.type === 'textarea')
})

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <el-form-item label="Title Field">
    <el-select
      v-model="value"
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
</template>

