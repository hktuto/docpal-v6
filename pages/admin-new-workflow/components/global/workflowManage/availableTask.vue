<script lang="ts" setup>
import { clientApi } from 'api'
import { workflowResponseHelper, getWorkflowList } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const workflowList = await getWorkflowList()
const { t } = useI18n()
const reassignTaskRef = ref()

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'manage_all_task',
  api: async (pageParams: any) => {
    const params = {
      status: [],
      assignee: '',
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }

    const response = await clientApi.instance
      .post(`/oniflow/api/v1/task/overview/page`, params)
      .then((r: any) => workflowResponseHelper(r))
    return {
      data: response
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
    { field: 'name', title: 'workflow_taskName' },
    { field: 'config.human_task.assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    { field: 'status.type', title: 'Status' },
    {
      field: 'execution.started_at',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    if (row.status.type !== 'assignee') {
      reassignTaskRef.value.open(row)
    }
  }
})

defineExpose({ reload })
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons></template>
    <template #assignee="{ row }">
      <el-tag v-if="row.config.human_task.assignee" round>{{ row.config.human_task.assignee || '' }}</el-tag>
    </template>
  </VxeGrid>

  <LazyWorkflowManageReassignTask ref="reassignTaskRef" />
</template>

<style lang="scss" scoped></style>
