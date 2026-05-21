<script lang="ts" setup>
import { newClientApi, clientApi } from 'api'
import { routeWorkflowDetail } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'manage_all_task',
  api: async (pageParams: any) => {
    try {
      const data = await clientApi.instance.get('/oniflow/api/v1/task/overview/all').then((r: any) => r.data.data)
      return {
        data: {
          entryList: data.task || []
        }
      }
    } catch (e) {
      console.log(e)
      return {
        data: { entryList: [] }
      }
    }
  },
  columns: [
    { field: 'node_name', title: 'workflow_taskName', fixed: 'left' },
    { field: 'assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    {
      field: 'created_at',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'updated_at',
      title: 'workflow_dueDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      // {
      //   code: 'delete',
      //   name: t('common_delete'),
      //   visible: true,
      //   disabled: false,
      //   action: async ({ row }: any) => {
      //     await clientApi.instance.delete(`/oniflow/api/v1/processes/instance/${row.process_instance_id}`).then((r: any) => r.data)
      //     reload()
      //   }
      // }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})
const userId: string = useUserId().value

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    routeWorkflowDetail({
      ...row,
      workflowType: 'allTask'
    }),
    false
  )
}

async function claimTask(row: any) {
  await clientApi.instance.post(`/oniflow/api/v1/processes/instance-task/${row.process_instance_id}/claim`).then((r: any) => r.data)
  reload()
}
</script>

<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
      <template #assignee="{ row }">
        <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
        <el-button v-else :id="`Workflow__allTask__Detail__ClaimTask__${row.id}`" type="primary" size="small" round @click="claimTask(row)">
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
