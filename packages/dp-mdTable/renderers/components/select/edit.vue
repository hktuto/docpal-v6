<script setup lang="ts">
import type { Ref } from 'vue'

const props = defineProps<{
  /** 选项列表，支持数组或 Ref（如 User 列异步加载） */
  options: { id: any; label: string; color?: string }[] | Ref<{ id: any; label: string; color?: string }[]>
  collapseTags: boolean
  filterable: boolean
  clearable: boolean
  multiple: boolean
  modelValue: any
  popperClass?: string
  mode?: 'noTag'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

/** 统一为数组，支持 options 为 Ref 时解包 */
const optionsList = computed(() => {
  const o = props.options
  return Array.isArray(o) ? o : (o && typeof o === 'object' && 'value' in o ? (o as Ref<any[]>).value ?? [] : [])
})

function getOption(id: any) {
  return optionsList.value.find((option: any) => option.id === id)
}

const selectedOption = computed(() => {
  return optionsList.value.find((option: any) => option.id === props.modelValue)
})

const handleChange = (value: any) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <ElSelect :class="['vxe-cell-absolute', 'mdTable-input-radius', multiple ? 'mdTable-multiSelect-edit' : 'mdTable-height-edit']" v-bind="props" @change="handleChange">
    <ElOption v-for="option in optionsList" :key="option.id" :label="option.label" :value="option.id">
      <span v-if="mode !== 'noTag'" class="table-tag round" :style="{ '--color': option.color }"></span> <span class="table-tag-label">{{ option.label }}</span>
    </ElOption>
    <template v-if="mode !== 'noTag'" #tag>
      <div class="table-tag-container">
        <div v-for="id in modelValue" :key="id" class="table-tag" :style="{ '--color': getOption(id)?.color }">{{ getOption(id)?.label }}</div>
      </div>
    </template>
    <template v-if="mode !== 'noTag'" #label>
      <span class="table-tag round" :style="{ '--color': selectedOption?.color }"></span> <span class="table-tag-label">{{ selectedOption?.label }}</span>
    </template>
  </ElSelect>
</template>

<style scoped>
.table-tag-container {
  .table-tag {
    margin-bottom: var(--app-space-xs);
  }
}
</style>
