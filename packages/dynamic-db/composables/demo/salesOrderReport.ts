// packages/dynamic-db/composables/demo/salesOrderReport.ts
// Shared columns + tree builder for the Sales Order Report and Inactive Item Report widgets.
import type { MatrixColumn } from '../../components/dashboard/demo/DemoTreeMatrix.vue'
import { buildTree, formatNumber, formatCurrency, type DemoTreeNode, type DemoFilterDef } from './useDemoData'

export const salesOrderColumns: MatrixColumn[] = [
  { field: 'label', title: '客戶組 / 客戶 / 銷售訂單 / 物料', width: 280, fixed: 'left' },
  { field: 'orderDate', title: '訂單日期', align: 'center', formatter: (r) => r.orderDate || '' },
  { field: 'requestDate', title: '計劃交貨日期', align: 'center', formatter: (r) => r.requestDate || '' },
  { field: 'orderQty', title: '訂單數量', sortable: true, formatter: (r) => formatNumber(r.orderQty || 0) },
  { field: 'value', title: '訂單金額', sortable: true, formatter: (r) => formatCurrency(r.value || 0) },
  { field: 'shippedQty', title: '已交貨數量', sortable: true, formatter: (r) => formatNumber(r.shippedQty || 0) },
  {
    field: 'outstanding',
    title: '未交貨數量',
    sortable: true,
    sortField: (r) => (r.orderQty || 0) - (r.shippedQty || 0),
    formatter: (r) => formatNumber((r.orderQty || 0) - (r.shippedQty || 0))
  },
  { field: 'stockOnHand', title: '訂單可用庫存', formatter: (r) => (r.stockOnHand != null ? formatNumber(r.stockOnHand) : '') }
]

export const salesOrderFilterDefs: DemoFilterDef[] = [
  { field: 'customerGroup', label: '客戶組', type: 'select' },
  { field: 'customer', label: '客戶', type: 'select' },
  { field: 'soNo', label: '訂單號', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' },
  { field: 'orderDate', label: '訂單日期範圍', type: 'date-range' },
  { field: 'requestDate', label: '計劃交貨日期範圍', type: 'date-range' }
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
