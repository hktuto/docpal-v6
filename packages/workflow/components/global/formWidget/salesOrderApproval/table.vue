<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const statistics = reactive({
  subtotal: 0,
  tax: 0,
  charges: 0,
  total: 0
})

const formRef = ref()
const listData = ref<any[]>([])

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'SalesOrderTableSetting',
  api: (pageParams: any) => {
    return []
  },
  columns: [
    {
      field: 'line',
      title: '行 Line',
      minWidth: 80,
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
    open(row)
  },
  bodyActions: [
    [
      {
        code: 'open',
        name: 'Open',
        action: ({ row }: any) => {
          open(row)
        }
      }
    ]
  ],
  permissionMethod: ({ options, column, row, rowIndex }: any) => {
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

function init() {}

async function getFormData(needValidation = true) {
  const result = { sample_list: '' }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

const formWidgetSalesOrderApprovalDialogRef = ref()
function open(row: any) {
  formWidgetSalesOrderApprovalDialogRef.value.open(row)
}

// watch(
//   () => formData.order_item_list,
//   (value) => {
//     if (!!value && value.length > 0) {
//       init()
//     }
//   },
//   { immediate: true, deep: true }
// )
defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top">
    <el-row>
      <el-col :span="6">
        <el-form-item label="小計 Subtotal">
          <el-input-number style="width: 90%" v-model="statistics.subtotal" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="稅 Tax">
          <el-input-number style="width: 90%" v-model="statistics.tax" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="附加費 Charges">
          <el-input-number style="width: 90%" v-model="statistics.charges" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="總計 Total">
          <el-input-number style="width: 90%" v-model="statistics.total" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-button type="primary" @click="open">添加 Add</el-button>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetSalesOrderApprovalDialog ref="formWidgetSalesOrderApprovalDialogRef" />
</template>

<style scoped lang="scss"></style>
