<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const temporary_list = ref<any[]>([])
const formWidgetProformaInvoicePreloadTable = ref()

function init() {
  temporary_list.value = formData.order_item_list || []

  nextTick(() => {
    formWidgetProformaInvoicePreloadTable.value.reload()
  })
}

function getFormData() {
  return {}
}

watch(
  () => formData.order_item_list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <FormWidgetProformaInvoicePreloadTable ref="formWidgetProformaInvoicePreloadTable" :disabled="true" :temporary_list="temporary_list" />
</template>

<style scoped lang="scss"></style>
