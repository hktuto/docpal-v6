<template>
  <DashboardCard
    ref="cardRef"
    :title="chartTitle"
    :subtitle="config.subtitle"
    :footer="config.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-chart-widget">
      <DbWidgetEmptyState v-if="!chartData.length" />
      <div v-else ref="chartContainer" class="chart-container" />
    </div>
  </DashboardCard>
  <DbChartWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { useChartExport } from '../../composables/dashboard/useChartExport'
import DbWidgetEmptyState from './DbWidgetEmptyState.vue'

// Register required modules
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

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

const fieldMap = ref<Record<string, string>>({})
const { getFields } = useTableFields()

async function loadFieldLabels(tableId: string) {
  if (!tableId) {
    fieldMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  const map: Record<string, string> = {}
  for (const f of fields) {
    map[f.field_name] = f.field_name_alias || f.field_name
  }
  fieldMap.value = map
}

function fieldLabel(fieldName: string): string {
  return fieldMap.value[fieldName] || fieldName
}

const chartTitle = computed(() => {
  const { xField } = config.value
  const seriesLabels = (config.value.series || [])
    .map((s: any) => {
      if (s.label) return s.label
      if (s.field) return fieldLabel(s.field)
      if (s.aggregation === 'count') return 'Count'
      return ''
    })
    .filter(Boolean)
  if (xField && seriesLabels.length) {
    return `${fieldLabel(xField)} vs ${seriesLabels.join(', ')}`
  }
  return 'Chart'
})

function buildServerSideParams() {
  const { tableId, xField, series } = config.value

  const columns: any[] = [{ name: xField }]
  const validSeries = (series || []).filter((s: any) => s.field || s.aggregation === 'count')

  validSeries.forEach((s: any, index: number) => {
    const isCount = s.aggregation === 'count'
    const aggFunc = isCount ? 'COUNT' : s.aggregation.toUpperCase()
    columns.push({
      name: isCount ? '*' : s.field,
      alias: isCount ? '__count' : `series_${index}`,
      aggFunc
    })
  })

  return {
    tableId,
    groupBy: { columns: [xField] },
    columns,
    orderBy: [{ column: xField, desc: false }]
  }
}

async function fetchData() {
  const { tableId, xField, series } = config.value
  const validSeries = (series || []).filter((s: any) => s.field || s.aggregation === 'count')

  if (!tableId || !xField || validSeries.length === 0) {
    chartData.value = []
    return
  }

  loading.value = true
  try {
    const params = buildServerSideParams()
    const res: any = await postDynamicActions(params)
    const rows = res.data?.data || []
    chartData.value = rows.map((row: any) => {
      const item: any = { key: row[xField] ?? 'Unknown' }
      validSeries.forEach((s: any, index: number) => {
        if (s.aggregation === 'count') {
          item[`series_${index}`] = row.__count ?? row[`series_${index}`] ?? 0
        } else {
          item[`series_${index}`] = row[`series_${index}`] ?? 0
        }
      })
      return item
    })

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

  const { series, appearance } = config.value
  const validSeries = (series || []).filter((s: any) => s.field || s.aggregation === 'count')
  const instance = echarts.init(chartContainer.value)
  chartInstance.value = instance

  const hasAnyLine = validSeries.some((s: any) => resolveSeriesType(s) === 'line' || resolveSeriesType(s) === 'area')
  const hasAnyBar = validSeries.some((s: any) => resolveSeriesType(s) === 'bar')

  const legendConfig = getLegendConfig()

  // Cartesian charts (bar, line, area)
  const xData = chartData.value.map((d) => d.key)
  const isStacked = appearance?.stacked || false
  const isSmooth = appearance?.smooth || false

  const echartsSeries = validSeries.map((s: any, index: number) => {
    const color = s.color || colorPalette[index % colorPalette.length]
    const yData = chartData.value.map((d) => d[`series_${index}`] ?? 0)
    const seriesType = resolveSeriesType(s)

    const baseSeries: any = {
      name: s.label || (s.field ? fieldLabel(s.field) : 'Count'),
      type: seriesType === 'area' ? 'line' : seriesType,
      data: yData,
      stack: isStacked ? 'total' : undefined,
      itemStyle: { color },
      lineStyle: { color }
    }

    if (seriesType === 'line' || seriesType === 'area') {
      baseSeries.smooth = isSmooth
      if (seriesType === 'area') {
        baseSeries.areaStyle = { opacity: 0.3, color }
      }
    } else if (seriesType === 'bar') {
      baseSeries.itemStyle.borderRadius = isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]
    }

    return baseSeries
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: hasAnyBar ? 'shadow' : 'line' }
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

function resolveSeriesType(s: any): string {
  if (s.type) return s.type
  // Backward compatibility: fall back to global chartType
  const globalType = config.value.chartType
  if (globalType) return globalType
  return 'bar'
}

function handleResize() {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

const { exportChart } = useChartExport()

function handleExport() {
  exportChart(chartInstance.value, chartTitle.value || 'chart')
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => props.setting?.tableId,
  (tableId) => {
    loadFieldLabels(tableId)
  },
  { immediate: true }
)

watch(
  () => [
    props.setting?.tableId,
    props.setting?.xField,
    props.setting?.series,
    props.setting?.appearance
  ],
  () => {
    fetchData()
  },
  { immediate: true, deep: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchData
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
/* removed empty-state style; replaced by DbWidgetEmptyState */
.chart-container {
  flex: 1;
  min-height: 0;
}
</style>
