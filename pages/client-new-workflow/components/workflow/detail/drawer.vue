<script lang="ts" setup>
import { routeWorkflowDetail } from '#imports'

const props = defineProps<{
  taskDetail: Record<string, any>
  workflowType: string
}>()

const emit = defineEmits<{
  close: []
  actionSuccess: [payload: { action: 'submit' | 'terminate'; dbId: string; processId?: string }]
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const taskDbId = computed(() => {
  if (props.workflowType === 'completeTask') {
    return props.taskDetail?.completed_nodes?.[props.taskDetail.completed_nodes.length - 2] || ''
  }
  return props.taskDetail?.db_id || ''
})

const { workflowFormRef, taskDetail, loading, selectedTitle, error } = useWorkflowFormProvider({
  workflowType: toRef(props, 'workflowType'),
  dbId: taskDbId,
  sourceTask: toRef(props, 'taskDetail'),
  onActionSuccess: (payload) => emit('actionSuccess', payload)
})

function handleClose() {
  emit('close')
}

function handleViewDetail() {
  const row = props.taskDetail
  if (!row) return

  const detailParams =
    props.workflowType === 'completeTask'
      ? {
          ...row,
          workflowType: 'completeTask',
          db_id: row.completed_nodes?.[row.completed_nodes.length - 2]
        }
      : {
          ...row,
          workflowType: props.workflowType,
          db_id: row.db_id
        }

  routerProvider?.navigateTo(routeWorkflowDetail(detailParams), false)
}
</script>

<template>
  <aside class="workflow-side-panel" aria-label="workflow detail panel" v-loading="loading">
    <header class="workflow-side-panel__header">
      <h3 class="workflow-side-panel__title" :title="selectedTitle" v-tooltip="selectedTitle">
        {{ selectedTitle || '—' }}
      </h3>
      <div class="workflow-side-panel__actions">
        <el-button type="primary" size="small" @click="handleViewDetail">
          {{ $t('actions.viewDetails') }}
        </el-button>
        <el-button size="small" :aria-label="$t('common_close')" @click="handleClose">
          {{ $t('common_close') }}
        </el-button>
      </div>
    </header>
    <div v-if="workflowType !== 'completeTask' && error" class="workflow-side-panel__body">
      Workflow id not found, workflow id : {{ taskDbId }}.
      <p>{{ error }}</p>
    </div>
    <div v-else class="workflow-side-panel__body" :class="{ 'is-form': workflowType !== 'completeTask' }">
      <WorkflowDetailCompleteInfo v-if="workflowType === 'completeTask'" :key="taskDbId" :taskDetail="taskDetail" state="completeTask" />
      <WorkflowForm v-else :key="taskDbId" ref="workflowFormRef" />
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.workflow-side-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-left: var(--app-space-s);
}

.workflow-side-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
  padding-bottom: var(--app-space-s);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.workflow-side-panel__title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: var(--app-font-size-m);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-side-panel__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--app-space-xs);
}

.workflow-side-panel__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-top: var(--app-space-s);

  &.is-form {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(> *) {
      flex: 1 1 0;
      min-height: 0;
      min-width: 0;
      width: 100%;
    }
  }
}
</style>
