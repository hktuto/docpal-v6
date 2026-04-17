<script lang="ts" setup>
import { newClientApi } from 'api'
import { routeWorkflowDetail } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'manage_all_task',
  api: async (pageParams: any) => {
    const params = {
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }
    try {
      const data = await $api.get('/oniflow/api/v1/task/overview/all').then((r: any) => r.data)
      return {
        data: {
          entryList: data.items || [],
          pageNum: data.page_num || 0,
          pageCount: data.page_size || 1,
          totalSize: data.total || 0
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
    { field: 'status', title: 'dpTable_status' },
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
      {
        code: 'delete',
        name: t('common_delete'),
        visible: true,
        disabled: false,
        action: async ({ row }: any) => {
          await $api.delete(`/oniflow/api/v1/processes/instance/${row.process_instance_id}`).then((r: any) => r.data)
          reload()
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

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
  await $api.post(`/oniflow/api/v1/tasks/instance/${row.process_instance_id}/claim`).then((r: any) => r.data)
  reload()
}
</script>

<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
      <template #assignee="{ row }">
        <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
        <el-button :id="`Workflow__allTask__Detail__ClaimTask__${row.id}`" v-else type="primary" size="small" round @click="claimTask(row)">
          {{ $t('workflow_claim') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'created'" type="success">{{ $t('actions.activated') }}</el-tag>
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
