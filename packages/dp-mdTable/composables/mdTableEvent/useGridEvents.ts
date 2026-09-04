import { computed } from 'vue'
import type { VxeGridListeners } from 'vxe-table'
import type { UseGridEventsOptions } from './types'
import { useEditClosed } from './useEditClosed'
import { useRelationCellClick } from './useRelationCellClick'

export function useGridEvents(options: UseGridEventsOptions) {
  const { handleEditClosed } = useEditClosed({
    gridRef: options.gridRef,
    updateRow: options.updateRow,
    syncRowAndGroupAncestors: options.syncRowAndGroupAncestors,
    getAgg: options.getAgg,
    isGroupingEnabled: options.isGroupingEnabled,
    onExitEdit: options.callbacks.onExitEdit
  })

  const { relationFormPopoverRef, relationFormTableId, handleRelationCellClick, handleRelationFormSubmit } = useRelationCellClick({
    updateRow: options.updateRow,
    onRefresh: options.callbacks.onRefresh
  })

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
    'cell-dblclick': (params: any) => {
      options.callbacks.onRowDblclick(params)
    },
    'start-edit': (params: any) => {
      const { row, column } = params
      options.callbacks.onStartEdit({ row, column })
    },
    'column-resizable-change': ({ resizeWidth, column }: any) => {
      const updateItem = options.columns.value.find((item: any) => item.field_name === column.field)
      if (!updateItem?.id) return
      updateItem.display_structure ??= {}
      updateItem.display_structure.width = resizeWidth
      options.updateViewColumnWidth(updateItem.id, resizeWidth)
    },
    columnDragend({ newColumn, oldColumn, dragPos }) {
      const newFullColumn = options.columns.value.find((item: any) => item.field_name === newColumn.field)
      const oldFullColumn = options.columns.value.find((item: any) => item.field_name === oldColumn.field)
      options.saveColumnOrder(oldFullColumn.id, newFullColumn.id, dragPos)
    },
    'cell-menu': ({ row, column, $event, $rowIndex }: any) => {
      $event?.preventDefault()
      options.callbacks.onRowContextMenu({
        event: $event,
        row,
        column,
        rowIndex: $rowIndex
      })
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
