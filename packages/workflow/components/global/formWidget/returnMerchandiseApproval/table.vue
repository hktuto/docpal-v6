<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const part_list = ref<any[]>([
  {
    line_number: 1,
    quantity_return: 10,
    shipment_number: 'SHP-2026-0001',
    quantity_ordered: 100,
    tax_code: 'VAT0',
    request_date: '2026-07-01',
    quantity_cancelled: 0,
    customer_po_line: 'PO-LINE-01',
    uom: 'PCS',
    tax_amount: 0,
    promise_date: '2026-07-15',
    quantity_shipped: 100,
    customer_item: 'CUST-PN-3002B',
    customer_unit_price: 12.5,
    lead_time: 14,
    schedule_ship_date: '2026-07-10',
    po_remarks: 'Partial return - damaged packaging',
    ordered_item: 'KOA/RS73F1JTTD 3002B',
    unit_price: 12.5,
    reference: 'RMA-REF-001',
    schedule_arrival_date: '2026-07-20',
    sub_inventory: 'FG'
  },
  {
    line_number: 2,
    quantity_return: 25,
    shipment_number: 'SHP-2026-0001',
    quantity_ordered: 250,
    tax_code: 'VAT5',
    request_date: '2026-07-02',
    quantity_cancelled: 5,
    customer_po_line: 'PO-LINE-02',
    uom: 'PCS',
    tax_amount: 10.31,
    promise_date: '2026-07-18',
    quantity_shipped: 245,
    customer_item: 'CUST-PN-3001B25',
    customer_unit_price: 8.25,
    lead_time: 10,
    schedule_ship_date: '2026-07-12',
    po_remarks: 'Wrong quantity shipped',
    ordered_item: 'KOA/RN73H1JTTD 3001B25',
    unit_price: 8.25,
    reference: 'RMA-REF-002',
    schedule_arrival_date: '2026-07-22',
    sub_inventory: 'FG'
  },
  {
    line_number: 3,
    quantity_return: 5,
    shipment_number: 'SHP-2026-0002',
    quantity_ordered: 50,
    tax_code: 'VAT0',
    request_date: '2026-07-03',
    quantity_cancelled: 0,
    customer_po_line: 'PO-LINE-03',
    uom: 'PCS',
    tax_amount: 0,
    promise_date: '2026-07-20',
    quantity_shipped: 50,
    customer_item: 'CUST-PN-3002B-WIP',
    customer_unit_price: 42.8,
    lead_time: 21,
    schedule_ship_date: '2026-07-15',
    po_remarks: 'Quality issue - failed inspection',
    ordered_item: 'KOA/RS73F1JTTD 3002B',
    unit_price: 42.8,
    reference: 'RMA-REF-003',
    schedule_arrival_date: '2026-07-25',
    sub_inventory: 'WIP'
  },
  {
    line_number: 4,
    quantity_return: 80,
    shipment_number: 'SHP-2026-0003',
    quantity_ordered: 1000,
    tax_code: 'VAT8',
    request_date: '2026-07-05',
    quantity_cancelled: 20,
    customer_po_line: 'PO-LINE-04',
    uom: 'PCS',
    tax_amount: 96,
    promise_date: '2026-07-25',
    quantity_shipped: 980,
    customer_item: 'CUST-PN-3002B-RM',
    customer_unit_price: 1.2,
    lead_time: 7,
    schedule_ship_date: '2026-07-18',
    po_remarks: 'Customer order cancellation',
    ordered_item: 'KOA/RS73F1JTTD 3002B',
    unit_price: 1.2,
    reference: 'RMA-REF-004',
    schedule_arrival_date: '2026-07-28',
    sub_inventory: 'RM'
  },
  {
    line_number: 5,
    quantity_return: 15,
    shipment_number: 'SHP-2026-0004',
    quantity_ordered: 80,
    tax_code: 'VAT5',
    request_date: '2026-07-08',
    quantity_cancelled: 0,
    customer_po_line: 'PO-LINE-05',
    uom: 'PCS',
    tax_amount: 17.85,
    promise_date: '2026-07-28',
    quantity_shipped: 80,
    customer_item: 'CUST-PN-3002B-TW',
    customer_unit_price: 23.8,
    lead_time: 12,
    schedule_ship_date: '2026-07-22',
    po_remarks: 'Label mismatch',
    ordered_item: 'KOA/RS73F1JTTD 3002B',
    unit_price: 23.8,
    reference: 'RMA-REF-005',
    schedule_arrival_date: '2026-08-01',
    sub_inventory: 'FG'
  },
  {
    line_number: 6,
    quantity_return: 30,
    shipment_number: 'SHP-2026-0005',
    quantity_ordered: 120,
    tax_code: 'VAT0',
    request_date: '2026-07-10',
    quantity_cancelled: 10,
    customer_po_line: 'PO-LINE-06',
    uom: 'PCS',
    tax_amount: 0,
    promise_date: '2026-07-30',
    quantity_shipped: 110,
    customer_item: 'CUST-PN-3002B-SG',
    customer_unit_price: 30,
    lead_time: 18,
    schedule_ship_date: '2026-07-25',
    po_remarks: 'Surplus stock return',
    ordered_item: 'KOA/RS73F1JTTD 3002B',
    unit_price: 30,
    reference: 'RMA-REF-006',
    schedule_arrival_date: '2026-08-05',
    sub_inventory: 'FG'
  }
])
const returnMerchandiseApprovalDialogRef = ref()
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'returnMerchandiseApprovalTableSetting',
  api: () => {
    return part_list.value
  },
  columns: [
    {
      field: 'index',
      title: '序號 Index',
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'line_number',
      title: '行號 Line Number',
      minWidth: 240
    },
    {
      field: 'quantity_return',
      title: '退貨數量 Quantity Return',
      minWidth: 240
    },
    {
      field: 'shipment_number',
      title: '出貨單號 Shipment Number',
      minWidth: 240
    },
    {
      field: 'quantity_ordered',
      title: '訂貨數量 Quantity Ordered',
      minWidth: 240
    },
    {
      field: 'tax_code',
      title: '稅率 Tax Code',
      minWidth: 240
    },
    {
      field: 'request_date',
      title: '申請日期 Request Date',
      minWidth: 240
    },
    {
      field: 'quantity_cancelled',
      title: '取消數量 Quantity Cancelled',
      minWidth: 240
    },
    {
      field: 'shipment_number',
      title: '出貨單號 Shipment Number',
      minWidth: 240
    },
    {
      field: 'customer_po_line',
      title: '客戶採購訂單行 Customer PO Line',
      minWidth: 240
    },
    {
      field: 'uom',
      title: '計量單位 UOM',
      minWidth: 240
    },
    {
      field: 'tax_amount',
      title: '稅額 Tax Amount',
      minWidth: 240
    },
    {
      field: 'promise_date',
      title: '承諾日期 Promise Date',
      minWidth: 240
    },
    {
      field: 'quantity_shipped',
      title: '出貨數量 Quantity Shipped',
      minWidth: 240
    },
    {
      field: 'customer_item',
      title: '客戶零件編編號 Customer Item',
      minWidth: 240
    },
    {
      field: 'customer_unit_price',
      title: '客戶單價 Customer Unit Price',
      minWidth: 240
    },
    {
      field: 'lead_time',
      title: '交貨週期（天）Lead Time(Days)',
      minWidth: 240
    },
    {
      field: 'schedule_ship_date',
      title: '預定出貨日期 Schedule Ship Date',
      minWidth: 240
    },
    {
      field: 'po_remarks',
      title: 'PI 備註 PI Remarks',
      minWidth: 240
    },
    {
      field: 'ordered_item',
      title: '訂單零件編號 Ordered Item',
      minWidth: 240
    },
    {
      field: 'unit_price',
      title: '單價 Unit Price',
      minWidth: 240
    },
    {
      field: 'reference',
      title: '參考 Reference',
      minWidth: 240
    },
    {
      field: 'schedule_arrival_date',
      title: '預定到貨日期 Schedule Arrival Date',
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: '子庫存 Sub-Inventory',
      minWidth: 240
    }
  ],
  zoom: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  dblClickAction: ({ row, column, event }) => {
    handleDblClick(row)
  },
  bodyActions: [
    [
      {
        code: 'open',
        name: 'Open',
        action: ({ row }: { row: any }) => {
          handleDblClick(row)
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }: any) => {
    if (!row) {
      return { visible: false, disabled: false }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (selectedRows: any[]) => {},
  optionalConfig: {}
})

async function getFormData(needValidation = true) {
  const list = deepCopy(part_list.value).map((item: any) => {
    delete item['_X_ROW_KEY']
    return item
  })

  const result = {
    order_item_list: list
  }

  if (!needValidation) return result
  return result
}

function handleDblClick(row: any) {
  returnMerchandiseApprovalDialogRef.value.open(row)
}

defineExpose({ getFormData })
</script>

<template>
  <div style="height: 60vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons> </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetReturnMerchandiseApprovalDialog ref="returnMerchandiseApprovalDialogRef" />
</template>

<style scoped lang="scss"></style>
