<script setup lang="ts">
const activeTab = ref<string>('allTask')
const workflowRef = ref()
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('workflow_allTask')" name="allTask">
        <WorkflowManageAllTask v-if="activeTab === 'allTask'" ref="workflowRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.pageContainer--padding.workflow-page {
  display: grid;
  grid-template-rows: 1fr;
  gap: var(--app-space-xs);

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;

    > * {
      height: 100%;
    }
  }
}
</style>
