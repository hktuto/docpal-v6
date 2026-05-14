<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'

const { idList } = defineProps<{
  idList: string[]
}>()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const platform = useAppPlatform()
let extraParams: any = ref({
  assignedUser: useUserId()
})
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'd-workflow-my',
  zoom: false,
  api: (pageParams: any) => getData(pageParams),
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
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})

async function getData(params: any = {}) {
  if (platform.value === 'admin') return
  const settingParams: any = {}
  if (idList && idList.length > 0) {
    settingParams.processKeys = idList
  }
  // const res = await newClientApi.postDocpalWorkflowTasksUser({ ...params, ...extraParams.value, ...settingParams }).then((res) => res.data)

  const data = (await $api.get(`/oniflow/api/v1/task/overview/available/${userId}`).then((r: any) => r.data.data)) as any[]
  // 只保留 waiting 狀態的數據
  let list = data.filter((item: any) => item.status === 'waiting')

  return {
    data: {
      entryList: list || []
    }
  }
}

function handleDblclick(row: any) {
  if (platform.value === 'admin') return
  try {
    routerProvider?.navigateTo(
      routeWorkflowDetail({
        ...row,
        workflowType: 'myTask',
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
