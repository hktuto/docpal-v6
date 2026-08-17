<template>
  <div class="progress-card">
    <div class="progress-card-header">
      <h3 class="progress-card-title">{{ $t('workflowWarehouse.progress') }}</h3>
      <p class="progress-card-subtitle">
        {{ $t('workflowWarehouse.verifiedProgress', { ok: statusCounts.ok, all: statusCounts.all }) }}
      </p>
    </div>

    <el-progress :percentage="percentage" :show-text="false" :stroke-width="8" />
    <el-button
      class="progress-card-action"
      type="primary"
      :icon="Document"
      :loading="loading"
      :aria-label="$t('dpTool_approve')"
      :title="$t('dpTool_approve')"
      :disabled="disabled"
      @click="handleApprove"
    >
      {{ $t('dpTool_approve') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import { useWHASupplyListVerifyTableInject } from '../../../composables/useWHASupplyListVerifyTable'

const { updateInvoiceData, disabled } = useWHASupplyListVerifyInject()
const { statusCounts, saveTableData } = useWHASupplyListVerifyTableInject()
const loading = ref(false)
const percentage = computed(() => {
  if (!statusCounts.value.all) return 0
  return Math.round((statusCounts.value.ok / statusCounts.value.all) * 100)
})

async function handleApprove() {
  try {
    loading.value = true
    await saveTableData()
    const status = percentage.value === 100 ? 'confirm' : 'created'
    await updateInvoiceData(status, 'Status')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
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
