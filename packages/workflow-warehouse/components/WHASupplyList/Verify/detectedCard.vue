<script setup lang="ts">
import { newClientApi } from 'api'
import { SGLA } from '../../../utils/variableMapping'
import type { HighlightMatchKey } from '../../../utils/tableHelper'

const detecting = ref(false)
const unmatchedList = ref<any[]>([])
const { formData, selectedInvoice, updateInvoiceData } = useWHASupplyListVerifyInject()
const { saveTableData, highlightMatchingRows, resetVerifiedMatches, scrollToMatchingRow } = useWHASupplyListVerifyTableInject()

function handleLocateIssue(item: HighlightMatchKey) {
  scrollToMatchingRow?.(item)
}

async function handleCopy(value: unknown) {
  if (value == null || value === '') return
  try {
    await navigator.clipboard.writeText(String(value))
  } catch (error) {
    console.error(error)
  }
}

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
      <div
        v-for="(item, index) in issues"
        :key="index"
        class="detected-issue-card"
        tabindex="0"
        :aria-label="item.supplierPn"
        @click="handleLocateIssue(item)"
        @keydown.enter="handleLocateIssue(item)"
      >
        <b
          class="supplier-pn"
          v-tooltip="item.supplierPn"
          tabindex="0"
          :aria-label="item.supplierPn"
          @click="handleCopy(item.supplierPn)"
          @keydown.enter="handleCopy(item.supplierPn)"
        >{{ item.supplierPn }}</b>
        <span
          class="po-line"
          v-tooltip="item.poLine"
          tabindex="0"
          :aria-label="item.poLine"
          @click="handleCopy(item.poLine)"
          @keydown.enter="handleCopy(item.poLine)"
        >({{ item.poLine }})</span>
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
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  cursor: pointer;
}

.supplier-pn {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.po-line {
  width: fit-content;
  cursor: pointer;
}

.is-danger {
  margin: 0 var(--app-space-xs);
  padding: 0 var(--app-space-xs);
  background-color: var(--el-color-danger);
  color: var(--el-color-white);
}
</style>
