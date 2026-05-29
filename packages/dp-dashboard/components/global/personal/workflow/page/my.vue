<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'
import { clientApi } from 'api'
import { workflowResponseHelper } from '@packages/workflow/utils/jsonConversion'

const { idList } = defineProps<{
  idList: string[]
}>()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const platform = useAppPlatform()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'd-workflow-my',
  zoom: false,
  api: (pageParams: any) => getData(pageParams),
  columns: [
    { field: 'name', title: 'workflow_jobName' },
    { field: 'config.human_task.assignee', title: 'workflow_assignee', slots: { default: 'assignee' } },
    {
      field: 'execution.started_at',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})

const userId: string = useUserId().value

async function getData(pageParams: any = {}) {
  if (platform.value === 'admin') return
  const settingParams: any = {}
  if (idList && idList.length > 0) {
    settingParams.processKeys = idList
  }
  const params = {
    page_size: pageParams.pageSize,
    page_num: pageParams.pageNum,
    assignee: userId,
    definition_id: ''
    // sort:"created_at",
    // order: "desc"
  }
  const data = await clientApi.instance
    .post(`/oniflow/api/v1/task/overview/todos`, params)
    .then((r: any) => workflowResponseHelper(r))
  return {
    data: data
  }
}

function handleDblclick(row: any) {
  if (platform.value === 'admin') return
  try {
    routerProvider?.navigateTo(
      routeWorkflowDetail({
        ...row,
        workflowType: 'myTask',
        db_id: row.db_id
      }),
      false
    )
  } catch (error: any) {
    console.error(error)
  }
}

function handleAssignee(assignee: string) {
  if (!assignee || assignee === '') return false
  return !assignee.includes('${')
}

watchDebounced(
  () => idList,
  (newValue, oldValue) => {
    if (!oldValue) return
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return
    reload()
  },
  { debounce: 200, maxWait: 500, immediate: true }
)

defineExpose({ query, reload })
</script>

<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #assignee="{ row }">
        <el-tag v-if="handleAssignee(row.config.human_task.assignee)" round>
          {{ row.config.human_task.assignee || '' }}
        </el-tag>
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  position: relative;
}

:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 70%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
