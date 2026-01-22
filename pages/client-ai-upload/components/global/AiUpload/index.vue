<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="fileName" inputPlaceHolder="tip.fileOrFolderName" />
      </template>
      <template #path="{ row, index }">
        <path-tab-button :path="row.nuxeoPath" :displayPath="row.uploadPath" :canOpen="row.nuxeoPath" />
      </template>
      <template #status="{ row, index }">
        <el-tag :type="getTagType(row.uploadStatus)">
          {{ $t(`ai.status.${row.uploadStatus}`) }}
        </el-tag>
      </template>
    </VxeGrid>
    <AiUploadPreviewDialog ref="AiUploadPreviewDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { useVxeTable } from '#imports'
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { createAiUploadDetail } from '../../../utils/aiUpoloadHelper'

const routerProvider = inject(MenuRouterKey)

const { t } = useI18n()
const userId = useUserId()

// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()
const extraParams = ref<any>({})

async function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'document_path', value: 'uploadPath' },
        { label: 'tableHeader_filesCount', value: 'filesCount' },
        { label: 'document_uploadDate', value: 'createdDate' },
        { label: 'document_uploadStatus', value: 'uploadStatus' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.desc', value: true },
        { label: 'tableHeader.asc', value: false }
      ]
    },
    {
      key: 'fileUploadStatus',
      label: 'document_uploadStatus',
      type: 'string',
      options: [
        { label: 'ai.status.Prepare', value: 'Prepare' },
        { label: 'ai.status.Ready', value: 'Ready' },
        { label: 'ai.status.Confirmed', value: 'Confirmed' },
        { label: 'ai.status.Canceled', value: 'Canceled' }
        // { label: 'Progress', value: 'Progress' },
      ]
    }
  ]
  ResponsiveFilterRef.value.init(data)
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams.value = formModel
  reload()
}

// #endregion

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'client-ai-upload',
  api: async (pageParams: any) => {
    if (!pageParams.orderBy) {
      pageParams.orderBy = 'createdDate'
      pageParams.isDesc = true
    }

    pageParams.userId = userId.value
    console.log('extraParams', extraParams.value)
    if (extraParams.value) {
      pageParams = {
        ...pageParams,
        ...extraParams.value
      }
    }
    const response = await clientApi.api.postDmsUploadQuery(pageParams).then(r => r.data)
    return {
      data: {
        entryList: response.content,
        totalSize: response.totalElements
      }
    }
  },
  defaultSort: { field: 'createdDate', order: 'desc' },
  rowKey: 'id',
  columns: [
    {
      title: 'document_path',
      field: 'uploadPath',
      slots: {
        default: 'path'
      }
    },
    {
      field: 'createdDate',
      title: 'document_uploadDate',
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      title: 'tableHeader_filesCount',
      field: 'filesCount'
    },
    {
      field: 'uploadStatus',
      title: 'document_uploadStatus',
      slots: {
        default: 'status'
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    dblclickHandler(row)
  },
  permissionMethod: ({ row, code, column }) => {
    if (!row) {
      return { visible: false, disabled: false }
    }
    if (code === 'delete') {
      return {
        visible: row.uploadStatus === 'Ready',
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  bodyActions: [
    [
      {
        code: 'open',
        name: 'Open',
        action: ({ row }: any) => {
          dblclickHandler(row)
        }
      },
      {
        code: 'showStructure',
        name: 'Show Structure',
        action: ({ row }: any) => {
          showStructure(row)
        }
      },
      {
        code: 'delete',
        name: 'Delete',
        action: ({ row }: any) => {
          handleDelete(row.uploadId)
        }
      }
    ]
  ]
})

function dblclickHandler(row: any) {
  if (row.uploadStatus === 'Ready') {
    const item = createAiUploadDetail({
      id: row.uploadId,
      status: row.uploadStatus
    })
    routerProvider?.navigateTo(item)
  } else {
    showStructure(row)
  }
}

// #region module: page

function getTagType(status) {
  const map = {
    Prepare: 'info',
    Ready: '',
    Confirmed: 'success',
    Canceled: 'danger',
    Error: 'info'
  }
  return map[status] || map[status] === '' ? map[status] : 'warning'
}

async function handleDelete(id: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToCancel')}`, {
      confirmButtonText: t('dpButtom_confirm'),
      cancelButtonText: t('common_close')
    })
    if (action !== 'confirm') return
    const formData = new FormData()
    formData.append('userId', userId.value)
    formData.append('uploadId', id)
    console.log('formData', formData, id, userId.value)
    await clientApi.api.postDmsUploadCancel({},{ userId: userId.value, uploadId: id }).then(r => r.data)
    reload()
  } catch (error) {
    console.log(error)
  }
}

const AiUploadPreviewDialogRef = ref()

function showStructure(row) {
  AiUploadPreviewDialogRef.value.handleOpen(row)
}

onMounted(() => {
  getFilter()
})
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 250px;
}
</style>
