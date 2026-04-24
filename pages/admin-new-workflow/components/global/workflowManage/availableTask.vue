<script setup lang="ts">
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'manage_available_task',
  api: async (pageParams: any) => {
    const params = {
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }
    try {
      const data = await $api.get(`/oniflow/api/v1/task/overview/available`).then((r: any) => r.data)
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
          await $api.delete(`/oniflow/api/v1/processes/instance/${row.process_instance_id}`).then((r) => r.data)
          reload()
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {}
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons> </template>
    <!--      <template #assignee="{ row }">-->
    <!--      </template>-->
    <!--      <template #status="{ row }">-->
    <!--      </template>-->
  </VxeGrid>
</template>

<style scoped lang="scss"></style>
