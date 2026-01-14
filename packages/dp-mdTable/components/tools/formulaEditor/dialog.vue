<template>
  <el-dialog v-model="dialogVisible" title="配置公式" width="900px" :close-on-click-modal="false" @close="handleClose">
    <div class="formula-dialog"></div>
    <ToolsFormulaEditor v-model="formulaText" ref="formulaEditorRef" :variables="variables" />
    <template #footer>
      <div class="dialog-footer">
        <div class="help-link">
          <a href="https://www.google.com" target="_blank">学习更多公式使用技巧</a>
        </div>
        <div>
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
interface Props {
  modelValue: boolean
  formData: any
}
const mdTable = useMDTableInject()
const columns = mdTable.columns
const variables = computed(() =>
  columns.value.map((column: any) => ({
    label: column.title,
    value: column.field
  }))
)
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
    ElMessage.error('公式格式不正确')
  }
}

function handleClose() {
  dialogVisible.value = false
}
watch(() => dialogVisible.value, (newVal) => {
  if (newVal) {
    formulaText.value = props.formData.formula
  }
})
</script>

<style scoped lang="scss"></style>
