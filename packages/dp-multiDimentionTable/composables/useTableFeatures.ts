// src/components/AdvancedGrid/hooks/useTableFeatures.ts
import { ref, computed, type Ref } from 'vue'
import type { VxeGridInstance } from 'vxe-table'

export function useTableFeatures(gridRef: Ref<VxeGridInstance | undefined>) {
  // 虚拟滚动
  const virtualScrollEnabled = ref(false)
  
  const enableVirtualScroll = () => {
    virtualScrollEnabled.value = true
    if (gridRef.value) {
      // 启用虚拟滚动
      gridRef.value.reloadData()
    }
  }
  
  const disableVirtualScroll = () => {
    virtualScrollEnabled.value = false
    if (gridRef.value) {
      gridRef.value.reloadData()
    }
  }

  // 透视表
  const pivotData = ref<any>(null)
  
  const createPivotTable = (
    data: any[],
    rows: string[],
    columns: string[],
    values: string[],
    aggFunc: string = 'sum'
  ) => {
    // 简单的透视表计算
    const result: any = {}
    
    data.forEach(item => {
      const rowKey = rows.map(field => item[field]).join('|')
      const colKey = columns.map(field => item[field]).join('|')
      
      if (!result[rowKey]) {
        result[rowKey] = {}
      }
      
      values.forEach(valueField => {
        const value = item[valueField] || 0
        if (!result[rowKey][colKey]) {
          result[rowKey][colKey] = {}
        }
        
        if (aggFunc === 'sum') {
          result[rowKey][colKey][valueField] = 
            (result[rowKey][colKey][valueField] || 0) + value
        } else if (aggFunc === 'count') {
          result[rowKey][colKey][valueField] = 
            (result[rowKey][colKey][valueField] || 0) + 1
        } else if (aggFunc === 'avg') {
          // 实现平均值计算
        }
      })
    })
    
    pivotData.value = result
    return result
  }
  
  const clearPivotTable = () => {
    pivotData.value = null
  }

  // 树形展开
  const expandedKeys = ref<Set<string>>(new Set())
  
  const toggleRowExpand = (row: any, expand: boolean) => {
    const rowKey = row.id || row.key
    if (expand) {
      expandedKeys.value.add(rowKey)
    } else {
      expandedKeys.value.delete(rowKey)
    }
    
    if (gridRef.value) {
      if (expand) {
        gridRef.value.setTreeExpand(row, true)
      } else {
        gridRef.value.setTreeExpand(row, false)
      }
    }
  }

  return {
    virtualScrollEnabled,
    enableVirtualScroll,
    disableVirtualScroll,
    pivotData,
    createPivotTable,
    clearPivotTable,
    expandedKeys,
    toggleRowExpand
  }
}
