<template>
  <div class="progress-card">
    <div class="progress-card-header">
      <h3 class="progress-card-title">Progress</h3>
      <p class="progress-card-subtitle">Verified {{ statusCounts.ok }} of {{ statusCounts.all }} lines.</p>
    </div>

    <el-progress :percentage="percentage" :show-text="false" :stroke-width="8" />

    <el-button :loading="loading" class="progress-card-action" plain @click="handleApprove">
      <el-icon class="progress-card-action-icon" aria-hidden="true">
        <Document />
      </el-icon>
      Approve &amp; Push to PDA
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { newClientApi } from 'api'
import { Document } from '@element-plus/icons-vue'
import { useWHASupplyListVerifyTableInject } from '../../../composables/useWHASupplyListVerifyTable'
import { SGLA_ITEMS_TABLE_ID } from '../../../utils/variableMapping'

const { updateInvoiceData } = useWHASupplyListVerifyInject()
const { tableData, statusCounts, columns } = useWHASupplyListVerifyTableInject()
const loading = ref(false)
const percentage = computed(() => {
  if (!statusCounts.value.all) return 0
  return Math.round((statusCounts.value.ok / statusCounts.value.all) * 100)
})

const formFields = computed(() => {
  const fields = columns.map((column) => column.field).filter((item) => item !== undefined)
  return [...fields, 'id']
})

function getFormData() {
  return tableData.value.map((item) => {
    const data: Record<string, any> = {}
    formFields.value.forEach((field) => {
      const fieldColumn = columns.find((column) => column.field === field)
      console.log(fieldColumn, 'fieldColumn')
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
    await updateInvoiceData(status)
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
  height: auto;
  padding: var(--app-space-s) var(--app-space-m);
  border: none;
  border-radius: var(--app-border-radius-max);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;

  &:hover,
  &:focus {
    background-color: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
  }
}

.progress-card-action-icon {
  margin-right: var(--app-space-xs);
}
</style>
