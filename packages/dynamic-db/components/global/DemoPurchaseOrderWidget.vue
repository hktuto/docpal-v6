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
      <DemoTreeMatrix :tree-data="treeData" :columns="columns" :loading="loading" />
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import { loadPurchaseOrders, buildTree, formatNumber, formatCurrency, type DemoTreeNode } from '../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || 'Purchase Order Report')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

const columns: MatrixColumn[] = [
  { field: 'label', title: 'Brand / Year / PO / Parts', width: 280, fixed: 'left' },
  { field: 'orderDate', title: 'PO Date', align: 'center', formatter: (r) => r.orderDate || '' },
  { field: 'eta', title: 'ETA', align: 'center', formatter: (r) => r.eta || '' },
  { field: 'orderedQty', title: 'Ordered Qty', formatter: (r) => formatNumber(r.orderedQty || 0) },
  { field: 'receivedQty', title: 'Received Qty', formatter: (r) => formatNumber(r.receivedQty || 0) },
  { field: 'openQty', title: 'Outstanding Qty', formatter: (r) => formatNumber(r.openQty || 0) },
  { field: 'value', title: 'PO Amount', formatter: (r) => formatCurrency(r.value || 0) }
]

async function load() {
  loading.value = true
  try {
    const orders = await loadPurchaseOrders()
    const rows: any[] = []
    for (const po of orders) {
      const year = po.orderDate ? po.orderDate.slice(0, 4) : 'Unknown'
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
    treeData.value = buildTree(rows, {
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
</style>
