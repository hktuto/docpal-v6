<script setup lang="ts">
import { clientApi } from 'api'
import { workflowResponseHelper, getWorkflowList, routeWorkflowManageEditor } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const workflowList = await getWorkflowList()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'manage_fail_task',
  api: async (pageParams: any) => {
    const response = await clientApi.instance
      .get(`/oniflow/api/v1/task/overview/failed?pageSize=${pageParams.pageSize}&pageNum=${pageParams.pageNum}`)
      .then((r: any) => workflowResponseHelper(r))
    return {
      data: response || []
    }
  },
  columns: [
    {
      field: 'definition_id',
      title: 'Workflow Name',
      fixed: 'left',
      formatter({ cellValue }: any) {
        const find = workflowList.find((item: any) => item.id === cellValue)
        return !!find ? find.name : cellValue
      }
    },
    { field: 'node_name', title: 'workflow_taskName' },
    { field: 'node_type', title: 'Node Type' },
    {
      field: 'failed_at',
      title: 'Task Failed Date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'failure_reason',
      title: 'Failure Reason'
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
    handleDbClick(row)
  }
})

function handleDbClick(row: any) {
  const find = workflowList.find((item: any) => item.id === row.definition_id)
  try {
    const workflowEdit = routeWorkflowManageEditor({
      id: row.definition_id,
      name: !!find ? find.name : row.definition_id
    })
    routerProvider?.navigateTo(workflowEdit)
  } catch (e) {
    console.log(e)
  }
}
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons></template>
  </VxeGrid>
</template>

<style scoped lang="scss"></style>
