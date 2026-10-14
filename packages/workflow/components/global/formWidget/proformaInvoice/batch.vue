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
  index: number
  orgId: string
  organizationId: string
  pi_number?: string
  scheduleDate: string
  orderNumber: number
  orderQty: number
  partNum: string
  currencyCode: string
  lineAmount: number
  taxValue: number
  taxCode: string
  customerNumber: string
  customerName: string
  billToAddress: string
  shipToAddress: string
  subinventory: string
  grouping?: number
  soLineId: number
  deliveryDetailId: number
  companyTitle: string
  warehouseLocation: string
  customerId: number
  initialPickupLocationId: number
  ultimateDropoffLocationId: number
  freightTermsCode: string
  lineNum: string
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
  customer_name: ''
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
  organizationId: number
  operatingName: string
  userId: string
}>({
  org_id: 0,
  organizationId: 0,
  operatingName: '',
  userId: ''
})

function getUserInfo() {
  if (user.value.org.length === 0) return

  const org = user.value.org[0]
  userInfo.value.org_id = Number(org.operatingId)
  userInfo.value.operatingName = org.operatingName
  userInfo.value.userId = user.value.userId
  userInfo.value.organizationId = org.organizationId
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

    const map: dataItem[] = (data ?? []).map((item: any, index: number) => mapCandidateToDataItem(item, index))

    const selectedIds = new Set(selectedRowsList.value.map((item) => item.soLineId))
    const incoming = map.filter((item) => !selectedIds.has(item.soLineId))
    const selectedRows = selectedRowsList.value
    tableData.value = [...selectedRows, ...incoming].map((item: any, index: number) => ({
      ...item,
      index: index + 1
    }))
    await reload()
    await nextTick()
    if (selectedRows.length) {
      tableRef.value?.setCheckboxRow(selectedRows, true)
    }
  } catch (e) {
    console.log(e)
  } finally {
    tableConfig.loading = false
  }
}

function mapCandidateToDataItem(item: any, index: number, extra: Partial<dataItem> = {}): dataItem {
  return {
    id: uuidv7(),
    index: index + 1,
    orgId: item.orgId,
    organizationId: item.organizationId,
    pi_number: item.pi_number ?? '',
    scheduleDate: item.scheduleDate,
    orderNumber: item.orderNumber,
    orderQty: item.orderQty,
    partNum: item.partNum,
    currencyCode: item.currencyCode,
    lineAmount: item.lineAmount ?? 0,
    taxValue: item.taxValue ?? 0,
    taxCode: item.taxCode,
    customerNumber: item.customerNumber,
    customerName: item.customerName,
    billToAddress: item.billToAddress,
    shipToAddress: item.shipToAddress,
    subinventory: item.subinventory,
    soLineId: item.soLineId,
    deliveryDetailId: item.deliveryDetailId,
    companyTitle: item.companyTitle,
    warehouseLocation: item.warehouseLocation,
    customerId: item.customerId,
    initialPickupLocationId: item.initialPickupLocationId,
    ultimateDropoffLocationId: item.ultimateDropoffLocationId,
    freightTermsCode: item.freightTermsCode,
    lineNum: String(item.lineNum),
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
      field: 'index',
      title: t('transferNoteApproval.index'),
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 60
    },
    {
      field: 'pi_number',
      title: t('proformaInvoice.piNumber'),
      minWidth: 240
    },
    {
      field: 'scheduleDate',
      title: t('proformaInvoice.scheduleDate'),
      minWidth: 200,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'orderNumber',
      title: t('proformaInvoice.orderNumber'),
      minWidth: 200
    },
    {
      field: 'lineNum',
      title: t('proformaInvoice.orderLn'),
      minWidth: 100
    },
    {
      field: 'orderQty',
      title: t('proformaInvoice.orderQty'),
      minWidth: 150
    },
    {
      field: 'partNum',
      title: t('proformaInvoice.wclPartNumber'),
      minWidth: 200
    },
    {
      field: 'currencyCode',
      title: t('proformaInvoice.currency'),
      minWidth: 100
    },
    {
      field: 'lineAmount',
      title: t('proformaInvoice.lineAmount'),
      minWidth: 200
    },
    {
      field: 'taxCode',
      title: t('proformaInvoice.taxCode'),
      minWidth: 150
    },
    {
      field: 'customerNumber',
      title: t('proformaInvoice.customerCode'),
      minWidth: 200
    },
    {
      field: 'customerName',
      title: t('proformaInvoice.customerName'),
      minWidth: 200
    },
    {
      field: 'billToAddress',
      title: t('proformaInvoice.billToLocation'),
      minWidth: 200
    },
    {
      field: 'shipToAddress',
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

async function handleClearUnselected() {
  const selectedIds = new Set(selectedRowsList.value.map((item: any) => item.id))
  tableData.value = tableData.value.filter((item: any) => selectedIds.has(item.id))
  await reload()
  await nextTick()
  tableRef.value?.setCheckboxRow(selectedRowsList.value, true)
}

const csvUploadRef = ref()
const CSV_TEMPLATE_MISMATCH = 'CSV_TEMPLATE_MISMATCH'

type CsvImportRow = {
  customer_number: string
  order_number: number
  line: string
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

    console.log(11, list)
    const data = await getOrderData(list)
    console.log(22, data)
    tableData.value = dataMapping(list, data)
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
      line: String(record.line ?? ''),
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
    line: item.lineNum,
    grouping: item.grouping
  }))

  const raw = {
    orgId: userInfo.value.operatingName,
    lines: list
  }
  try {
    const data = await clientApi.instance.post(`/apis/v1/ms/wfl/proforma-invoices/enrich-lines`, raw).then((r: any) => r.data)
    return data.rows
  } catch (e) {
    console.log(e)
  }
}

