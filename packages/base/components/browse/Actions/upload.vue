<template>
  <div class="actionIconContainer">
    <!-- <SvgIcon src="/icons/file/upload.svg" round content="upload"
            @click="uploadDialog"></SvgIcon> -->
    <BrowseActionsButton id="uploadActionButton" :label="$t('tip.upload')" @click="uploadDialog(doc)">
      <el-tooltip content="upload">
        <el-icon>
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor"
                  d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64zm384-578.304V704h-64V247.296L237.248 490.048 192 444.8 508.8 128l316.8 316.8-45.312 45.248L544 253.696z"></path>
          </svg>
        </el-icon>
      </el-tooltip>
    </BrowseActionsButton>
    <el-dialog v-model="dialogOpened" append-to-body class="browseUploadDialog">
      <template #header>
        <strong class="primaryTitle">{{ $t('filePopover_newFiles') }}</strong>
        {{ 'in ' + state._doc.path }}
      </template>
      <FileUpload class="sidebar"
                  :accept="accept" @change="tableDataAdd"></FileUpload>
      <div class="header">
        <span>{{ $t('filePopover_batchTip') }}</span>
        <el-select v-model="state.documentType" class="el-icon--right" filterable default-first-option>
          <el-option v-for="item in state.fileTypes" :key="item.name" :value="item.name"
                     :label="$t(item.name)"></el-option>
        </el-select>
        <el-button class="el-icon--right" @click="applyToSelect('documentType', state.documentType)">
          {{ $t('dpButtom_apply') }}
        </el-button>
      </div>
      <div class="main">
        <Table :columns="tableSetting.columns"
               :table-data="state.tableData"
               :options="state.options"
               v-loading="state.loading"
               @command="handleAction"
               @row-dblclick="handleDblclick"
               @expand-change="handleExpand"
               @selection-change="handleSelectionChange">
          <template #documentType="{ row }">
            <el-select v-model="row.type" filterable default-first-option
                       @change="handleDocTypeChange(row)">
              <el-option v-for="item in state.fileTypes" :key="item.name" :value="item.name"
                         :label="item.name"></el-option>
            </el-select>
          </template>
          <template #expand="{ row }">
            <div class="row-expand">
              <div class="row-expand-top">
                <span class="color__danger">*</span>
                {{ $t('dpDocument_fileName') }}
              </div>
              <el-input class="row-expand-bottom-left" type="text" v-model="row.fileName" />
              <div class="row-expand-bottom-right"></div>
            </div>
            <div v-for="(item, index) in row.metaList" :key="item.metaData+index" class="row-expand">
              <template v-if="item.display">
                <div class="row-expand-top">
                  <span class="color__danger" v-if="item.isRequire">*</span>
                  {{ item.metaData }}
                </div>
                <template v-if="item.dataType === 'date'">
                  <el-date-picker v-model="item.value"
                                  type="datetime"
                                  :placeholder="$t('dpTip_datePicker')"
                                  :default-time="defaultTime"
                                  value-format="YYYY-MM-DDTHH:mm:ss.000Z"
                                  class="row-expand-bottom-left"
                                  style="width: 100%"></el-date-picker>
                </template>
                <template v-else-if="!!item.directoryEntries">
                  <el-cascader v-model="item.value"
                               :options="item.directoryEntries"
                               :props="{ checkStrictly: item.hasChild, value: 'id', label: 'id' }"
                               clearable filterable popper-class="pc-cascader"
                               class="row-expand-bottom-left"
                               style="width: 100%"></el-cascader>
                </template>
                <template v-else>
                  <el-input class="row-expand-bottom-left" type="text" v-model="item.value"
                            :maxlength="item.length" show-word-limit />
                </template>
                <el-button class="row-expand-bottom-right"
                           @click="applyToSelect(item.metaData,item.value, item.documentType)">
                  {{ $t('dpButtom_apply') }}
                </el-button>
              </template>
            </div>
          </template>
        </Table>
      </div>
      <template #footer>
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{ $t('confirmText') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEventListener } from '@vueuse/core'

import { clientApi } from 'api'

const emits = defineEmits(['success'])
const dialogOpened = ref(false)

