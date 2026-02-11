<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
      </template>
    </VxeGrid>
    <ShareDialog ref="shareInfoDialogRef" @submit="handleSubmit"></ShareDialog>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const ResponsiveFilterRef = ref()
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'c-share',
  api: async (pageParams: any) => {
    const params = {
      ...pageParams,
      page: pageParams.pageNum,
      size: pageParams.pageSize
    }
    delete params.pageNum
    delete params.pageSize
    const res: any = await newClientApi.postDmsSharePage({ ...params, ...extraParams }).then((res) => res.data)
    return {
      data: {
        entryList: res.list,
        totalSize: res.total
      }
    }
  },
  columns: [
    { field: 'recipients', title: 'tableHeader_emailList', fixed: 'left' },
    { field: 'documentSize', title: 'tableHeader_numberOfFiles' },
    {
      field: 'created',
      title: 'externalSharing_creationDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'expiredDate',
      title: 'externalSharing_expiryDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('externalSharing_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: t('externalSharing_delete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDisabled(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

async function handleDisabled(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('externalSharing_deleteMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    const param = []
    param.push(row.shareID)
    await newClientApi.deleteDmsShare(param).then(r => r.data)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('externalSharing_sharingRequest') }))
    query()
  } catch (error) {
    console.log(error)
  }
}

const shareInfoDialogRef = ref()

function handleDblclick(row: any) {
  shareInfoDialogRef.value.handleOpen(row)
}

async function handleSubmit(shareInfo: any) {
  await newClientApi.patchDmsShareSave(shareInfo)
  query()
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader_emailList', value: 'emailList' },
        { label: 'tableHeader_numberOfFiles', value: 'documentSize' },
        { label: 'externalSharing_creationDate', value: 'created' },
        { label: 'externalSharing_expiryDate', value: 'expiredDate' }
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
  // getFilter()
})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
