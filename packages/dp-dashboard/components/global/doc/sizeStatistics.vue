<template>
  <DashboardCard
    v-loading="loading"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t(title)"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="handleInitCard"
  >
    <div id="myEcharts" ref="chartRef" class="echart"></div>
    <DocSizeStatisticsSetting ref="settingRef" @refresh="handleRefresh" />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
import { fileSize } from '../../../utils/tool'
import { useDashboardCard } from '../../../utils/useDashboardCard'

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
const { t } = useI18n()
const title = ref('dashboard.documentSize')

let seriesData: any = {}
let trendSizeData: any = {}
let trendPercentData: any = {}
let trendXAxis: any = []
let chartWidth: number = 100
let totalStorage: number = 0
const dbSetting = {
  volumeSetting: {
    options: {
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      yAxis: {
        type: 'value',
        // interval: 1024 ,
        axisLabel: {
          formatter: function(value, index) {
            //自定义提示框里提示的内容、样式等，可以打印看item里的值
            return fileSize(value, ['MB', 'GB', 'TB', 'PB'])
          }
        },
        splitLine: {
          show: true
        }
      },
      tooltip: {
        appendToBody: true,
        trigger: 'item',
        formatter: function(item) {
          //自定义提示框里提示的内容、样式等，可以打印看item里的值
          return `${item.seriesName}: ${fileSize(item.value, ['MB', 'GB', 'TB', 'PB'])}`
        }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      }
    },
    series: {
      smooth: true,
      type: 'line'
    }
  },
  percentSetting: {
    options: {
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      yAxis: {
        type: 'value'
      },
      tooltip: {
        appendToBody: true,
        trigger: 'item',
        formatter: function(item) {
          //自定义提示框里提示的内容、样式等，可以打印看item里的值
          return `${item.name} <br/>${item.seriesName}  ${item.value.toFixed(2)}`
        }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      }
    },
    series: {
      smooth: true,
      type: 'line'
    }
  },
  brickSetting: {
    options: {
      xAxis: {
        type: 'value',
        show: false
      },
      yAxis: {
        show: false
      },
      tooltip: {
        appendToBody: true,
        trigger: 'item',
        formatter: function(item) {
          //自定义提示框里提示的内容、样式等，可以打印看item里的值
          return `${item.seriesName}: ${fileSize(item.value)}`
        }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      }
    },
    series: {
      type: 'bar',
      stack: '总量',
      label: {
        normal: {
          position: 'inside', // 在内部显示，outseide 是在外部显示
          show: true,
          formatter: function(item) {
            //自定义提示框里提示的内容、样式等，可以打印看item里的值
            return fileSize(item.value)
          }
        }
      },
      itemStyle: {
        height: 50
      }
    }
  },
  barSetting: {
    options: {
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value, index) {
            //自定义提示框里提示的内容、样式等，可以打印看item里的值
            return fileSize(value)
          }
        }
      },
      yAxis: {
        data: [],
        type: 'category'
      },
      tooltip: {
        appendToBody: true,
        trigger: 'item',
        formatter: function(item) {
          //自定义提示框里提示的内容、样式等，可以打印看item里的值
          return `${item.seriesName}1: ${fileSize(item.value)}`
        }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      }
    },
    series: {
      type: 'bar',
      label: {
        normal: {
          position: 'inside', // 在内部显示，outseide 是在外部显示
          show: true,
          formatter: function(item, params) {
            //自定义提示框里提示的内容、样式等，可以打印看item里的值
            return fileSize(item.value)
          }
        }
      }
    }
  },
  pieSetting: {
    options: {
      tooltip: {
        appendToBody: true,
        trigger: 'item',
        formatter: function(item) {
          //自定义提示框里提示的内容、样式等，可以打印看item里的值
          return `${item.name}: ${fileSize(item.value)}`
        }
      },
      legend: {
        itemWidth: 10,
        itemHeight: 10,
        bottom: '5%',
        left: 'center',
        type: 'scroll'
      },
      title: [
        {
          text: 143,
          subtext: t('dashboard.totalStorage'),
          x: 'center',
          y: 'center',
          textStyle: {
            fontWeight: 'bolder',
            color: '#373D43'
          },
          subtextStyle: {
            fontWeight: 'bold',
            color: '#8796A4'
          }
        }
      ]
    },
    series: {
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: {
        // borderRadius: 5,
        // borderColor: '#fff',
        // borderWidth: 1
      },
      label: {
        normal: {
          position: 'inside', // 在内部显示，outseide 是在外部显示
          show: true,
          formatter: '{d}%'
        }
      }
    }
  },
  defaultSetting: {}
}
const emits = defineEmits(['refreshSetting', 'delete'])
const { chartRef, cardRef, settingRef, resize, handleInitCard, loading } = useDashboardCard({
  props,
  initStyleActionExtend: (pHeight, pWidth) => {
    chartWidth = Math.min(pWidth, pHeight)
  },
  getOptions: async (chartSetting) => {
    const chartType = chartSetting?.style || 'pie'
    const displayList = chartSetting?.displayList || []
    let resultOptions = {
      ...dbSetting[`${chartType}Setting`].options
    }
    switch (chartType) {
      case 'pie':
        await getData(displayList)
        resultOptions.series = getSeries(seriesData, chartType, displayList)
        resultOptions.title[0].text = fileSize(totalStorage)
        resultOptions.title[0].textStyle.fontSize = Math.max(chartWidth / 32, 14)
        resultOptions.title[0].subtextStyle.fontSize = Math.max(chartWidth / 42, 10)
        resultOptions.title[0].subtext = t('dashboard.totalStorage')
        title.value = t('dashboard.documentSize')
        break
      case 'bar':
        await getData(displayList)
        resultOptions.series = getTrendSeries(seriesData, chartType, displayList)
        title.value = t('dashboard.documentSize')
        break
      case 'brick':
        await getData(displayList)
        resultOptions.series = getTrendSeries(seriesData, chartType, displayList)
        title.value = t('dashboard.documentSize')
        break
      case 'percent':
        await getTrendData(displayList, 'trendPercentData')
        resultOptions.series = getTrendSeries(trendPercentData, chartType, displayList)
        resultOptions.xAxis.data = trendXAxis
        title.value = t('dashboard.documentPercent')
        break
      case 'volume':
        await getTrendData(displayList)
        resultOptions.series = getTrendSeries(trendSizeData, chartType, displayList)
        resultOptions.xAxis.data = trendXAxis
        title.value = t('dashboard.documentSize')
        break
    }
    return resultOptions
  }
})

