<template>
  <WHProgressCard
    :ok="statusCounts.ok"
    :all="statusCounts.all"
    :loading="loading"
    @approve="handleApprove"
  />
</template>

<script setup lang="ts">
import { SGLA } from '../../../utils/variableMapping'

const { updateInvoiceData, disabled } = useWHASupplyListVerifyInject()
const { statusCounts, saveTableData } = useWHASupplyListVerifyTableInject()
const loading = ref(false)

async function handleApprove() {
  try {
    loading.value = true
    await saveTableData()
    const percentage = statusCounts.value.all ? Math.round((statusCounts.value.ok / statusCounts.value.all) * 100) : 0
    const status = percentage === 100 ? 'confirm' : 'created'
    await updateInvoiceData({ [SGLA.Status]: status })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>
