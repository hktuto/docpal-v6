<script lang="ts" setup>
import { clientApi } from 'api'
import { routeWorkflowDetail } from '~/utils/routerHelper'
import { getWorkflowList, workflowResponseHelper } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const workflowList = await getWorkflowList()
const { t } = useI18n()
const userId: string = useUserId().value
const definition_id = ref<string>('')
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'my_task',
  api: async (pageParams: any) => {
    const params = {
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum,
      assignee: userId,
      definition_id: !!definition_id.value && definition_id.value !== '' ? definition_id.value : ''
      // sort:"created_at",
      // order: "desc"
    }
    const data = await clientApi.instance.post(`/oniflow/api/v1/task/overview/todos`, params).then((r: any) => workflowResponseHelper(r))
    return {
      data: data
    }
  },
  columns: [
    { field: 'name', title: 'workflow_jobName', slots: { default: 'name' } },
    { field: 'config.human_task.assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    {
      field: 'execution.started_at',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'execution.last_updated_at',
      title: 'workflow_editorLastDate',
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
  routerProvider?.navigateTo(
    routeWorkflowDetail({
      ...row,
      workflowType: 'myTask',
      db_id: row.db_id
    }),
    false
  )
}

function handleAssignee(assignee: string) {
  if (!assignee || assignee === '') return false
  return !assignee.includes('${')
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
</style>
