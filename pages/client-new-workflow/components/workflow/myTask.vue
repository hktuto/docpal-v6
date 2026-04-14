<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
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
    const userState = useUserState()
    const groupsList = userState.value.aclUserDetail.groups.map((item: any) => item.groupId)

    const params = {
      ...extraParams.value,
      // groups: groupsList,
      // roles: [userState.value.aclUserDetail.roleId],
      assignee: userId,
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }
    const data = await $api.post('https://132.148.160.191:8001/api/v1/tasks/page', params).then((r) => r.data)
    return {
      data: {
        entryList: data.items,
        pageNum: data.page_num,
        pageCount: data.page_size,
        totalSize: data.total
      }
    }
  },
  columns: [
    { field: 'node_name', title: 'workflow_taskName', fixed: 'left' },
    { field: 'assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    { field: 'status', title: 'dpTable_status', slots: { default: 'assignee' } },
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
      name: row.taskInstance.businessKey,
      workflowType: 'myTask'
    }),
    false
  )
}

onMounted(() => {})

</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
