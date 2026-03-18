<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange"
                          inputPlaceHolder="dashboard_filter" />
        <el-button id="Dashboard__CreateNewDashboard" type="primary" @click="handleCreate">
          {{ $t('dashboard_create') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <DashboardDialog ref="DashboardDialogRef" @refresh="query({})" @add="handleDblclick" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import { routeDashboardManageDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'dashboardManage',
  api: (pageParams: any) => newClientApi.postDsbUserDashboardsPage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'dashboard_name', fixed: 'left' },
    { field: 'access', title: 'dashboard_accessUserGroup' },
    {
      field: 'createdDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'hold_edit',
        name: t('dashboard_content'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'hold_config',
        name: t('dashboard_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleConfig(row)
        }
      },
      {
        code: 'hold_delete',
        name: t('dashboard_delete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          deleteItem(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})
const DashboardDialogRef = ref()

function handleDblclick(row: any) {
  routerProvider?.navigateTo(routeDashboardManageDetail(row), false)
}

function handleConfig(row: any) {
  DashboardDialogRef.value.handleOpen({
    ...row,
    isEdit: true
  })
}

async function deleteItem(row: any) {
  try {
    const action = await ElMessageBox.confirm(
      `${t('dashboard_deleteMsg', { name: row.name })}`,
      {
        confirmButtonClass: 'el-button el-button--warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: t('common_confirmDelete')
      })
    if (action !== 'confirm') return
    await newClientApi.deleteDsbUserDashboardsId(row.id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: row.name }))
    query({})
  } catch (error) {
    console.log(error)
  }
}

async function handleCreate() {
  DashboardDialogRef.value.handleOpen()
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
      key: 'orderBy', label: 'tableHeader.sortBy', type: 'string', isMultiple: false,
      options: [
        { label: 'dashboard_accessUserGroup', value: 'access' },
        { label: 'dashboard_name', value: 'name' },
        { label: 'workflow_createDate', value: 'createdDate' }
      ]
    },
    {
      key: 'isDesc', label: 'tableHeader.sortOrder', type: 'string', isMultiple: false,
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
:deep(.vxe-buttons--wrapper ) {
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
