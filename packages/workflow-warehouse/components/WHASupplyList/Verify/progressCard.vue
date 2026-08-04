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
import { newClientApi } from 'api'
import { Document } from '@element-plus/icons-vue'
import { useWHASupplyListVerifyTableInject } from '../../../composables/useWHASupplyListVerifyTable'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../../../utils/variableMapping'

const { updateInvoiceData, disabled } = useWHASupplyListVerifyInject()
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
  width: 100%;
}
</style>
