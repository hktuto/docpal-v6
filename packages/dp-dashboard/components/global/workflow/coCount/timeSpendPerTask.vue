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
    setting?: any
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
    xAxis: {
      type: 'value'
    },
    title: {
      text: t('dashboard.WorkflowTimeSpendPerTask'),
      left: 'left'
    },
    yAxis: {
      type: 'category',
      data: []
      // show: false,
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
    type: 'bar'
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
    const { data, yAxis } = await getData(chartSetting.workflow)
    resultOptions.yAxis.data = yAxis
    resultOptions.series = data
    return resultOptions
  }
})

// #region module: setting

async function getData(workflow: string) {
  const resultData: any = {
    data: [],
    yAxis: []
  }
  try {
    const params: any = {
      workflowId: workflow,
      userId: props.user
    }
    if (props.dates) {
      params.gteDate = props.dates[0]
      params.lteDate = props.dates[1]
      // params.isQueryList = true
      // params.dateRange = {
      //     from: props.dates[0],
      //     to: props.dates[1]
      // }
    }
    const initData = await newClientApi.postDsbWorkflowActivateTaskSpendTime(params).then((res) => res.data)
    if (!initData) return
    resultData.data = Object.keys(initData).reduce((prev: any, key: any) => {
      prev.push({
        ...defaultSetting.series,
        name: key,
        data: [initData[key]]
      })
      return prev
    }, [])
  } catch (error: any) {
    console.error(error)
  } finally {
    return resultData
  }
}
// #endregion

defineExpose({
  resize, handleInitCard
})
</script>

<style lang="scss" scoped></style>
