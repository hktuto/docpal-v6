<template>
  <div class="chopsTable-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actions">
          <h3>{{ $t('companyProfile.chopTitle') }}</h3>
          <!-- <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" inputPlaceHolder="companyProfile.filterTip" /> -->
          <el-button id="CompanyProfile__NewProfile_Detail__AddChop" type="primary" @click="handleAdd()">
            {{ $t('companyProfile.chopCreate') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <CompanyProfileChopsDialog ref="DialogRef" :company-id="props.id" @refresh="query({})" />
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{
  id: string,
}>()
const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-company-profile-chops',
  api: (pageParams: any) => newAdminApi.postAdmindmsCompanyprofilesCompanyidChopsPage(props.id, {
    ...pageParams, ...extraParams
  }),
  columns: [
    { field: 'name', title: 'companyProfile.chopName', fixed: 'left' },
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
        code: 'edit_easyForm',
        name: t('common_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleEdit(row)
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
    handleEdit(row)
  }
})

function handleEdit(row: any) {
  DialogRef.value.handleEdit(row)
}

async function handleActive(row: any, status: string) {
  try {
    const result = await newAdminApi.putAdmindmsCompanyprofilesCompanyidChopsCompanychopidStatus(props.id, row.id, { status: status }).then((res) => res.data)
    if (!!result) {
      row.status = status
    }
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

const DialogRef = ref()

async function handleAdd() {
  DialogRef.value.handleAdd()
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    await newAdminApi.deleteAdmindmsCompanyprofilesCompanyidChopsCompanychopid(props.id, row.id).then((res) => res.data)
    reload()
  } catch (error) {
    console.log(error)
  }
}

</script>
<style lang="scss" scoped>
.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: space-between;
  --icon-size: var(--app-font-size-m);
}

:deep(.el-input) {
  width: 200px;
}
</style>
