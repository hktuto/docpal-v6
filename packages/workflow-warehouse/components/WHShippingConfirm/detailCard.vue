<script setup lang="ts">
import { Paperclip } from '@element-plus/icons-vue'
import { useShippingConfirmInject } from '../../composables/useShippingConfirm'

const { t } = useI18n()
const { disabled, displayPiNum, manualEdit, manualEditSyncStatus, outRequestNo, previewFileName, updateManualEdit, isDirty } = useShippingConfirmInject()

const syncStatusLabel = computed(() => {
  if (manualEditSyncStatus.value === 'pending_design') return t('workflowWarehouse.shippingConfirmSyncPendingDesign')
  if (manualEditSyncStatus.value === 'saved') return t('workflowWarehouse.shippingConfirmSyncSaved')
  return t('workflowWarehouse.shippingConfirmSyncNotStarted')
})

function handleFieldUpdate(field: keyof typeof manualEdit, value: string) {
  updateManualEdit(field, value)
}
</script>

<template>
  <div class="detail-card">
    <div class="detail-card-header">
      <div class="detail-card-header-copy">
        <h3 class="detail-card-title">{{ $t('workflowWarehouse.piInvoice') }} {{ displayPiNum || '—' }}</h3>
        <p class="detail-card-subtitle">{{ $t('workflowWarehouse.shippingConfirmRequestNo') }}: {{ outRequestNo || '—' }}</p>
      </div>
      <el-icon v-if="previewFileName" v-tooltip="previewFileName" class="detail-card-attach" aria-hidden="true">
        <Paperclip />
      </el-icon>
    </div>

    <div class="detail-card-body">
      <WHDetailItem
        :value="manualEdit.shipConfirmDate"
        :label="$t('workflowWarehouse.shipConfirmDate')"
        type="date"
        :disabled="disabled"
        format="YYYY-MM-DD"
        @update:value="(value) => handleFieldUpdate('shipConfirmDate', value)"
      />
    </div>

    <div class="detail-card-footer">
      <div class="detail-card-footer-row">
        <span class="detail-card-footer-label">{{ $t('workflowWarehouse.shippingConfirmManualSync') }}</span>
        <el-tag size="small" effect="light">{{ syncStatusLabel }}</el-tag>
      </div>
      <div v-if="isDirty" class="detail-card-dirty">
        {{ $t('workflowWarehouse.shippingConfirmUnsavedChanges') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detail-card {
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  overflow: visible;
}

.detail-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}

.detail-card-header-copy {
  min-width: 0;
}

.detail-card-title {
  margin: 0;
  min-width: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.detail-card-subtitle {
  margin: var(--app-space-xxs) 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.8125rem;
  word-break: break-all;
}

.detail-card-attach {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 1rem;
}

.detail-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.detail-card-footer {
  margin-top: var(--app-space-m);
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail-card-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
}

.detail-card-footer-label {
  color: var(--el-text-color-secondary);
  font-size: 0.8125rem;
}

.detail-card-dirty {
  margin-top: var(--app-space-xs);
  color: var(--el-color-warning);
  font-size: 0.8125rem;
}
</style>
