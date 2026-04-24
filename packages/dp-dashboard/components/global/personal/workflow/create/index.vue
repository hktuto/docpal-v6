<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding dp-dashboard--card__scroll"
    :hideSetting="hideSetting"
    :title="setting.title || $t('dashboard.PersonalWorkflowCreate')"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div class="workflow-create-content">
      <el-button v-for="item in state.workflowList" :type="item.type || 'primary'" :key="item.key" :title="item.name" @click="handleClick(item)">{{ item.title || item.name }}</el-button>
    </div>
    <PersonalWorkflowCreateDialog
      ref="settingRef"
      :workflowList="state.workflowList"
      :workflowAList="state.workflowAList"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />
    <div v-show="false">
      <WorkflowPopoverNewTask ref="newTaskRef" />
    </div>
  </DashboardCard>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
const emits = defineEmits(['delete', 'refreshSetting'])

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
const state = reactive<any>({
  workflowList: [],
  workflowAList: []
})
async function handleDelete() {
  emits('delete')
}
const newTaskRef = ref()
function handleClick(item: any) {
  newTaskRef.value.workflowClickHandler(item)
}

function handleRefresh(chartSetting: any) {
  state.workflowList = chartSetting.workflowList
  emits('refreshSetting', chartSetting)
}
async function getWorkflowId() {
  state.workflowAList = await newClientApi.postDsbWorkflowProcessList({}).then((res) => res.data)
  if (props.setting.workflowList && props.setting.workflowList.length > 0) {
    state.workflowList = props.setting.workflowList.reduce((prev: any, item: any) => {
      const workflowItem = state.workflowAList?.find((workflow: any) => workflow.key === item.key)
      prev.push({ ...workflowItem, title: item.title, type: item.type || 'primary' })
      return prev
    }, [])
  }
}
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    await getWorkflowId()
  }
})
onMounted(async () => {
  await getWorkflowId()
})
</script>
<style lang="scss" scoped>
.workflow-create-content {
  .el-button {
    width: 100%;
    margin: 0;
    margin-bottom: var(--app-space-xs);
    span {
      display: block;
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
