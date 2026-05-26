<script lang="ts" setup>
import { newClientApi, clientApi } from 'api'
import { routeWorkflowDetail } from '~/utils/routerHelper'
import { workflowResponseHelper } from '@packages/workflow/utils/jsonConversion'

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
    return await clientApi.instance
      .get(`/oniflow/api/v1/task/overview/active/${userId}?pageSize=${pageParams.pageSize}&pageNum=${pageParams.pageNum}`)
      .then((r: any) => workflowResponseHelper(r))
  },
  columns: [
    // { field: 'id', title: 'Workflow Instance Name', fixed: 'left' },
    { field: 'name', title: 'workflow_jobName' },
    { field: 'config.human_task.assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
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
      workflowType: 'activeTask',
      db_id: row.db_id
    }),
    false
  )
}

async function claimTask(row: any) {
  await clientApi.instance.post(`/oniflow/api/v1/processes/instance-task/${row.process_id}/claim`, { user_id: userId }).then((res) => res.data)
  query({})
}

function handleAssignee(assignee: string) {
  if (!assignee || assignee === '') return false
  return !assignee.includes('${')
}

defineExpose({ reload })
</script>

<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
      <template #assignee="{ row }">
        <el-tag v-if="handleAssignee(row.config.human_task.assignee)" round>{{ row.config.human_task.assignee || '' }}</el-tag>
        <el-button v-else :id="`Workflow__ActiveTask__Detail__ClaimTask__${row.id}`" type="primary" size="small" round @click="claimTask(row)">
          {{ $t('workflow_claim') }}
        </el-button>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
