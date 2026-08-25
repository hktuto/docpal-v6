<template>
  <div class="verification">
    <h3 class="title">{{ $t('workflowWarehouse.invoiceVerifyTitle') }}</h3>
    <small class="description">{{ $t('workflowWarehouse.invoiceVerifyDescription') }}</small>
    <el-splitter class="container mg-top">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="false" :min="50">
        <WHASupplyListInvoiceVerifyList />
      </el-splitter-panel>
      <el-splitter-panel class="mg-right preview-panel" :collapsible="isCollapsible" :min="200">
        <WorkflowPreview :doc-id="docId">
          <template #title>
            <el-tabs v-model="docId" class="preview-file-tabs">
              <el-tab-pane v-for="file in fileList" :key="file.id" :label="file.file_name || file.name" :name="file.id" />
            </el-tabs>
          </template>
        </WorkflowPreview>
      </el-splitter-panel>
      <el-splitter-panel :collapsible="isCollapsible" size="40%" :min="200">
        <WHASupplyListInvoiceVerifyTable />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left side-panel" size="14%" :collapsible="isCollapsible" :min="180">
        <WHASupplyListInvoiceVerifyDetailCard ref="detailCardRef" />
        <WHASupplyListInvoiceVerifyDetectedCard class="mg-top" />
        <WHASupplyListInvoiceVerifyGitStatusCard class="mg-top" />
        <WHASupplyListInvoiceVerifyProgressCard class="mg-top" />
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
const { selectedInvoice, invoiceList, docId, updateInvoiceData, runMatching, fetchGroupId, refreshSelectedInvoice } = invoiceCtx
const fileList = computed(() => props.formData?.file_list_info || [])

const detailCardRef = ref<InstanceType<typeof WHASupplyListInvoiceVerifyDetailCard>>()
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
.preview-file-tabs {
  width: 100%;
  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap) {
    width: 100%;
  }

  :deep(.el-tabs__item) {
    max-width: 180px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: bottom;
    line-height: 40px;
  }
}
</style>
