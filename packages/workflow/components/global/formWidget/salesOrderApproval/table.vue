<script setup lang="ts">

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

const quantityTotal = computed(() => {
  return listData.value.length
})
const subtotal = computed(() => {
  if (!listData.value) return 0
  return listData.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.unit_price).mul(curr.quantity)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
})
const tax = computed(() => {
  if (!listData.value) return 0
  return listData.value
    .reduce((acc, curr) => acc.add(new Decimal(curr.tax_amount)), new Decimal(0))
    .toDecimalPlaces(6)
    .toNumber()
})
const charges = computed(() => {
  if (!listData.value) return 0
  return 0
})
const totalAmount = computed(() => {
  if (!listData.value) return 0
  return new Decimal(subtotal.value).add(tax.value).add(charges.value).toDecimalPlaces(6).toNumber()
})

const isApproval = ref<boolean>(false)
const listData = ref<DataItemType[]>([])
const customerPo = ref<string>('')

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'SalesOrderTableSetting',
  api: () => {
    return listData.value
  },
  columns: [
    {
      field: 'index',
      title: '序號 Index',
      align: 'center',
      type: 'seq',
      minWidth: 100
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

function init() {
  isApproval.value = formData.is_approval
  listData.value = formData.order_item_list
  nextTick(() => {
    reload()
  })
}

async function getFormData(needValidation = true) {
  const list = listData.value.map((item: any) => {
    delete item['_X_ROW_KEY']
    return item
  })

  const result = {
    order_item_list: list,
    subtotal: subtotal.value,
    tax: tax.value,
    charges: charges.value,
    total_amount: totalAmount.value
  }
  if (!needValidation) return result
  return result
}

const formWidgetSalesOrderApprovalDialogRef = ref()

function handleAdd() {
  formWidgetSalesOrderApprovalDialogRef.value.open()
}

function handleDblClick(row: any) {
  formWidgetSalesOrderApprovalDialogRef.value.open(row)
}

function handleSynchronizePoNumbers() {
  if (listData.value.length === 0) return

  const po = formData.customer_po
  listData.value = listData.value.map((item: any) => ({
    ...item,
    customer_po: po
  }))
  reload()
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
    if (index !== -1) {
      listData.value.splice(index, 1)
    }
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
  () => formData.customer_po,
  (value) => {
    customerPo.value = value
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top" class="all-input-style">
    <el-row>
      <el-col :span="6">
        <el-form-item label="小計 Subtotal">
          <el-input-number v-model="subtotal" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="稅 Tax">
          <el-input-number v-model="tax" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="附加費 Charges">
          <el-input-number v-model="charges" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="總計 Total">
          <el-input-number v-model="totalAmount" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div style="height: 60vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div v-if="!isApproval">
          <el-button type="primary" @click="handleAdd">添加零件 Add Parts</el-button>
          <el-button type="warning" @click="handleSynchronizePoNumbers">同步全部客戶訂單編號 Synchronize All PO Numbers</el-button>
        </div>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetSalesOrderApprovalDialog
    ref="formWidgetSalesOrderApprovalDialogRef"
    :customerPo="customerPo"
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
