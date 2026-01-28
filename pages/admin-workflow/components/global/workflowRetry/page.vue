<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef"
                          inputKey="businessKey"
                          inputPlaceHolder="workflow_retryFilter"
                          @form-change="handleFilterFormChange"
        />
      </template>
      <template #status="{ row }">
        <el-tag v-if="retryStatues.includes(row.state.toLowerCase())" type="danger">{{ row.state }}</el-tag>
        <el-tag v-else-if="row.state.toLowerCase() === 'completed'" type="success">{{ row.state }}</el-tag>
        <el-tag v-else type="info">{{ row.state }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

const { t } = useI18n()
let extraParams: any = {}
const retryStatues = ['error', 'fail', 'start error']
const state = reactive<any>({})
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload
} = useVxeTable({
  id: 'a-workflow-retry',
  api: async (pageParams: any) => {
    return await clientApi.admin.postAdmindocpalWorkflowQueryWorkflowRetryPage({ ...pageParams, ...extraParams })
  },
  columns: [
    { field: 'businessKey', title: 'workflow_taskName', fixed: 'left' },
    {
      field: 'startTime',
      title: 'workflow_retryStartDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'creator', title: 'workflow_retryInitiator' },
    {
      field: 'status',
      title: 'workflow_retryStatus',
      slots: {
        default: 'status'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'try',
        name: 'moreAction.re-try',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleRetry(row.id)
        }
      }

    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    return {
      visible: retryStatues.includes(args.row.state.toLowerCase()),
      disabled: false
    }
  }
})

async function handleRetry(id: number) {
  try {
    await clientApi.admin.postAdmindocpalWorkflowRetryFailWorkflow({ id })
    query({})
  } catch (error: any) {
  }
}


function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  let filterParams: any = {
    businessKey: formModel.businessKey === '' ? undefined : formModel.businessKey,
    orderBy:
      formModel.orderBy === undefined || formModel.orderBy === ''
        ? 'startTime'
        : formModel.orderBy
  }
  filterParams.isDesc = formModel.isDesc
  extraParams = filterParams
  reload()
}

const ResponsiveFilterRef = ref()

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'workflow_taskName', value: 'businessKey' },
        { label: 'workflow_retryInitiator', value: 'creator' },
        { label: 'workflow_retryStartDate', value: 'startTime' },
        { label: 'workflow_retryStatus', value: 'workflowState' }
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
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 50%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
