<script lang="ts" setup>
import { MenuRouterKey, type NewWorkflowVersionDetailParams, type NewWorkflowVersionListParams } from '#imports'
import { newAdminApi } from 'api'
import { saveWorkflowFormToNewVersion } from '~/utils/workflowEditorhelpers'

const { t } = useI18n()

defineOptions({
  name: 'WorkflowEditorDetailDead'
})

const routerProvider = inject(MenuRouterKey)

const { id, currentVersion, versionId } = defineProps<{
  id: string
  versionId: string
  currentVersion: string
}>()

const draftDetail = ref<any>({})
const readonly = ref(true)
const bpmnFile = ref()
const WorkflowEditorRef = ref()
const workflowData = ref()
const processKey = ref('')
const state = reactive<any>({
  detail: {},
  loading: false,
  newStatus: false
})
const loading = ref(false)
const productionVersion = ref()
const lastestVewsion = ref()

async function getWorkflow() {
  loading.value = true
  const draftData: any = await newAdminApi.getDocpalWorkflowProcessDefinitionDraftDraftid(id).then(r => r.data)
  if (!draftData) {
    throw createError('draft not found')
  }
  draftDetail.value = draftData
  const blob = await newAdminApi.getDocpalWorkflowVersionBpmnxml(
    { draftId: id, versionNumber: currentVersion },
    {
      format: 'blob'
    }
  )
  const json = await newAdminApi.getDocpalWorkflowVersionJson({
    draftId: id,
    versionNumber: currentVersion
  }, {})
  // @ts-ignore
  const file = await blob.text()
  bpmnFile.value = file

  // regex to get progress key
  const xmlJson = bpmnStringToJson(file)
  processKey.value = xmlJson.json.definitions.process.attr_id

  productionVersion.value = draftData.productionVersion
  lastestVewsion.value = draftData.latestVersion || currentVersion // if latest version is null , then current version must be latest

  // check read only logic
  readonly.value = !!(currentVersion !== lastestVewsion.value || (productionVersion.value && currentVersion === productionVersion.value))
  workflowData.value = draftData
  // key
  workflowData.value.key = processKey.value
  routerProvider?.updateTabName(draftData.name + ` - (${currentVersion})`)
  nextTick(() => {
    if (json && json.data) {
      WorkflowEditorRef.value.init(bpmnFile.value, JSON.parse(json.data))
    } else {
      WorkflowEditorRef.value.init(bpmnFile.value)
    }
  })
  loading.value = false
}

async function saveDraft() {
  const { xml, json, x6Json } = WorkflowEditorRef.value.getData()
  const newName = json.definitions.process.attr_name
  const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' })
  const form: any = new FormData()
  form.append('name', newName)
  form.append('versionId', versionId)
  form.append('draftId', id)
  form.append('jsonValue', JSON.stringify(x6Json))
  form.append('file', blob, 'workflow.bpmn.xml')
  form.append('isDraft', true)
  await newAdminApi.postDocpalWorkflowProcessDefinitionSave(form, { format: 'blob' }).then(r => r.data)
  // 如果是修改了名称，则更新 tab 的名称
  routerProvider?.updateTabName(newName + ` - (${currentVersion})`)
}

provide('workflowDetail', {
  saveDraft
})

function openVersionList() {
  const params: NewWorkflowVersionListParams = {
    id: workflowData.value.draftId,
    name: workflowData.value.name,
    draftId: workflowData.value.draftId,
    latestVersion: workflowData.value.latestVersion,
    productionVersion: workflowData.value.productionVersion
  }
  const newItem = newWorkflowEditorVerionList(params)
  routerProvider?.navigateTo(newItem)
}

async function promoteToProduction() {
  try {
    loading.value = true
    const { xml, x6Json } = WorkflowEditorRef.value.getData()
    await validateBpmnJson(x6Json)
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' })
    const form: any = new FormData()
    form.append('jsonValue', JSON.stringify(x6Json))
    form.append('file', blob, 'workflow.bpmn.xml')
    const { data: workflowVersionData } = (await newAdminApi.getDocpalWorkflowVersion({
      draftId: id,
      versionNumber: currentVersion
    })) as any
    await newAdminApi.postDocpalWorkflowVersionVersionidDeploy(workflowVersionData.id, form, { format: 'blob' }).then(r => r.data)
    routerProvider?.message?.success(t('dpMsg_success'))
    await getWorkflow()
  } catch (error) {
    routerProvider?.message?.error(t('commons_error'))
  } finally {
    loading.value = false
  }
}

