<template>
  <div class="pageContainer">
    <main class="upload-main" v-loading="state.loading">
      <el-splitter id="panesContainer">
        <el-splitter-panel class="main-left" size="15%" :min="60" collapsible>
          <AiUploadList ref="treeRef" :file-list="state.fileList" :repear-name-id-list="state.repearNameIdList" @node-click="handleNodeClick" />
        </el-splitter-panel>
        <el-splitter-panel class="main-center" size="55%" :min="300">
          <AiUploadForm ref="formRef" :selected-doc="state.selectedDoc" :repear-name-id-list="state.repearNameIdList" @form-change="handleMetaChange" />
        </el-splitter-panel>
        <el-splitter-panel class="main-right" size="30%" :min="60" collapsible>
          <AiPreview :doc="state.selectedDoc" />
        </el-splitter-panel>
      </el-splitter>
      <div class="upload-footer flex-x-between">
        <div class="space"></div>
        <div>
          <el-button :loading="state.submitLoading" :disabled="state.retryLoading" type="danger" @click="handleDiscard">
            {{ $t('ai.cancelPatch') }}
          </el-button>
          <el-button :loading="state.submitLoading" :disabled="state.retryLoading" type="info" @click="handleClose">
            {{ $t('common_close') }}
          </el-button>
          <el-button v-if="state.status === 'Error'" :loading="state.retryLoading" :disabled="state.submitLoading" type="primary" @click="handleRetry">
            {{ $t('ai.retryAiLoading') }}
          </el-button>
          <el-button :loading="state.submitLoading" :disabled="state.retryLoading" type="primary" @click="handleSubmit">
            {{ $t('dpButtom_confirm') }}
          </el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  id: string
  status?: string
}>()

const { state, treeRef, formRef, handleNodeClick, handleMetaChange, handleDiscard, handleClose, handleRetry, handleSubmit } = useAiUploadDetail(props)
</script>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  width: 100%;
  padding: var(--app-space-xs);
  position: relative;
}

.upload-main {
  display: grid;
  grid-template-rows: 1fr min-content;
  height: 100%;
  overflow: hidden;
  position: relative;
  gap: 0;

  :deep(.el-splitter) {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-splitter-panel) {
    min-width: 0;
    overflow: hidden;
  }

  :deep(.upload-footer) {
    border-top: 1px solid var(--app-grey-950);
    padding: var(--app-space-xs) calc(var(--app-space-xs) * 2);
  }
}
.upload-main {
  background-color: var(--app-grey-1000);
}
:deep(.main-left) {
  margin-right: var(--app-space-xs);
  overflow: auto;
}

:deep(.main-right) {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>
