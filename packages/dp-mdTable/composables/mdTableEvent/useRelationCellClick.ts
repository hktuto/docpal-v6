import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { postDynamicActions } from 'api'
import type { RelationCellClickParams } from './types'

export interface UseRelationCellClickOptions {
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
  onRefresh: () => void | Promise<void>
}

export function useRelationCellClick(options: UseRelationCellClickOptions) {
  const relationFormPopoverRef = ref()
  const relationFormTableId = ref('')

  async function getRelationRowData(tableId: string, recordId: string) {
    const { data } = await postDynamicActions({
      tableId,
      conditions: [{ column: 'id', type: 'EQ', value: recordId }],
      columns: [{ name: '*' }]
    })
    return data.data?.[0] || null
  }

  async function handleRelationCellClick(params: RelationCellClickParams) {
    const { targetTableId, recordId, title } = params
    if (!targetTableId || !recordId) return
    const record = await getRelationRowData(targetTableId, recordId)
    if (!record) {
      ElMessage.error('Record not found')
      return
    }
    relationFormTableId.value = targetTableId
    await nextTick()
    relationFormPopoverRef.value?.open(record, 'edit', title)
  }

  async function handleRelationFormSubmit(data: any, id: string) {
    if (!id || !relationFormTableId.value) return
    await options.updateRow(id, data, relationFormTableId.value)
    await options.onRefresh()
  }

  return {
    relationFormPopoverRef,
    relationFormTableId,
    handleRelationCellClick,
    handleRelationFormSubmit
  }
}
