<script lang="ts" setup>
import { clientApi } from 'api'
import { routeWorkflowDetail, getWorkflowList, workflowResponseHelper } from '#imports'

const emit = defineEmits<{
  select: [row: Record<string, any>]
}>()
const workflowList = await getWorkflowList()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const user = useUserState().value
const definition_id = ref<string>('')

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'Available_task',
  optionalConfig: {
    rowConfig: {
      useKey: true,
      isCurrent: true
    },
    rowClassName: ({ row }: { row: Record<string, any> }) => (row?.isHandle ? 'row--struck' : '')
  },
  optionalEvent: {
    cellClick: ({ row }: { row: Record<string, any> }) => {
      if (!row || row.isHandle) return
      tableRef.value?.setCurrentRow?.(row)
      emit('select', row)
    }
  },
  api: async (pageParams: any) => {
    const params = {
      groups: user.aclUserDetail.groups.map((item: any) => item.groupId),
      roles: [user.aclUserDetail.roleId],
      assignee: user.userId,
      status: ['pending', 'waiting'],
      definition_id: !!definition_id.value && definition_id.value !== '' ? definition_id.value : '',
      process_id: '',
      page_num: pageParams.pageNum,
      page_size: pageParams.pageSize
    }

    const data = await clientApi.instance.post(`/oniflow/api/v1/task/overview/available`, params).then((r: any) => workflowResponseHelper(r))
    return {
      data: data || []
    }
  },
  columns: [
    { field: 'definition_name', title: 'workflowEditor.name' },
    { field: 'name', title: 'workflow_jobName' },
    { field: 'business_key', title: 'business_key', slots: { default: 'business_key' } },
    { field: 'assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    { field: 'status', title: 'dpTable_status' },
    {
      field: 'execution.started_at',
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
  if (row?.isHandle) return
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
  if (row?.isHandle || row.status.type !== 'waiting') return

  try {
    const parms = {
      user_id: user.userId
    }
    await clientApi.instance.post(`/oniflow/api/v1/processes/instance-task/${row.db_id}/claim`, parms).then((r: any) => workflowResponseHelper(r))
    reload()
  } catch (e) {
    routerProvider?.message?.error('Unable to claim this task')
  }
}

function getTableRows() {
  const grid = tableRef.value as any
  return grid?.getTableData?.()?.fullData ?? grid?.getData?.() ?? []
}

function handleRefreshHandledRows() {
  nextTick(() => {
    const grid = tableRef.value as any
    if (!grid) return
    const fullData = getTableRows()
    if (typeof grid.loadData === 'function') {
      grid.loadData([...fullData])
      return
    }
    grid.updateData?.()
    grid.recalculate?.(true)
  })
}

/** submit/terminate 后给相关行打 isHandle，用于删除线样式 */
function markStruck(dbId: string, processId?: string) {
  const id = String(dbId)
  const pid = processId != null ? String(processId) : ''
  getTableRows().forEach((row: Record<string, any>) => {
    if (String(row.db_id) === id || (pid && String(row.process_id) === pid)) {
      row.isHandle = true
    }
  })
  handleRefreshHandledRows()
}

defineExpose({
  reload,
  clearHighlight: () => tableRef.value?.clearCurrentRow?.(),
  markStruck
})
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
      <template #business_key="{ row }">
        <span>{{ row?.execution?.input_variables?.business_key || '' }}</span>
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

<style lang="scss" scoped>
:deep(.vxe-body--row.row--current) {
  background-color: var(--el-color-primary-light-9) !important;
}

:deep(.vxe-body--row.row--struck) {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;

  .vxe-body--column,
  .vxe-cell {
    text-decoration: line-through;
  }
}
</style>
