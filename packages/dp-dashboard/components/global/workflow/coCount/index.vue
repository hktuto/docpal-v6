<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :hideSetting="hideSetting"
    :title="$t(setting.workflowName || setting.workflow)"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <template #title_suffix>
      <DashboardUserFilter
        class="el-icon--right"
        :user="state.filterUser"
        :show="setting.showUserFilter"
        @refreshSetting="handleFilterUser"
      ></DashboardUserFilter>
    </template>
    <div class="chartContainer">
      <component
        v-for="(item, index) in setting.displayList"
        class="chartContainer-item"
        :dates="dates"
        :is="item"
        :ref="
          (el) => {
            displayListRef[item] = el
          }
        "
        :setting="setting"
        :workflow="setting.workflow"
        :user="state.filterUser"
      ></component>
    </div>
    <WorkflowCoCountDialog ref="settingRef" @delete="handleDelete" @refresh="handleRefresh" />
  </DashboardCard>
</template>

<script lang="ts" setup>
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
const emits = defineEmits(['refreshSetting', 'delete'])
const state = reactive({
  filterUser: ''
})
const displayListRef = ref<any>({})
const { settingRef, cardRef, resize, refresh, loading } = useDashboardCard({
  props,
  resizeAction: () => {
    Object.keys(displayListRef.value).forEach((key) => {
      const item = displayListRef.value[key]
      if (item) item.resize()
    })
  },
  handleInitCardAction: (setting: any) => {
    state.filterUser = setting.user
  },
  handleRefreshAction: (setting: any) => {
    for (const key in displayListRef.value) {
      const item = displayListRef.value[key]
      if (item && item.handleInitCard) item.handleInitCard(setting)
    }
  }
})

function handleDelete() {
  emits('delete')
}
function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}
function handleFilterUser(user: any) {
  state.filterUser = user
}

defineExpose({
  resize
})
</script>

<style lang="scss" scoped>
.chartContainer {
  height: 100%;
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  overflow-y: auto;
  container-type: inline-size;
  .chartContainer-item {
    height: 100%;
    min-height: 200px;
    width: 100%;
  }
}

</style>
