<template>
  <div class="pageContainer--padding externalStorage-page">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actions">
          <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" />
          <el-button id="ExternalStorage__Add" type="primary" @click="handleAdd">
            {{ $t('externalStorage.create') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <ExternalStorageNewDialog ref="DialogRef" @refresh="query({})" />
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { routeExternalStorageDetailPage } from '../../../util/routerHelper'

const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-external-storage',
  api: (pageParams: any) => clientApi.admin.postAdminext3rdstoragePage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'dpTable.name', fixed: 'left' },
    { field: 'connection_type', title: 'externalStorage.connection' },
    { field: 'path', title: 'table_path' },
    { field: 'credentials.host', title: 'Host' },
    {
      field: 'status',
      title: 'common_status',
      slots: {
        default: 'status'
      }
    },
    { field: 'created_by', title: 'search.createdBy' },
    {
      field: 'created_date',
      title: 'dpTable_createdDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },

    {
      field: 'modifiedDate',
      title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'editConnection',
        name: t('externalStorage.editConnection'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleEdit(row)
        }
      },
      {
        code: 'editDetail',
        name: t('actions.editDetail'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'active',
        name: t('actions.active'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'A')
        }
      },
      {
        code: 'inactive',
        name: t('actions.inactive'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'D')
        }
      }
    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    if (args.code === 'inactive') {
      return {
        visible: args.row.status === 'A',
        disabled: false
      }
    }
    if (args.code === 'active') {
      return {
        visible: args.row.status !== 'A',
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeExternalStorageDetailPage(row), false)
}

async function handleActive(row: any, status: string) {
  try {
    const result = await clientApi.admin.patchAdminext3rdstorageIdUpdateStatus(row.id, { status: status }).then((res) => res.data)
    if (!!result) {
      row.status = status
    }
  } catch (error) {
  }
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const DialogRef = ref()

async function handleAdd() {
  DialogRef.value.handleOpen()
}

function handleEdit(row: any) {
  DialogRef.value.handleEdit(row)
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'dpTable.name', value: 'name' },
        { label: 'dpTable_createdDate', value: 'created_date' },
        { label: 'common_status', value: 'status' },
        { label: 'table_modifiedDate', value: 'modified_date' }
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
  ResponsiveFilterRef.value?.init(data)
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-start;
  --icon-size: var(--app-font-size-m);
}

:deep(.el-input) {
  width: 200px;
}
</style>
