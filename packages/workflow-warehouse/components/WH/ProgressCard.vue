<template>
  <div class="progress-card">
    <div class="progress-card-header">
      <h3 class="progress-card-title">{{ title || $t('workflowWarehouse.progress') }}</h3>
      <p class="progress-card-subtitle">
        {{ subtitle || $t('workflowWarehouse.verifiedProgress', { ok, all }) }}
      </p>
    </div>

    <el-progress v-if="showBar" :percentage="percentage" :show-text="false" :stroke-width="8" />
    <el-button
      class="progress-card-action"
      type="primary"
      :icon="Document"
      :loading="loading"
      :aria-label="actionText || $t('dpTool_approve')"
      :title="actionText || $t('dpTool_approve')"
      :disabled="disabled"
      @click="emit('approve')"
    >
      {{ actionText || $t('dpTool_approve') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    ok: number
    all: number
    loading?: boolean
    disabled?: boolean
    title?: string
    subtitle?: string
    actionText?: string
    showBar?: boolean
  }>(),
  {
    loading: false,
    disabled: false,
    title: '',
    subtitle: '',
    actionText: '',
    showBar: true,
  }
)

const emit = defineEmits<{
  approve: []
}>()

const percentage = computed(() => {
  if (!props.all) return 0
  return Math.round((props.ok / props.all) * 100)
})
</script>

<style scoped lang="scss">
.progress-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.progress-card-header {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.progress-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.progress-card-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}

.progress-card-action {
  width: 100%;
}
</style>
