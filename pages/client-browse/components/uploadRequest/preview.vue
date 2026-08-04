<script lang="ts" setup>
const props = defineProps<{
  previewFile: any
}>()
</script>

<template>
  <el-card class="right">
    <div class="flex-x-between">
      <div>{{ props.previewFile.name }}</div>
    </div>
    <Reader v-bind="props.previewFile" />
  </el-card>
</template>

<style scoped lang="scss">
.right {
  height: 100%;
}

.right :deep(.el-card__body) {
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  height: 100%;
}
</style>
