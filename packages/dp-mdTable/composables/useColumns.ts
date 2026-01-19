// composables/useColumns.ts
import { ref, type Ref } from 'vue'
import { ColumnFieldType } from '../types/column-types'
import type { VxeTableDefines } from 'vxe-table'
export type OrdersParam = {
  newColumn: VxeTableDefines.ColumnInfo
  oldColumn: VxeTableDefines.ColumnInfo
  dragPos: 'left' | 'right'
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
}

export const ColumnContextKey: InjectionKey<ColumnContext> = Symbol('ColumnContextKey')

export interface ColumnConfig {
  id?: string
  dataTableId?: string // id of the data table
  workspaceId?: string // id of the workspace
  field: string
  title: string
  width?: number | string
  minWidth?: number | string
  // visible?: boolean // deprecated
  //sortable?: boolean // deprecated
  // filterable?: boolean // deprecated
  type: ColumnFieldType
  /** 只读模式渲染器配置 */
  // cellRender?: any // deprecated
  /** 编辑模式渲染器配置 */
  // editRender?: any // deprecated
  // slots?: Record<string, string> // this will add in rea; table render
  fixed?: 'left' | 'right'
  /** 列设置，用于传递额外的配置参数给渲染器 */
  properties?: Record<string, any>
  /** 统计方法 */
  countMethod?: 'sum' | 'max' | 'min' | 'avg' | 'count' | 'empty' | 'filled' | 'unique' | 'emptyPercent' | 'filledPercent' | 'none'

  [key: string]: any
}

export interface UseColumnsOptions {
  onColumnAdd?: (column: ColumnConfig) => void
  onColumnDelete?: (field: string) => void
  onColumnUpdate?: (field: string, column: ColumnConfig) => void
}

/**
 * 从数据自动推断列配置
 */
const inferColumnsFromData = (data: any[]): ColumnConfig[] => {
  if (!data || data.length === 0) return []

  // 使用第一条数据推断列
  const firstRow = data[0]
  const fields = Object.keys(firstRow)

  return fields.map((field) => {
    const value = firstRow[field]
    let type: 'number' | 'integer' | 'string' = 'string'

    if (value !== null && value !== undefined) {
      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'number'
      }
    }

    return {
      field,
      title: field, // 默认使用字段名作为标题
      type,
      visible: true,
      width: type === 'number' || type === 'integer' ? 120 : 150,
      minWidth: 100,
      sortable: true,
      filterable: true
    } as ColumnConfig
  })
}
function createMockColumns(tableName: string) {
  const mockColumns = []
  const names = ['name', 'age', 'gender', 'email', 'phone', 'address', 'singleSelect', 'multiSelect', 'city', 'state', 'zip', 'country', 'url', 'rate']
  for (let i = 0; i < names.length; i++) {
    let type = ColumnFieldType.Text
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
export function useColumns(tableName: string, options: UseColumnsOptions = {}) {
  const columns = ref<ColumnConfig[]>([])
  const columnGroupRules = ref<any[]>([])
  /**
   * 获取列
   * @param field 字段名
   * @returns 列配置或 undefined
   */
  const getColumn = (field: string): ColumnConfig | undefined => {
    return columns.value.find((col) => col.field === field)
  }

  /**
   * 获取所有列
   * @returns 所有列配置
   */
  const getAllColumns = async (): Promise<ColumnConfig[]> => {
    if (tableName) {
      columns.value = createMockColumns(tableName)
      return columns.value
    }
    return [...columns.value]
  }

  /**
   * 添加列
   * @param column 列配置
   * @returns 是否添加成功
   */
  const addColumn = async (column: ColumnConfig): Promise<void> => {
    // 验证必填字段
    if (!column.field || !column.title) {
      console.error('添加列失败: title 是必填项')
      throw new Error('添加列失败: title 是必填项')
    }

    // 设置默认值
    const newColumn: ColumnConfig = {
      visible: true,
      type: 'string',
      width: 150,
      ...column
    }

    // // 根据类型设置编辑配置
    // if (newColumn.type === 'number' || newColumn.type === 'integer') {
    //   newColumn.editRender = newColumn.editRender || { name: 'VxeInput', props: { type: 'number' } }
    // } else {
    //   newColumn.editRender = newColumn.editRender || { name: 'VxeInput' }
    // }

    // 添加到列数组
    columns.value.push(newColumn)

    // // 触发回调
    // options?.onColumnAdd?.(newColumn)
  }

  /**
   * 删除列
   * @param field 字段名
   * @returns 是否删除成功
   */
  const deleteColumn = async (field: string): Promise<void> => {
    const index = columns.value.findIndex((col) => col.field === field)

    if (index === -1) {
      console.error(`删除列失败: 字段名 "${field}" 不存在`)
      throw new Error(`删除列失败: 字段名 "${field}" 不存在`)
    }

    // 删除列
    columns.value.splice(index, 1)

    // 触发回调
    // options?.onColumnDelete?.(field)
  }

  function saveColumnOrder(newOrder: OrdersParam) {
    // TODO: implement
  }

  /**
   * 更新列
   * @param field 字段名
   * @param updates 要更新的列配置
   * @returns 是否更新成功
   */
  const updateColumn = async (field: string, updates: Partial<ColumnConfig>): Promise<void> => {
    console.log('updateColumn', field, updates)
    const index = columns.value.findIndex((col) => col.field === field)

    if (index === -1) {
      console.error(`更新列失败: 字段名 "${field}" 不存在`)
      throw new Error(`更新列失败: 字段名 "${field}" 不存在`)
    }
    // 更新列配置
    const updatedColumn = {
      ...columns.value[index],
      ...updates
    }
    columns.value[index] = updatedColumn
    console.log('columns', columns.value)
  }

  onMounted(() => {
    getAllColumns()
  })

  provide(ColumnContextKey, {
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    saveColumnOrder,

    columns,
    columnGroupRules
  })
  return {
    // 基础方法
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    // 批量方法

    // 原始引用（只读）
    columns: columns as Readonly<Ref<ColumnConfig[]>>,
    columnGroupRules
  }
}

export const useColumnsContext = () => {
  const columnContext = inject(ColumnContextKey)
  if (!columnContext) {
    throw new Error('ColumnContext not found')
  }
  return columnContext
}
