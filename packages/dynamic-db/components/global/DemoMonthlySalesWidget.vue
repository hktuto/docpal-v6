<template>
  <DashboardCard
    :title="title"
    :subtitle="setting.subtitle"
    :footer="setting.footer"
    :hide-setting="hideSetting"
    @delete="emit('delete')"
    @refresh="load"
  >
    <div class="demo-widget">
      <div ref="chartContainer" class="chart-container" />
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { loadSalesOrders, monthKey, formatCompactCurrency } from '../../composables/demo/useDemoData'
import { isActiveSO, shippedValue, outstandingValue } from '../../composables/demo/demoSales'
import { useDemoChart } from '../../composables/demo/useDemoChart'
import { useDemoBrands, ALL_BRANDS } from '../../composables/demo/demoBrand'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || '每月已出貨與待出貨')
const loading = ref(false)

const brands = useDemoBrands()

const chartContainer = ref<HTMLElement>()
const { render } = useDemoChart(chartContainer)

async function load() {
  loading.value = true
  try {
    const allOrders = await loadSalesOrders()
    const orders = allOrders.filter((r) => brands.value.includes(ALL_BRANDS) || brands.value.includes(r.brand)).filter(isActiveSO)
    const months = [...new Set(orders.map((r) => monthKey(r.orderDate)))].filter((m) => m !== 'Unknown').sort()
    const shippedByMonth = months.map((month) =>
      orders.filter((r) => monthKey(r.orderDate) === month).reduce((sum, r) => sum + shippedValue(r), 0)
    )
    const outstandingByMonth = months.map((month) =>
      orders.filter((r) => monthKey(r.orderDate) === month).reduce((sum, r) => sum + outstandingValue(r), 0)
    )
    render({
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatCompactCurrency(v) },
      legend: { bottom: 0 },
      grid: { left: 60, right: 20, top: 20, bottom: 50 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatCompactCurrency(v) } },
      series: [
        {
          name: '已出貨值',
          type: 'bar',
          stack: 'total',
          data: shippedByMonth.map(Math.round),
          itemStyle: { color: '#409eff' },
          label: { show: true, formatter: ({ value }: any) => formatCompactCurrency(Number(value)) }
        },
        {
          name: '待出貨值',
          type: 'bar',
          stack: 'total',
          data: outstandingByMonth.map(Math.round),
          itemStyle: { color: '#1f2d3d' },
          label: { show: true, formatter: ({ value }: any) => formatCompactCurrency(Number(value)) }
        }
      ]
    })
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

watch(brands, () => load())

onMounted(load)
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
}
.chart-container {
  height: 100%;
  width: 100%;
}
</style>
