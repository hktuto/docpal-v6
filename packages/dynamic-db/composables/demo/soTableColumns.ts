// Shared flat-table column defs for the SO drill-down dialogs
// (DemoSoTableDialog, DemoCustomerProfileDialog).
import type { VxeGridProps } from 'vxe-table'
import { formatNumber, formatCurrency } from './useDemoData'

export function soTableColumns(opts: { allocated?: boolean } = {}): VxeGridProps['columns'] {
  const cols: VxeGridProps['columns'] = [
    { field: 'soNo', title: 'SO No', width: 130, align: 'left' },
    { field: 'customer', title: 'Customer', minWidth: 160, align: 'left' },
    { field: 'orderDate', title: 'SO Date', width: 110, align: 'center' },
    { field: 'requestDate', title: 'Schedule Date', width: 120, align: 'center' },
    { field: 'parts', title: 'Parts', minWidth: 180, align: 'left' },
    { field: 'orderQty', title: 'SO Qty', width: 100, align: 'right', formatter: ({ row }: any) => formatNumber(row.orderQty || 0) },
    { field: 'shippedQty', title: 'Delivered Qty', width: 120, align: 'right', formatter: ({ row }: any) => formatNumber(row.shippedQty || 0) },
    { field: 'value', title: 'SO Amount', width: 120, align: 'right', formatter: ({ row }: any) => formatCurrency(row.value || 0) },
    { field: 'status', title: 'Status', width: 100, align: 'center' }
  ]
  if (opts.allocated) {
    cols.splice(6, 0, {
      field: 'allocatedQty',
      title: 'Allocated Qty',
      width: 120,
      align: 'right',
      formatter: ({ row }: any) => formatNumber(row.allocatedQty || 0)
    })
  }
  return cols
}
