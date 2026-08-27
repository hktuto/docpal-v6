<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useInvoiceVerifyInject } from '../../../composables/useInvoiceVerify'
import { useInvoiceVerifyTableInject } from '../../../composables/useInvoiceVerifyTable'
import { isGitLineMatched } from '../../../utils/gitInvoice'

const unmatchedList = ref<any[]>([])
const { t } = useI18n()
const { selectedInvoice } = useInvoiceVerifyInject()
const {
  matchingLoading,
  runMatchingAndReload,
  highlightMatchingRows,
  clearMatchingRowHighlight
} = useInvoiceVerifyTableInject()

function syncUnmatchedFromInvoice() {
  const items = selectedInvoice.value?.items ?? []
  unmatchedList.value = items
    .filter((item) => !isGitLineMatched(item))
    .map((item) => ({
      supplierPn: item.vendor_item_no,
      poLine: item.po_no,
      status: item.status,
      lineQty: item.line_qty,
      unitPrice: item.unit_price
    }))
  if (unmatchedList.value.length) {
    highlightMatchingRows(
      unmatchedList.value.map((item) => ({
        supplierPn: item.supplierPn,
        poLine: item.poLine
      }))
    )
  } else {
    clearMatchingRowHighlight()
  }
}

async function handleDetect() {
  if (matchingLoading.value || !selectedInvoice.value?.id) return
  try {
    await runMatchingAndReload()
    syncUnmatchedFromInvoice()
    if (unmatchedList.value.length) {
      ElMessage.warning(t('workflowWarehouse.matchingHasIssues'))
    } else {
      ElMessage.success(t('workflowWarehouse.matchingAllMatched'))
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(String((error as any)?.message || error))
  }
}

watch(
  () => selectedInvoice.value?.id,
  () => {
    unmatchedList.value = []
    clearMatchingRowHighlight()
  }
)

defineExpose({ handleDetect })
</script>

<template>
  <WHDetectedCard
    :issues="unmatchedList"
    :detecting="matchingLoading"
    :action-text="$t('workflowWarehouse.gitMatching')"
    @detect="handleDetect"
  >
    <template #default="{ issues }">
      <div v-for="(item, index) in issues" :key="index" class="detected-issue-card">
        <b>{{ item.supplierPn || '—' }}</b>
        <span>({{ item.poLine || '—' }})</span>
        <div v-if="item.status" class="is-danger-text">{{ item.status }}</div>
      </div>
    </template>
  </WHDetectedCard>
</template>

<style scoped lang="scss">
.detected-issue-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.is-danger-text {
  color: var(--el-color-danger);
  font-size: 0.75rem;
  word-break: break-word;
}
</style>
