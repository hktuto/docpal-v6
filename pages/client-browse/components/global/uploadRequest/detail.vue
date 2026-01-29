<script lang="ts" setup>
import { CircleCheckFilled, WarningFilled, Download } from '@element-plus/icons-vue'
import { createUploadRequestPageParams } from '../../../utils/browseMenuHelper'
import { clientApi } from 'api'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
const props = defineProps(['paramKey', 'id'])
const router = useRouter()
const state = reactive<any>({
  applyDocumentType: '',
  fileTypes: [],
  errorFileNum: 0,
  loading: false,
  submitLoading: false,
  selectedRow: {},
  selectedRows: [],
  detail: {
    email: '',
    documentId: '',
    submittedDate: ''
  },
  checkAll: false,
  tableData: []
})
const MetaFormRef = ref()
const paramKey = (props.paramKey ? props.paramKey : 'processInstanceId') as string

// #region module: 1. table and init
async function getData() {
  state.loading = true
  try {
    const response: any = await clientApi.api.postWorkflowProperties({ [paramKey]: props.id }).then((res) => res.data)
    const index = response.findIndex((item: any) => item.id === 'files')
    if (index !== -1) state.tableData = await revertUploadFile(response[index].value)
    if (state.tableData.length > 0) handleDblclick(state.tableData[0])
    // 从properties获取email,documentId,submittedDate
    getRQDetail(['email', 'documentId', 'submittedDate'], response)
  } catch (error) {
    state.tableData = []
    state.selectedRow = []
  } finally {
    state.loading = false
  }

  function getRQDetail(keys: any[], propsArr: any[]) {
    keys.forEach((key) => {
      const index = propsArr.findIndex((item) => item.id === key)
      state.detail[key] = propsArr[index].value
    })
  }

  async function revertUploadFile(fileIds: string) {
    const pList: any = []
    const result: any = []
    if (!fileIds) return result
    const ids: string[] = fileIds.split(',')
    for (const item of ids) {
      const pItem = clientApi.api.getWorkflowTaskAttachmentInfo({ attachmentId: item }).then((res) => res.data)
      pList.push(pItem)
    }
    const response = await Promise.all(pList)
    state.errorFileNum = 0
    response.forEach((item) => {
      if (!!item) {
        result.push({
          id: item.contentId,
          name: item.name,
          initName: item.name,
          approved: true,
          documentType: 'File'
        })
      } else state.errorFileNum++
    })
    return result
  }
}

// #endregion
// #region module: 4. handleSubmit
const formRef = ref()

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }
  state.submitLoading = true
  try {
    const param = {
      [paramKey]: props.id,
      properties: {
        approved: getParams()
      }
    }
    const res = await clientApi.api.postWorkflowFormSubmit(param).then((res: any) => res.result)
    if (!!res) routerProvider?.navigateTo(createUploadRequestPageParams({}))
  } catch (error) {}
  state.submitLoading = false
}

function getParams() {
  const result: any = {}
  state.tableData.forEach((item: any) => {
    result[item.id] = {
      approved: item.approved,
      documentType: item.documentType,
      properties: { ...item.properties, 'dc:title': getFileName(item.name) }
    }
  })
  return JSON.stringify(result)
}

function getFileName(name: any) {
  const result = `[${state.detail.submittedDate} ${state.detail.email}] ${name}`
  return result
}

// #endregion

// #region module: 3.1 applyToSelect change
async function handleDocTypeChange(row: any) {
  if (MetaFormRef) await MetaFormRef.value.init(row.documentType)
}

function handleMetaChange(data: any) {
  if (!state.loading) state.selectedRow.properties = deepCopy(data.formModel)
}

const treeRef = ref()

function applyToSelect(key: string, value: string, docType?: string) {
  state.selectedRows = treeRef.value.getCheckedNodes()
  state.loading = true
  if (key === 'documentType') {
    state.selectedRows.forEach(async (item: any) => {
      item.documentType = value
      item.properties = {}
      console.log('applyToSelect', '???')
    })
  }
  handleDocTypeChange(state.selectedRow)
  setTimeout(() => {
    state.loading = false
  }, 500)
}

function handleApply(formModel: any) {
  state.tableData.forEach((item: any) => {
    if (item.documentType === state.selectedRow.documentType) {
      if (!item.properties) item.properties = {}
      item.properties[formModel.name] = formModel.value
      console.log('handleApply', '???')
    }
  })
}

// #endregion
// #region module: 2. previewFile
const previewFile = reactive<any>({
  blob: null,
  name: '',
  id: '',
  loading: false,
  downloadLoading: false,
  options: {
    readOnly: true
  }
})

async function handleDblclick(row: any) {
  getPreview()
  state.loading = true
  state.selectedRow = row
  await handleDocTypeChange(row)
  if (state.selectedRow.properties) await MetaFormRef.value.setData(state.selectedRow.properties)
  setTimeout(() => {
    state.loading = false
  }, 1000)

  async function getPreview() {
    previewFile.loading = true
    try {
      previewFile.name = row.initName
      previewFile.blob = await clientApi.api.getWorkflowTaskAttachmentPreview(
        { attachmentId: row.id },
        {
          format: 'blob'
        }
      )
    } catch (error) {}
    previewFile.loading = false
    previewFile.id = row.id
  }
}

