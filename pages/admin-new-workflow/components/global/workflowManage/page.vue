<script setup lang="ts">
const state = ref<any>({
  activeTab: 'allTask',
  loading: false
})
const workflowRef = ref()
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <el-tabs v-model="state.activeTab">
      <el-tab-pane :label="$t('workflow_allTask')" name="allTask">
        <WorkflowManageAllTask v-if="state.activeTab === 'allTask'" ref="workflowRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
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
</style>
