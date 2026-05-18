// composables/useTableData.ts
import { ref, computed, provide, inject, nextTick, onBeforeUnmount, watch, type Ref, type InjectionKey, type ComputedRef } from 'vue'
import { newClientApi, postDynamicActions } from 'api'
import { ElNotification } from 'element-plus'
import { EventType, useEventBus } from 'eventbus'
import { updateRelationFields } from '../utils/relationHelper'
import { findRowAndAncestors, matchesGroupRow, patchGroupNode, patchChildRowInMap } from '../utils/groupRowSync'
import { getAggColumns } from './useCount'
// import { createGroupTree } from '../utils/treeDataHelper'
function withoutOrderBy(params: Record<string, any> = {}) {
  const { orderBy: _orderBy, ...rest } = params
  return rest
}

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

export interface TableDataFetchOptions {
  /** 静默请求数据，不触发表格 loading */
  silent?: boolean
}

export interface TableDataRefreshOptions {
  /** 静默刷新，不触发表格 loading */
  silent?: boolean
  /** 保持当前分页查询；默认沿用 reload 行为 */
  keepPage?: boolean
}

export interface TableDataContext {
  gridRef: Ref<any>
  tableData: Ref<any[]>
  loading: Ref<boolean>
  loadingMore: Ref<boolean>
  silentRefreshing: Ref<boolean>
  totalSize: Ref<number>
  hasMore: ComputedRef<boolean>
  currentEditing: Ref<string[]>
  // 方法
  getTableData: (params?: any, extraParams?: any, options?: TableDataFetchOptions) => Promise<{ entryList: any[]; totalSize: number } | undefined>
  loadMore: (extraParams?: any) => Promise<void>
  refresh: (options?: TableDataRefreshOptions) => Promise<void>
  addRow: (row: any) => void
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
  deleteRow: (rowid: string | string[]) => Promise<boolean>
  getAggChildData: (params?: any, aggregate?: { id: string; field: string; order: string }) => Promise<any[] | undefined>
  syncRowAndGroupAncestors: (
    rowId: string,
    options?: {
      gridRef?: Ref<any>
      groupChildren?: Ref<Record<string, any[]>>
    }
  ) => Promise<any | null>
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
  const silentRefreshing = ref(false)
  const currentPage = ref(0)
  const viewTools: any = inject('viewTools')
  const databaseHocuspocus: any = inject('databaseHocuspocus', null)

  function getViewDisplayColumns() {
    const columns = viewTools?.columns
    return columns?.value ?? columns ?? []
  }

