<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange"
                          inputPlaceHolder="tableHeader_name" />
        <el-button id="User__ContactBook__Add" type="primary" @click="handleCreate">
          {{ $t('button.add') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <ContactBookDialog ref="ContactBookDialogRef" @refresh="handleDblclick" @add="handleDblclick" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import { routeContactList } from '~/utils/routerHelper'

const { getPermission, isDelete, isManage } = useContactPermissionHelper()
const platform = useAppPlatform()
const userId = useUserId()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const bodyActions = {
  edit: {
    code: 'contactbook_edit',
    name: t('common_edit'),
    visible: true,
    disabled: false,
    action: ({ row }: any) => {
      handleDblclick(row)
    }
  },
  delete: {
    code: 'contactbook_delete',
    name: t('common_remove'),
    visible: true,
    disabled: false,
    action: ({ row }: any) => {
      deleteItem(row)
    }
  }
}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'contactBook',
  api: (pageParams: any) => {
    return newClientApi.postDmsContactGroupPage({ ...pageParams, ...extraParams })
  },
  columns: [
    { field: 'name', title: 'tableHeader_name', fixed: 'left' },
    {
      field: 'permissions.Read',
      title: 'permission.read',
      formatter({ cellValue, row }: any) {
        return formatPermission(row.permissions, 'Read')
      }
    },
    {
      field: 'permissions.Create',
      title: 'permission.create',
      formatter({ cellValue, row }: any) {
        return formatPermission(row.permissions, 'Create')
      }
    },
    {
      field: 'permissions.Edit',
      title: 'permission.edit',
      formatter({ cellValue, row }: any) {
        return formatPermission(row.permissions, 'Edit')
      }
    },
    {
      field: 'permissions.Delete',
      title: 'permission.delete',
      formatter({ cellValue, row }: any) {
        return formatPermission(row.permissions, 'Delete')
      }
    },
    {
      field: 'manage',
      title: 'permission.manage',
      formatter({ cellValue, row }: any) {
        return formatPermission(row.permissions, 'Manage')
      }
    },
    { title: 'role.creator', field: 'createdBy' },
    {
      field: 'createdDate',
      title: 'tableHeader_creationDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'modifiedDate',
      title: 'tableHeader_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'contactbook_edit',
        name: t('common_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'contactbook_delete',
        name: t('common_remove'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          deleteItem(row)
        }
      }
    ]
  ],
  asyncPermission: async ({ row }) => {
    if (platform.value === 'admin') {
      return {}
    }
    let isDelete = false
    if (row) {
      isDelete = await getRowPermission(row)
    }
    return {
      contactbook_delete: {
        visible: isDelete,
        disabled: false
      }
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

async function getRowPermission(row: any) {
  const data = await newClientApi.getDmsContactGroupIdUserUseridPermission(row.id, userId.value).then(r => r.data)
  await getPermission(data)
  return isDelete.value || isManage.value
}

function formatPermission(permissions: any, key: string = 'Read') {
  if (!permissions[key] || permissions[key].length === 0) return '-'
  return permissions[key].reduce((prev: any, item: any, index: number) => {
    if (index === permissions[key].length - 1) return prev + item.name
    prev += item.name + ','
    return prev
  }, '')
}

const ContactBookDialogRef = ref()

function handleDblclick(row: any) {
  routerProvider?.navigateTo(routeContactList(row), false)
}

async function deleteItem(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('msg_confirmWhetherToDelete'))
    if (action !== 'confirm') return
    await newClientApi.deleteDmsContactGroupId(row.id)
    routerProvider?.message.success(
      t('tip_deleteSuccessMsg', {
        modelName: t('contactBook.title'),
        name: row.name
      })
    )
    query({})
  } catch (error) {
    console.log(error)
  }
}

async function handleCreate() {
  ContactBookDialogRef.value.handleOpen()
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  let filterParams: any = {
    name: formModel.name === '' ? undefined : formModel.name,
    orderBy: formModel.orderBy === undefined || formModel.orderBy === '' ? 'createdDate' : formModel.orderBy
  }
  filterParams.isDesc = formModel.isDesc
  extraParams = filterParams
  reload()
}

const ResponsiveFilterRef = ref()

async function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader_name', value: 'name' },
        { label: 'role.creator', value: 'createdBy' },
        { label: 'tableHeader_creationDate', value: 'createdDate' },
        { label: 'tableHeader_modifiedDate', value: 'modifiedDate' }
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
})
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 70%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
