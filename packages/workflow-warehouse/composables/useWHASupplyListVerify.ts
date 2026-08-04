import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { newClientApi } from 'api'
import { SGLA, SGLA_TABLE_ID } from '../utils/variableMapping'

export interface WHASupplyListVerifyProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
  disabled?: boolean
}

export interface WHASupplyListVerifyContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  invoiceList: Ref<Record<string, any>[]>
  disabled: Ref<boolean | undefined>
  selectedInvoice: Ref<Record<string, any> | null>
  selectInvoice: (item: Record<string, any>) => void
  /** 切换预览文件（tab），并同步选中对应发票 */
  updateInvoiceData: (value: string | number, key: keyof typeof SGLA) => Promise<any>
  docId: Ref<string>
}

export const WHASupplyListVerifyKey: InjectionKey<WHASupplyListVerifyContext> = Symbol('WHASupplyListVerify')

function resolveDocId(previewFileName: string, fileList: Record<string, any>[] = []): string {
  if (previewFileName == null || previewFileName === '') return ''
  const key = previewFileName.replace(/\.[^.]+$/, '')
  const matched = fileList.find((file) => String(file?.name ?? '') === key)
  return matched?.id ? String(matched.id) : ''
}

export function useWHASupplyListVerifyProvider(props: WHASupplyListVerifyProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const disabled = toRef(props, 'disabled')
  const invoiceList = ref<Record<string, any>[]>([])
  const selectedInvoice = ref<Record<string, any> | null>(null)
  const docId = ref<string>('')

  function selectInvoice(item: Record<string, any>) {
    selectedInvoice.value = item
    const nextDocId = resolveDocId(item?.[SGLA.Preview_File_Name], formData.value?.file_list_info)
    if (nextDocId && docId.value !== nextDocId) {
      docId.value = nextDocId
    }
  }

  async function updateInvoiceData(value: string | number, key: keyof typeof SGLA) {
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
    updateInvoiceData,
    disabled
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
