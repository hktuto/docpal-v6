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
    <div class="demo-widget year-picker">
      <el-select v-model="selectedYear" class="year-select">
        <el-option v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import { loadSalesOrders, loadTransactions, loadPurchaseOrders, loadArrivals } from '../../composables/demo/useDemoData'
import { useDemoYear, setDemoYear, ALL_YEARS, DEMO_YEAR_EVENT } from '../../composables/demo/demoYear'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => '年份篩選')
const loading = ref(false)

const year = useDemoYear()
const selectedYear = computed({
  get: () => year.value,
  set: (v: string) => setDemoYear(v)
})

const yearList = ref<string[]>([])
const options = computed(() => [{ label: '全部', value: ALL_YEARS }, ...yearList.value.map((y) => ({ label: y, value: y }))])

async function load() {
  loading.value = true
  try {
    const [salesOrders, transactions, purchaseOrders, arrivals] = await Promise.all([
      loadSalesOrders(),
      loadTransactions(),
      loadPurchaseOrders(),
      loadArrivals()
    ])
    const years = new Set<string>()
    for (const r of salesOrders) years.add((r.orderDate || '').slice(0, 4))
    for (const r of transactions) years.add((r.date || '').slice(0, 4))
    for (const r of purchaseOrders) years.add((r.orderDate || '').slice(0, 4))
    for (const r of arrivals) years.add((r.eta || '').slice(0, 4))
    yearList.value = [...years].filter(Boolean).sort()
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  // Sync already-rendered widgets with the persisted year (no ALL-then-filter flicker on reload).
  window.dispatchEvent(new CustomEvent(DEMO_YEAR_EVENT, { detail: { year: year.value } }))
})
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
}
.year-picker {
  display: flex;
  align-items: center;
  justify-content: center;
}
.year-select {
  width: 8rem;
  font-size: 1.2rem;
  :deep(.el-select__wrapper) {
    font-size: 1.2rem;
  }
}
</style>
