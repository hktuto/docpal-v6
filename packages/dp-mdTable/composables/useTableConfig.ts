// composables/useTableConfig.ts
import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import type { VxeGridProps, VxeGridInstance } from 'vxe-table'
import { VxeUI } from 'vxe-pc-ui'
import type { ColumnConfig } from './useColumns'
import { ColumnFieldType } from '../types/column-types'
import { calculateCount, type CountMethod, flattenAggregatedData } from '../utils/tableCount'
// 初始化注册管理器
import { rendererManager } from '../renderers/registry-manager'
rendererManager.registerAllRenderers()

export interface TableConfigOptions {
  /** 表格高度 */
  height?: string | number
  /** 是否自动调整大小 */
  autoResize?: boolean
  /** 是否显示斑马纹 */
  stripe?: boolean
  /** 是否显示边框 */
  border?: boolean
  /** 是否可调整列宽 */
  resizable?: boolean
  /** 是否保持原始数据 */
  keepSource?: boolean
  /** 行ID字段 */
  rowId?: string
  /** 编辑配置 */
  editConfig?: boolean | object
  /** 分组字段 */
  groupBy?: string[] | Ref<string[]> | ComputedRef<string[]>
  /** 列配置 */
  columns: Ref<ColumnConfig[]> | ComputedRef<ColumnConfig[]>
  /** 加载状态 */
  loading: Ref<boolean> | ComputedRef<boolean>
  apiMethod: Function
  /** 子节点加载方法 */
  childApiMethod?: Function
}

/**
 * 表格配置管理 Composable
 * 封装 VxeGrid 的配置逻辑
 */
export function useTableConfig(options: TableConfigOptions, gridRef: any) {
  const {
    height = '100%',
    autoResize = true,
    stripe = true,
    border = true,
    resizable = true,
    keepSource = true,
    rowId = 'id',
    editConfig,
    columns,
    loading,
    apiMethod,
    childApiMethod,
    groupBy
  } = options

  /**
   * 计算表格高度
   */
  const computedHeight = computed(() => {
    if (typeof height === 'number') {
      return height
    }
    if (height === '100%') {
      return '100%'
    }
    return 'auto'
  })

  /**
   * 处理列配置（添加默认编辑配置）
   */
  const processedColumns = computed(() => {
    let _columns: any[] = JSON.parse(JSON.stringify(columns.value))
    _columns[0].treeNode = true
    _columns.unshift({
      type: 'checkbox'
    })
    console.log('columns', _columns)
    return _columns.map((col) => {
      if (!col.type) col.type = ColumnFieldType.Text
      if (col.field === 'name') col.rowGroupNode = true
      const colConfig = { ...col, aggFunc: true, ...rendererManager.getColumnConfig(col.type as ColumnFieldType, col.properties, col.properties) }
      colConfig.slots = {
        footer: 'footerCount',
        header: 'header'
      }
      // 数字类型默认右对齐
      if (col.type === ColumnFieldType.Number || col.type === ColumnFieldType.Currency || col.type === ColumnFieldType.Percent) {
        colConfig.align = 'right'
      }
      return colConfig
    })
  })
  const processedEditRules = computed(() => {
    let _columns: any[] = JSON.parse(JSON.stringify(columns.value))

    return _columns.reduce((acc, col) => {
      acc[col.field] = rendererManager.getRules(col.type as ColumnFieldType)
      if (col.isRequired) {
        acc[col.field].push({ required: true, message: '必填项' })
      }
      return acc
    }, {})
  })
  // function updateColumns(newRules: any, _columns: any[]) {
  //   const _newRules = newRules instanceof Array ? newRules : newRules.value
  //   const columnIndexs: number[] = []
  //   if (_newRules) {
  //     _columns.forEach((col, index) => {
  //       const rule = _newRules.find((rule: any) => rule.field === col.field)
  //       if (rule) {
  //         col.rowGroupNode = true
  //         columnIndexs.push(index)
  //       } else {
  //         col.rowGroupNode = false
  //       }
  //     })
  //   }
  //   columnIndexs.forEach((colIndex, index) => {
  //     const _col = _columns.splice(colIndex, 1)[0]
  //     _columns.splice(index, 0, _col)
  //   })
  //   return _columns
  // }
  /**
   * 表格配置
   */
  const gridOptions = computed<VxeGridProps>(() => {
    const options: VxeGridProps | any = {
      height: computedHeight.value,
      autoResize,
      stripe,
      border,
      resizable,
      keepSource,
      rowId,
      loading: loading.value,
      columns: processedColumns.value as any,
      editRules: processedEditRules.value,
      // 虚拟滚动配置 - 性能优化
      // 注意：虚拟滚动与树形懒加载存在兼容性问题，当启用树形结构时，建议禁用虚拟滚动或使用固定行高
      virtualYConfig: {
        oSize: 20,
        rSize: 100,
        enabled: true,
        gt: 20 // 大于20条数据时启用虚拟滚动
      },
      scrollX: {
        enabled: true
      },
      // 工具栏配置
      toolbarConfig: {
        visible: false
      },
      sortConfig: {
        showIcon: false
      },
      // 分组配置
      showFooter: true,
      footerData: [{ type: 'footerData' }],
      checkboxConfig: {
        highlight: true,
        isShiftKey: true,
        range: true
      },
      'footer-cell-config': {
        height: 32
      },
      'sort-config': {
        multiple: true,
        showIcon: false,
        defaultSort: {
          field: 'age',
          order: 'asc'
        }
      },
      treeConfig: {
        transform: false,
        rowField: 'id',
        parentField: 'parentId',
        lazy: true,
        hasChild: 'isAggregate',
        loadMethod: treeLoadData
      },
      // 行配置 - 确保行高计算正确，避免虚拟滚动白屏
      rowConfig: {
        keyField: rowId,
        isHover: true,
        useKey: true
      }
    }
    // 编辑配置
    // 检查是否有列配置了 editRender
    const hasEditRender = processedColumns.value.some((col) => col.editRender)

    // 如果显式传递了 editConfig 或者有列配置了 editRender，则启用编辑功能
    if (!!editConfig || hasEditRender) {
      options.editConfig = {
        trigger: 'dblclick',
        mode: 'cell',
        showIcon: false,
        showStatus: false,
        ...((editConfig as any) || {}),
        beforeEditMethod: ({ row }: any) => {
          return row.isAggregate !== true
        }
      }
    }
    if (apiMethod) {
      options.proxyConfig = {
        ajax: {
          query: loadData
        }
      }
    }
    return options
  })
  function loadData(pageParams: any) {
    const gb: any = (options?.groupBy as any)?.value
    return apiMethod(pageParams, gb.length > 0 ? gb : null)
  }
  async function treeLoadData(params: any) {
    try {
      console.log('treeLoadData params', params)
      if (!childApiMethod) {
        console.warn('childApiMethod is not defined')
        return []
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(childApiMethod(params))
        }, 100)
      })
    } catch (error) {
      console.error('treeLoadData error:', error)
      return []
    }
  }
  watch(
    () => options.groupBy,
    (newGroupBy) => {
      console.log('newGroupBy', newGroupBy)
      gridRef.value?.commitProxy('reload')
    },
    { immediate: true, deep: true }
  )
  return {
    gridOptions
  }
}
