<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'
import dayjs from 'dayjs'
import { v7 as uuidv7 } from 'uuid'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const routerProvider = inject(MenuRouterKey)
const formRef = ref()
const dataList = ref<any[]>([])
const tnApprovalDialogRef = ref()
const tnApprovalReviewRef = ref()
const selectedRowsList = ref<any[]>([])
const formModel = reactive({
  dataListLength: 0,
  selectedRowsListLength: 0
})
const isGitSearch = ref<boolean>(true)
const remark = ref<string>('')
const batch_id = ref<string>('')
const userInfo = ref<any>({
  user: '',
  office: '',
  org_id: ''
})
const toPlannedDate = ref<string>('')
const search = reactive({
  gitDate: dayjs().format('YYYY-MM-DD'),
  brand: 'ABBYY',
  partNumber: '',
  poNumber: ''
})
const subInventoryOption = ref<any[]>([])
const officeOption = ref<any[]>([])

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
const dataListLength = computed(() => {
  return dataList.value.length || 0
})
watch(
  dataListLength,
  (len) => {
    formModel.dataListLength = len
  },
  { immediate: true }
)

const brandOptions = ref<any[]>([])
const partNumberOptions = ref<any[]>([])

async function init() {
  const useLocalStorage = localStorage.getItem('docpal-user')
  if (useLocalStorage) {
    const user = JSON.parse(useLocalStorage)

    if (user.org.length > 0) {
      userInfo.value.office = user.org[0].organizationCode
      userInfo.value.org_id = user.org[0].operatingId
    }
  }
  toPlannedDate.value = dayjs().format('YYYY-MM-DD')

  await getOffice()
  await getInventory()
  await getBrandOptions()
}

async function getOffice() {
  try {
    officeOption.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/offices`).then((r: any) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

async function getInventory() {
  try {
    const inventoryList: any = await clientApi.instance.get(`/apis/v1/ms/oracle/warehouses?active_only=true&limit=500`).then((r: any) => r.data.items)
    subInventoryOption.value = inventoryList.map((item: any) => ({
      label: item.warehouse_code,
      value: item.warehouse_code,
      organization_code: item.organization_code
    }))
  } catch (e) {
    console.log(e)
  }
}

async function getBrandOptions() {
  try {
    brandOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/brands?limit=500`).then((r: any) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

async function getPartList(query?: string) {
  try {
    const q = query ? `q=${query}&` : ''
    const brandQuery = search.brand ? `brand=${search.brand}&` : ''
    const data = await clientApi.instance
      .get(`/apis/v1/ms/oracle/wcl-item-nos?${q}${brandQuery}pageNum=1&pageSize=100&includeCustomer=false`)
      .then((r: any) => r.data.items)
    if (!data?.length) return

    partNumberOptions.value = data.map((item: any) => ({
      label: item.wcl_item_no,
      value: item.wcl_item_no
    }))
  } catch (e) {
    console.log(e)
  }
}

function handleBrandChange() {
  search.partNumber = ''
  partNumberOptions.value = []
  getPartList()
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'returnTNApprovalTableSetting',
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
      field: 'index',
      title: '序號 Index',
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
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
      minWidth: 240,
      slots: { default: 'qty' }
    },
    {
      field: 'unit_price',
      title: '單價 Unit Price',
      minWidth: 240
    },
    {
      field: 'shipment_number',
      title: '出貨編號 Shipment Number',
      minWidth: 240,
      slots: { default: 'shipment_number' }
    },
    {
      field: 'amount',
      title: '合計 Amount',
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: '至子庫存 To Sub-Inventory',
      minWidth: 240,
      slots: { default: 'sub_inventory' }
    },
    {
      field: 'tn_planned_date',
      title: 'TN計畫日期 TN Planned Date',
      minWidth: 240,
      formatter({ cellValue }: any) {
        return dayjs(cellValue).format('YYYY-MMM-DD')
      },
      slots: { default: 'tn_planned_date' }
    },
    {
      field: 'office',
      title: '辦事處 To Office',
      minWidth: 240,
      slots: { default: 'office' }
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
      field: 'shipment_num',
      title: '出貨行號 Shipment Num',
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
  ],
  zoom: false,
  refresh: false,
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
  selectChangeHander: (selectedRows: any[]) => {
    selectedRowsList.value = selectedRows
  },
  optionalConfig: {}
})

function handleDblClick(row: any) {
  tnApprovalDialogRef.value.open(row)
}

function handleReview() {
  if (!dataList.value.length) {
    ElMessage.error('請搜索訂單')
    return
  }

  tnApprovalReviewRef.value?.open({
    office: userInfo.value.office,
    toPlannedDate: toPlannedDate.value,
    commodityInspection: '',
    remark: remark.value,
    dataList: dataList.value
  })
}

function update(row: any) {
  const index = dataList.value.findIndex((item: any) => item.id === row.id)
  if (index !== -1) {
    dataList.value[index] = row
  }
}

