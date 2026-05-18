import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '../../types/column-types'

export interface MDCardProps {
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
    viewStyleConfig?: Ref<Record<string, any>>
    updateViewFilterSortGroup?: (fieldName: 'groupInfo' | 'sortInfo' | 'filterInfo' | 'style', value: any) => Promise<void>
  }
}

export const MDCardContextKey = Symbol('MDCardContextKey')

export function useMDCard(props: MDCardProps) {
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
    getAggChildData,
    syncRowAndGroupAncestors
  } = useTableData(props.tableId, cardRef)

  // 计算封面字段
  const coverField = computed(() => {
    const fileColumn = props.extraColumnConfig?.columns.value.find((column: any) => column.field_type === ColumnFieldType.Document)
    return fileColumn?.field_name ?? ''
  })
  provide(MDCardContextKey, {
    tableId: props.tableId,
    updateRow,
    getTableData,
    getAggChildData,
    syncRowAndGroupAncestors,
    coverField,
    tableData,
    loading,
    hasMore,
    loadingMore,
    systemFieldsTypes,
    ...props.extraColumnConfig
  })
  onMounted(async () => {
    await getTableData()
  })
  return {
    columns: props.extraColumnConfig?.columns,
    systemFieldsTypes,
    coverField,
    tableData,
    cardRef,
    getTableData,
    loadMore,
    hasMore,
    loadingMore,
    loading,
    addRow,
    updateRow,
    deleteRow,
    getAggChildData
  }
}
export const useMDCardInject = () => {
  const injectKey = inject(MDCardContextKey)
  if (!injectKey) {
    throw new Error('MDCardContext not found')
  }
  return injectKey
}
