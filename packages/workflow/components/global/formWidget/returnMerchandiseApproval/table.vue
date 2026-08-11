<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const part_list = ref<any[]>([])
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

function init() {
  part_list.value = formData.order_item_list
  reload()
}

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

watch(
  () => formData.order_item_list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true, deep: true }
)

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
