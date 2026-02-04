<template>
  <MdFormItem v-bind="props">
    <ElCheckbox v-model="formData[column.field]" :placeholder="column.placeholder" clearable />
  </MdFormItem>
</template>
<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
}>()
</script>
<style lang="scss" scoped></style>
