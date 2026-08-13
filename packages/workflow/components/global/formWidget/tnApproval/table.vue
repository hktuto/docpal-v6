<script setup lang="ts">
import { ElMessage } from 'element-plus'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()
const dataList = ref<any[]>([])
const tnApprovalDialogRef = ref()
const isApproval = ref<boolean>(false)
const selectedRowsList = ref<any[]>([])
const formModel = reactive({
  selectedRowsListLength: 0
})
const rules = {
  selectedRowsListLength: [
    {
      validator: (_rule, value, callback) => {
        if (!value || Number(value) < 1) {
          callback(new Error(''))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}
const selectedRowsListLength = computed(() => {
  return selectedRowsList.value.length || 0
})
watch(
  selectedRowsListLength,
  (len) => {
    formModel.selectedRowsListLength = len
  },
  { immediate: true }
)

function getColumns() {
  const checkboxCol = { type: 'checkbox', width: 60, align: 'center', fixed: 'left' }

  const defList: any[] = [
    {
      field: 'index',
      title: '序號 Index',
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'moq_checked',
      title: 'MOQ檢查 MOQ Checked',
      minWidth: 240
    },
    {
      field: 'po_number',
      title: 'PO編號 PO Number',
      minWidth: 240
    },
    {
      field: 'part_number',
      title: '零件編號 Part Number',
      minWidth: 240
    },
    {
      field: 'part_description',
      title: '零件描述 Part Description',
      minWidth: 240
    },
    {
      field: 'sys_qty',
      title: '系統數量 Sys Qty',
      minWidth: 240
    },
    {
      field: 'qty',
      title: '數量 QTY',
      minWidth: 240
    },
    {
      field: 'unit_price',
      title: '單價 Unit Price',
      minWidth: 240
    },
    {
      field: 'shipment_number',
      title: '出貨編號 Shipment Number',
      minWidth: 240
    },
    {
      field: 'amount',
      title: '合計 Amount',
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: '子庫存 Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'tn_planned_date',
      title: 'TN計畫日期 TN Planned Date',
      minWidth: 240,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'office',
      title: '辦事處 To Office',
      minWidth: 240
    },
    {
      field: 'origin',
      title: '來源 Origin',
      minWidth: 240
    },
    {
      field: 'product_name',
      title: '產品名稱 Product Name',
      minWidth: 240
    },
    {
      field: 'description',
      title: '描述 Description',
      minWidth: 240
    },
    {
      field: 'git_stk',
      title: 'GIT STK',
      minWidth: 240
    },
    {
      field: 'from_sub_inventory',
      title: '來自子庫存 From Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'po_line_number',
      title: 'PO行號 PO Line Numbe',
      minWidth: 240
    },
    {
      field: 'ship_number',
      title: '船號 Ship Number',
      minWidth: 240
    },
    {
      field: 'commodity_inspection',
      title: '商品檢驗 Commodity Inspection',
      minWidth: 240
    },
    {
      field: 'status',
      title: '狀態 Status',
      minWidth: 240
    }
  ]

  if (!isApproval.value) {
    defList.unshift(checkboxCol)
  }

  return defList
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'returnTNApprovalTableSetting',
  api: () => {
    return dataList.value
  },
  columns: getColumns(),
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
      },
      {
        code: 'cancel',
        name: 'Cancel',
        action: ({ row }: { row: any }) => {
          row.status = 'cancel'
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }: any) => {
    if (!row) {
      return { visible: false, disabled: false }
    }

    if (isApproval.value && code === 'cancel') {
      return { visible: false, disabled: false }
    }

    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    selectedRowsList.value = selectedRows
  },
  optionalConfig: {}
})

function handleDblClick(row: any) {
  tnApprovalDialogRef.value.open(row)
}

function update(row: any) {
  if (isApproval.value) return

  const index = dataList.value.findIndex((item: any) => item.id === row.id)
  if (index !== -1) {
    dataList.value[index] = row
  }
}

function init() {
  dataList.value = formData.data_list
  nextTick(() => {
    reload()
  })
}

async function getFormData(needValidation = true) {
  if (isApproval.value) return {}
  if (!needValidation) return {}

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.error('請選擇訂單')
    throw new Error('')
  }

  const list = deepCopy(selectedRowsList.value).map((item: any) => {
    delete item['_X_ROW_KEY']
    return item
  })

  const result = {
    data_list: list
  }

  if (!needValidation) return result
  return result
}

watch(
  () => formData.data_list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => formData.is_approval,
  (value) => {
    isApproval.value = value
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <div style="height: 79vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-form ref="formRef" :model="formModel" :rules="rules" label-position="left" inline>
          <el-form-item label="已選中數量 Selected Quantity" prop="selectedRowsListLength">
            <el-input v-model="formModel.selectedRowsListLength" disabled />
          </el-form-item>
        </el-form>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetTnApprovalDialog ref="tnApprovalDialogRef" :disabled="isApproval" @submit="update" />
</template>

<style scoped lang="scss"></style>
