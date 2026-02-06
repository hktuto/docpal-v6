<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          inputKey="policyName"
          @form-change="handleFilterFormChange"
          :inputPlaceHolder="$t('filePolicies_tableFilterMsg')"
        />
        <el-button id="RetentionPolicySetting__CreateNewRetentionPolicy" type="primary" @click="handleAdd">
          {{ $t('filePolicies_RetentionPolicyCreate') }}
        </el-button>
      </template>
      <template #documentType="{ row, index }">
        <el-tag class="el-icon--left table-tag" v-for="item in row.triggers">{{ item.documentType }}</el-tag>
      </template>
      <template #periodNum="{ row, index }"> {{ row.periodNum }} {{ calDate(row.periodUnit) }}</template>
      <template #isAuto="{ row }">
        <el-icon v-if="row.isAuto" style="--color: var(--app-primary-color)"><Select /></el-icon>
        <el-icon v-else style="--color: #f56c6c">
          <CloseBold />
        </el-icon>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.activate') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <RetentionAddDialog ref="RetentionAddDialogRef" @update="query" />
  </div>
</template>
<script lang="ts" setup>
import { CloseBold, Select } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { newAdminApi } from 'api'
import { routeRetentionDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-retention',
  api: (pageParams: any) => newAdminApi.postDmsPolicyRetentionListQuery({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'policyName', title: 'hp.policyName', fixed: 'left' },
    {
      field: 'documentType',
      title: 'docType_documentType',
      slots: {
        default: 'documentType'
      }
    },
    {
      field: 'periodNum',
      title: 'rp.period',
      slots: {
        default: 'periodNum'
      }
    },
    {
      field: 'createdDate',
      title: 'filePolicies_CreationDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'approvalId',
      title: 'workflowEditor.approver'
    },
    {
      field: 'isAuto',
      title: 'rp.isAuto',
      width: 200,
      slots: {
        default: 'isAuto'
      }
    },
    {
      field: 'active',
      title: 'filePolicies_PolicyStatus',
      slots: {
        default: 'status'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'hold_edit',
        name: t('filePolicies_RetentionPolicyEdit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'hold_delete',
        name: t('filePolicies_RetentionPolicyDelete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          deleteItem(row.id)
        }
      },
      {
        code: 'hold_active',
        name: t('filePolicies_RetentionPolicyActivate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'A')
        }
      },
      {
        code: 'hold_inactive',
        name: t('filePolicies_RetentionPolicyInactivate'),
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
const RetentionAddDialogRef = ref()

function handleDblclick(row: any) {
  routerProvider?.navigateTo(routeRetentionDetail(row))
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

async function deleteItem(id: number) {
  try {
    const action = await ElMessageBox.confirm(`${t('filePolicies_RetentionPolicyDeletedMsg')}`,
      {
        confirmButtonClass: 'el-button el-button--warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: t('common_confirmDelete')
      }).catch(() => {
      return
    })
    if (action !== 'confirm') return
    await newAdminApi.deleteDmsPolicyRetentionRetentionpolicyid(id).then(r => r.data)
    query({})
    routerProvider?.message.success(t('tip_deleteSuccessMessage', {
      modelName: t('filePolicies_RetentionPolicy'),
      name: null
    }))
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

function handleAdd() {
  RetentionAddDialogRef.value.handleOpen()
}

const ResponsiveFilterRef = ref()

async function getFilter() {
  let data: any = await newAdminApi.getDmsPolicyRetentionListConditions().then((res) => res.data)
  data.forEach((item: any) => {
    if (item.label === 'Approval') {
      item.label = t('role.approver')
    }
  })
  data?.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'workflowEditor.approver', value: 'approvalId' },
        // { label: 'docType_documentType', value: 'triggers' },
        { label: 'filePolicies_CreationDate', value: 'createdDate' },
        { label: 'filePolicies_PolicyStatus', value: 'status' },
        { label: 'rp.period', value: 'periodNum' },
        { label: 'hp.policyName', value: 'policyName' }
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
  )
  ResponsiveFilterRef.value.init(data)
}

function calDate(unit: string) {
  let date = ''
  switch (unit) {
    case 'Y':
      date = 'common_years'
      break
    case 'M':
      date = 'common_months'
      break
    case 'D':
      date = 'common_days'
      break
    default:
      break
  }
  return t(date)
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
    width: 250px;
  }
}
</style>
