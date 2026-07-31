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
  customer_po_line: number
  quantity: number
  tax_code: string
  request_date: number
  quantity_cancelled: number
  customer_po: string
  uom: string
  tax_amount: number
  promise_date: number
  quantity_shipped: number
  customer_item: string
  customer_unit_price: number
  lead_time: number
  scheduled_ship_date: number
  schedule_arrival_date: number
  ordered_item: string
  unit_price: number
  description: string
  sub_inventory: string
  references: string
  pi_remark: string
  remarks: string
  status: string
}

const isApproval = ref<boolean>(false)
const formRef = ref()
const listData = ref<DataItemType[]>([])
const oldListData = ref<DataItemType[]>([])
const filterCancelList = computed(() => {
  if (!listData.value) return []
  return deepCopy(listData.value).filter((item: any) => item.status !== 'cancel')
})

const quantityTotal = computed(() => {
  if (!filterCancelList.value) return 0
  return filterCancelList.value.length
})
const subtotal = computed(() => {
  if (!filterCancelList.value) return 0
  return filterCancelList.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.unit_price).mul(curr.quantity)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
})
const tax = computed(() => {
  if (!filterCancelList.value) return 0
  return filterCancelList.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.tax_amount)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
})
const charges = computed(() => {
  return 0
})
const totalAmount = computed(() => {
  if (!filterCancelList.value) return 0
  return new Decimal(subtotal.value).add(tax.value).add(charges.value).toDecimalPlaces(6).toNumber()
})
const historyQuantityTotal = ref<number>(0)
const historySubtotal = ref<number>(0)
const historyTax = ref<number>(0)
const historyCharges = ref<number>(0)
const historyTotalAmount = ref<number>(0)
const historyChange = computed(() => {
  if (!listData.value || !oldListData.value) return 0

  let sum = 0

  const oldMap = new Map(oldListData.value.map((oldItem: any) => [oldItem.line_id, oldItem]))
  for (const item0 of listData.value) {
    const oldItem = oldMap.get(item0.line_id)
    if (!oldItem) {
      sum += 1
      continue
    }

    const item = { ...item0 }
    delete item['_X_ROW_KEY']

    if (JSON.stringify(item) !== JSON.stringify(oldItem)) {
      sum += 1
    }
  }

  return sum
})
const historyChangeByApproval = ref<number>(0)

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'ModificationSalesOrderTableSetting',
  api: (pageParams: any) => {
    return listData.value.filter((item: any) => item.status !== 'cancel')
  },
  columns: [
    {
      field: 'index',
      title: '序號 Index',
      align: 'center',
      type: 'seq',
      minWidth: 100,
      fixed: 'left'
    },
    {
      field: 'ordered_item',
      title: '訂單商品編號 Ordered Item',
      minWidth: 200
    },
    {
      field: 'customer_item',
      title: '客戶商品編號 Customer Item',
      minWidth: 240
    },
    {
      field: 'customer_po',
      title: '客戶訂單 Customer PO',
      minWidth: 200
    },
    {
      field: 'quantity',
      title: '數量 Quantity',
      minWidth: 120
    },
    {
      field: 'unit_price',
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
      field: 'sub_inventory',
      title: '子庫存 Sub-Inventory',
      minWidth: 180
    },
    {
      field: 'tax_code',
      title: '稅碼 Tax Code',
      minWidth: 120
    },
    {
      field: 'request_date',
      title: '申請日期 Request Date',
      minWidth: 180,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'schedule_arrival_date',
      title: '預定抵達日期 Schedule Arrival Date',
      minWidth: 260,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
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

async function getPartsDetails() {
  if (formData.is_approval) return
  const list = [
    {
      line_id: '1',
      customer_po_line: 1,
      quantity: 100,
      tax_code: 'VAT0',
      request_date: 1751385600000,
      quantity_cancelled: 0,
      customer_po: 'PO-2026-001',
      uom: 'PCS',
      tax_amount: 0,
      promise_date: 1752595200000,
      quantity_shipped: 0,
      customer_item: 'CUST-ITEM-A01',
      customer_unit_price: 12.5,
      lead_time: 14,
      scheduled_ship_date: 1752163200000,
      schedule_arrival_date: 1752940800000,
      ordered_item: 'PART-1001',
      unit_price: 12.5,
      description: 'Aluminum Housing Type A',
      sub_inventory: 'FG',
      references: 'REF-001',
      pi_remark: 'Urgent shipment',
      remarks: 'First mock line',
      status: 'create'
    },
    {
      line_id: '2',
      customer_po_line: 2,
      quantity: 250,
      tax_code: 'VAT5',
      request_date: 1751558400000,
      quantity_cancelled: 10,
      customer_po: 'PO-2026-001',
      uom: 'PCS',
      tax_amount: 156.25,
      promise_date: 1752768000000,
      quantity_shipped: 50,
      customer_item: 'CUST-ITEM-B02',
      customer_unit_price: 8.25,
      lead_time: 21,
      scheduled_ship_date: 1752336000000,
      schedule_arrival_date: 1753113600000,
      ordered_item: 'PART-1002',
      unit_price: 8.25,
      description: 'Plastic Cover Type B',
      sub_inventory: 'FG',
      references: 'REF-002',
      pi_remark: '',
      remarks: 'Partial shipped',
      status: 'create'
    },
    {
      line_id: '3',
      customer_po_line: 3,
      quantity: 50,
      tax_code: 'VAT0',
      request_date: 1751644800000,
      quantity_cancelled: 0,
      customer_po: 'PO-2026-001',
      uom: 'SET',
      tax_amount: 0,
      promise_date: 1753372800000,
      quantity_shipped: 0,
      customer_item: 'CUST-ITEM-C03',
      customer_unit_price: 45.0,
      lead_time: 30,
      scheduled_ship_date: 1753027200000,
      schedule_arrival_date: 1753804800000,
      ordered_item: 'PART-2001',
      unit_price: 42.8,
      description: 'Motor Assembly Kit',
      sub_inventory: 'WIP',
      references: 'REF-003',
      pi_remark: 'Need QC report',
      remarks: 'Custom color',
      status: 'create'
    },
    {
      line_id: '4',
      customer_po_line: 1,
      quantity: 1000,
      tax_code: 'VAT8',
      request_date: 1751817600000,
      quantity_cancelled: 0,
      customer_po: 'PO-2026-001',
      uom: 'PCS',
      tax_amount: 960,
      promise_date: 1785513600000,
      quantity_shipped: 200,
      customer_item: 'CUST-ITEM-D04',
      customer_unit_price: 1.2,
      lead_time: 7,
      scheduled_ship_date: 1753632000000,
      schedule_arrival_date: 1754409600000,
      ordered_item: 'PART-3001',
      unit_price: 1.2,
      description: 'Screw M3x8',
      sub_inventory: 'RM',
      references: 'REF-004',
      pi_remark: 'Bulk order',
      remarks: '',
      status: 'create'
    },
    {
      line_id: '5',
      customer_po_line: 2,
      quantity: 80,
      tax_code: 'VAT5',
      request_date: 1783440000000,
      quantity_cancelled: 5,
      customer_po: 'PO-2026-001',
      uom: 'PCS',
      tax_amount: 95.2,
      promise_date: 1786291200000,
      quantity_shipped: 0,
      customer_item: 'CUST-ITEM-E05',
      customer_unit_price: 23.8,
      lead_time: 28,
      scheduled_ship_date: 1785859200000,
      schedule_arrival_date: 1786723200000,
      ordered_item: 'PART-4001',
      unit_price: 23.8,
      description: 'Control Board PCB',
      sub_inventory: 'FG',
      references: 'REF-005',
      pi_remark: 'Firmware v2.1',
      remarks: 'Hold for confirmation',
      status: 'create'
    }
  ] as DataItemType[]
  listData.value = deepCopy(list)
  oldListData.value = deepCopy(list)

  nextTick(() => {
    reload()
  })

  historyQuantityTotal.value = oldListData.value.length
  historySubtotal.value = oldListData.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.unit_price).mul(curr.quantity)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
  historyTax.value = listData.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.tax_amount)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
  historyCharges.value = 0
  historyTotalAmount.value = new Decimal(subtotal.value).add(tax.value).add(charges.value).toDecimalPlaces(6).toNumber()
}

