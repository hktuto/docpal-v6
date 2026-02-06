<template>
  <MdFormItem v-bind="props">
    <el-rate
      v-if="formData && column?.field"
      v-model="formData[column.field]"
      :max="properties.maxRating"
      :allow-half="properties.allowHalf"
      :clearable="properties.allowClear"
    />
  </MdFormItem>
</template>

<script setup lang="ts">
import type { RatingConfig } from '@packages/dp-mdTable/types/column-types'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

const props = defineProps<{
  formData: any
  column: any
}>()

/** 评分列配置（column.properties），与 RatingConfig 一致，最大值等 */
const properties = computed((): RatingConfig => {
  const p = props.column?.properties ?? {}
  const maxRating = typeof Number(p.max) === 'number' && Number(p.max) > 0 ? Number(p.max) : 5
  return {
    maxRating,
    allowHalf: !!p.allowHalf,
    allowClear: p.allowClear !== false
  }
})
</script>

<style lang="scss" scoped>
.el-rate {
  height: auto;
}
</style>
