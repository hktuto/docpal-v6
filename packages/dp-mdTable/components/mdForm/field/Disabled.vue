<template>
  <MdFormItem v-bind="props">
    <ElInput v-if="formData && column.field" v-model="formData[column.field]" :disabled="true" :placeholder="column.placeholder" clearable />
  </MdFormItem>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
}>()
</script>

<style lang="scss" scoped></style>
