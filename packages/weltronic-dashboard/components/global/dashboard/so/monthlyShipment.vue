<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  formatMonthlyShipmentAmount,
  formatMonthlyShipmentAmountCompact,
  useMonthlyShipment,
  type MonthlyShipmentRow
} from '../../../../composables/useMonthlyShipment'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const { t } = useI18n()
const { filterForm, summary, loading, fetchList, resetFilter } = useMonthlyShipment()

const chartContainer = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function ensureChart() {
  if (!chartContainer.value) return null
  if (!chart) {
    chart = echarts.init(chartContainer.value)
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartContainer.value)
  }
  return chart
}

function renderChart(rows: MonthlyShipmentRow[]) {
  const instance = ensureChart()
  if (!instance) return

  const months = rows.map((row) => row.month)
  const fulfilled = rows.map((row) => row.fulfilledValue)
  const pending = rows.map((row) => row.pendingValue)

  instance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: number) => formatMonthlyShipmentAmount(Number(v || 0))
      },
      legend: {
        bottom: 0,
        data: [t('monthlyShipment.fulfilledValue'), t('monthlyShipment.pendingValue')]
      },
      grid: { left: 60, right: 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => formatMonthlyShipmentAmountCompact(v)
        }
      },
      series: [
        {
          name: t('monthlyShipment.fulfilledValue'),
          type: 'bar',
          stack: 'total',
          data: fulfilled,
          itemStyle: { color: '#409eff' }
        },
        {
          name: t('monthlyShipment.pendingValue'),
          type: 'bar',
          stack: 'total',
          data: pending,
          itemStyle: { color: '#1f2d3d' }
        }
      ]
    },
    true
  )
}

async function loadData() {
  const { list } = await fetchList()
  await nextTick()
  renderChart(list)
}

function handleFilter() {
  loadData()
}

function handleResetFilter() {
  resetFilter()
  loadData()
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})
</script>

<template>
  <DashboardCard :title="t('monthlyShipment.title')">
    <div v-loading="loading" class="monthly-shipment">
      <ResponsiveCollapseFilter class="monthly-shipment-filters">
        <ElInput
          v-model="filterForm.brand"
          :placeholder="t('monthlyShipment.brand')"
          clearable
          class="filter-item filter-input"
          @keyup.enter="handleFilter"
        />
        <ElInput
          v-model="filterForm.year"
          :placeholder="t('monthlyShipment.year')"
          clearable
          class="filter-item filter-input filter-input--narrow"
          @keyup.enter="handleFilter"
        />
        <ElInputNumber
          v-model="filterForm.monthsBack"
          :placeholder="t('monthlyShipment.monthsBack')"
          :min="1"
          :step="1"
          :controls="false"
          class="filter-item filter-number"
          @keyup.enter="handleFilter"
        />
        <ElButton type="primary" :loading="loading" @click="handleFilter">
          {{ t('monthlyShipment.search') }}
        </ElButton>
        <ElButton @click="handleResetFilter">{{ t('monthlyShipment.reset') }}</ElButton>
      </ResponsiveCollapseFilter>

      <div class="monthly-shipment-summary" aria-label="summary">
        <span>{{ t('monthlyShipment.monthCount') }}: {{ summary.monthCount }}</span>
        <span>
          {{ t('monthlyShipment.orderTotalValue') }}:
          {{ formatMonthlyShipmentAmount(summary.orderTotalValue) }}
        </span>
        <span>
          {{ t('monthlyShipment.fulfilledValue') }}:
          {{ formatMonthlyShipmentAmount(summary.fulfilledValue) }}
        </span>
        <span>
          {{ t('monthlyShipment.pendingValue') }}:
          {{ formatMonthlyShipmentAmount(summary.pendingValue) }}
        </span>
      </div>

      <div
        ref="chartContainer"
        class="monthly-shipment-chart"
        role="img"
        tabindex="0"
        :aria-label="t('monthlyShipment.title')"
      />
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.monthly-shipment {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.monthly-shipment-filters {
  width: 100%;
  flex-shrink: 0;
}
.monthly-shipment-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.monthly-shipment-chart {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
}
.filter-item {
  flex-shrink: 0;
}
.filter-input {
  width: 140px;
}
.filter-input--narrow {
  width: 100px;
}
.filter-number {
  width: 120px;
}
</style>
