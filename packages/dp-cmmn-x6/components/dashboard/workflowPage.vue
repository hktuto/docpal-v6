<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t('dashboard.cmmnWorkflowPage')"
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
import { clientApi } from 'api'
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
const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['delete'])
async function handleDelete() {
  emits('delete')
}
const state = reactive<any>({
  loading: false,
  tableData: [],
  extraParams: {}
})

const CMDProvider = inject(CaseManagementDashboardKey)

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'case-management-dashboard-table',
  api: (params: any) => {
    params = {
      ...params,
      ...state.extraParams
    }
    const _instanceId: any = CMDProvider?.instanceId?.value || null
    return clientApi.api.postCaseDashboardInstanceCaseidProcessInstancePage(_instanceId, params)
  },
  saveColumnOrder: false,
  zoom: false,
  columns: [
    {
      title: 'table_name',
      field: 'name'
    },
    {
      title: 'workflow_workflowName',
      field: 'taskInstance.processDefinitionName'
    },
    {
      title: 'common_status',
      field: 'name'
    },
    {
      title: 'workflow_assignee',
      field: 'assignee'
    },
    {
      title: 'workflow_createDate',
      field: 'createDate',
      formatter: ({ cellValue }) => {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }) => {
    console.log('row', row)
    handleDblclick(row)
  }
})
// #region module:

function handleFilterFormChange(formModel: any) {
  state.extraParams = formModel
  reload()
}

async function handleDblclick(row: any) {
  if (!routeWorkflowDetail) return
  try {
    state.loading = true
    const newItem = routeWorkflowDetail({
      id: row.id,
      name: row.name
    })
    routerProvider?.navigateTo(newItem)
    // router.push(`/caseManage/dashboard?id=${row.id}&instanceId=${instance.businessKey}&caseId=${route.params.id}`)
  } catch (error: any) {
    console.error(error)
  } finally {
    setTimeout(() => {
      state.loading = false
    }, 300)
  }
}

// #endregion
// #region module:
const ResponsiveFilterRef = ref()
async function initCondition() {
  const _instanceId = CMDProvider?.instanceId?.value || null
  if (!_instanceId) return
  try {
    const data = await clientApi.api.getCaseDashboardInstanceCaseidProcessInstancePageConditions(_instanceId)
    ResponsiveFilterRef.value.init(data)
  } catch (error) {}
}
// #endregion
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
