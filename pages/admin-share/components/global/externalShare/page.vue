<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"/>
    <ExternalShareDialog ref="shareInfoDialogRef" @submit="handleSubmit"/>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-external-share',
  api: async (pageParams: any) => {
    const params = {
      ...pageParams,
      page: pageParams.pageNum,
      size: pageParams.pageSize
    }
    delete params.pageNum
    delete params.pageSize
    const res: any = await clientApi.admin.postAdmindmsShareGet({ ...params, ...extraParams }).then((res) => res.data)
    return {
      data: {
        entryList: res.list,
        totalSize: res.total
      }
    }
  },
  columns: [
    { field: 'emailList', title: 'tableHeader_emailList', fixed: 'left' },
    { field: 'documentSize', title: 'tableHeader_numberOfFiles' },
    {
      field: 'created',
      title: 'tableHeader_creationDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'expiredDate',
      title: 'tableHeader_dueDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'delete',
        name: t('common_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: t('common_delete'),
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

async function handleDisabled(row) {
  try {
    const action = await ElMessageBox.confirm(
      t('tip_deleteMsg', { modelName: t('share_externalShareLink'), name: null }),
      {
        confirmButtonClass: 'el-button el-button--warning',
        confirmButtonText: t('common_confirmDelete')
      }
    )
    if (action !== 'confirm') return
    const param = []
    param.push(row.shareID)
    await clientApi.admin.deleteAdmindmsShare(param).then(r => r.data)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('tip_SelectedMsg') + t('share_externalShareLink') }))
    query()
  } catch (error) {
    console.log(error)
  }
}

const shareInfoDialogRef = ref()

function handleDblclick(row) {
  shareInfoDialogRef.value.handleOpen(row)
}

async function handleSubmit(shareInfo) {
  await clientApi.admin.patchAdmindmsShareSave(shareInfo).then(r => r.data)
  query()
}
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
