<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t('dashboard.cmmnTaskPage')"
    :setting="setting"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div style="width: 100%; height: 100%; overflow: hidden; position: relative">
      <VxeGrid v-if="CMDProvider?.instanceId" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q" />
        </template>
      </VxeGrid>
    </div>
  </DashboardCard>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: false
  }
)
const emits = defineEmits(['delete'])
async function handleDelete() {
  emits('delete')
}

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const state = reactive<any>({
  extraParams: {}
})

const CMDProvider = inject(CaseManagementDashboardKey)

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'case-management-dashboard-task-table',
  api: async (params: any) => {
    const _instanceId = CMDProvider?.instanceId?.value || null

    if (!_instanceId) {
      return {
        entryList: [],
        totalSize: 0
      }
    }

    const paramsWithExtra = {
      ...params,
      ...state.extraParams,
      // assignee: useUserId().value,
      // category: 'Personal'
    }

    const res: any = await newClientApi.postCaseDashboardInstanceCaseidProcessInstancePage(
      _instanceId,
      paramsWithExtra
    ).then(r => r.data)
    return {
      data: res
    }
  },
  saveColumnOrder: false,
  zoom: false,
  defaultSort: [{ field: 'createdDate', order: 'desc' }],
  columns: [
    { field: 'taskInstance.businessKey', title: 'Task Name', fixed: 'left' },
    { field: 'name', title: 'Step' },
    {field:'taskInstance.startUserId', title: 'Creator'},
    {
      field: 'createDate',
      title: 'Start Date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }) => {
    handleDblclick(row)
  }
})

function handleFilterFormChange(formModel: any) {
  state.extraParams = formModel
  reload()
}

async function handleDblclick(row: any) {
  try {
    routerProvider?.navigateTo(routeWorkflowDetail({
    ...row,
    name: row.taskInstance.businessKey,
    workflowType: 'myTask'
  }), false)
    // router.push(`/caseManage/dashboard?id=${row.id}&instanceId=${instance.businessKey}&caseId=${route.params.id}`)
  } catch (error) {
    console.error(error)
  }
}

const ResponsiveFilterRef = ref()
async function initCondition() {
  const _instanceId = CMDProvider?.instanceId?.value || null
  if (!_instanceId) return
  try {
    const data = await newClientApi.getCaseDashboardInstanceCaseidProcessInstancePageConditions(_instanceId)
    ResponsiveFilterRef.value?.init(data)
  } catch (error) {
    console.error(error)
  }
}

const { cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    query({})
    initCondition()
  }
})

onMounted(() => {
  initCondition()
})
</script>
<style lang="scss" scoped>
.el-card {
  height: 100%;
  position: relative;
  overflow: hidden;
  :deep(.el-card__body) {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
  }
}
</style>
