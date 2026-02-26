<template>
  <MdFormItem v-bind="props" :rules="rules">
    <el-input-number
      v-if="formData && column?.field"
      v-model="formData[column.field]"
      :placeholder="column.placeholder"
      clearable
      :precision="properties.precision"
      :step="1"
      align="left"
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
}>()

/** 数字列配置（columnProperties），与 NumberConfig 一致 */
const properties = computed((): NumberConfig => {
  const p = props.column?.properties ?? {}

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
