import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { newClientApi } from 'api'
import { SGLA, SGLA_TABLE_ID } from '../utils/variableMapping'

export interface WHASupplyListVerifyProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
}

export interface WHASupplyListVerifyContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  invoiceList: Ref<Record<string, any>[]>
  selectedInvoice: Ref<Record<string, any> | null>
  selectInvoice: (item: Record<string, any>) => void
  updateInvoiceStatus: (status: string) => Promise<void>
  docId: Ref<string>
}

export const WHASupplyListVerifyKey: InjectionKey<WHASupplyListVerifyContext> =
  Symbol('WHASupplyListVerify')

export function useWHASupplyListVerifyProvider(props: WHASupplyListVerifyProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const invoiceList = ref<Record<string, any>[]>([])
  const selectedInvoice = ref<Record<string, any> | null>(null)
  const docId = ref<string>('')

  function selectInvoice(item: Record<string, any>) {
    selectedInvoice.value = item
  }

  async function updateInvoiceStatus(status: string) {
    const invoiceId = selectedInvoice.value?.id
    const invoiceData = {
      [SGLA.Status]: status
    }
    await newClientApi.putDynamicDbTableTableidDataDataid(SGLA_TABLE_ID, invoiceId, {
      data: invoiceData
    })
    if (selectedInvoice.value) {
      selectedInvoice.value[SGLA.Status] = status
    }
  }

  const context: WHASupplyListVerifyContext = {
    docId,
    formData,
    taskDetail,
    invoiceList,
    selectedInvoice,
    selectInvoice,
    updateInvoiceStatus
  }

  provide(WHASupplyListVerifyKey, context)

  return context
}

export function useWHASupplyListVerifyInject(): WHASupplyListVerifyContext {
  const context = inject(WHASupplyListVerifyKey)
  if (!context) {
    throw new Error(
      'WHASupplyListVerify context not found. Make sure useWHASupplyListVerifyProvider is called in a parent component.'
    )
  }
  return context
}
