<template>
  <MdFormItem v-bind="props" :rules="rules">
    <el-input-number
      v-if="formData && column?.[fieldName]"
      v-model="formData[column[fieldName]]"
      :placeholder="column.placeholder"
      clearable
      :step="1"
      align="left"
      :disabled="disabled"
      controls-position="right"
    >
      <template v-if="properties.symbol && properties.symbolAlign === 'right'" #suffix>
        <span>{{ properties.symbol }}</span>
      </template>
      <template v-if="properties.symbol && properties.symbolAlign !== 'right'" #prefix>
        <span>{{ properties.symbol }}</span>
      </template>
    </el-input-number>
  </MdFormItem>
</template>

<script setup lang="ts">
import type { NumberConfig } from '@packages/dp-mdTable/types/column-types'

const props = defineProps<{
  formData: any
  column: any
  fieldName: string
  disabled: boolean
}>()

const modelField = computed(() => props.column?.[props.fieldName])
// 确保传出去的是数字类型
watchEffect(() => {
  if (!props.formData || !modelField.value) {
    return
  }

  const currentValue = props.formData[modelField.value]
  if (typeof currentValue === 'string') {
    const n = Number(currentValue.trim())
    props.formData[modelField.value] = Number.isFinite(n) ? n : undefined
  }
})

/** 数字列配置（columnProperties），与 NumberConfig 一致 */
const properties = computed((): NumberConfig => {
  const p = props.column?.display_structure ?? {}

  return {
    symbol: p.symbol ?? '',
    precision: typeof p.precision === 'number' ? p.precision : 0,
    symbolAlign: p.symbolAlign ?? 'right',
    showThouComma: p.showThouComma ?? true
  }
})

</script>

<style lang="scss" scoped>
.el-input-number {
  width: 100%;
}
</style>
