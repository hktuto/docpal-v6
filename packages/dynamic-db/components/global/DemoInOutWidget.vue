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
      <DemoFilterBar v-model="filterState" :filters="filters" >
          <div class="desc">
            <div class="in dot">

            </div>
            <span>In</span>
            <div class="out dot">
            </div>
            <span>Out</span>
          </div>
      </DemoFilterBar>
      <div class="demo-grid">
      <DemoTreeMatrix :tree-data="treeData" :columns="columns" :loading="loading">
        <template #cell="{ row, column }">
          <div v-if="row['in_' + column.field] || row['out_' + column.field]" class="inout-cell">
            <span class="in">↑ {{ formatNumber(row['in_' + column.field] || 0) }}</span>
            <span class="out">↓ {{ formatNumber(Math.abs(row['out_' + column.field] || 0)) }}</span>
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
  loadTransactions,
  buildTree,
  monthKey,
  formatNumber,
  INBOUND_TYPES,
  OUTBOUND_TYPES,
  distinctValues,
  applyDemoFilters,
  type DemoFilterDef,
  type DemoFilterState,
  type DemoTreeNode
} from '../../composables/demo/useDemoData'
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

const title = computed(() => '仓库入库/出库')
const rawRows = ref<any[]>([])
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const filterDefs: DemoFilterDef[] = [
  { field: 'warehouse', label: '仓库', type: 'select' },
  { field: 'brand', label: '品牌', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' }
]

const filters = computed(() =>
  filterDefs.map((def) => (def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def))
)

const brands = useDemoBrands()
const year = useDemoYear()

const filteredRows = computed(() => {
  const rows = applyDemoFilters(rawRows.value, filterDefs, filterState.value)
  return rows
})

// Month columns derived from (filtered) data; each month column sorts by its inbound qty
const columns = computed<MatrixColumn[]>(() => {
  const months = [...new Set(filteredRows.value.map((r) => monthKey(r.date)))].sort()
  return [
    { field: 'label', title: '仓库 / 品牌 / 物料', width: 260, fixed: 'left' },
    ...months.map((m) => ({
      field: m,
      title: m,
      width: 110,
      rich: true,
      sortable: true,
      sortField: 'in_' + m,
      aggregate: (roots: any[]) => {
        const totalIn = roots.reduce((s, r) => s + (r['in_' + m] || 0), 0)
        const totalOut = roots.reduce((s, r) => s + (Math.abs(r['out_' + m]) || 0), 0)
        return totalIn || totalOut ? `↑ ${formatNumber(totalIn)}\n↓ ${formatNumber(totalOut)}` : ''
      }
    })),
    {
      field: 'total',
      title: '总计',
      width: 120,
      rich: true,
      sortable: true,
      sortField: 'in_total',
      aggregate: (roots: any[]) => {
        const totalIn = roots.reduce((s, r) => s + (r.in_total || 0), 0)
        const totalOut = roots.reduce((s, r) => s + (Math.abs(r.out_total) || 0), 0)
        return totalIn || totalOut ? `↑ ${formatNumber(totalIn)}\n↓ ${formatNumber(totalOut)}` : ''
      }
    }
  ]
})

const treeData = computed<DemoTreeNode[]>(() =>
  buildTree(filteredRows.value, {
    levels: (r) => [r.warehouse, r.brand, r.parts],
    merge: (node, r) => {
      const m = monthKey(r.date)
      if (INBOUND_TYPES.includes(r.type)) {
        node['in_' + m] = (node['in_' + m] || 0) + r.qty
        node.in_total = (node.in_total || 0) + r.qty
      } else if (OUTBOUND_TYPES.includes(r.type)) {
        node['out_' + m] = (node['out_' + m] || 0) + r.qty
        node.out_total = (node.out_total || 0) + r.qty
      }
      // MOVE intentionally excluded (internal transfer)
    }
  })
)

async function load() {
  loading.value = true
  try {
    rawRows.value = await loadTransactions()
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.desc{
    display: flex;
    flex-flow: row nowarp;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;
}
.dot{
    width: 12px;
    height: 12px;
    border-radius: 4px;
    &.in{
        background: var(--el-color-success, #67c23a);
    }
    &.out {
        background: var(--el-color-danger, #f56c6c);
    }
}
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
.inout-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  .in {
    color: var(--el-color-success, #67c23a);
  }
  .out {
    color: var(--el-color-danger, #f56c6c);
  }
}
</style>
