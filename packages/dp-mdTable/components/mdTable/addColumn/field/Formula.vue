<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.formula')">
      <ToolsFormulaEditorFormulaInput
        :display-text="formulaDisplayText"
        :variables="variables"
        :placeholder="t('mdTable.formulaEditor.inputPlaceholder')"
        :readonly="true"
        @click="handleFormulaClick"
      />
    </el-form-item>
    <el-form-item :label="t('vxe.formDesign.alignTitle')">
      <el-select v-model="formData.align">
        <el-option :label="t('vxe.formDesign.alignLeft')" value="left" />
        <el-option :label="t('vxe.formDesign.alignCenter')" value="center" />
        <el-option :label="t('vxe.formDesign.alignRight')" value="right" />
      </el-select>
    </el-form-item>
    <ToolsFormulaEditorDialog v-model="dialogVisible" :formData="formData" @confirm="handleFormulaConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { formulaIdsToLabels } from '@packages/dp-mdTable/components/tools/formulaEditor/formulaTransform'

const props = defineProps<{
  formData: any
}>()
const { t } = useI18n()
const dialogVisible = ref(false)
const formulaDisplayText = ref('')
const mdTable = useMDTableInject()

const variables = computed(() => {
  return mdTable.columns.value.filter((column: any) => column?.business_type === ColumnFieldType.Number).map((column: any) => ({
    label: column.title,
    value: column.field
  }))
})

function updateFormulaDisplayText() {
  formulaDisplayText.value = formulaIdsToLabels(props.formData?.formula_expression || '', variables.value)
}

watch(
  () => props.formData?.formula_expression,
  () => {
    updateFormulaDisplayText()
  },
  { immediate: true }
)

watch(
  () => variables.value,
  () => {
    updateFormulaDisplayText()
  },
  { deep: true }
)

function handleFormulaClick() {
  dialogVisible.value = true
}
function handleFormulaConfirm(formula: string) {
  props.formData.formula_expression = formula
}
</script>