const props = defineProps<{
  doc?: any,
  accept?: string
}>()
const state = reactive({
  loading: false,
  options: {
    expandedRowKeys: [],
    rowKey: 'id'
  },
  selectedRows: [],
  documentType: '',
  fileTypes: [],
  tableData: [],
  _doc: {
    path: ''
  }
})

function uploadDialog(doc) {
  dialogOpened.value = true
  state.tableData = []
  state.selectedRows = []
  state._doc = doc
}

// #region module: table

import tableSetting from './uploadTableSetting.ts'

function tableDataAdd(list: Array) {
  list.forEach(async (item, index) => {
    const fileMetaList = await metaListGet('File', item.name)
    const tableItem = {
      id: new Date().valueOf() + '' + index,
      fileName: item.name,
      initName: item.name,
      type: 'File',
      languages: [],
      metaList: deepCopy(fileMetaList),
      raw: item.file
    }
    state.tableData.push(tableItem)

  })
}

function handleDblclick(row) {
}

function handleAction(command, row: any, index: number) {
  switch (command) {
    case 'delete':
      removeFiles([row.id])
      break
    default:
      break
  }
}

function removeFiles(ids) {
  state.tableData = state.tableData.filter(item => !ids.includes(item.id))
}

function handleExpand(row: any, expandRows: any) {
  const result = expandRows.reduce((prev, item) => {
    prev.push(item.id)
    return prev
  }, [])
  state.options.expandedRowKeys = result
}

function handleSelectionChange(rows) {
  state.selectedRows = rows
}

async function handleDocTypeChange(row) {
  const metaList = await metaListGet(row.type, row.fileName)
  row.metaList = deepCopy(metaList)
}

async function metaListGet(documentType: string, name) {
  const { data } = await clientApi.api.getWorkflowQuerymetavalidationrule({ entity: { documentType } })

  if (!data) return []
  data.forEach(item => {
    if (item.metaData === 'dc:title') {
      item.value = name
    } else if (item.directoryEntries) {
      item.directoryEntries = handleChildOptions(item.directoryEntries)
      item.value = []
    } else item.value = ''
  })
  return data
}

function handleChildOptions(list = []) {
  const result = []
  const keyNodes = {}

  const nodeList = list.map(node => {
    const clone = { ...node }
    keyNodes[clone.id] = clone
    return clone
  })
  nodeList.forEach(node => {
    const parentItem = keyNodes[node.properties.parent]
    if (parentItem) {
      parentItem.hasChild = true
      if (!parentItem.children) parentItem.children = []
      parentItem.children.push(node)
    } else result.push(node)
  })
  return result
}

function applyToSelect(key: string, value: string, docType?: string) {
  state.loading = true
  if (key === 'documentType') {
    state.selectedRows.forEach(async (item) => {
      const metaList = await metaListGet(value, item.fileName)
      item.type = value
      item.metaList = deepCopy(metaList)
    })
  } else {
    state.tableData.forEach((item) => {
      if (item.type === docType) {
        const index = item.metaList.findIndex(metaItem => metaItem.metaData === key)
        if (index !== -1) item.metaList[index].value = value
      }
    })
  }
  setTimeout(() => {
    state.loading = false
  }, 500)
}

// #endregion
function validateForm() {
  let msg = ''
  for (const item of state.tableData) {
    if (!item.metaList) return
    item.metaList.forEach(metaItem => {
      if (!metaItem.display) return
      if (metaItem.isRequire && !metaItem.value) msg += `${item.fileName}[${metaItem.metaData}]: ${$i18n.t('common_canNotEmpty')}<br/>`
    })
  }

  if (msg.length > 0) {
    ElMessageBox.confirm(msg, $i18n.t('dpTip_warning'), {
      dangerouslyUseHTMLString: true,
      confirmButtonText: $i18n.t('dpButtom_confirm')
    })
  }

  return msg.length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  state.loading = true
  try {
    const { list, isDuplicate } = await duplicateNameFilter(state._doc.path, state.tableData)
    if (isDuplicate) {
      state.loading = false
      handleDuplicate(list)
      return
    }
    const promiseList = []
    state.tableData.forEach(row => {
      promiseList.push(handleCreateDocument(row))
    })
    await waitAll(promiseList)
  } catch (error) {
    console.log(error)
    if (error.message === 'dpTip_duplicateFileName') {
      ElMessage({
        message: $i18n.t(error.message) as string,
        type: 'error'
      })
    }
  }
  setTimeout(() => {
    dialogOpened.value = false
    state.loading = false
  }, 100)
}