function dataMapping(csvList: CsvImportRow[], data: any[]) {
  return data.map((item: any, index: number) => {
    const csvItem = csvList.find((csv) => csv.order_number === item.order_number && csv.line === item.line)
    return mapCandidateToDataItem(item, index, { grouping: csvItem?.grouping })
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
 */
function buildPreviewGroups(checkData: any) {
  const groupMap = new Map<string, any>()

  for (const row of selectedRowsList.value) {
    const grouping = String(row.grouping ?? '').trim()
    if (!grouping) continue

    let group = groupMap.get(grouping)
    if (!group) {
      group = {
        grouping: row.grouping,
        status: '',
        invoice_date: '',
        scheduleDate: row.scheduleDate,
        customerNumber: row.customerNumber,
        customerName: row.customerName,
        companyTitle: row.companyTitle,
        office: row.companyTitle,
        orgId: row.orgId,
        invoice_header: row.companyTitle ?? '',
        currencyCode: row.currencyCode ?? '',
        sub_total: 0,
        total_tax: 0,
        total_amount: 0,
        warehouseLocation: row.warehouseLocation ?? '',
        subinventory: row.subinventory ?? '',
        payment_in_adv: '',
        overdue_debt: '',
        billToAddress: row.billToAddress ?? '',
        shipToAddress: row.shipToAddress ?? '',
        pi_remarks: '',
        submitted_by: userInfo.value.userId,
        submitted_date: '',
        approver: '',
        approval_date: '',
        reject_reason: '',
        items: [],
        customerId: row.customerId,
        organizationId: row.organizationId,
        initialPickupLocationId: row.initialPickupLocationId,
        ultimateDropoffLocationId: row.ultimateDropoffLocationId,
        freightTermsCode: row.freightTermsCode
      }
      groupMap.set(grouping, group)
    }

    group.items.push({
      soLineId: row.soLineId,
      deliveryDetailId: row.deliveryDetailId,
      orderNumber: row.orderNumber,
      lineNum: row.lineNum,
      subinventory: row.subinventory ?? '',
      grouping: row.grouping,
      customerId: row.customerId,
      orgId: row.orgId,
      organizationId: row.organizationId,
      scheduleDate: row.scheduleDate,
      currencyCode: row.currencyCode ?? '',
      taxCode: row.taxCode,
      taxValue: row.taxValue,
      lineAmount: row.lineAmount,
      customerNumber: row.customerNumber,
      customerName: row.customerName,
      billToAddress: row.billToAddress ?? '',
      shipToAddress: row.shipToAddress ?? '',
      initialPickupLocationId: row.initialPickupLocationId,
      ultimateDropoffLocationId: row.ultimateDropoffLocationId,
      companyTitle: row.companyTitle,
      warehouseLocation: row.warehouseLocation,
      freightTermsCode: row.freightTermsCode,
      partNum: row.partNum,
      orderQty: row.orderQty
    })
  }

  return Array.from(groupMap.values()).map((item) => {
    const { subTotal, totalTax } = item.items.reduce(
      (acc: { subTotal: Decimal; totalTax: Decimal }, curr: any, index: number) => {
        curr.lineNo = index + 1

        return {
          subTotal: acc.subTotal.plus(curr.lineAmount || 0),
          totalTax: acc.totalTax.plus(curr.taxValue || 0)
        }
      },
      { subTotal: new Decimal(0), totalTax: new Decimal(0) }
    )

    return {
      ...item,
      sub_total: subTotal.toNumber(),
      total_tax: totalTax.toNumber(),
      total_amount: subTotal.plus(totalTax).toNumber(),
      ...checkData[item.grouping]
    }
  })
}

async function checkGroupsData() {
  const lines = selectedRowsList.value.map((item: any, index: number) => {
    return {
      lineNo: index,
      organizationId: item.organizationId,
      soLineId: item.soLineId,
      deliveryDetailId: item.deliveryDetailId,
      orderNumber: item.order_number,
      lineNum: item.lineNum,
      partNum: item.partNum,
      orderQty: item.orderQty,
      subinventory: item.subinventory,
      grouping: item.grouping,
      customerId: item.customerId,
      customerName: item.customerName,
      companyTitle: item.companyTitle,
      warehouseLocation: item.warehouseLocation
    }
  })

  const raw = {
    orgId: userInfo.value.operatingName,
    customerName: lines[0].customerName,
    organizationId: lines[0].organizationId,
    lines: lines
  }
  const data = await clientApi.instance.post(`/apis/v1/ms/wfl/proforma-invoices/validate`, raw).then((r) => r.data)

  if (!!data.items) {
    const map = data.items.reduce((acc: any, item: any) => {
      const result: boolean = item.result === 'success'
      const errorList: string[] = []
      let requiredApproval = false
      let payment_in_adv = 'N'
      let overdue_debt = 'N'
      let is_lineOccupied = false
      let is_piVsSo = false
      let is_stock = false

      if (!result) {
        const creditOrCod = item.checks.credit_or_cod
        const line_occupied = item.checks.line_occupied
        const pi_vs_so = item.checks.pi_vs_so
        const stock = item.checks.stock

        // 货到付款 COD / 预付款 Payment in Adv = Y
        if (creditOrCod.codOk !== null && !creditOrCod.codOk) {
          payment_in_adv = 'Y'
          requiredApproval = true
          errorList.push(`Customer Name: ${creditOrCod.customerName} Overdraft: ${creditOrCod.debtAmount}, `)
        }
        // 欠款
        if (creditOrCod.debtOk !== null && !creditOrCod.debtOk) {
          overdue_debt = 'Y'
          requiredApproval = true
          errorList.push(`Customer Name: ${creditOrCod.customerName} Overdraft: ${creditOrCod.debtAmount}, `)
        }
        if (line_occupied.ok !== null && !line_occupied.ok) {
          const line_occupiedMap = line_occupied.lines.map((line_occupiedItem: any) => {
            return `Part Number: ${line_occupiedItem.partNum}`
          })
          is_lineOccupied = true
          errorList.push(line_occupiedMap.join(', '))
        }
        if (pi_vs_so.ok !== null && !pi_vs_so.ok) {
          const pi_vs_soMap = pi_vs_so.lines.map((pi_vs_soItem: any) => {
            return `Part Number: ${pi_vs_soItem.partNum} PI and SO data are inconsistent`
          })
          is_piVsSo = true
          errorList.push(pi_vs_soMap.join(', '))
        }
        if (stock.ok !== null && !stock.ok) {
          const stockMap = stock.lines.map((stockItem: any) => {
            return `Part Number: ${stockItem.partNum} Required quantity: ${stockItem.orderQty} - Inventory quantity: ${stockItem.onhand}`
          })
          is_stock = true
          errorList.push(stockMap.join(', '))
        }
      }

      acc[item.groupingKey] = {
        result: result,
        checks: item.checks,
        error: errorList.join('; '),
        requiredApproval,
        payment_in_adv,
        overdue_debt,
        is_lineOccupied,
        is_piVsSo,
        is_stock
      }
      return acc
    }, {})
    return map
  }
}

const fieldsToCheck = ['orgId', 'customerNumber', 'currencyCode', 'warehouseLocation', 'subinventory', 'billToAddress', 'shipToAddress']
function handleCheckLineGrouping(row: dataItem) {
  const groupItems = tableData.value.filter((item) => item.grouping === row.grouping)
  if (groupItems.length <= 1) return

  const firstItem = groupItems[0]!
  const indexList = []
  for (let i = 1; i < groupItems.length; i++) {
    const currentItem = groupItems[i]
    for (const field of fieldsToCheck) {
      if (currentItem[field] !== firstItem[field]) {
        indexList.push(currentItem.index)
      }
    }
  }

  if (indexList.length === 0) return
  ElMessage.error(t('proformaInvoice.groupingFieldsInconsistent', { grouping: row.grouping }))
}

/**
 * 校驗同一分組內關鍵字段是否一致
 */
function checkGrouping(groups: any) {
  return groups
    .filter((group: any) => {
      const items = group.items
      if (items.length <= 1) return false
      return !items.every((item: any) => fieldsToCheck.every((key) => item[key] === items[0][key]))
    })
    .map((group: any) => group.grouping)
}

async function getFormData(needValidation = true) {
  if (!needValidation) return { ...formModel }

  if (selectedRowsList.value.length === 0) {
    ElMessage.error(t('proformaInvoice.selectAtLeastOneRow'))
    throw new Error('')
  }
  const checkData = await checkGroupsData()
  const groups: any = buildPreviewGroups(checkData)
  if (Object.keys(groups).length === 0) {
    ElMessage.error('Please Select Grouping')
    throw new Error('')
  }
  console.log(111, groups)

  // 檢查全部組
  const errorGrouping = checkGrouping(groups)
  if (errorGrouping.length > 0) {
    ElMessage.error(
      t('proformaInvoice.groupingFieldsInconsistent', {
        grouping: errorGrouping.join(',')
      })
    )
    throw new Error('')
  }

  await proformaInvoicePreviewRef.value.open(groups)

  // 循環啓動workflow
  try {
    Object.values(groups).forEach((item: any) => {
      const json = {
        status: 'Pending for Approval',
        invoice_date: '',
        scheduleDate: item.scheduleDate,
        customerNumber: item.customerNumber,
        customerName: item.customerName,
        office: item.office,
        invoice_header: item.invoice_header,
        currencyCode: item.currencyCode,
        sub_total: item.sub_total,
        total_tax: item.total_tax,
        total_amount: item.total_amount,
        warehouse_location: item.warehouseLocation,
        subinventory: item.subinventory,
        payment_in_adv: item.payment_in_adv,
        overdue_debt: item.overdue_debt,
        pi_remarks: item.pi_remarks,
        submitted_by: item.submitted_by,
        submitted_date: dayjs().format('YYYY-MM-DD'),
        lines: item.items,

        orgId: String(item.orgId),
        companyTitle: item.companyTitle,
        customerId: item.customerId,
        organizationId: item.organizationId,
        initialPickupLocationId: item.initialPickupLocationId,
        ultimateDropoffLocationId: item.ultimateDropoffLocationId,
        freightTermsCode: item.freightTermsCode,
        operatorId: '',
        operatorName: userInfo.value.userId,
        requiredApproval: item.requiredApproval
      }
      console.log(2222, json)
      // runWorkflow(json)
    })
    return {}
  } catch (e) {
    console.log(e)
    throw new Error('Batch Create Error')
  }
}

async function runWorkflow(cFormData: any) {
  try {
    const formParams = {
      start_user_id: user.value.userId,
      definition_id: `01a012c1-0cf9-7000-8963-66a213530ce3`, // Proforma Invoice Approval
      variables: {
        ...cFormData,
        __system__user_creator_id: user.value.userId,
        __system__user_creator_name: `${user.value.lastName} ${user.value.firstName}`,
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
        <el-select v-model="row.grouping" filterable @change="handleCheckLineGrouping(row)">
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
  min-height: 480px;
  max-height: 480px;
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
