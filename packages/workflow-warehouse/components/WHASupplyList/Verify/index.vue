<template>
  <div class="verification">
    <h3 class="title">Verification & Mapping</h3>
    <small class="description"> Review OCR-parsed invoice lines, verify against customer PNs. </small>
    <el-splitter class="container mg-top">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="false" :min="50">
        <WHASupplyListVerifyList />
      </el-splitter-panel>
      <el-splitter-panel class="mg-right preview-panel" :collapsible="false" :min="200">
        <WorkflowPreview :doc-id="docId">
          <template #title>
            <el-tabs v-model="docId" class="preview-file-tabs">
              <el-tab-pane v-for="file in fileList" :key="file.id" :label="file.file_name || file.name" :name="file.id" />
            </el-tabs>
          </template>
        </WorkflowPreview>
      </el-splitter-panel>
      <el-splitter-panel :collapsible="false" size="40%" :min="200">
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
const props = defineProps(['formData', 'taskDetail'])
const isCollapsible = ref(true)
const { selectedInvoice, invoiceList, docId } = useWHASupplyListVerifyProvider(props)
const fileList = computed(() => props.formData?.file_list_info || [])

const detailCardRef = ref<InstanceType<typeof WHASupplyListVerifyDetailCard>>()
useWHASupplyListVerifyTableProvider(selectedInvoice)
async function getFormData(needValidation: boolean) {
  if (!needValidation) return
  const result = await detailCardRef.value?.validate()
  if (result === 'cancel') throw new Error('__CANCEL__')
  invoiceList.value.forEach((item) => {
    if (!item[SGLA.Name]) {
      throw new Error('Please enter the invoice number')
    } else if (item[SGLA.Status] !== 'confirm') {
      throw new Error(`⌈${item[SGLA.Name]}⌋ Please approve the invoice first`)
    } else if (!item[SGLA.VendorName]) {
      throw new Error(`⌈${item[SGLA.Name]}⌋ Please select the supplier`)
    } else if (!item[SGLA.CustomerName]) {
      throw new Error(`⌈${item[SGLA.Name]}⌋ Please enter the customer name`)
    } else if (!item[SGLA.DeliveryDate]) {
      throw new Error(`⌈${item[SGLA.Name]}⌋ Please enter the delivery date`)
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
  // --el-tabs-header-height: 1.6rem;
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
