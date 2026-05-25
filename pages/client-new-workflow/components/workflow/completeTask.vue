<script lang="ts" setup>
import { clientApi } from 'api'
import dayjs from 'dayjs'
import { routeWorkflowDetail, getWorkflowList, workflowResponseHelper } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const workflowList = await getWorkflowList()
const { t } = useI18n()
// @ts-ignore
const userId: string = useUserId().value
const user = useUserState().value
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'complete_task',
  api: async (pageParams: any) => {
    const params = {
      pageSize: pageParams.pageSize,
      pageNum: pageParams.pageNum,
      groups: user.aclUserDetail.groups.map((item: any) => item.groupId),
      roles: [user.aclUserDetail.roleId],
      definition_id: '',
      status: ['completed', 'failed', 'terminated'],
      involved_user_id: userId
    }

    const data = await clientApi.instance.post(`/oniflow/api/v1/processes/instance/page`, params).then((r: any) => workflowResponseHelper(r))
    return {
      data: data
    }
  },
  columns: [
    { field: 'name', title: 'workflow_workflowName', fixed: 'left' },
    {
      field: 'created_at',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'completed_at',
      title: 'workflow_completeDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'duration',
      title: 'workflow_duration',
      formatter({ cellValue, row }: any) {
        return dayjs(row.completed_at).diff(row.created_at, 'day') + ' ' + t('common_days')
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    // handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    routeWorkflowDetail({
      ...row,
      workflowType: 'completeTask',
      db_id: row.id
    }),
    false
  )
}

const ResponsiveFilterRef = ref()

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

function reloadTable() {
  reload()
}

defineExpose({ reloadTable })
</script>

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
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