  function buildGroupAggregateColumns(groupField: string) {
    return [
      { name: groupField },
      ...getAggColumns(getViewDisplayColumns()),
      {
        name: '*',
        alias: '__count',
        aggFunc: 'COUNT'
      }
    ]
  }

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
    extraParams?: any,
    options: TableDataFetchOptions = {}
  ): Promise<{ entryList: any[]; totalSize: number } | undefined> => {
    // if (columnGroupRules.value?.length > 0) {
    //   tableData.value = getAggregateData(params)
    //   return {
    //     entryList: tableData.value,
    //     totalSize: tableData.value.length
    //   }
    // }
    const shouldShowLoading = !options.silent && !silentRefreshing.value
    try {
      if (shouldShowLoading) {
        loading.value = true
      }
      let additionalParams: any = {}
      if (viewTools?.getPageParams) {
        additionalParams = viewTools?.getPageParams()
      }
      if (extraParams) {
        additionalParams = mergeParams(additionalParams, extraParams)
      }
      if (!additionalParams.groupBy) {
        if (params.pageSize) {
          tableQueryBase.value.pageSize = params.pageSize
        }
        additionalParams.pagination = {
          pageSize: tableQueryBase.value.pageSize ?? 100,
          pageNum: params.pageNum ? params.pageNum + 1 : 0
        }
      }
      const { data } = await postDynamicActions({
        tableId,
        columns: [],
        ...additionalParams
      })
      tableData.value = data.data
      if (additionalParams.groupBy) {
        tableData.value = data.data.map((item: any) => ({
          ...item,
          id: item[additionalParams.groupBy.columns[0]],
          hasChild: item.count ? item.count > 0 : true
        }))
      }

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
      if (shouldShowLoading) {
        loading.value = false
      }
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
      let additionalParams: any = {}
      if (viewTools?.getPageParams) {
        additionalParams = viewTools?.getPageParams()
        if (!additionalParams.groupBy) {
          additionalParams.pagination = {
            pageSize: pageSizeVal,
            pageNum: nextPage
          }
        }
      }
      if (extraParams) {
        additionalParams = mergeParams(additionalParams, extraParams)
      }
      const { data } = await postDynamicActions({
        tableId,
        columns: [],
        ...additionalParams
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

  async function getAggChildData(row: any) {
    const columnGroupRules = viewTools?.columnGroupRules
    if (!columnGroupRules?.value?.length) {
      return []
    }
    const additionParams: any = {
      conditions: []
    }
    const _level = row.__level
    const nextColumn = columnGroupRules.value[_level + 1]
    let basicParams: any = {}
    if (nextColumn) {
      additionParams.groupBy = {
        columns: [nextColumn.field]
      }

      additionParams.orderBy = [
        {
          column: nextColumn.field,
          desc: nextColumn.order === 'desc'
        }
      ]
      additionParams.columns = buildGroupAggregateColumns(nextColumn.field)
      basicParams = viewTools?.getPageParams(false, false)
    } else {
      basicParams = viewTools?.getPageParams(false, true)
    }
    for (let i = 0; i < _level + 1; i++) {
      const column = columnGroupRules.value[i]
      additionParams.conditions.push({
        type: 'EQ',
        column: column.field,
        value: row[column.field]
      })
    }
    try {
      const params = mergeParams(basicParams, additionParams)
      const { data } = await postDynamicActions({
        tableId,
        columns: [],
        ...params
      })
      if (nextColumn) {
        const extraData = additionParams.conditions.reduce((acc: any, condition: any) => {
          acc[condition.column] = condition.value
          return acc
        }, {})
        return data.data.map((item: any) => ({
          ...item,
          hasChild: !!nextColumn,
          ...extraData
        }))
      }
      return data.data
    } catch (error) {
      console.error('getAggChildData error', error)
    }
  }
  /**
   * 刷新数据
   */
  const refresh = async (options: TableDataRefreshOptions = {}) => {
    const command = options.keepPage ? 'query' : 'reload'
    if (options.silent) {
      silentRefreshing.value = true
      await nextTick()
    }
    try {
      await gridRef.value?.commitProxy(command)
    } finally {
      if (options.silent) {
        silentRefreshing.value = false
      }
    }
  }

  /**
   * 添加行数据
   */
  const addRow = async (row: any) => {
    const { data } = await newClientApi.postDynamicDbTableTableidData(tableId, { data: row })
    const newRowId = data?.data?.id || data?.id
    if (databaseHocuspocus?.broadcastChange && viewTools?.menuId) {
      databaseHocuspocus.broadcastChange({
        type: 'row_created',
        rowId: newRowId,
        tableId,
        menuId: viewTools.menuId.value || viewTools.menuId
      })
    }
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
      if (databaseHocuspocus?.broadcastChange && viewTools?.menuId) {
        databaseHocuspocus.broadcastChange({
          type: 'row_updated',
          rowId,
          tableId,
          menuId: viewTools.menuId.value || viewTools.menuId
        })
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
      if (databaseHocuspocus?.broadcastChange && viewTools?.menuId) {
        const menuId = viewTools.menuId.value || viewTools.menuId
        if (ids.length > 1) {
          databaseHocuspocus.broadcastChange({
            type: 'rows_deleted',
            rowIds: ids,
            tableId,
            menuId
          })
        } else {
          databaseHocuspocus.broadcastChange({
            type: 'row_deleted',
            rowId: ids[0],
            tableId,
            menuId
          })
        }
      }
      gridRef.value?.commitProxy('reload')
      return true
    } catch (error) {
      return false
    }
  }

  async function fetchRowById(rowId: string) {
    try {
      const { data } = await postDynamicActions({
        tableId,
        conditions: [{ column: 'id', type: 'EQ', value: rowId }],
        columns: [{ name: '*' }]
      })
      return data.data?.[0] || null
    } catch {
      return null
    }
  }

  /** 按分组层级拉取聚合父节点（不重载 grid） */
  async function fetchGroupNodeAtLevel(contextRow: any, level: number) {
    const columnGroupRules = viewTools?.columnGroupRules
    if (!columnGroupRules?.value?.length || level < 0 || level >= columnGroupRules.value.length) {
      return null
    }
    const rules = columnGroupRules.value
    const groupColumn = rules[level]
    const groupValue = contextRow?.[groupColumn.field]
    if (groupValue === undefined) {
      return null
    }
    const additionParams: any = {
      conditions: [
        {
          type: 'EQ',
          column: groupColumn.field,
          value: groupValue
        }
      ],
      groupBy: { columns: [groupColumn.field] },
      columns: buildGroupAggregateColumns(groupColumn.field)
    }
    for (let i = 0; i < level; i++) {
      const column = rules[i]
      additionParams.conditions.unshift({
        type: 'EQ',
        column: column.field,
        value: contextRow[column.field]
      })
    }
    try {
      const basicParams = withoutOrderBy(viewTools?.getPageParams(false, false) || {})
      const params = withoutOrderBy(mergeParams(basicParams, additionParams))
      const { data } = await postDynamicActions({
        tableId,
        columns: [],
        ...params
      })
      return data.data?.[0] || null
    } catch (error) {
      console.error('fetchGroupNodeAtLevel error', error)
      return null
    }
  }

  async function syncRowAndGroupAncestors(
    rowId: string,
    options: {
      gridRef?: Ref<any>
      groupChildren?: Ref<Record<string, any[]>>
    } = {}
  ) {

    const rules = viewTools?.columnGroupRules?.value
    console.log("syncRowAndGroupAncestors", rowId, rules)
    if (!rules?.length) {
      // when no group, update table data directly
      const row = tableData.value.find((r) => r.id === rowId)
      const liveRow = await fetchRowById(rowId)
      if (liveRow) {
        // compare different and get updated fields
        const updatedFields = Object.keys(liveRow).filter((k) => liveRow[k] !== row[k])
        Object.assign(row, liveRow)
        if (updatedFields.length) {
          updatedFields.forEach((field) => {
            setSuccess(row.id, field)
          })
        }
      }
      return null
    }

    const liveRow = await fetchRowById(rowId)
    console.log("live row", liveRow)
    if (!liveRow) {
      return null
    }

    let treeResult: { row: any; ancestors: any[] } | null = null
    const grid = options.gridRef?.value
    if (grid) {
      const fullData = grid.getTableData?.()?.fullData || []
      console.log("full data", fullData)
      treeResult = findRowAndAncestors(fullData, rowId)
      if (treeResult?.row) {
        console.log("tree result", treeResult)
        Object.assign(treeResult.row, liveRow)
      }
    }

    if (options.groupChildren) {
      options.groupChildren.value = patchChildRowInMap(options.groupChildren.value, rowId, liveRow)
    }

    for (let level = 0; level < rules.length; level++) {
      const field = rules[level].field
      const groupNode = await fetchGroupNodeAtLevel(liveRow, level)
      if (!groupNode) {
        continue
      }

      const groupValue = liveRow[field]
      const ancestorRow = treeResult?.ancestors?.[level]
      if (ancestorRow) {
        patchGroupNode(ancestorRow, groupNode, field)
        continue
      }

      const rootGroup = tableData.value.find((row: any) => matchesGroupRow(row, field, groupValue))
      if (rootGroup) {
        patchGroupNode(rootGroup, groupNode, field)
      }
    }

    return liveRow
  }

  function getCurrentMenuId(): string | undefined {
    const m = viewTools?.menuId
    return m?.value || m
  }
  const { setLoading, setSuccess, setError, getCellClass } = useUpdateStatus()
  async function handleRemoteChangeEvent(event: any) {
    const { change, userName } = event
    const currentMenuId = getCurrentMenuId()
    console.log('handleRemoteChangeEvent', event)
    if (!currentMenuId || change.menuId !== currentMenuId) return

    switch (change.type) {
      case 'row_updated': {
        await syncRowAndGroupAncestors(change.rowId, { gridRef })
        break
      }
      case 'row_deleted': {
        const row = tableData.value.find((r) => r.id === change.rowId)
        if (row) {
          row.__deleted = true
        }
        break
      }
      case 'rows_deleted': {
        const ids = change.rowIds || []
        for (const row of tableData.value) {
          if (ids.includes(row.id)) {
            row.__deleted = true
          }
        }
        break
      }
      case 'row_created': {
        ElNotification({
          title: 'New Record',
          message: `${userName || 'Someone'} created a new row`,
          type: 'info'
        })
        break
      }
    }
  }

  const currentEditing = ref<string[]>([])

  function updateCurrentEditing() {
    const states = databaseHocuspocus?.awarenessStates?.value || []
    const currentMenuId = getCurrentMenuId()
    const editingRowIds = new Set<string>()
    for (const state of states) {
      if (state.focus?.editingCell || state.focus?.editingRow) {
        if (!currentMenuId || state.focus.menuId === currentMenuId) {
          if (state.focus.rowId) {
            editingRowIds.add(state.focus.rowId)
          }
        }
      }
    }
    currentEditing.value = Array.from(editingRowIds)
  }

  let stopAwarenessWatch = () => {}
  if (databaseHocuspocus?.awarenessStates) {
    watch(
      () => databaseHocuspocus.awarenessStates,
      () => {
        updateCurrentEditing()
      },
      { deep: true, immediate: true }
    )
  }

  watch(
    () => databaseHocuspocus.remoteChanges,
    () => {
      if (!databaseHocuspocus.remoteChanges.value || databaseHocuspocus.remoteChanges.value.length === 0) return
      console.log('remoteChanges', databaseHocuspocus.remoteChanges.value)
      for (const event of databaseHocuspocus.remoteChanges.value) {
        handleRemoteChangeEvent(event)
      }
    },
    { deep: true }
  )

  const tableDataContext: TableDataContext = {
    gridRef,
    // 数据
    tableData,
    loading,
    loadingMore,
    silentRefreshing,
    totalSize,
    hasMore,
    currentEditing,

    // 方法
    getTableData,
    loadMore,
    queryRecordById,
    getAggChildData,
    syncRowAndGroupAncestors,
    refresh,
    addRow,
    updateRow,
    deleteRow
  }
  provide(TableDataContextKey, tableDataContext)

  return {
    // 数据
    tableData,
    rawData,
    loading,
    loadingMore,
    silentRefreshing,
    totalSize,
    hasMore,
    currentEditing,
    getAggChildData,
    // 方法
    queryRecordById,
    getTableData,
    loadMore,
    syncRowAndGroupAncestors,
    refresh,
    addRow,
    updateRow,
    deleteRow,
    gridRef
  }
}

export const useTableDataInject = (options?: { required?: boolean }) => {
  const tableDataContext = inject(TableDataContextKey, null)
  if (!tableDataContext && options?.required !== false) {
    throw new Error('TableDataContext not found')
  }
  return tableDataContext
}
