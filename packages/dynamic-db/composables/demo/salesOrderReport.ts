// packages/dynamic-db/composables/demo/salesOrderReport.ts
// Shared columns + tree builder for the Sales Order Report and Inactive Item Report widgets.
import type { MatrixColumn } from '../../components/dashboard/demo/DemoTreeMatrix.vue'
import { buildTree, formatNumber, formatCurrency, type DemoTreeNode, type DemoFilterDef } from './useDemoData'

export const salesOrderColumns: MatrixColumn[] = [
  { field: 'label', title: '客户组 / 客户 / 销售订单 / 物料', width: 280, fixed: 'left' },
  { field: 'orderDate', title: '订单日期', align: 'center', formatter: (r) => r.orderDate || '' },
  { field: 'requestDate', title: '计划交货日期', align: 'center', formatter: (r) => r.requestDate || '' },
  { field: 'orderQty', title: '订单数量', sortable: true, aggregate: 'sum', formatter: (r) => formatNumber(r.orderQty || 0) },
  { field: 'value', title: '订单数量', sortable: true, aggregate: 'sum', formatter: (r) => formatCurrency(r.value || 0) },
  { field: 'shippedQty', title: '已交货数量', sortable: true, aggregate: 'sum', formatter: (r) => formatNumber(r.shippedQty || 0) },
  {
    field: 'outstanding',
    title: '未交货数量',
    sortable: true,
    aggregate: 'sum',
    formatter: (r) => formatNumber(r.outstanding || 0)
  },
  { field: 'stockOnHand', title: '订单可用库存', aggregate: 'sum', formatter: (r) => (r.stockOnHand != null ? formatNumber(r.stockOnHand) : '') }
]

export const salesOrderFilterDefs: DemoFilterDef[] = [
  { field: 'customerGroup', label: '客戶組', type: 'select' },
  { field: 'customer', label: '客戶', type: 'select' },
  { field: 'soNo', label: '订单号', type: 'select' },
  { field: 'parts', label: '物料', type: 'select' },
  { field: 'orderDate', label: '订单日期范围', type: 'date-range' },
  { field: 'requestDate', label: '计划交货日期范围', type: 'date-range' }
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
      node.outstanding = (node.outstanding || 0) + (r.orderQty - r.shippedQty)
    }
  })
}
