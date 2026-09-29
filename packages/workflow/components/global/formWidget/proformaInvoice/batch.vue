<script setup lang="ts">
import { clientApi } from 'api'
import dayjs from 'dayjs'
import { useUserState } from '@packages/authApp/composables/useAuth'
import { v7 as uuidv7 } from 'uuid'
import { ElMessage, type UploadFile } from 'element-plus'
import { workflowResponseHelper } from '@packages/workflow/utils/jsonConversion'

const { t } = useI18n()
const user = useUserState()
const invoiceHeaderOption = ref<any[]>([
  { label: '创能', value: 'SZ' },
  { label: '意堡', value: 'GZ' },
  { label: '能意恒', value: 'SH' },
  { label: '伟创达', value: 'BJ' },
  { label: '创意', value: 'HK' },
  { label: '金领导', value: 'JLD' },
  { label: 'MCE', value: 'MCE' }
])
type dataItem = {
  id: string
  org_id: string
  organization_id: string
  pi_number?: string
  schedule_date: string
  order_number: number
  order_ln: number
  order_qty: number
  part_number: string
  currency: string
  lineAmount: number
  taxValue: number
  tax_code: string
  customer_number: string
  customer_name: string
  bill_to_location: string
  ship_to_location: string
  sub_inventory: string
  grouping?: number
  soLineId: number
  deliveryDetailId: number
  companyTitle: string
  warehouseLocation: string
}

const tableData = ref<dataItem[]>([])
const formModel = reactive({
  invoice_header: 'SZ',
  generation_date: dayjs(new Date()).format('YYYY-MM-DD')
})
const search = reactive({
  office: '',
  customer_number: '',
  orderNumber: '',
  partNumber: ''
})
const customerInfo = ref({
  customer_name: '',
  bill_to_location: '',
  ship_to_location: ''
})
const proformaInvoicePreviewRef = ref()
const loading = ref<boolean>(false)
const customerNumberOptions = ref<any[]>([])
const orderNumberOptions = ref<any[]>([])
const partNumberOptions = ref<any[]>([])
const selectedRowsList = ref<dataItem[]>([])
const selectData = reactive({
  length: 0
})
watch(
  () => selectedRowsList.value.length,
  (len) => {
    selectData.length = len
  },
  { deep: true }
)
const userInfo = ref<{
  org_id: number
  organization_id: number
  operatingName: string
  userId: string
}>({
  org_id: 0,
  organization_id: 0,
  operatingName: '',
  userId: ''
})

function getUserInfo() {
  if (user.value.org.length === 0) return

  const org = user.value.org[0]
  userInfo.value.org_id = Number(org.operatingId)
  userInfo.value.operatingName = org.operatingName
  userInfo.value.userId = org.userId
  userInfo.value.organization_id = org.organizationId
  formModel.invoice_header = org.operatingName
  search.office = org.operatingName
}

async function searchCustomerName(query: string) {
  if (!query || query === '') return
  await searchName(query)
}

