<template>
  <div class="detected-card">
    <div class="detected-card-header">
      <h3 class="detected-card-title">Detected Issues</h3>
      <p class="detected-card-subtitle">Issues detected by the rules engine</p>
    </div>

    <div class="detected-card-status">
      <el-icon class="detected-card-status-icon" aria-hidden="true">
        <CircleCheckFilled />
      </el-icon>
      <span>No automatic issues.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.detected-card {
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.detected-card-header {
  margin-bottom: var(--app-space-m);
}

.detected-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.detected-card-subtitle {
  margin: var(--app-space-xxs) 0 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}

.detected-card-status {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: 0.875rem;
  color: var(--el-text-color-regular);
}

.detected-card-status-icon {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: var(--el-color-primary);
}
</style>
