<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'
import dayjs from 'dayjs'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()
const dataList = ref<any[]>([])
const tnApprovalDialogRef = ref()
const tnApprovalReviewRef = ref()
const selectedRowsList = ref<any[]>([])
const formModel = reactive({
  selectedRowsListLength: 0
})
const isGitSearch = ref<boolean>(true)
const remark = ref<string>('')
const userInfo = ref<any>({
  user: '',
  office: ''
})
const toPlannedDate = ref<string>('')
const search = reactive({
  gitDate: '',
  brand: '',
  partNumber: '',
  poNumber: ''
})
const subInventoryOption = ref<any[]>()
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

const brandOptions = ref<any[]>([])
const partNumberOptions = ref<any[]>([])

async function init() {
  const useLocalStorage = localStorage.getItem('docpal-user')
  if (useLocalStorage) {
    const user = JSON.parse(useLocalStorage)

    if (user.org.length > 0) {
      userInfo.value.office = user.org[0].organizationCode
    }
  }
  toPlannedDate.value = dayjs().format('YYYY-MMM-DD')

  await getOffice()
  await getInventory()
  await getBrandOptions()
}

async function getOffice() {
  officeOption.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/offices`).then((r: any) => r.data.items)
}

async function getInventory() {
  const inventoryList: any = await clientApi.instance.get(`/apis/v1/ms/oracle/warehouses?active_only=true&limit=500`).then((r: any) => r.data.items)
  subInventoryOption.value = inventoryList.map((item: any) => ({
    label: item.warehouse_code,
    value: item.warehouse_code,
    organization_code: item.organization_code
  }))
}

async function getBrandOptions() {
  brandOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/brands?limit=500`).then((r: any) => r.data.items)
}

async function getPartList(query?: string) {
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
}

function handleBrandChange() {
  search.partNumber = ''
  partNumberOptions.value = []
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

async function getFormData(needValidation = true) {
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
    data_list: list,
    remark: ''
  }

  if (!needValidation) return result
  return result
}

async function handleSearchByDate() {
  isGitSearch.value = true
  dataList.value = []
  reload()
}

