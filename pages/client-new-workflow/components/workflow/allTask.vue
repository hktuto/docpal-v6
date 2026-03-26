<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="el-col el-col-10 is-guttered grid-cell">
          <el-form-item :label="t('workflow_workflowName')" label-position="top">
            <el-select clearable v-model="extraParams.definition_id" placeholder="All" @change="reload">
              <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
      </template>
      <template #assignee="{ row }">
        <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
        <el-button :id="`Workflow__AvaliableTask__Detail__ClaimTask__${row.id}`" v-else type="primary" size="small" round @click="claimTask(row)">
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

<script lang="ts" setup>
import { newClientApi } from 'api'
import { routeWorkflowDetail } from '~/utils/routerHelper'
import { getWorkflowList } from '#imports'

const { workflowList } = await getWorkflowList()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const userId: string = useUserId().value
const extraParams = ref({})
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'all_task',
  api: async (pageParams: any) => {
    const userState = useUserState()
    const groupsList = userState.value.aclUserDetail.groups.map((item: any) => item.groupId)

    const params = {
      ...extraParams.value,
      // groups: groupsList,
      // roles: [userState.value.aclUserDetail.roleId],
      assignee: userId,
      page_num: pageParams.pageNum + 1,
      page_size: pageParams.pageSize
    }
    return await $api.post('http://192.168.5.147:8080/api/v1/tasks/page', params)
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
      workflowType: 'allTask'
    }),
    false
  )
}

async function claimTask(row: any) {
  await newClientApi.postWorkflowTaskClaim({
    taskId: row.id,
    userId
  })
  query({})
}
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
