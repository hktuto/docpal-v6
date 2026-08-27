<script setup lang="ts">
import WHInvoiceShipMenu from './menu.vue'
import WHInvoiceShipDetailCard from './detailCard.vue'
import WHInvoiceShipDetectedCard from './detectedCard.vue'
import { useShipVerifyProvider } from '../../../composables/useShipVerify'

const props = defineProps(['formData', 'taskDetail', 'disabled'])
const { t } = useI18n()
const isCollapsible = ref(true)
const { selectedInvoice, invoiceList } = useShipVerifyProvider(props)
const previewFileId = computed(() => selectedInvoice.value?.file?.id ?? selectedInvoice.value?.fileId ?? '')

const detailCardRef = ref<InstanceType<typeof WHInvoiceShipDetailCard>>()

function assertInvoiceComplete(item: (typeof invoiceList.value)[number]) {
  const name = item.invoiceNum
  if (!name) throw new Error(t('workflowWarehouse.pleaseEnterInvoiceNumber'))
  if (!item.shipConfirmDate) throw new Error(t('workflowWarehouse.pleaseEnterShipConfirmDate', { name }))
  if (!item.customerNo) throw new Error(t('workflowWarehouse.pleaseEnterCustomerNo', { name }))
  if (!item.piAmount) throw new Error(t('workflowWarehouse.pleaseEnterPiAmount', { name }))
  if (!item.selfDelivery) throw new Error(t('workflowWarehouse.pleaseEnterSelfDelivery', { name }))
}

async function getFormData(needValidation: boolean) {
  if (needValidation) {
    const result = await detailCardRef.value?.validate()
    if (result === 'cancel') throw new Error('__CANCEL__')
    if (!invoiceList.value.length) {
      throw new Error(t('workflowWarehouse.selectSubInvoice'))
    }
    invoiceList.value.forEach(assertInvoiceComplete)
  }
  return {
    invoice_list: invoiceList.value.map((item) => ({
      id: item.id,
      invoiceNum: item.invoiceNum,
      shipConfirmDate: item.shipConfirmDate,
      customerNo: item.customerNo,
      piAmount: item.piAmount,
      selfDelivery: item.selfDelivery,
      fileName: item.fileName,
      fileId: item.fileId
    }))
  }
}

defineExpose({ getFormData })
</script>

<template>
  <div class="verification">
    <div class="header">
      <h3 class="title">{{ $t('workflowWarehouse.shipVerifyTitle') }}</h3>
      <WHInvoiceShipMenu />
    </div>
    <el-splitter class="container">
      <el-splitter-panel class="mg-right preview-panel" :collapsible="isCollapsible" :min="200">
        <WorkflowPreview :doc-id="previewFileId" />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left side-panel" size="30%" :collapsible="isCollapsible" :min="180">
        <WHInvoiceShipDetailCard ref="detailCardRef" />
        <WHInvoiceShipDetectedCard class="mg-top" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style scoped lang="scss">
.verification {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

.header {
  flex-shrink: 0;
  margin-bottom: var(--app-space-s);
}

.container {
  flex: 1;
  min-height: 0;
}

:deep(.el-splitter-bar__dragger-horizontal) {
  opacity: 0.1;
}
:deep(.mg-left) {
  margin-left: var(--app-space-xs);
}
:deep(.mg-right) {
  margin-right: var(--app-space-xs);
}
:deep(.preview-panel) {
  min-width: 0;
  overflow: hidden;
}
:deep(.side-panel) {
  min-width: 0;
  overflow: visible !important;
}
.mg-top {
  margin-top: var(--app-space-s);
}
.title {
  margin: var(--app-space-xs) 0;
  padding: 0;
}
</style>
