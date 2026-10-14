/** Customer PO header / line field keys — aligned with CustPOHeaderVO / CustPOLineVO */

export const CUST_PO = {
  id: 'id',
  batchNo: 'batch_no',
  custPoNum: 'cust_po_num',
  custNum: 'cust_num',
  custName: 'cust_name',
  currency: 'currency',
  taxedFlag: 'taxed_flag',
  status: 'status',
  previewFileName: 'preview_file_name',
  totalQty: 'total_qty',
  items: 'items'
} as const

export const CUST_PO_LINE = {
  id: 'id',
  headerId: 'header_id',
  lineNum: 'line_num',
  custPartNum: 'cust_part_num',
  partNum: 'part_num',
  quantity: 'quantity',
  unitPrice: 'unit_price',
  requestDate: 'request_date',
  piRemark: 'pi_remark',
  custPoNum: 'cust_po_num',
  description: 'description',
  checked: 'checked'
} as const

export const CUST_PO_SEARCH_FIELDS = [
  CUST_PO_LINE.lineNum,
  CUST_PO_LINE.custPartNum,
  CUST_PO_LINE.partNum,
  CUST_PO_LINE.quantity,
  CUST_PO_LINE.unitPrice,
  CUST_PO_LINE.requestDate,
  CUST_PO_LINE.piRemark,
  CUST_PO_LINE.custPoNum
] as const

export const CUST_PO_CURRENCY_OPTIONS = [
  { label: 'CNY', value: 'CNY' },
  { label: 'USD', value: 'USD' },
  { label: 'HKD', value: 'HKD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' }
]

export const CUST_PO_TAXED_OPTIONS = [
  { label: 'Y', value: 'Y' },
  { label: 'N', value: 'N' }
]

export type CustPoLine = {
  id?: string
  header_id?: string
  line_num?: number | null
  cust_part_num?: string
  part_num?: string
  quantity?: number | null
  unit_price?: number | null
  request_date?: string
  pi_remark?: string
  cust_po_num?: string
  description?: string
  checked?: boolean
  [key: string]: any
}

export type CustPoHeader = {
  id: string
  batch_no?: string
  cust_po_num?: string
  cust_num?: string
  cust_name?: string
  currency?: string
  taxed_flag?: string
  status?: string
  preview_file_name?: string
  total_qty?: number
  items?: CustPoLine[]
  /** Matched file from formData.file_list_info (UI only) */
  file?: Record<string, any> | null
  [key: string]: any
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyCustPoLine(headerId: string, extras: Partial<CustPoLine> = {}): CustPoLine {
  return {
    id: createId('po_line'),
    header_id: headerId,
    line_num: null,
    cust_part_num: '',
    part_num: '',
    quantity: null,
    unit_price: null,
    request_date: '',
    pi_remark: '',
    cust_po_num: '',
    description: '',
    checked: false,
    ...extras
  }
}

export function sumPoQuantity(items: CustPoLine[] = []) {
  return items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
}

export function isCustPoLineOk(row: Record<string, any> | null | undefined) {
  return !!row?.checked
}

/** Placeholder: load PO list from formData or return demo mock */
export async function fetchPoListByBatch(batchNo: string | undefined, formData: Record<string, any> = {}): Promise<CustPoHeader[]> {
  await Promise.resolve()
  const fromForm = formData.po_list ?? formData.cust_po_list
  if (Array.isArray(fromForm) && fromForm.length) {
    return fromForm.map((item: Record<string, any>, index: number) => normalizeHeader(item, batchNo, index))
  }
  return createMockPoList(batchNo, formData)
}

function normalizeHeader(item: Record<string, any>, batchNo: string | undefined, index: number): CustPoHeader {
  const id = String(item.id ?? createId(`po_${index}`))
  const items = Array.isArray(item.items)
    ? item.items.map((line: Record<string, any>, lineIndex: number) => normalizeLine(line, id, lineIndex))
    : []
  return {
    ...item,
    id,
    batch_no: item.batch_no ?? batchNo,
    cust_po_num: item.cust_po_num ?? '',
    cust_num: item.cust_num ?? '',
    cust_name: item.cust_name ?? '',
    currency: item.currency ?? 'CNY',
    taxed_flag: item.taxed_flag ?? 'N',
    status: item.status ?? 'created',
    preview_file_name: item.preview_file_name ?? item.file_name ?? '',
    items,
    total_qty: item.total_qty ?? sumPoQuantity(items)
  }
}

function normalizeLine(line: Record<string, any>, headerId: string, index: number): CustPoLine {
  return {
    ...createEmptyCustPoLine(headerId),
    ...line,
    id: String(line.id ?? createId(`po_line_${index}`)),
    header_id: line.header_id ?? headerId,
    checked: !!line.checked
  }
}

function createMockPoList(batchNo: string | undefined, formData: Record<string, any>): CustPoHeader[] {
  const fileName = formData?.file_list_info?.[0]?.file_name || formData?.file_list_info?.[0]?.name || 'PO20260901.pdf'
  const headerId = createId('po')
  const items: CustPoLine[] = [
    {
      id: createId('po_line'),
      header_id: headerId,
      line_num: 1,
      cust_part_num: 'ABC-PN-001-XZY-REV-A',
      part_num: 'WCL-12345-A',
      quantity: 15000,
      unit_price: 0.028991,
      request_date: '2026/Sep/15',
      pi_remark: '',
      cust_po_num: 'PO20260901',
      checked: false
    }
  ]
  return [
    {
      id: headerId,
      batch_no: batchNo,
      cust_po_num: 'PO20260901',
      cust_num: 'SZ-ABC-01',
      cust_name: 'ABC Company',
      currency: 'CNY',
      taxed_flag: 'N',
      status: 'created',
      preview_file_name: fileName,
      items,
      total_qty: sumPoQuantity(items)
    },
    {
      id: createId('po'),
      batch_no: batchNo,
      cust_po_num: 'PO20260902',
      cust_num: 'SZ-ABC-01',
      cust_name: 'ABC Company',
      currency: 'CNY',
      taxed_flag: 'N',
      status: 'created',
      preview_file_name: fileName,
      items: [],
      total_qty: 0
    }
  ]
}

/** Placeholder line CRUD — mutates in-memory header.items */
export async function fetchPoLines(header: CustPoHeader | null | undefined): Promise<CustPoLine[]> {
  await Promise.resolve()
  if (!header) return []
  return [...(header.items ?? [])]
}

export async function updatePoHeader(header: CustPoHeader, patch: Record<string, any>): Promise<CustPoHeader> {
  await Promise.resolve()
  Object.assign(header, patch)
  return header
}

export async function addPoLine(header: CustPoHeader, line: CustPoLine): Promise<CustPoLine> {
  await Promise.resolve()
  const next = {
    ...line,
    id: line.id || createId('po_line'),
    header_id: header.id,
    checked: !!line.checked
  }
  if (!header.items) header.items = []
  header.items.unshift(next)
  header.total_qty = sumPoQuantity(header.items)
  return next
}

export async function savePoLines(header: CustPoHeader, lines: CustPoLine[]): Promise<void> {
  await Promise.resolve()
  header.items = lines
  header.total_qty = sumPoQuantity(lines)
}

export async function deletePoLine(header: CustPoHeader, lineId: string): Promise<void> {
  await Promise.resolve()
  header.items = (header.items ?? []).filter((item) => item.id !== lineId)
  header.total_qty = sumPoQuantity(header.items)
}

/** Placeholder detect — always no issues for now */
export async function detectPoIssues(_header: CustPoHeader | null | undefined): Promise<any[]> {
  await Promise.resolve()
  return []
}