async function handleSearchByDate() {
  isGitSearch.value = true
  dataList.value = []
  if (!search.gitDate || search.gitDate === '') {
    routerProvider?.message.error('請選擇GIT日期')
    return
  }

  const raw = {
    org_id: userInfo.value.org_id,
    git_date: search.gitDate
  }

  try {
    const data = await clientApi.instance.post(`/api/tn/inquiry/git`, raw).then((r: any) => r.data.data)

    if (data.lines.length === 0) {
      routerProvider?.message.warning('未檢索到數據!')
      return
    }

    batch_id.value = data.batch_id
    dataList.value = data.lines.map((item: any) => ({
      id: uuidv7(),
      po_number: item.po_number,
      part_number: item.item,
      part_description: item.item_description,
      sys_qty: item.qty_delivered_onhand,
      qty: item.qty_delivered_onhand,
      unit_price: item.unit_price_in_hkd,
      shipment_number: item.shipment_number,
      amount: handleAmount({ qty: item.qty_delivered_onhand, unit_price: item.unit_price_in_hkd }),
      sub_inventory: item.to_subinventory,
      tn_planned_date: toPlannedDate.value,
      rcv_transaction_id: item.rcv_transaction_id,
      office: item.office,
      origin: item.item_origin,
      product_name: item.product_name,
      description: item.description,
      git_stk: item.git_flag,
      from_sub_inventory: item.from_subinventory,
      po_line_number: item.line_num,
      shipment_num: item.shipment_num,
      commodity_inspection: item.commodity_inspection,
      status: item.status
    }))
    reload()
  } catch (e) {
    console.log(e)
  }
}

async function handleSearchByPo() {
  isGitSearch.value = false
  dataList.value = []
  const raw = {
    org_id: userInfo.value.org_id,
    item: search.partNumber,
    po_number: search.poNumber
  }

  try {
    const data = await clientApi.instance.post(`/api/tn/inquiry/onhand`, raw).then((r: any) => r.data.data)

    if (data.lines.length === 0) {
      routerProvider?.message.warning('未檢索到數據!')
      return
    }

    batch_id.value = data.batch_id
    dataList.value = data.lines.map((item: any) => ({
      id: uuidv7(),
      po_number: item.po_number,
      part_number: item.item,
      part_description: item.item_description,
      sys_qty: item.qty_delivered_onhand,
      qty: item.qty_delivered_onhand,
      unit_price: item.unit_price_in_hkd,
      shipment_number: item.shipment_number,
      amount: handleAmount({ qty: item.qty_delivered_onhand, unit_price: item.unit_price_in_hkd }),
      sub_inventory: item.to_subinventory,
      tn_planned_date: toPlannedDate.value,
      rcv_transaction_id: item.rcv_transaction_id,
      office: item.office,
      origin: item.item_origin,
      product_name: item.product_name,
      description: item.description,
      git_stk: item.git_flag,
      from_sub_inventory: item.from_subinventory,
      po_line_number: item.line_num,
      shipment_num: item.shipment_num,
      commodity_inspection: item.commodity_inspection,
      status: item.status
    }))
    reload()
  } catch (e) {
    console.log(e)
  }
}

function handleAmount(row: any) {
  const { qty, unit_price } = row
  const amount = new Decimal(qty || 0).mul(unit_price || 0).toNumber()
  row.amount = amount

  saveLine(row.id)
  return amount
}

function handleClear() {
  const selectedSet = new Set(selectedRowsList.value)
  dataList.value = dataList.value.filter((item) => !selectedSet.has(item))
  selectedRowsList.value = []
  reload()
}

async function saveLine(id: string) {
  const item: any = dataList.value.find((item: any) => item.id === id)
  const row = {
    po_number: item.po_number,
    line_num: item.po_line_number,
    shipment_num: item.shipment_num,
    item: item.part_number,
    rcv_transaction_id: item.rcv_transaction_id,
    transfer_quantity: item.qty,
    unit_price_in_hkd: item.unit_price,
    shipment_number: item.shipment_number,
    to_subinventory: item.sub_inventory,
    tn_planned_date: item.tn_planned_date,
    office: item.office
  }

  const list = [...row]

  const raw = {
    batch_id: batch_id.value,
    org_id: userInfo.value.org_id,
    lines: list
  }

  await clientApi.instance.post(`/api/tn/lines`, raw).then((r) => r.data)
}

async function getFormData(needValidation = true) {
  if (!needValidation) return {}

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.error('請選擇訂單')
    throw new Error('')
  }
  if (selectedRowsListLength.value === 0) {
    ElMessage.error('請選擇訂單')
    throw new Error('')
  }

  const list = deepCopy(selectedRowsList.value).map((item: any, index: number) => {
    return {
      po_number: item.po_number,
      line_num: item.po_line_number,
      shipment_num: item.shipment_num,
      item: item.part_number,
      rcv_transaction_id: item.rcv_transaction_id,
      transfer_quantity: item.qty,
      unit_price_in_hkd: item.unit_price,
      shipment_number: item.shipment_number,
      to_subinventory: item.sub_inventory,
      tn_planned_date: item.tn_planned_date,
      office: item.office
    }
  })

  const result = {
    batch_id: batch_id.value,
    org_id: userInfo.value.org_id,
    data_list: list,
    remark: remark.value,
    email_create_date: dayjs().format('YYYY年MM月DD日'),
    email_planned_date: dayjs(toPlannedDate.value).format('YYYY年MM月DD日')
  }

  if (!needValidation) return result
  return result
}

