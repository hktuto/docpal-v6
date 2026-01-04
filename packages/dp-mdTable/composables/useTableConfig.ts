// composables/useTableConfig.ts
import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import type { VxeGridProps, VxeGridInstance } from 'vxe-table'
import { VxeUI } from 'vxe-pc-ui'
import type { ColumnConfig } from './useColumns'
import { ColumnFieldType } from './useColumns'
import { calculateCount, type CountMethod } from '../utils/tableCount'
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
    groupBy
  } = options
  const aggregateConfig = ref<any>({
    groupFields: [],
    expandGroupFields: [],
    calcValuesMethod(params: any) {
      const { column, children } = params
      // 优先使用 column.countMethod 进行计数
      if (column.countMethod) {
        return calculateCount(column.countMethod as CountMethod, column.field, children)
      }
      return ''
    }
  })
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
    return _columns.map((col) => {
      if (!col.type) col.type = ColumnFieldType.Text
      if (col.field === 'name') col.rowGroupNode = true
      const colConfig = { ...col,aggFunc: true, ...rendererManager.getColumnConfig(col.type as ColumnFieldType, col.property, col.property) }
      colConfig.slots = {
        footer: 'footerCount'
      }
      // 数字类型默认右对齐
      if (col.type === ColumnFieldType.Number || col.type === ColumnFieldType.Currency || col.type === ColumnFieldType.Percent || col.type === ColumnFieldType.AutoNumber) {
        colConfig.align = 'right'
      }
      return colConfig
    })
  })
  function updateAggregateConfig(newGroupBy: any) {
    if (!newGroupBy) {
      aggregateConfig.value.groupFields = []
      aggregateConfig.value.expandGroupFields = []
    } else {
      const _newGroupBy = newGroupBy instanceof Array ? newGroupBy : newGroupBy.value
      const _group = JSON.parse(JSON.stringify(_newGroupBy))
      const _groupFields = _group[0] instanceof String ? _group : _group.map((field: any) => field.field)
      aggregateConfig.value.groupFields = _groupFields
      aggregateConfig.value.expandGroupFields = _groupFields
      if (gridRef.value) {
        gridRef.value.setRowGroups(_groupFields)
      }
    }
    if (gridRef.value) {
      gridRef.value.commitProxy('reload')
    }
  }
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
      // 虚拟滚动配置 - 性能优化
      scrollY: {
        enabled: true,
        oSize: 50, // 每行高度
        gt: 0 // 大于0条数据时启用虚拟滚动
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
      aggregateConfig: aggregateConfig.value,
      showFooter: true,
      footerData: [
        { type: 'footerData' },
      ],
    }
    // 编辑配置
    // 检查是否有列配置了 editRender
    const hasEditRender = processedColumns.value.some((col) => col.editRender)

    // 如果显式传递了 editConfig 或者有列配置了 editRender，则启用编辑功能
    if (editConfig || hasEditRender) {
      if (typeof editConfig === 'object' && editConfig !== null) {
        const editConfigObj = editConfig as any
        options.editConfig = {
          ...editConfigObj,
          // 默认每行可编辑
          trigger: editConfigObj.trigger || 'click',
          mode: editConfigObj.mode || 'cell',
          showIcon: false
        }
      } else {
        options.editConfig = { trigger: 'click', mode: 'cell', showIcon: false }
      }
    }
    if (apiMethod) {
      options.proxyConfig = {
        ajax: {
          query: ({ page }: any) => {
            // 默认接收 Promise<{ result: [], page: { total: 100 } }>
            return apiMethod(page)
          }
        }
      }
    }
    return options
  })

  watch(
    () => options.groupBy,
    (newGroupBy) => {
      updateAggregateConfig(newGroupBy)
    },
    { immediate: true, deep: true }
  )
  return {
    gridOptions
  }
}
