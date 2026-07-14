<template>
  <el-dialog
  class="big"
    :model-value="modelValue"
    :title="po ? `${po.poNo} — 採購訂單詳情` : '採購訂單詳情'"
    width="90%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="po" class="po-detail">
      <div class="po-header">
        <div class="po-field"><label>採購訂單號</label><span>{{ po.poNo }}</span></div>
        <div class="po-field"><label>供應商</label><span>{{ po.supplier }}</span></div>
        <div class="po-field"><label>訂購日期</label><span>{{ po.orderDate }}</span></div>
        <div class="po-field"><label>預計到貨日期</label><span>{{ po.eta }}</span></div>
        <div class="po-field"><label>狀態</label><span>{{ poStatusLabel(po.status) }}</span></div>
        <div class="po-field"><label>總金額</label><span>{{ formatCurrency(po.totalValue) }}</span></div>
      </div>

      <h4>訂單明細</h4>
      <VxeGrid v-bind="lineGridOptions" :data="po.lines" />

      <template v-if="po.shipments.length">
        <h4>出貨記錄</h4>
        <VxeGrid v-bind="shipmentGridOptions" :data="po.shipments" />
      </template>
    </div>
    <el-empty v-else-if="!loading" description="沒有採購訂單資料" />
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

// Display-only labels for status values; raw English values still drive all logic.
// PO header statuses present in demo/data/purchaseOrders.json.
const PO_STATUS_LABELS: Record<string, string> = {
  Open: '進行中',
  Received: '已收貨',
  Partial: '部分收貨',
  Closed: '已完成',
  Cancelled: '已取消'
}

// Shipment statuses (same values as the arrival widget).
const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  'In Transit': '運送中',
  Delivered: '已送達',
  Delayed: '延誤'
}

function poStatusLabel(status: string): string {
  return PO_STATUS_LABELS[status] || status || ''
}

const lineGridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 400,
  columns: [
    { field: 'parts', title: '物料', minWidth: 200, align: 'left' },
    { field: 'supplierParts', title: '供應商物料', minWidth: 160, align: 'left' },
    { field: 'orderedQty', title: '訂購數量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.orderedQty) },
    { field: 'receivedQty', title: '已收貨數量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.receivedQty) },
    { field: 'openQty', title: '未到貨數量', width: 110, align: 'right', formatter: ({ row }: any) => formatNumber(row.openQty) },
    { field: 'value', title: '金額', width: 120, align: 'right', formatter: ({ row }: any) => formatCurrency(row.value) }
  ]
}))

const shipmentGridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 300,
  columns: [
    { field: 'warehouse', title: '倉庫', width: 110, align: 'left' },
    { field: 'carrier', title: '承運商', minWidth: 130, align: 'left' },
    { field: 'trackingNo', title: '追蹤編號', minWidth: 130, align: 'left' },
    { field: 'shipDate', title: '出貨日期', width: 110, align: 'center' },
    { field: 'eta', title: '預計到貨日期', width: 110, align: 'center' },
    { field: 'qtyShipped', title: '出貨數量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.qtyShipped) },
    { field: 'status', title: '狀態', width: 100, align: 'center', formatter: ({ row }: any) => SHIPMENT_STATUS_LABELS[row.status] || row.status || '' }
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
    font-size: 0.75rem;
    color: var(--el-text-color-secondary, #909399);
  }
  span {
    font-size: 0.875rem;
  }
}
h4 {
  margin: 12px 0 8px;
}
:deep(.el-dialog__title) {
  font-size: 1.125rem;
}
:deep(.vxe-grid) {
  --vxe-ui-font-size-default: 0.875rem;
}
</style>
