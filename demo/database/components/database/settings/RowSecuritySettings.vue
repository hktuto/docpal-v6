<script lang="ts" setup>
import type { Database, Table } from '../../../types/database'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

// Placeholder for row-level security
// Will be implemented when needed
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">Row-Level Security</h2>
      <p class="section-description">
        Define conditions to control which records specific users can see
      </p>
    </div>

    <div class="section-content">
      <div class="coming-soon">
        <el-icon :size="48"><Lock /></el-icon>
        <h3>Row-Level Security</h3>
        <p>Configure fine-grained access control to filter which records users can see based on custom conditions.</p>
        <el-tag type="info">Coming Soon</el-tag>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 900px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.section-title {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-xxl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
}

.section-content {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xxl);
  text-align: center;
  gap: var(--app-space-m);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-xl);
    color: var(--app-text-color-primary);
  }

  p {
    margin: 0;
    max-width: 500px;
    color: var(--app-text-color-secondary);
    line-height: 1.6;
  }

  .el-icon {
    color: var(--app-text-color-placeholder);
  }
}
</style>

