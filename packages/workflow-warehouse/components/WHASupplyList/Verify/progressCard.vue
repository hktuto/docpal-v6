<template>
  <div class="progress-card">
    <div class="progress-card-header">
      <h3 class="progress-card-title">{{ $t('workflowWarehouse.progress') }}</h3>
      <p class="progress-card-subtitle">
        {{ $t('workflowWarehouse.verifiedProgress', { ok: statusCounts.ok, all: statusCounts.all }) }}
      </p>
    </div>

    <el-progress :percentage="percentage" :show-text="false" :stroke-width="8" />

    <button
      type="button"
      class="progress-card-action"
      :disabled="loading"
      :aria-label="$t('dpTool_approve')"
      :title="$t('dpTool_approve')"
      @click="handleApprove"
    >
      <el-icon class="progress-card-action-icon" :class="{ 'is-loading': loading }" aria-hidden="true">
        <Loading v-if="loading" />
        <Document v-else />
      </el-icon>
      <span class="progress-card-action-text">{{ $t('dpTool_approve') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { newClientApi } from 'api'
import { Document, Loading } from '@element-plus/icons-vue'
import { useWHASupplyListVerifyTableInject } from '../../../composables/useWHASupplyListVerifyTable'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../../../utils/variableMapping'

const { updateInvoiceData } = useWHASupplyListVerifyInject()
const { tableData, statusCounts, columns } = useWHASupplyListVerifyTableInject()
const loading = ref(false)
const percentage = computed(() => {
  if (!statusCounts.value.all) return 0
  return Math.round((statusCounts.value.ok / statusCounts.value.all) * 100)
})

const formFields = computed(() => {
  // checkbox 列用 checkField 绑定，列上没有 field，需显式带上 Checked
  const fields = columns.map((column) => column.field).filter((item): item is string => item !== undefined)
  return [...new Set([...fields, SGLA_ITEMS.Checked, 'id'])]
})

function getFormData() {
  return tableData.value.map((item) => {
    const data: Record<string, any> = {}
    formFields.value.forEach((field) => {
      if (field === SGLA_ITEMS.Checked) {
        data[field] = !!item[field]
        return
      }
      const fieldColumn = columns.find((column) => column.field === field)
      if (fieldColumn?.type === 'number') {
        data[field] = Number(item[field])
      } else {
        data[field] = item[field] ?? ''
      }
    })
    return data
  })
}

async function handleApprove() {
  try {
    loading.value = true
    const data = getFormData()
    await newClientApi.patchDynamicDbTableTableidDataBatchTransactional(SGLA_ITEMS_TABLE_ID, { data })
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
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: var(--app-space-s) var(--app-space-m);
  border: none;
  border-radius: var(--app-border-radius-s);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font: inherit;
  font-weight: 500;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    background-color: var(--el-color-primary-light-8);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.progress-card-action-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.progress-card-action-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
