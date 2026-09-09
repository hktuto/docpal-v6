<script setup lang="ts">
import WHShippingConfirmDetailCard from './detailCard.vue'
import WHShippingConfirmDetectedCard from './detectedCard.vue'
import { useShippingConfirmProvider } from '../../composables/useShippingConfirm'

const props = defineProps(['formData', 'taskDetail', 'disabled', 'workflowVariables'])
const isCollapsible = ref(true)
const {
  disabled,
  displayPiNum,
  loading,
  outRequestNo,
  previewDocId,
  previewFileName,
  refreshing,
  requestStatus,
  saveManualEdit,
  saving,
  summary,
  validateForSubmit,
  buildSubmitPayload,
  refreshResult
} = useShippingConfirmProvider(props)

const { t } = useI18n()

const statusTagType = computed(() => {
  if (loading.value) return 'info'
  if (requestStatus.value === 'completed') return 'success'
  if (requestStatus.value === 'polling' || requestStatus.value === 'submitted') return 'warning'
  return 'info'
})

const statusLabel = computed(() => {
  if (requestStatus.value === 'completed') return t('workflowWarehouse.shippingConfirmStatusCompleted')
  if (requestStatus.value === 'polling') return t('workflowWarehouse.shippingConfirmStatusPolling')
  if (requestStatus.value === 'submitted') return t('workflowWarehouse.shippingConfirmStatusSubmitted')
  return t('workflowWarehouse.shippingConfirmStatusPending')
})

async function handleSaveDraft() {
  await saveManualEdit()
}

async function getFormData(needValidation: boolean) {
  if (needValidation) {
    await validateForSubmit()
  }
  return buildSubmitPayload()
}

defineExpose({ getFormData })
</script>

<template>
  <div class="shipping-confirm">
    <div class="header">
      <div class="header-copy">
        <h3 class="title">{{ $t('workflowWarehouse.shippingConfirmTitle') }}</h3>
        <small class="description">{{ $t('workflowWarehouse.shippingConfirmDescription') }}</small>
      </div>
      <el-tag size="large" :type="statusTagType">{{ statusLabel }}</el-tag>
    </div>

    <div class="meta-row">
      <el-tag v-if="displayPiNum" effect="light" round>{{ displayPiNum }}</el-tag>
      <span v-if="previewFileName" class="meta-file">{{ previewFileName }}</span>
      <span v-if="outRequestNo" class="meta-request"> {{ $t('workflowWarehouse.shippingConfirmRequestNo') }}: {{ outRequestNo }} </span>
    </div>

    <div v-if="!outRequestNo" class="missing-request">
      <div class="missing-request__card">
        <h4 class="missing-request__title">{{ $t('workflowWarehouse.shippingConfirmMissingRequestNo') }}</h4>
        <p class="missing-request__copy">
          {{ $t('workflowWarehouse.shippingConfirmPendingSummary') }}
        </p>
        <p class="missing-request__copy">workflow 需要先把 `out_request_no` 或 `shippingConfirmOutRequestNo` 写入当前表单变量，页面进入后才会自动查询结果。</p>
      </div>
      <WHShippingConfirmDetectedCard class="mg-top" />
    </div>

    <el-splitter v-else class="container">
      <el-splitter-panel class="mg-right preview-panel" :collapsible="isCollapsible" :min="220">
        <WorkflowPreview :doc-id="previewDocId">
          <template #title>
            <div class="preview-title">{{ previewFileName || displayPiNum }}</div>
          </template>
        </WorkflowPreview>
      </el-splitter-panel>
      <el-splitter-panel class="mg-left side-panel" size="32%" :collapsible="isCollapsible" :min="240">
        <WHShippingConfirmDetailCard />
        <WHShippingConfirmDetectedCard class="mg-top" />
        <div v-if="!disabled" class="action-bar mg-top">
          <el-button :loading="refreshing" @click="refreshResult">
            {{ $t('workflowWarehouse.shippingConfirmRefresh') }}
          </el-button>
          <el-button type="primary" :loading="saving" @click="handleSaveDraft">
            {{ $t('workflowWarehouse.shippingConfirmSaveDraft') }}
          </el-button>
        </div>
        <p class="action-hint">{{ summary }}</p>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style scoped lang="scss">
.shipping-confirm {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-m);
  margin-bottom: var(--app-space-s);
}

.header-copy {
  min-width: 0;
}

.title {
  margin: 0;
}

.description {
  color: var(--el-text-color-secondary);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-s);
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.meta-file {
  color: var(--el-color-primary);
  font-weight: 600;
}

.meta-request {
  word-break: break-all;
}

.missing-request {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.missing-request__card {
  padding: var(--app-space-m);
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius-m);
  background: var(--el-fill-color-lighter);
}

.missing-request__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 1rem;
  font-weight: 600;
}

.missing-request__copy {
  margin: var(--app-space-xs) 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
}

.empty-state {
  flex: 1;
}

.container {
  flex: 1;
  min-height: 0;
}

.preview-title {
  padding-bottom: var(--app-space-s);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
}

.action-hint {
  margin: var(--app-space-s) 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
}

:deep(.el-splitter-bar__dragger-horizontal) {
  opacity: 0.1;
}

:deep(.mg-left) {
  margin-left: var(--app-space-xs);
}

:deep(.mg-right) {
  margin-right: var(--app-space-xs);
}

:deep(.preview-panel) {
  min-width: 0;
  overflow: hidden;
}

:deep(.side-panel) {
  min-width: 0;
  overflow: visible !important;
}

.mg-top {
  margin-top: var(--app-space-s);
}
</style>
