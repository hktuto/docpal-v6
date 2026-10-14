<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  formatSoInventoryAgingAmount,
  formatSoInventoryAgingAmountCompact,
  formatSoInventoryAgingQty,
  formatSoInventoryAgingRatio,
  useSoInventoryAging,
  type SoInventoryAgingRow
} from '../../../../composables/useSoInventoryAging'

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const { t } = useI18n()
const { filterForm, summary, loading, fetchList, resetFilter } = useSoInventoryAging()

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

function renderChart(rows: SoInventoryAgingRow[]) {
  const instance = ensureChart()
  if (!instance) return

  const labels = rows.map((row) => row.label)
  const amounts = rows.map((row) => row.amount)
  const ratios = rows.map((row) => Number((row.ratio * 100).toFixed(2)))

  const amountName = t('soInventoryAging.amount')
  const ratioName = t('soInventoryAging.ratio')

  instance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params]
          const title = items[0]?.axisValueLabel ?? items[0]?.name ?? ''
          const lines = items.map((item: any) => {
            const value =
              item.seriesName === ratioName
                ? formatSoInventoryAgingRatio(Number(item.value || 0) / 100)
                : formatSoInventoryAgingAmount(Number(item.value || 0))
            return `${item.marker}${item.seriesName}: ${value}`
          })
          return [title, ...lines].join('<br/>')
        }
      },
      legend: {
        bottom: 0,
        data: [amountName, ratioName]
      },
      grid: { left: 60, right: 50, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: labels
      },
      yAxis: [
        {
          type: 'value',
          name: amountName,
          axisLabel: {
            formatter: (v: number) => formatSoInventoryAgingAmountCompact(v)
          }
        },
        {
          type: 'value',
          name: ratioName,
          min: 0,
          axisLabel: {
            formatter: (v: number) => `${v}%`
          }
        }
      ],
      series: [
        {
          name: amountName,
          type: 'bar',
          yAxisIndex: 0,
          data: amounts,
          itemStyle: { color: '#409eff' },
          barMaxWidth: 48
        },
        {
          name: ratioName,
          type: 'line',
          yAxisIndex: 1,
          data: ratios,
          smooth: true,
          itemStyle: { color: '#e6a23c' },
          lineStyle: { width: 2 }
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
  <DashboardCard :title="t('soInventoryAging.title')">
    <div v-loading="loading" class="so-inventory-aging">
      <ResponsiveCollapseFilter class="so-inventory-aging-filters">
        <ElInput
          v-model="filterForm.brand"
          :placeholder="t('soInventoryAging.brand')"
          clearable
          class="filter-item filter-input"
          @keyup.enter="handleFilter"
        />
        <ElInput
          v-model="filterForm.year"
          :placeholder="t('soInventoryAging.year')"
          clearable
          class="filter-item filter-input filter-input--narrow"
          @keyup.enter="handleFilter"
        />
        <ElButton type="primary" :loading="loading" @click="handleFilter">
          {{ t('soInventoryAging.search') }}
        </ElButton>
        <ElButton @click="handleResetFilter">{{ t('soInventoryAging.reset') }}</ElButton>
      </ResponsiveCollapseFilter>

      <div class="so-inventory-aging-summary" aria-label="summary">
        <span>
          {{ t('soInventoryAging.totalQty') }}:
          {{ formatSoInventoryAgingQty(summary.totalQty) }}
        </span>
        <span>
          {{ t('soInventoryAging.totalAmount') }}:
          {{ formatSoInventoryAgingAmount(summary.totalAmount) }}
          <span v-if="summary.hasAmount" class="summary-hint">
            {{ t('soInventoryAging.estimated') }}
          </span>
        </span>
      </div>

      <div
        ref="chartContainer"
        class="so-inventory-aging-chart"
        role="img"
        tabindex="0"
        :aria-label="t('soInventoryAging.title')"
      />
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.so-inventory-aging {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.so-inventory-aging-filters {
  width: 100%;
  flex-shrink: 0;
}
.so-inventory-aging-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.summary-hint {
  margin-left: 0.25rem;
  font-size: 0.7rem;
  color: var(--el-color-warning);
}
.so-inventory-aging-chart {
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
</style>
