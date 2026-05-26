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
const userId: string = useUserId().value
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'd-workflow-active',
  zoom: false,
  api: (pageParams: any) => getData(pageParams),
  columns: [
    { field: 'name', title: 'workflow_jobName' },
    { field: 'config.human_task.assignee', title: 'workflow_assignee', slots: { default: 'assignee' } }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})

async function getData(pageParams: any = {}) {
  if (platform.value === 'admin') return
  const settingParams: any = {}
  if (idList.length > 0) {
    settingParams.processKeys = idList
  }

  return await clientApi.instance
    .get(`/oniflow/api/v1/task/overview/active/${userId}?pageSize=${pageParams.pageSize}&pageNum=${pageParams.pageNum}`)
    .then((r: any) => workflowResponseHelper(r))
}

function handleDblclick(row: any) {
  if (platform.value === 'admin') return
  try {
    routerProvider?.navigateTo(
      routeWorkflowDetail({
        ...row,
        workflowType: 'activeTask',
        db_id: row.node_id
      }),
      false
    )
  } catch (error: any) {
    console.error(error)
  }
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
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" />
  </div>
</template>

<style lang="scss" scoped></style>
