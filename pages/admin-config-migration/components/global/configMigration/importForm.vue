<script lang="ts" setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { MenuRouterKey } from '#imports'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const uploadRef = ref()
const mode = ref<'upload' | 'confirm'>('upload')
const fileList = ref<any[]>([])
const jsonData = ref<any>()

function handleExceed(files: any[]) {
  uploadRef.value!.clearFiles()
  const file = files[0]
  file.uid = Date.now()
  uploadRef.value!.handleStart(file)
}

function handleChange(uploadFile: any, uploadFiles: any[]) {
  fileList.value = uploadFiles
}

async function handleConfirm() {
  if (fileList.value.length === 0) {
    routerProvider?.message.error(t('vxe.upload.dragPlaceholder'))
    return
  }

  const file = fileList.value[0].raw

  try {
    const fileContent = await readFileAsText(file)
    const data = JSON.parse(fileContent)
    console.log('JSON Data', data)
    jsonData.value = data
    mode.value = 'confirm'
  } catch (error) {
    console.error('Error reading file:', error)
    routerProvider?.message.error('Failed to read or parse JSON file')
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => {
      reject(new Error('File reading error'))
    }
    reader.readAsText(file)
  })
}

const userGroupRef = ref()
const userRoleRef = ref()
const documentTemplateRef = ref()
const emailTemplateRef = ref()
const folderCabinetRef = ref()
const idGeneratorRef = ref()
const masterTableRef = ref()
const workflowRef = ref()
const caseRef = ref()
const homePageRef = ref()

function handleCancel() {
  fileList.value = []
  mode.value = 'upload'
}

async function handleSubmit() {
  try {
    if (Object.keys(jsonData.value.userGroup).length > 0) {
      const userGroupResult = await userGroupRef.value.handleCreateUserGroup()
    }

    if (Object.keys(jsonData.value.userRole).length > 0) {
      const userRoleResult = await userRoleRef.value.handleCreateUserRole()
    }

    let idGeneratorResult = []
    if (Object.keys(jsonData.value.idGenerator).length > 0) {
      idGeneratorResult = await idGeneratorRef.value.handleCreateIdGenerator()
    }

    let documentTemplateResult = []
    if (Object.keys(jsonData.value.documentTemplate).length > 0) {
      documentTemplateResult = await documentTemplateRef.value.handleCreateDocumentTemplate()
    }

    let emailTemplateResult = []
    if (Object.keys(jsonData.value.emailTemplate).length > 0) {
      emailTemplateResult = await emailTemplateRef.value.handleCreateEmailTemplate()
    }

    // TODO: 不需要打開
    // const folderCabinetResult = await folderCabinetRef.value.handleCreateFolderCabinet()

    let masterTableResult = []
    if (Object.keys(jsonData.value.masterTable).length > 0) {
      masterTableResult = await masterTableRef.value.handleCreateMasterTable()
    }

    let caseResult = []
    if (Object.keys(jsonData.value.case).length > 0) {
      caseResult = await caseRef.value.handleCreateCase()
    }

    let workflowResult = []
    if (Object.keys(jsonData.value.workflow).length > 0) {
      workflowResult = await workflowRef.value.handleCreateWorkflow(caseResult, masterTableResult, documentTemplateResult,
        emailTemplateResult, idGeneratorResult)
    }

    if (workflowResult.length > 0 && caseResult.length > 0) {
      await caseRef.value.updateDesign(caseResult, workflowResult, masterTableResult)
    }

    if (Object.keys(jsonData.value.homePage).length > 0) {
      await homePageRef.value.handleCreateHomePage()
    }

  } catch (e) {
    console.log(e)
  }

  mode.value = 'upload'
  fileList.value = []
}

</script>

<template>
  <template v-if="mode ==='upload'">
    <h3>import data</h3>
    <div style="width: 400px">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        action="#"
        v-model:file-list="fileList"
        drag
        accept=".json"
        :limit="1"
        :auto-upload="false"
        :on-exceed="handleExceed"
        :on-change="handleChange"
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <template #tip>
          <div class="el-upload__tip">
            {{ $t('Only supports JSON files') }}
          </div>
        </template>
      </el-upload>
      <el-button @click="handleConfirm" type="primary">{{ $t('confirm') }}</el-button>
    </div>
  </template>

  <template v-if="mode === 'confirm'">
    <div v-if="!!jsonData">
      <div v-if="Object.keys(jsonData.case).length > 0">
        <h3>Case</h3>
        <LazyConfigMigrationComponentsCase ref="caseRef" :caseList="jsonData.case" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.workflow).length > 0">
        <h3>Workflow</h3>
        <LazyConfigMigrationComponentsWorkflow ref="workflowRef" :workflowList="jsonData.workflow" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.masterTable).length > 0">
        <h3>Master Table</h3>
        <LazyConfigMigrationComponentsMasterTable ref="masterTableRef" :masterTableList="jsonData.masterTable" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.idGenerator).length > 0">
        <h3>ID Generator</h3>
        <LazyConfigMigrationComponentsIdGenerator ref="idGeneratorRef" :idGeneratorList="jsonData.idGenerator" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.homePage).length > 0">
        <h3>Home Page</h3>
        <LazyConfigMigrationComponentsHomePage ref="homePageRef" :homePageList="jsonData.homePage" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.userGroup).length > 0">
        <h3>User Group</h3>
        <LazyConfigMigrationComponentsUserGroup ref="userGroupRef" :userGroupList="jsonData.userGroup" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.userRole).length > 0">
        <h3>User Role</h3>
        <LazyConfigMigrationComponentsUserRole ref="userRoleRef" :userRoleList="jsonData.userRole" />
      </div>

      <div v-if="Object.keys(jsonData.documentTemplate).length > 0">
        <h3>Document Template</h3>
        <LazyConfigMigrationComponentsDocumentTemplate ref="documentTemplateRef"
                                                       :documentTemplateList="jsonData.documentTemplate" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.emailTemplate).length > 0">
        <h3>Email Template</h3>
        <LazyConfigMigrationComponentsEmailTemplate ref="emailTemplateRef"
                                                    :emailTemplateList="jsonData.emailTemplate" />
        <el-divider />
      </div>

      <div v-if="Object.keys(jsonData.folderCabinet).length > 0">
        <h3>Folder Cabinet</h3>
        <LazyConfigMigrationComponentsFolderCabinet ref="folderCabinetRef"
                                                    :folderCabinetList="jsonData.folderCabinet" />
        <el-divider />
      </div>

      <el-button @click="handleCancel">{{ $t('dpButtom_cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit">{{ $t('submit') }}</el-button>
    </div>
  </template>
</template>

<style lang="scss" scoped>
</style>
