import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { newClientApi } from 'api'
import { SGLA, SGLA_TABLE_ID } from '../utils/variableMapping'

export interface WHAReceivingVerificationProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
}

export interface WHAReceivingVerificationContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  invoiceList: Ref<Record<string, any>[]>
  selectedInvoice: Ref<Record<string, any> | null>
  selectInvoice: (item: Record<string, any>) => void
  updateInvoiceStatus: (status: string) => Promise<void>
}

export const WHAReceivingVerificationKey: InjectionKey<WHAReceivingVerificationContext> =
  Symbol('WHAReceivingVerification')

export function useWHAReceivingVerificationProvider(props: WHAReceivingVerificationProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const invoiceList = ref<Record<string, any>[]>([])
  const selectedInvoice = ref<Record<string, any> | null>(null)

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

  const context: WHAReceivingVerificationContext = {
    formData,
    taskDetail,
    invoiceList,
    selectedInvoice,
    selectInvoice,
    updateInvoiceStatus
  }

  provide(WHAReceivingVerificationKey, context)

  return context
}

export function useWHAReceivingVerificationInject(): WHAReceivingVerificationContext {
  const context = inject(WHAReceivingVerificationKey)
  if (!context) {
    throw new Error(
      'WHAReceivingVerification context not found. Make sure useWHAReceivingVerificationProvider is called in a parent component.'
    )
  }
  return context
}
