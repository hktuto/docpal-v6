<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import { SGLA } from '../../../utils/variableMapping'
const { t } = useI18n()
const detecting = ref(false)
const unmatchedList = ref([])
const { formData, selectedInvoice } = useWHASupplyListVerifyInject()
const { saveTableData, highlightMatchingRows } = useWHASupplyListVerifyTableInject()
async function handleDetect(isInit = true) {
  if (detecting.value) return
  detecting.value = true
  try {
    console.log('handleDetect', isInit)
    if (!isInit) await saveTableData()
    const res = await newClientApi.postWmsPackingOrderCompare({
      batchNo: formData.value?.batch_no,
      invoiceNum: selectedInvoice.value?.[SGLA.Name]
    })
    unmatchedList.value = res.data
      .filter((item: any) => !item.is_match)
      .map((item: any) => ({
        supplierPn: item.ocr.vendor_item_no,
        poLine: item.ocr.po,
        totalQty: item.ocr.total_qty,
        dbTotalQty: item.database.total_qty,
        dbPo: item.database.po
      }))
    highlightMatchingRows(unmatchedList.value)
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
  <div class="detected-card">
    <div class="detected-card-header">
      <div class="detected-card-header-text">
        <h3 class="detected-card-title">{{ $t('workflowWarehouse.detectedIssues') }}</h3>
        <p class="detected-card-subtitle">{{ $t('workflowWarehouse.detectedIssuesSubtitle') }}</p>
      </div>
    </div>

    <div v-if="unmatchedList.length === 0" class="detected-card-status">
      <el-icon class="detected-card-status-icon" aria-hidden="true">
        <CircleCheckFilled />
      </el-icon>
      <span>{{ $t('workflowWarehouse.noAutomaticIssues') }}</span>
    </div>
    <div v-else class="detected-issue-list">
      <div v-for="item in unmatchedList" :key="item.id" class="detected-issue-card">
        <b>{{ item.supplierPn }}</b
        >({{ item.poLine }})
        <div v-if="item.dbTotalQty !== item.totalQty">
          <span>{{ item.dbTotalQty }}</span>
          <span class="is-danger">{{ item.totalQty }}</span>
          (QTY)
        </div>
      </div>
    </div>
    <el-button
      style="width: 100%"
      type="primary"
      :loading="detecting"
      tabindex="0"
      :aria-label="t('workflowWarehouse.reDetect')"
      @click="handleDetect(false)"
      @keydown.enter="handleDetect(false)"
    >
      {{ $t('workflowWarehouse.reDetect') }}
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.detected-card {
  max-height: 30vh;
  overflow-y: auto;
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.detected-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}

.detected-card-header-text {
  min-width: 0;
}

.detected-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.detected-card-subtitle {
  margin: var(--app-space-xxs) 0 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}

.detected-card-status {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: 0.875rem;
  color: var(--el-text-color-regular);
  margin-bottom: var(--app-space-m);
}

.detected-card-status-icon {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: var(--el-color-primary);
}

.detected-issue-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}

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
