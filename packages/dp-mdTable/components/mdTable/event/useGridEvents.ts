import { computed, nextTick, ref, type ComputedRef, type Ref } from 'vue'
import type { VxeGridListeners } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { postDynamicActions } from 'api'
import { useUpdateStatus } from '../../../composables/useUpdateStatus'

export interface RelationCellClickParams {
  targetTableId: string
  recordId: string
  title?: string
  relationField?: string
  displayValue?: Record<string, any>
  row?: Record<string, any>
  column?: Record<string, any>
}

export interface GridEventCallbacks {
  onCellClick: (params: any) => void
  onCellMouseenter: (params: any) => void
  onCellMouseleave: (params: any) => void
  onStartEdit: (params: any) => void
  onExitEdit: (params: any) => void
  onRefresh: () => void | Promise<void>
}

export interface UseGridEventsOptions {
  gridRef: Ref<any>
  columns: Ref<any[]>
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
  syncRowAndGroupAncestors: (rowId: string, options?: { gridRef: Ref<any> }) => Promise<void>
  getAgg: () => Promise<void>
  isGroupingEnabled: Ref<boolean>
  updateExpandedRows: () => void
  saveColumnOrder: (oldColumnId: string, newColumnId: string, dragPos: 'left' | 'right') => void
  rightClickCellPopoverRef: Ref<any>
  callbacks: GridEventCallbacks
}

export function useGridEvents(options: UseGridEventsOptions) {
  const { setLoading, setSuccess, setError } = useUpdateStatus()
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
    await options.callbacks.onRefresh()
  }

  async function handleEditClosed(params: any) {
    const { column, row } = params
    const recordset = options.gridRef.value.getRecordset()
    const hasChanged = recordset.updateRecords.length > 0
    if (!hasChanged) {
      options.callbacks.onExitEdit(params)
      return
    }
    const updateData = {
      [column.field]: row[column.field]
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
      options.callbacks.onExitEdit(params)
    }
  }

  const gridEvents = computed<VxeGridListeners>(() => ({
    'relation-cell-click': handleRelationCellClick,
    editClosed: handleEditClosed,
    'cell-click': (params: any) => {
      options.callbacks.onCellClick(params)
    },
    'cell-mouseenter': (params: any) => {
      options.callbacks.onCellMouseenter(params)
    },
    'cell-mouseleave': (params: any) => {
      options.callbacks.onCellMouseleave(params)
    },
    'start-edit': (params: any) => {
      const { row, column } = params
      options.callbacks.onStartEdit({ row, column })
    },
    columnDragend({ newColumn, oldColumn, dragPos }) {
      const newFullColumn = options.columns.value.find((item: any) => item.field_name === newColumn.field)
      const oldFullColumn = options.columns.value.find((item: any) => item.field_name === oldColumn.field)
      options.saveColumnOrder(oldFullColumn.id, newFullColumn.id, dragPos)
    },
    'cell-menu': ({ row, $event }: any) => {
      $event?.preventDefault()
      options.rightClickCellPopoverRef.value?.open($event, { ...row })
    },
    'checkbox-all': ({ checked }: any) => {
      const { fullData } = options.gridRef.value?.getTableData()
      const setChecked = (row: any) => {
        if (row.children && row.children.length > 0) {
          row.children.forEach((child: any) => {
            setChecked(child)
          })
        }
        row.checked = checked
      }
      fullData.forEach((row: any) => {
        setChecked(row)
      })
    },
    toggleTreeExpand: () => {
      setTimeout(() => {
        options.updateExpandedRows()
      }, 100)
    }
  }))

  return {
    gridEvents,
    relationFormPopoverRef,
    relationFormTableId,
    handleRelationFormSubmit
  }
}
