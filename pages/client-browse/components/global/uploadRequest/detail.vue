<script lang="ts" setup>
const props = defineProps<{
  paramKey?: string
  id: string
}>()

const {
  state,
  previewFile,
  listRef,
  formRef,
  applyToSelect,
  handleNodeClick,
  handleCheckAll,
  handleCheckChange,
  handleDocTypeChange,
  handleMetaChange,
  handleApply,
  handleDownload,
  handleSubmit
} = useUploadRequestDetail(props)
</script>

<template>
  <div class="pageContainer--padding uploadRequest-detail" v-loading="state.loading">
    <el-splitter>
      <el-splitter-panel class="main-left" size="300px" :min="200" collapsible>
        <UploadRequestList
          ref="listRef"
          v-model:check-all="state.checkAll"
          v-model:apply-document-type="state.applyDocumentType"
          :table-data="state.tableData"
          :file-types="state.fileTypes"
          :selected-row="state.selectedRow"
          @apply="applyToSelect"
          @node-click="handleNodeClick"
          @check-change="handleCheckChange"
          @check-all="handleCheckAll"
        />
      </el-splitter-panel>

      <el-splitter-panel class="main-middle" :min="280">
        <UploadRequestForm
          ref="formRef"
          :selected-row="state.selectedRow"
          :file-types="state.fileTypes"
          :submit-loading="state.submitLoading"
          :download-loading="previewFile.downloadLoading"
          @download="handleDownload"
          @submit="handleSubmit"
          @doc-type-change="handleDocTypeChange"
          @form-change="handleMetaChange"
          @handle-apply="handleApply"
        />
      </el-splitter-panel>

      <el-splitter-panel class="main-right" size="40%" :min="240" collapsible>
        <UploadRequestPreview :preview-file="previewFile" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style lang="scss" scoped>
.uploadRequest-detail {
  height: 100%;
  overflow: hidden;

  :deep(.el-splitter) {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-splitter-panel) {
    min-width: 0;
    overflow: hidden;
  }

  :deep(.el-splitter-bar) {
    margin: 0 var(--app-space-xs);
  }
}

:deep(.main-left),
:deep(.main-middle),
:deep(.main-right) {
  background-color: var(--app-grey-0000);
}

:deep(.main-right) {
  min-height: 0;
  overflow: hidden;
}
</style>
