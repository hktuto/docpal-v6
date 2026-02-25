<template>
  <div ref="cardRef" class="co-count co-count-chart">
    <div id="myEcharts" ref="chartRef" class="echart"></div>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    dates?: any
    documentType?: string
    user?: string
    setting?: any
  }>(),
  {
    documentType: '',
    user: ''
  }
)
const emits = defineEmits(['refreshSetting', 'delete'])
const { chartRef, cardRef, settingRef, resize, handleInitCard } = useDashboardCard({
  props,
  initStyleAction: () => {
    initStyle()
  },
  getOptions: async (chartSetting) => {
    let resultOptions: any = {
      xAxis: { type: 'category', boundaryGap: false, data: [] },
      title: { text: t('dashboard.fileSizes'), left: 'left' },
      yAxis: { type: 'value' },
      tooltip: { appendToBody: true, trigger: 'item' },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      }
    }
    const { data, xAxis } = await getData(chartSetting.documentType)
    resultOptions.xAxis.data = xAxis
    resultOptions.series = {
      type: 'line',
      smooth: true,
      data: data
    }
    return resultOptions
  }
})

// #region module: set
function initStyle() {
  const pHeight = cardRef.value.offsetHeight
  const pWidth = cardRef.value.offsetWidth
  // 需要扣除 .el-card 的 padding
  chartRef.value.style = `height: ${pHeight}px; width: ${pWidth - 20}px`
}

// #endregion
const GetCoCountSizeApi = async (params: any, creator?: string) => {
  if (creator) {
    return await newClientApi.postDsbNewFilesUserSizeDtypeMonthlyCumulation({
      ...params,
      creator
    }).then((res) => res.data)
  }
  return await newClientApi.postDsbNewFilesUsersSizeDtypeMonthlyCumulation(params).then((res) => res.data)
}

async function getData(documentType: string) {
  const resultData: any = {
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
    const res: any = await GetCoCountSizeApi(params, props.user)
    const initData = res.group_document_type.buckets[0].group_by_time.buckets
    resultData.data = initData.reduce((prev, item) => {
      prev.push(item.cumulative_sum_mb.value)
      resultData.xAxis.push(item.key_as_string)
      return prev
    }, [])
  } catch (error) {
    throw new Error(error)
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
