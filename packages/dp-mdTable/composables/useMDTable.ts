// useApi.ts
import { provide, inject, ref, type Ref } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
interface mdTable {
  columns: any
  addColumn: any
  updateColumn: any
  columnGroupRules: any
  gridRef: Ref<VxeGridInstance | undefined>
}

export function useMDTable(props: any) {
  const gridRef = ref<VxeGridInstance<any>>()
  const { columns, addColumn, updateColumn, deleteColumn, columnGroupRules } = useColumnsContext()
  const {
    loading,
    queryParams,
    refresh: refreshTableData,
    addRow: addTableRow,
    updateRow: updateTableRow,
    deleteRow: deleteTableRow,
    getTableData,
  } = useTableDataContext()
  const { gridOptions } = useTableConfig({
    ...props,
    groupBy: columnGroupRules,
    columns,
    loading,
    apiMethod: getTableData,
  }, gridRef)
  provide<mdTable>('mdTable', {
    columns,
    addColumn,
    updateColumn,
    columnGroupRules,
    gridRef
  })
  return {
    columns,
    addColumn,
    updateColumn,
    columnGroupRules,
    gridOptions,
    gridRef,
    refreshTableData
  }
}

export function useMDTableReJect(): mdTable {
  const MDTableReJect = inject<mdTable>('mdTable')
  if (!MDTableReJect) {
    throw new Error('useMdTableConsumer must be used within a component that calls useMDTableProvider')
  }
  return MDTableReJect
}