onMounted(() => {
  init()
})

defineExpose({ getFormData })
</script>

<template>
  <div class="remark-review">
    <el-form-item label="備注 Remark" class="remark-review__item">
      <el-input v-model="remark" />
    </el-form-item>

    <el-button type="primary" @click="handleReview">{{ $t('Review') }}</el-button>
  </div>

  <el-row class="search-groups">
    <el-col :span="10">
      <el-divider content-position="left">根據GIT日期搜尋 Search By GIT Date</el-divider>
      <div class="git-date-search">
        <el-form-item label="GIT 日期 GIT Date" class="git-date-search__item">
          <el-date-picker
            v-model="search.gitDate"
            type="date"
            placeholder="Select date"
            format="YYYY/MMM/DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :value-on-clear="dayjs().format('YYYY-MM-DD')"
          />
        </el-form-item>
        <el-button type="primary" @click="handleSearchByDate">Search By GIT Data</el-button>
      </div>
    </el-col>
    <el-col :span="14">
      <el-divider content-position="left">根據PO搜索 Search By PO</el-divider>
      <div class="git-date-search-2">
        <el-form-item label="品牌 Brand" prop="brand" class="git-date-search-2__item">
          <el-select v-model="search.brand" filterable placeholder="Select an option" @change="handleBrandChange" style="width: 100%">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="零件編號 Part Number" prop="part_number" class="git-date-search-2__item">
          <el-select-v2
            v-model="search.partNumber"
            filterable
            remote
            :remote-method="getPartList"
            remote-show-suffix
            clearable
            :options="partNumberOptions"
            placeholder="Select an option"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="PO編號 PO Number" class="git-date-search-2__item">
          <el-input v-model="search.poNumber" clearable />
        </el-form-item>
        <el-button type="primary" @click="handleSearchByPo">Search By PO</el-button>
      </div>
    </el-col>
  </el-row>

  <el-divider content-position="left">搜尋結果 Search Results</el-divider>
  <div style="height: 79vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="toolbar-selected">
          <el-form ref="formRef" :model="formModel" :rules="rules" label-position="left" inline class="toolbar-selected__form">
            <el-form-item label="數量 Quantity" prop="dataListLength">
              <el-input v-model="formModel.dataListLength" disabled />
            </el-form-item>
          </el-form>
          <div>
            已選中數量 Selected Quantity: {{ formModel.selectedRowsListLength }}
            <el-button v-if="formModel.selectedRowsListLength > 0" type="danger" @click="handleClear">Clear</el-button>
          </div>
        </div>
      </template>

      <template #qty="{ row, index }">
        <el-input-number
          v-model="row.qty"
          controls-position="right"
          :min="1"
          :max="row.sys_qty"
          :step="1"
          step-strictly
          style="width: 100%"
          :value-on-clear="row.sys_qty"
          @change="handleAmount(row)"
        />
      </template>
      <template #shipment_number="{ row, index }">
        <el-input v-model="row.shipment_number" @change="saveLine(row.id)" />
      </template>
      <template #sub_inventory="{ row, index }">
        <el-select v-model="row.sub_inventory" @change="saveLine(row.id)">
          <el-option v-for="item in subInventoryOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </template>
      <template #tn_planned_date="{ row, index }">
        <el-date-picker
          v-model="row.tn_planned_date"
          type="date"
          format="YYYY/MMM/DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :clearable="false"
          :value-on-clear="dayjs().format('YYYY-MM-DD')"
          @change="saveLine(row.id)"
        />
      </template>
      <template #office="{ row, index }">
        <el-select v-model="row.office" @change="saveLine(row.id)">
          <el-option v-for="item in officeOption" :key="item.sub_office" :label="item.org_name" :value="item.sub_office" />
        </el-select>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetTnApprovalDialog ref="tnApprovalDialogRef" :subInventoryOption="subInventoryOption" :officeOption="officeOption" @submit="update" />
  <LazyFormWidgetTnApprovalReview ref="tnApprovalReviewRef" />
</template>

<style scoped lang="scss">
.remark-review {
  display: flex;
  align-items: flex-end;
  gap: 12px;

  &__item {
    width: 40%;
    margin-bottom: 0;
  }
}

.search-groups {
  flex-wrap: nowrap;
  gap: 10%;

  :deep(> .el-col) {
    max-width: none;
  }

  :deep(> .el-col-10) {
    flex: 10 1 0;
  }

  :deep(> .el-col-14) {
    flex: 14 1 0;
  }
}

.git-date-search {
  display: flex;
  align-items: flex-end;
  gap: 12px;

  &__item {
    flex: 1;
    margin-bottom: 0;
  }
}

.git-date-search-2 {
  display: flex;
  align-items: flex-end;
  gap: 12px;

  &__item {
    flex: 1;
    margin-bottom: 0;
  }
}

.toolbar-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;

  &__form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}
</style>
