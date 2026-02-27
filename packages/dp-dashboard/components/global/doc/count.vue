<template>
  <div ref="cardRef" class="dashboard-item dashboard-item-progress" :style="`--icon-size: ${state.iconSize}`">
    <el-progress type="circle" :percentage="state.percentage" :stroke-width="state.width / 8" :width="state.width" :color="setting.color">
      <SvgIcon :content="`${state.percentage}%`" :src="setting.icon" @dblclick="openSetting" />
    </el-progress>
    <div class="dashboard-item-progress-count">{{ state.data[setting.documentType] || 0 }}</div>
    <div class="dashboard-item-progress-title" :title="$t(setting.documentType)">
      {{ $t(setting.documentType) }}
    </div>
    <DocCountSetting ref="settingRef" @delete="handleDelete" @refresh="handleRefresh" />
  </div>
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

const emits = defineEmits(['refreshSetting', 'delete'])
const state = reactive<any>({
  initData: [],
  data: {},
  percentage: 0,
  width: 126,
  iconSize: '30px'
})

function initStyle() {
  if (!cardRef.value) return
  const pHeight = cardRef.value.offsetHeight - 70
  const pWidth = cardRef.value.offsetWidth - 15
  state.width = Math.min(pWidth, pHeight)
  state.iconSize = state.width / 3 + 'px'
}

const { chartRef, cardRef, settingRef, resize } = useDashboardCard({
  props,
  initStyleAction: () => {
    setTimeout(() => {
      initStyle()
    }, 100)
  },
  handleInitCardAction: (chartSetting) => {
    getData(chartSetting.documentType)
  }
})
function openSetting() {
  if (props.hideSetting) return
  settingRef.value.handleOpen(props.setting)
}
async function getData(documentType: string) {
  try {
    const params: any = {}
    if (props.dates) {
      params.isQueryList = true
      params.dateRange = {
        from: props.dates[0],
        to: props.dates[1]
      }
    }
    state.initData  = await newClientApi.postDsbDocumentTypeCountRange(params).then((res) => res.data)
    let others = 0
    state.data = state.initData.reduce((prev:any, item: any) => {
      if (item.key === documentType) {
        prev[item.key] = item.count
      } else others += item.count
      return prev
    }, {})
    state.data.others = others

    if (state.data[documentType]) state.percentage = ((state.data[documentType] / (state.data.others + state.data[documentType])) * 100).toFixed(2)
    else state.percentage = 0
  } catch (error) {
    state.percentage = 0
  }
}

function handleDelete() {
  emits('delete')
}

function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}

defineExpose({
  resize
})
</script>

<style lang="scss" scoped>
.dashboard-item-progress {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr min-content min-content;

  div {
    justify-self: center;
    align-self: center;
  }

  &-count {
    font-size: 24px;
  }

  &-title {
    color: #373d43;
    text-align: center;
    // word-break: break-all;
    vertical-align: middle;
    height: 2.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    // 超出两行显示省略号
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
