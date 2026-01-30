<script lang="ts" setup>
import { CaseManagementDetailProviderKey } from '#imports'
import { clientApi } from 'api'

const props = defineProps<{
  caseTypeId: string,
  name: string,
  currentVersion: string,
}>()
const { caseTypeId, name, currentVersion } = toRefs(props)

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const { t } = useI18n()
const loading = ref(false)
const buttonLoading = ref(false)
const caseInfo = ref<any>()

const xmlRef = ref()

function handleSave() {

  xmlRef.value.save()
}

const caseTypeInfo = ref<any>()
const caseData = reactive<any>({
  caseNode: null,
  caseInformation: null,
  cmmn: null
})

const permissionRef = ref()

function getCase(data: any) {
  caseData.caseNode = data.caseNode
  caseData.caseInformation = data.caseInformation

  caseData.cmmn = data.cmmn
  permissionRef.value.init(caseData.caseNode.data)
}

function handleUpdate() {
  // add missing function
}

async function promoteToProduction() {
  buttonLoading.value = true
  await clientApi.admin.postAdmincaseTypesVersionVersionidActive(props.caseTypeId).then(r => r.data)
  routerProvider?.message.success(t('dpMsg_success'))
  await init()
  buttonLoading.value = false
}

async function saveAsNewVersion() {
  // console.log("props",props);

  buttonLoading.value = true
  const data = await clientApi.admin.postAdmincaseTypesVersionVersionidNew(props.caseTypeId).then(r => r.data)
  //TODO : get all form in case and save as to new version
  // Step 1 : get all form in case
  const allFrom = await xmlRef.value.getAllForm()
  for (let i = 0; i < allFrom.length; i++) {
    const form = allFrom[i]
    const params = form.params
    params.versionId = data?.id
    params.jsonValue = JSON.stringify(form.form)
    await clientApi.admin.postAdmindmsFormPropertiesSave(params).then(r => r.data)
  }

  routerProvider?.updateProps({
    caseTypeId: data.id,
    currentVersion: data.versionNumber
  })

  buttonLoading.value = false
  // console.log("new props", props)
  nextTick(() => {
    init()
  })
}

function openVersionList() {
  const params = {
    ...caseInfo.value,
    name: routerProvider?.tabData.value.label,
    id: caseTypeInfo.value.id,
    draftId: props.caseTypeId
  }
  const newItem = newCaseManagementVersionList(params)
  routerProvider?.navigateTo(newItem)
}

function openEditor() {
  const newItm = newCaseManagementEditor(
    caseInfo.value.caseTypeId,
    props.name,
    props.currentVersion,
    props.caseTypeId
  )
  console.log('newItm', newItm)
  routerProvider?.navigateTo(newItm)
}

const production = ref(false)

async function init() {
  loading.value = true
  const data: any = await clientApi.admin.getAdmincaseTypesVersionVersionid(props.caseTypeId).then(r => r.data)
  caseTypeInfo.value = await clientApi.admin.getAdmincaseTypesCasetypeid(data.caseTypeId).then(r => r.data) as any
  caseInfo.value = data
  production.value = caseInfo.value.production
  // TODO : no way to get case name in version, use another api to get, and update tab name
  loading.value = false
  routerProvider?.updateTabName(props.name + ` - (${props.currentVersion})`)
}

// test pull
defineOptions({
  name: 'CaseManagementDetailDead'
})
onMounted(async () => {
  await init()
})

onUnmounted(() => {
  caseTypeInfo.value = {}
  caseInfo.value = {}
  production.value = false
})


provide(CaseManagementDetailProviderKey, {
  caseData,
  caseInfo,
  currentVersionId: caseTypeId,
  currentVersion: currentVersion
})


</script>

<template>
  <div v-if="!loading && caseInfo" class="pageContainer">

    <CaseManagementDetailInfo :detail="caseTypeInfo">
      <template v-if="!production">
        <ElButton id="CaseManagement__Detail__BasicInfo__PromoteToProduction" :loading="buttonLoading" type="primary"
                  @click="promoteToProduction">
          {{ $t('workflowEditor_promoteToProduction', { currentVersion: currentVersion }) }}
        </ElButton>
      </template>
      <ElButton id="CaseManagement__Detail__BasicInfo__SaveAsNewVersion" :loading="buttonLoading" type="primary"
                @click="saveAsNewVersion">
        {{ $t('workflowEditor_saveAsNewVersion') }}
      </ElButton>
      <ElButton id="CaseManagement__Detail__BasicInfo__VersionList" @click="openVersionList" type="primary">
        {{ $t('workflowEditor_versionList') }}
      </ElButton>
      <ElButton id="CaseManagement__Detail__BasicInfo__OpenEditor" @click="openEditor" type="primary">
        {{ $t('caseManagement_basicInfoOpenEditor') }}
      </ElButton>
    </CaseManagementDetailInfo>
    <CaseManagementDetailCaseInfomation :caseInformation="caseData.caseInformation" :node="caseData.caseNode"
                                        @save="handleSave" />
    <CaseManagementDetailPermission ref="permissionRef" :node="caseData.caseNode" @save="handleSave" />
    <!-- <CmmnDetailPermission :node="caseData.caseNode"/>  -->
    <CaseManagementDetailXml ref="xmlRef" v-bind="props" @getCase="getCase" @update="handleUpdate" />
    <CaseManagementDetailDashboard :caseDetail="caseTypeInfo" :caseDetailId="caseInfo.caseTypeId" v-bind="props" />

  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  position: relative;
  padding: var(--app-space-s);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
  overflow: auto;

  > * {
    flex: 1 0 auto;
  }
}
</style>
