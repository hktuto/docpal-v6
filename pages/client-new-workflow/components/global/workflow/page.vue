<script lang="ts" setup>
const state = reactive<any>({
  activeTab: 'allTask',
  loading: false
})
const workflowRef = ref()

function reload() {
  workflowRef.value.reload()
}
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <div class="buttons--absolute">
      <WorkflowPopoverPersonal />
      <WorkflowPopoverNewTask @submit="reload" />
    </div>
    <el-tabs v-model="state.activeTab" class="tag-container dp-tabs--auto">
      <el-tab-pane :label="$t('workflow_allTask')" name="allTask">
        <WorkflowAllTask v-if="state.activeTab === 'allTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_myTask')" name="myTask">
        <WorkflowMyTask v-if="state.activeTab === 'myTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_completedTask')" name="completeTask">
        <WorkflowCompleteTask v-if="state.activeTab === 'completeTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_activeTask')" name="activeTask">
        <WorkflowActiveTask v-if="state.activeTab === 'activeTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_adhocTask')" name="adhocTask">
        <WorkflowAdhocTask v-if="state.activeTab === 'adhocTask'" ref="workflowRef" />
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
