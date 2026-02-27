<template>
  <div ref="cardRef" class="co-count co-count-chart">
    <div id="myEcharts" ref="chartRef" class="echart"></div>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
const props = withDefaults(
  defineProps<{
    dates?: any
    workflow?: string
    user?: string
    setting: any
  }>(),
  {
    workflow: '',
    user: ''
  }
)
const { t } = useI18n()
const emits = defineEmits(['refreshSetting', 'delete'])
const defaultSetting = {
  options: {
    title: {
      text: t('dashboard.WorkflowTimeSpendPerWorkflow'),
      left: 'left'
    },
    tooltip: {
      appendToBody: true,
      trigger: 'item'
    },
    legend: {
      bottom: '5%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10
    }
  },
  series: {
    type: 'pie',
    center: ['50%', '50%'],
    label: {
      normal: {
        position: 'inside', // 在内部显示，outseide 是在外部显示
        show: true,
        formatter: '{d}%'
      }
    }
  }
}
const { chartRef, cardRef, settingRef, resize, handleInitCard } = useDashboardCard({
  props,
  initStyleAction: (_cardRef: any, _chartRef: any) => {
    const pHeight = _cardRef.value.offsetHeight
    const pWidth = _cardRef.value.offsetWidth
    _chartRef.value.style = `height: ${pHeight}px; width: ${pWidth - 20}px`
  },
  getOptions: async (chartSetting: any) => {
    let resultOptions: any = {
      ...defaultSetting.options
    }
    const { data } = await getData(chartSetting.workflow)
    resultOptions.series = {
    ...defaultSetting.series,
    data: data
  }
    return resultOptions
  }
})

async function getData(workflow: string) {
  const resultData: any = {
    data: []
  }
  try {
    const params: any = {
      workflowId: workflow,
      timeGroup: [3, 7, 14],
      userId: props.user
    }
    if (props.dates) {
      params.gteDate = props.dates[0]
      params.lteDate = props.dates[1]
    }
    const initData = await newClientApi.postDsbWorkflowSpendTime(params).then((res) => res.data)
    if (!initData) return
    resultData.data = Object.keys(initData).reduce((prev: any, key: any) => {
      prev.push({
        name: key,
        value: initData[key]
      })
      return prev
    }, [])
  } catch (error: any) {
    console.error(error)
  } finally {
    return resultData
  }
}
defineExpose({
  resize, handleInitCard
})
</script>

<style lang="scss" scoped></style>
