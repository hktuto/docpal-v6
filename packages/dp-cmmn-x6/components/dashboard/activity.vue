<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t('dashboard.cmmnActivity')"
    :setting="setting"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in state.activityList"
        :key="index"
        :timestamp="formatDate(item.endedTime)"
        :type="getType(item.state)"
        :icon="getIcon(item.state)"
        :color="item.color"
        :size="getSize(item.state)"
        placement="top"
      >
        <h3>{{ item.name }}</h3>
      </el-timeline-item>
    </el-timeline>
  </DashboardCard>
</template>
<script lang="ts" setup>
import { Select } from '@element-plus/icons-vue'
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
const state = reactive<any>({
  activityList: []
})

function getType(state: string) {
  // 'primary' | 'success' | 'warning' | 'danger' | 'info'
  const map: any = {
    completed: 'success'
  }
  return map[state]
}
function getIcon(state: string) {
  // Finished | Select
  const map: any = {
    completed: Select
  }
  return map[state]
}
function getSize(state: string) {
  // large | small
  const map: any = {
    completed: 'large'
  }
  return map[state]
}
const CMDProvider = inject(CaseManagementDashboardKey)
async function init() {
  const id = CMDProvider?.instanceId?.value || null
  const _caseTypeId = CMDProvider?.caseTypeId?.value || null
  if (id) {
    state.activityList = await newClientApi.getCaseDashboardInstanceCaseidActivity(id).then(r => r.data)
  } else if (_caseTypeId) {
    state.activityList = await newClientApi.getCaseDashboardCasetypeCasetypeidActivity(_caseTypeId).then(r => r.data)
  }
}
const { cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    await init()
  }
})
onMounted(() => {
  init()
})
</script>
<style lang="scss" scoped>
.el-timeline {
  padding: var(--app-space-xs);
  overflow: auto;
}
</style>
