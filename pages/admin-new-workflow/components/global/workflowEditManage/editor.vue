<script setup lang="ts">
import { clientApi } from 'api'
import { x6NodeToWorkflowJson } from '@packages/workflow/utils/jsonConversion'
import { Graph } from '@antv/x6'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const props = defineProps<{
  id: string
}>()
const { t } = useI18n()
const openWorkflowEdit = ref(false)
const workflowData = ref()
const showRelease = ref(false)
const isActivate = ref(false)
const releaseContent = ref()
const workflowReadonly = ref(false)
const workflowId = ref()
const workflowEditorRef = ref()
const permissionDialogRef = ref()
const loading = ref(false)

async function getWorkflowData() {
  try {
    openWorkflowEdit.value = false
    if (!props.id) {
      throw new Error('Workflow ID is null')
    }
    openWorkflowEdit.value = true
    const data: any = await clientApi.instance.get(`/oniflow/api/v1/workflow/definitions/instance/${props.id}`).then((r: any) => r.data.data)
    if (!data) return

    workflowId.value = data.id
    workflowData.value = data.draft_content
    workflowReadonly.value = false
    isActivate.value = !(data.version > data.published_version)
    showRelease.value = !(!data.content || data.content === '')
    releaseContent.value = data.content

    nextTick(async () => {
      workflowEditorRef.value?.init()
    })
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

async function handleSave() {
  const graph: Graph = workflowEditorRef.value.graph
  if (!graph) {
    throw new Error('graph is undefined')
  }

  // check if workflow is empty
  if (!graph.getNodes() && graph.getNodes().length === 0) return

  if (!workflowId.value || workflowId.value === '') {
    throw new Error('Workflow ID is null')
  }

  // 修改時，檢查是否已激活
  if (isActivate.value) {
    await clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}/deactivate`).then((r: any) => r.data)
    isActivate.value = false
  }

  // update workflow Json Data
  try {
    const workflowJson = x6NodeToWorkflowJson(graph, workflowEditorRef.value.workflowJson)
    await clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}`, workflowJson).then((r: any) => r.data)

    workflowEditorRef.value.workflowJson = workflowJson
  } catch (e) {
    routerProvider?.message.error(e)
    console.log(e)
  }
}

async function handleStatus() {
  try {
    if (!checkWorkflowRequiredParameter()) {
      routerProvider?.message.error('Start Task No form configured')
      return
    }
    // TODO 檢查主要綫路上的節點是否有正確配置參數

    loading.value = true
    await handleSave()
    const userId = useUserId()
    await clientApi.instance
      .put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}/activate`, { user_id: userId.value })
      .then((r: any) => r.data)
    openWorkflowEdit.value = false
    openWorkflowEdit.value = true
    isActivate.value = true
    loading.value = false
  } catch (e) {
    loading.value = false
    console.log(e)
  }
}

function checkWorkflowRequiredParameter() {
  const workflowJson = workflowEditorRef.value.workflowJson
  const find = workflowJson.nodes.find((item: any) => item.type === 'StartEvent')
  const initialise = find.config.initialise

  // 沒有必填的參數
  if (initialise.form_fields.length === 0) return true

  // 有必填參數但未設置start Form
  return initialise.form_key !== ''
}

function handleOpenRelease() {
  loading.value = true
  workflowData.value = workflowReadonly.value = true

  loading.value = false
}

function openPermissionDialog() {
  nextTick(() => {
    permissionDialogRef.value?.open(props.id)
  })
}

onMounted(async () => {
  await getWorkflowData()
})
</script>

<template>
  <div v-if="openWorkflowEdit" v-loading="loading" class="pageContainer">
    <WorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" :showSidebar="true" :is-activate="isActivate">
      <template #actions>
        <el-button type="primary" @click="handleSave">{{ $t('common_save') }}</el-button>
        <el-button v-if="!isActivate" id="Workflow__Edit__ActivateOrInactivate" type="primary" @click="handleStatus">
          {{ $t('actions.activate') }}
        </el-button>
        <!--        <el-button v-if="showRelease" type="primary" @click="handleOpenRelease">-->
        <!--          {{ $t('Open The Release Version') }}-->
        <!--        </el-button>-->
        <el-button id="Workflow__Edit__Permission" type="primary" @click="openPermissionDialog">
          {{ $t('caseManagement.editPermission') }}
        </el-button>
      </template>
    </WorkflowEditor>
    <LazyWorkflowEditManagePermissionDialog ref="permissionDialogRef" :workflow-id="props.id" />
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
