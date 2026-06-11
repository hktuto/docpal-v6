<template>
  <DashboardCard
    ref="cardRef"
    :title="displayLabel"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-gauge-widget">
      <DbWidgetEmptyState v-if="!hasValue" />
      <div v-else ref="chartContainer" class="chart-container" />
    </div>
  </DashboardCard>
  <DbGaugeWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import * as echarts from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { useChartExport } from '../../composables/dashboard/useChartExport'
import DbWidgetEmptyState from './DbWidgetEmptyState.vue'

// Register required modules
echarts.use([GaugeChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

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
const value = ref(0)
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayLabel = computed(() => props.setting?.label || 'Metric')

const minVal = computed(() => Number(props.setting?.min) || 0)
const maxVal = computed(() => Number(props.setting?.max) || 100)
const targetVal = computed(() => Number(props.setting?.target) || 80)

const hasValue = computed(() => !loading.value && props.setting?.tableId)

const { exportChart } = useChartExport()

function initChart() {
  if (!chartContainer.value) return false
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  const instance = echarts.init(chartContainer.value)
  chartInstance.value = instance

  const option = {
    tooltip: {
      formatter: '{a} <br/>{b} : {c}'
    },
    series: [
      {
        name: displayLabel.value,
        type: 'gauge',
        min: minVal.value,
        max: maxVal.value,
        progress: {
          show: true,
          width: 12
        },
        pointer: {
          show: true,
          itemStyle: { color: 'auto' }
        },
        axisLine: {
          lineStyle: { width: 12 }
        },
        axisTick: {
          show: true,
          distance: -18,
          length: 6
        },
        splitLine: {
          show: true,
          distance: -18,
          length: 12
        },
        axisLabel: {
          distance: -40,
          fontSize: 10
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 16,
          itemStyle: { borderWidth: 4 }
        },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          offsetCenter: [0, '60%'],
          formatter: (v: number) => {
            if (Number.isInteger(v)) return v.toString()
            return v.toFixed(2)
          }
        },
        data: [
          {
            value: value.value,
            name: displayLabel.value
          }
        ]
      }
    ]
  }

  instance.setOption(option)

  // Export handler
  instance.on('dblclick', () => {
    exportChart(instance, `${displayLabel.value || 'gauge'}.png`)
  })
  return true
}

async function fetchValue() {
  const { tableId, aggregation, field } = props.setting || {}
  if (!tableId) return
  loading.value = true
  try {
    if (aggregation === 'count') {
      const { data }: any = await postDynamicActions({
        tableId,
        columns: [{ name: '*' }],
        pagination: { pageSize: 1, pageNum: 1 }
      })
      value.value = data?.meta?.total || 0
      return
    }

    const aggFunc = aggregation.toUpperCase()
    const { data }: any = await postDynamicActions({
      tableId,
      columns: [
        {
          name: field || '*',
          alias: 'agg_value',
          aggFunc
        }
      ]
    })

    const row = data?.data?.[0]
    const rawValue = row?.agg_value
    if (rawValue === null || rawValue === undefined) {
      value.value = 0
      return
    }

    const num = Number(rawValue)
    value.value = isNaN(num) ? 0 : num
  } catch (error) {
    console.error('Failed to fetch gauge value:', error)
    value.value = 0
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => [props.setting?.tableId, props.setting?.aggregation, props.setting?.field],
  () => {
    fetchValue()
  },
  { immediate: true }
)

watch(
  () => [value.value, minVal.value, maxVal.value, targetVal.value, displayLabel.value],
  () => {
    if (!chartInstance.value) {
      nextTick(() => initChart())
      return
    }
    chartInstance.value.setOption({
      series: [
        {
          min: minVal.value,
          max: maxVal.value,
          data: [{ value: value.value, name: displayLabel.value }]
        }
      ]
    })
  }
)

onMounted(() => {
  nextTick(() => initChart())
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchValue
)

defineExpose({
  resize: () => {
    chartInstance.value?.resize()
  }
})
</script>

<style scoped lang="scss">
.db-gauge-widget {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart-container {
  width: 100%;
  height: 100%;
}
</style>
