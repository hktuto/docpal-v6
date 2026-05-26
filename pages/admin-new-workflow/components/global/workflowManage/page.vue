<script setup lang="ts">
const activeTab = ref<string>('failTask')
const workflowRef = ref()
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <el-tabs v-model="activeTab">
<!--      <el-tab-pane :label="$t('Available Task')" name="availableTask">-->
<!--        <WorkflowManageAvailableTask v-if="activeTab === 'availableTask'" ref="workflowRef" />-->
<!--      </el-tab-pane>-->
      <el-tab-pane :label="$t('Fail Task')" name="failTask">
        <WorkflowManageFailTask v-if="activeTab === 'failTask'" ref="workflowRef" />
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