// #region module: Series
function getSeries(chartData, type: string = 'pie', displayList: any[]) {
  const data = Object.keys(chartData).reduce((prev: any[], key) => {
    const value = chartData[key]
    const _sItem: any = {
      value,
      name: t(key)
    }
    const dItem = displayList.find((item) => item.documentType === key)
    if (!!dItem && !!dItem.color) {
      _sItem.itemStyle = {
        normal: {
          color: dItem.color
        }
      }
    }
    prev.push(_sItem)
    return prev
  }, [])
  return {
    data,
    ...dbSetting[`${type}Setting`].series
  }
}

function getTrendSeries(chartData, type: string = 'pie', displayList: any[]) {
  return Object.keys(chartData).reduce((prev: any, key) => {
    const values = chartData[key]
    const _sItem = {
      ...dbSetting[`${type}Setting`].series,
      name: t(key),
      data: values instanceof Array ? values : [values]
    }
    if (!displayList) displayList = []
    const dItem = displayList.find((item) => item.documentType === key)
    if (!!dItem && !!dItem.color) {
      if (!_sItem.itemStyle) _sItem.itemStyle = {}
      else _sItem.itemStyle = deepCopy(_sItem.itemStyle) // 处理所有数据同一itemStyle问题
      if (!_sItem.itemStyle.normal) _sItem.itemStyle.normal = {}
      _sItem.itemStyle.normal.color = dItem.color
    }
    prev.push(_sItem)
    return prev
  }, [])
}

// #endregion

// #region module: Data
async function getData(displayList: any = []) {
  if (!displayList || displayList.length === 0) return {}
  // try {
  const params: any = {}
  if (props.dates) {
    params.isQueryList = true
    params.dateRange = {
      from: props.dates[0],
      to: props.dates[1]
    }
  }
  const initData: any = await newClientApi.postDsbDocumentTypeSizeRange(params).then((res) => res.data)
  seriesData = {}
  let others = 0
  totalStorage = 0
  seriesData = initData?.reduce((prev, item) => {
    const index = displayList.findIndex((i) => i.documentType === item.key)
    if (index === -1) others += item.count
    else prev[item.key] = item.count
    totalStorage += item.count
    return prev
  }, {})
  seriesData.others = others
  // } catch (error) {
  // }
}

let initTrendData = []

async function getTrendData(displayList, dataType: string = 'trendSizeData') {
  if (!displayList || displayList.length === 0) return {}
  try {
    if (!initTrendData || initTrendData.length === 0) {
      const res: any = await newClientApi.postDsbDocumentTypeSizeMonthlyRangeCumulation({}).then((res) => res.data)
      initTrendData = res?.group_document_type?.buckets || []
    }
    let trendData
    let monthTotal = {}
    let others: any[] = []
    trendXAxis = []
    trendData = initTrendData.reduce((initPrev, initItem: any, initIndex) => {
      const index = displayList.findIndex((i) => i.documentType === initItem.key)
      if (index === -1) {
        initItem.group_by_time.buckets.reduce((prev, bucketsItem, index) => {
          if (!others[index]) others[index] = 0
          if (!monthTotal[index]) monthTotal[index] = 0
          others[index] += bucketsItem.cumulative_sum_mb.value
          if (initIndex === 0) {
            trendXAxis.push(bucketsItem.key_as_string)
          }
          monthTotal[index] += bucketsItem.cumulative_sum_mb.value
        }, [])
      } else {
        const buckets = initItem.group_by_time.buckets.reduce((prev, bucketsItem, index) => {
          prev.push(bucketsItem.cumulative_sum_mb.value)
          if (initIndex === 0) {
            trendXAxis.push(bucketsItem.key_as_string)
          }
          if (!monthTotal[index]) monthTotal[index] = 0
          monthTotal[index] += bucketsItem.cumulative_sum_mb.value
          return prev
        }, [])
        initPrev[initItem.key] = buckets
      }
      return initPrev
    }, {})

    trendData.others = others
    if (dataType === 'trendPercentData') {
      trendPercentData = Object.keys(trendData).reduce((prev, key) => {
        const item = trendData[key]
        prev[key] = item.reduce((_prev, _item, _index) => {
          if (monthTotal[_index] === 0) _prev.push(0)
          else _prev.push(_item / monthTotal[_index])
          return _prev
        }, [])
        return prev
      }, {})
    } else {
      trendSizeData = trendData
    }
  } catch (error) {
    console.log(error)
  }
}

function handleRefresh(chartSetting) {
  emits('refreshSetting', chartSetting)
}

function handleDelete() {
  emits('delete')
}

// #endregion
defineExpose({ resize })
</script>

<style lang="scss" scoped></style>