const openEditor = ref(true)

async function saveAsNewVersion() {
  const { xml, x6Json } = WorkflowEditorRef.value.getData()
  const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' })
  const form: any = new FormData()
  form.append('jsonValue', JSON.stringify(x6Json))
  form.append('draftId', id)
  form.append('file', blob, 'workflow.bpmn.xml')
  form.append('oldVersion', versionId)
  // save all forms to new version
  const data: any = await newAdminApi.postDocpalWorkflowVersionNew(form).then(r => r.data)
  await saveWorkflowFormToNewVersion(xml, workflowData.value.key, versionId, data.id)

  routerProvider?.message.success(t('dpMsg_success'))
  // TODO : check if this is correct
  routerProvider?.updateProps({
    id,
    currentVersion: data.versionNumber,
    versionId: data.id,
    productionVersion: data.productionVersion
  })
  await getWorkflow()

  // Handle field version inconsistency issues
  openEditor.value = false
  nextTick(() => {
    openEditor.value = true
  })
}

async function exportWorkflow() {
  // ot export workflow to a single json file for migrate to new workflow
  // step 1 get workflow bpmn xml and json 
  const result = await WorkflowEditorRef.value.exportWorkflow()
  // download json as a file name  ${workflowName}_${currentVersion}.json
  const fileName = `${workflowData.value.name}_${currentVersion}.json`
  const blob = new Blob([JSON.stringify(result)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}

async function importWorkflow(importData: any) {
  await WorkflowEditorRef.value.importWorkflow(importData)
}

const WorkflowEditorImportDialogRef = ref()

function openImportDialog() {
  WorkflowEditorImportDialogRef.value.open()
}

watch(
  () => [id, versionId],
  (newWorkflowId) => {
    if (newWorkflowId[0] && newWorkflowId[1]) {
      getWorkflow()
    } else {
      console.log('id or versionId not valid')
    }
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="pageContainer">
    <BpmnEditor
      v-if="openEditor"
      v-loading="loading"
      ref="WorkflowEditorRef"
      :workflow-data="workflowData"
      :currentVersion="currentVersion"
      :processKey="processKey"
      :currentVersionId="versionId"
      :id="id"
      :readonly="readonly"
    >
      <template #actions>
        <template v-if="!productionVersion || productionVersion !== currentVersion">
          <ElButton id="WorkflowEditor__DetailDead__PromoteToProduction" type="primary" @click="promoteToProduction">
            {{ $t('workflowEditor_promoteToProduction', { currentVersion: currentVersion }) }}
          </ElButton>
        </template>
        <ElButton id="WorkflowEditor__DetailDead__SaveAsNewVersion" type="primary" @click="saveAsNewVersion">
          {{ $t('workflowEditor_saveAsNewVersion') }}
        </ElButton>
        <ElButton id="WorkflowEditor__DetailDead__VersionList" type="primary" @click="openVersionList">
          {{ $t('workflowEditor_versionList') }}
        </ElButton>
        <ElButton id="WorkflowEditor__DetailDead__ExportWorkflow" type="primary" @click="exportWorkflow">
          Export Workflow
        </ElButton>
        <ElButton id="WorkflowEditor__DetailDead__ExportWorkflow" type="primary" @click="openImportDialog">
          Import Workflow
        </ElButton>
        <!-- <el-button v-if="state.detail.publishStatus === 'A' && state.detail.status === 'A'" :loading="state.loading" type="info" @click="handleDeactive()">{{$t('actions.inactive')}}</el-button> -->
        <!-- <el-button v-else-if="state.detail.status === 'A'" :loading="state.loading" type="info" @click="handleActive()">{{$t('actions.active')}}</el-button> -->
        <!-- <el-button :loading="state.loading" type="primary" @click="handleSave(true)">{{$t('button.saveDraft')}}</el-button> -->
        <!-- <el-button v-if="state.detail.status !== 'A'" :loading="state.loading" type="primary" @click="handleSave(false)">{{$t('button.publish')}}</el-button> -->
      </template>
    </BpmnEditor>
    <WorkflowEditorImportDialog ref="WorkflowEditorImportDialogRef" @submit="importWorkflow" />
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
