<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actions">
          <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange"
                            inputPlaceHolder="companyProfile.filterTip" />
          <el-button id="CompanyProfile__NewProfile" type="primary" @click="handleAdd()">
            {{ $t('companyProfile.create') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <CompanyProfileNewDialog ref="DialogRef" @refresh="query({})" />
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessageBox } from 'element-plus'
import { routeCompanyProfileDetailPage } from '../../../util/routerHelper'

const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-company-profile',
  api: (pageParams: any) => newAdminApi.postDmsCompanyprofilesPage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'companyProfile.name', fixed: 'left' },
    {
      field: 'createdBy',
      title: 'search.createdBy'
    },
    {
      field: 'createdDate',
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
    },
    {
      field: 'status',
      title: 'common_status',
      slots: {
        default: 'status'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('common_edit'),
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
      },
      {
        code: 'remove',
        name: t('common_remove'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
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
  routerProvider?.navigateTo(routeCompanyProfileDetailPage(row), false)
}

async function handleActive(row: any, status: string) {
  try {
    const result = await newAdminApi.patchDmsCompanyprofilesCompanyidStatus(row.id, { status: status }).then((res) => res.data)
    if (!!result) {
      row.status = status
      routerProvider?.message.success(t('tip_updateSuccessMsg', { modelName: null, name: row.name }))
    }
  } catch (error) {
    console.log(error)
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

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    let result = await newAdminApi.deleteDmsCompanyprofilesCompanyid(row.id).then((res) => res.data)
    if (result) routerProvider?.message.success(t('tip_deleteSuccessMsg', {
      modelName: t('adminMenu.companyProfile'),
      name: row.name
    }))
    reload()
  } catch (error) {
  }
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'companyProfile.name', value: 'name' },
        { label: 'dpTable_createdDate', value: 'createdDate' },
        { label: 'common_status', value: 'status' },
        { label: 'table_modifiedDate', value: 'modifiedDate' }
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
