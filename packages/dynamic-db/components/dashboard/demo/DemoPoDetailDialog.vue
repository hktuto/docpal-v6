<template>
  <el-dialog
    :model-value="modelValue"
    :title="po ? `${po.poNo} — PO Detail` : 'PO Detail'"
    width="70%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="po" class="po-detail">
      <div class="po-header">
        <div class="po-field"><label>PO No</label><span>{{ po.poNo }}</span></div>
        <div class="po-field"><label>Supplier</label><span>{{ po.supplier }}</span></div>
        <div class="po-field"><label>Order Date</label><span>{{ po.orderDate }}</span></div>
        <div class="po-field"><label>ETA</label><span>{{ po.eta }}</span></div>
        <div class="po-field"><label>Status</label><span>{{ po.status }}</span></div>
        <div class="po-field"><label>Total Value</label><span>{{ formatCurrency(po.totalValue) }}</span></div>
      </div>

      <h4>PO Lines</h4>
      <VxeGrid v-bind="lineGridOptions" :data="po.lines" />

      <template v-if="po.shipments.length">
        <h4>Shipments</h4>
        <VxeGrid v-bind="shipmentGridOptions" :data="po.shipments" />
      </template>
    </div>
    <el-empty v-else-if="!loading" description="PO detail not available" />
  </el-dialog>
</template>

<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table'
import { loadPurchaseOrders, formatNumber, formatCurrency } from '../../../composables/demo/useDemoData'

const props = defineProps<{
  modelValue: boolean
  poId: string | null
}>()

const emit = defineEmits(['update:modelValue'])

const po = ref<any>(null)
const loading = ref(false)

const lineGridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 300,
  columns: [
    { field: 'parts', title: 'Parts', minWidth: 200, align: 'left' },
    { field: 'supplierParts', title: 'Supplier Parts', minWidth: 160, align: 'left' },
    { field: 'orderedQty', title: 'Ordered Qty', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.orderedQty) },
    { field: 'receivedQty', title: 'Received Qty', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.receivedQty) },
    { field: 'openQty', title: 'Open Qty', width: 110, align: 'right', formatter: ({ row }: any) => formatNumber(row.openQty) },
    { field: 'value', title: 'Value', width: 120, align: 'right', formatter: ({ row }: any) => formatCurrency(row.value) }
  ]
}))

const shipmentGridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 200,
  columns: [
    { field: 'warehouse', title: 'Warehouse', width: 110, align: 'left' },
    { field: 'carrier', title: 'Carrier', minWidth: 130, align: 'left' },
    { field: 'trackingNo', title: 'Tracking No', minWidth: 130, align: 'left' },
    { field: 'shipDate', title: 'Ship Date', width: 110, align: 'center' },
    { field: 'eta', title: 'ETA', width: 110, align: 'center' },
    { field: 'qtyShipped', title: 'Qty Shipped', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.qtyShipped) },
    { field: 'status', title: 'Status', width: 100, align: 'center' }
  ]
}))

watch(
  () => [props.modelValue, props.poId] as const,
  async ([visible, poId]) => {
    if (!visible || !poId) return
    loading.value = true
    try {
      const orders = await loadPurchaseOrders()
      po.value = orders.find((o) => o.poId === poId) || null
    } catch (error) {
      console.error('Failed to load demo data:', error)
      po.value = null
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.po-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 16px;
  margin-bottom: 16px;
}
.po-field {
  label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
  span {
    font-size: 14px;
  }
}
h4 {
  margin: 12px 0 8px;
}
</style>
