<script setup lang="ts">
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const userId: string = useUserId().value

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'failed_task',
  api: async (pageParams: any) => {
    try {
      const data = await $api.get(`/oniflow/api/v1/task/overview/all/${userId}`).then((r: any) => r.data)

      const map = data.failed.map((item: any) => ({
        id: item.id,
        node_name: '',
        assignee: '',
        node_type: item.node_type,
        status: 'failed',
        created_at: item.failed_at,
        updated_at: ''
      }))

      return {
        data: {
          entryList: map || []
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
      // {
      //   code: 'delete',
      //   name: t('common_delete'),
      //   visible: true,
      //   disabled: false,
      //   action: async ({ row }: any) => {
      // await $api.delete(`/oniflow/api/v1/processes/instance/${row.process_instance_id}`).then((r) => r.data)
      //     reload()
      //   }
      // }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {}
})

function reloadTable() {
  reload()
}

defineExpose({ reloadTable })
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons> </template>
    <template #assignee="{ row }">
      <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
      <el-button
        v-else-if="row.status !== 'failed'"
        :id="`Workflow__AvaliableTask__Detail__ClaimTask__${row.id}`"
        type="primary"
        size="small"
        round
        @click="claimTask(row)"
      >
        {{ $t('workflow_claim') }}
      </el-button>
    </template>
    <template #status="{ row }">
      <el-tag v-if="row.status === 'created'" type="success">{{ $t('actions.activated') }}</el-tag>
      <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
    </template>
  </VxeGrid>
</template>

<style scoped lang="scss"></style>
