<script lang="ts" setup>
import {
  formatSalesOverviewAmount,
  formatSalesOverviewAmountFull,
  useSalesOverview
} from '../../../../composables/useSalesOverview'

const { t } = useI18n()
const { filterForm, summary, loading, fetchSummary, resetFilter } = useSalesOverview()

const cards = computed(() => [
  {
    key: 'orderTotalValue',
    label: t('salesOverview.orderTotalValue'),
    value: summary.value.orderTotalValue
  },
  {
    key: 'fulfilledValue',
    label: t('salesOverview.fulfilledValue'),
    value: summary.value.fulfilledValue
  },
  {
    key: 'pendingValue',
    label: t('salesOverview.pendingValue'),
    value: summary.value.pendingValue
  },
  {
    key: 'inventoryValue',
    label: t('salesOverview.inventoryValue'),
    value: summary.value.inventoryValue,
    estimated: summary.value.hasInventoryValue
  }
])

function handleFilter() {
  fetchSummary()
}

function handleResetFilter() {
  resetFilter()
  fetchSummary()
}

onMounted(() => {
  fetchSummary()
})
</script>

<template>
  <DashboardCard :title="t('salesOverview.title')">
    <div v-loading="loading" class="sales-overview">
      <ResponsiveCollapseFilter class="sales-overview-filters">
        <ElInput
          v-model="filterForm.brand"
          :placeholder="t('salesOverview.brand')"
          clearable
          class="filter-item filter-input"
          @keyup.enter="handleFilter"
        />
        <ElInput
          v-model="filterForm.year"
          :placeholder="t('salesOverview.year')"
          clearable
          class="filter-item filter-input filter-input--narrow"
          @keyup.enter="handleFilter"
        />
        <ElButton type="primary" :loading="loading" @click="handleFilter">
          {{ t('salesOverview.search') }}
        </ElButton>
        <ElButton @click="handleResetFilter">{{ t('salesOverview.reset') }}</ElButton>
      </ResponsiveCollapseFilter>

      <div class="kpi-row" aria-label="sales overview summary">
        <div
          v-for="card in cards"
          :key="card.key"
          v-tooltip="formatSalesOverviewAmountFull(card.value)"
          class="kpi-card"
          tabindex="0"
          :aria-label="`${card.label}: ${formatSalesOverviewAmountFull(card.value)}`"
        >
          <div class="kpi-label">
            {{ card.label }}
            <span v-if="card.estimated" class="kpi-hint">
              {{ t('salesOverview.estimated') }}
            </span>
          </div>
          <div class="kpi-value">{{ formatSalesOverviewAmount(card.value) }}</div>
        </div>
      </div>
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.sales-overview {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.sales-overview-filters {
  width: 100%;
  flex-shrink: 0;
}
.filter-item {
  flex-shrink: 0;
}
.filter-input {
  width: 160px;
}
.filter-input--narrow {
  width: 100px;
}
.kpi-row {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: var(--app-space-s);
  align-items: stretch;
}
.kpi-card {
  flex: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 0.4rem;
  padding: var(--app-space-s) var(--app-space-m);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  min-width: 0;
  outline: none;
}
.kpi-label {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.kpi-hint {
  font-size: 0.7rem;
  color: var(--el-color-warning);
}
.kpi-value {
  font-size: clamp(16px, 2vw + 1rem, 48px);
  color: var(--app-primary-color);
  font-weight: 700;
  line-height: 1.2;
}
</style>
