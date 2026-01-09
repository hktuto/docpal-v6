<script lang="ts" setup>
import { adminApi, clientApi } from 'api'

const { caseId } = useCmmnGraph()
const props = defineProps<{
  caseTypeId: string,
  name: string,
  currentVersion: string,
  versionId: string
}>()
const { t } = useI18n()
const editorEl = ref()
const readOnly = ref(false)
const state = reactive<any>({
  loading: false
})
const caseInfo = ref<any>()
const production = ref(false)
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw createError('menu manger not found')
}

async function getCaseData() {
  console.log('getCaseData')
  const { data } = await clientApi.api.getCaseTypesVersionVersionid(props.versionId) as any
  readOnly.value = data.production
  production.value = data.production
  caseInfo.value = data
  routerProvider?.updateTabName(props.name)
}

// async function getFileAndDisplay(path: string) {
//   // ordercase | test
//   const cmmnString = await fetch('/cmmn/test.xml').then(res => res.text())
//   editorEl.value.init(cmmnString)
// }

// async function loadX6Json() {
//   const cmmnString = await fetch('/cmmn/test.xml').then(res => res.text())
//   const x6Json = await fetch('/cmmn/x6Test.json').then(res => res.json())
//   editorEl.value.init(cmmnString, x6Json)
// }

// async function loadXml() {
//   const blob = await clientApi.api.getCaseTypesIdDownloadXml(props.caseTypeId, {versionNumber: props?.currentVersion}, {
//     format: 'blob'
//   }) as any
//   const cmmnString = await blob.text()
//   editorEl.value.init(cmmnString)
// }

async function loadJsonAndXml() {
  let { data: styleJson } = await clientApi.api.getCaseTypesIdStylejson(props.caseTypeId, { versionNumber: props?.currentVersion })
  styleJson = styleJson ? JSON.parse(styleJson) : null
  const blob = await clientApi.api.getCaseTypesIdDownloadXml(props.caseTypeId, { versionNumber: props?.currentVersion }, {
    format: 'blob'
  }) as any
  const cmmnString = await blob.text()
  editorEl.value.init(cmmnString, styleJson, readOnly.value, props.versionId)
}

async function init() {
  loadJsonAndXml()
}

async function handleSave() {
  try {
    state.loading = true
    const data = editorEl.value.save()
    console.log('save data', data)
    const blob = xmlStringToFile(data.xml, 'file.cmmn.xml')

    const formData = new FormData()
    formData.append('file', blob)
    // TODO : method are not correct in swagger, tem use instance.
    await adminApi.instance.patch(`/api/case/types/version/${props.versionId}/save`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    await clientApi.api.postCaseTypesStylejsonSave(
      {
        caseTypeId: props.caseTypeId,
        versionNumber: props.currentVersion,
        styleJson: JSON.stringify(data.json)
      }
    ).then(r => r.data)
  } catch (error) {
    console.log(error)
  } finally {
    state.loading = false
  }
}

function xmlStringToFile(xmlString, fileName) {
  // 创建一个Blob对象
  var blob = new Blob([xmlString], { type: 'text/xml' })

  // 创建一个File对象
  var file = new File([blob], fileName, { type: 'text/xml' })

  return file
}

// async function getSavedData() {
//   const cmmnString = await fetch('/cmmn/saved.xml').then(res => res.text())
//   const x6Json = await fetch('/cmmn/saved.json').then(res => res.json())

//   editorEl.value.init(cmmnString, x6Json)
// }

function openDetail() {
  const newItem = newCaseManagementDetail(props.versionId, props.name, props.currentVersion)
  routerProvider?.navigateTo(newItem)
}

function openVersionList() {
  const params = {
    ...caseInfo.value,
    name: routerProvider?.tabData.value.label,
    id: props.caseTypeId,
    draftId: props.caseTypeId
  }
  const newItem = newCaseManagementVersionList(params)

  routerProvider?.navigateTo(newItem)
}

async function saveAsNewVersion() {
  try {
    console.log('saveAsNewVersion', props)
    const data = await clientApi.api.postCaseTypesVersionVersionidNew(props.versionId).then(r = r.data)
    // console.log("data", data)
    // get all form in case and save as to new version
    const allNodes = editorEl.value.graph.getNodes()
    const processKey = caseId.value
    console.log('allNodes', allNodes)
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i]
      const nodeData = node.getData()
      if (nodeData.type === 'humanTask') {
        console.log('is human task', nodeData)
        const response = await clientApi.api.getDmsFormPropertiesQuery({
          processKey,
          userTaskId: nodeData.data.attr_id,
          versionId: props.versionId
        })
        console.log('response', response)
        if (response && response.data && response.data.length > 0 && response.data[0].jsonValue) {
          const params = {
            processKey,
            userTaskId: nodeData.data.attr_id,
            versionId: data.id,
            jsonValue: response.data[0].jsonValue
          }
          await clientApi.api.postDmsFormPropertiesSave(params)
        }
      }
    }

    routerProvider?.updateProps({
      versionId: data.id,
      currentVersion: data.versionNumber
    })
    routerProvider?.message.success(t('dpMsg_success'))
    nextTick(async () => {
      await getCaseData()
      await init()
    })
  } catch (err) {
    routerProvider?.message.error(t('dpMsg_error'))

    console.log(err)
  }
  // TODO : save as form to new version
}

async function promoteToProduction() {
  const data = await clientApi.api.postCaseTypesVersionVersionidActive(props.versionId).then(r => r.data)
  routerProvider?.message.success(t('dpMsg_success'))
  await getCaseData()
  await init()
}

//
// provide(CaseManagementDetailProviderKey, {
//     caseData,
//     caseInfo,
//     currentVersionId: props.caseTypeId,
//     currentVersion: props.currentVersion,
// })

onMounted(async () => {
  console.log('onMounted case editor')
  await getCaseData()
  await init()

})
</script>

<template>
  <div class="pageContainer">
    <CmmnEditor ref="editorEl">
      <template #actions>
        <template v-if="!production">
          <ElButton id="CaseManagement__Detail__Design__PromoteToProduction" type="primary"
                    @click="promoteToProduction">
            {{ $t('workflowEditor_promoteToProduction', { currentVersion: currentVersion }) }}
          </ElButton>
        </template>
        <ElButton id="CaseManagement__Detail__Design__SaveAsNewVersion" type="primary" @click="saveAsNewVersion">
          {{ $t('workflowEditor_saveAsNewVersion') }}
        </ElButton>
        <ElButton id="CaseManagement__Detail__Design__VersionList" @click="openVersionList" type="primary">
          {{ $t('workflowEditor_versionList') }}
        </ElButton>
        <ElButton id="CaseManagement__Detail__Design__ViewDetails" @click="openDetail" type="primary">
          {{ $t('actions.viewDetails') }}
        </ElButton>
        <ElButton id="CaseManagement__Detail__Design__Save" type="primary" :loading="state.loading"
                  :disabled="readOnly" @click="handleSave">
          {{ $t('dpTool_save') }}
        </ElButton>
      </template>
    </CmmnEditor>
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  padding: var(--app-space-xs);
}

.bottom {
  width: 100%;
  padding: calc(var(--app-space-s) * 2);
  border-top: 1px solid var(--app-grey-400);
}
</style>
