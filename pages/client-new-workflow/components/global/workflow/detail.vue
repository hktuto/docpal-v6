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
  if (props.workflowType === 'availableTask') {
    state.activeTab = 'info'
  }
})
</script>

<template>
  <div v-if="!error" class="pageContainer--padding workflow-detail">
    <div class="wrapper">
      <el-tabs v-model="state.activeTab" class="dp-tabs--auto">
        <el-tab-pane class="workflow-detail-pane" :label="$t('workflow_info')" name="info">
          <WorkflowDetailCompleteInfo v-if="workflowType === 'completeTask'" :taskDetail="taskDetail" :state="workflowType" />
          <WorkflowDetailInfo v-else :taskDetail="taskDetail" @change="handleClaimChange" />
        </el-tab-pane>

        <el-tab-pane v-if="showForm" class="workflow-detail-pane" :label="$t('workflow_form')" name="form">
          <WorkflowForm ref="workflowFormRef" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <div v-else>
    Workflow id not found, workflow id : {{ db_id }}.
    <el-button id="Workflow__AvailableTask__Detail__Form__Back" type="primary" @click="handleBack">
      {{ $t('common_back') }}
    </el-button>
    <p>{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer--padding.workflow-detail {
  display: grid;
  grid-template-columns: 1fr;
  height: 100%;
  gap: var(--app-space-xs);
  overflow: hidden;

  > .wrapper {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
    overflow: hidden;
    position: relative;
    gap: var(--app-space-s);
  }
}

.dp-tabs--auto {
  height: 100%;
  overflow: hidden;

  .el-tab-pane {
    height: 100%;
  }
}

.workflow-detail-pane {
  display: grid;
  grid-template-rows: 1fr min-content;
  transform: scale(1);
}
</style>
