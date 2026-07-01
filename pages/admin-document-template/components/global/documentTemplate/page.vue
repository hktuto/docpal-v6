<script lang="ts" setup>
import { provide, ref, toRefs } from 'vue'
import { DocumentTemplateListTable } from '#components'
import { newAdminApi, newClientApi } from 'api'
import { DocumentTemplateProviderKey } from '~/utils/documentTemplateHelper'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const { t } = useI18n()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw createError('MenuRouterKey is not provided')
}

const props = defineProps<{
  pageNum: number
  pageSize: number
  orderBy: string
  isDesc: boolean
  filters?: any
}>()
const { pageNum, pageSize, isDesc, orderBy, filters } = toRefs(props)

const tableRef = ref<InstanceType<typeof DocumentTemplateListTable>>()
const filterFormdata = ref()
const ResponsiveFilterRef = ref()

function handleFilterFormChange(formData: any) {
  filterFormdata.value = formData
  tableRef.value?.reload()
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'documentTemplate_Creator', value: 'createdBy' },
        { label: 'documentTemplate_Name', value: 'name' },
        { label: 'info_type', value: 'fileType' },
        { label: 'workflow_createDate', value: 'createdDate' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  ]
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
  if (filters.value) {
    filterFormdata.value = filters.value
    ResponsiveFilterRef.value?.setValue('name', filters.value.name)
  }
})

// const dialogRef = ref()
function handleAdd() {
  TemplateAddStep1DialogRef.value.handleOpen()
}

const TemplateReplaceDialogRef = ref()

async function handleReplace(row: any) {
  TemplateReplaceDialogRef.value.handleOpen(row)
}

function officeUrl(docId: string, token: string) {
  let host = window.location.host.replace('admin.', '')
  if (!host.includes('localhost')) {
    return `https://office.${host}/browser/85ac843/cool.html?WOPISrc=https://office.${host}/wopi/files/${docId}?access_token=${token}`
  } else {
    return `https://office.app4.wclsolution.com/browser/85ac843/cool.html?WOPISrc=https://office.app4.wclsolution.com/wopi/files/${docId}?access_token=${token}`
  }
}

async function handleEdit(row: any) {
  const token = await newClientApi.getGetofficetokenId(row.documentId, { fileType: 'NUXEO' }).then(r => r.data)
  const baseUrl = officeUrl(row.documentId, token)
  window.open(baseUrl, '_blank')
}

const TemplateAddStep1DialogRef = ref()

function handleEditInfo(row: any) {
  TemplateAddStep1DialogRef.value.handleOpen({ ...row, isEdit: true })
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('documentTemplate_deleteMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    await newAdminApi.deleteDmsTemplateDocumentId(row.id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('adminMenu.template') }))

    tableRef.value?.reload()
  } catch (error) {
    console.log(error)
  }
}

async function handleDownload(row: any) {
  const id = new Date().valueOf() + row.name
  const notification = ElNotification({
    title: '',
    icon: Download,
    dangerouslyUseHTMLString: true,
    message: `<span id="${id}">0%</span> <span title="${row.name}">${row.name}</span>`,
    showClose: false,
    customClass: 'download-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const blob = await newAdminApi.postDmsDocumentDownload(
      { idOrPath: row.documentId },
      {
        format: 'blob',
        timeout: 0,
        onDownloadProgress: (e: any) => {
          const el = document.getElementById(id)
          if (el) el.innerHTML = Math.round((e.loaded / e.total) * 100) + '%'
        }
      }
    )
    await downloadBlob(blob, row.name)
  } catch (error) {
    routerProvider?.message.error(t('download_noFile') as string)
  } finally {
    notification.close()
  }
}

provide(DocumentTemplateProviderKey, {
  getListApi: async (params: any) => {
    let filters: any = undefined
    if (filterFormdata.value) {
      Object.keys(filterFormdata.value).forEach((key) => {
        if (filterFormdata.value[key]) params[key] = filterFormdata.value[key]
      })
      filters = { ...filterFormdata.value }
    }
    routerProvider?.updateProps({
      pageNum: params.pageNum + 1,
      pageSize: params.pageSize,
      orderBy: params.orderBy,
      isDesc: params.isDesc,
      filters
    })
    return newAdminApi.postDmsTemplateDocumentPage(params)
  },
  dblClickHandle: (row: any) => {
    const item = createNewDocumentTemplateDetail(row, true)
    routerProvider?.navigateTo(item)
  },
  handleReplace,
  handleEdit,
  handleEditInfo,
  handleDelete,
  handleDownload,
  actionPermission: (args: PermissionMethodParams) => {
    if (args.code === 'edit') {
      return { visible: true, disabled: args.row.fileType === 'PDF' }
    }
    return { visible: true, disabled: false }
  }
})
</script>

<template>
  <div class="pageContainer--padding">
    <DocumentTemplateListTable ref="tableRef" v-bind="props">
      <template #toolbar_buttons>
        <div class="actionsContainer">
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name"
                            inputPlaceHolder="documentTemplate_Filter" />
          <div class="button-add">
            <el-button id="DocumentTemplate__CreateNewDocumentTemplate" type="primary" @click="handleAdd">
              {{ $t('documentTemplate_Create') }}
            </el-button>
          </div>
        </div>
      </template>
    </DocumentTemplateListTable>
    <TemplateAddStep1Dialog ref="TemplateAddStep1DialogRef" @update="tableRef?.reload" />
    <TemplateReplaceDialog ref="TemplateReplaceDialogRef" @refresh="tableRef?.reload" />
  </div>
</template>

<style lang="scss" scoped>
.actionsContainer {
  width: 100%;
  display: flex;
}

:deep(.el-input) {
  width: 250px;
}
</style>
