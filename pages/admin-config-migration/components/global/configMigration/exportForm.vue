<script lang="ts" setup>
import { clientApi, adminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

const caseList = ref<any[]>([])
const workflowList = ref<any[]>([])
const homePageList = ref<any[]>([])
const selectedCase = ref<any[]>([])
const userGroupList = ref<any[]>([])

const mode = ref<'select' | 'confirm'>('select')

const selectedWorkflow = ref<any[]>([])
const selectedHomePage = ref<any[]>([])
//  store related data
const relatedCase = new Set<string>()
const relatedWorkflow = new Set<string>()
const relatedDocumentTemplate = new Set<string>()
const relatedFolderCabinet = new Set<string>()
const relatedMasterTable = new Set<string>()
const relatedIdGenerator = new Set<string>()
const relatedEmailTemplate = new Set<string>()
const relatedHomePage = new Set<string>()
const relatedUserGroup = new Set<string>()
const relatedUserRole = new Set<string>()

const exportData = ref<any>({
  case:{},
  workflow:{},
  documentTemplate:{},
  folderCabinet:{},
  masterTable:{},
  idGenerator:{},
  emailTemplate:{},
  homePage:{},
  userGroup:{},
  userRole:{}
})

const loading = ref(false)

async function getHomePageList() {
  const res = await adminApi.api.postPersonalDashboard({ pageNum: 0, pageSize: 1000 })
  homePageList.value = res.data?.entryList || []
}


async function getListData() {
  const promiseList = [
    getCaseList(),
    getWorkflowList(),
    getHomePageList(),
    getUserGroupList()
  ]
  await Promise.all(promiseList)
}

async function getCaseList() {
  const res = await adminApi.api.postCaseTypesPage({ pageNum: 0, pageSize: 1000 })
  caseList.value = res.data?.entryList.filter((item: any) => item.productionVersion) || []
}

async function getUserGroupList() {
  const res = await adminApi.api.postNuxeoIdentityGroups()
  userGroupList.value = res.data || []
}

async function getWorkflowList() {
  const res = await adminApi.api.postWorkflowProcessList({ pageNum: 0, pageSize: 1000 })
  workflowList.value = res.data || []
}

async function handleExportEmailTemplate(emailTemplateId: string) {
  const emailTemplateDetail = await clientApi.api.getDmsTemplateEmailTemplateId(emailTemplateId)
  exportData.value.emailTemplate[emailTemplateId] = emailTemplateDetail.data
}

async function handleCaseExport(caseId: string) {
  const caseInfo = await getCaseExportData(caseId)
  relatedCase.add(caseId)
  caseInfo.workflow.forEach((workflowKey: string) => {
    // check if workflowKey is already in relatedWorkflow
    relatedWorkflow.add(workflowKey)
  })
  exportData.value.case[caseId] = caseInfo.case
}

async function handleHomePageExport(homePageId: string) {
  const homePageDetail = homePageList.value.find((item: any) => item.id === homePageId)
  relatedHomePage.add(homePageId)
  exportData.value.homePage[homePageId] = homePageDetail
  const group = homePageDetail.groupId.split(',')
  group.forEach((groupId: string) => {
    relatedUserGroup.add(groupId)
  })
}

async function handleUserGroupExport(groupId: string) {
  const userGroupDetail = userGroupList.value.find((item: any) => item.id === groupId)
  relatedUserGroup.add(groupId)
  exportData.value.userGroup[groupId] = userGroupDetail
}

async function handleWorkflowExport(workflowKey: string) {
  const workflowInfo = await getWorkflowExportData(workflowKey)
  relatedWorkflow.add(workflowKey)
  if (!exportData.value.workflow[workflowKey]) {
    exportData.value.workflow[workflowKey] = workflowInfo.workflowData
  }
  workflowInfo.relatedCase.forEach((caseId: string) => {
    relatedCase.add(caseId)
  })
  workflowInfo.relatedDocumentTemplate.forEach((documentTemplateId: string) => {
    relatedDocumentTemplate.add(documentTemplateId)
  })
  workflowInfo.relatedFolderCabinet.forEach((folderCabinetId: string) => {
    relatedFolderCabinet.add(folderCabinetId)
  })
  workflowInfo.relatedMasterTable.forEach((masterTableId: string) => {
    relatedMasterTable.add(masterTableId)
  })
  workflowInfo.relatedIdGenerator.forEach((idGeneratorId: string) => {
    relatedIdGenerator.add(idGeneratorId)
  })
  workflowInfo.relatedEmailTemplate.forEach((emailTemplateId: string) => {
    relatedEmailTemplate.add(emailTemplateId)
  })
}

async function handleMasterTableExport(masterTableId: string) {
  const { data: masterTableDetail } = await clientApi.api.getDmsMasterTableId(masterTableId)
  const aclsData = await clientApi.api.getDmsMasterTableIdAcls(masterTableId) as any
  // loop acls data and remove user permission
  if(!aclsData || !aclsData?.data ) {
    return
  }
  let acls = aclsData?.data.filter((acl:any) => acl.userType === 'G')
  acls.forEach((acl:any) => {
    relatedUserGroup.add(acl.userId)
  })
  exportData.value.masterTable[masterTableId] = {
    ...masterTableDetail,
    acls: acls
  }
}

async function handleIdGeneratorExport(idGeneratorId: string) {
  exportData.value.idGenerator[idGeneratorId] = await adminApi.api.getIdTemplatesId(idGeneratorId).then(res => res.data)
}

async function handleDocumentTemplateExport(documentTemplateId: string) {
  const templateData = await adminApi.api.getTemplateDocumentId(documentTemplateId)
  if(!templateData.data) {
    return
  }
  const fileBlob = await adminApi.api.postNuxeoDocumentPreview({ idOrPath: templateData.data.documentId }, {
    format: 'blob'
  })
  // check if fileBlob is a json
  const isJson = await fileBlob.text()
  try {
    const jsonData = JSON.parse(isJson)
    exportData.value.documentTemplate[documentTemplateId] = {
      ...templateData.data,
      fileBlob: jsonData
    }
  } catch (error) {
    exportData.value.documentTemplate[documentTemplateId] = {
      ...templateData.data,
      fileBlob: null
    }
  }
}

async function handleFolderCabinetExport(folderCabinetId: string) {
  const { data: folderCabinetDetail } = await clientApi.api.getDmsCabinetTemplateId(folderCabinetId)
  exportData.value.folderCabinet[folderCabinetId] = folderCabinetDetail
  const userGroups = folderCabinetDetail?.binds?.filter((bind:any) => bind.type === 'group') || []
  userGroups.forEach((bind: any) => {
    const groupId = bind.bindId
    relatedUserGroup.add(groupId)
  })
}

async function handleExport() {
  mode.value = 'confirm'
  loading.value = true
  try {
    // step1 reset all related data
    relatedCase.clear()
    relatedWorkflow.clear()
    relatedDocumentTemplate.clear()
    relatedFolderCabinet.clear()
    relatedMasterTable.clear()
    relatedIdGenerator.clear()
    relatedUserGroup.clear()
    relatedUserRole.clear()
    relatedHomePage.clear()
    relatedEmailTemplate.clear()
    exportData.value = {
      case:{},
      workflow:{},
      documentTemplate:{},
      folderCabinet:{},
      masterTable:{},
      idGenerator:{},
      emailTemplate:{},
      homePage:{},
      userGroup:{},
      userRole:{}
    }
    if(selectedCase.value.length === 0 && selectedWorkflow.value.length === 0 && selectedHomePage.value.length === 0) {
      routerProvider?.message.error('Please select at least one case, workflow or home page')
      return
    }
    // get case export data
    for(let i = 0; i < selectedCase.value.length; i++) {
      await handleCaseExport(selectedCase.value[i])
    }
    // get workflow export data
    for(let i = 0; i < selectedWorkflow.value.length; i++) {
      await handleWorkflowExport(selectedWorkflow.value[i])
    }
    // get home page export data
    for(let i = 0; i < selectedHomePage.value.length; i++) {
      await handleHomePageExport(selectedHomePage.value[i])
    }
    // loop case and handleCaseExport
    for( let caseId of relatedCase) {
      await handleCaseExport(caseId)
    }
    // loop workflow and handleWorkflowExport
    for(let workflowKey of relatedWorkflow) {
      await handleWorkflowExport(workflowKey)
    }

    // loop email template and handleExportEmailTemplate
    for (let emailTemplateId of relatedEmailTemplate) {
      await handleExportEmailTemplate(emailTemplateId)
    }

    // loop document template and handleDocumentTemplateExport
    for(let documentTemplateId of relatedDocumentTemplate) {
      await handleDocumentTemplateExport(documentTemplateId)
    }
    // loop folder cabinet and handleFolderCabinetExport
    for(let folderCabinetId of relatedFolderCabinet) {
      await handleFolderCabinetExport(folderCabinetId)
    }

    // loop master table and handleMasterTableExport
    for(let masterTableId of relatedMasterTable) {
      await handleMasterTableExport(masterTableId)
    }

    for(let idGeneratorId of relatedIdGenerator) {
      await handleIdGeneratorExport(idGeneratorId)
    }

    // Remark: over data may add item to relatedUserGroup                                                       
    // loop user group and handleUserGroupExport
    for(let groupId of relatedUserGroup) {
      await handleUserGroupExport(groupId)
    }
  } catch (err: any) {
    console.error(err)
    routerProvider?.message.error(err.message)
  }finally{
    loading.value = false
  }
}

function handleCancelSelect() {
  mode.value = 'select'
  selectedCase.value = []
  selectedWorkflow.value = []
  selectedHomePage.value = []
}

function handleConfirm() {
  // export exportData to a json file and download
  const jsonData = JSON.stringify(exportData.value)
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'exportData.json'
  link.click()
  URL.revokeObjectURL(url)
  // 
}


onMounted(() => {
  getListData()
})
</script>

<template>
  <div class="exportFormContainer" >
    <template v-if="mode === 'select'">
    <h3>
      Export Case
    </h3>
    <ElForm  ref="formRef" label-position="top">
      <ElFormItem label="Case List" >
        <ElSelect v-model="selectedCase" placeholder="Select Case" multiple filterable clearable>
          <ElOption v-for="item in caseList" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Workflow List" >
        <ElSelect v-model="selectedWorkflow" placeholder="Select Workflow" multiple filterable clearable>
          <ElOption v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.key" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Home Page List" >
        <ElSelect v-model="selectedHomePage" placeholder="Select Home Page" multiple filterable clearable>
          <ElOption v-for="item in homePageList" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <ElButton type="primary" @click="handleExport">Confirm</ElButton>
    </template>
    <div v-if="mode === 'confirm'" v-loading="loading" class="preContainer">
      <div class="exportedCaseContainer">
        <template v-if="Object.keys(exportData.case).length > 0">
          <h3>Case</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.case" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedWorkflowContainer">
        <template v-if="Object.keys(exportData.workflow).length > 0">
          <h3>Workflow</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.workflow" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedHomePageContainer">
        <template v-if="Object.keys(exportData.homePage).length > 0">
          <h3>Home Page</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.homePage" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedUserGroupContainer">
        <template v-if="Object.keys(exportData.userGroup).length > 0">
          <h3>User Group</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.userGroup" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedUserRoleContainer">
        <template v-if="Object.keys(exportData.userRole).length > 0">
          <h3>User Role</h3>
          <div class="exportInfoContainer">
            <div v-for="item in exportData.userRole" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <template v-if="Object.keys(exportData.userRole).length > 0">
        <h3>User Role</h3>
        <div class="exportInfoContainer">

          <div v-for="item in exportData.userRole" :key="item.id" class="exportInfoCard">
            <div class="cardContent">
              {{ item.name }}
            </div>
          </div>
        </div>
      </template>
      <div class="exportedEmailTemplateContainer">

        <template v-if="Object.keys(exportData.emailTemplate).length > 0">
          <h3>Email Template</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.emailTemplate" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.label }}
              </div>
            </div>
          </div>

        </template>
      </div>
      <div class="exportedDocumentTemplateContainer">
        <template v-if="Object.keys(exportData.documentTemplate).length > 0">
          <h3>Document Template</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.documentTemplate" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedFolderCabinetContainer">
        <template v-if="Object.keys(exportData.folderCabinet).length > 0">
          <h3>Folder Cabinet</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.folderCabinet" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.label }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedMasterTableContainer">
        <template v-if="Object.keys(exportData.masterTable).length > 0">
          <h3>Master Table</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.masterTable" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="exportedIdGeneratorContainer">
        <template v-if="Object.keys(exportData.idGenerator).length > 0">
          <h3>Id Generator</h3>
          <div class="exportInfoContainer">

            <div v-for="item in exportData.idGenerator" :key="item.id" class="exportInfoCard">
              <div class="cardContent">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <ElButton type="text" @click="handleCancelSelect">Cancel</ElButton>
      <ElButton type="primary" @click="handleConfirm">Confirm</ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exportInfoContainer {
  display: flex;
  flex-flow: row wrap;
  gap: var(--app-space-s);
}

.listContainer {
  display: flex;
  flex-flow: row wrap;
  gap: var(--app-space-xs);
  overflow: auto;
  height: 100%;
}

.exportInfoCard {
  border: 1px solid #ccc;
  position: relative;
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-s);
}

.selectedContainer {
  position: absolute;
  top: var(--app-space-xxs);
  right: var(--app-space-xxs);
  z-index: 2;
}
</style>
