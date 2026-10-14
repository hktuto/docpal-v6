<template>
  <WHProgressCard
    :ok="statusCounts.ok"
    :all="statusCounts.all"
    :loading="loading"
    :disabled="disabled || !selectedPo"
    @approve="handleApprove"
  />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useWHPOListInject } from '../../composables/useWHPOList'
import { useWHPOListTableInject } from '../../composables/useWHPOListTable'
import { CUST_PO } from '../../utils/custPo'

const { t } = useI18n()
const { selectedPo, updatePoData, syncPoTotals, disabled } = useWHPOListInject()
const { statusCounts, tableData, saveTableData } = useWHPOListTableInject()
const loading = ref(false)

async function handleApprove() {
  if (!selectedPo.value || disabled.value) return
  loading.value = true
  try {
    await saveTableData()
    syncPoTotals(tableData.value)
    const percentage = statusCounts.value.all ? Math.round((statusCounts.value.ok / statusCounts.value.all) * 100) : 0
    const status = percentage === 100 ? 'confirm' : 'created'
    await updatePoData({ [CUST_PO.status]: status })
    ElMessage.success(t('common_save'))
  } catch (error) {
    console.error(error)
    ElMessage.error(String((error as any)?.message || t('common_fetchFail')))
  } finally {
    loading.value = false
  }
}
</script>
