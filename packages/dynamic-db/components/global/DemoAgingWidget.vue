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
      <DemoFilterBar v-model="filterState" :filters="filters" />
      <div class="demo-grid">
      <DemoTreeMatrix :tree-data="treeData" :columns="columns" :loading="loading">
        <template #cell="{ row, column }">
          <div v-if="row['qty_' + column.field]" class="aging-cell">
            <span class="qty">{{ formatNumber(row['qty_' + column.field] || 0) }}</span>
            <span class="cost">{{ formatCompactCurrency(row['cost_' + column.field] || 0) }}</span>
          </div>
        </template>
      </DemoTreeMatrix>
      </div>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoFilterBar from '../dashboard/demo/DemoFilterBar.vue'
import {
  loadInventory,
  loadPartCosts,
  buildTree,
  ageBucket,
  AGE_BUCKETS,
  formatNumber,
  formatCompactCurrency,
  distinctValues,
  applyDemoFilters,
  type DemoFilterDef,
  type DemoFilterState,
  type DemoTreeNode
} from '../../composables/demo/useDemoData'
import { useDemoBrands, ALL_BRANDS } from '../../composables/demo/demoBrand'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => '库龄报表')
const rawRows = ref<any[]>([])
const costs = ref<Record<string, number>>({})
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const filterDefs: DemoFilterDef[] = [
  { field: 'brand', label: '品牌', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' }
]

const filters = computed(() =>
  filterDefs.map((def) => (def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def))
)

const columns: MatrixColumn[] = [
  { field: 'label', title: '品牌 / 物料', width: 280, fixed: 'left' },
  ...AGE_BUCKETS.map((b) => ({
    field: b.key,
    title: b.label,
    width: 110,
    rich: true,
    sortable: true,
    sortField: 'qty_' + b.key,
    aggregate: (roots: any[]) => {
      const qty = roots.reduce((s, r) => s + (r['qty_' + b.key] || 0), 0)
      const cost = roots.reduce((s, r) => s + (r['cost_' + b.key] || 0), 0)
      return qty ? `${formatNumber(qty)}\n${formatCompactCurrency(cost)}` : ''
    }
  })),
  {
    field: 'total',
    title: '总计',
    width: 120,
    rich: true,
    sortable: true,
    sortField: 'qty_total',
    aggregate: (roots: any[]) => {
      const qty = roots.reduce((s, r) => s + (r.qty_total || 0), 0)
      const cost = roots.reduce((s, r) => s + (r.cost_total || 0), 0)
      return qty ? `${formatNumber(qty)}\n${formatCompactCurrency(cost)}` : ''
    }
  }
]

const brands = useDemoBrands()

const filteredRows = computed(() => {
  const rows = applyDemoFilters(rawRows.value, filterDefs, filterState.value)
  return rows
})

const treeData = computed<DemoTreeNode[]>(() =>
  buildTree(filteredRows.value, {
    levels: (r) => [r.brand, r.parts],
    merge: (node, r) => {
      const bucket = ageBucket(r.ageDays)
      const cost = r.onHand * (costs.value[r.parts] || 0)
      node['qty_' + bucket] = (node['qty_' + bucket] || 0) + r.onHand
      node['cost_' + bucket] = (node['cost_' + bucket] || 0) + cost
      node.qty_total = (node.qty_total || 0) + r.onHand
      node.cost_total = (node.cost_total || 0) + cost
    }
  })
)

async function load() {
  loading.value = true
  try {
    const [rows, partCosts] = await Promise.all([loadInventory(), loadPartCosts()])
    rawRows.value = rows
    costs.value = partCosts
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.demo-grid {
  flex: 1;
  min-height: 0;
}
.aging-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  .cost {
    font-size: 0.6875rem;
    color: var(--el-text-color-secondary, #909399);
  }
}
</style>
