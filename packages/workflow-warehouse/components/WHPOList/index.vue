<template>
  <div class="verification">
    <div class="header">
      <h3 class="title">{{ $t('workflowWarehouse.title') }}</h3>
      <small class="description">{{ $t('workflowWarehouse.poVerifyDescription') }}</small>
    </div>
    <el-splitter class="container">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="false" :min="50">
        <WHPOListMenu />
      </el-splitter-panel>
      <el-splitter-panel class="mg-right preview-panel" :collapsible="isCollapsible" :min="200">
        <WorkflowPreviewTitle :selectedInvoice="selectedPo" :doc-id="selectedPo?.file?.id" :file-list="fileList" />
      </el-splitter-panel>
      <el-splitter-panel class="table-panel" :collapsible="isCollapsible" size="40%" :min="200">
        <WHPOListTable />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left side-panel" size="14%" :collapsible="isCollapsible" :min="180">
        <WHPOListDetailCard ref="detailCardRef" />
        <WHPOListDetectedCard class="mg-top" />
        <WHPOListProgressCard class="mg-top" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
import { useWHPOListProvider } from '../../composables/useWHPOList'
import { useWHPOListTableProvider } from '../../composables/useWHPOListTable'
import { CUST_PO } from '../../utils/custPo'

const props = defineProps(['formData', 'taskDetail', 'disabled'])
const { t } = useI18n()
const isCollapsible = ref(true)
const { selectedPo, poList } = useWHPOListProvider(props)
const fileList = computed(() => props.formData?.file_list_info || [])
const detailCardRef = ref<InstanceType<typeof WHPOListDetailCard>>()
useWHPOListTableProvider(selectedPo)

async function getFormData(needValidation: boolean) {
  if (!needValidation) return
  const result = await detailCardRef.value?.validate()
  if (result === 'cancel') throw new Error('__CANCEL__')
  poList.value.forEach((item) => {
    const name = item[CUST_PO.custPoNum] || item.id
    if (!item[CUST_PO.custPoNum]) {
      throw new Error(t('workflowWarehouse.pleaseEnterCustomerPoNo'))
    }
    if (item[CUST_PO.status] !== 'confirm') {
      throw new Error(t('workflowWarehouse.pleaseApprovePo', { name }))
    }
    if (!item[CUST_PO.custName]) {
      throw new Error(t('workflowWarehouse.pleaseEnterCustomerName', { name }))
    }
    if (!item[CUST_PO.currency]) {
      throw new Error(t('workflowWarehouse.pleaseSelectCurrency', { name }))
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
  opacity: 1;
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
