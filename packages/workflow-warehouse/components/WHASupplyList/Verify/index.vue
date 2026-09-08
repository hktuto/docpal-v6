<template>
  <div class="verification">
    <h3 class="title">{{ $t('workflowWarehouse.title') }}</h3>
    <small class="description">{{ $t('workflowWarehouse.description') }}</small>
    <el-splitter class="container mg-top">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="false" :min="50">
        <WHASupplyListVerifyList />
      </el-splitter-panel>
      <el-splitter-panel class="mg-right preview-panel" :collapsible="isCollapsible" :min="200" >
        <WorkflowPreviewTitle :selectedInvoice="selectedInvoice" :doc-id="selectedInvoice?.file?.id" :file-list="fileList" />
      </el-splitter-panel>
      <el-splitter-panel :collapsible="isCollapsible" size="40%" :min="200" >
        <WHASupplyListVerifyTable />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left side-panel" size="12%" :collapsible="isCollapsible" :min="150">
        <WHASupplyListVerifyDetailCard ref="detailCardRef" />
        <WHASupplyListVerifyDetectedCard class="mg-top" />
        <WHASupplyListVerifyProgressCard class="mg-top" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
import { SGLA } from '../../../utils/variableMapping'

const props = defineProps(['formData', 'taskDetail', 'disabled'])
const { t } = useI18n()
const isCollapsible = ref(true)
const { selectedInvoice, invoiceList } = useWHASupplyListVerifyProvider(props)
const fileList = computed(() => props.formData?.file_list_info || [])

const detailCardRef = ref<InstanceType<typeof WHASupplyListVerifyDetailCard>>()
useWHASupplyListVerifyTableProvider(selectedInvoice)
async function getFormData(needValidation: boolean) {
  if (!needValidation) return
  const result = await detailCardRef.value?.validate()
  if (result === 'cancel') throw new Error('__CANCEL__')
  invoiceList.value.forEach((item) => {
    if (!item[SGLA.Name]) {
      throw new Error(t('workflowWarehouse.pleaseEnterInvoiceNumber'))
    } else if (item[SGLA.Status] !== 'confirm') {
      throw new Error(t('workflowWarehouse.pleaseApproveInvoice', { name: item[SGLA.Name] }))
    } else if (!item[SGLA.Org]) {
      throw new Error(t('workflowWarehouse.pleaseSelectOrg', { name: item[SGLA.Name] }))
    } else if (!item[SGLA.CustomerName]) {
      throw new Error(t('workflowWarehouse.pleaseEnterCustomerName', { name: item[SGLA.Name] }))
    } else if (!item[SGLA.DeliveryDate]) {
      throw new Error(t('workflowWarehouse.pleaseEnterDeliveryDate', { name: item[SGLA.Name] }))
    }
  })
}

defineExpose({ getFormData })
</script>

<style scoped lang="scss">
.verification {
  display: flex;
  flex-direction: column;
  height: 99%;
}

.container {
  flex: 1;
  min-height: 500px;
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
