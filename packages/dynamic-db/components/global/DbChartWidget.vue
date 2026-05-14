<template>
  <DashboardCard
    ref="cardRef"
    :title="chartTitle"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-chart-widget">
      <div v-if="!chartData.length" class="empty-state">
        <el-empty description="No data available" />
      </div>
      <div v-else ref="chartContainer" class="chart-container" />
    </div>
  </DashboardCard>
  <DbChartWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'

// Register required modules
echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const chartContainer = ref<HTMLDivElement>()
const chartInstance = ref<any>(null)
const chartData = ref<any[]>([])
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const colorPalette = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9f7f'
]

const config = computed(() => props.setting || {})

const chartTitle = computed(() => {
  const { xField } = config.value
  const seriesLabels = (config.value.series || []).map((s: any) => s.label || s.field).filter(Boolean)
  if (xField && seriesLabels.length) {
    return `${xField} vs ${seriesLabels.join(', ')}`
  }
  return 'Chart'
})

function truncateDate(value: any, granularity: string): string {
  const d = dayjs(value)
  if (!d.isValid()) return String(value)
  switch (granularity) {
    case 'day': return d.format('YYYY-MM-DD')
    case 'week': return d.startOf('week').format('YYYY-MM-DD')
    case 'month': return d.format('YYYY-MM')
    case 'year': return d.format('YYYY')
    default: return String(value)
  }
}

function buildServerSideParams() {
  const { tableId, xField, series, rowLimit } = config.value
  const limit = rowLimit || 20

  const columns: any[] = [{ name: xField }]
  const validSeries = (series || []).filter((s: any) => s.field)

  validSeries.forEach((s: any, index: number) => {
    const aggFunc = s.aggregation === 'count' ? 'COUNT' : s.aggregation.toUpperCase()
    columns.push({
      name: aggFunc === 'COUNT' ? '*' : s.field,
      alias: `series_${index}`,
      aggFunc
    })
  })

  return {
    tableId,
    groupBy: { columns: [xField] },
    columns,
    orderBy: [{ column: xField, desc: false }],
    pagination: { pageSize: limit, pageNum: 1 }
  }
}

function buildClientSideParams() {
  const { tableId, xField, series, rowLimit } = config.value
  const limit = rowLimit || 20

  const columns: any[] = [{ name: xField }]
  const validSeries = (series || []).filter((s: any) => s.field)

  validSeries.forEach((s: any) => {
    columns.push({ name: s.field })
  })

  return {
    tableId,
    columns,
    pagination: { pageSize: limit, pageNum: 1 }
  }
}

function aggregateClientSide(rows: any[], xField: string, granularity: string, series: any[]) {
  const grouped: Record<string, Record<number, number[]>> = {}

  for (const row of rows) {
    const rawKey = row[xField] ?? 'Unknown'
    const key = granularity ? truncateDate(rawKey, granularity) : String(rawKey)

    if (!grouped[key]) grouped[key] = {}

    series.forEach((s: any, index: number) => {
      if (!grouped[key][index]) grouped[key][index] = []
      const val = parseFloat(row[s.field])
      if (!isNaN(val)) grouped[key][index].push(val)
    })
  }

  const result = Object.entries(grouped).map(([key, valuesMap]) => {
    const item: any = { key }
    series.forEach((s: any, index: number) => {
      const values = valuesMap[index] || []
      let value = 0
      if (s.aggregation === 'count') {
        value = values.length
      } else if (values.length === 0) {
        value = 0
      } else {
        switch (s.aggregation) {
          case 'sum':
            value = values.reduce((a: number, b: number) => a + b, 0)
            break
          case 'avg':
            value = values.reduce((a: number, b: number) => a + b, 0) / values.length
            break
          case 'min':
            value = Math.min(...values)
            break
          case 'max':
            value = Math.max(...values)
            break
          default:
            value = values.length
        }
      }
      item[`series_${index}`] = Math.round(value * 100) / 100
    })
    return item
  })

  // Sort by key for consistent ordering
  result.sort((a, b) => String(a.key).localeCompare(String(b.key)))
  return result
}

