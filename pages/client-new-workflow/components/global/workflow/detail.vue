<script lang="ts" setup>
import { routeWorkflowPage } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const props = defineProps<{
  detail: any
  db_id: string
  workflowType: string
}>()

const state = reactive({
  activeTab: 'form' as string
})

const { workflowFormRef, taskDetail, showForm, error, handleClaimChange } = useWorkflowFormProvider({
  workflowType: toRef(props, 'workflowType'),
  dbId: toRef(props, 'db_id'),
  sourceTask: toRef(props, 'detail'),
  ensureFormTab: async (run) => {
    const previousTab = state.activeTab
    state.activeTab = 'form'
    await nextTick()
    await run()
    state.activeTab = previousTab
  }
})

function handleBack() {
  routerProvider?.navigateTo(
    routeWorkflowPage({
      workflowType: props.workflowType
    })
  )
}

onMounted(() => {
  if (['availableTask', 'completeTask'].includes(props.workflowType)) {
    state.activeTab = 'info'
  }
})
</script>

<template>
  <div v-if="!error" class="pageContainer--padding workflow-detail">
    <el-tabs v-model="state.activeTab" class="workflow-detail__tabs">
      <el-tab-pane :label="$t('workflow_info')" name="info">
        <div class="workflow-detail__content is-scroll">
          <WorkflowDetailCompleteInfo v-if="workflowType === 'completeTask'" :taskDetail="taskDetail" :state="workflowType" />
          <WorkflowDetailInfo v-else :taskDetail="taskDetail" @change="handleClaimChange" />
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="showForm" :label="$t('workflow_form')" name="form">
        <WorkflowForm ref="workflowFormRef" class="workflow-detail__form" />
      </el-tab-pane>
    </el-tabs>
  </div>

  <div v-else class="workflow-detail-error">
    Workflow id not found, workflow id : {{ db_id }}.
    <el-button id="Workflow__AvailableTask__Detail__Form__Back" type="primary" @click="handleBack">
      {{ $t('common_back') }}
    </el-button>
    <p>{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer--padding.workflow-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.workflow-detail__tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-tabs__header) {
    flex-shrink: 0;
    margin-bottom: var(--app-space-s);
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.workflow-detail__content {
  height: 100%;
  min-height: 0;

  &.is-scroll {
    overflow: auto;
  }
}

.workflow-detail__form {
  height: 100%;
  min-height: 0;
}

.workflow-detail-error {
  padding: var(--app-space-s);
}
</style>