async function handleDuplicate(list) {
  const action = await ElMessageBox.confirm($i18n.t('dpTip_duplicateFileName'), {
    distinguishCancelAndClose: true,
    confirmButtonText: $i18n.t('dpButtom_keepFile'),
    cancelButtonText: $i18n.t('dpButtom_replace'),
    class: 'customDriverBackdropPlus'
  }).catch((action) => {
    return action
  })
  const pList = []
  state.loading = true
  if (action === 'confirm') {
    list.forEach((file) => {
      pList.push(handleCreateDocument(file))
    })
  } else if (action === 'cancel') {
    list.forEach(async (file) => {
      if (file.isDuplicate) pList.push(handleReplaceDocument(file))
      else pList.push(handleCreateDocument(file))
    })
  }
  await waitAll(pList)
}

const handleCreateDocument = async (file) => {
  if (file.isDuplicate) file.fileName = await getUniqueName(file)
  const parentPath = state._doc.path === '/' ? '' : state._doc.path
  const document = {
    name: file.fileName,
    idOrPath: `${parentPath}/${file.fileName}`,
    type: file.type,
    languages: file.languages,
    fileModifiedTimestamp: file.lastModified,
    properties: file.metaList.reduce((prev, metaItem) => {
      if (metaItem.value) prev[metaItem.metaData] = metaItem.value
      return prev
    }, {})
  }
  const formData = new FormData()

  formData.append('files', file.raw)
  formData.append('document', JSON.stringify(document))
  return clientApi.api.postDmsDocument(formData).then((res) => {
    return !!res
  })
}

async function handleReplaceDocument(file) {
  const document = {
    idOrPath: file.originalPath
  }
  const formData = new FormData()
  formData.append('file', file.raw)
  formData.append('document', JSON.stringify(document))
  const res = await clientApi.api.patchDmsDocumentContent(formData)
  return !!res
}

async function waitAll(promiseList: any) {
  const res = await Promise.all(promiseList)
  const successList = []
  res.forEach((item, index) => {
    if (item) successList.push(index)
    else
      routerProvider?.message.error(
        `${state.tableData[index].name} ${$i18n.t('msg_uploadFailed')}`
      )
  })
  if (successList.length === state.tableData.length) {
    dialogOpened.value = false
    state.tableData = []
  } else {
    let flag = 0
    successList.forEach((index) => {
      state.tableData.splice(index - flag, 1)
      flag++
    })
  }
  emits('success', state._doc)
  state.loading = false
}

onMounted(async () => {
  useEventListener(document, 'docActionAddFile', (event) => uploadDialog(event.detail))
  const data: any = await adminApi.api.getDmsDocpalTypeActive().then(r => r.data)
  state.fileTypes = data?.sort((a: any, b: any) => (a.name.localeCompare(b.name))).filter((item) => !item.isFolder)
})
</script>
<style lang="scss" scope="this api replaced by slot-scope in 2.5.0+">
.browseUploadDialog {
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .el-dialog__body {
    display: grid;
    grid-template-areas:
        'sidebar header'
        'sidebar main';
    grid-template-rows: min-content 1fr;
    grid-template-columns: min-content 1fr;
    row-gap: 0.5rem;
    column-gap: 1rem;
    height: 70vh;
    padding: 0 calc(var(--app-space-xs) * 2) var(--app-space-xs);
  }

  .sidebar {
    grid-area: sidebar;
    min-width: 200px;
  }

  .header {
    min-height: 1rem;
    grid-area: header;
  }

  .main {
    grid-area: main;
    overflow: hidden;
  }
}

.row-expand {
  padding: 0 var(--app-space-xs) 0 calc(var(--app-space-xs) * 5);
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-template-rows: min-content min-content;
  grid-column-gap: var(--app-space-xs);

  &-top {
    padding: var(--app-space-xs) 0;
    grid-area: 1 / 1 / 2 / 3;
  }

  &-bottom-left {
    grid-area: 2 / 1 / 3 / 2;
  }

  &-bottom-right {
    grid-area: 2 / 2 / 3 / 3;
    min-width: 1px;
  }
}
</style>
