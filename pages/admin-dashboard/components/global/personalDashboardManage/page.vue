<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange"
                          inputPlaceHolder="workPanel_filter" />
        <el-button id="WorkPanel__CreateNewWorkPanel" type="primary" @click="handleCreate">
          {{ $t('workPanel_create') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <PersonalDashboardDialog ref="DashboardDialogRef" @refresh="query({})" @add="handleDblclick" />
    <PersonalDashboardDuplicateDialog ref="PersonalDashboardDuplicateDialogRef" @refresh="query({})"
                                      @add="handleDblclick" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { routePersonalDashboardDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const PersonalDashboardDuplicateDialogRef = ref()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'personalDashboardManage',
  api: (pageParams: any) => clientApi.admin.postAdmindocpalPersonalDashboard({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'workPanel_name', fixed: 'left' },
    { field: 'groupId', title: 'workPanel_accessUserGroup' },
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
        name: t('workPanel_content'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'hold_config',
        name: t('workPanel_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleConfig(row)
        }
      },
      {
        code: 'hold_duplicate',
        name: t('actions.duplicate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          PersonalDashboardDuplicateDialogRef.value.handleOpen(row)
        }
      },
      {
        code: 'hold_delete',
        name: t('workPanel_delete'),
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
  routerProvider?.navigateTo(routePersonalDashboardDetail(row), false)
}

function handleConfig(row: any) {
  DashboardDialogRef.value.handleOpen({
    ...row,
    isEdit: true
  })
}

async function deleteItem(row) {
  try {
    const action = await ElMessageBox.confirm(`${t('workPanel_deleteMsg', { name: row.name })}`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    await adminApi.api.deletePersonalDashboardId(row.id)
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
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'workPanel_accessUserGroup', value: 'groupId' },
        { label: 'workflow_createDate', value: 'createdDate' },
        { label: 'workPanel_name', value: 'name' }
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
