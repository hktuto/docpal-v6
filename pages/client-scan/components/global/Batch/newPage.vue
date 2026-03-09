<script lang="ts" setup>
const props = defineProps<{
  projectId: string
}>()

const steps = ref<'classification' | 'split' | 'form'>('classification')
</script>

<template>
  <div>
    {{ projectId }}
  </div>
</template>
