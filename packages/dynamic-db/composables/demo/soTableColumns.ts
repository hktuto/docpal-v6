// Shared flat-table column defs for the SO drill-down dialogs
// (DemoSoTableDialog, DemoCustomerProfileDialog).
import type { VxeGridProps } from 'vxe-table'
import { formatNumber, formatCurrency } from './useDemoData'

// Display-only labels for SO status values; raw English values still drive all logic/filters.
const STATUS_LABELS: Record<string, string> = {
  Shipped: '已出货',
  Open: '进行中',
  Partial: '部分出货',
  Closed: '已完成',
  Cancelled: '已取消'
}

export function soTableColumns(opts: { allocated?: boolean } = {}): VxeGridProps['columns'] {
  const cols: VxeGridProps['columns'] = [
    { field: 'soNo', title: '订单号', width: 130, align: 'left' },
    { field: 'customer', title: '客户', minWidth: 160, align: 'left' },
    { field: 'orderDate', title: '订单日期', width: 110, align: 'center' },
    { field: 'requestDate', title: '计划交货日期', width: 120, align: 'center' },
    { field: 'parts', title: '物料', minWidth: 180, align: 'left' },
    { field: 'orderQty', title: '订单数量', width: 100, align: 'right', formatter: ({ row }: any) => formatNumber(row.orderQty || 0) },
    { field: 'shippedQty', title: '已交货数量', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.shippedQty || 0) },
    { field: 'value', title: '订单金额', width: 120, align: 'right', formatter: ({ row }: any) => formatCurrency(row.value || 0) },
    { field: 'status', title: '状态', width: 100, align: 'center', formatter: ({ row }: any) => STATUS_LABELS[row.status] || row.status || '' }
  ]
  if (opts.allocated) {
    cols.splice(6, 0, {
      field: 'allocatedQty',
      title: '已分配数量',
      width: 120,
      align: 'right',
      formatter: ({ row }: any) => formatNumber(row.allocatedQty || 0)
    })
  }
  return cols
}
