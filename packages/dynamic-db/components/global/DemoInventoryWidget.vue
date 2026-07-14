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
    <DemoInventoryDrillDialog v-model="drillVisible" :warehouse="drillWarehouse" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoFilterBar from '../dashboard/demo/DemoFilterBar.vue'
import DemoInventoryDrillDialog from '../dashboard/demo/DemoInventoryDrillDialog.vue'
import {
  loadInventory,
  buildTree,
  formatNumber,
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

const title = computed(() => props.setting?.title || '總庫存報表')
const rawRows = ref<any[]>([])
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const drillVisible = ref(false)
const drillWarehouse = ref<string | null>(null)

function rowClassName({ row }: { row: DemoTreeNode }): string {
  return row.level === 2 ? 'is-clickable' : ''
}

function onCellClick({ row, triggerTreeNode }: any) {
  if (row.level !== 2) return
  if (triggerTreeNode) return
  drillWarehouse.value = row.key
  drillVisible.value = true
}

const filterDefs: DemoFilterDef[] = [
  { field: 'brand', label: '品牌', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' },
  { field: 'warehouse', label: '倉庫', type: 'select' }
]

const filters = computed(() =>
  filterDefs.map((def) => (def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def))
)

const columns: MatrixColumn[] = [
  { field: 'label', title: '品牌 / 物料 / 倉庫 / 子庫 / 日期碼', width: 280, fixed: 'left', sortable: true },
  { field: 'onHand', title: '現有數量', sortable: true, formatter: (r) => formatNumber(r.onHand || 0) },
  { field: 'reserved', title: '預留數量', sortable: true, formatter: (r) => formatNumber(r.reserved || 0) },
  { field: 'available', title: '可用數量', sortable: true, formatter: (r) => formatNumber(r.available || 0) }
]

const brands = useDemoBrands()

const filteredRows = computed(() => {
  const rows = applyDemoFilters(rawRows.value, filterDefs, filterState.value)
  return brands.value.includes(ALL_BRANDS) ? rows : rows.filter((r) => brands.value.includes(r.brand))
})

const treeData = computed(() =>
  buildTree(filteredRows.value, {
    levels: (r) => [r.brand, r.parts, r.warehouse, r.subInventory, r.dateCode || '未知'],
    merge: (node, r) => {
      node.onHand = (node.onHand || 0) + r.onHand
      node.reserved = (node.reserved || 0) + r.reserved
      node.available = (node.available || 0) + r.available
    }
  })
)

async function load() {
  loading.value = true
  try {
    rawRows.value = await loadInventory()
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
