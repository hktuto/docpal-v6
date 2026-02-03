<template>
  <UiPopoverDialog ref="popoverRef"  @close="resetForm">
    <MdForm :form-data="data.formData" :mode="data.mode" />
  </UiPopoverDialog>
</template>

<script setup lang="ts">
const popoverRef = ref()

const data = ref({
  formData: {},
  mode: 'edit',
})
const resetForm = () => {
  console.log('resetForm')
}
const open = (row: any, mode: 'default' | 'edit' = 'default') => {
  data.value.formData = row
  data.value.mode = mode
  popoverRef.value.open()
}
const close = () => {
  popoverRef.value.close()
}
defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">

</style>
