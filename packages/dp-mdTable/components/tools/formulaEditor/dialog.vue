<template>
  <el-dialog
    class="scroll-dialog"
    v-model="dialogVisible"
    :title="t('mdTable.formulaEditor.dialogTitle')"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="formula-dialog"></div>
    <ToolsFormulaEditor v-model="formulaText" ref="formulaEditorRef" :variables="variables" />
    <template #footer>
      <div class="dialog-footer">
        <!-- <div class="help-link">
          <a href="https://www.google.com" target="_blank">{{ t('mdTable.formulaEditor.learnMore') }}</a>
        </div> -->
        <div>
          <el-button @click="handleClose">{{ t('dpButtom_cancel') }}</el-button>
          <el-button type="primary" @click="handleConfirm">{{ t('dpButtom_confirm') }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const { t } = useI18n()
interface Props {
  modelValue: boolean
  formData: any
}
const mdTable = useMDTableInject()
const columns = mdTable.columns
const variables = computed(() => {
  return columns.value.filter((v: any) => v?.business_type === ColumnFieldType.Number).map((column: any) => ({
    label: column.title,
    value: column.field
  }))
})
const formulaText = ref('')
const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [formula: string]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formulaEditorRef = ref()
function handleConfirm() {
  if (formulaEditorRef.value.checkFormulaValid()) {
    emit('confirm', formulaText.value)
    handleClose()
  } else {
    ElMessage.error(t('mdTable.formulaEditor.invalidFormula'))
  }
}

function handleClose() {
  dialogVisible.value = false
}
watch(
  () => dialogVisible.value,
  (newVal) => {
    if (newVal) {
      formulaText.value = props.formData.formula_expression
    }
  }
)
</script>

<style scoped lang="scss"></style>
