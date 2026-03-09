<template>
  <MdFormItem v-bind="props">
    <template v-if="formData && column[fieldName]">
      <el-date-picker
        v-if="column.type === ColumnFieldType.CreatedTime"
        v-model="formData[column[fieldName]]"
        type="date"
        :format="displayFormat"
        disabled
        value-format="x"
        clearable
        style="width: 100%"
      />
      <ElInput
        v-else-if="column.type === ColumnFieldType.Formula"
        :model-value="formulaDisplayValue"
        type="text"
        disabled
        readonly
        :placeholder="formulaPlaceholder"
        :title="formulaTitle"
      />
      <ElInput v-else v-model="formData[column[fieldName]]" :disabled="true" clearable />
    </template>
  </MdFormItem>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { evalFormula } from '@packages/dp-mdTable/components/tools/formulaEditor/formulaHelper'

const props = defineProps<{
  formData: any
  column: any
  fieldName: string
}>()

const displayFormat = computed(() => {
  const properties = props.column.display_structure ?? {}
  console.log('props.column', props.column)
  if (properties.dateFormat) {
    return properties.dateFormat
  } else {
    return 'YYYY-MM-DD'
  }
})

/** Formula 列根据 returnType 格式化的显示值（空值显示为 '-'） */
const formulaDisplayValue = computed(() => {
  const formula = props.column?.display_structure?.formula ?? props.column?.display_structure?.expression ?? ''
  return evalFormula(formula, props.formData)
})

const formulaPlaceholder = '-'

/** 公式列 tooltip：说明不可编辑，若有公式表达式则一并展示 */
const formulaTitle = computed(() => {
  const formulaExpr = props.column?.display_structure?.formula ?? props.column?.display_structure?.expression ?? ''
  const base = '该单元格由公式计算，不可编辑。'
  if (formulaExpr) {
    return `${base} 公式：${formulaExpr}`
  }
  return base
})
</script>

<style lang="scss" scoped></style>
