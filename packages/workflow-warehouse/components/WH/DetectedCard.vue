<template>
  <div class="detected-card">
    <div class="detected-card-header">
      <div class="detected-card-header-text">
        <h3 class="detected-card-title">{{ title || $t('workflowWarehouse.detectedIssues') }}</h3>
        <p class="detected-card-subtitle">{{ subtitle || $t('workflowWarehouse.detectedIssuesSubtitle') }}</p>
      </div>
    </div>

    <div v-if="!issues.length" class="detected-card-status">
      <el-icon class="detected-card-status-icon" aria-hidden="true">
        <CircleCheckFilled />
      </el-icon>
      <span>{{ emptyText || $t('workflowWarehouse.noAutomaticIssues') }}</span>
    </div>
    <div v-else class="detected-issue-list">
      <slot :issues="issues" />
    </div>
    <el-button
      v-if="!hideAction"
      style="width: 100%"
      type="primary"
      :loading="detecting"
      tabindex="0"
      :aria-label="actionText || $t('workflowWarehouse.reDetect')"
      @click="emit('detect')"
      @keydown.enter="emit('detect')"
    >
      {{ actionText || $t('workflowWarehouse.reDetect') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    issues?: any[]
    detecting?: boolean
    title?: string
    subtitle?: string
    emptyText?: string
    actionText?: string
    hideAction?: boolean
  }>(),
  {
    issues: () => [],
    detecting: false,
    title: '',
    subtitle: '',
    emptyText: '',
    actionText: '',
    hideAction: false
  }
)

const emit = defineEmits<{
  detect: []
}>()
</script>

<style scoped lang="scss">
.detected-card {
  max-height: 30vh;
  overflow-y: auto;
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.detected-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}

.detected-card-header-text {
  min-width: 0;
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
  margin-bottom: var(--app-space-m);
}

.detected-card-status-icon {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: var(--el-color-primary);
}

.detected-issue-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}
</style>
