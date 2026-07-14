// packages/dynamic-db/composables/demo/salesOrderReport.ts
// Shared columns + tree builder for the Sales Order Report and Inactive Item Report widgets.
import type { MatrixColumn } from '../../components/dashboard/demo/DemoTreeMatrix.vue'
import { buildTree, formatNumber, formatCurrency, type DemoTreeNode, type DemoFilterDef } from './useDemoData'

export const salesOrderColumns: MatrixColumn[] = [
  { field: 'label', title: 'Customer Group / Customer / SO / Parts', width: 280, fixed: 'left' },
  { field: 'orderDate', title: 'SO Date', align: 'center', formatter: (r) => r.orderDate || '' },
  { field: 'requestDate', title: 'Schedule Date', align: 'center', formatter: (r) => r.requestDate || '' },
  { field: 'orderQty', title: 'SO Qty', sortable: true, formatter: (r) => formatNumber(r.orderQty || 0) },
  { field: 'value', title: 'SO Amount', sortable: true, formatter: (r) => formatCurrency(r.value || 0) },
  { field: 'shippedQty', title: 'Delivered Qty', sortable: true, formatter: (r) => formatNumber(r.shippedQty || 0) },
  {
    field: 'outstanding',
    title: 'Outstanding Qty',
    sortable: true,
    sortField: (r) => (r.orderQty || 0) - (r.shippedQty || 0),
    formatter: (r) => formatNumber((r.orderQty || 0) - (r.shippedQty || 0))
  },
  { field: 'stockOnHand', title: 'Stock on Hand for SO', formatter: (r) => (r.stockOnHand != null ? formatNumber(r.stockOnHand) : '') }
]

export const salesOrderFilterDefs: DemoFilterDef[] = [
  { field: 'customerGroup', label: 'Customer Group', type: 'select' },
  { field: 'customer', label: 'Customer', type: 'select' },
  { field: 'soNo', label: 'SO', type: 'select' },
  { field: 'parts', label: 'Parts', type: 'select' },
  { field: 'orderDate', label: 'SO Date Range', type: 'date-range' },
  { field: 'requestDate', label: 'Schedule Date Range', type: 'date-range' }
]

export function buildSalesOrderTree(rows: any[], stockByParts: Record<string, number>): DemoTreeNode[] {
  return buildTree(rows, {
    levels: (r) => [r.customerGroup, r.customer, r.soNo, r.parts],
    init: (r) => ({ orderDate: r.orderDate, requestDate: r.requestDate, stockOnHand: stockByParts[r.parts] || 0 }),
    merge: (node, r) => {
      if (node.level === 2) {
        node.orderDate = r.orderDate
        node.requestDate = r.requestDate
      }
      node.orderQty = (node.orderQty || 0) + r.orderQty
      node.shippedQty = (node.shippedQty || 0) + r.shippedQty
      node.value = (node.value || 0) + r.value
    }
  })
}
