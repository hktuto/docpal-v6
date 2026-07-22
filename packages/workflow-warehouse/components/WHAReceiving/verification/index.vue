<template>
  <div class="verification">
    <h1>Verification</h1>
    <el-splitter class="container">
      <el-splitter-panel class="mg-right" size="7%" :collapsible="isCollapsible" :min="100">
        <WHAReceivingVerificationList />
      </el-splitter-panel>
      <el-splitter-panel :collapsible="isCollapsible" :min="200">
        <el-tabs v-model="docId" @tab-click="handleClick">
          <el-tab-pane v-for="file in fileList" :key="file.id" :label="file.file_name || file.name" :name="file.id"></el-tab-pane>
        </el-tabs>
        <WorkflowPreview :doc-id="docId" />
      </el-splitter-panel>
      <el-splitter-panel :collapsible="isCollapsible" size="40%" :min="200">
        <WHAReceivingVerificationTable />
      </el-splitter-panel>
      <el-splitter-panel class="mg-left" size="12%" :collapsible="isCollapsible" :min="150">
        <WHAReceivingVerificationDetailCard />
        <WHAReceivingVerificationDetectedCard class="mg-top" />
        <WHAReceivingVerificationProgressCard class="mg-top" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
const props = defineProps(['formData', 'taskDetail'])
const isCollapsible = ref(true)
const docId = ref('')
const fileList = computed(() => props.formData?.file_info || [])
const { selectedInvoice, invoiceList } = useWHAReceivingVerificationProvider(props)
useWHAReceivingVerificationTableProvider(selectedInvoice)
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
</style>
