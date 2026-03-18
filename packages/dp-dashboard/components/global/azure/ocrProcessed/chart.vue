<template>
  <div ref="cardRef" class="dashboard-item">
    <div id="myEcharts" ref="chartRef" class="echart"></div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { getYearMonthDates } from '../../../../utils/tool'
import { newClientApi } from 'api'

const props = withDefaults(
  defineProps<{
    dataType?: string
    dates?: any
    setting: any
  }>(),
  {
    dataType: 'workflow'
  }
)
const dateFormat = userDisplayTimeSetting()
const emits = defineEmits(['refreshSetting', 'delete', 'drillDown'])
const setting = {
  defaultSetting: {
    options: {
      xAxis: {
        type: 'category',
        axisPointer: {
          type: 'shadow'
        }
      },
      yAxis: { type: 'value', name: 'Page' },
      tooltip: {
        appendToBody: true,
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10
      },
      toolbox: {
        feature: {
          // dataView: { show: true, readOnly: false },
          // magicType: { show: true, type: ['line', 'bar'] },
          // restore: { show: true },
          // saveAsImage: { show: true }
        }
      }
    },
    series: []
  },
  defaultSeriesBarSetting: {
    type: 'bar',
    tooltip: {
      appendToBody: true,
      valueFormatter: function(value: any) {
        return value
      }
    },
    itemStyle: {
      normal: {
        label: { show: true }
      }
    },
    emphasis: {
      focus: 'series'
    }
  },
  defaultSeriesLineSetting: {
    type: 'line',
    tooltip: {
      appendToBody: true,
      valueFormatter: function(value: any) {
        return value
      }
    }
  }
}
const { chartRef, cardRef, settingRef, resize, getInstance, refresh } = useDashboardCard({
  props,
  initStyleAction: (_cardRef: any, _chartRef: any) => {
    const pHeight = _cardRef.value.offsetHeight
    const pWidth = _cardRef.value.offsetWidth
    _chartRef.value.style = `height: ${pHeight}px; width: ${pWidth - 20}px`
  },
  getOptions: async (chartSetting: any) => {
    let resultOptions: any = {
      ...setting.defaultSetting.options
    }
    const { xAxis, series } = await getData(chartSetting.dataType)
    resultOptions.xAxis.data = xAxis
    resultOptions.series = series
    return resultOptions
  },
  onClick: (instance: any) => {
    instance.on('click', (event: any) => {
      const month = dayjs(props.dates[0]).diff(props.dates[1], 'month')
      if (month === 0) return
      // 只更新被点击的柱子的样式
      var curSeriesIndex = event.seriesIndex // 获取被点击的系列索引
      var curDataIndex = event.dataIndex // 获取被点击的数据项索引
      setHighlight(curSeriesIndex, curDataIndex)
      const drillDownParams: any = {
        startDate: dayjs(event.name).format(dateFormat),
        endDate: dayjs(event.name).endOf('month').format(dateFormat),
        [props.dataType]: event.seriesName
      }
      emits('drillDown', drillDownParams)
    })
  }
})

function setHighlight(curSeriesIndex = -1, curDataIndex: -1) {
  const instance = getInstance()
  const currentOption = instance.getOption()
  currentOption.series.forEach((seriesItem: any, seriesIndex: any) => {
    if (seriesItem.data) {
      seriesItem.data.forEach((dataItem: any, dataIndex: any) => {
        if (curSeriesIndex === seriesIndex && curDataIndex === dataIndex && dataItem.value) {
          dataItem.itemStyle = {
            borderColor: 'red',
            borderWidth: 2
          }
        } else if (dataItem.value) {
          dataItem.itemStyle = {}
        }
      })
    }
  })
  instance.setOption(currentOption, true)
}

async function getData(dataType: string) {
  const resultData = {
    series: [],
    xAxis: []
  }
  try {
    const month = dayjs(props.dates[0]).diff(props.dates[1], 'month')
    const mode = month === 0 ? 'date' : 'yearMonth'
    const initData = await GetOcrProcessApi({
      dataType,
      mode,
      startDate: props.dates[0],
      endDate: props.dates[1]
    })
    const { xAxis, totalData, yData } = getXAxisAndFillZeroData(initData, mode)
    const series: any = [
      {
        name: 'Total',
        data: totalData,
        ...setting.defaultSeriesLineSetting
      }
    ]
    Object.keys(yData).forEach((key) => {
      series.push({
        type: 'bar',
        name: key,
        data: yData[key].map((item: any) => ({
          value: item.pageCount
        })),
        ...setting.defaultSeriesBarSetting
      })
    })
    resultData.xAxis = xAxis
    resultData.series = series
  } catch (error: any) {
    console.error(error)
  } finally {
    return resultData
  }
}

const GetOcrProcessApi = async ({ dataType, mode, startDate, endDate }: any) => {
  if (dataType == 'workflow') {
    if (mode === 'date') {
      return await newClientApi.postDsbOcrDailyWorkflowInfo({
        startDate,
        endDate
      }).then((res) => res.data)
    } else {
      return await newClientApi.postDsbOcrWorkflowInfo({
        startDate,
        endDate
      }).then((res) => res.data)
    }
  } else {
    if (mode === 'date')
      return await newClientApi.postDsbOcrDailyScanTypeInfo({
        startDate,
        endDate
      }).then((res) => res.data)
    else
      return await newClientApi.postDsbOcrScanTypeInfo({
        startDate,
        endDate
      }).then((res) => res.data)
  }
}

function getXAxisAndFillZeroData(data: any, mode: any) {
  const yData: any = {}
  const xData: any = {}
  const xAxis: any = getYearMonthDates(props.dates[0], props.dates[1], mode)
  data.forEach((item: any) => {
    if (!yData[item.name]) yData[item.name] = []
    if (!xData[item[mode]]) xData[item[mode]] = []
    yData[item.name].push(item)
    xData[item[mode]].push(item.pageCount)
  })

  Object.keys(yData).forEach((name) => {
    xAxis.forEach((x: any) => {
      if (!yData[name].find((item: any) => item.date + '' === x || item.yearMonth + '' === x)) {
        yData[name].push({
          [mode]: x,
          pageCount: 0,
          name
        })
      }
    })
    yData[name] = yData[name].sort((a: any, b: any) => a[mode] - b[mode])
  })

  const totalData = xAxis.reduce((prev: any, key: any) => {
    if (!xData[key]) prev.push(0)
    else {
      const count = xData[key].reduce((acc: any, cur: any) => {
        acc += cur
        return acc
      }, 0)
      prev.push(count)
    }
    return prev
  }, [])
  return {
    xAxis,
    yData,
    xData,
    totalData
  }
}
// #endregion

defineExpose({
  resize,
  refresh,
  setHighlight
})
</script>
<style lang="scss" scoped>
.dashboard-item {
  height: 100%;
}
</style>
