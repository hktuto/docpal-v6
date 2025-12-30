// useApi.ts
import { provide, inject } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
interface mdTable {}

export function useMDTable(tableName: string, props: any) {
  const gridRef = ref<VxeGridInstance<any>>()
  const { columns, addColumn, columnGroupRules } = useColumns(tableName)
  const {
    loading,
    refresh: refreshTableData,
    addRow: addTableRow,
    updateRow: updateTableRow,
    deleteRow: deleteTableRow,
    getTableData,
  } = useTableData(tableName, gridRef)
  const { gridOptions } = useTableConfig({
    height: props.height,
    autoResize: props.autoResize,
    stripe: props.stripe,
    border: props.border,
    resizable: props.resizable,
    keepSource: props.keepSource,
    rowId: props.rowId,
    editConfig: props.editConfig,
    groupBy: columnGroupRules,
    columns,
    loading,
    apiMethod: getTableData,
  }, gridRef)
  provide<mdTable>('mdTable', {
    columns,
    addColumn,
    columnGroupRules
  })
  return {
    columns,
    addColumn,
    columnGroupRules,
    gridOptions,
    gridRef,
    refreshTableData
  }
}

export function useMDTableReJect(): mdTable {
  const MDTableReJect = inject<mdTable>('mdTable')
  if (!MDTableReJect) {
    throw new Error('usemdTableConsumer must be used within a component that calls useMDTableProvider')
  }
  return MDTableReJect
}