async function fetchData() {
  const { tableId, xField, series, xTimeGranularity } = config.value
  const validSeries = (series || []).filter((s: any) => s.field)

  if (!tableId || !xField || validSeries.length === 0) {
    chartData.value = []
    return
  }

  loading.value = true
  try {
    let rows: any[] = []

    if (xTimeGranularity) {
      // Client-side aggregation with date truncation
      const params = buildClientSideParams()
      const res: any = await postDynamicActions(params)
      rows = res.data?.data || []
      chartData.value = aggregateClientSide(rows, xField, xTimeGranularity, validSeries)
    } else {
      // Server-side aggregation
      const params = buildServerSideParams()
      const res: any = await postDynamicActions(params)
      rows = res.data?.data || []
      chartData.value = rows.map((row: any) => {
        const item: any = { key: row[xField] ?? 'Unknown' }
        validSeries.forEach((_s: any, index: number) => {
          item[`series_${index}`] = row[`series_${index}`] ?? 0
        })
        return item
      })
    }

    await nextTick()
    initChart()
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
    chartData.value = []
  } finally {
    loading.value = false
  }
}

function getLegendConfig() {
  const pos = config.value.appearance?.legendPosition || 'bottom'
  if (pos === 'none') return { show: false }

  const base: any = {
    show: true,
    orient: pos === 'left' || pos === 'right' ? 'vertical' : 'horizontal'
  }

  if (pos === 'left') base.left = 'left'
  else if (pos === 'right') base.right = 'right'
  else if (pos === 'top') base.top = 'top'
  else if (pos === 'bottom') base.bottom = '0%'

  return base
}

function initChart() {
  if (!chartContainer.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  const { chartType, series, appearance } = config.value
  const validSeries = (series || []).filter((s: any) => s.field)
  const instance = echarts.init(chartContainer.value)
  chartInstance.value = instance

  const isPie = chartType === 'pie' || chartType === 'donut'
  const isLine = chartType === 'line' || chartType === 'area'
  const isBar = chartType === 'bar'

  const legendConfig = getLegendConfig()

  if (isPie) {
    // Pie/Donut uses first series only
    const firstSeries = validSeries[0]
    const pieData = chartData.value.map((d) => ({
      name: d.key,
      value: d.series_0 ?? 0
    }))

    const option = {
      tooltip: { trigger: 'item' },
      legend: legendConfig,
      series: [
        {
          type: 'pie',
          radius: chartType === 'donut' ? ['40%', '70%'] : '60%',
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: pieData.length <= 20
          }
        }
      ]
    }
    instance.setOption(option)
    return
  }

  // Cartesian charts (bar, line, area)
  const xData = chartData.value.map((d) => d.key)
  const isStacked = appearance?.stacked || false
  const isSmooth = appearance?.smooth || false

  const echartsSeries = validSeries.map((s: any, index: number) => {
    const color = s.color || colorPalette[index % colorPalette.length]
    const yData = chartData.value.map((d) => d[`series_${index}`] ?? 0)

    const baseSeries: any = {
      name: s.label || s.field,
      type: isLine ? 'line' : 'bar',
      data: yData,
      stack: isStacked ? 'total' : undefined,
      itemStyle: { color },
      lineStyle: { color }
    }

    if (isLine) {
      baseSeries.smooth = isSmooth
      if (chartType === 'area') {
        baseSeries.areaStyle = { opacity: 0.3, color }
      }
    } else if (isBar) {
      baseSeries.itemStyle.borderRadius = isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]
    }

    return baseSeries
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: isBar ? 'shadow' : 'line' }
    },
    legend: legendConfig,
    grid: {
      left: '3%',
      right: '4%',
      bottom: legendConfig.show && (config.value.appearance?.legendPosition === 'bottom') ? '12%' : '3%',
      top: legendConfig.show && (config.value.appearance?.legendPosition === 'top') ? '12%' : '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { rotate: xData.length > 10 ? 45 : 0 }
    },
    yAxis: { type: 'value' },
    series: echartsSeries,
    color: colorPalette
  }

  instance.setOption(option)
}

function handleResize() {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => [
    props.setting?.tableId,
    props.setting?.xField,
    props.setting?.xTimeGranularity,
    props.setting?.series,
    props.setting?.chartType,
    props.setting?.rowLimit,
    props.setting?.appearance
  ],
  () => {
    fetchData()
  },
  { immediate: true, deep: true }
)

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
})

// Expose resize for grid layout
defineExpose({
  resize: handleResize
})
</script>

<style scoped lang="scss">
.db-chart-widget {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart-container {
  flex: 1;
  min-height: 0;
}
</style>
