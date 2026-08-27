import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { newClientApi } from 'api'
import type { WHASupplyListVerifyProps } from './useWHASupplyListVerify'
import { type GitInvoice, type GitInvoiceLineItem } from '../utils/gitInvoice'
import { getFileDisplayName, resolveInvoiceFile } from '../utils/workflowHelper'

export type InvoiceVerifyProps = WHASupplyListVerifyProps

export interface InvoiceVerifyContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  invoiceList: Ref<GitInvoice[]>
  disabled: Ref<boolean | undefined>
  selectedInvoice: Ref<GitInvoice | null>
  selectInvoice: (item: GitInvoice) => Promise<void>
  /** Patch header fields on selected invoice and persist via update */
  updateInvoiceData: (invoiceData: Record<string, any>, items?: GitInvoiceLineItem[]) => Promise<any>
  refreshSelectedInvoice: () => Promise<void>
  runMatching: () => Promise<GitInvoice | null>
  fetchGroupId: (items: GitInvoiceLineItem[]) => Promise<string | null>
}

export const InvoiceVerifyKey: InjectionKey<InvoiceVerifyContext> = Symbol('InvoiceVerify')

export function useInvoiceVerifyProvider(props: InvoiceVerifyProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const disabled = toRef(props, 'disabled')
  const invoiceList = ref<GitInvoice[]>([])
  const selectedInvoice = ref<GitInvoice | null>(null)

  async function selectInvoice(item: GitInvoice) {
    selectedInvoice.value = item
    try {
      const res = await newClientApi.getWmsGitInvoiceId(item.id)
      if (res?.data?.id) {
        selectedInvoice.value = res.data as GitInvoice
      }
    } catch (error) {
      console.error(error)
    }

    const invoice = selectedInvoice.value
    if (!invoice) return
    const file = resolveInvoiceFile(invoice.fileName ?? invoice.file_name, formData.value?.file_list_info)
    invoice.file = file
    if (file?.id != null) {
      invoice.fileId = String(file.id)
    }
    const displayName = getFileDisplayName(file)
    if (displayName) invoice.fileName = displayName
  }

  async function updateInvoiceData(patch: Record<string, any>, items?: GitInvoiceLineItem[]) {
    if (!selectedInvoice.value?.id) return { result: false }
    Object.assign(selectedInvoice.value, patch)
    const payload: Record<string, any> = { id: selectedInvoice.value.id, ...patch }
    if (items !== undefined) {
      payload.items = items
    }
    const res = await newClientApi.postWmsGitInvoiceUpdate(payload)
    if (res?.data?.id) {
      const prevItems = selectedInvoice.value.items
      Object.assign(selectedInvoice.value, res.data)
      if (!res.data.items?.length && prevItems?.length) {
        selectedInvoice.value.items = prevItems
      }
    }
    return res
  }

  async function refreshSelectedInvoice() {
    const id = selectedInvoice.value?.id
    if (!id) return
    const res = await newClientApi.getWmsGitInvoiceId(id)
    if (res?.data?.id) {
      Object.assign(selectedInvoice.value!, res.data)
    }
  }

  async function runMatching() {
    const id = selectedInvoice.value?.id
    if (!id) return null
    const res = await newClientApi.postWmsGitInvoiceMatching({ id })
    const invoice = res?.data as GitInvoice | undefined
    if (invoice?.id && selectedInvoice.value) {
      Object.assign(selectedInvoice.value, invoice)
    }
    return invoice ?? null
  }

  async function fetchGroupId(_items: GitInvoiceLineItem[]) {
    const id = selectedInvoice.value?.id
    if (!id) return null
    const res = await newClientApi.postWmsGitInvoiceGroupId({ id })
    const groupId = res?.data ? String(res.data) : null
    if (groupId && selectedInvoice.value) {
      selectedInvoice.value.groupId = groupId
      selectedInvoice.value.gitStatus = selectedInvoice.value.gitStatus || 'SUBMITTED'
    }
    return groupId
  }

  async function loadInvoiceList() {
    const batchNo = formData.value?.batchNo ?? formData.value?.batch_no
    if (!batchNo) {
      invoiceList.value = []
      selectedInvoice.value = null
      return
    }
    try {
      const res = await newClientApi.getWmsGitInvoiceBatchNoBatchno(String(batchNo))
      invoiceList.value = ((res?.data ?? []) as GitInvoice[]).filter((item) => !!item?.id)
      if (invoiceList.value.length > 0) {
        await selectInvoice(invoiceList.value[0])
      }
    } catch (error) {
      console.error(error)
      invoiceList.value = []
    }
  }

  const context: InvoiceVerifyContext = {
    formData,
    taskDetail,
    invoiceList,
    selectedInvoice,
    selectInvoice,
    updateInvoiceData,
    refreshSelectedInvoice,
    runMatching,
    fetchGroupId,
    disabled
  }

  provide(InvoiceVerifyKey, context)

  onMounted(() => {
    setTimeout(() => loadInvoiceList())
  })

  return context
}

export function useInvoiceVerifyInject(): InvoiceVerifyContext {
  const context = inject(InvoiceVerifyKey)
  if (!context) {
    throw new Error('InvoiceVerify context not found. Make sure useInvoiceVerifyProvider is called in a parent component.')
  }
  return context
}
