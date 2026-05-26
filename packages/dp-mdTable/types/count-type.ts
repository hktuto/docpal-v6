// 统计方法类型定义
export type CountMethod =
  | 'SUM'
  | 'MAX'
  | 'MIN'
  | 'AVG'
  | 'COUNT'
  | 'BLANK_COUNT' // 未填写
  | 'FILLED_COUNT' // 已填写
  | 'UNIQUE_COUNT' // 唯一值
  | 'BLANK_RATIO' // 未填写占比
  | 'FILLED_RATIO' // 已填写占比
  | 'UNIQUE_RATIO' // 唯一值占比
  | 'none' // 无
