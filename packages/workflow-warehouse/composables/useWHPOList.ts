import { inject, provide, ref, toRef, type InjectionKey, type Ref } from 'vue'
import { resolveWorkflowFile } from '../utils/workflowHelper'
import {
  fetchPoListByBatch,
  sumPoQuantity,
  updatePoHeader,
  type CustPoHeader
} from '../utils/custPo'

export interface WHPOListProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
  disabled?: boolean
}

export interface WHPOListContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  poList: Ref<CustPoHeader[]>
  disabled: Ref<boolean | undefined>
  selectedPo: Ref<CustPoHeader | null>
  selectPo: (item: CustPoHeader) => void
  loadPoList: () => Promise<void>
  updatePoData: (poData: Record<string, any>) => Promise<CustPoHeader | null>
  syncPoTotals: (rows: Record<string, any>[]) => void
}

export const WHPOListKey: InjectionKey<WHPOListContext> = Symbol('WHPOList')

export function useWHPOListProvider(props: WHPOListProps) {
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const disabled = toRef(props, 'disabled')
  const poList = ref<CustPoHeader[]>([])
  const selectedPo = ref<CustPoHeader | null>(null)

  function selectPo(item: CustPoHeader) {
    selectedPo.value = item
    item.file = resolveWorkflowFile(item.preview_file_name, formData.value?.file_list_info)
  }

  async function loadPoList() {
    const batchNo = formData.value?.batch_no
    try {
      const list = await fetchPoListByBatch(batchNo, formData.value)
      poList.value = list
      if (list.length) {
        selectPo(list[0])
      } else {
        selectedPo.value = null
      }
    } catch (error) {
      console.error(error)
      poList.value = []
      selectedPo.value = null
    }
  }

  async function updatePoData(poData: Record<string, any>) {
    if (!selectedPo.value) return null
    return updatePoHeader(selectedPo.value, poData)
  }

  function syncPoTotals(rows: Record<string, any>[]) {
    if (!selectedPo.value) return
    selectedPo.value.total_qty = sumPoQuantity(rows)
    selectedPo.value.items = rows as CustPoHeader['items']
  }

  const context: WHPOListContext = {
    formData,
    taskDetail,
    poList,
    selectedPo,
    selectPo,
    loadPoList,
    updatePoData,
    syncPoTotals,
    disabled
  }

  provide(WHPOListKey, context)
  return context
}

export function useWHPOListInject(): WHPOListContext {
  const context = inject(WHPOListKey)
  if (!context) {
    throw new Error('WHPOList context not found. Make sure useWHPOListProvider is called in a parent component.')
  }
  return context
}
