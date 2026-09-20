<script lang="ts" setup>
import { newClientApi, clientApi } from 'api'
import { routeWorkflowDetail, workflowResponseHelper } from '#imports'

const props = defineProps<{
  taskDetail: Record<string, any>
  workflowType: string
}>()

const emit = defineEmits<{
  close: []
  change: []
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const loading = ref(false)
const fromRenderRef = ref()
const resolvedTaskDetail = ref<Record<string, any>>({})
const variablesData = ref<Record<string, any>>({})

const selectedTitle = computed(() => {
  const row = resolvedTaskDetail.value?.db_id ? resolvedTaskDetail.value : props.taskDetail
  if (!row) return ''
  return row?.execution?.input_variables?.business_key || row?.config?.human_task?.form_title || row?.name || ''
})

const taskDbId = computed(() => {
  if (props.workflowType === 'completeTask') {
    return props.taskDetail?.completed_nodes?.[props.taskDetail.completed_nodes.length - 2]
  }
  return props.taskDetail?.db_id
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

async function initForm(node: any) {
  const formKey = node.config?.human_task?.form_key
  if (!formKey) {
    routerProvider?.message.error('The formKey does not exist!')
    return
  }

  const formJsonData = await newClientApi.getDmsFormPropertiesId(formKey).then((r: any) => r.data)
  if (!formJsonData || !formJsonData.jsonValue) {
    routerProvider?.message.error('The form does not exist!')
    return
  }
  await nextTick()
  fromRenderRef.value?.setForm?.(formJsonData.jsonValue, variablesData.value)
  await nextTick()
  fromRenderRef.value?.disableForm?.()
}

async function loadForm() {
  const dbId = taskDbId.value
  if (!dbId || props.workflowType === 'completeTask') {
    resolvedTaskDetail.value = props.taskDetail || {}
    return
  }

  loading.value = true
  try {
    const data: any = await clientApi.instance.get(`/oniflow/api/v1/processes/instance-task/${dbId}`).then((r: any) => workflowResponseHelper(r))
    if (!data) {
      routerProvider?.message.error('Get Task Detail Failed')
      return
    }
    resolvedTaskDetail.value = data

    const instanceData = await clientApi.instance.get(`/oniflow/api/v1/processes/instance/${data.process_id}`).then((r: any) => workflowResponseHelper(r))
    variablesData.value = instanceData.variables || {}
    await initForm(data)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => [taskDbId.value, props.workflowType],
  () => {
    loadForm()
  },
  { immediate: true }
)
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
    <div class="workflow-side-panel__body">
      <WorkflowDetailCompleteInfo v-if="workflowType === 'completeTask'" :taskDetail="taskDetail" state="completeTask" />
      <ContextFormRender v-else ref="fromRenderRef" :taskDetail="resolvedTaskDetail" />
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
}
</style>
