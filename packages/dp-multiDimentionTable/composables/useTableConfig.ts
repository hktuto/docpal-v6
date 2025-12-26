// composables/useTableConfig.ts
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { VxeGridProps, VxeGridInstance } from 'vxe-table'
import { VxeUI } from 'vxe-pc-ui'
import type { ColumnConfig } from './useColumns'
import { ColumnFieldType } from './useColumns'
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
export function useTableConfig(options: TableConfigOptions) {
  const gridRef = ref<VxeGridInstance>()
  const {
    height = '100%',
    autoResize = true,
    stripe = true,
    border = true,
    resizable = true,
    keepSource = true,
    rowId = 'id',
    editConfig,
    groupBy = [],
    columns,
    loading,
    apiMethod
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
    return columns.value.map((col) => {
      if (!col.type) col.type = ColumnFieldType.Text
      const colConfig = { ...col, ...rendererManager.getColumnConfig(col.type as ColumnFieldType, col.property, col.property) }
      return colConfig
    })
  })

  /**
   * 计算分组字段
   */
  const computedGroupBy = computed(() => {
    if (!groupBy) return undefined
    const groupByValue = groupBy instanceof Array ? groupBy : groupBy.value
    return groupByValue.length > 0 ? groupByValue : undefined
  })

  /**
   * 表格配置
   */
  const gridOptions = computed<VxeGridProps>(() => {
    console.log('processedColumns', processedColumns.value)
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
      // 分组配置
      groupBy: computedGroupBy.value
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
          mode: editConfigObj.mode || 'cell'
        }
      } else {
        options.editConfig = { trigger: 'click', mode: 'cell' }
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

  return {
    gridRef,
    gridOptions,
    processedColumns
  }
}
