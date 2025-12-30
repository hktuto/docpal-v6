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
      zip: `zip${i}`,
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
  console.log('mockData', mockData)
  return mockData
}
/**
 * 表格数据管理 Composable
 * 通过 tableName 获取和管理表格数据
 */
export function useTableData(tableName: string, gridRef: any, options: UseTableDataOptions = {}) {
  const { queryParams = '', autoLoad = true, transform } = options

  const tableData = ref<any[]>([])
  const rawData = ref<any[]>([]) // 原始数据，用于行数据管理
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const groupOptions = ref<any[]>([
    { key: 'gender', asc: true },
    { key: 'age', asc: true }
  ])

  /**
   * 从数据推断列类型
   */
  const inferColumnType = (value: any): 'number' | 'integer' | 'string' => {
    if (value === null || value === undefined) return 'string'
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number'
    }
    return 'string'
  }

  /**
   * 获取表格数据
   */
  const getTableData = async (params?: any) => {
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
  const updateRow = (index: number, row: any) => {
    if (index >= 0 && index < tableData.value.length) {
      tableData.value[index] = { ...tableData.value[index], ...row }
      rawData.value[index] = { ...rawData.value[index], ...row }
    }
  }

  /**
   * 删除行数据
   */
  const deleteRow = (index: number) => {
    if (index >= 0 && index < tableData.value.length) {
      tableData.value.splice(index, 1)
      rawData.value.splice(index, 1)
    }
  }

  /**
   * 根据条件删除行
   */
  const deleteRowByCondition = (condition: (row: any) => boolean) => {
    const newData = tableData.value.filter((row) => !condition(row))
    tableData.value = newData
    rawData.value = newData
  }

  /**
   * 批量添加行数据
   */
  const addRows = (rows: any[]) => {
    tableData.value.push(...rows)
    rawData.value.push(...rows)
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    tableData.value = []
    rawData.value = []
  }

  /**
   * 获取原始行数据（用于编辑、删除等操作）
   */
  const getRowData = (index: number) => {
    return index >= 0 && index < rawData.value.length ? rawData.value[index] : null
  }

  
  /**
   * 获取所有行数据
   */
  const getAllRowData = () => {
    return [...rawData.value]
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

  return {
    // 数据
    tableData: computed(() => tableData.value),
    rawData: computed(() => rawData.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // 方法
    getTableData,
    refresh,
    addRow,
    updateRow,
    deleteRow,
    deleteRowByCondition,
    addRows,
    clearData,
    getRowData,
    getAllRowData,
    inferColumnType,
  }
}
