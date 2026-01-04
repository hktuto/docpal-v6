// utils/tableCount.ts

// 统计方法类型定义
export type CountMethod =
  | 'sum' // 求和
  | 'max' // 最大值
  | 'min' // 最小值
  | 'avg' // 平均值
  | 'count' // 记录总数
  | 'empty' // 未填写
  | 'filled' // 已填写
  | 'unique' // 唯一值
  | 'emptyPercent' // 未填写占比
  | 'filledPercent' // 已填写占比
  | 'none' // 无

/**
 * 计算统计值
 * @param method 统计方法
 * @param field 字段名
 * @param dataList 数据列表
 * @returns 统计结果
 */
export function calculateCount(
  method: CountMethod,
  field: string,
  dataList: any[]
): string | number {
  if (!field || !dataList.length) {
    return '-'
  }
  const calList = dataList.filter(row => row.isAggregate !== true)
  const values = calList.map((row) => row[field])
  const filledValues = values.filter((val) => val !== null && val !== undefined && val !== '')
  const emptyCount = values.length - filledValues.length
  const totalCount = values.length

  switch (method) {
    case 'sum':
      return filledValues.reduce((sum, val) => {
        const num = Number(val)
        return sum + (isNaN(num) ? 0 : num)
      }, 0)

    case 'max':
      if (filledValues.length === 0) return '-'
      const maxNum = Math.max(
        ...filledValues.map((val) => {
          const num = Number(val)
          return isNaN(num) ? -Infinity : num
        })
      )
      return maxNum === -Infinity ? '-' : maxNum

    case 'min':
      if (filledValues.length === 0) return '-'
      const minNum = Math.min(
        ...filledValues.map((val) => {
          const num = Number(val)
          return isNaN(num) ? Infinity : num
        })
      )
      return minNum === Infinity ? '-' : minNum

    case 'avg':
      if (filledValues.length === 0) return '-'
      const sum = filledValues.reduce((s, val) => {
        const num = Number(val)
        return s + (isNaN(num) ? 0 : num)
      }, 0)
      return (sum / filledValues.length).toFixed(2)

    case 'count':
      return totalCount

    case 'empty':
      return emptyCount

    case 'filled':
      return filledValues.length

    case 'unique':
      const uniqueValues = new Set(filledValues.map((val) => String(val)))
      return uniqueValues.size

    case 'emptyPercent':
      return totalCount > 0 ? ((emptyCount / totalCount) * 100).toFixed(2) + '%' : '0%'

    case 'filledPercent':
      return totalCount > 0 ? ((filledValues.length / totalCount) * 100).toFixed(2) + '%' : '0%'

    case 'none':
    default:
      return '-'
  }
}

