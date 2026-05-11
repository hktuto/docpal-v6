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
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register required modules
echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

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

const chartTitle = computed(() => {
  const { chartType, xField, yField } = props.setting || {}
  if (xField && yField) return `${xField} vs ${yField}`
  return 'Chart'
})

async function fetchData() {
  const { tableId, xField, yField, aggregation, rowLimit, chartType } = props.setting || {}
  if (!tableId || !xField || !yField) {
    chartData.value = []
    return
  }

  loading.value = true
  try {
    const columns = [{ name: xField }, { name: yField }]
    const res: any = await postDynamicActions({
      tableId,
      columns,
      pagination: { pageSize: rowLimit || 20, pageNum: 1 }
    })
    const rows = res.data?.data || []

    // Aggregate data by xField
    const grouped: Record<string, number[]> = {}
    for (const row of rows) {
      const key = row[xField] || 'Unknown'
      const val = parseFloat(row[yField]) || 0
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(val)
    }

    // Apply aggregation
    const aggregated = Object.entries(grouped).map(([key, values]) => {
      let value: number
      switch (aggregation) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0)
          break
        case 'avg':
          value = values.reduce((a, b) => a + b, 0) / values.length
          break
        case 'count':
        default:
          value = values.length
          break
      }
      return { key, value: Math.round(value * 100) / 100 }
    })

    // Sort by value descending
    aggregated.sort((a, b) => b.value - a.value)
    chartData.value = aggregated.slice(0, rowLimit || 20)

    await nextTick()
    initChart()
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
    chartData.value = []
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!chartContainer.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  const { chartType } = props.setting || {}
  const instance = echarts.init(chartContainer.value)
  chartInstance.value = instance

  const xData = chartData.value.map((d) => d.key)
  const yData = chartData.value.map((d) => d.value)

  let option: any

  if (chartType === 'pie') {
    option = {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: chartData.value.map((d) => ({ name: d.key, value: d.value })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
  } else if (chartType === 'line') {
    option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { rotate: xData.length > 10 ? 45 : 0 }
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          data: yData,
          smooth: true,
          areaStyle: { opacity: 0.2 }
        }
      ]
    }
  } else {
    // bar (default)
    option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { rotate: xData.length > 10 ? 45 : 0 }
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: yData,
          itemStyle: { borderRadius: [4, 4, 0, 0] }
        }
      ]
    }
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
  () => [props.setting?.tableId, props.setting?.xField, props.setting?.yField, props.setting?.aggregation, props.setting?.chartType, props.setting?.rowLimit],
  () => {
    fetchData()
  },
  { immediate: true }
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
