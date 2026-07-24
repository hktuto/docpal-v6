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
  returnOrder: string
  leadTime: number
  scheduledShipDate: string
  scheduledArrivalDate: string
  orderedItem: string
  unitPrice: number
  description: string
  subInventory: string
  references: string
  piRemark: string
  remarks: string
}

const subtotal = computed(() => {
  return listData.value.length
})
const tax = computed(() => {
  return 0
})
const charges = computed(() => {
  return 0
})
const total = computed(() => {
  return 0
})

const isApproval = ref<boolean>(false)
const formRef = ref()
const listData = ref<DataItemType[]>([])

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
      treeNode: true
    },
    {
      field: 'orderedItem',
      title: '訂單商品編號 Ordered Item',
      minWidth: 200
    },
    {
      field: 'customerItem',
      title: '客戶商品編號 Customer Item',
      minWidth: 200
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

function loadData() {
  tableRef.value?.loadData(listData.value)
}

function init() {
  isApproval.value = true
}

async function getFormData(needValidation = true) {
  const result = { sample_list: '' }
  if (!needValidation) return result
  await formRef.value?.validate()
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

  const one = listData.value[0]
  if (!one.customerPo) return
}

function handleCreate(newRow: DataItemType) {
  if (isApproval.value) return
  listData.value.push(newRow)
  loadData()
}

function handleUpdate(data: any) {}

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
  () => formData.order_item_list,
  (value) => {
    init()
    if (!!value && value.length > 0) {
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
          <el-input-number v-model="total" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div style="height: 60vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-button type="primary" @click="handleAdd">添加商品 Add Goods</el-button>
        <el-button type="warning" @click="handleSynchronizePoNumbers">同步全部客戶訂單編號 Synchronize All PO Numbers</el-button>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetSalesOrderApprovalDialog ref="formWidgetSalesOrderApprovalDialogRef" @create="handleCreate" @update="handleUpdate" />
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input-number) {
    width: 96%;
  }
}
</style>
