// composables/useFooterStatistics.ts
import { ref, computed, type Ref } from 'vue'
import type { VxeGridInstance } from 'vxe-table'

export type StatisticsMethod = 'sum' | 'avg' | 'count' | 'max' | 'min' | 'none'

export interface StatisticsColumnConfig {
  field: string
  method?: StatisticsMethod
}

export function useFooterStatistics(
  gridRef: Ref<VxeGridInstance | undefined>,
  columns: Ref<any[]>,
  data: Ref<any[]>,
  statisticsMethod: Ref<StatisticsMethod> = ref('sum')
) {
  // 统计方法配置
  const columnStatisticsConfig = ref<Map<string, StatisticsMethod>>(new Map())

  // 设置列的统计方法
  const setColumnStatistics = (field: string, method: StatisticsMethod) => {
    columnStatisticsConfig.value.set(field, method)
  }

  // 获取列的统计方法
  const getColumnStatistics = (field: string): StatisticsMethod => {
    return columnStatisticsConfig.value.get(field) || statisticsMethod.value
  }

  // 计算统计值
  const calculateStatistics = (field: string, method: StatisticsMethod, dataList: any[]): number | string => {
    const values = dataList
      .map(row => row[field])
      .filter(val => val !== null && val !== undefined && val !== '')

    if (values.length === 0) return '-'

    switch (method) {
      case 'sum':
        return values.reduce((sum, val) => {
          const num = Number(val)
          return sum + (isNaN(num) ? 0 : num)
        }, 0)
      
      case 'avg':
        const sum = values.reduce((s, val) => {
          const num = Number(val)
          return s + (isNaN(num) ? 0 : num)
        }, 0)
        return values.length > 0 ? (sum / values.length).toFixed(2) : '-'
      
      case 'count':
        return values.length
      
      case 'max':
        const maxNum = Math.max(...values.map(val => {
          const num = Number(val)
          return isNaN(num) ? -Infinity : num
        }))
        return maxNum === -Infinity ? '-' : maxNum
      
      case 'min':
        const minNum = Math.min(...values.map(val => {
          const num = Number(val)
          return isNaN(num) ? Infinity : num
        }))
        return minNum === Infinity ? '-' : minNum
      
      case 'none':
      default:
        return '-'
    }
  }

  // 生成 footer 方法
  const createFooterMethod = () => {
    return ({ columns: footerColumns }: any) => {
      const tableData = (gridRef.value as any)?.getTableData()?.tableData || data.value
      const footerData: any[] = []

      // 创建统计行
      const statisticsRow: any = {}
      
      footerColumns.forEach((column: any) => {
        if (column.field) {
          const method = getColumnStatistics(column.field)
          if (method !== 'none') {
            const result = calculateStatistics(column.field, method, tableData)
            statisticsRow[column.field] = result
          } else {
            statisticsRow[column.field] = '-'
          }
        } else {
          statisticsRow[column.type || column.property || ''] = ''
        }
      })

      footerData.push(statisticsRow)
      return footerData
    }
  }

  // 判断列是否可统计（数字类型）
  const isNumericColumn = (column: any): boolean => {
    // 可以通过列配置判断，或者通过数据类型判断
    return column.type === 'number' || 
           column.type === 'integer' ||
           column.editRender?.props?.type === 'number' ||
           false
  }

  // 获取可统计的列
  const getStatisticColumns = computed(() => {
    return columns.value.filter(col => col.field && isNumericColumn(col))
  })

  return {
    statisticsMethod,
    columnStatisticsConfig,
    setColumnStatistics,
    getColumnStatistics,
    calculateStatistics,
    createFooterMethod,
    isNumericColumn,
    getStatisticColumns
  }
}

