<script lang="ts" setup>
const { id } = defineProps<{
  id: string
}>()
</script>

<template>
  <div class="pageContainer">
    <div class="pageHeader">
      <h1>Workspace Detail</h1>
      {{ id }}
    </div>
  </div>
</template>
