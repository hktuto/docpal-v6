<script setup lang="ts">
import { newClientApi } from 'api'
import { SGLA } from '../../../utils/variableMapping'

const detecting = ref(false)
const unmatchedList = ref<any[]>([])
const { formData, selectedInvoice, updateInvoiceData } = useWHASupplyListVerifyInject()
const { saveTableData, highlightMatchingRows, resetVerifiedMatches } = useWHASupplyListVerifyTableInject()

async function handleDetect(isInit = true, reset = true) {
  if (detecting.value) return
  detecting.value = true
  try {
    if (!isInit) await saveTableData()
    const res = await newClientApi.postWmsPackingOrderCompare({
      batchNo: formData.value?.batch_no,
      invoiceNum: selectedInvoice.value?.[SGLA.Name]
    })
    unmatchedList.value = (res.data || [])
      .filter((item: any) => !item.is_match)
      .map((item: any) => ({
        supplierPn: item.ocr.vendor_item_no,
        poLine: item.ocr.po,
        totalQty: item.ocr.total_qty,
        dbTotalQty: item.database.total_qty,
        dbPo: item.database.po
      }))
    highlightMatchingRows(unmatchedList.value)

    if (reset && unmatchedList.value.length) {
      const changed = resetVerifiedMatches?.(unmatchedList.value)
      if (selectedInvoice.value?.[SGLA.Status] === 'confirm') {
        await updateInvoiceData({ [SGLA.Status]: 'created' })
      }
      if (changed) await saveTableData()
    }
  } catch (error) {
    console.error(error)
  } finally {
    detecting.value = false
  }
}

watch(
  selectedInvoice,
  (invoice) => {
    unmatchedList.value = []
    if (invoice) handleDetect()
  },
  { immediate: true }
)

defineExpose({
  handleDetect
})
</script>

<template>
  <WHDetectedCard :issues="unmatchedList" :detecting="detecting" @detect="handleDetect(false)">
    <template #default="{ issues }">
      <div v-for="(item, index) in issues" :key="index" class="detected-issue-card">
        <b>{{ item.supplierPn }}</b>({{ item.poLine }})
        <div v-if="item.dbTotalQty !== item.totalQty">
          <span>{{ item.dbTotalQty }}</span>
          <span class="is-danger">{{ item.totalQty }}</span>
          (QTY)
        </div>
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

.is-danger {
  margin: 0 var(--app-space-xs);
  padding: 0 var(--app-space-xs);
  background-color: var(--el-color-danger);
  color: var(--el-color-white);
}
</style>
