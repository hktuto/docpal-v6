<template>
  <div class="verification">
    <h3 class="title">Verification & Mapping</h3>
    <small class="description"> Review OCR-parsed invoice lines, verify against customer PNs. </small>
    <el-splitter class="container mg-top">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="isCollapsible" :min="100">
        <WHASupplyListVerifyList />
      </el-splitter-panel>
      <el-splitter-panel class="mg-right" :collapsible="isCollapsible" :min="200">
        <WorkflowPreview :doc-id="docId">
          <template #title>
            <el-tabs v-model="docId" @tab-click="handleClick">
              <el-tab-pane v-for="file in fileList" :key="file.id" :label="file.file_name || file.name" :name="file.id"></el-tab-pane>
            </el-tabs>
          </template>
        </WorkflowPreview>
      </el-splitter-panel>
      <el-splitter-panel :collapsible="isCollapsible" size="40%" :min="200">
        <WHASupplyListVerifyTable />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left" size="12%" :collapsible="isCollapsible" :min="150">
        <WHASupplyListVerifyDetailCard />
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
const fileList = computed(() => {
  const list = props.formData?.file_info || []
  if (!docId.value) {
    docId.value = list[0].id
  }
  return list
})
useWHASupplyListVerifyTableProvider(selectedInvoice)
async function getFormData(needValidation: boolean) {
  invoiceList.value.forEach((item) => {
    if (item[SGLA.Status] !== 'confirm') {
      throw new Error('Please confirm the invoice first')
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
.mg-top {
  margin-top: var(--app-space-s);
}
.title {
  margin: var(--app-space-xs) 0;
  padding: 0;
}
</style>
