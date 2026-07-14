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
      <DemoTreeMatrix
        :tree-data="treeData"
        :columns="columns"
        :loading="loading"
        :row-class-name="rowClassName"
        @cell-click="onCellClick"
      />
    </div>
    <DemoInventoryDrillDialog v-model="drillVisible" :warehouse="drillWarehouse" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoInventoryDrillDialog from '../dashboard/demo/DemoInventoryDrillDialog.vue'
import { loadInventory, buildTree, formatNumber, type DemoTreeNode } from '../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || 'Total Inventory Report')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

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

const columns: MatrixColumn[] = [
  { field: 'label', title: 'Brand / Parts / Warehouse / Sub Inventory / Date Code', width: 280, fixed: 'left' },
  { field: 'onHand', title: 'OnHand Qty', formatter: (r) => formatNumber(r.onHand || 0) },
  { field: 'reserved', title: 'Reserved Qty', formatter: (r) => formatNumber(r.reserved || 0) },
  { field: 'available', title: 'Available Qty', formatter: (r) => formatNumber(r.available || 0) }
]

async function load() {
  loading.value = true
  try {
    const rows = await loadInventory()
    treeData.value = buildTree(rows, {
      levels: (r) => [r.brand, r.parts, r.warehouse, r.subInventory, r.dateCode || 'Unknown'],
      merge: (node, r) => {
        node.onHand = (node.onHand || 0) + r.onHand
        node.reserved = (node.reserved || 0) + r.reserved
        node.available = (node.available || 0) + r.available
      }
    })
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
}

.demo-widget :deep(.is-clickable) {
  cursor: pointer;
}
</style>
