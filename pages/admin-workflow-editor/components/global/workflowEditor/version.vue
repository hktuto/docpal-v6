<script lang="ts" setup>
import { ElNotification } from 'element-plus'
import { clientApi } from 'api'
import { newWorkflowEditorDetail } from '~/utils/workflowEditorMenu'
import type { PermissionMethodParams } from 'base/composables/useVxeTable'

const { id, name, draftId, latestVersion } = defineProps<{
  id: string
  draftId: string
  name: string
  latestVersion: string
}>()
const workflowData = ref<any>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const tableRef = ref()

async function getWorkflowDetail() {
  const draftData: any = await clientApi.admin.getAdmindocpalWorkflowProcessDefinitionDraftDraftid(draftId).then(r => r.data)
  workflowData.value = draftData
  routerProvider?.updateTabName(draftData.name + '- versions list')
}

function editHandler(row: any, openInNewTab = false) {
  // console.log("row data", row)
  const params: NewWorkflowVersionDetailParams = {
    id: row.id,
    name: row.name,
    draftId: row.draftId,
    versionNumber: row.versionNumber,
    versionId: row.id
  }
  const newItem = newWorkflowEditorDetail(params)
  routerProvider?.navigateTo(newItem, openInNewTab)
}

async function promoteToProductionHandler(row: any) {
  const blob = await clientApi.admin.getAdmindocpalWorkflowVersionBpmnxml(
    { draftId: row.draftId, versionNumber: row.versionNumber },
    {
      format: 'blob'
    }
  )
  let json = await clientApi.admin.getAdmindocpalWorkflowVersionJson({
    draftId: row.draftId,
    versionNumber: row.versionNumber
  }, {}).then(r => r.data)
  const x6Json = JSON.parse(json)
  await validateBpmnJson(x6Json)
  const xml = await blob.text()
  const form: any = new FormData()
  form.append('file', blob, 'workflow.bpmn.xml')
  form.append('jsonValue', json || '')

  await clientApi.admin.postAdmindocpalWorkflowVersionVersionidDeploy(row.id, { requestDTO: {} }, form).then(r => r.data)
  // await saveWorkflowFormToNewVersion(xml, workflowData.value.key, row.versionNumber, data.latestVersion)
  ElNotification.success(t('dpMsg_success'))

  tableRef.value?.reload()
}

async function saveAsNewVersionHandler(row: any) {
  // get xml from workflow
  const blob = await clientApi.admin.getAdmindocpalWorkflowVersionBpmnxml(
    { draftId: row.draftId, versionNumber: row.versionNumber },
    {
      format: 'blob'
    }
  )
  let json = await clientApi.admin.getAdmindocpalWorkflowVersionJson({
    draftId: row.draftId,
    versionNumber: row.versionNumber
  }, {}).then(r => r.data)

  const form: any = new FormData()
  form.append('file', blob, 'workflow.bpmn.xml')
  form.append('jsonValue', json || '')
  form.append('draftId', row.draftId)
  form.append('oldVersion', row.id)
  const xml = await blob.text()
  const data: any = await clientApi.admin.postAdmindocpalWorkflowVersionNew({ requestDTO: {} }, form).then(r => r.data)
  if (!data) {
    return
  }

  await saveWorkflowFormToNewVersion(xml, workflowData.value.key, row.id, data.id)
  routerProvider?.message.success(t('dpMsg_success'))

  tableRef.value?.reload()
}

function actionPermission({ row, code }: PermissionMethodParams): { disabled: boolean; visible: boolean } {
  const isProduction = row.isProduction === 'A'
  const isLatest = row.versionNumber === workflowData.value.latestVersion
  let result = {
    visible: true,
    disabled: true
  }
  if (!code) {
    return result
  }
  if (code === 'view') {
    result.visible = !isLatest
    result.disabled = false
    return result
  }
  if (code === 'edit' || code === 'edit_new_tab') {
    result.visible = isLatest && !isProduction
    result.disabled = !isLatest || isProduction
    return result
  }
  if (code === 'promote_to_production') {
    result.disabled = isProduction
    return result
  }
  if (code === 'save_as_new_version') {
    result.disabled = false
  }
  return result
}

onMounted(async () => {
  await getWorkflowDetail()
})

provide(WorkflowEditorVersionListProviderKey, {
  getListApi: clientApi.admin.postAdmindocpalWorkflowVersionPage,
  editHandler,
  actionPermission,
  saveAsNewVersionHandler,
  promoteToProductionHandler
})
</script>

<template>
  <div class="pageContainer">
    <LazyWorkflowEditorVersionListTable ref="tableRef" :draftId="draftId">
      <template #toolbar_buttons>
        <h2>{{ name }}</h2>
      </template>
    </LazyWorkflowEditorVersionListTable>
  </div>
</template>

<style lang="scss" scoped>
h2 {
  margin: 0;
}

.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
  overflow: hidden;
}
</style>
