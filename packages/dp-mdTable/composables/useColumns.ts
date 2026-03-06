// composables/useColumns.ts
import { ref, type Ref } from 'vue'
import { ColumnFieldType } from '../types/column-types'
import type { VxeTableDefines } from 'vxe-table'
import { newClientApi } from 'api'
export type OrdersParam = {
  newColumn: VxeTableDefines.ColumnInfo
  oldColumn: VxeTableDefines.ColumnInfo
  dragPos: 'left' | 'right'
}
export interface QueryRelatedTableOptions {
  keyword?: string
  searchFields?: string[]
  pageNum?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface QueryRelatedTableResult {
  rows: any[]
  total: number
  pageNum: number
  pageSize: number
}

export interface ColumnContext {
  getColumn: (field: string) => ColumnConfig | undefined
  getAllColumns: () => Promise<ColumnConfig[]>
  addColumn: (column: ColumnConfig, targetColumnName?: string, position?: 'left' | 'right') => Promise<void>
  deleteColumn: (field: string) => Promise<void>
  updateColumn: (field: string, updates: Partial<ColumnConfig>) => Promise<void>
  saveColumnOrder: (ordersParam: OrdersParam) => void
  columns: Ref<ColumnConfig[]>
  columnGroupRules: Ref<any[]>
  columnFilterRules: Ref<any[]>
  columnSortRules: Ref<any[]>
  addColumnPopoverRef: Ref<any>
  // Relation helpers
  getAvailableTablesForRelation?: (excludeCurrentTable?: boolean) => Promise<any[]>
  getFieldsForTable?: (tableId: string) => Promise<any[]>
  getExistingRelationToTable?: (targetTableId: string) => Promise<any | null>
  getRelationFields?: () => any[]
  addVirtualColumn?: (relationFieldName: string, displayFieldName: string, position?: { targetColumn: string; side: 'left' | 'right' }) => Promise<void>
  tableId?: Ref<string>
  entityId?: Ref<string>
  // Record card preview helpers
  getTableCardConfig?: (tableId: string) => Promise<any | null>
  getRecordById?: (tableId: string, recordId: string) => Promise<Record<string, any> | null>
  // Query related table data for relation field editing
  queryRelatedTable?: (tableId: string, options?: QueryRelatedTableOptions) => Promise<QueryRelatedTableResult>
}

export const ColumnContextKey: InjectionKey<ColumnContext> = Symbol('ColumnInject')

export interface ColumnConfig {
  id?: string
  field_name: string
  business_type: ColumnFieldType
  display_structure?: Record<string, any>
  /** 统计方法 */
  // countMethod?: 'sum' | 'max' | 'min' | 'avg' | 'count' | 'empty' | 'filled' | 'unique' | 'emptyPercent' | 'filledPercent' | 'none'
  [key: string]: any
}

export interface UseColumnsOptions {
  onColumnAdd?: (column: ColumnConfig) => void
  onColumnDelete?: (field: string) => void
  onColumnUpdate?: (field: string, column: ColumnConfig) => void
}

function createMockColumns(tableId: string) {
  const mockColumns = []
  mockColumns.push({
    field: 'startDate',
    title: 'Start Date',
    width: 150,
    minWidth: 100,
    sortable: true,
    type: ColumnFieldType.DateTime,
    properties: { dateFormat: 'YYYY-MM-DD' }
  })
  const names = ['name', 'age', 'gender', 'email', 'phone', 'address', 'singleSelect', 'multiSelect', 'city', 'state', 'zip', 'country', 'url', 'rate']
  for (let i = 0; i < names.length; i++) {
    let type = ColumnFieldType.MultiText
    let properties = {}
    if (names[i] === 'age') {
      type = ColumnFieldType.Number
    }
    if (names[i] === 'gender') {
      type = ColumnFieldType.SingleSelect
      properties = {
        options: [
          {
            id: 'male',
            label: 'Male',
            color: 'red'
          },
          {
            id: 'female',
            label: 'Female',
            color: 'blue'
          }
        ]
      }
    }
    if (names[i] === 'email') {
      type = ColumnFieldType.Email
    }
    if (names[i] === 'phone') {
      type = ColumnFieldType.Formula
      properties = {
        formula: "ABS(DATEDIF(TODAY(), {startDate}, 'D'))"
      }
    }
    if (names[i] === 'url') {
      type = ColumnFieldType.URL
    }
    if (names[i] === 'rate') {
      ;(type = ColumnFieldType.Rating),
        (properties = {
          allowHalf: true,
          max: 3
        })
    }
    if (names[i] === 'singleSelect') {
      type = ColumnFieldType.SingleSelect
      properties = {
        options: [
          {
            id: 1,
            label: 'Option 1',
            color: 'red'
          },
          {
            id: 2,
            label: 'Option 2',
            color: 'blue'
          },
          {
            id: 3,
            label: 'Option 3',
            color: 'green'
          }
        ]
      }
    }
    if (names[i] === 'multiSelect') {
      type = ColumnFieldType.MultiSelect
      properties = {
        options: [
          {
            id: 1,
            label: 'Option 1',
            color: 'red'
          },
          {
            id: 2,
            label: 'Option 2',
            color: 'blue'
          },
          {
            id: 3,
            label: 'Option 3',
            color: 'green'
          }
        ]
      }
    }
    mockColumns.push({
      field: names[i],
      title: names[i],
      width: 150,
      minWidth: 100,
      sortable: true,
      type,
      properties
    })
  }
  console.log('mockColumns', mockColumns)
  return mockColumns
}
/**
 * 列管理 Composable
 * 提供列的增删改查功能，支持从数据自动推断列配置
 */
export function useColumns(tableId: string, options: UseColumnsOptions = {}) {
  console.log('useColumns', tableId)
  const columns = ref<ColumnConfig[]>([])
  const columnGroupRules = ref<any[]>([])
  const columnFilterRules = ref<any[]>([])
  const columnSortRules = ref<any[]>([])
  const addColumnPopoverRef = ref()
  /**
   * 获取列
   * @param field 字段名
   * @returns 列配置或 undefined
   */
  const getColumn = (id: string): ColumnConfig | undefined => {
    return columns.value.find((col) => col.id === id)
  }

  /**
   * 获取所有列
   * @returns 所有列配置
   */
  const getAllColumns = async (): Promise<ColumnConfig[]> => {
    if (tableId) {
      const { data }: any = await newClientApi.getDynamicDbTableTableidFields(tableId)
      columns.value = data ?? []
      return columns.value
    }
    return [...columns.value]
  }

  /**
   * 添加列
   * @param column 列配置
   * @returns 是否添加成功
   */
  const addColumn = async (column: ColumnConfig | ColumnConfig[]): Promise<void> => {
    let newColumns: any[] = []
    if (Array.isArray(column)) {
      for (const item of column) {
        newColumns.push(item)
      }
    } else {
      newColumns.push(column)
    }
    console.log('newColumns', newColumns)
    const { data }: any = await newClientApi.postDynamicDbTableTableidFields(tableId, { fields: newColumns })
    console.log('postDynamicDbTableTableidFieldsdata', data)
    if(!!data) getAllColumns()
    // // 根据类型设置编辑配置
    // if (newColumn.type === 'number' || newColumn.type === 'integer') {
    //   newColumn.editRender = newColumn.editRender || { name: 'VxeInput', props: { type: 'number' } }
    // } else {
    //   newColumn.editRender = newColumn.editRender || { name: 'VxeInput' }
    // }

    // 添加到列数组
    // columns.value.push(newColumn)

    // // 触发回调
    // options?.onColumnAdd?.(newColumn)
  }

  /**
   * 删除列
   * @param field 字段id
   * @returns 是否删除成功
   */
  const deleteColumn = async (field: string): Promise<void> => {
    try {
      const index = columns.value.findIndex((col) => col.field_name === field)
      const { data }: any = await newClientApi.deleteDynamicDbTableFieldsFieldid(columns.value[index].id as string)
      if(!!data) columns.value.splice(index, 1)
    } catch (error) {
      console.error(`删除列失败: 字段名 "${field}" 不存在`)
    }
  }

  function saveColumnOrder(newOrder: OrdersParam) {
    // TODO: implement
  }

  /**
   * 更新列
   * @param id 字段id
   * @param updates 要更新的列配置
   * @returns 是否更新成功
   */
  const updateColumn = async (field: string, updates: Partial<ColumnConfig>): Promise<void> => {
    try {
      const index = columns.value.findIndex((col) => col.field_name === field)
      if (index === -1) {
        console.error(`更新列失败: 字段名 "${columns.value[index].field_name_alias}" 不存在`)
      }
      const { data }: any = await newClientApi.putDynamicDbTableFieldsFieldid(columns.value[index].id as string, updates)
      if(!!data) columns.value[index] = {
        ...columns.value[index],
        field_name_alias: updates.field_name,
        business_type: updates.business_type as ColumnFieldType,
        display_structure: updates.display_structure
      }
    } catch (error) {
      console.error('更新列失败:', error)
    }
  }

  onMounted(() => {
    console.log('onMounted', tableId)
    getAllColumns()
  })

  provide(ColumnContextKey, {
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    saveColumnOrder,
    addColumnPopoverRef,
    columns,
    columnGroupRules,
    columnFilterRules,
    columnSortRules
  })
  return {
    // 基础方法
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    addColumnPopoverRef,
    // 批量方法

    // 原始引用（只读）
    columns: columns as Readonly<Ref<ColumnConfig[]>>,
    columnGroupRules,
    columnFilterRules,
    columnSortRules
  }
}

export const useColumnsInject = () => {
  console.log('useColumnsInject', ColumnContextKey)
  const columnContext = inject(ColumnContextKey)
  if (!columnContext) {
    throw new Error(`ColumnInject not found: ${String(ColumnContextKey)}`)
  }
  return columnContext
}
