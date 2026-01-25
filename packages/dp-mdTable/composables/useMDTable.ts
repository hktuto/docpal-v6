// useApi.ts
import { provide, inject, ref, type Ref } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
import { useUpdateStatus } from './useUpdateStatus'

export interface mdTable {
  columns: any
  addColumn: any
  updateColumn: any
  deleteRow: any,
  columnGroupRules: any
  gridRef: Ref<VxeGridInstance | undefined>
  getOptionsFromTableData: (column: any) => any[]
  clearCheckboxRow: () => void
}
export const MdTableContextKey: InjectionKey<mdTable> = Symbol('MdTableContextKey')
export function useMDTable(props: any) {
  const editable = ref(props.editable)

  const {
    gridRef,
    columns,
    addColumn,
    updateColumn,
    deleteColumn,
    columnGroupRules,
    columnFilterRules,
    columnSortRules,
    saveColumnOrder,
    addColumnPopoverRef
  } = useColumnsContext()
  const {
    loading,
    queryParams,
    tableData,
    refresh: refreshTableData,
    addRow: addTableRow,
    updateRow: updateTableRow,
    deleteRow,
    getTableData,
    getAggChildData
  } = useTableDataContext()
  
  // Get update status helper for cell styling
  const { getCellClass } = useUpdateStatus()
  
  const { gridOptions } = useTableConfig(
    {
      ...props,
      groupBy: columnGroupRules,
      filterBy: columnFilterRules,
      sortBy: columnSortRules,
      columns,
      loading,
      childApiMethod: getAggChildData,
      apiMethod: getTableData,
      // Add cell class name function for update status visual feedback
      cellClassName: ({ row, column }: any) => {
        if (!row?.id || !column?.field) return ''
        return getCellClass(row.id, column.field)
      }
    },
    gridRef
  )
  function clearCheckboxRow() {
    const selectedRows = gridRef.value?.getCheckboxRecords() || []
    if (selectedRows.length > 0) {
      selectedRows.forEach((row: any) => {
        row.checked = false
      })
      gridRef.value?.clearCheckboxRow()
    }
  }

  function getOptionsFromTableData(column: any) {
    const options = new Set()
    tableData.value.forEach((row: any) => {
      const value = row[column.field]
      if (value) {
        options.add(value)
      }
    })
    return Array.from(options).filter(Boolean)
  }

  provide(MdTableContextKey, {
    columns,
    addColumn,
    updateColumn,
    deleteRow,
    columnGroupRules,
    gridRef,
    clearCheckboxRow,
    // helper functions
    getOptionsFromTableData
  })

  return {
    columns,
    addColumn,
    deleteColumn,
    updateColumn,
    columnGroupRules,
    columnFilterRules,
    columnSortRules,
    gridOptions,
    gridRef,
    updateTableRow,
    refreshTableData,
    tableData,
    editable,
    saveColumnOrder,
    addColumnPopoverRef,
    clearCheckboxRow
  }
}

export function useMDTableInject(): mdTable {
  const MDTableReJect = inject(MdTableContextKey)
  if (!MDTableReJect) {
    throw new Error('useMdTableConsumer must be used within a component that calls useMDTableProvider')
  }
  return MDTableReJect
}
