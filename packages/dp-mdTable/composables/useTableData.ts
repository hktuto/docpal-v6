// composables/useTableData.ts
import { ref, computed, watch } from 'vue'
import { clientApi } from 'api'
// import { createGroupTree } from '../utils/treeDataHelper'
export interface UseTableDataOptions {
  /** 查询参数（SQL字符串或对象） */
  queryParams?: string | Record<string, any>
  /** 是否自动加载数据 */
  autoLoad?: boolean
  /** 数据转换函数 */
  transform?: (data: any[]) => any[]
}
function createMockData({ page }: any, tableName: string) {
  const mockData = []
  for (let i = 0; i < 10; i++) {
    mockData.push({
      id: i,
      name: `name${i}`,
      age: Math.floor(Math.random() * 5) + 10,
      gender: Math.floor(Math.random() * 2) === 0 ? 'male' : 'female',
      email: `email${i}@example.com`,
      phone: `phone${i}`,
      address: `address${i}`,
      city: `city${i}`,
      state: `state${i}`,
      startDate: 1735708800000, //时间戳 1735708800000
      singleSelect: [1],
      multiSelect: [1, 2, 3],
      country: `country${i}`,
      rate: Math.floor(Math.random() * 5) + 1,
      url: [
        {
          text: 'http://baidu.com',
          type: 2,
          title: '百度一下，你就知道',
          favicon: 'https://www.baidu.com/favicon.ico'
        }
      ]
    })
  }
  return mockData
}
function createMockAggregateData({ page }: any, tableName: string) {
  const mockAggregateData = []
  for (let i = 0; i < 8; i++) {
    mockAggregateData.push({
      id: i,
      isAggregate: true,
      title: `Aggregate ${i}`
    })
  }
  return mockAggregateData
}
function createMockAggChildData(page: any, tableName: string) {
  return createMockData(page, tableName)
}
export interface TableDataContext {
  tableData: Ref<any[]>
  loading: Ref<boolean>
  error: Ref<Error | null>
  queryParams: Ref<any>
  // 方法
  getTableData: (params?: any) => Promise<any[] | undefined>
  refresh: () => Promise<void>
  addRow: (row: any) => void
  updateRow: (rows: any[]) => void
  deleteRow: (ids: string | string[]) => void
  getAggChildData?: (params?: any, aggregate?: { id: string; field: string; order: string }) => Promise<any[] | undefined>
  upsertRows?: (
    rows: any[],
    lookupColumns: string[],
    updateStrategy?: 'all' | 'non_empty'
  ) => Promise<{ inserted: number; updated: number; errors: { row: number; message: string }[] }>
  /**
   * Query any table by name with keyword search and pagination
   * Used for relation field selection (e.g., choosing related records)
   * @param tableName - The physical table name to query
   * @param options - Query options including keyword search and pagination
   * @returns Query result with rows and total count
   */
  queryTableByName?: (
    tableName: string,
    options?: {
      keyword?: string
      searchFields?: string[]
      pageNum?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  ) => Promise<{
    rows: any[]
    total: number
    pageNum: number
    pageSize: number
  }>
}

export const TableDataContextKey: InjectionKey<TableDataContext> = Symbol('TableDataContextKey')

/**
 * 表格数据管理 Composable
 * 通过 tableName 获取和管理表格数据
 */
export function useTableData(tableName: string, gridRef: any, options: UseTableDataOptions = {}) {
  const { autoLoad = true, transform } = options

  const tableData = ref<any[]>([])
  const rawData = ref<any[]>([]) // 原始数据，用于行数据管理
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const queryParams = ref<any>({})
  const groupOptions = ref<any[]>([
    { key: 'gender', asc: true },
    { key: 'age', asc: true }
  ])

  /**
   * 获取表格数据
   */
  const getTableData = async (params: any = {}, aggregate: any = {}) => {
    console.log('params', params)
    console.log('aggregate', aggregate)
    if (aggregate?.length > 0) {
      tableData.value = getAggregateData(params)
      return tableData.value
    }
    if (tableName) {
      tableData.value = createMockData(tableName, params)
      // const data = createGroupTree(tableData.value, groupOptions.value)
      // console.log('data', data)
      return tableData.value
    }
    if (!!tableName) {
      console.warn('tableName 不能为空')
      return
    }

    loading.value = true
    error.value = null
  }
  function getAggregateData(params?: any) {
    return createMockAggregateData(params, tableName)
  }
  function getAggChildData(params?: any) {
    console.log('getAggChildData', params)
    return createMockAggChildData(params, tableName)
  }
  /**
   * 刷新数据
   */
  const refresh = async () => {
    await getTableData()
  }

  /**
   * 添加行数据
   */
  const addRow = (row: any) => {
    tableData.value.push(row)
    rawData.value.push(row)
  }

  /**
   * 更新行数据
   */
  const updateRow = (rows: any[]) => {
    // if (index >= 0 && index < tableData.value.length) {
    //   tableData.value[index] = { ...tableData.value[index], ...row }
    //   rawData.value[index] = { ...rawData.value[index], ...row }
    // }
  }

  /**
   * 删除行数据
   */
  const deleteRow = (id: number) => {
    const index = tableData.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      rawData.value.splice(index, 1)
    }
  }

  // 监听 tableName 变化，自动重新加载数据
  watch(
    () => tableName,
    (newTableName) => {
      if (newTableName && autoLoad) {
        getTableData()
      }
    },
    { immediate: false }
  )
  // 如果 autoLoad 为 true，初始化时加载数据
  if (autoLoad && tableName) {
    getTableData()
  }

  provide(TableDataContextKey, {
    // 数据
    tableData,
    loading,
    error,
    queryParams,

    // 方法
    getTableData,
    getAggChildData,
    refresh,
    addRow,
    updateRow,
    deleteRow
  })

  return {
    // 数据
    tableData,
    rawData,
    loading,
    error,
    queryParams,
    // 方法
    getTableData,
    refresh,
    addRow,
    updateRow,
    deleteRow
  }
}

export const useTableDataContext = () => {
  const tableDataContext = inject(TableDataContextKey)
  if (!tableDataContext) {
    throw new Error('TableDataContext not found')
  }
  return tableDataContext
}
