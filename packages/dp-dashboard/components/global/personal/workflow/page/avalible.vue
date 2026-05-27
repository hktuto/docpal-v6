<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'
import { clientApi } from 'api'

const { idList } = defineProps<{
  idList: string[]
}>()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const platform = useAppPlatform()
let extraParams: any = ref({
  candidateOrAssigned: useUserId()
})
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'd-workflowAvalible',
  zoom: false,
  api: (pageParams: any) => getData(pageParams),
  columns: [
    { field: 'taskInstance.businessKey', title: 'table_name', fixed: 'left' },
    { field: 'name', title: 'workflow_taskName' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})

async function getData(params: any = {}) {
  const settingParams: any = {}
  if (idList && idList.length > 0) {
    settingParams.processKeys = idList
  }
  return await clientApi.instance
    .get(`/oniflow/api/v1/task/overview/active/${userId}?pageSize=${pageParams.pageSize}&pageNum=${pageParams.pageNum}`)
    .then((r: any) => r.data)
}

function handleDblclick(row: any) {
  if (platform.value === 'admin') return
  try {
    routerProvider?.navigateTo(
      routeWorkflowDetail({
        ...row,
        name: row.taskInstance.businessKey,
        workflowType: 'allTask'
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
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"/>
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
