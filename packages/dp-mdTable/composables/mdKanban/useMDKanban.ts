import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '../../types/column-types'

export interface MDKanbanProps {
  tableId: string
  editable?: boolean
  isMirror?: boolean
  canEditTable: boolean,
  canManageTable: boolean,
  extraColumnConfig?: {
    columns: Ref<ColumnConfig[]>
    deleteColumn: (column: ColumnConfig) => void
    updateColumn: (column: ColumnConfig) => void
    addColumn: (column: ColumnConfig) => void
    tableFields: Ref<any[]>
    updatedViewColumnsConfig: (updates: Array<{ fieldId: string; display: boolean }>) => void
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

export const MDKanbanContextKey = Symbol('MDKanbanContextKey')

export function useMDKanban(props: MDKanbanProps) {
  const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
  const cardRef = ref<any>()
  const {
    loading,
    loadingMore,
    tableData,
    hasMore,
    refresh: refreshTableData,
    addRow,
    updateRow,
    deleteRow,
    getTableData,
    loadMore,
    getAggChildData
  } = useTableData(props.tableId, cardRef)


  provide(MDKanbanContextKey, {
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
    cardRef,
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
export const useMDKanbanInject = () => {
  const injectKey = inject(MDKanbanContextKey)
  if (!injectKey) {
    throw new Error('MDKanbanContext not found')
  }
  return injectKey
}
