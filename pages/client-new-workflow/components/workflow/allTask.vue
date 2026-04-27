<script lang="ts" setup>
import { newClientApi } from 'api'
import { routeWorkflowDetail, getWorkflowList } from '#imports'

const { workflowList } = await getWorkflowList()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const userId: string = useUserId().value
const extraParams = ref({
  definition_id: ''
})
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'all_task',
  api: async (pageParams: any) => {
    const params = {
      ...extraParams.value,
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }
    try {
      const data = await $api.get(`/oniflow/api/v1/task/overview/all`).then((r: any) => r.data)

      const map = data.failed.map((item: any) => ({
        id: item.id,
        node_name: '',
        assignee: '',
        node_type: item.node_type,
        status: 'failed',
        created_at: item.failed_at,
        updated_at: ''
      }))
      const list = [...map, ...data.task]
      console.log(123, list)

      return {
        data: {
          entryList: list || []
          // pageNum: data.page_num || 0,
          // pageCount: data.page_size || 1,
          // totalSize: data.total || 0
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

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    routeWorkflowDetail({
      ...row,
      workflowType: 'allTask'
    }),
    false
  )
}

async function claimTask(row: any) {
  if (row.status==="") return

  await $api.post(`/oniflow/api/v1/tasks/instance/${row.process_instance_id}/claim`, parms).then((res: any) => res.data)
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
      <template #assignee="{ row }">
        <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
        <el-button v-else-if="row.status !== 'failed'" :id="`Workflow__AvaliableTask__Detail__ClaimTask__${row.id}`" type="primary" size="small" round @click="claimTask(row)">
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

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
