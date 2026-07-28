<script setup lang="ts">
import Decimal from 'decimal.js'
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
interface DataItemType {
  line_id: string
  customerPoLine: number
  quantity: number
  taxCode: string
  requestDate: string
  quantityCancelled: number
  customerPo: string
  uom: string
  taxAmount: number
  promiseDate: string
  quantityShipped: number
  customerItem: string
  customerUnitPrice: number
  leadTime: number
  scheduledShipDate: string
  scheduleArrivalDate: string
  orderedItem: string
  unitPrice: number
  description: string
  subInventory: string
  references: string
  piRemark: string
  remarks: string
}

const isApproval = ref<boolean>(false)
const formRef = ref()
const listData = ref<DataItemType[]>([])

const quantityTotal = computed(() => {
  return listData.value.length
})
const subtotal = computed(() => {
  return listData.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.unitPrice).mul(curr.quantity)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
})
const tax = computed(() => {
  return listData.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.taxAmount)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
})
const charges = computed(() => {
  return 0
})
const totalAmount = computed(() => {
  return new Decimal(subtotal.value).add(tax.value).add(charges.value).toDecimalPlaces(6).toNumber()
})
const historyQuantityTotal = ref<number>(0)
const historySubtotal = ref<number>(0)
const historyTax = ref<number>(0)
const historyCharges = ref<number>(0)
const historyTotalAmount = ref<number>(0)

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'SalesOrderTableSetting',
  api: (pageParams: any) => {
    return []
  },
  columns: [
    {
      field: 'index',
      title: '序號 Index',
      minWidth: 100,
      fixed: 'left',
      formatter: ({ itemIndex, cellValue, row }: any) => {
        return itemIndex
      }
    },
    {
      field: 'orderedItem',
      title: '訂單商品編號 Ordered Item',
      minWidth: 200
    },
    {
      field: 'customerItem',
      title: '客戶商品編號 Customer Item',
      minWidth: 240
    },
    {
      field: 'customerPo',
      title: '客戶訂單 Customer PO',
      minWidth: 200
    },
    {
      field: 'quantity',
      title: '數量 Quantity',
      minWidth: 120
    },
    {
      field: 'unitPrice',
      title: '單價 Unit Price',
      minWidth: 120
    },
    {
      field: 'uom',
      title: '計量單位 UOM',
      minWidth: 120
    },
    {
      field: 'description',
      title: '描述 Description',
      minWidth: 200
    },
    {
      field: 'subInventory',
      title: '子庫存 Sub-Inventory',
      minWidth: 180
    },
    {
      field: 'taxCode',
      title: '稅碼 Tax Code',
      minWidth: 120
    },
    {
      field: 'requestDate',
      title: '申請日期 Request Date',
      minWidth: 180
    },
    {
      field: 'scheduleArrivalDate',
      title: '預定抵達日期 Schedule Arrival Date',
      minWidth: 260
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
        action: ({ row }: { row: DataItemType }) => {
          handleDblClick(row)
        }
      },
      {
        code: 'delete',
        name: 'Delete',
        action: ({ row }: { row: DataItemType }) => {
          handleDelete(row)
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }: any) => {
    if (!row) {
      return { visible: false, disabled: false }
    }
    if (code === 'delete') {
      return {
        visible: !isApproval.value,
        disabled: false
      }
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
  isApproval.value = formData.is_approval

  listData.value = [
    {
      line_id: '1',
      customerPoLine: 1,
      quantity: 100,
      taxCode: 'VAT0',
      requestDate: '2026-07-01',
      quantityCancelled: 0,
      customerPo: 'PO-2026-001',
      uom: 'PCS',
      taxAmount: 0,
      promiseDate: '2026-07-15',
      quantityShipped: 0,
      customerItem: 'CUST-ITEM-A01',
      customerUnitPrice: 12.5,
      leadTime: 14,
      scheduledShipDate: '2026-07-10',
      scheduleArrivalDate: '2026-07-20',
      orderedItem: 'PART-1001',
      unitPrice: 12.5,
      description: 'Aluminum Housing Type A',
      subInventory: 'FG',
      references: 'REF-001',
      piRemark: 'Urgent shipment',
      remarks: 'First mock line'
    },
    {
      line_id: '2',
      customerPoLine: 2,
      quantity: 250,
      taxCode: 'VAT5',
      requestDate: '2026-07-02',
      quantityCancelled: 10,
      customerPo: 'PO-2026-001',
      uom: 'PCS',
      taxAmount: 156.25,
      promiseDate: '2026-07-18',
      quantityShipped: 50,
      customerItem: 'CUST-ITEM-B02',
      customerUnitPrice: 8.25,
      leadTime: 21,
      scheduledShipDate: '2026-07-12',
      scheduleArrivalDate: '2026-07-22',
      orderedItem: 'PART-1002',
      unitPrice: 8.25,
      description: 'Plastic Cover Type B',
      subInventory: 'FG',
      references: 'REF-002',
      piRemark: '',
      remarks: 'Partial shipped'
    },
    {
      line_id: '3',
      customerPoLine: 3,
      quantity: 50,
      taxCode: 'VAT0',
      requestDate: '2026-07-03',
      quantityCancelled: 0,
      customerPo: 'PO-2026-001',
      uom: 'SET',
      taxAmount: 0,
      promiseDate: '2026-07-25',
      quantityShipped: 0,
      customerItem: 'CUST-ITEM-C03',
      customerUnitPrice: 45.0,
      leadTime: 30,
      scheduledShipDate: '2026-07-20',
      scheduleArrivalDate: '2026-07-30',
      orderedItem: 'PART-2001',
      unitPrice: 42.8,
      description: 'Motor Assembly Kit',
      subInventory: 'WIP',
      references: 'REF-003',
      piRemark: 'Need QC report',
      remarks: 'Custom color'
    },
    {
      line_id: '4',
      customerPoLine: 1,
      quantity: 1000,
      taxCode: 'VAT8',
      requestDate: '2026-07-05',
      quantityCancelled: 0,
      customerPo: 'PO-2026-001',
      uom: 'PCS',
      taxAmount: 960,
      promiseDate: '2026-08-01',
      quantityShipped: 200,
      customerItem: 'CUST-ITEM-D04',
      customerUnitPrice: 1.2,
      leadTime: 7,
      scheduledShipDate: '2026-07-28',
      scheduleArrivalDate: '2026-08-05',
      orderedItem: 'PART-3001',
      unitPrice: 1.2,
      description: 'Screw M3x8',
      subInventory: 'RM',
      references: 'REF-004',
      piRemark: 'Bulk order',
      remarks: ''
    },
    {
      line_id: '5',
      customerPoLine: 2,
      quantity: 80,
      taxCode: 'VAT5',
      requestDate: '2026-07-08',
      quantityCancelled: 5,
      customerPo: 'PO-2026-001',
      uom: 'PCS',
      taxAmount: 95.2,
      promiseDate: '2026-08-10',
      quantityShipped: 0,
      customerItem: 'CUST-ITEM-E05',
      customerUnitPrice: 23.8,
      leadTime: 28,
      scheduledShipDate: '2026-08-05',
      scheduleArrivalDate: '2026-08-15',
      orderedItem: 'PART-4001',
      unitPrice: 23.8,
      description: 'Control Board PCB',
      subInventory: 'FG',
      references: 'REF-005',
      piRemark: 'Firmware v2.1',
      remarks: 'Hold for confirmation'
    }
  ]
  loadData()

  historyQuantityTotal.value = 5
  historySubtotal.value = 8556.5
  historyTax.value = 1211.45
  historyCharges.value = 0
  historyTotalAmount.value = 9767.95
}

function loadData() {
  tableRef.value?.loadData(listData.value)
}

async function getFormData(needValidation = true) {
  const result = {
    order_item_list: []
  }
  if (!needValidation) return result
  return result
}

const formWidgetSalesOrderApprovalModificationDialogRef = ref()

function handleDblClick(row: DataItemType) {
  // 匹配新舊數據
  const isNewItem = true
  const oldRowItem = undefined

  formWidgetSalesOrderApprovalModificationDialogRef.value.open(isNewItem, row, oldRowItem)
}

function handleAdd() {
  formWidgetSalesOrderApprovalModificationDialogRef.value.open(true)
}
function handleCreate(newRow: DataItemType) {
  if (isApproval.value) return
  listData.value.push(newRow)
  loadData()
}

function handleUpdate(row: DataItemType) {}

async function handleDelete(row: DataItemType) {
  if (isApproval.value) return
  try {
    const action = await ElMessageBox.confirm(`Are you sure you want to delete "${row.orderedItem}"?`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return

    const index = listData.value.findIndex((item) => item.line_id === row.line_id)
    if (index !== -1) {
      listData.value.splice(index, 1)
    }
    loadData()
  } catch (error) {
    console.log(error)
  }
}

watch(
  () => formData.order_number,
  (value) => {
    if (!!value && value !== '') {
      init()
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top" class="all-input-style">
    <el-row>
      <el-col :span="5">
        <el-form-item label="歷史數量 History Quantity Total">
          <el-input-number v-model="historyQuantityTotal" disabled />
        </el-form-item>
        <el-form-item label="數量 Quantity Total">
          <el-input-number v-model="quantityTotal" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="歷史小計 History Subtotal">
          <el-input-number v-model="historySubtotal" disabled />
        </el-form-item>
        <el-form-item label="小計 Subtotal">
          <el-input-number v-model="subtotal" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="歷史稅 History Tax">
          <el-input-number v-model="historyTax" disabled />
        </el-form-item>
        <el-form-item label="稅 Tax">
          <el-input-number v-model="tax" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="歷史附加費 History Charges">
          <el-input-number v-model="historyCharges" disabled />
        </el-form-item>
        <el-form-item label="附加費 Charges">
          <el-input-number v-model="charges" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item label="歷史總計 History Total">
          <el-input-number v-model="historyTotalAmount" disabled />
        </el-form-item>
        <el-form-item label="總計 Total">
          <el-input-number v-model="totalAmount" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div style="height: 60vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template v-if="!isApproval" #toolbar_buttons>
        <el-button type="primary" @click="handleAdd">添加商品 Add Goods</el-button>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetSalesOrderApprovalModificationDialog
    ref="formWidgetSalesOrderApprovalModificationDialogRef"
    :isApproval="isApproval"
    @create="handleCreate"
    @update="handleUpdate"
  />
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input-number) {
    width: 96%;
  }
}
</style>
