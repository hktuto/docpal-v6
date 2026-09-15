<script setup lang="ts">
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const showAll = ref<boolean>(true)
const tnList = ref<any[]>([])
const dataList = ref<any[]>([])
const userInfo = ref<any>({
  user: '',
  office: '',
  org_id: ''
})
const isApproval = ref<boolean>(false)
const selectedRowsList = ref<any[]>([])

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => {
    return dataList.value
  },
  columns: [
    {
      type: 'checkbox',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      field: 'tn_line_num',
      title: 'TN 行號',
      align: 'center',
      minWidth: 100
    },
    {
      field: 'line_num',
      title: 'PO 行號',
      minWidth: 100
    },
    {
      field: 'po_number',
      title: 'PO編號 PO Number',
      minWidth: 240
    },
    {
      field: 'item',
      title: 'WCL零件編號 WCL Part Number',
      minWidth: 240
    },
    {
      field: 'item_origin',
      title: '來源 Origin',
      minWidth: 100
    },
    {
      field: 'qty_delivered_onhand',
      title: '在手數量 On Hand Qty',
      minWidth: 240
    },
    {
      field: 'from_subinventory',
      title: '來自子庫存 From Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'to_subinventory',
      title: '至子庫存 To Sub-Inventory',
      minWidth: 240
    },
    {
      field: 'transfer_quantity',
      title: '轉移數量 Transfer Qty',
      minWidth: 140
    },
    {
      field: 'unit_price_in_hkd',
      title: '單價 Unit Price',
      minWidth: 160
    },
    {
      field: 'amount_in_hkd',
      title: '合計 Amount',
      minWidth: 150
    },
    {
      field: 'status',
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
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  selectChangeHander: (selectedRows: any[]) => {
    selectedRowsList.value = selectedRows
  }
})

function handleShowData() {
  const data = showAll ? [] : dataList.value
  tableRef.value.loadData(data)
  // reload()
}

async function init(tn_number: string) {
  const useLocalStorage = localStorage.getItem('docpal-user')
  if (useLocalStorage) {
    const user = JSON.parse(useLocalStorage)

    if (user.org.length > 0) {
      userInfo.value.office = user.org[0].organizationCode
      userInfo.value.org_id = user.org[0].operatingId
    }
  }
  showAll.value = true
  tnList.value = []
  dataList.value = []
  await getTNData(tn_number)
  // nextTick(() => reload())
}

async function getTNData(tnNumber: string) {
  const raw = {
    // org_id: userInfo.value.org_id,
    org_id: 14,
    tn_numbers: [tnNumber]
  }

  const data = await clientApi.instance.post(`/api/tn/details`, raw).then((r) => r.data.data.items)
  if (data.length === 0) {
    routerProvider?.message.warning('未查詢到相關信息!')
    return
  }

  dataList.value = data[0].lines
  console.log(123, data[0].lines)
  reload()
}

watch(
  () => formData.tn_number,
  (value) => {
    if (!!value) {
      init(value)
    }
  },
  { immediate: true, deep: true }
)

onMounted(async () => {
  await getTNData('a')
})

function getFormData() {
  return {}
}
const tnNumber = ref('')

defineExpose({ getFormData })
</script>

<template>
  <el-input v-model="tnNumber" @change="getTNData" />

  <div class="tn-review-table">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-divider v-if="!isApproval" content-position="left">選擇要取消的行 Select Lines To Cancel</el-divider>
        <el-divider v-else content-position="left">
          Lines Pending Approval {{ selectedRowsList.length }} of {{ dataList.length }} lines selected for cancellation
        </el-divider>
        <el-button v-if="isApproval" type="primary" @click="handleShowData">{{ showAll ? 'Show Cancel Lines' : 'Show All Lines' }}</el-button>
      </template>

      <template #cancel_reason="{ row, index }">
        <el-input v-model="row.cancel_reason" />
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss">
.tn-review-table {
  height: 60vh;
}
</style>
