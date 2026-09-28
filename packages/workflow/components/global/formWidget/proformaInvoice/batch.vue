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
  line_amount: number
  tax_code: string
  customer_number: string
  customer_name: string
  bill_to_location: string
  ship_to_location: string
  sub_inventory: string
  grouping?: number
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

  try {
    const data = await clientApi.instance
      .get(`/apis/v1/ms/wfl/proforma-invoices/candidate-lines?${orgId}${customerName}${orderNumber}${partNum}`)
      .then((r) => r.data.items)

    const map: dataItem[] = data.map((item: any) => {
      return {
        id: uuidv7(),
        org_id: item.orgId,
        organization_id: item.organizationId,
        pi_number: item.pi_number ?? '',
        schedule_date: item.scheduleDate,
        order_number: item.orderNumber,
        order_ln: item.soLineId,
        order_qty: item.orderQty,
        part_number: item.partNum,
        currency: item.currencyCode,
        line_amount: item.line_amount ?? 0,
        tax_code: item.taxCode,
        customer_number: item.customerNumber,
        customer_name: item.customerName,
        bill_to_location: item.billToAddress,
        ship_to_location: item.shipToAddress,
        sub_inventory: item.subinventory
      } as dataItem
    })

    tableData.value = [...tableData.value, ...map]
    reload()
  } catch (e) {
    console.log(e)
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
      minWidth: 240,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'order_number',
      title: t('proformaInvoice.orderNumber'),
      minWidth: 240
    },
    {
      field: 'order_ln',
      title: t('proformaInvoice.orderLn'),
      minWidth: 240
    },
    {
      field: 'order_qty',
      title: t('proformaInvoice.orderQty'),
      minWidth: 240
    },
    {
      field: 'part_number',
      title: t('proformaInvoice.wclPartNumber'),
      minWidth: 240
    },
    {
      field: 'currency',
      title: t('proformaInvoice.currency'),
      minWidth: 240
    },
    {
      field: 'line_amount',
      title: t('proformaInvoice.lineAmount'),
      minWidth: 240
    },
    {
      field: 'tax_code',
      title: t('proformaInvoice.taxCode'),
      minWidth: 240
    },
    {
      field: 'customer_number',
      title: t('proformaInvoice.customerCode'),
      minWidth: 240
    },
    {
      field: 'customer_name',
      title: t('proformaInvoice.customerName'),
      minWidth: 240
    },
    {
      field: 'bill_to_location',
      title: t('proformaInvoice.billToLocation'),
      minWidth: 240
    },
    {
      field: 'ship_to_location',
      title: t('proformaInvoice.shipToLocation'),
      minWidth: 240
    },
    {
      field: 'grouping',
      title: t('proformaInvoice.grouping'),
      minWidth: 240,
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
  tableData.value = tableData.value.filter((item: any) => !selectedRowsList.value.includes(item.id))
  reload()
}

const csvUploadRef = ref()
const CSV_TEMPLATE_MISMATCH = 'CSV_TEMPLATE_MISMATCH'
async function handleImportCSV(uploadFile: UploadFile) {
  const file = uploadFile.raw

  if (!search.customer_number || search.customer_number == '') {
    ElMessage.error(t('proformaInvoice.pleaseSelectCustomer'))
    return
  }

  csvUploadRef.value?.clearFiles()
  if (!file) return

  const name = file.name.toLowerCase()

  if (!(name.endsWith('.csv') || file.type === 'text/csv')) {
    ElMessage.error(t('reschedulePlanDate.pleaseSelectCsv'))
    return
  }
  let list: any[]
  tableConfig.loading = true

  try {
    list = await csvTextToLineItems(await file.text())
  } catch (error) {
    tableConfig.loading = false
    if (error instanceof Error && error.message === CSV_TEMPLATE_MISMATCH) {
      ElMessage.error(t('reschedulePlanDate.csvTemplateMismatch'))
      return
    }
    throw error
  }

  if (!list.length) {
    tableConfig.loading = false
    ElMessage.error(t('reschedulePlanDate.noValidCsvData'))
    return
  }

  if (list.length > 100) {
    tableConfig.loading = false
    ElMessage.warning(t('proformaInvoice.csvMustBeLessThan', { length: 100 }))
    return
  }

  tableData.value = [...tableData.value, ...list]
  ElMessage.success(t('reschedulePlanDate.rowsImported', { count: list.length }))
  reload()
  tableConfig.loading = false
}

const CSV_COLUMNS = ['customer_number', 'order_number', 'line', 'deliver_qty', 'invoice_header', 'invoice_date', 'remark', 'grouping'] as const
async function csvTextToLineItems(text: string): Promise<any[]> {
  const rows = text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .map(parseCsvLine)
    .filter((row) => row.some((cell) => cell !== ''))
  if (!rows.length) return []
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
      id: uuidv7(),
      customer_number: record.customer_number ?? '',
      order_number: Number(record.order_number ?? 0),
      line: Number(record.line ?? 0),
      deliver_qty: Number(record.deliver_qty ?? 0),
      invoice_header: record.invoice_header ?? 'SZ',
      invoice_date: parsePlanDate(record.invoice_date ?? ''),
      remark: record.remark ?? '',
      grouping: record.grouping ?? 1
    }
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

onMounted(async () => {
  getUserInfo()
  await searchName()
  await searchPart()
})

/**
 * 根據CSV的 order number 與 line 重新查詢數據。以數據庫的數據爲準
 */
async function getOrderData() {
  console.log()
}

/**
 * 拆單
 * 規則：根據辦事處、客戶編號、貨幣、倉庫位置、子庫存、賬單地址、送貨地址、分組
 *
 */
function buildPreviewGroups() {
  return selectedRowsList.value
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([grouping, items]) => {
      const first = items[0] ?? {}
      const subTotal = items.reduce((sum, row) => sum + Number(row.line_amount ?? 0), 0)
      return {
        grouping,
        pi_number: '',
        status: '',
        invoice_date: '',
        schedule_date: '',
        customer_code: first.customer_number ?? search.value.customer_number ?? '',
        customer_name: first.customer_name ?? customerInfo.value.customer_name ?? '',
        office: search.office || formModel.invoice_header,
        invoice_header: first.invoice_header || formModel.invoice_header,
        currency: first.currency ?? '',
        sub_total: subTotal,
        total_tax: 0,
        total_amount: subTotal,
        warehouse_location: first.warehouse_location ?? '',
        sub_inventory: first.sub_inventory ?? '',
        payment_in_adv: first.payment_in_adv ?? first.cod ?? '',
        overdue_debt: first.overdue_debt ?? '',
        pi_remarks: first.remark ?? '',
        items
      }
    })
}

async function getFormData(needValidation = true) {
  if (!needValidation) return { ...formModel }

  await proformaInvoicePreviewRef.value.open(buildPreviewGroups())

  if (selectedRowsList.value.length === 0) {
    ElMessage.error(t('proformaInvoice.selectAtLeastOneRow'))
    throw new Error('')
  }

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
            :remote-method="searchName"
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
            :remote-method="searchPart"
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
            <span class="toolbar-selected-left__label">{{ t('proformaInvoice.rowsCount', { count: selectData.length }) }}</span>
            <span class="toolbar-selected-left-select">{{ t('proformaInvoice.selectedCount', { count: tableData.length }) }}</span>
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

  margin-block-end: 20px;
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
