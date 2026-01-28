<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter v-show="!state.selectList || state.selectList?.length === 0" ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
        <div v-show="state.selectList?.length > 0" class="flex-x-between" style="width: 100%">
          <div class="color__primary">{{ $t('notifications.fileSelected') }}({{ state.selectList.length }})</div>
          <div class="flex-x-end">
            <el-button text @click="cleanSelectedRows">
              {{ $t('notifications.cleanSelection') }}
            </el-button>
            <el-button type="primary" @click="handleDismissSelected()">
              {{ $t('notifications.dismissSelected') }}
            </el-button>
            <el-button type="primary" @click="handleDeleteSelected()">
              {{ $t('notifications.deletedSelected') }}
            </el-button>
          </div>
        </div>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { TabManagerKey } from '#imports'

const tabProvider = inject(TabManagerKey)
const { t } = useI18n()
let extraParams: any = {}
const state = reactive<any>({
  selectList: []
})
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'c-share',
  api: async (pageParams: any) => {
    cleanSelectedRows()
    return await clientApi.api.postNotificationList({
      ...pageParams,
      ...extraParams
    })
  },
  columns: [
    { field: 'checkbox', type: 'checkbox', width: '50px', fixed: 'left' },
    {
      field: 'createdDateTimestamp',
      title: 'workflowEditor.date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'type', title: 'notification.type' },
    { field: 'operate', title: 'vxe.table.actionTitle' },
    {
      field: 'description',
      title: 'docType_description',
      formatter({ cellValue, row }: any) {
        let description = ''
        const content = JSON.parse(row.content)
        if ('Workflow' !== row.type) {
          description = t(content.templateId, {
            userId: row.creator,
            documentName: content.documentName,
            businessName: content.businessName,
            emailList: content.emailList,
            email: content.email,
            path: content.path,
            fileName: content.fileName
          })
        } else {
          if ('message' in content) {
            let message = ''
            try {
              message = JSON.parse(content.message)
            } catch (e) {
              return content.message
            }
            description = t(message.templateId)
          } else {
            description = t(content.templateId, '')
          }
        }
        return description
      }
    },
    { field: 'creator', title: 'User' },
    {
      field: 'readStatus',
      title: 'notification.read/unread',
      formatter({ row }: any) {
        return row.readStatus === 'READED' ? t('notification.read') : t('notification.unread')
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'delete',
        name: t('common_delete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDeleteSelected(row)
        }
      },
      {
        code: 'dismiss',
        name: t('button.dismiss'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDisabled(row)
        }
      },
      {
        code: 'view',
        name: t('button.view'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          console.log('???')
          const data = {
            ...row,
            content: JSON.parse(row.content)
          }
          notiHandleView(data, tabProvider)
          handleDismissSelected(row)
        }
      }
    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }

    // options 是 menuConfig 中的 body 配置
    switch (args.code) {
      case 'dismiss':
        return {
          visible: args.row.status === 'CREATE',
          disabled: false
        }
      case 'view':
        return {
          visible: notiShowView(args.row),
          disabled: false
        }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    state.selectList = [...selectedRows]
  }
})

async function handleDismissSelected(row?: any) {
  let ids: number[] = []
  if (!!row) ids = [row.id]
  else ids = state.selectList.map((item: any) => item.id)
  await clientApi.api.putNotificationDissmissByIds({ ids }).then(r => r.data)
  reload()
  if (!!row && row.readStatus === 'READED') return
  updateNotificationUnreadCount()
}

async function handleDeleteSelected(row?: any) {
  let ids: number[] = []
  if (!!row) ids = [row.id]
  else ids = state.selectList.map((item: any) => item.id)
  await clientApi.api.deleteNotification({ ids })
  reload()
  if (!!row && row.readStatus === 'READED') return
  updateNotificationUnreadCount()
}

function updateNotificationUnreadCount() {
  const ev = new CustomEvent('updateNotificationUnreadCount')
  window.dispatchEvent(ev)
}

async function handleDisabled(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    const param: any = []
    param.push(row.shareID)
    await clientApi.api.deleteDmsShare(param).then(r => r.data)
    query({})
  } catch (error) {
    console.log(error)
  }
}

// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

async function initCondition() {
  let defaultFilters: any = []
  try {
    defaultFilters = await clientApi.api.getNotificationQueryNotificationFilter().then((res) => res.data)
  } catch (error) {}
  const filters = [
    {
      key: 'readStatus',
      label: 'notification.read/unread',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'notification.read', value: 'READED' },
        { label: 'notification.unread', value: 'CREATE' }
      ]
    },
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'workflowEditor.date', value: 'createdDate' },
        { label: 'docType_description', value: 'description' },
        { label: 'notification.read/unread', value: 'status' },
        { label: 'notification.operator', value: 'createdBy' }
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
  ResponsiveFilterRef.value.init([...defaultFilters, ...filters])
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  let filterParams: any = {
    name: formModel.name === '' ? undefined : formModel.name,
    orderBy: formModel.orderBy === undefined || formModel.orderBy === '' ? 'createdDate' : formModel.orderBy
  }
  filterParams.isDesc = formModel.isDesc
  extraParams = formModel
  reload()
}

// #endregion
onMounted(() => {
  initCondition()
})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
