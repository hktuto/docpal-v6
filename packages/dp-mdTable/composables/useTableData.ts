// composables/useTableData.ts
import { ref, computed, provide, inject, onBeforeUnmount, type Ref, type InjectionKey, type ComputedRef } from 'vue'
import { newClientApi, postDynamicActions } from 'api'
import { EventType, useEventBus } from 'eventbus'
import { updateRelationFields } from '../utils/relationHelper'
// import { createGroupTree } from '../utils/treeDataHelper'
function mergeParams(base: any, extra: any) {
  if (!extra) return base
  const result = { ...base }
  for (const key of Object.keys(extra)) {
    if (key === 'conditions') {
      const baseConditions = base?.conditions || []
      const extraConditions = extra.conditions || []
      if (baseConditions.length && extraConditions.length) {
        result.conditions = [
          {
            type: 'AND',
            value: [...extraConditions, ...baseConditions]
          }
        ]
      } else {
        result.conditions = [...extraConditions, ...baseConditions]
      }
    } else if (key === 'orderBy') {
      result.orderBy = [...(base?.orderBy || []), ...(extra.orderBy || [])]
    } else {
      result[key] = extra[key]
    }
  }
  return result
}
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
  gridRef: Ref<any>
  tableData: Ref<any[]>
  loading: Ref<boolean>
  loadingMore: Ref<boolean>
  totalSize: Ref<number>
  hasMore: ComputedRef<boolean>
  // 方法
  getTableData: (params?: any, extraParams?: any) => Promise<{ entryList: any[]; totalSize: number } | undefined>
  loadMore: (extraParams?: any) => Promise<void>
  refresh: () => Promise<void>
  addRow: (row: any) => void
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
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
  const totalSize = ref(0)
  const rawData = ref<any[]>([]) // 原始数据，用于行数据管理
  const loading = ref(false)
  const loadingMore = ref(false)
  const currentPage = ref(1)
  const viewTools: any = inject('viewTools')
  /** 翻页时复用的查询条件（不含 pageNum） */
  const tableQueryBase = ref<Record<string, any>>({ pageSize: 100 })
  const relationRefreshBus = useEventBus(EventType.RELATION_NEED_REFRESH)

  const hasMore = computed(() => {
    if (!totalSize.value) {
      return false
    }
    return tableData.value.length < totalSize.value
  })

  const stopRelationRefresh = relationRefreshBus.on((payload: any) => {
    console.log('relationRefresh', payload)
    if (!payload?.data || !payload?.relationRowId || !payload?.relationField || !payload?.relationTableId) return
    const { relationRowId, relationField, relationTableId, data } = payload
    tableData.value.forEach((row) => {
      updateRelationFields(relationRowId, data, row, relationField)
      if (row[relationField]?.includes(relationRowId)) {
        row[relationField] = data[relationField]
      }
    })
  })

  onBeforeUnmount(() => {
    stopRelationRefresh()
  })

  /**
   * 获取表格数据
   */
  const getTableData = async (
    params: any = {
      pageSize: 100
    },
    extraParams?: any
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
      let additionalParams = {}
      if (viewTools?.getPageParams) {
        additionalParams = viewTools?.getPageParams()
      }
      if (extraParams) {
        additionalParams = mergeParams(additionalParams, extraParams)
      }
      if (params.pageSize) {
        tableQueryBase.value.pageSize = params.pageSize
      }
      const { data } = await postDynamicActions({
        tableId,
        columns: [],
        ...additionalParams,
        pagination: {
          pageSize: tableQueryBase.value.pageSize ?? 100,
          pageNum: params.pageNum ? params.pageNum + 1 : 1
        }
      })
      tableData.value = data.data
      rawData.value = JSON.parse(JSON.stringify(data.data))
      totalSize.value = data.meta.total
      return {
        entryList: tableData.value,
        totalSize: totalSize.value
      }
    } catch (error) {
      console.error('getTableData error', error)
      return undefined
    } finally {
      loading.value = false
    }
  }

  const loadMore = async (extraParams?: any) => {
    if (!tableId || loading.value || loadingMore.value || !hasMore.value) {
      return
    }
    loadingMore.value = true
    try {
      const pageSizeVal = tableQueryBase.value.pageSize ?? 100
      const nextPage = currentPage.value + 1
      let additionalParams = {}
      if (viewTools?.getPageParams) {
        additionalParams = viewTools?.getPageParams()
      }
      if (extraParams) {
        additionalParams = mergeParams(additionalParams, extraParams)
      }
      const { data } = await postDynamicActions({
        tableId,
        columns: [],
        ...additionalParams,
        pagination: {
          pageSize: pageSizeVal,
          pageNum: nextPage
        }
      })
      if (data?.entryList?.length === 0) {
        totalSize.value = tableData.value.length
        return
      }
      tableData.value.push(...data.data)

      currentPage.value = nextPage
      if (data?.totalSize != null) {
        totalSize.value = data.totalSize
      }
    } catch (error) {
      console.error('loadMore error', error)
    } finally {
      loadingMore.value = false
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
  const updateRow = async (rowId: string, data: any, mdTableId?: string) => {
    try {
      if (!mdTableId) mdTableId = tableId
      await newClientApi.putDynamicDbTableTableidDataDataid(mdTableId, rowId, { data })
      const row = tableData.value.find((item) => item.id === rowId)
      if (row) {
        Object.assign(row, data)
      }
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
  const deleteRow = async (rowid: string | string[]) => {
    try {
      const ids = Array.isArray(rowid) ? rowid : [rowid]
      await newClientApi.deleteDynamicDbTableTableidDataBatch(tableId, { ids })
      gridRef.value?.commitProxy('reload')
      return true
    } catch (error) {
      return false
    }
  }

  provide(TableDataContextKey, {
    gridRef,
    // 数据
    tableData,
    loading,
    loadingMore,
    totalSize,
    hasMore,

    // 方法
    getTableData,
    loadMore,
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
    loadingMore,
    totalSize,
    hasMore,
    getAggChildData,
    // 方法
    queryRecordById,
    getTableData,
    loadMore,
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
