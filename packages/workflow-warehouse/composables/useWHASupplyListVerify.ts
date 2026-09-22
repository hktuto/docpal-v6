import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { newClientApi } from 'api'
import { SGLA, SGLA_ITEMS, SGLA_TABLE_ID } from '../utils/variableMapping'
import { resolveWorkflowFile } from '../utils/workflowHelper'

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
  /** 更新当前选中发票字段 */
  updateInvoiceData: (invoiceData: Record<string, any>) => Promise<any>
  /** 根据明细表汇总 total_qty / Total_Ctn 到当前选中发票 */
  syncInvoiceTotals: (rows: Record<string, any>[]) => void
}

export const WHASupplyListVerifyKey: InjectionKey<WHASupplyListVerifyContext> = Symbol('WHASupplyListVerify')

export function useWHASupplyListVerifyProvider(props: WHASupplyListVerifyProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const disabled = toRef(props, 'disabled')
  const invoiceList = ref<Record<string, any>[]>([])
  const selectedInvoice = ref<Record<string, any> | null>(null)

  function selectInvoice(item: Record<string, any>) {
    selectedInvoice.value = item
    item.file = resolveWorkflowFile(item?.[SGLA.Preview_File_Name], formData.value?.file_list_info)
  }

  async function updateInvoiceData(invoiceData: Record<string, any>) {
    const invoiceId = selectedInvoice.value?.id
    const res = await newClientApi.putDynamicDbTableTableidDataDataid(SGLA_TABLE_ID, invoiceId, {
      data: invoiceData
    })
    if (selectedInvoice.value) {
      Object.assign(selectedInvoice.value, invoiceData)
    }
    return res
  }

  function syncInvoiceTotals(rows: Record<string, any>[]) {
    if (!selectedInvoice.value) return
    selectedInvoice.value.total_qty = rows.reduce((sum, row) => sum + (Number(row[SGLA_ITEMS.Qty]) || 0), 0)
    selectedInvoice.value[SGLA.Total_Ctn] = new Set(
      rows.map((row) => row[SGLA_ITEMS.Carton]).filter((v) => v != null && String(v).trim() !== '')
    ).size
  }

  const context: WHASupplyListVerifyContext = {
    formData,
    taskDetail,
    invoiceList,
    selectedInvoice,
    selectInvoice,
    updateInvoiceData,
    syncInvoiceTotals,
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
