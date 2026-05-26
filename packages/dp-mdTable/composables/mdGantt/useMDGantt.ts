import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '../../types/column-types'

export interface MDGanttProps {
  tableId: string
  editable?: boolean
  extraColumnConfig?: {
    columns: Ref<ColumnConfig[]>
    deleteColumn: (column: ColumnConfig) => void
    updateColumn: (column: ColumnConfig) => void
    addColumn: (column: ColumnConfig) => void
    tableFields: Ref<any[]>
    updatedViewColumnsConfig: (updates: Array<{ fieldId: string; hidden: boolean }>) => void
    saveColumnOrder: (columnId: string, position: number) => void
    columnFilterRules: Ref<any[]>
    columnGroupRules: Ref<any[]>
    columnSortRules: Ref<any[]>
    viewStyleConfig?: any
    updateViewFilterSortGroup?: (
      fieldName: 'groupInfo' | 'sortInfo' | 'filterInfo' | 'style',
      value: any
    ) => Promise<void>
  }
}

export const MDGanttContextKey = Symbol('MDGanttContextKey')

export function useMDGantt(props: MDGanttProps) {
  const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
  const ganttRef = ref<any>()
  const {
    loading,
    loadingMore,
    tableData,
    totalSize,
    hasMore,
    refresh: refreshTableData,
    addRow,
    updateRow,
    deleteRow,
    getTableData,
    loadMore,
    getAggChildData
  } = useTableData(props.tableId, ganttRef)

  provide(MDGanttContextKey, {
    tableId: props.tableId,
    updateRow,
    tableData,
    hasMore,
    loadingMore,
    systemFieldsTypes,
    ...props.extraColumnConfig
  })

  return {
    columns: props.extraColumnConfig?.columns,
    systemFieldsTypes,
    tableData,
    totalSize,
    ganttRef,
    getTableData,
    loadMore,
    hasMore,
    loadingMore,
    addRow,
    updateRow,
    deleteRow,
    viewStyleConfig: props.extraColumnConfig?.viewStyleConfig,
  }
}
export const useMDGanttInject = () => {
  const injectKey = inject(MDGanttContextKey)
  if (!injectKey) {
    throw new Error('MDGanttContext not found')
  }
  return injectKey
}
