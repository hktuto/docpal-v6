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
      >
        <template #cell="{ row, column }">
          <span v-if="column.field === 'status' && row.status" class="status-tag" :class="statusClass(row.status)">
            {{ statusLabel(row.status) }}
          </span>
        </template>
      </DemoTreeMatrix>
      </div>
    </div>
    <DemoPoDetailDialog v-model="poDialogVisible" :po-id="poDialogId" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoFilterBar from '../dashboard/demo/DemoFilterBar.vue'
import DemoPoDetailDialog from '../dashboard/demo/DemoPoDetailDialog.vue'
import {
  loadArrivals,
  buildTree,
  formatNumber,
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

const title = computed(() => props.setting?.title || '即將到貨')
const rawRows = ref<any[]>([])
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const poDialogVisible = ref(false)
const poDialogId = ref<string | null>(null)

function rowClassName({ row }: { row: DemoTreeNode }): string {
  return row.level === 3 || row.level === 4 ? 'is-clickable' : ''
}

function onCellClick({ row, triggerTreeNode }: any) {
  if (row.level !== 3 && row.level !== 4) return
  if (triggerTreeNode) return
  poDialogId.value = row.level === 3 ? row.key : row.poId
  poDialogVisible.value = true
}

const filterDefs: DemoFilterDef[] = [
  { field: 'warehouse', label: '倉庫', type: 'select' },
  { field: 'brand', label: '品牌', type: 'select' },
  { field: 'eta', label: '交貨日期範圍', type: 'date-range' }
]

const filters = computed(() =>
  filterDefs.map((def) => (def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def))
)

const columns: MatrixColumn[] = [
  { field: 'label', title: '倉庫', width: 200, fixed: 'left', sortable: true },
  { field: 'qtyShipped', title: '出貨數量', sortable: true, formatter: (r) => (r.qtyShipped != null ? formatNumber(r.qtyShipped) : '') },
  { field: 'carrier', title: '承運商', align: 'left', formatter: (r) => r.carrier || '' },
  { field: 'trackingNo', title: '追蹤編號', align: 'left', formatter: (r) => r.trackingNo || '' },
  { field: 'status', title: '狀態', align: 'center', rich: true }
]

// Display-only labels for shipment status values; raw English values still drive statusClass/logic.
const STATUS_LABELS: Record<string, string> = {
  'In Transit': '運送中',
  Delivered: '已送達',
  Delayed: '延誤'
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status || ''
}

function statusClass(status: string): string {
  if (status === 'In Transit') return 'in-transit'
  if (status === 'Delayed') return 'delayed'
  if (status === 'Delivered') return 'delivered'
  return ''
}

const brands = useDemoBrands()
const year = useDemoYear()

const filteredRows = computed(() => {
  const rows = applyDemoFilters(rawRows.value, filterDefs, filterState.value)
  return (brands.value.includes(ALL_BRANDS) ? rows : rows.filter((r) => brands.value.includes(r.brand)))
    .filter((r) => inDemoYear(r.eta, year.value))
})

const treeData = computed(() =>
  buildTree(filteredRows.value, {
    levels: (r) => [r.warehouse, r.brand, r.eta, r.poId, r.parts],
    init: (r) => ({ carrier: r.carrier, trackingNo: r.trackingNo, status: r.status, poId: r.poId }),
    merge: (node, r) => {
      node.qtyShipped = (node.qtyShipped || 0) + r.qtyShipped
    }
  })
)

async function load() {
  loading.value = true
  try {
    rawRows.value = await loadArrivals()
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
.status-tag {
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  &.in-transit {
    color: var(--el-color-primary, #409eff);
    background: rgba(64, 158, 255, 0.12);
  }
  &.delayed {
    color: var(--el-color-danger, #f56c6c);
    background: rgba(245, 108, 108, 0.12);
  }
  &.delivered {
    color: var(--el-color-success, #67c23a);
    background: rgba(103, 194, 58, 0.12);
  }
}
</style>
