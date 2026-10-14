<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  formatCustomerPendingAmount,
  formatCustomerPendingAmountCompact,
  formatCustomerPendingQty,
  useCustomerPending,
  type CustomerPendingRow
} from '../../../../composables/useCustomerPending'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const { t } = useI18n()
const { filterForm, summary, list, currentLevel, loading, fetchList, resetFilter } =
  useCustomerPending()

const chartContainer = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

/** Active parent group when drilled into customer level; empty at root. */
const parentCustomerGroup = ref('')

const canDrill = computed(() => currentLevel.value === 'customer_group')

const breadcrumbItems = computed(() => {
  const items = [{ key: 'root', label: t('customerPending.allGroups') }]
  if (parentCustomerGroup.value) {
    items.push({ key: 'group', label: parentCustomerGroup.value })
  }
  return items
})

const cards = computed(() => [
  {
    key: 'customerGroupCount',
    label: t('customerPending.customerGroupCount'),
    value: formatCustomerPendingQty(summary.value.customerGroupCount)
  },
  {
    key: 'customerCount',
    label: t('customerPending.customerCount'),
    value: formatCustomerPendingQty(summary.value.customerCount)
  },
  {
    key: 'pendingQty',
    label: t('customerPending.pendingQty'),
    value: formatCustomerPendingQty(summary.value.pendingQty)
  },
  {
    key: 'pendingAmount',
    label: t('customerPending.pendingAmount'),
    value: formatCustomerPendingAmount(summary.value.pendingAmount)
  }
])

function ensureChart() {
  if (!chartContainer.value) return null
  if (!chart) {
    chart = echarts.init(chartContainer.value)
    chart.on('click', handleChartClick)
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartContainer.value)
  }
  return chart
}

function resolveGroupName(row: CustomerPendingRow) {
  return row.customerGroup || row.label
}

function drillToGroup(row?: CustomerPendingRow) {
  if (!canDrill.value || !row) return
  if (!row.hasChildren && row.level !== 'customer_group') return
  const groupName = resolveGroupName(row)
  if (!groupName) return
  parentCustomerGroup.value = groupName
  loadData()
}

function handleChartClick(params: any) {
  if (!canDrill.value) return
  if (params?.componentType === 'yAxis') {
    const label = String(params?.value ?? '')
    const row = list.value.find((item) => item.label === label)
    drillToGroup(row)
    return
  }
  const dataIndex = Number(params?.dataIndex)
  if (!Number.isFinite(dataIndex) || dataIndex < 0) return
  drillToGroup(list.value[dataIndex])
}

function renderChart(rows: CustomerPendingRow[]) {
  const instance = ensureChart()
  if (!instance) return

  const labels = rows.map((row) => row.label)
  const amounts = rows.map((row) => row.pendingAmount)
  const qtyName = t('customerPending.pendingQty')
  const amountName = t('customerPending.pendingAmount')
  const categoryCount = Math.max(rows.length, 1)
  const gridTop = 12
  const gridBottom = 12
  const barCategoryGap = '35%'

  instance.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params]
          const idx = Number(items[0]?.dataIndex ?? -1)
          const row = idx >= 0 ? rows[idx] : null
          const title = row?.label ?? items[0]?.axisValueLabel ?? items[0]?.name ?? ''
          if (!row) return title
          return [
            title,
            `${amountName}: ${formatCustomerPendingAmount(row.pendingAmount)}`,
            `${qtyName}: ${formatCustomerPendingQty(row.pendingQty)}`
          ].join('<br/>')
        }
      },
      grid: {
        left: 12,
        right: 48,
        top: gridTop,
        bottom: gridBottom,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => formatCustomerPendingAmountCompact(v)
        }
      },
      yAxis: {
        type: 'category',
        data: labels,
        inverse: true,
        axisLabel: {
          width: 120,
          overflow: 'truncate',
          ellipsis: '...'
        },
        triggerEvent: canDrill.value
      },
      series: [
        {
          name: amountName,
          type: 'bar',
          data: amounts,
          barCategoryGap,
          itemStyle: {
            color: canDrill.value ? '#409eff' : '#1f2d3d',
            borderRadius: [0, 4, 4, 0]
          },
          cursor: canDrill.value ? 'pointer' : 'default',
          label: {
            show: categoryCount <= 20,
            position: 'right',
            formatter: (p: any) => formatCustomerPendingAmountCompact(Number(p.value || 0)),
            color: 'var(--el-text-color-regular)',
            fontSize: 11
          }
        }
      ]
    },
    true
  )
}

