/** GIT Invoice line matched status — trailing period is required by API */
export const GIT_LINE_MATCHED_STATUS = 'Matched.'

export const GIT_INVOICE_LINE = {
  id: 'id',
  poNo: 'po_no',
  poLine: 'po_line',
  shipmentNum: 'shipment_num',
  vendorItemNo: 'vendor_item_no',
  wclItemNo: 'wcl_item_no',
  invItemId: 'inv_item_id',
  lineQty: 'line_qty',
  unitPrice: 'unit_price',
  lineAmount: 'line_amount',
  status: 'status',
  applyChanges: 'apply_changes',
  koaName: 'koaName',
  invoiceLineNum: 'invoice_line_num'
} as const

export const GIT_INVOICE_SEARCH_FIELDS = [
  GIT_INVOICE_LINE.poNo,
  GIT_INVOICE_LINE.vendorItemNo,
  GIT_INVOICE_LINE.wclItemNo,
  GIT_INVOICE_LINE.lineQty,
  GIT_INVOICE_LINE.unitPrice,
  GIT_INVOICE_LINE.lineAmount
] as const

export type GitInvoiceLineItem = {
  id?: string
  po_no?: string
  po_line?: number
  shipment_num?: number
  vendor_item_no?: string
  wcl_item_no?: string
  inv_item_id?: string
  line_qty?: number
  unit_price?: number
  line_amount?: number
  status?: string
  apply_changes?: string
  koaName?: string
  invoice_line_num?: string
  [key: string]: any
}

/** Invoice from API (batch DTO snake_case or GITInvoice camelCase) */
export type GitInvoice = {
  id: string
  items?: GitInvoiceLineItem[]
  /** Matched file from formData.file_list_info (UI only, not from API) */
  file?: Record<string, any> | null
  [key: string]: any
}

export function isGitLineMatched(row: Record<string, any> | null | undefined) {
  const status = String(row?.status ?? '').toLowerCase()
  return status === 'matched' || status === 'matched.'
}

export function getGitLineStatusCounts(list: Record<string, any>[]) {
  return {
    all: list.length,
    ok: list.filter((row) => isGitLineMatched(row)).length,
    unVerified: list.filter((row) => !isGitLineMatched(row)).length
  }
}

export function createEmptyGitInvoiceLine(): GitInvoiceLineItem {
  return {
    po_no: '',
    po_line: undefined,
    vendor_item_no: '',
    line_qty: undefined,
    unit_price: undefined,
    line_amount: undefined,
    status: undefined
  }
}
