<script setup lang="ts">
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
const emits = defineEmits(['delete', 'refreshSetting'])
const currentStage = ref(-1)

const state = reactive<any>({
  data: []
})
const CMDProvider = inject(CaseManagementDashboardKey)
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    getData()
  }
})
function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}
async function handleDelete() {
  emits('delete')
}
async function getData() {
  const id = CMDProvider?.instanceId?.value || null
  console.log('id', id)
  if(id === null) return
  state.data = await clientApi.api.getCaseDashboardInstanceCaseidPrimaryformData(id).then(r => r.data)
  const selectedData = data.rows.find((item: any) => item.id === props.setting.selectedField)
  console.log('selectedData', selectedData)
  if(selectedData && selectedData.value) {
    // loop
    const trimmedValue = selectedData.value.split('-')[0]
    console.log('trimmedValue', trimmedValue)
    currentStage.value = props.setting.steps.findIndex((item: any) => item.value === trimmedValue )
    console.log('currentStage', currentStage.value, props.setting.steps)
  }else{
    currentStage.value = -1
  }
}

onMounted(async () => {
  await getData()
})
</script>

<template>
<DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="setting.label"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <template v-if="state.data && setting && setting.selectedField">
      <div class="stage-container">
        <div  v-for="(item, index) in setting.steps" :key="item.id" :class="{'stage-item': true, 'finished': index < currentStage , current: index === currentStage}">
          <div :class="{
            'stage-item-label': true, 
            'finished': index < currentStage , 
            current: index === currentStage, 
            isLast: index === setting.steps.length - 1,
            isFirst: index === 0
          }">
          <Icon name="mdi:check" v-if="index < currentStage" />
          {{ item.label }}</div>
        </div>
      </div>
    </template>
    <DashboardStageSetting ref="settingRef" v-if="!hideSetting" @delete="handleDelete" @refresh="handleRefresh" />

  </DashboardCard>
</template>

<style scoped lang="scss">
.stage-container{
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0;
  height: 100%;
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
  .stage-item{
    flex: 1 0 auto;
  }
  .stage-item-label{
    --light-color: var(--el-color-info-light-8);
    --label-color: var(--app-text-color-primary);
    color: var(--label-color);
    font-size: var(--app-font-size-l);
    width: 100%;
    height: 40px;
    background: var(--light-color);
    padding: var(--app-space-s);
    padding-left: calc(20px + var(--app-space-s));
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-s);
    .iconify{
      background: var(--label-color);
    }
    &.isFirst{
      padding-left: var(--app-space-s);
    }
    &.isLast{
      &:after{
        display: none;
      }
    }
    &:after{
      content: '';
      position: absolute;
      right: -10px;
      top: 0;
      width: 0;
      height: 0;
      border-top: 20px solid transparent;
      border-bottom: 20px solid transparent;
      border-left: 10px solid var(--light-color);
      z-index: 3;
    }
    &:before{
      content: '';
      position: absolute;
      right: -12px;
      top: 0;
      width: 0;
      height: 0;
      border-top: 20px solid transparent;
      border-bottom: 20px solid transparent;
      border-left: 10px solid #fff;
      z-index: 2;
    }
  }
  .stage-item-label.finished{
    --light-color: var(--el-color-primary);
    --lighter-color: var(--el-color-primary-light-3);
    --label-color: #fff;
    font-weight: 700;
    
  }
  .stage-item-label.current{
    --light-color: var(--el-color-success);
    --label-color: #fff;
    font-weight: 700;
    
  }
}
</style>
