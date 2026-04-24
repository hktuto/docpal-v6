<script lang="ts" setup>
const activeTab = ref('allTask')
const workflowRef = ref()

function reload() {
  // workflowRef.value.reloadTable()
}
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <div class="buttons--absolute">
      <WorkflowPopoverPersonal />
      <WorkflowPopoverNewTask @reload="reload" />
    </div>
    <el-tabs v-model="activeTab" class="tag-container dp-tabs--auto">
      <el-tab-pane :label="$t('workflow_allTask')" name="allTask">
        <WorkflowAllTask v-if="activeTab === 'allTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_myTask')" name="myTask">
        <WorkflowMyTask v-if="activeTab === 'myTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_completedTask')" name="completeTask">
        <WorkflowCompleteTask v-if="activeTab === 'completeTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_activeTask')" name="activeTask">
        <WorkflowActiveTask v-if="activeTab === 'activeTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('Resolved Task')" name="resolvedTask">
        <WorkflowResolvedTask v-if="activeTab === 'resolvedTask'" ref="workflowRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer--padding.workflow-page {
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: var(--app-space-xs);
  @container (max-width: 1200px) {
    grid-template-rows: min-content 1fr min-content;
  }
  .el-tab-pane {
    height: 100%;

    div {
      height: 100%;
    }
  }
}

.buttons--absolute {
  position: absolute;
  right: calc(var(--app-space-xs) * 2);
  top: calc(var(--app-space-xs) * 2);
  z-index: 2;
  @container (max-width: 1200px) {
    position: relative;
    right: auto;
    top: auto;
  }
}

.dp-tabs--auto {
  width: 100%;
  overflow: hidden;
}
</style>
