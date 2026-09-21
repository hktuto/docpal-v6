<script lang="ts" setup>
const activeTab = ref('myTask')
const workflowRef = ref()
const selectedRow = ref<Record<string, any> | null>(null)

const props = defineProps<{
  workflowType: string
}>()
const { workflowType } = toRefs(props)

function reload() {
  nextTick(() => {
    workflowRef.value?.reload?.()
  })
}

function handleSelectRow(row: Record<string, any>) {
  selectedRow.value = row
}

function handleClosePanel() {
  selectedRow.value = null
  workflowRef.value?.clearHighlight?.()
}

function handleTaskInfoChange() {
  reload()
  handleClosePanel()
}

watch(activeTab, () => {
  handleClosePanel()
})

onMounted(() => {
  if (!!workflowType.value) {
    activeTab.value = workflowType.value
  }
})
</script>

<template>
  <div class="pageContainer--padding workflow-page">
    <el-splitter class="workflow-splitter">
      <el-splitter-panel :min="200" class="workflow-splitter__main">
        <div class="workflow-splitter__main-inner">
          <div v-if="!selectedRow" class="buttons--absolute">
            <WorkflowPopoverPersonal />
            <WorkflowPopoverNewTask @reload="reload" />
          </div>
          <el-tabs v-model="activeTab" class="tag-container dp-tabs--auto">
            <el-tab-pane :label="$t('workflow_availableTask')" name="availableTask">
              <WorkflowAvailableTask v-if="activeTab === 'availableTask'" ref="workflowRef" @select="handleSelectRow" />
            </el-tab-pane>
            <el-tab-pane :label="$t('workflow_myTask')" name="myTask">
              <WorkflowMyTask v-if="activeTab === 'myTask'" ref="workflowRef" @select="handleSelectRow" />
            </el-tab-pane>
            <el-tab-pane :label="$t('workflow_joinTask')" name="activeTask">
              <WorkflowActiveTask v-if="activeTab === 'activeTask'" ref="workflowRef" @select="handleSelectRow" />
            </el-tab-pane>
            <el-tab-pane :label="$t('workflow_completedTask')" name="completeTask">
              <WorkflowCompleteTask v-if="activeTab === 'completeTask'" ref="workflowRef" @select="handleSelectRow" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-splitter-panel>
      <el-splitter-panel v-if="selectedRow" size="75%" :min="280" class="workflow-splitter__side">
        <WorkflowDetailDrawer :taskDetail="selectedRow" :workflowType="activeTab" @close="handleClosePanel" @change="handleTaskInfoChange" />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer--padding.workflow-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: var(--app-space-xs);
  @container (max-width: 1200px) {
    grid-template-rows: min-content 1fr min-content;
  }

  .workflow-splitter {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .workflow-splitter__main,
  .workflow-splitter__side {
    min-width: 0;
    overflow: hidden;
  }

  .workflow-splitter__main-inner {
    position: relative;
    height: 100%;
    min-height: 0;
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
  top: var(--app-space-xs);
  z-index: 2;
  @container (max-width: 1200px) {
    position: relative;
    right: auto;
    top: auto;
  }
}

.dp-tabs--auto {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:deep(.el-splitter-bar__dragger-horizontal) {
  opacity: 1;
}
</style>
