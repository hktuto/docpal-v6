<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const showAll = ref<boolean>(true)
const tnList = ref<any[]>([])
const dataList = ref<any[]>([])

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => dataList.value,
  columns: [
    {
      type: 'checkbox',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      field: 'tn_line',
      title: 'TN 行號',
      align: 'center',
      minWidth: 100
    },
    {
      field: 'po_line',
      title: 'PO 行號',
      minWidth: 100
    },
    {
      field: 'po_number',
      title: 'PO編號 PO Number',
      minWidth: 240
    },
    {
      field: 'part_number',
      title: 'WCL零件編號 WCL Part Number',
      minWidth: 240
    },
    {
      field: 'origin',
      title: '來源 Origin',
      minWidth: 100
    },
    {
      field: 'on_hand_qty',
      title: '在手數量 On Hand Qty',
      minWidth: 240
    },
    {
      field: 'from_sub_inventory',
      title: '來自子庫存 From Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: '至子庫存 To Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'qty',
      title: '轉移數量 Transfer Qty',
      minWidth: 140
    },
    {
      field: 'unit_price',
      title: '單價 Unit Price',
      minWidth: 160
    },
    {
      field: 'amount',
      title: '合計 Amount',
      minWidth: 150
    },
    {
      field: 'line_status',
      title: '行狀態 Line Status',
      minWidth: 240
    },
    {
      field: 'cancel_reason',
      title: '取消原因 Cancel Reason',
      minWidth: 240,
      slots: { default: 'cancel_reason' }
    }
  ],
  zoom: false,
  refresh: false,
  customeToolBar: true,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false
})

function handleShowData() {
  reload()
}

async function init() {
  showAll.value = true
  tnList.value = []
  dataList.value = []


  nextTick(() => reload())
}

watch(
  () => formData.tn_mumber,
  (value) => {
    if (!!value) {
      init()
    }
  },
  { immediate: true, deep: true }
)

function getFormData() {
  return {}
}

defineExpose({ getFormData })
</script>

<template>
  <el-divider content-position="left">選擇要取消的行 Select Lines To Cancel</el-divider>
  <div class="tn-review-table">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-button type="primary" @click="handleShowData">{{ showAll ? 'Show Cancel Lines' : 'Show All Lines' }}</el-button>
      </template>

      <template #cancel_reason="{ row, index }">
        <el-input v-model="row.cancel_reason" />
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss">
.tn-review-table {
  height: 50vh;
}
</style>