async function loadData() {
  const { list: rows } = await fetchList({
    parentCustomerGroup: parentCustomerGroup.value || undefined
  })
  await nextTick()
  renderChart(rows)
}

function handleFilter() {
  parentCustomerGroup.value = ''
  loadData()
}

function handleResetFilter() {
  resetFilter()
  parentCustomerGroup.value = ''
  loadData()
}

function handleBreadcrumbClick(key: string) {
  if (key === 'root') {
    if (!parentCustomerGroup.value) return
    parentCustomerGroup.value = ''
    loadData()
  }
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.off('click', handleChartClick)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <DashboardCard :title="t('customerPending.title')">
    <div v-loading="loading" class="customer-pending">
      <ResponsiveCollapseFilter class="customer-pending-filters">
        <ElInput
          v-model="filterForm.brand"
          :placeholder="t('customerPending.brand')"
          clearable
          class="filter-item filter-input"
          @keyup.enter="handleFilter"
        />
        <ElInput
          v-model="filterForm.year"
          :placeholder="t('customerPending.year')"
          clearable
          class="filter-item filter-input filter-input--narrow"
          @keyup.enter="handleFilter"
        />
        <ElButton type="primary" :loading="loading" @click="handleFilter">
          {{ t('customerPending.search') }}
        </ElButton>
        <ElButton @click="handleResetFilter">{{ t('customerPending.reset') }}</ElButton>
      </ResponsiveCollapseFilter>

      <div class="kpi-row" aria-label="customer pending summary">
        <div
          v-for="card in cards"
          :key="card.key"
          v-tooltip="card.value"
          class="kpi-card"
          tabindex="0"
          :aria-label="`${card.label}: ${card.value}`"
        >
          <div class="kpi-label">{{ card.label }}</div>
          <div class="kpi-value">{{ card.value }}</div>
        </div>
      </div>

      <nav class="customer-pending-breadcrumb" aria-label="breadcrumb">
        <template v-for="(item, index) in breadcrumbItems" :key="item.key">
          <button
            v-if="index < breadcrumbItems.length - 1"
            type="button"
            class="breadcrumb-link"
            tabindex="0"
            :aria-label="item.label"
            @click="handleBreadcrumbClick(item.key)"
            @keydown.enter="handleBreadcrumbClick(item.key)"
          >
            {{ item.label }}
          </button>
          <span v-else class="breadcrumb-current" aria-current="page">{{ item.label }}</span>
          <span v-if="index < breadcrumbItems.length - 1" class="breadcrumb-sep" aria-hidden="true">
            /
          </span>
        </template>
      </nav>

      <div
        ref="chartContainer"
        class="customer-pending-chart"
        role="img"
        tabindex="0"
        :aria-label="t('customerPending.title')"
      />
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.customer-pending {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.customer-pending-filters {
  width: 100%;
  flex-shrink: 0;
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
.kpi-row {
  display: flex;
  flex-shrink: 0;
  gap: var(--app-space-s);
  align-items: stretch;
}
.kpi-card {
  flex: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 0.4rem;
  padding: var(--app-space-xs) var(--app-space-s);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  min-width: 0;
  outline: none;
}
.kpi-label {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-value {
  font-size: clamp(14px, 1.2vw + 0.6rem, 22px);
  color: var(--app-primary-color);
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.customer-pending-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.breadcrumb-link {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  font: inherit;
  outline: none;
}
.breadcrumb-link:hover,
.breadcrumb-link:focus-visible {
  text-decoration: underline;
}
.breadcrumb-current {
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.breadcrumb-sep {
  color: var(--el-text-color-secondary);
}
.customer-pending-chart {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
}
</style>
