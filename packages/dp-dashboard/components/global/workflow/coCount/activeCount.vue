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
    xAxis: {
      boundaryGap: false,
      type: 'category'
    },
    title: {
      text: t('dashboard.WorkflowActiveCount'),
      left: 'left'
    },
    yAxis: {
      type: 'value',
      data: []
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
    type: 'line'
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
    const { data, xAxis } = await getData(chartSetting.workflow)
    resultOptions.xAxis.data = xAxis
    resultOptions.series = {
      ...defaultSetting.series,
      data: data
    }
    return resultOptions
  }
})

async function getData(workflow: string) {
  const resultData: any = {
    data: [],
    xAxis: []
  }
  try {
    const params: any = {
      workflowId: workflow,
      userId: props.user
    }
    if (props.dates) {
      params.isQueryList = true
      params.dateRange = {
        from: props.dates[0],
        to: props.dates[1]
      }
    }
    const initData = await newClientApi.postDsbWorkflowActivateTaskTrend(params).then((res) => res.data)
    resultData.data = initData?.reduce((prev: any, item: any) => {
      prev.push(item.count)
      resultData.xAxis.push(item.key)
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
