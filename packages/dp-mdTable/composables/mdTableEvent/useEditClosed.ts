import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { normalizeFieldValueForSubmit } from '../../utils/fieldValueFormat'
import { useUpdateStatus } from '../useUpdateStatus'

export interface UseEditClosedOptions {
  gridRef: Ref<any>
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
  syncRowAndGroupAncestors: (rowId: string, options?: { gridRef: Ref<any> }) => Promise<void>
  getAgg: () => Promise<void>
  isGroupingEnabled: Ref<boolean>
  onExitEdit: (params: any) => void
}

export function useEditClosed(options: UseEditClosedOptions) {
  const { setLoading, setSuccess, setError } = useUpdateStatus()

  async function handleEditClosed(params: any) {
    const { column, row } = params
    const recordset = options.gridRef.value.getRecordset()
    const hasChanged = recordset.updateRecords.length > 0
    if (!hasChanged) {
      options.onExitEdit(params)
      return
    }
    const normalizedValue = normalizeFieldValueForSubmit(row[column.field], column)
    row[column.field] = normalizedValue
    const updateData = {
      [column.field]: normalizedValue
    }

    setLoading(row.id, column.field)

    try {
      await options.updateRow(row.id, updateData)
      setSuccess(row.id, column.field)
      if (options.isGroupingEnabled.value) {
        await options.syncRowAndGroupAncestors(row.id, { gridRef: options.gridRef })
      }
    } catch (error) {
      console.error('Failed to update row:', error)
      setError(row.id, column.field, error instanceof Error ? error.message : 'Update failed')
      ElMessage.error('Failed to update cell')
    } finally {
      await options.getAgg()
      options.onExitEdit(params)
    }
  }

  return { handleEditClosed }
}