async function handleSearchByPo() {
  isGitSearch.value = false
  dataList.value = [
    {
      id: '1',
      po_number: 'PO-2026-0001',
      part_number: 'PN-A1001',
      part_description: '主機板 Motherboard A1',
      sys_qty: 100,
      qty: 10,
      unit_price: 125.5,
      shipment_number: 'SHP-001',
      amount: 1255,
      sub_inventory: 'SUB-01',
      tn_planned_date: toPlannedDate.value,
      office: 'WSZ',
      origin: 'HK',
      product_name: 'Product Alpha',
      description: '測試描述 1',
      git_stk: 'GIT-01',
      from_sub_inventory: 'FROM-01',
      po_line_number: '1',
      ship_number: 'VESSEL-01',
      commodity_inspection: 'N',
      status: 'pending'
    },
    {
      id: '2',
      po_number: 'PO-2026-0002',
      part_number: 'PN-B2002',
      part_description: '電源供應器 Power Supply B2',
      sys_qty: 80,
      qty: 20,
      unit_price: 88,
      shipment_number: 'SHP-002',
      amount: 1760,
      sub_inventory: 'SUB-02',
      tn_planned_date: toPlannedDate.value,
      office: 'WGZ',
      origin: 'CN',
      product_name: 'Product Beta',
      description: '測試描述 2',
      git_stk: 'GIT-02',
      from_sub_inventory: 'FROM-02',
      po_line_number: '2',
      ship_number: 'VESSEL-02',
      commodity_inspection: 'Y',
      status: 'pending'
    },
    {
      id: '3',
      po_number: 'PO-2026-0003',
      part_number: 'PN-C3003',
      part_description: '散熱模組 Cooling Module C3',
      sys_qty: 50,
      qty: 5,
      unit_price: 46.8,
      shipment_number: 'SHP-003',
      amount: 234,
      sub_inventory: 'SUB-03',
      tn_planned_date: toPlannedDate.value,
      office: 'WSZ',
      origin: 'TW',
      product_name: 'Product Gamma',
      description: '測試描述 3',
      git_stk: 'GIT-03',
      from_sub_inventory: 'FROM-03',
      po_line_number: '3',
      ship_number: 'VESSEL-03',
      commodity_inspection: 'N',
      status: 'pending'
    },
    {
      id: '4',
      po_number: 'PO-2026-0004',
      part_number: 'PN-D4004',
      part_description: '連接線纜 Cable Assembly D4',
      sys_qty: 200,
      qty: 50,
      unit_price: 12.3,
      shipment_number: 'SHP-004',
      amount: 615,
      sub_inventory: 'SUB-01',
      tn_planned_date: toPlannedDate.value,
      office: 'WGZ',
      origin: 'HK',
      product_name: 'Product Delta',
      description: '測試描述 4',
      git_stk: 'GIT-04',
      from_sub_inventory: 'FROM-01',
      po_line_number: '4',
      ship_number: 'VESSEL-04',
      commodity_inspection: 'Y',
      status: 'pending'
    },
    {
      id: '5',
      po_number: 'PO-2026-0005',
      part_number: 'PN-E5005',
      part_description: '外殼組件 Enclosure E5',
      sys_qty: 60,
      qty: 15,
      unit_price: 210,
      shipment_number: 'SHP-005',
      amount: 3150,
      sub_inventory: 'SUB-02',
      tn_planned_date: toPlannedDate.value,
      office: 'WSZ',
      origin: 'CN',
      product_name: 'Product Epsilon',
      description: '測試描述 5',
      git_stk: 'GIT-05',
      from_sub_inventory: 'FROM-02',
      po_line_number: '5',
      ship_number: 'VESSEL-05',
      commodity_inspection: 'N',
      status: 'pending'
    }
  ]
  reload()
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
          <el-date-picker v-model="search.gitDate" type="date" placeholder="Select date" />
        </el-form-item>
        <el-button type="primary" @click="handleSearchByDate">Search By GIT Data</el-button>
      </div>
    </el-col>
    <el-col :span="14">
      <el-divider content-position="left">根據PO搜索 Search By PO</el-divider>
      <div class="git-date-search-2">
        <el-form-item label="品牌 Brand" prop="brand" class="git-date-search-2__item">
          <el-select v-model="search.brand" filterable clearable placeholder="Select an option" @change="handleBrandChange" style="width: 100%">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.lable || item.label" :value="item.value" />
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
          <el-input v-model="search.poNumber" />
        </el-form-item>
        <el-button type="primary" @click="handleSearchByPo">Search By PO</el-button>
      </div>
    </el-col>
  </el-row>

  <el-divider content-position="left">搜尋結果 Search Results</el-divider>
  <div style="height: 79vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-form v-if="!formData.is_approval" ref="formRef" :model="formModel" :rules="rules" label-position="left" inline>
          <el-form-item label="已選中數量 Selected Quantity" prop="selectedRowsListLength">
            <el-input v-model="formModel.selectedRowsListLength" disabled />
          </el-form-item>
        </el-form>
        <el-form-item v-else>
          <el-input v-model="formModel.selectedRowsListLength" disabled />
        </el-form-item>
      </template>

      <template #qty="{ row, index }">
        <el-input-number v-model="row.qty" controls-position="right" :min="1" :step="1" step-strictly style="width: 100%" />
      </template>
      <template #shipment_number="{ row, index }">
        <el-input v-model="row.shipment_number" />
      </template>

      <template #sub_inventory="{ row, index }">
        <el-select v-model="row.sub_inventory">
          <el-option v-for="item in subInventoryOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </template>
      <template #tn_planned_date="{ row, index }">
        <el-date-picker v-model="row.tn_planned_date" type="date" format="YYYY/MMM/DD" value-format="x" style="width: 100%" :clearable="false" />
      </template>
      <template #office="{ row, index }">
        <el-select v-model="row.office">
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
</style>
