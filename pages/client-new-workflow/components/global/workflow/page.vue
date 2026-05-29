<script lang="ts" setup>
const activeTab = ref('myTask')
const workflowRef = ref()

const props = defineProps<{
  workflowType: string
}>()
const { workflowType } = toRefs(props)

function reload() {
  nextTick(() => {
    workflowRef.value?.reload?.()
  })
}

onMounted(() => {
  if (!!workflowType.value) {
    activeTab.value = workflowType.value
  }
})
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <div class="buttons--absolute">
      <WorkflowPopoverPersonal />
      <WorkflowPopoverNewTask @reload="reload" />
    </div>
    <el-tabs v-model="activeTab" class="tag-container dp-tabs--auto">
      <el-tab-pane :label="$t('Available Task')" name="availableTask">
        <WorkflowAvailableTask v-if="activeTab === 'availableTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_myTask')" name="myTask">
        <WorkflowMyTask v-if="activeTab === 'myTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_joinTask')" name="activeTask">
        <WorkflowActiveTask v-if="activeTab === 'activeTask'" ref="workflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_completedTask')" name="completeTask">
        <WorkflowCompleteTask v-if="activeTab === 'completeTask'" ref="workflowRef" />
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
