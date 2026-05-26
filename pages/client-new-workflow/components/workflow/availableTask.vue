<script lang="ts" setup>
import { clientApi } from 'api'
import { routeWorkflowDetail, getWorkflowList, workflowResponseHelper } from '#imports'

const workflowList = await getWorkflowList()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const user = useUserState().value
const definition_id = ref<string>('')
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'Available_task',
  api: async (pageParams: any) => {
    const params = {
      groups: user.aclUserDetail.groups.map((item: any) => item.groupId),
      roles: [user.aclUserDetail.roleId],
      assignee: user.userId,
      status: ['pending', 'waiting', 'created'],
      definition_id: '',
      process_id: '',
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }
    if (!!definition_id.value && definition_id.value !== '') {
      params.definition_id = definition_id.value
    }

    const data = await clientApi.instance
      .post(`/oniflow/api/v1/task/overview/active/page`, params)
      .then((r: any) => workflowResponseHelper(r))

    return {
      data: data || []
    }
  },
  columns: [
    { field: 'name', title: 'workflow_taskName', fixed: 'left' },
    { field: 'assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    { field: 'status.type', title: 'dpTable_status' },
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
      workflowType: 'availableTask',
      db_id: row.db_id
    }),
    false
  )
}

async function claimTask(row: any) {
  if (row.status.type !== 'waiting') {
    routerProvider?.message?.error('Unable to claim this task')
    return
  }

  try {
    const parms = {
      user_id: user.userId
    }
    const response = await clientApi.instance.post(`/oniflow/api/v1/processes/instance-task/${row.db_id}/claim`, parms).then((r: any) => workflowResponseHelper(r))
    reload()
  } catch (e) {
    console.log(e)
  }
}

defineExpose({ reload })
</script>

<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="el-col el-col-10 is-guttered grid-cell">
          <el-form-item :label="t('workflow_workflowName')" label-position="top">
            <el-select clearable v-model="definition_id" placeholder="All" @change="reload">
              <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
      </template>
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
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped></style>