function init() {
  isApproval.value = formData.is_approval
  if (!isApproval.value) return

  listData.value = formData.order_item_list

  nextTick(() => {
    reload()
  })

  if (formData.is_approval) {
    historyQuantityTotal.value = formData.history_quantity_total
    historySubtotal.value = formData.history_subtotal
    historyTax.value = formData.history_tax
    historyCharges.value = formData.history_charges
    historyTotalAmount.value = formData.history_total_amount
    historyChangeByApproval.value = formData.history_change
  }
}

async function getFormData(needValidation = true) {
  const list = deepCopy(listData.value).map((item: any) => {
    delete item['_X_ROW_KEY']
    return item
  })

  const result = {
    order_item_list: list,
    old_order_item_list: oldListData.value,
    history_quantity_total: historyQuantityTotal.value,
    history_subtotal: historySubtotal.value,
    history_tax: historyTax.value,
    history_charges: historyCharges.value,
    history_total_amount: historyTotalAmount.value,
    history_change: historyChange.value,
    quantity_total: quantityTotal.value,
    subtotal: subtotal.value,
    tax: tax.value,
    charges: charges.value,
    total_amount: totalAmount.value
  }
  if (!needValidation) return result
  return result
}

const formWidgetSalesOrderApprovalModificationDialogRef = ref()

