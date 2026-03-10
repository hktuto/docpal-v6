// useApi.ts
import { provide, inject, ref, type Ref } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
import { useUpdateStatus } from './useUpdateStatus'
import { clientApi } from 'api'
import { newClientApi } from 'api'
export interface mdTable {
  columns: any
  gridRef: Ref<VxeGridInstance | undefined>
  getOptionsFromTableData: (column: any) => any[]
  clearCheckboxRow: () => void
  getUserList: () => Promise<any[]>
  userList: Ref<any[]>
  tableData: Ref<any[]>
  updateRow: (rowId: string, data: any) => Promise<boolean>
  addRow: (row: any) => void
}
export const MdTableContextKey: InjectionKey<mdTable> = Symbol('MdTableContextKey')
export function useMDTable(props: any) {
  console.log('useMDTable', props)
  const editable = ref(props.editable)
  const gridRef = ref<any>()
  const { columns, addColumnPopoverRef, deleteColumn, addColumn } = useColumns(props.tableId)

  const {
    loading,
    queryParams,
    tableData,
    refresh: refreshTableData,
    addRow,
    updateRow,
    deleteRow,
    getTableData,
    getAggChildData,

    columnGroupRules,
    columnFilterRules,
    columnSortRules,
  } = useTableData(props.tableId, gridRef)

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


  const userList = ref<any[]>([])
  let lastLoadTime = 0
  async function getUserList() {
    if (userList.value.length > 0 && lastLoadTime > Date.now() - 1000 * 30) {
      return userList.value
    }
    try {
      const data: any = await newClientApi.postUcenterUsers()
      userList.value = data.data.map((item: any) => ({
        label: item.username,
        id: item.userId
      }))
      console.log('userList', userList.value)
      lastLoadTime = Date.now()
      return userList.value
    } catch (error) {
      console.error('getUserList error', error)
      userList.value = []
      return []
    } finally {
      lastLoadTime = Date.now()
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
    tableData,
    gridRef,
    clearCheckboxRow,
    // helper functions
    getOptionsFromTableData,
    getUserList,
    userList,
    updateRow,
    addRow
  })

  return {
    columns,
    addColumnPopoverRef,
    addColumn,
    deleteColumn,
    columnGroupRules,
    columnFilterRules,
    columnSortRules,

    gridOptions,
    gridRef,
    refreshTableData,
    tableData,
    editable,
    
    clearCheckboxRow,
    addRow,
    updateRow
  }
}

export function useMDTableInject() {
  const MDTableReJect = inject(MdTableContextKey)
  if (!MDTableReJect) {
    console.error('useMdTableConsumer must be used within a component that calls useMDTableProvider')
  }
  return MDTableReJect
}
