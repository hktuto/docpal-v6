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
    <DemoSoTableDialog v-model="soDialogVisible" :title="soDialogTitle" :rows="soDialogRows" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoSoTableDialog from '../dashboard/demo/DemoSoTableDialog.vue'
import { loadSalesOrders, buildTree, formatNumber, formatCurrency, type DemoTreeNode } from '../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || 'Sales Performance Dashboard')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

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
  soDialogTitle.value = `${row.key} — Sales Orders`
  soDialogVisible.value = true
}

const columns: MatrixColumn[] = [
  { field: 'label', title: 'Brand / Parts', width: 280, fixed: 'left' },
  { field: 'orderQty', title: 'Order Qty', formatter: (r) => formatNumber(r.orderQty || 0) },
  { field: 'shippedQty', title: 'Shipped Qty', formatter: (r) => formatNumber(r.shippedQty || 0) },
  { field: 'value', title: 'Sales Value', formatter: (r) => formatCurrency(r.value || 0) },
  {
    field: 'fulfillment',
    title: 'Fulfillment %',
    align: 'center',
    formatter: (r) => (r.orderQty ? `${(((r.shippedQty || 0) / r.orderQty) * 100).toFixed(1)}%` : '')
  }
]

async function load() {
  loading.value = true
  try {
    const rows = await loadSalesOrders()
    treeData.value = buildTree(rows, {
      levels: (r) => [r.brand, r.parts],
      merge: (node, r) => {
        node.orderQty = (node.orderQty || 0) + r.orderQty
        node.shippedQty = (node.shippedQty || 0) + r.shippedQty
        node.value = (node.value || 0) + r.value
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
