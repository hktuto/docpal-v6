<template>
  <ElFormItem v-if="column && column.field" :prop="column.field" :required="column.required" :rules="rules">
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
  rules: any[]
}>()
</script>
