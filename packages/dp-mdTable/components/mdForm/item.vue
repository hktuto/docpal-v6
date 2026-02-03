<template>
  <ElFormItem :prop="column.field" :required="column.required">
    <template #label>
      <span>{{ column.title }} </span>
    </template>
    <slot />
  </ElFormItem>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
}>()
</script>
