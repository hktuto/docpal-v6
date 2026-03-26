// composables/useTableData.ts
import { ref, computed, watch, provide, inject, type Ref, type InjectionKey } from 'vue'
import { newClientApi } from 'api'
// import { createGroupTree } from '../utils/treeDataHelper'
export interface UseTableDataOptions {
  /** 是否自动加载数据 */
  autoLoad?: boolean
  /** 数据转换函数 */
  transform?: (data: any[]) => any[]
}
function createMockData({ page }: any, tableId: string) {
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
function createMockAggregateData({ page }: any, tableId: string) {
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
function createMockAggChildData(page: any, tableId: string) {
  return createMockData(page, tableId)
}
export interface TableDataContext {
  tableData: Ref<any[]>
  loading: Ref<boolean>
  // 方法
  getTableData: (params?: any) => Promise<{ entryList: any[]; totalSize: number } | undefined>
  refresh: () => Promise<void>
  addRow: (row: any) => void
  updateRow: (rowId: string, data: any) => Promise<boolean>
  deleteRow: (rowid: string) => Promise<boolean>
  getAggChildData: (params?: any, aggregate?: { id: string; field: string; order: string }) => Promise<any[] | undefined>
  queryRecordById: (id: string) => any
  upsertRows?: (
    rows: any[],
    lookupColumns: string[],
    updateStrategy?: 'all' | 'non_empty'
  ) => Promise<{ inserted: number; updated: number; errors: { row: number; message: string }[] }>
  /**
   * Query any table by name with keyword search and pagination
   * Used for relation field selection (e.g., choosing related records)
   * @param tableId - The physical table name to query
   * @param options - Query options including keyword search and pagination
   * @returns Query result with rows and total count
   */
  queryTableByName?: (
    tableId: string,
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
 * 通过 tableId 获取和管理表格数据
 */
export function useTableData(tableId: string, gridRef: any, options: UseTableDataOptions = {}) {
  const { autoLoad = true, transform } = options
  const tableData = ref<any[]>([])
  const rawData = ref<any[]>([]) // 原始数据，用于行数据管理
  const loading = ref(false)

  /**
   * 获取表格数据
   */
  const getTableData = async (
    params: any = {
      pageSize: 100
    }
  ): Promise<{ entryList: any[]; totalSize: number } | undefined> => {
    // if (columnGroupRules.value?.length > 0) {
    //   tableData.value = getAggregateData(params)
    //   return {
    //     entryList: tableData.value,
    //     totalSize: tableData.value.length
    //   }
    // }
    try {
      loading.value = true
      if (tableId) {
        const { data } = await newClientApi.postDynamicDbTableTableidDataPage(tableId, { ...params })
        tableData.value = data?.entryList?.map((item: any) => ({ ...item, ...item.data })) ?? []
        return {
          entryList: tableData.value,
          totalSize: data?.totalSize ?? 0
        }
      }
      if (!!tableId) {
        console.warn('tableId 不能为空')
        return {
          entryList: [],
          totalSize: 0
        }
      }
    } catch (error) {
      console.error('getTableData error', error)
      return {
        entryList: [],
        totalSize: 0
      }
    } finally {
      loading.value = false
    }
  }
  function getAggregateData(params?: any) {
    return createMockAggregateData(params, tableId)
  }
  async function getAggChildData(params?: any, aggregate?: { id: string; field: string; order: string }) {
    return createMockAggChildData(params, tableId)
  }
  /**
   * 刷新数据
   */
  const refresh = async () => {
    gridRef.value?.commitProxy('reload')
  }

  /**
   * 添加行数据
   */
  const addRow = async (row: any) => {
    const { data } = await newClientApi.postDynamicDbTableTableidData(tableId, { data: row })
    gridRef.value?.commitProxy('reload')
  }
  function queryRecordById(id: string) {
    const record = tableData.value.find((item) => item?.id === id)
    if (record) {
      return record
    }
    return null
  }
  /**
   * 更新行数据：根据每行的 id 在 tableData/rawData 中查找并合并更新
   * @param rows - 要更新的行（可含部分字段），至少需包含 id
   */
  const updateRow = async (rowId: string, data: any) => {
    try {
      await newClientApi.putDynamicDbTableTableidDataDataid(tableId, rowId, { data })
      return true
    } catch (error) {
      gridRef.value?.commitProxy('reload')
      return false
    }
  }

  /**
   * 删除行数据：与接口对齐，支持 string | string[]，内部统一转为数组后按 id 删除
   * @param ids - 行 id，支持单个或数组
   */
  const deleteRow = async (rowid: string) => {
    try {
      await newClientApi.deleteDynamicDbTableTableidDataDataid(tableId, rowid)
      gridRef.value?.commitProxy('reload')
      return true
    } catch (error) {
      return false
    }
  }

  provide(TableDataContextKey, {
    // 数据
    tableData,
    loading,

    // 方法
    getTableData,
    queryRecordById,
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
    getAggChildData,
    // 方法
    queryRecordById,
    getTableData,
    refresh,
    addRow,
    updateRow,
    deleteRow
  }
}

export const useTableDataInject = () => {
  const tableDataContext = inject(TableDataContextKey)
  if (!tableDataContext) {
    throw new Error('TableDataContext not found')
  }
  return tableDataContext
}
