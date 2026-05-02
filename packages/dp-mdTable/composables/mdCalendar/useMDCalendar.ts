import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '../../types/column-types'

export interface MDCalendarProps {
  tableId: string
  editable?: boolean
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

export const MDCalendarContextKey = Symbol('MDCalendarContextKey')

export function useMDCalendar(props: MDCalendarProps) {
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

  provide(MDCalendarContextKey, {
    tableId: props.tableId,
    systemFieldsTypes,
    ...props.extraColumnConfig
  })

  return {
    columns: props.extraColumnConfig?.columns,
    systemFieldsTypes,
    tableFields: props.extraColumnConfig?.tableFields,
    viewStyleConfig: props.extraColumnConfig?.viewStyleConfig,
  }
}
export const useMDCalendarInject = () => {
  const injectKey = inject(MDCalendarContextKey)
  if (!injectKey) {
    throw new Error('MDCalendarContext not found')
  }
  return injectKey
}
