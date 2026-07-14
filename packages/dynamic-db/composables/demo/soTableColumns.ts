// Shared flat-table column defs for the SO drill-down dialogs
// (DemoSoTableDialog, DemoCustomerProfileDialog).
import type { VxeGridProps } from 'vxe-table'
import { formatNumber, formatCurrency } from './useDemoData'

// Display-only labels for SO status values; raw English values still drive all logic/filters.
const STATUS_LABELS: Record<string, string> = {
  Shipped: '已出貨',
  Open: '進行中',
  Partial: '部分出貨',
  Closed: '已完成',
  Cancelled: '已取消'
}

export function soTableColumns(opts: { allocated?: boolean } = {}): VxeGridProps['columns'] {
  const cols: VxeGridProps['columns'] = [
    { field: 'soNo', title: '訂單號', width: 130, align: 'left' },
    { field: 'customer', title: '客戶', minWidth: 160, align: 'left' },
    { field: 'orderDate', title: '訂單日期', width: 110, align: 'center' },
    { field: 'requestDate', title: '計劃交貨日期', width: 120, align: 'center' },
    { field: 'parts', title: '物料', minWidth: 180, align: 'left' },
    { field: 'orderQty', title: '訂單數量', width: 100, align: 'right', formatter: ({ row }: any) => formatNumber(row.orderQty || 0) },
    { field: 'shippedQty', title: '已交貨數量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.shippedQty || 0) },
    { field: 'value', title: '訂單金額', width: 120, align: 'right', formatter: ({ row }: any) => formatCurrency(row.value || 0) },
    { field: 'status', title: '狀態', width: 100, align: 'center', formatter: ({ row }: any) => STATUS_LABELS[row.status] || row.status || '' }
  ]
  if (opts.allocated) {
    cols.splice(6, 0, {
      field: 'allocatedQty',
      title: '已分配數量',
      width: 120,
      align: 'right',
      formatter: ({ row }: any) => formatNumber(row.allocatedQty || 0)
    })
  }
  return cols
}