async function searchName(query?: string) {
  loading.value = true
  try {
    const q = query ? `q=${query}&` : ''
    const data: any[] = await clientApi.instance.get(`/apis/v1/ms/oracle/customers?${q}limit=${1000}`).then((r: any) => r.data?.items)
    const dataOptions = data
      .map((item: any) => ({
        label: item.customer_name,
        value: item.account_number
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const seen = new Set()
    customerNumberOptions.value = [...dataOptions, ...customerNumberOptions.value].filter((opt) => {
      if (seen.has(opt.value)) return false
      seen.add(opt.value)
      return true
    })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function handleCustomerNumber(customerNumber: string) {
  const customer = customerNumberOptions.value.find((item: any) => item.value === customerNumber)
  if (!!customer) {
    customerInfo.value.customer_name = customer.label
  }
}

async function searchOrderNumber(orderNumber: string) {
  loading.value = true
  try {
    orderNumberOptions.value = []
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

async function searchPartNumber(query: string) {
  if (!query || query === '') return
  await searchPart(query)
}

async function searchPart(query?: string) {
  loading.value = true
  try {
    const q = query ? `q=${query}&` : ''
    const data = await clientApi.instance.get(`/apis/v1/ms/oracle/wcl-item-nos?${q}pageNum=1&pageSize=100&includeCustomer=false`).then((r: any) => r.data.items)
    if (!data?.length) return

    partNumberOptions.value = data.map((item: any) => ({
      label: item.wcl_item_no,
      value: item.wcl_item_no
    }))
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (!customerInfo.value.customer_name || customerInfo.value.customer_name === '') {
    ElMessage.error('Customer Name Cannot Be Empty')
    return
  }

  const orgId = search.office ? `orgId=${search.office}&` : ''
  const customerName = `customerName=${customerInfo.value.customer_name}&`
  const orderNumber = search.orderNumber ? `orderNumber=${search.orderNumber}&` : ''
  const partNum = search.partNumber ? `partNum=${search.partNumber}` : ''

  tableConfig.loading = true
  try {
    const data = await clientApi.instance
      .get(`/apis/v1/ms/wfl/proforma-invoices/candidate-lines?${orgId}${customerName}${orderNumber}${partNum}`)
      .then((r) => r.data.items)

    const map: dataItem[] = (data ?? []).map((item: any) => mapCandidateToDataItem(item))

    const selectedIds = new Set(selectedRowsList.value.map((item: any) => item.soLineId))
    tableData.value = map.filter((item: any) => !selectedIds.has(item.soLineId))
    reload()
  } catch (e) {
    console.log(e)
  } finally {
    tableConfig.loading = false
  }
}

function mapCandidateToDataItem(item: any, extra: Partial<dataItem> = {}): dataItem {
  return {
    id: uuidv7(),
    org_id: item.orgId,
    organization_id: item.organizationId,
    pi_number: item.pi_number ?? '',
    schedule_date: item.scheduleDate,
    order_number: item.orderNumber,
    order_ln: item.lineNum,
    order_qty: item.orderQty,
    part_number: item.partNum,
    currency: item.currencyCode,
    lineAmount: item.lineAmount ?? 0,
    taxValue: item.taxValue ?? 0,
    tax_code: item.taxCode,
    customer_number: item.customerNumber,
    customer_name: item.customerName,
    bill_to_location: item.billToAddress,
    ship_to_location: item.shipToAddress,
    sub_inventory: item.subinventory,
    soLineId: item.soLineId,
    deliveryDetailId: item.deliveryDetailId,
    companyTitle: item.companyTitle,
    warehouseLocation: item.warehouseLocation,
    ...extra
  }
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'proformaInvoiceBatch',
  api: () => {
    return tableData.value
  },
  columns: [
    {
      type: 'checkbox',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      field: 'pi_number',
      title: t('proformaInvoice.piNumber'),
      minWidth: 240
    },
    {
      field: 'schedule_date',
      title: t('proformaInvoice.scheduleDate'),
      minWidth: 200,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'order_number',
      title: t('proformaInvoice.orderNumber'),
      minWidth: 200
    },
    {
      field: 'order_ln',
      title: t('proformaInvoice.orderLn'),
      minWidth: 100
    },
    {
      field: 'order_qty',
      title: t('proformaInvoice.orderQty'),
      minWidth: 150
    },
    {
      field: 'part_number',
      title: t('proformaInvoice.wclPartNumber'),
      minWidth: 200
    },
    {
      field: 'currency',
      title: t('proformaInvoice.currency'),
      minWidth: 100
    },
    {
      field: 'lineAmount',
      title: t('proformaInvoice.lineAmount'),
      minWidth: 200
    },
    {
      field: 'tax_code',
      title: t('proformaInvoice.taxCode'),
      minWidth: 150
    },
    {
      field: 'customer_number',
      title: t('proformaInvoice.customerCode'),
      minWidth: 200
    },
    {
      field: 'customer_name',
      title: t('proformaInvoice.customerName'),
      minWidth: 200
    },
    {
      field: 'bill_to_location',
      title: t('proformaInvoice.billToLocation'),
      minWidth: 200
    },
    {
      field: 'ship_to_location',
      title: t('proformaInvoice.shipToLocation'),
      minWidth: 200
    },
    {
      field: 'grouping',
      title: t('proformaInvoice.grouping'),
      minWidth: 100,
      fixed: 'right',
      slots: { default: 'grouping' }
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
  },
  bodyActions: [
    [
      {
        code: 'Delete',
        name: t('common_delete'),
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
    return {
      visible: true,
      disabled: false
    }
  }
})

function handleDelete(row: any) {
  tableData.value = tableData.value.filter((item: any) => item.id !== row.id)
  reload()
}

function handleClearUnselected() {
  const selectedIds = new Set(selectedRowsList.value.map((item: any) => item.id))
  tableData.value = tableData.value.filter((item: any) => selectedIds.has(item.id))

  selectedRowsList.value = []
  reload()
}

const csvUploadRef = ref()
const CSV_TEMPLATE_MISMATCH = 'CSV_TEMPLATE_MISMATCH'

type CsvImportRow = {
  customer_number: string
  order_number: number
  line: number
  deliver_qty: number
  invoice_header: string
  invoice_date: string
  remark: string
  grouping: number
}

async function handleImportCSV(uploadFile: UploadFile) {
  const file = uploadFile.raw

  csvUploadRef.value?.clearFiles()
  if (!file) return

  const name = file.name.toLowerCase()

  if (!(name.endsWith('.csv') || file.type === 'text/csv')) {
    ElMessage.error(t('reschedulePlanDate.pleaseSelectCsv'))
    return
  }

  tableConfig.loading = true
  try {
    const list = await csvTextToLineItems(await file.text())

    if (!list.length) {
      ElMessage.error(t('reschedulePlanDate.noValidCsvData'))
      return
    }

    if (list.length > 100) {
      ElMessage.warning(t('proformaInvoice.csvMustBeLessThan', { length: 100 }))
      return
    }

    console.log(222, list)
    const data = await getOrderData(list)
    const map = dataMapping(list, data)
    // tableData.value = map
    reload()
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(CSV_TEMPLATE_MISMATCH)) {
      const detail = error.message.slice(CSV_TEMPLATE_MISMATCH.length + 1)
      ElMessage.error(detail ? `${t('reschedulePlanDate.csvTemplateMismatch')}: ${detail}` : t('reschedulePlanDate.csvTemplateMismatch'))
      return
    }
    console.error(error)
    ElMessage.error(t('reschedulePlanDate.noValidCsvData'))
  } finally {
    tableConfig.loading = false
  }
}

const CSV_COLUMNS = ['customer_number', 'order_number', 'line', 'deliver_qty', 'invoice_header', 'invoice_date', 'remark', 'grouping'] as const
async function csvTextToLineItems(text: string) {
  const rows = text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .map(parseCsvLine)
    .filter((row) => row.some((cell) => cell !== ''))
  if (!rows.length) return []
  console.log(123, rows[0])
  if (!isCsvTemplateHeader(rows[0])) {
    throw new Error(CSV_TEMPLATE_MISMATCH)
  }

  const columns = [...CSV_COLUMNS]
  const dataRows = rows.slice(1)

  return dataRows.map((row) => {
    const record: Record<string, string> = {}
    columns.forEach((col, i) => {
      record[col] = row[i] ?? ''
    })

    return {
      customer_number: record.customer_number ?? '',
      order_number: Number(record.order_number ?? 0),
      line: Number(record.line ?? 0),
      deliver_qty: Number(record.deliver_qty ?? 0),
      invoice_header: record.invoice_header ?? '',
      invoice_date: parsePlanDate(record.invoice_date ?? ''),
      remark: record.remark ?? '',
      grouping: Number(record.grouping ?? 1) || 1
    } as CsvImportRow
  })
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  result.push(current.trim())
  return result
}

const CSV_HEADER_COLUMNS = ['Customer Number', 'Order Number', 'Line', 'Deliver qty', 'InvoiceHeader', 'InvoiceDate', 'Remark', 'Grouping'] as const
function isCsvTemplateHeader(headerRow: string[]): boolean {
  const cells = trimTrailingEmpty(headerRow).map((cell) => cell.trim())
  if (cells.length !== CSV_HEADER_COLUMNS.length) return false
  return CSV_HEADER_COLUMNS.every((expected, i) => cells[i].toLowerCase() === expected.toLowerCase())
}

function trimTrailingEmpty(cells: string[]): string[] {
  const result = [...cells]
  while (result.length && result[result.length - 1] === '') result.pop()
  return result
}

function parsePlanDate(value: string): string {
  if (!value) return ''
  const parsed = dayjs(value.trim(), ['YYYYMMDD', 'YYYY-MMM-DD', 'YYYY-MM-DD', 'YYYY/MM/DD'], 'en', true)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

/**
 * 根據CSV的 Customer Number + Order Number + Line 重新查詢數據
 */
async function getOrderData(csvRows: CsvImportRow[]) {
  const list = csvRows.map((item: any) => ({
    customerNumber: item.customer_number,
    orderNumber: item.order_number,
    line: item.line
  }))

  const raw = {
    orgId: 'string',
    lines: list
  }
  const data = await clientApi.instance.post(`/wfl/proforma-invoices/enrich-lines`, raw).then((r) => r.data)
  console.log(123, data)
  return data
}

function dataMapping(csvList: CsvImportRow[], data: any[]) {
  return data.map((item: any) => {
    const csvItem = csvList.find((csv) => csv.order_number === item.order_number && csv.line === item.line)
    return {
      ...item,
      grouping: csvItem?.grouping
    }
  })
}

onMounted(async () => {
  getUserInfo()
  await searchName()
  await searchPart()
})

/**
 * 拆單
 * 規則：根據辦事處、客戶編號、貨幣、倉庫位置、子庫存、賬單地址、送貨地址、分組
 *
 */
function buildPreviewGroups() {
  const result = {}

  for (const row of selectedRowsList.value) {
    const key: string = String(row.grouping ?? '')
    if (key === '') continue

    if (!result[key]) {
      result[key] = {
        grouping: Number(key) || key,
        status: '',
        invoice_date: '',
        schedule_date: '',
        customer_code: row.customer_number,
        customer_name: row.customer_name,
        office: row.companyTitle,
        org_id: row.org_id,
        invoice_header: row.companyTitle ?? '',
        currency: row.currency ?? '',
        sub_total: 0,
        total_tax: 0,
        total_amount: 0,
        warehouseLocation: row.warehouseLocation ?? '',
        sub_inventory: row.sub_inventory ?? '',
        payment_in_adv: '',
        overdue_debt: '',
        bill_to_location: row.bill_to_location ?? '',
        ship_to_location: row.ship_to_location ?? '',
        pi_remarks: '',
        submitted_by: user,
        submitted_date: '',
        approver: '',
        approval_date: '',
        reject_reason: '',
        items: []
      }
    }

    result[key].items.push({
      schedule_date: row.schedule_date,
      order_ln: row.order_ln,
      order_number: row.order_number,
      wcl_part_number: row.part_number,
      order_qty: row.order_qty,
      lineAmount: row.lineAmount,
      tax_code: row.tax_code,
      status: '',
      // 分組一致性校驗字段（與 invoice header 對齊）
      office: row.org_id,
      customer_code: row.customer_number,
      currency: row.currency ?? '',
      warehouseLocation: row.warehouseLocation ?? '',
      sub_inventory: row.sub_inventory ?? '',
      bill_to_location: row.bill_to_location ?? '',
      ship_to_location: row.ship_to_location ?? ''
    })
  }

  return result
}

async function getFormData(needValidation = true) {
  if (!needValidation) return { ...formModel }

  if (selectedRowsList.value.length === 0) {
    ElMessage.error(t('proformaInvoice.selectAtLeastOneRow'))
    throw new Error('')
  }

  const groups: any = buildPreviewGroups()

  if (Object.keys(groups).length === 0) {
    ElMessage.error('Please Select Grouping')
    throw new Error('')
  }

  await proformaInvoicePreviewRef.value.open(groups)

  throw new Error('')
  // 循環啓動workflow

  return { ...formModel }
}

async function runWorkflow(cFormData: any) {
  try {
    const formParams = {
      start_user_id: user.value.userId,
      definition_id: `01a012c1-0cf9-7000-8963-66a213530ce3`, // Proforma Invoice Approval
      variables: {
        ...cFormData,
        __system__user_creator_id: user.value.userId,
        __system__user_creator_email: user.value.email
      }
    }

    const data = await clientApi.instance.post('/oniflow/api/v1/processes', formParams).then((r: any) => workflowResponseHelper(r))
  } catch (e) {
    console.log(e)
  }
}

defineExpose({ getFormData })
</script>

<template>
  <div class="info-item-card">
    <span style="font-size: 20px; color: #2354b8">{{ t('proformaInvoice.invoiceHeaderDetails') }}</span>
    <el-row>
      <el-col :span="4">
        <el-form-item :label="t('proformaInvoice.invoiceHeader')">
          <el-select v-model="formModel.invoice_header" style="width: 95%">
            <el-option v-for="item in invoiceHeaderOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item :label="t('proformaInvoice.generationDate')" style="width: 95%">
          <el-date-picker v-model="formModel.generation_date" type="date" format="YYYY/MMM/DD" value-format="YYYY-MM-DD" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
  <div class="info-item-card">
    <span style="font-size: 20px; color: #2354b8">{{ t('proformaInvoice.searchSoCriteria') }}</span>
    <el-row class="search-criteria-row" :gutter="12">
      <el-col :span="5">
        <el-form-item :label="t('proformaInvoice.office')">
          <el-select v-model="search.office" style="width: 100%">
            <el-option v-for="item in invoiceHeaderOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="5">
        <el-form-item :label="t('proformaInvoice.customerName')">
          <el-select-v2
            v-model="search.customer_number"
            filterable
            remote
            :remote-method="searchCustomerName"
            remote-show-suffix
            clearable
            :options="customerNumberOptions"
            :loading="loading"
            :placeholder="t('transferNoteApproval.selectAnOption')"
            @change="handleCustomerNumber"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="5">
        <el-form-item :label="t('proformaInvoice.orderNumber')">
          <el-select-v2
            v-model="search.orderNumber"
            filterable
            remote
            :remote-method="searchOrderNumber"
            remote-show-suffix
            clearable
            :options="orderNumberOptions"
            :loading="loading"
            :placeholder="t('transferNoteApproval.selectAnOption')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="5">
        <el-form-item :label="t('proformaInvoice.partNumber')">
          <el-select-v2
            v-model="search.partNumber"
            filterable
            remote
            :remote-method="searchPartNumber"
            remote-show-suffix
            clearable
            :options="partNumberOptions"
            :loading="loading"
            :placeholder="t('transferNoteApproval.selectAnOption')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="4">
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleSearch">{{ t('proformaInvoice.search') }}</el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </div>

  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="toolbar-selected">
          <div class="toolbar-selected__title">
            <span class="toolbar-selected__label">{{ t('proformaInvoice.preloadTable') }}</span>
            <span class="toolbar-selected__hint">{{ t('proformaInvoice.preloadHint') }}</span>
          </div>

          <div class="toolbar-selected-left">
            <span class="toolbar-selected-left__label">
              {{ t('proformaInvoice.rowsCount', { count: tableData.length }) }}
            </span>
            <span class="toolbar-selected-left-select">
              {{ t('proformaInvoice.selectedCount', { count: selectData.length }) }}
            </span>
            <el-button v-if="selectData.length > 0" type="danger" @click="handleClearUnselected">{{ t('proformaInvoice.clearUnselected') }}</el-button>
            <el-upload ref="csvUploadRef" accept=".csv" :auto-upload="false" :show-file-list="false" :on-change="handleImportCSV">
              <el-button>{{ t('proformaInvoice.uploadCsv') }}</el-button>
            </el-upload>
          </div>
        </div>
      </template>

      <template #grouping="{ row, index }">
        <el-select v-model="row.grouping" filterable>
          <el-option v-for="i in 100" :key="i" :label="i" :value="i" />
        </el-select>
      </template>
    </VxeGrid>
  </div>

  <LazyFormWidgetProformaInvoicePreview ref="proformaInvoicePreviewRef" />
</template>

<style scoped lang="scss">
.info-item-card {
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-s);
  margin-top: var(--app-space-s);
}

.search-criteria-row {
  align-items: flex-end;

  :deep(.el-form-item) {
    margin-bottom: 0;
    width: 100%;
  }
}

.table-container {
  min-height: 550px;
  max-height: 600px;
  overflow: auto;
}

.toolbar-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;

  &__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    min-width: 0;
  }

  &__label {
    font-size: 20px;
    color: #2354b8;
    white-space: nowrap;
  }

  &__hint {
    font-size: 20px;
    color: #ca322d;
  }

  &__form {
    margin-bottom: 0;
    flex-shrink: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 0;
    }
  }

  .toolbar-selected-left {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .toolbar-selected-left__label {
      font-size: 16px;
    }

    .toolbar-selected-left-select {
      margin-right: 10px;
      margin-left: 10px;
      font-size: 16px;
      color: #13c3ae;
    }
  }
}
</style>
