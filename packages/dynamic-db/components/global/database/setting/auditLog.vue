<script setup lang="ts">
const props = defineProps<{
  masterTableId: string
}>()
</script>

<template>
  <div class="audit-log-root">
    <div class="audit-log-header">
      <h4>Audit Log</h4>
    </div>
    <el-empty description="Audit log content will be added here" />
  </div>
</template>

<style lang="scss" scoped>
.audit-log-root {
  height: 100%;
}

.audit-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-m);

  h4 {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}
</style>
