<template>
  <div class="verification">
    <div class="header">
      <h3 class="title">{{ $t('workflowWarehouse.invoiceVerifyTitle') }}</h3>
      <small class="description">{{ $t('workflowWarehouse.invoiceVerifyDescription') }}</small>
    </div>
    <el-splitter class="container">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="false" :min="50">
        <WHInvoiceSupplyListMenu />
      </el-splitter-panel>
      <el-splitter-panel class="mg-right preview-panel" :collapsible="isCollapsible" :min="200">
        <WorkflowPreviewTitle :selectedInvoice="selectedInvoice" :doc-id="selectedInvoice?.file?.id" :file-list="fileList" />
      </el-splitter-panel>
      <el-splitter-panel :collapsible="isCollapsible" size="40%" :min="200">
        <WHInvoiceSupplyListTable />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left side-panel" size="14%" :collapsible="isCollapsible" :min="180">
        <WHInvoiceSupplyListDetailCard ref="detailCardRef" />
        <WHInvoiceSupplyListDetectedCard class="mg-top" />
        <WHInvoiceSupplyListGitStatusCard class="mg-top" />
        <WHInvoiceSupplyListProgressCard class="mg-top" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
import { useInvoiceVerifyProvider } from '../../../composables/useInvoiceVerify'
import { useInvoiceVerifyTableProvider } from '../../../composables/useInvoiceVerifyTable'
import { isGitLineMatched } from '../../../utils/gitInvoice'

const props = defineProps(['formData', 'taskDetail', 'disabled'])
const { t } = useI18n()
const isCollapsible = ref(true)
const invoiceCtx = useInvoiceVerifyProvider(props)
const { selectedInvoice, invoiceList, updateInvoiceData, runMatching, fetchGroupId, refreshSelectedInvoice } = invoiceCtx
const fileList = computed(() => props.formData?.file_list_info || [])

const detailCardRef = ref<InstanceType<typeof WHInvoiceSupplyListDetailCard>>()
useInvoiceVerifyTableProvider(selectedInvoice, {
  updateInvoiceData,
  runMatching,
  fetchGroupId,
  refreshSelectedInvoice
})

async function getFormData(needValidation: boolean) {
  if (!needValidation) return
  const result = await detailCardRef.value?.validate()
  if (result === 'cancel') throw new Error('__CANCEL__')
  invoiceList.value.forEach((item) => {
    const invoiceNum = item.invoiceNum || item.invoice_num
    if (!invoiceNum) {
      throw new Error(t('workflowWarehouse.pleaseEnterInvoiceNumber'))
    }
    if (!item.orgId && !item.org_id && !item.org) {
      throw new Error(t('workflowWarehouse.pleaseSelectOrg', { name: invoiceNum }))
    }
    const items = item.items ?? []
    if (!items.length || items.some((line) => !isGitLineMatched(line))) {
      throw new Error(t('workflowWarehouse.pleaseMatchAllLines', { name: invoiceNum }))
    }
    if (!item.groupId && !item.group_id) {
      throw new Error(t('workflowWarehouse.pleaseGetGroupId', { name: invoiceNum }))
    }
  })
}

defineExpose({ getFormData })
</script>

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
.mg-top {
  margin-top: var(--app-space-s);
}
.title {
  margin: var(--app-space-xs) 0;
  padding: 0;
}
</style>
