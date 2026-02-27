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
    setting?: any
    user?: string
  }>(),
  {
    setting: {},
    user: ''
  }
)
const { t } = useI18n()
const emits = defineEmits(['refreshSetting', 'delete'])

const { chartRef, cardRef, resize, handleInitCard } = useDashboardCard({
  props,
  initStyleAction: () => {
    initStyle()
  },
  getOptions: async (chartSetting: any) => {
    const resultOptions: any = {
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: []
      },
      title: {
        text: t('dashboard.newFiles'),
        left: 'left'
      },
      yAxis: {
        type: 'value'
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
    }
    // data
    const { data, xAxis } = await getData(chartSetting.documentType)
    resultOptions.xAxis.data = xAxis
    resultOptions.series = {
      type: 'line',
      smooth: true,
      data
    }
    return resultOptions
  }
})

// #region module: set
function initStyle() {
  const pHeight = cardRef.value.offsetHeight
  const pWidth = cardRef.value.offsetWidth
  chartRef.value.style = `height: ${pHeight}px; width: ${pWidth - 20}px`
}

// #endregion

async function GetCoCountData(params: any, creator?: string) {
  if (creator)
    return await newClientApi.postDsbNewFilesUserCountDtypeMonthlyCumulation({
      ...params,
      creator
    }).then((res) => res.data)
  return await newClientApi.postDsbNewFilesUsersCountDtypeMonthlyCumulation(params, {
    baseURL: '/dashboard'
  }).then((res) => res.data)
}

// #region module: setting

async function getData(documentType: string) {
  let resultData: any = {
    data: [],
    xAxis: []
  }
  try {
    const params: any = {
      primaryType: documentType
    }
    if (props.dates) {
      params.isQueryList = true
      params.dateRange = {
        from: props.dates[0],
        to: props.dates[1]
      }
    }
    const res: any = await GetCoCountData(params, props.user)
    const initData = res.group_document_type.buckets[0].group_by_time.buckets
    resultData.data = initData.reduce((prev, item) => {
      prev.push(item.doc_count)
      resultData.xAxis.push(item.key_as_string)
      return prev
    }, [])
  } catch (error) {
    throw new Error(error)
  } finally {
    return resultData
  }
}

defineExpose({
  resize, handleInitCard
})
</script>

<style lang="scss" scoped></style>
