// useApi.ts
import { provide, inject, ref, type Ref } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
export interface mdTable {
  columns: any
  addColumn: any
  updateColumn: any
  columnGroupRules: any
  gridRef: Ref<VxeGridInstance | undefined>
}
export const MdTableContextKey: InjectionKey<mdTable> = Symbol('MdTableContextKey')
export function useMDTable(props: any) {
  const gridRef = ref<any>()
  const editable = ref(props.editable)
  const { columns, addColumn, updateColumn, deleteColumn, columnGroupRules, saveColumnOrder } = useColumnsContext()
  const {
    loading,
    queryParams,
    refresh: refreshTableData,
    addRow: addTableRow,
    updateRow: updateTableRow,
    deleteRow: deleteTableRow,
    getTableData,
    getAggChildData
  } = useTableDataContext()
  const { gridOptions } = useTableConfig(
    {
      ...props,
      groupBy: columnGroupRules,
      columns,
      loading,
      childApiMethod: getAggChildData,
      apiMethod: getTableData
    },
    gridRef
  )
  provide(MdTableContextKey, {
    columns,
    addColumn,
    updateColumn,
    columnGroupRules,
    gridRef
  })

  return {
    columns,
    addColumn,
    deleteColumn,
    updateColumn,
    columnGroupRules,
    gridOptions,
    gridRef,
    refreshTableData,
    editable,
    saveColumnOrder
  }
}

export function useMDTableInject(): mdTable {
  const MDTableReJect = inject(MdTableContextKey)
  if (!MDTableReJect) {
    throw new Error('useMdTableConsumer must be used within a component that calls useMDTableProvider')
  }
  return MDTableReJect
}
