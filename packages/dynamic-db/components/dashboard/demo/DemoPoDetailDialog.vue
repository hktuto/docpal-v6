<template>
  <el-dialog
  class="big"
    :model-value="modelValue"
    :title="po ? `${po.poNo} — 采购订单详情` : '采购订单详情'"
    width="90%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="po" class="po-detail">
      <div class="po-header">
        <div class="po-field"><label>采购订单号</label><span>{{ po.poNo }}</span></div>
        <div class="po-field"><label>供应商</label><span>{{ po.supplier }}</span></div>
        <div class="po-field"><label>订购日期</label><span>{{ po.orderDate }}</span></div>
        <div class="po-field"><label>预计到货日期</label><span>{{ po.eta }}</span></div>
        <div class="po-field"><label>状态</label><span>{{ poStatusLabel(po.status) }}</span></div>
        <div class="po-field"><label>总金额</label><span>{{ formatCurrency(po.totalValue) }}</span></div>
      </div>

      <h4>订单明细</h4>
      <VxeGrid v-bind="lineGridOptions" :data="po.lines" />

      <template v-if="po.shipments.length">
        <h4>出货記錄</h4>
        <VxeGrid v-bind="shipmentGridOptions" :data="po.shipments" />
      </template>
    </div>
    <el-empty v-else-if="!loading" description="没有采购订单资料" />
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
  Open: '进行中',
  Received: '已收货',
  Partial: '部分收货',
  Closed: '已完成',
  Cancelled: '已取消'
}

// Shipment statuses (same values as the arrival widget).
const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  'In Transit': '运送中',
  Delivered: '已送达',
  Delayed: '延误'
}

function poStatusLabel(status: string): string {
  return PO_STATUS_LABELS[status] || status || ''
}

function poLineFooterMethod({ columns, data }: { columns: any[]; data: any[] }): any[][] {
  const numericFields = ['orderedQty', 'receivedQty', 'openQty', 'value']
  const totals: Record<string, number> = {}
  for (const field of numericFields) {
    totals[field] = data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)
  }
  const footer = columns.map((col, index) => {
    if (index === 0) return '总计'
    if (!numericFields.includes(col.field)) return ''
    return col.formatter ? col.formatter({ row: totals }) : String(totals[col.field] || 0)
  })
  return [footer]
}

function poShipmentFooterMethod({ columns, data }: { columns: any[]; data: any[] }): any[][] {
  const total = data.reduce((sum, row) => sum + (Number(row.qtyShipped) || 0), 0)
  const footer = columns.map((col, index) => {
    if (index === 0) return '总计'
    if (col.field !== 'qtyShipped') return ''
    return col.formatter ? col.formatter({ row: { qtyShipped: total } }) : formatNumber(total)
  })
  return [footer]
}

const lineGridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 400,
  showFooter: true,
  footerMethod: poLineFooterMethod,
  columns: [
    { field: 'parts', title: '物料', minWidth: 200, align: 'left' },
    { field: 'supplierParts', title: '供应商物料', minWidth: 160, align: 'left' },
    { field: 'orderedQty', title: '订购数量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.orderedQty) },
    { field: 'receivedQty', title: '已收货数量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.receivedQty) },
    { field: 'openQty', title: '未到货数量', width: 110, align: 'right', formatter: ({ row }: any) => formatNumber(row.openQty) },
    { field: 'value', title: '金额', width: 120, align: 'right', formatter: ({ row }: any) => formatCurrency(row.value) }
  ]
}))

const shipmentGridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 300,
  showFooter: true,
  footerMethod: poShipmentFooterMethod,
  columns: [
    { field: 'warehouse', title: '仓库', width: 110, align: 'left' },
    { field: 'carrier', title: '承运商', minWidth: 130, align: 'left' },
    { field: 'trackingNo', title: '追踪编号', minWidth: 130, align: 'left' },
    { field: 'shipDate', title: '出货日期', width: 110, align: 'center' },
    { field: 'eta', title: '预计到货日期', width: 110, align: 'center' },
    { field: 'qtyShipped', title: '出货数量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.qtyShipped) },
    { field: 'status', title: '状态', width: 100, align: 'center', formatter: ({ row }: any) => SHIPMENT_STATUS_LABELS[row.status] || row.status || '' }
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
