<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
  </div>
</template>
<script lang="ts" setup>

import { watchDebounced } from '@vueuse/core'
import { newClientApi } from 'api'
const props = defineProps(['processKeys'])
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
    // { field: "taskInstance.processDefinitionName", title: "workflow_workflowName" },
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})
async function getData(params: any = {}) {
  // if (platform === 'admin') return
  const settingParams: any = {}
  if (props.processKeys && props.processKeys.length > 0) {
    settingParams.processKeys = props.processKeys
  }
  const res = await newClientApi.postDocpalWorkflowTasksUser({ ...params, ...extraParams.value, ...settingParams }).then((res) => res.data)
  return {
    data: {
      entryList: res?.entryList,
      totalSize: res?.totalSize
    }
  }
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
  () => props.processKeys,
  (newValue, oldValue) => {
    if (!oldValue) return
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return
    reload()
  },
  { debounce: 200, maxWait: 500, immediate: true }
)
defineExpose({ query, reload })
</script>
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
