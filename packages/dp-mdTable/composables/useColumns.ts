// composables/useColumns.ts
import { ref, type Ref } from 'vue'
import { ColumnFieldType } from '../types/column-types'

export interface ColumnConfig {
  field: string
  title: string
  width?: number | string
  minWidth?: number | string
  visible?: boolean
  sortable?: boolean
  filterable?: boolean
  type?: 'number' | 'string' | 'integer' | ColumnFieldType
  /** 只读模式渲染器配置 */
  cellRender?: any
  /** 编辑模式渲染器配置 */
  editRender?: any
  slots?: Record<string, string>
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
  const names = ['name', 'age', 'gender', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'url', 'rate']
  for (let i = 0; i < names.length; i++) {
    let type = ColumnFieldType.Text
    let properties = {}
    if (names[i] === 'age') {
      type = ColumnFieldType.Number
    }
    if (names[i] === 'gender') {
      type = ColumnFieldType.SingleSelect
    }
    if (names[i] === 'email') {
      type = ColumnFieldType.Email
    }
    if (names[i] === 'phone') {
      type = ColumnFieldType.Phone
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
  const getAllColumns = (): ColumnConfig[] => {
    if (tableName) {
      columns.value = createMockColumns(tableName)
      return columns.value
    }
    return [...columns.value]
  }

  /**
   * 检查列是否存在
   * @param field 字段名
   * @returns 是否存在
   */
  const hasColumn = (field: string): boolean => {
    return columns.value.some((col) => col.field === field)
  }

  /**
   * 添加列
   * @param column 列配置
   * @returns 是否添加成功
   */
  const addColumn = (column: ColumnConfig): boolean => {
    // 验证必填字段
    if (!column.field || !column.title) {
      console.error('添加列失败: title 是必填项')
      return false
    }

    // 设置默认值
    const newColumn: ColumnConfig = {
      visible: true,
      type: 'string',
      width: 150,
      ...column
    }

    // 根据类型设置编辑配置
    if (newColumn.type === 'number' || newColumn.type === 'integer') {
      newColumn.editRender = newColumn.editRender || { name: 'VxeInput', props: { type: 'number' } }
    } else {
      newColumn.editRender = newColumn.editRender || { name: 'VxeInput' }
    }

    // 添加到列数组
    columns.value.push(newColumn)

    // 触发回调
    options?.onColumnAdd?.(newColumn)

    return true
  }

  /**
   * 删除列
   * @param field 字段名
   * @returns 是否删除成功
   */
  const deleteColumn = (field: string): boolean => {
    const index = columns.value.findIndex((col) => col.field === field)

    if (index === -1) {
      console.error(`删除列失败: 字段名 "${field}" 不存在`)
      return false
    }

    // 删除列
    columns.value.splice(index, 1)

    // 触发回调
    options?.onColumnDelete?.(field)

    return true
  }

  /**
   * 更新列
   * @param field 字段名
   * @param updates 要更新的列配置
   * @returns 是否更新成功
   */
  const updateColumn = (field: string, updates: Partial<ColumnConfig>): boolean => {
    console.log('updateColumn', field, updates)
    const index = columns.value.findIndex((col) => col.field === field)

    if (index === -1) {
      console.error(`更新列失败: 字段名 "${field}" 不存在`)
      return false
    }
    // 更新列配置
    const updatedColumn = {
      ...columns.value[index],
      ...updates
    }
    columns.value[index] = updatedColumn
    console.log('columns', columns.value)
    return true
  }

  /**
   * 批量添加列
   * @param columnList 列配置数组
   * @returns 成功添加的数量
   */
  const addColumns = (columnList: ColumnConfig[]): number => {
    let successCount = 0
    columnList.forEach((column) => {
      if (addColumn(column)) {
        successCount++
      }
    })
    return successCount
  }

  /**
   * 批量删除列
   * @param fields 字段名数组
   * @returns 成功删除的数量
   */
  const deleteColumns = (fields: string[]): number => {
    let successCount = 0
    fields.forEach((field) => {
      if (deleteColumn(field)) {
        successCount++
      }
    })
    return successCount
  }

  /**
   * 获取已存在的字段列表
   * @returns 字段名数组
   */
  const getExistingFields = (): string[] => {
    return columns.value.filter((col) => col.field && col.field !== '__add_button__').map((col) => col.field)
  }

  /**
   * 重置列配置
   * @param newColumns 新的列配置数组
   */
  const resetColumns = (newColumns: ColumnConfig[]) => {
    columns.value = [...newColumns]
  }

  /**
   * 从数据自动推断并设置列配置
   * @param data 数据数组
   */
  const inferColumns = (data: any[]) => {
    const inferredColumns = inferColumnsFromData(data)
    columns.value = inferredColumns
  }

  /**
   * 从数据推断并合并列配置（不覆盖已有列）
   * @param data 数据数组
   */
  const mergeColumnsFromData = (data: any[]) => {
    if (!data || data.length === 0) return

    const inferredColumns = inferColumnsFromData(data)
    const existingFields = columns.value.map((col) => col.field)

    inferredColumns.forEach((col) => {
      if (!existingFields.includes(col.field)) {
        columns.value.push(col)
      }
    })
  }
  onMounted(() => {
    getAllColumns()
  })
  return {
    // 基础方法
    getColumn,
    getAllColumns,
    hasColumn,
    addColumn,
    deleteColumn,
    updateColumn,
    // 批量方法
    addColumns,
    deleteColumns,
    // 工具方法
    getExistingFields,
    resetColumns,
    inferColumns,
    mergeColumnsFromData,
    // 原始引用（只读）
    columns: columns as Readonly<Ref<ColumnConfig[]>>,
    columnGroupRules
  }
}
