<template>
  <DashboardCard
    :title="title"
    :subtitle="setting.subtitle"
    :footer="setting.footer"
    :hide-setting="hideSetting"
    :bordered="false"
    :show-shadow="false"
    :show-fullscreen-icon="false"
    @delete="emit('delete')"
    @refresh="load"
  >
    <div class="demo-widget kpi-row">
      <div v-for="card in cards" :key="card.label" class="kpi-card">
        <div class="kpi-label">{{ card.label }}</div>
        <div class="kpi-value">{{ formatCompactCurrency(card.value) }}</div>
      </div>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import { loadSalesOrders, loadInventory, loadPartCosts, formatCompactCurrency } from '../../composables/demo/useDemoData'
import { isActiveSO, shippedValue, outstandingValue } from '../../composables/demo/demoSales'
import { useDemoBrands, ALL_BRANDS } from '../../composables/demo/demoBrand'
import { useDemoYear, inDemoYear } from '../../composables/demo/demoYear'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => '销售总览')
const loading = ref(false)

const brands = useDemoBrands()
const year = useDemoYear()

const cards = ref([
  { label: '订单总值', value: 0 },
  { label: '已出货值', value: 0 },
  { label: '待出货值', value: 0 },
  { label: '库存价值', value: 0 }
])

async function load() {
  loading.value = true
  try {
    const [allOrders, allInventory, partCosts] = await Promise.all([loadSalesOrders(), loadInventory(), loadPartCosts()])
    const orders = allOrders
      .filter((r) => brands.value.includes(ALL_BRANDS) || brands.value.includes(r.brand))
      .filter((r) => inDemoYear(r.orderDate, year.value))
    const inventory = allInventory.filter((r) => brands.value.includes(ALL_BRANDS) || brands.value.includes(r.brand))
    let total = 0
    let shipped = 0
    let outstanding = 0
    for (const r of orders.filter(isActiveSO)) {
      total += r.value
      shipped += shippedValue(r)
      outstanding += outstandingValue(r)
    }
    let inventoryValue = 0
    for (const r of inventory) {
      inventoryValue += r.onHand * (partCosts[r.parts] || 0)
    }
    cards.value = [
      { label: '订单总值', value: total },
      { label: '已出货值', value: shipped },
      { label: '待出货值', value: outstanding },
      { label: '库存价值', value: inventoryValue }
    ]
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

watch(brands, () => load())
watch(year, () => load())

onMounted(load)
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
}
.kpi-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}
.kpi-card {
  flex: 1;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 0.4rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  min-width: 0;
}
.kpi-label {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary, #909399);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-value {
  font-size: clamp(16px, 2vw + 1rem, 64px);
  color: var(--app-primary-color);
  font-weight: bold;
}
</style>
