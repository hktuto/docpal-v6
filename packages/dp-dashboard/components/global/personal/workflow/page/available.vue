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

const user = useUserState().value

async function getData(pageParams: any = {}) {
  const settingParams: any = {}
  if (idList && idList.length > 0) {
    settingParams.processKeys = idList
  }
  const params = {
    groups: user.aclUserDetail.groups.map((item: any) => item.groupId),
    roles: [user.aclUserDetail.roleId],
    assignee: user.userId,
    status: ['pending', 'waiting'],
    definition_id: '',
    process_id: '',
    page_num: pageParams.pageNum,
    page_size: pageParams.pageSize
  }

  const data = await clientApi.instance
    .post(`/oniflow/api/v1/task/overview/available`, params)
    .then((r: any) => workflowResponseHelper(r))

  return {
    data: data || []
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
