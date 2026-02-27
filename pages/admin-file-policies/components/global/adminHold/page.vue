<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          inputKey="policyName"
          @form-change="handleFilterFormChange"
          inputPlaceHolder="holdPolicy_filter"
        />
        <el-button id="HoldPolicySetting__CreateNewHoldPolicy" type="primary" @click="handleAdd">
          {{ $t('holdPolicies.create') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <HoldDialog ref="HoldDialogRef" @update="query" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-hold',
  api: (pageParams: any) => newAdminApi.postDmsPolicyHoldListQuery({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'policyName', title: 'holdPolicy_name', fixed: 'left' },
    { field: 'createdBy', title: 'holdPolicy_creator' },
    {
      field: 'createdDate',
      title: 'holdPolicy_creationDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'active',
      title: 'holdPolicy_status',
      slots: {
        default: 'status'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'hold_edit',
        name: t('holdPolicy_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'hold_delete',
        name: t('holdPolicy_delete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          deleteItem(row.id)
        }
      },
      {
        code: 'hold_active',
        name: t('holdPolicy_activate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'A')
        }
      },
      {
        code: 'hold_inactive',
        name: t('holdPolicy_inactivate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'D')
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    switch (args.code) {
      case 'hold_active':
        return {
          visible: args.row.status === 'D',
          disabled: false
        }
      case 'hold_inactive':
        return {
          visible: args.row.status === 'A',
          disabled: false
        }
      default:
        return {
          visible: true,
          disabled: false
        }
    }
  }
})
const HoldDialogRef = ref()

function handleDblclick(row) {
  HoldDialogRef.value.handleOpen({
    ...row,
    isEdit: true
  })
}

async function handleActive(row: any, isActive: 'A' | 'D') {
  try {
    const result = await newAdminApi.patchDmsPolicyHoldHoldpolicyidStatusStatus(row.id, isActive).then((res) => res.data)
    if (!!result) {
      row.status = isActive
      routerProvider?.message.success(t('dpMsg_success'))
    }
  } catch (error) {
    console.log(error)
  }
}

async function deleteItem(id: string) {
  try {
    const action = await ElMessageBox.confirm(
      t('tip_deleteMsg', { modelName: t('workflow_holdPolicy'), name: null }),
      {
        confirmButtonClass: 'el-button el-button--warning',
        confirmButtonText: t('common_confirmDelete')
      }
    ).catch(() => {
      return
    })
    if (action !== 'confirm') return
    await newAdminApi.deleteDmsPolicyHoldHoldpolicyid(id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('workflow_holdPolicy') }))
    query()
  } catch (error) {
    console.log(error)
  }
}

async function handleCreate() {
  DialogRef.value.handleOpen()
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

function handleAdd() {
  HoldDialogRef.value.handleOpen()
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
        { label: 'holdPolicy_name', value: 'policyName' },
        { label: 'holdPolicy_creationDate', value: 'createdDate' },
        { label: 'holdPolicy_creator', value: 'createdBy' },
        { label: 'holdPolicy_status', value: 'status' }
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
    },
    {
      key: 'status',
      label: 'holdPolicy_status',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'isActive', value: 'A' },
        { label: 'noActive', value: 'D' }
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
