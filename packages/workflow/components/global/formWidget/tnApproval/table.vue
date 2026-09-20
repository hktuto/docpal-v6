<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { clientApi, newClientApi } from 'api'
import dayjs from 'dayjs'
import { v7 as uuidv7 } from 'uuid'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()
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
      await getInventory(userInfo.value.office)
    }
  }
  toPlannedDate.value = dayjs().format('YYYY-MM-DD')

  await getOffice()
  await getBrandOptions()
}

async function getOffice() {
  try {
    officeOption.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/offices`).then((r: any) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

async function getInventory(organization_code: string) {
  try {
    const inventoryList: any = await clientApi.instance
      .get(`/apis/v1/ms/oracle/warehouses?organization_code=${organization_code}&active_only=true&limit=500`)
      .then((r: any) => r.data.items)
    subInventoryOption.value = inventoryList.map((item: any) => ({
      label: item.warehouse_code,
      value: item.warehouse_code,
      organization_code: item.organization_code,
      description: item.description,
      org_id: item.org_id
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
      title: t('transferNoteApproval.index'),
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'po_number',
      title: t('transferNoteApproval.poNumber'),
      minWidth: 240
    },
    {
      field: 'part_number',
      title: t('transferNoteApproval.partNumber'),
      minWidth: 240
    },
    {
      field: 'part_description',
      title: t('transferNoteApproval.partDescription'),
      minWidth: 240
    },
    {
      field: 'sys_qty',
      title: t('transferNoteApproval.sysQty'),
      minWidth: 240
    },
    {
      field: 'qty',
      title: t('transferNoteApproval.qty'),
      minWidth: 240,
      slots: { default: 'qty' }
    },
    {
      field: 'unit_price',
      title: t('transferNoteApproval.unitPrice'),
      minWidth: 240
    },
    {
      field: 'shipment_number',
      title: t('transferNoteApproval.shipmentNumber'),
      minWidth: 240,
      slots: { default: 'shipment_number' }
    },
    {
      field: 'amount',
      title: t('transferNoteApproval.amount'),
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: t('transferNoteApproval.toSubInventory'),
      minWidth: 240,
      slots: { default: 'sub_inventory' }
    },
    {
      field: 'tn_planned_date',
      title: t('transferNoteApproval.tnPlannedDate'),
      minWidth: 240,
      formatter({ cellValue }: any) {
        return dayjs(cellValue).format('YYYY-MMM-DD')
      },
      slots: { default: 'tn_planned_date' }
    },
    {
      field: 'office',
      title: t('transferNoteApproval.toOffice'),
      minWidth: 240,
      slots: { default: 'office' }
    },
    {
      field: 'origin',
      title: t('transferNoteApproval.origin'),
      minWidth: 240
    },
    {
      field: 'product_name',
      title: t('transferNoteApproval.productName'),
      minWidth: 240
    },
    {
      field: 'description',
      title: t('transferNoteApproval.description'),
      minWidth: 240
    },
    {
      field: 'git_stk',
      title: t('transferNoteApproval.gitStk'),
      minWidth: 240
    },
    {
      field: 'from_sub_inventory',
      title: t('transferNoteApproval.fromSubInventory'),
      minWidth: 240
    },
    {
      field: 'po_line_number',
      title: t('transferNoteApproval.poLineNumber'),
      minWidth: 240
    },
    {
      field: 'shipment_num',
      title: t('transferNoteApproval.shipmentNum'),
      minWidth: 240
    },
    {
      field: 'commodity_inspection',
      title: t('transferNoteApproval.commodityInspection'),
      minWidth: 240
    },
    {
      field: 'status',
      title: t('transferNoteApproval.status'),
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
        name: t('transferNoteApproval.open'),
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

async function handleReview() {
  if (selectedRowsListLength.value === 0) {
    ElMessage.error(t('transferNoteApproval.pleaseSelectOrders'))
    return
  }

  const checkList: any[] = selectedRowsList.value.map((item) => ({
    org_id: userInfo.value.org_id,
    part_num: item.part_number,
    sub_inv: item.from_sub_inventory,
    metrics: ['onhand']
  }))

  const boolean = await batchStockCheck(checkList)

  tnApprovalReviewRef.value?.open({
    office: userInfo.value.office,
    toPlannedDate: toPlannedDate.value,
    commodityInspection: !boolean ? 'Y' : 'N',
    remark: remark.value,
    dataList: selectedRowsList.value
  })
}

function handleUpdate(row: any) {
  const index = dataList.value.findIndex((item: any) => item.id === row.id)
  if (index !== -1) {
    dataList.value[index] = row
  }
  saveLine(row)
  reload()
}

async function handleSearchByDate() {
  isGitSearch.value = true
  dataList.value = []
  if (!search.gitDate || search.gitDate === '') {
    routerProvider?.message.error(t('transferNoteApproval.pleaseSelectGitDate'))
    return
  }

  const raw = {
    org_id: userInfo.value.org_id,
    git_date: search.gitDate
  }

  try {
    const data = await newClientApi.postTnInquiryGit(raw).then((r: any) => r.data)

    if (data.lines.length === 0) {
      routerProvider?.message.warning(t('transferNoteApproval.noDataFound'))
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
    const data = await newClientApi.postTnInquiryOnhand(raw).then((r: any) => r.data)

    if (data.lines.length === 0) {
      routerProvider?.message.warning(t('transferNoteApproval.noDataFound'))
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

  if (!!row.id) {
    saveLine(row.id)
  }
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

  const list: any[] = []
  list.push(row)

  const raw = {
    batch_id: batch_id.value,
    org_id: userInfo.value.org_id,
    lines: list
  }
  await newClientApi.putTnLines(raw)
}

async function batchStockCheck(list: any[]) {
  const data: any[] = await clientApi.instance.post(`/apis/v1/ms/postgres/stock-check/enquiry/batch`, list).then((r) => r.data)

  const filter = data.filter((item) => {
    if (item.onhand === 0) {
      return item.part_num
    }
  })

  if (filter.length > 0) {
    ElMessage.error(t('transferNoteApproval.insufficientStock', { items: filter.map((item) => item.part_num).join(',') }))
    return true
  }
  return false
}

async function getFormData(needValidation = true) {
  if (!needValidation) return {}

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.error(t('transferNoteApproval.pleaseSelectOrders'))
    throw new Error('')
  }
  if (selectedRowsListLength.value === 0) {
    ElMessage.error(t('transferNoteApproval.pleaseSelectOrders'))
    throw new Error('')
  }

  const { resultList, checkList } = selectedRowsList.value.reduce(
    (acc, item) => {
      acc.resultList.push({
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
      })
      acc.checkList.push({
        org_id: userInfo.value.org_id,
        part_num: item.part_number,
        sub_inv: item.from_sub_inventory,
        metrics: ['onhand']
      })
      return acc
    },
    { resultList: [], checkList: [] }
  )

  if (await batchStockCheck(checkList)) {
    throw new Error('')
  }

  const result = {
    batch_id: batch_id.value,
    org_id: userInfo.value.org_id,
    data_list: resultList,
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
    <el-form-item :label="t('transferNoteApproval.remark')" class="remark-review__item">
      <el-input v-model="remark" />
    </el-form-item>

    <el-button type="primary" @click="handleReview">{{ $t('Review') }}</el-button>
  </div>

  <el-row class="search-groups">
    <el-col :span="10">
      <el-divider content-position="left">{{ t('transferNoteApproval.searchByGitDate') }}</el-divider>
      <div class="git-date-search">
        <el-form-item :label="t('transferNoteApproval.gitDate')" class="git-date-search__item">
          <el-date-picker
            v-model="search.gitDate"
            type="date"
            :placeholder="t('transferNoteApproval.selectDate')"
            format="YYYY/MMM/DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :value-on-clear="dayjs().format('YYYY-MM-DD')"
          />
        </el-form-item>
        <el-button type="primary" @click="handleSearchByDate">{{ t('transferNoteApproval.searchByGitDate') }}</el-button>
      </div>
    </el-col>
    <el-col :span="14">
      <el-divider content-position="left">{{ t('transferNoteApproval.searchByPo') }}</el-divider>
      <div class="git-date-search-2">
        <el-form-item :label="t('transferNoteApproval.brand')" prop="brand" class="git-date-search-2__item">
          <el-select v-model="search.brand" filterable :placeholder="t('transferNoteApproval.selectAnOption')" @change="handleBrandChange" style="width: 100%">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('transferNoteApproval.partNumber')" prop="part_number" class="git-date-search-2__item">
          <el-select-v2
            v-model="search.partNumber"
            filterable
            remote
            :remote-method="getPartList"
            remote-show-suffix
            clearable
            :options="partNumberOptions"
            :placeholder="t('transferNoteApproval.selectAnOption')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('transferNoteApproval.poNumber')" class="git-date-search-2__item">
          <el-input v-model="search.poNumber" clearable />
        </el-form-item>
        <el-button type="primary" @click="handleSearchByPo">{{ t('transferNoteApproval.searchByPo') }}</el-button>
      </div>
    </el-col>
  </el-row>

  <el-divider content-position="left">{{ t('transferNoteApproval.searchResults') }}</el-divider>
  <div style="height: 79vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="toolbar-selected">
          <el-form ref="formRef" :model="formModel" :rules="rules" label-position="left" inline class="toolbar-selected__form">
            <el-form-item :label="t('transferNoteApproval.quantity')" prop="dataListLength">
              <el-input v-model="formModel.dataListLength" disabled />
            </el-form-item>
          </el-form>
          <div>
            {{ t('transferNoteApproval.selectedQuantity') }}: {{ formModel.selectedRowsListLength }}
            <el-button v-if="formModel.selectedRowsListLength > 0" type="danger" @click="handleClear">{{ t('transferNoteApproval.clear') }}</el-button>
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
        <el-select v-model="row.sub_inventory" @change="saveLine(row.id)" filterable>
          <el-option v-for="item in subInventoryOption" :key="item.value" :label="item.label" :value="item.value">
            <template #default> {{ item.label }} - {{ item.description }} </template>
          </el-option>
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

  <LazyFormWidgetTnApprovalDialog ref="tnApprovalDialogRef" :subInventoryOption="subInventoryOption" :officeOption="officeOption" @submit="handleUpdate" />
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
