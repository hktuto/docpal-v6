<script lang="ts" setup>
import { clientApi } from 'api'
import { workflowResponseHelper } from '#imports'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const workflowList = ref<any[]>([])
const reassignTaskRef = ref()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'manage_all_task',
  api: async (pageParams: any) => {
    if (workflowList.value.length == 0) {
      await getWorkflowDefinition()
    }
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
        const find = workflowList.value.find((item: any) => item.id === cellValue)
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
  dblClickAction: ({ row }: any) => {
    if (row.status.type !== 'assignee') {
      reassignTaskRef.value.open(row)
    }
  }
})

async function getWorkflowDefinition() {
  const params = {
    page_size: 1000,
    page_num: 1
  }
  const data = await clientApi.instance.post('/oniflow/api/v1/workflow/definitions/page', params).then((r: any) => workflowResponseHelper(r))
  workflowList.value = data.items
}

defineExpose({ reload })
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons></template>
    <template #assignee="{ row }">
      <el-tag v-if="row.config.human_task.assignee" round>{{ row.config.human_task.assignee || '' }}</el-tag>
    </template>
  </VxeGrid>

  <LazyWorkflowManageReassignTask ref="reassignTaskRef" @reload="reload"/>
</template>

<style lang="scss" scoped></style>
