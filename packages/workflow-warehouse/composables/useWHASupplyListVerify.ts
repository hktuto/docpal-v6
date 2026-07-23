import { computed, inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { newClientApi } from 'api'
import { SGLA, SGLA_TABLE_ID } from '../utils/variableMapping'

export interface WHASupplyListVerifyProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
}

/** 文件与 OCR 发票的映射项 */
export interface FileInvoiceMapItem {
  file: Record<string, any>
  ocr: Record<string, any>
  invoiceNum: string
}

export interface WHASupplyListVerifyContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  invoiceList: Ref<Record<string, any>[]>
  selectedInvoice: Ref<Record<string, any> | null>
  selectInvoice: (item: Record<string, any>) => void
  /** 切换预览文件（tab），并同步选中对应发票 */
  updateInvoiceData: (value: string, key: keyof typeof SGLA) => Promise<any>
  docId: Ref<string>
}

export const WHASupplyListVerifyKey: InjectionKey<WHASupplyListVerifyContext> = Symbol('WHASupplyListVerify')

/** 去掉文件名末尾扩展名，便于 name / DOC_NAME 对齐 */
function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

/** formData 字段可能是数组或 JSON 字符串 */
function parseList(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * 根据 file_list_info 与 ocr_result_data 构建 发票号 → 文件/OCR 映射。
 * 优先：file.name === stripExtension(ocr.header.DOC_NAME)
 * 回退：stripExtension(file.file_name) === ocr.header.INVOICE_NUM
 */
function buildFileInvoiceMap(fileList: Record<string, any>[] = [], ocrList: Record<string, any>[] = []): Record<string, FileInvoiceMapItem> {
  if (!fileList.length || !ocrList.length) return {}
  const ocrByDocName = new Map<string, Record<string, any>>()
  const ocrByInvoiceNum = new Map<string, Record<string, any>>()
  for (const ocr of ocrList) {
    const header = ocr?.header ?? ocr
    const docName = header?.DOC_NAME
    const invoiceNum = header?.INVOICE_NUM
    if (docName) ocrByDocName.set(stripExtension(String(docName)), ocr)
    if (invoiceNum) ocrByInvoiceNum.set(String(invoiceNum), ocr)
  }

  const byInvoiceNum: Record<string, FileInvoiceMapItem> = {}
  for (const file of fileList) {
    if (!file?.id) continue
    const ocr = (file.name && ocrByDocName.get(String(file.name))) || (file.file_name && ocrByInvoiceNum.get(stripExtension(String(file.file_name))))
    if (!ocr) continue
    const header = ocr?.header ?? ocr
    const invoiceNum = String(header?.INVOICE_NUM ?? '')
    if (!invoiceNum) continue
    byInvoiceNum[invoiceNum] = { file, ocr, invoiceNum }
  }
  return byInvoiceNum
}

export function useWHASupplyListVerifyProvider(props: WHASupplyListVerifyProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const invoiceList = ref<Record<string, any>[]>([])
  const selectedInvoice = ref<Record<string, any> | null>(null)
  const docId = ref<string>('')

  // formData 异步灌入，用 computed 保证映射始终跟最新数据同步
  const invoiceNumMap = computed(() => buildFileInvoiceMap(parseList(formData.value?.file_list_info), parseList(formData.value?.ocr_result_data)))

  /** 根据发票号找到对应文件 id */
  function getFileIdByInvoice(item: Record<string, any>): string {
    const invoiceNum = item?.[SGLA.Name]
    if (!invoiceNum) return ''
    return invoiceNumMap.value[String(invoiceNum)]?.file?.id ?? ''
  }
  function selectInvoice(item: Record<string, any>) {
    selectedInvoice.value = item
    const fileId = getFileIdByInvoice(item)
    if (fileId && docId.value !== fileId) {
      docId.value = fileId
    }
  }

  async function updateInvoiceData(value: string, key: keyof typeof SGLA) {
    const invoiceId = selectedInvoice.value?.id
    const invoiceData = {
      [SGLA[key]]: value
    }
    const res = await newClientApi.putDynamicDbTableTableidDataDataid(SGLA_TABLE_ID, invoiceId, {
      data: invoiceData
    })
    if (selectedInvoice.value) {
      selectedInvoice.value[SGLA[key]] = value
    }
    return res
  }

  const context: WHASupplyListVerifyContext = {
    docId,
    formData,
    taskDetail,
    invoiceList,
    selectedInvoice,
    selectInvoice,
    updateInvoiceData
  }

  provide(WHASupplyListVerifyKey, context)

  return context
}

export function useWHASupplyListVerifyInject(): WHASupplyListVerifyContext {
  const context = inject(WHASupplyListVerifyKey)
  if (!context) {
    throw new Error('WHASupplyListVerify context not found. Make sure useWHASupplyListVerifyProvider is called in a parent component.')
  }
  return context
}
