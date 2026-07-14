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
      <DemoTreeMatrix
        :tree-data="treeData"
        :columns="columns"
        :loading="loading"
        :row-class-name="rowClassName"
        @cell-click="onCellClick"
      />
      </div>
    </div>
    <DemoSoTableDialog v-model="soDialogVisible" :title="soDialogTitle" :rows="soDialogRows" show-allocated />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoFilterBar from '../dashboard/demo/DemoFilterBar.vue'
import DemoSoTableDialog from '../dashboard/demo/DemoSoTableDialog.vue'
import {
  loadPurchaseOrders,
  loadSalesOrders,
  loadAllocations,
  buildTree,
  formatNumber,
  formatCurrency,
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

const title = computed(() => '采购订单报表')
const rawRows = ref<any[]>([])
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const soDialogVisible = ref(false)
const soDialogTitle = ref('')
const soDialogRows = ref<any[]>([])

function rowClassName({ row }: { row: DemoTreeNode }): string {
  return row.level === 2 ? 'is-clickable' : ''
}

async function onCellClick({ row, triggerTreeNode }: any) {
  if (row.level !== 2 || triggerTreeNode) return
  const [orders, allocations, salesOrders] = await Promise.all([
    loadPurchaseOrders(),
    loadAllocations(),
    loadSalesOrders()
  ])
  const po = orders.find((o) => o.poNo === row.key)
  if (!po) return
  const lineIds = new Set(po.lines.map((l: any) => l.poLineId))
  const allocatedBySoLine = new Map<string, number>()
  for (const a of allocations) {
    if (lineIds.has(a.poLineId)) {
      allocatedBySoLine.set(a.soLineId, (allocatedBySoLine.get(a.soLineId) || 0) + a.allocatedQty)
    }
  }
  soDialogRows.value = salesOrders
    .filter((r) => allocatedBySoLine.has(r.soLineId))
    .map((r) => ({ ...r, allocatedQty: allocatedBySoLine.get(r.soLineId) }))
  soDialogTitle.value = `${po.poNo} — 相关销售订单`
  soDialogVisible.value = true
}

const filterDefs: DemoFilterDef[] = [
  { field: 'brand', label: '品牌', type: 'select' },
  { field: 'year', label: '年份', type: 'select' },
  { field: 'poNo', label: '采购订单', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' },
  { field: 'orderDate', label: '采购日期範圍', type: 'date-range' },
  { field: 'eta', label: '预计到货日期範圍', type: 'date-range' }
]

const filters = computed(() =>
  filterDefs.map((def) => (def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def))
)

const columns: MatrixColumn[] = [
  { field: 'label', title: '品牌 / 年份 / 采购订单 / 物料', width: 280, fixed: 'left' },
  { field: 'orderDate', title: '采购日期', align: 'center', sortable: true, formatter: (r) => r.orderDate || '' },
  { field: 'eta', title: '预计到货日期', align: 'center', sortable: true, formatter: (r) => r.eta || '' },
  { field: 'orderedQty', title: '订购数量', sortable: true, formatter: (r) => formatNumber(r.orderedQty || 0) },
  { field: 'receivedQty', title: '已收货数量', sortable: true, formatter: (r) => formatNumber(r.receivedQty || 0) },
  { field: 'openQty', title: '未到货数量', sortable: true, formatter: (r) => formatNumber(r.openQty || 0) },
  { field: 'value', title: '采购金额', sortable: true, formatter: (r) => formatCurrency(r.value || 0) }
]

const brands = useDemoBrands()
const year = useDemoYear()

const filteredRows = computed(() => {
  const rows = applyDemoFilters(rawRows.value, filterDefs, filterState.value)
  return (brands.value.includes(ALL_BRANDS) ? rows : rows.filter((r) => brands.value.includes(r.brand)))
    .filter((r) => inDemoYear(r.orderDate, year.value))
})

const treeData = computed<DemoTreeNode[]>(() =>
  buildTree(filteredRows.value, {
    levels: (r) => [r.brand, r.year, r.poNo, r.parts],
    init: (r) => ({ orderDate: r.orderDate, eta: r.eta }),
    merge: (node, r) => {
      if (node.level === 2) {
        node.orderDate = r.orderDate
        node.eta = r.eta
      }
      node.orderedQty = (node.orderedQty || 0) + r.orderedQty
      node.receivedQty = (node.receivedQty || 0) + r.receivedQty
      node.openQty = (node.openQty || 0) + r.openQty
      node.value = (node.value || 0) + r.value
    }
  })
)

async function load() {
  loading.value = true
  try {
    const orders = await loadPurchaseOrders()
    const rows: any[] = []
    for (const po of orders) {
      const year = po.orderDate ? po.orderDate.slice(0, 4) : '未知'
      for (const l of po.lines) {
        rows.push({
          brand: po.brand,
          year,
          poNo: po.poNo,
          orderDate: po.orderDate,
          eta: po.eta,
          parts: l.parts,
          orderedQty: l.orderedQty,
          receivedQty: l.receivedQty,
          openQty: l.openQty,
          value: l.value
        })
      }
    }
    rawRows.value = rows
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
.demo-widget :deep(.is-clickable) {
  cursor: pointer;
}
.demo-widget :deep(.is-clickable .vxe-cell--tree-node) {
  color: var(--el-color-primary, #409eff);
}
.demo-widget :deep(.is-clickable:hover .vxe-cell--tree-node) {
  text-decoration: underline;
}
</style>
