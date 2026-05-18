<script setup lang="ts">
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const userId: string = useUserId().value

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'resolved_task',
  api: async (pageParams: any) => {
    const data = await $api.get(`/oniflow/api/v1/task/overview/resolved/${userId}`).then((r: any) => r.data.data)
    return {
      data: {
        entryList: data || []
      }
    }
  },
  columns: [
    { field: 'taskInstance.businessKey', title: 'workflow_jobName', fixed: 'left' },
    { field: 'taskInstance.processDefinitionName', title: 'workflow_workflowName' },

    {
      field: 'name',
      title: 'workflow_taskName'
    },
    {
      field: 'assignee',
      title: 'workflow_assignee',
      slots: {
        default: 'assignee'
      }
    },
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
  // routerProvider?.navigateTo(,false)
}
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
