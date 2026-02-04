<template>
  <el-dialog v-model="visible" class="scroll-dialog" ref="popoverRef"  @close="resetForm">
    <MdForm ref="formRef" :form-data="data.formData" :mode="data.mode" />
    <template #footer>
      <div class="form-actions">
        <el-button @click="handleCancel">{{ $t('cancelText') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const popoverRef = ref()
const visible = ref(false)
const data = ref({
  formData: {},
  mode: 'edit',
})
const resetForm = () => {
  console.log('resetForm')
}
function handleCancel() {
  visible.value = false
}
const formRef = ref()
function handleSubmit() {
  const formData = formRef.value.getFormData()
  console.log('formData', formData)
}
const open = (row: any, mode: 'default' | 'edit' = 'default') => {
  data.value.formData = row
  data.value.mode = mode
  visible.value = true
}
const close = () => {
  visible.value = false
}
defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">

</style>
