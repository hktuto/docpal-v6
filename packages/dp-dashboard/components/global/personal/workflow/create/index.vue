<script lang="ts" setup>
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'
import { newClientApi } from 'api'

const emits = defineEmits(['delete', 'refreshSetting'])
const { workflowList } = await getWorkflowList()
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
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    await getWorkflowId()
  }
})
const state = reactive<any>({
  workflowList: [],
  workflowAList: []
})
const newTaskRef = ref()

async function handleDelete() {
  emits('delete')
}

function handleClick(item: any) {
  newTaskRef.value.workflowClickHandler(item)
}

function handleRefresh(chartSetting: any) {
  state.workflowList = chartSetting.workflowList
  emits('refreshSetting', chartSetting)
}

async function getWorkflowId() {
  if (!props.setting.workflowList || props.setting.workflowList.length === 0) return

  state.workflowList = props.setting.workflowList.reduce((prev: any, item: any) => {
    const workflowItem = workflowList.find((workflow: any) => workflow.key === item.key)
    prev.push({ ...workflowItem, title: item.title, type: item.type || 'primary' })
    return prev
  }, [])
}

onMounted(async () => {
  await getWorkflowId()
})
</script>

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
      <template v-for="item in state.workflowList" :key="item.key">
        <el-button
          :style="{ backgroundColor: item.type || '#13C3AEFF', color: item.type === '#ffffff' ? '#000' : '#fff' }"
          :title="item.name"
          @click="handleClick(item)"
        >
          {{ item.title || item.name }}
        </el-button>
      </template>
    </div>
    <PersonalWorkflowCreateDialog
      ref="settingRef"
      :workflowList="state.workflowList"
      :WorkflowCandidateList="workflowList"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />

    <div v-show="false">
      <WorkflowPopoverNewTask ref="newTaskRef" />
    </div>
  </DashboardCard>
</template>

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
