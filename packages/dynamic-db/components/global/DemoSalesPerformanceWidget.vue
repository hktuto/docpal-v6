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
    <DemoSoTableDialog v-model="soDialogVisible" :title="soDialogTitle" :rows="soDialogRows" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoFilterBar from '../dashboard/demo/DemoFilterBar.vue'
import DemoSoTableDialog from '../dashboard/demo/DemoSoTableDialog.vue'
import {
  loadSalesOrders,
  buildTree,
  formatNumber,
  formatCurrency,
  distinctValues,
  applyDemoFilters,
  type DemoFilterDef,
  type DemoFilterState,
  type DemoTreeNode
} from '../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || '銷售表現儀表板')
const rawRows = ref<any[]>([])
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const soDialogVisible = ref(false)
const soDialogTitle = ref('')
const soDialogRows = ref<any[]>([])

function rowClassName({ row }: { row: DemoTreeNode }): string {
  return row.level <= 1 ? 'is-clickable' : ''
}

async function onCellClick({ row, triggerTreeNode }: any) {
  if (triggerTreeNode || (row.level !== 0 && row.level !== 1)) return
  const salesOrders = await loadSalesOrders()
  const field = row.level === 0 ? 'brand' : 'parts'
  soDialogRows.value = salesOrders.filter((r) => r[field] === row.key)
  soDialogTitle.value = `${row.key} — 銷售訂單`
  soDialogVisible.value = true
}

const filterDefs: DemoFilterDef[] = [
  { field: 'brand', label: '品牌', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' }
]

const filters = computed(() =>
  filterDefs.map((def) => (def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def))
)

const columns: MatrixColumn[] = [
  { field: 'label', title: '品牌 / 物料', width: 280, fixed: 'left' },
  { field: 'orderQty', title: '訂單數量', sortable: true, formatter: (r) => formatNumber(r.orderQty || 0) },
  { field: 'shippedQty', title: '已出貨數量', sortable: true, formatter: (r) => formatNumber(r.shippedQty || 0) },
  { field: 'value', title: '銷售金額', sortable: true, formatter: (r) => formatCurrency(r.value || 0) },
  {
    field: 'fulfillment',
    title: '出貨達成率',
    align: 'center',
    sortable: true,
    sortField: (r) => (r.orderQty ? (r.shippedQty || 0) / r.orderQty : Number.NaN),
    formatter: (r) => (r.orderQty ? `${(((r.shippedQty || 0) / r.orderQty) * 100).toFixed(1)}%` : '')
  }
]

const treeData = computed<DemoTreeNode[]>(() =>
  buildTree(applyDemoFilters(rawRows.value, filterDefs, filterState.value), {
    levels: (r) => [r.brand, r.parts],
    merge: (node, r) => {
      node.orderQty = (node.orderQty || 0) + r.orderQty
      node.shippedQty = (node.shippedQty || 0) + r.shippedQty
      node.value = (node.value || 0) + r.value
    }
  })
)

async function load() {
  loading.value = true
  try {
    rawRows.value = await loadSalesOrders()
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
