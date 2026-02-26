<template>
  <el-dialog v-model="visible" class="scroll-dialog" @close="resetForm">
    <template v-if="mode === 'edit'" #header>
      <div class="el-dialog__title mdForm-title">
        {{ $t('common_edit') }}
        <div>
          <el-icon :class="disabledUp ? 'cursor-not-allowed' : 'cursor-pointer'" :disabled="disabledUp" @click="handleMove('up')"><Top /></el-icon>
          <el-icon :class="disabledDown ? 'cursor-not-allowed' : 'cursor-pointer'" :disabled="disabledDown" @click="handleMove('down')"><Bottom /></el-icon>
        </div>
      </div>
    </template>
    <MdForm ref="formRef" :form-data="formData" :mode="mode" />
    <template #footer>
      <div class="form-actions">
        <el-button @click="handleCancel">{{ $t('cancelText') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Top, Bottom } from '@element-plus/icons-vue'
const visible = ref(false)
const formData = ref<any>({})
const mode = ref('edit')
const props = defineProps<{
  /** 上/下移动回调，返回新 formData 则更新表单 */
  onMove?: (direction: 'up' | 'down') => { formData?: any } | void
}>()
const emits = defineEmits(['submit'])
const { currentRow, setCurrentRow, moveCurrentRow, disabledUp, disabledDown } = useCurrentRow()
const resetForm = () => {
  console.log('resetForm')
}
function handleCancel() {
  visible.value = false
}
const formRef = ref()
async function handleSubmit() {
  const formData = await formRef.value.getFormData()
  if (!formData) return
  visible.value = false
  console.log('formData', formData)
  emits('submit', formData)
}
const open = (row: any, _mode: 'default' | 'edit' = 'default') => {
  formData.value = row
  mode.value = _mode
  visible.value = true
  setCurrentRow(row)
}
function handleMove(direction: 'up' | 'down') {
  console.log('handleMove', direction)
  console.log('result', formData)
  moveCurrentRow(direction)
  formData.value = { ...currentRow.value }
  console.log('formData', formData.value)
  // const result = props.onMove?.(direction)
  // if (result?.formData != null) {
  //   formData.value = result.formData
  // }
}
const close = () => {
  visible.value = false
}
defineExpose({ open, close })
</script>

<style scoped lang="scss">
.mdForm-title {
  display: flex;
  justify-content: space-between;
}
.cursor-not-allowed {
  cursor: not-allowed;
  color: var(--app-grey-400);
}
</style>
