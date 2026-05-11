<script lang="ts" setup>
import { newClientApi } from 'api'
import { routeWorkflowDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
// @ts-ignore
const userId: string = useUserId().value
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'active_task',
  api: async (pageParams: any) => {
    const data = await $api.get(`/oniflow/api/v1/task/overview/active/${userId}`).then((r: any) => r.data)
    return {
      data: {
        entryList: data || []
      }
    }
  },
  columns: [
    { field: 'id', title: 'workflow_jobName', fixed: 'left' },
    { field: 'name', title: 'workflow_taskName' },
    { field: 'assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    {
      field: 'createDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    routeWorkflowDetail({
      ...row,
      workflowType: 'activeTask'
    }),
    false
  )
}

async function claimTask(row: any) {
  await $api.post(`/oniflow/api/v1/tasks/instance/${row.process_instance_id}/claim`).then((res) => res.data)
  query({})
}

function handleFormChange(data: any) {
  extraParams = Object.keys(data.formModel).reduce((prev: any, key: string) => {
    if (data.formModel[key] && data.formModel[key].length > 0) prev[key] = data.formModel[key]
    return prev
  }, {})
  reload()
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()
function reloadTable() {
  reload()
}

defineExpose({ reloadTable })
</script>

<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
      </template>
      <template #assignee="{ row }">
        <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
        <el-button :id="`Workflow__ActiveTask__Detail__ClaimTask__${row.id}`" v-else type="primary" size="small" round @click="claimTask(row)">
          {{ $t('workflow_claim') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
