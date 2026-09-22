<script lang="ts" setup>
import { clientApi } from 'api'
import { routeWorkflowDetail } from '~/utils/routerHelper'
import { getWorkflowList, workflowResponseHelper } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const emit = defineEmits<{
  select: [row: Record<string, any>]
}>()
const workflowList = await getWorkflowList()
const { t } = useI18n()
const user = useUserState().value
const definition_id = ref<string>('')

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'active_task',
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
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum,
      involved_user_id: user.userId,
      groups: user.aclUserDetail.groups.map((item: any) => item.groupId),
      roles: [user.aclUserDetail.roleId],
      definition_id: !!definition_id.value && definition_id.value !== '' ? definition_id.value : ''
    }
    const data = await clientApi.instance
      .post(`/oniflow/api/v1/task/overview/involved`, params)
      .then((r: any) => workflowResponseHelper(r))
    return {
      data: data || []
    }
  },
  columns: [
    { field: 'name', title: 'workflow_jobName', slots:{default: 'name'} },
    { field: 'config.human_task.assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    {
      field: 'execution.started_at',
      title: 'workflow_createDate',
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
      workflowType: 'activeTask',
      db_id: row.db_id
    }),
    false
  )
}

function handleAssignee(assignee: string) {
  if (!assignee || assignee === '') return false
  return !assignee.includes('${')
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
      <template #name="{ row }">
        <span>{{ row?.execution?.input_variables?.business_key || row.name  }}</span>
      </template>
      <template #assignee="{ row }">
        <el-tag v-if="handleAssignee(row.config.human_task.assignee)" round>
          {{ row.config.human_task.assignee || '' }}
        </el-tag>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

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
