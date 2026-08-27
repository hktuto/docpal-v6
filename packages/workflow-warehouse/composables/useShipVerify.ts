import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { getFileDisplayName, resolveInvoiceFile } from '../utils/workflowHelper'

export type ShipInvoice = {
  id: string
  invoiceNum: string
  shipConfirmDate: string
  customerNo: string
  piAmount: string
  selfDelivery: string
  fileName: string
  fileId: string
  file?: Record<string, any> | null
  [key: string]: any
}

export interface ShipVerifyProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
  disabled?: boolean
}

export interface ShipVerifyContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  invoiceList: Ref<ShipInvoice[]>
  disabled: Ref<boolean | undefined>
  selectedInvoice: Ref<ShipInvoice | null>
  selectInvoice: (item: ShipInvoice) => void
  updateInvoiceData: (invoiceData: Record<string, any>) => void
}

export const ShipVerifyKey: InjectionKey<ShipVerifyContext> = Symbol('ShipVerify')

export const SHIP_DATE_FORMAT = 'YYYY-MM-DD'

function fileBaseName(file: Record<string, any> | null | undefined) {
  const name = getFileDisplayName(file)
  return name.replace(/\.[^.]+$/, '')
}

function formatPiAmount(value: unknown) {
  if (value == null || value === '') return ''
  const str = String(value).trim()
  if (str.startsWith('$')) return str
  const num = Number(str.replace(/,/g, ''))
  if (Number.isNaN(num)) return str
  return `$${num.toFixed(2)}`
}

function pickField(source: Record<string, any> | null | undefined, keys: string[]) {
  if (!source) return ''
  for (const key of keys) {
    const value = source[key]
    if (value != null && value !== '') return String(value)
  }
  return ''
}

function toShipInvoice(raw: Record<string, any>, fallback?: Record<string, any>, file?: Record<string, any> | null): ShipInvoice {
  const source = { ...fallback, ...raw }
  const resolvedFile = file ?? source.file ?? null
  const fileName = pickField(source, ['fileName', 'file_name']) || getFileDisplayName(resolvedFile)
  const fileId = pickField(source, ['fileId', 'file_id']) || (resolvedFile?.id != null ? String(resolvedFile.id) : '')
  return {
    id: String(source.id || fileId || pickField(source, ['invoiceNum', 'invoice_num', 'pi_invoice_num']) || fileName || crypto.randomUUID()),
    invoiceNum: pickField(source, ['invoiceNum', 'invoice_num', 'pi_invoice_num']) || fileBaseName(resolvedFile),
    shipConfirmDate: pickField(source, ['shipConfirmDate', 'ship_confirm_date']),
    customerNo: pickField(source, ['customerNo', 'customer_no', 'customer_number']),
    piAmount: formatPiAmount(pickField(source, ['piAmount', 'pi_amount'])),
    selfDelivery: pickField(source, ['selfDelivery', 'self_delivery']) || 'N',
    fileName,
    fileId,
    file: resolvedFile
  }
}

function loadInvoices(formData: Record<string, any>): ShipInvoice[] {
  const fileList: Record<string, any>[] = formData?.file_list_info || []
  const existing = formData?.invoice_list || formData?.ship_list
  if (Array.isArray(existing) && existing.length) {
    return existing.map((item: Record<string, any>) => {
      const invoice = toShipInvoice(item, formData)
      invoice.file = resolveInvoiceFile(invoice.fileName, fileList)
      if (invoice.file?.id != null) invoice.fileId = String(invoice.file.id)
      if (!invoice.fileName) invoice.fileName = getFileDisplayName(invoice.file)
      return invoice
    })
  }
  if (fileList.length) {
    return fileList.map((file) => toShipInvoice(file, fileList.length === 1 ? formData : undefined, file))
  }
  const hasHeader =
    pickField(formData, ['invoiceNum', 'invoice_num', 'pi_invoice_num', 'shipConfirmDate', 'ship_confirm_date', 'customerNo', 'customer_no', 'customer_number'])
  if (!hasHeader) return []
  return [toShipInvoice(formData)]
}

export function useShipVerifyProvider(props: ShipVerifyProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const disabled = toRef(props, 'disabled')
  const invoiceList = ref<ShipInvoice[]>([])
  const selectedInvoice = ref<ShipInvoice | null>(null)

  function selectInvoice(item: ShipInvoice) {
    const file = resolveInvoiceFile(item.fileName, formData.value?.file_list_info)
    item.file = file
    if (file?.id != null) item.fileId = String(file.id)
    const displayName = getFileDisplayName(file)
    if (displayName) item.fileName = displayName
    selectedInvoice.value = item
  }

  function updateInvoiceData(patch: Record<string, any>) {
    if (!selectedInvoice.value) return
    if (patch.piAmount != null) patch.piAmount = formatPiAmount(patch.piAmount)
    Object.assign(selectedInvoice.value, patch)
    const index = invoiceList.value.findIndex((item) => item.id === selectedInvoice.value?.id)
    if (index >= 0) Object.assign(invoiceList.value[index], patch)
  }

  function loadInvoiceList() {
    invoiceList.value = loadInvoices(formData.value || {})
    if (invoiceList.value.length > 0) {
      selectInvoice(invoiceList.value[0])
    } else {
      selectedInvoice.value = null
    }
  }

  const context: ShipVerifyContext = {
    formData,
    taskDetail,
    invoiceList,
    selectedInvoice,
    selectInvoice,
    updateInvoiceData,
    disabled
  }

  provide(ShipVerifyKey, context)

  onMounted(() => {
    loadInvoiceList()
  })

  watch(
    () => [formData.value?.file_list_info, formData.value?.invoice_list, formData.value?.ship_list],
    () => {
      if (invoiceList.value.length) return
      loadInvoiceList()
    }
  )

  return context
}

export function useShipVerifyInject(): ShipVerifyContext {
  const context = inject(ShipVerifyKey)
  if (!context) {
    throw new Error('ShipVerify context not found. Make sure useShipVerifyProvider is called in a parent component.')
  }
  return context
}