function handleDblClick(row: DataItemType) {
  const line_id = row.line_id
  let isNewItem
  let oldRowItem

  const find = oldListData.value.find((item: DataItemType) => item.line_id === line_id)
  if (!!find) {
    isNewItem = false
    oldRowItem = find
  } else {
    isNewItem = true
    oldRowItem = undefined
  }

  formWidgetSalesOrderApprovalModificationDialogRef.value.open(isNewItem, row, oldRowItem)
}

function handleAdd() {
  formWidgetSalesOrderApprovalModificationDialogRef.value.open(true, undefined, undefined)
}
function handleCreate(newRow: DataItemType) {
  if (isApproval.value) return
  listData.value.push(newRow)
  reload()
}

function handleUpdate(row: DataItemType) {
  const index: number = listData.value.findIndex((item: DataItemType) => item.line_id === row.line_id)
  listData.value[index] = row
  reload()
}

async function handleDelete(row: DataItemType) {
  if (isApproval.value) return
  try {
    const action = await ElMessageBox.confirm(`Are you sure you want to delete "${row.ordered_item}"?`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return

    const index = listData.value.findIndex((item) => item.line_id === row.line_id)
    const oldItem = listData.value[index]
    listData.value[index] = { ...oldItem, status: 'cancel' }

    reload()
  } catch (error) {
    console.log(error)
  }
}

watch(
  () => formData.order_item_list,
  (value) => {
    if (!!value) {
      init()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => formData.old_order_item_list,
  (value) => {
    if (!!value) {
      oldListData.value = value
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => formData.order_number,
  async (value) => {
    if (!!value && value === '123692222') {
      await getPartsDetails()
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top" class="all-input-style">
    <el-row>
      <el-col :span="4">
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
      <el-col :span="4">
        <el-form-item label="歷史變更 History Change">
          <el-input-number v-if="!isApproval" v-model="historyChange" disabled />
          <el-input-number v-else v-model="historyChangeByApproval" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div style="height: 60vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div v-if="!isApproval">
          <el-button type="primary" @click="handleAdd">添加零件 Add Parts</el-button>
        </div>
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
