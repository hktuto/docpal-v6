<template>
  <div class="db-widget-empty-state">
    <el-empty :description="description || 'No data available'" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description?: string
}>()
</script>

<style scoped lang="scss">
.db-widget-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}
</style>
