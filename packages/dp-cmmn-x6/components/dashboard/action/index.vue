<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t('dashboard.cmmnAction')"
    :setting="setting"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <DashboardActionList class="dashboard-auto" :actionList="state.data" @refresh="init()" @submit="handleRefresh" />
  </DashboardCard>
</template>
<script lang="ts" setup>
import { EventType } from 'eventbus'
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
const { t } = useI18n()
const CMDProvider = inject(CaseManagementDashboardKey)
const emits = defineEmits(['delete', 'refresh'])

async function handleDelete() {
  emits('delete')
}

const refreshBus = useEventBus(EventType.CASE_NEED_REFRESH)

function needRefresh(detail: any) {
  const caseId = CMDProvider?.instanceId?.value || null
  if (detail.caseId === caseId) {
    init()
  }
}

const state = reactive<any>({
  data: [],
  loading: false
})

function filterActions(action: any) {
  if (action.planItemDefinitionType === 'processtask') {
    return action.state === 'available' || action.state === 'enabled'
  } else if (action.planItemDefinitionType === 'humantask') {
    return !!action.referenceId
  }
  return action.state !== 'completed'
}

const userId: string = useUserId().value

async function init() {
  const id = CMDProvider?.instanceId?.value || null
  // const _caseTypeId = CMDProvider.caseTypeId?.value || null
  const _versionId = CMDProvider?.versionId?.value || null
  if (id) {
    const userAction = await clientApi.api.getCaseDashboardInstanceCaseidActions(id, { userId }).then(r => r.data)
    state.data = userAction?.filter(filterActions).sort((a: any, b: any) => a.name.localeCompare(b.name))
  }
    // else if(_caseTypeId){
    //   const { data: dashboardActions } = await clientApi.api.getCaseDashboardCasetypeCasetypeidActions(_caseTypeId).then(r
    //   state.data = dashboardActions?.filter(s => s.state !== 'completed')
  // }
  else if (_versionId) {
    const dashboardActions = await clientApi.api.getCaseDashboardVersionVersionidActions(_versionId).then(r => r.data)
    state.data = dashboardActions?.filter(filterActions)
  }
}

const { cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    await init()
  }
})

function handleRefresh() {
  emits('refresh')
  init()
}

onMounted(() => {
  refreshBus.on(needRefresh)
})
onDeactivated(() => {
  refreshBus.off(needRefresh)
})
onMounted(() => {
  init()
})
</script>
<style lang="scss" scoped></style>
