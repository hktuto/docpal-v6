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
  id: 'my_task',
  api: async (pageParams: any) => {
    const data = await $api.get(`/oniflow/api/v1/task/overview/all/${userId}`).then((r) => r.data)
    return {
      data: {
        entryList: data.task || []
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
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    routeWorkflowDetail({
      ...row,
      workflowType: 'myTask'
    }),
    false
  )
}

function reloadTable() {
  reload()
}

defineExpose({ reloadTable })
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons></template>
    <template #assignee="{ row }">
      <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
    </template>
  </VxeGrid>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
