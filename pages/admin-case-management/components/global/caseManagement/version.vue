<script lang="ts" setup>
import {adminApi , clientApi} from 'api'
import {CaseManagementVersionTable} from '#components'
import { ElNotification } from 'element-plus';
const props = defineProps<{
    caseTypeId: string,
    name: string,
    orderBy?: string,
    isDesc?: boolean,
    pageSize?: number,
    pageNum?: number,
}>();
const routerProvider = inject(MenuRouterKey)
if(!routerProvider) {
    throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const tableRef = ref<InstanceType<typeof CaseManagementVersionTable>>()
const { pageNum, pageSize, orderBy, isDesc } = toRefs(props)

const caseData = ref();

async function getCaseData(){
    const { data } = await clientApi.api.getCaseTypesCasetypeid(props.caseTypeId)
    caseData.value = data
    console.log(caseData.value)
}

function getAllHumanTask(json:any, result:any[]){
  if(!json.humanTask) {
    json.humanTask = []
  }
  json.humanTask.forEach(item => {
      result.push(item)
  })
  if(json.stage && json.stage.length > 0) {
      json.stage.forEach(item => {
          result = getAllHumanTask(item, result)
      })
  }
  return result
}

async function saveAsNewVersion(data:any){
    // TODO : save as case logic
    const dataData = await clientApi.api.postCaseTypesVersionVersionidNew(data.id).then(res => res.data)
    // get all form in case and save as to new version
    // download xml
    const xml = await clientApi.api.getCaseTypesIdDownloadXml(props.caseTypeId, {versionNumber: data.versionNumber}, {
        format: 'blob'
    })
    const xmlString = await xml.text()
    const cmmnJson = cmmnToJson(xmlString)
    const caseId = cmmnJson.definitions.case.attr_id
    
    let allHumanTask:any[] = getAllHumanTask(cmmnJson.definitions.case.casePlanModel, [])
    for(let i = 0; i < allHumanTask.length; i++) {
        const item = allHumanTask[i]
        let params:any = {
            processKey: caseId,
            userTaskId: item.attr_id,
            versionId:  data.id,
        }
        const response = await adminApi.api.getRelationQuery(params)
        if(response && response.data && response.data.length > 0 && response.data[0].jsonValue) {
          const json = response.data[0].jsonValue
          params.jsonValue = json
          params.versionId = dataData.id
          await clientApi.api.postDmsFormPropertiesSave(params)
        }
    }
    tableRef.value?.reload()
    ElNotification.success(`${data.versionNumber} has save to new version`)
}

async function promoteVersion(row:any){
    const data = await clientApi.api.postCaseTypesVersionVersionidActive(row.id).then(r=>r.data)
    routerProvider?.message.success(t('dpMsg_success'))
    await init()
}

async function openVersionDetail(data:any, openInNewTab:boolean = false){
    const newItem = newCaseManagementDetail(data.id, caseData.value.name, data.versionNumber)
    routerProvider?.navigateTo(newItem, openInNewTab)
}

function actionPermission({row, code}:PermissionMethodParams) {
    const isProduction = row.production
    console.log("actionPermission", row, code, caseData.value)
    const isLatest = row.version === caseData.value.latestVersion
    switch(code){
        case 'edit_version':
            return {visible:true, disabled: !isLatest}
        case 'edit_version_new_tab':
            return {visible:true, disabled: !isLatest}
        case 'save_as_new_version':
            return {visible:true, disabled: false}
        case 'promote_version':
            return {visible:true, disabled: isProduction}
        default:
            return {visible:true, disabled: false}
    }
}

async function init(){
    await getCaseData()
    if(tableRef.value) {
        console.log("onActivated")
        tableRef.value.reload()
    }
}

provide(CaseManagementVersionProviderKey,{
    getListApi: (params:any) => {
        routerProvider?.updateProps({
            pageNum: params.pageNum + 1,
            pageSize: params.pageSize,
            orderBy: params.orderBy,
            isDesc: params.isDesc,
        })
        console.log("get version table")
        return clientApi.api.postCaseTypesVersionPage({...params, caseTypeId: props.caseTypeId})
    },
    actionPermission,
    saveAsNewVersion,
    promoteVersion,
    openVersionDetail
})

onMounted(async () => {
    init()
})

</script>


<template>
    <div class="pageContainer">
        <CaseManagementVersionTable ref="tableRef" v-bind="props"  />
    </div>
</template>


<style lang="scss" scoped>
.pageContainer{
    width: 100%;
    height: 100%;
    position: relative;
    padding: var(--app-space-xs);
}
</style>
