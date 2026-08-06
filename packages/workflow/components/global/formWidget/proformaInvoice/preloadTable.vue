<script setup lang="ts">
const { disabled, temporary_list } = defineProps<{
  disabled: boolean
  temporary_list: any[]
}>()

const selectedRowsList = ref<any[]>([])
const emits = defineEmits(['clear', 'removeUnSelectedLines', 'delete'])

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
      field: 'order_number',
      title: '訂單編號 Order Number',
      minWidth: 200,
      fixed: 'left'
    },
    {
      field: 'customer_number',
      title: '客戶編號 Customer Number',
      minWidth: 240
    },
    {
      field: 'customer_name',
      title: '客戶名稱 Customer Name',
      minWidth: 240
    },
    {
      field: 'customer_engineer_name',
      title: '客戶英文名 Customer Engineer Name',
      minWidth: 240
    },
    {
      field: 'part_number',
      title: '零件編號 Part Number',
      minWidth: 200
    },
    {
      field: 'order_quantity',
      title: '訂購數量 Order Quantity',
      minWidth: 200
    },
    {
      field: 'pi_number',
      title: '剩餘數量 Balance Quantity',
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
      field: 'currency',
      title: '貨幣 Currency',
      minWidth: 120
    },
    {
      field: 'amount',
      title: '金額 Amount',
      minWidth: 120
    },
    {
      field: 'description',
      title: '描述 Description',
      minWidth: 400
    },
    {
      field: 'bill_to_location',
      title: '帳單寄送地點 Bill To Location',
      minWidth: 200
    },
    {
      field: 'ship_to_location',
      title: '收貨地點 Ship To Location',
      minWidth: 200
    }
  ]

  if (!disabled) {
    defList.unshift(checkboxCol)
  }

  return defList
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'SalesOrderTableSetting',
  api: () => {
    return temporary_list
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
        code: 'delete',
        name: 'Delete',
        action: ({ row }: { row: any }) => {
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
        visible: !disabled,
        disabled: false
      }
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

function handleDblClick(row: any) {}

function handleDelete(row: any) {
  if (disabled) return
  emits('delete', row)
}

function handleClear() {
  if (disabled) return
  emits('clear')
}

function handleRemoveUnSelectedLines() {
  if (disabled) return
  emits('removeUnSelectedLines', selectedRowsList.value)
  selectedRowsList.value = []
}

defineExpose({ reload, selectedRowsList })
</script>

<template>
  <div style="height: 60vh; margin-block-start: 20px">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div v-if="!disabled" class="toolbar-actions">
          <div class="toolbar-actions__left">
            <el-button type="primary" @click="handleClear">清除 Clear</el-button>
            <el-button type="primary" @click="handleRemoveUnSelectedLines">刪除未選取的行 Remove Un Selected Lines</el-button>
          </div>
          <slot name="length"/>
        </div>
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss">
.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  &__right {
    margin-bottom: 0;
    :deep(.el-form-item) {
      margin-bottom: 0;
    }
    :deep(.el-input) {
      width: 80px;
    }
  }
}
</style>
