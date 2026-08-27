<template>
  <WHProgressCard
    :ok="statusCounts.ok"
    :all="statusCounts.all"
    :loading="loading"
    :disabled="disabled || !selectedInvoice"
    :show-bar="false"
    :subtitle="$t('workflowWarehouse.matchedProgress', { ok: statusCounts.ok, all: statusCounts.all })"
    :action-text="$t('workflowWarehouse.approveAndPush')"
    @approve="handleApprove"
  />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useInvoiceVerifyInject } from '../../../composables/useInvoiceVerify'
import { useInvoiceVerifyTableInject } from '../../../composables/useInvoiceVerifyTable'

const { t } = useI18n()
const { selectedInvoice, disabled, updateInvoiceData } = useInvoiceVerifyInject()
const { statusCounts } = useInvoiceVerifyTableInject()
const loading = ref(false)

async function handleApprove() {
  if (!selectedInvoice.value?.id) return
  loading.value = true
  try {
    await updateInvoiceData({ submitted: true })
    ElMessage.success(t('common_save'))
  } catch (error) {
    console.error(error)
    ElMessage.error(String((error as any)?.message || t('common_fetchFail')))
  } finally {
    loading.value = false
  }
}
</script>