async function handleDownload(file: any) {
  try {
    file.downloadLoading = true
    const blob: any = await clientApi.api.getWorkflowTaskAttachment(
      { attachmentId: file.id },
      {
        format: 'blob'
      }
    )
    downloadBlob(blob, file.name || file.title, blob.type)
  } catch (error) {
  } finally {
    file.downloadLoading = false
  }
}

// #endregion
// #region module: 3.2 handleCheckChange
function handleCheckAll(value: boolean) {
  if (value) treeRef.value.setCheckedKeys(state.tableData.map((item: any) => item.id))
  else treeRef.value.setCheckedKeys([])
}

function handleCheckChange() {
  state.selectedRows = treeRef.value.getCheckedNodes()
  if (state.selectedRows.length === state.tableData.length) state.checkAll = true
  else state.checkAll = false
}

// #endregion
onMounted(() => {
  getData()
})
onMounted(async () => {
  const res: any = await clientApi.api.getDmsDocpalTypeActive().then((res) => res.data)
  state.fileTypes = res.filter((item: any) => !item.isFolder)
})
</script>
<template>
  <div class="pageContainer--padding uploadRequest-detail">
    <div class="left-top">
      <div class="flex-x-between">
        <el-select v-model="state.applyDocumentType" filterable default-first-option>
          <el-option v-for="item in state.fileTypes" :key="item.name" :value="item.name" :label="item.name"></el-option>
        </el-select>
        <el-button class="el-icon--right" @click="applyToSelect('documentType', state.applyDocumentType)">{{ $t('dpButtom_apply') }} </el-button>
      </div>
    </div>
    <div class="left-bottom">
      <el-checkbox v-model="state.checkAll" @change="handleCheckAll">{{ $t('button.selectAll') }} </el-checkbox>
      <el-tree
        ref="treeRef"
        :data="state.tableData"
        show-checkbox
        node-key="id"
        default-expand-all
        highlight-current
        :current-node-key="state.selectedRow.id"
        :expand-on-click-node="false"
        @node-click="handleDblclick"
        @check-change="handleCheckChange"
      >
        <template #default="{ node, data }">
          <div class="flex-x-between tree-item">
            <div class="tree-item--title ellipsis" :title="data.name">
              {{ data.name }}
            </div>
            <div class="tree-item--right">
              <div class="tree-item--documentType ellipsis" :title="data.documentType">
                {{ data.documentType }}
              </div>
              <el-icon v-if="data.approved" color="#529b2e">
                <CircleCheckFilled />
              </el-icon>
              <el-icon v-else color="#c45656">
                <WarningFilled />
              </el-icon>
            </div>
          </div>
        </template>
      </el-tree>
    </div>
    <div class="middle-top flex-x-end">
      <el-button type="info" :icon="Download" :loading="previewFile.downloadLoading" @click="handleDownload(previewFile)">
        {{ $t('download') }}
      </el-button>
      <el-button type="primary" :loading="state.submitLoading" @click="handleSubmit">
        {{ $t('submit') }}
      </el-button>
    </div>
    <div class="middle-bottom">
      <el-form ref="formRef" :model="state.selectedRow" label-position="top">
        <el-form-item
          :label="$t('dpDocument_fileName')"
          prop="name"
          :rules="[{ required: true, message: $t('dpDocument_fileName') + $t('render.hint.fieldRequired') }]"
        >
          <el-input v-model="state.selectedRow.name" />
        </el-form-item>
        <el-form-item :label="$t('dpTool_approve')" prop="approved">
          <el-switch v-model="state.selectedRow.approved" />
        </el-form-item>
        <el-form-item :label="$t('dpDocument_fileType')" prop="documentType">
          <el-select v-model="state.selectedRow.documentType" filterable default-first-option @change="handleDocTypeChange(state.selectedRow)">
            <el-option v-for="item in state.fileTypes" :key="item.name" :value="item.name" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <MetaRenderForm2 ref="MetaFormRef" mode="fileRequest" @formChange="handleMetaChange" @handleApply="handleApply"></MetaRenderForm2>
    </div>
    <el-card class="right">
      <div class="flex-x-between">
        <div>{{ previewFile.name }}</div>
      </div>
      <Reader ref="ReaderRef" v-bind="previewFile"></Reader>
    </el-card>
  </div>
</template>
<style lang="scss" scoped>
.uploadRequest-detail {
  display: grid;
  grid-template-columns: 300px 1fr 1fr;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);

  .left-top {
    grid-area: 1 / 1 / 2 / 2;
  }

  .left-bottom {
    grid-area: 2 / 1 / 3 / 2;
    overflow: auto;
  }

  .middle-top {
    grid-area: 1 / 2 / 2 / 3;
    padding: 0 12px;
  }

  .middle-bottom {
    grid-area: 2 / 2 / 3 / 3;
    overflow: auto;
  }

  .right {
    grid-area: 1 / 3 / 3 / 4;
  }
}

.tree-item {
  width: 100%;

  &--title {
    max-width: 120px;
  }

  &--right {
    display: flex;
    align-items: center;
    gap: var(--app-input-padding);
  }

  &--documentType {
    max-width: 100px;
  }
}

.right :deep(.el-card__body) {
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  height: 100%;
}

:deep(.el-row) {
  margin: unset !important;
}

.el-form {
  padding: 0 12px;
}
</style>
