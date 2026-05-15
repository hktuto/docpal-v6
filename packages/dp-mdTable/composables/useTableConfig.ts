// composables/useTableConfig.ts
import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue'
import type { VxeGridProps, VxeGridInstance } from 'vxe-table'
import { VxeUI } from 'vxe-pc-ui'
import type { ColumnConfig } from '../types/column-context'
import { ColumnFieldType } from '../types/column-types'
// 初始化注册管理器
import { rendererManager } from '../renderers/registry-manager'
rendererManager.registerAllRenderers()

export interface TableConfigOptions {
  extraColumnConfig?: {
    columns: ColumnConfig[]
    deleteColumn: (column: ColumnConfig) => void
    updateColumn: (column: ColumnConfig) => void
    addColumn: (column: ColumnConfig) => void
    updateViewColumnCountMethod?: (fieldId: string, countMethod: string) => Promise<void>
    columnFilterRules: Ref<any[]>
    columnGroupRules: Ref<any[]>
    columnSortRules: Ref<any[]>
  }
  /** 是否可编辑表格 */
  canEditTable?: boolean
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
  /** 列配置 */
  /** 加载状态 */
  loading: Ref<boolean> | ComputedRef<boolean>
  /** 静默刷新状态：刷新数据但不显示 loading */
  silentRefreshing?: Ref<boolean>
  apiMethod: Function
  /** 子节点加载方法 */
  childApiMethod?: Function
  /** 单元格类名函数 */
  cellClassName?: (params: { row: any; column: any; rowIndex: number; columnIndex: number }) => string
}

/**
 * 表格配置管理 Composable
 * 封装 VxeGrid 的配置逻辑
 */
export function useTableConfig(options: TableConfigOptions, gridRef: any) {
  const {
    canEditTable = false,
    height = '100%',
    autoResize = true,
    stripe = true,
    border = true,
    resizable = true,
    keepSource = true,
    rowId = 'id',
    editConfig,
    loading,
    silentRefreshing,
    apiMethod,
    childApiMethod,
    cellClassName
  } = options
  const { columns } = toRefs(options.extraColumnConfig as any)
  const expandedRowKeys = ref<Array<string | number>>([])
  const defaultTreeExpandRowKeys: Array<string | number> = []
  // console.log('columns', columns)
  // console.log('deleteColumn', deleteColumn)
  // console.log('updateColumn', updateColumn)
  // console.log('addColumn', addColumn)
  const currentView = ref([])
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
    console.log('columns', columns)
    if (!columns.value) {
      return []
    }
    const _columns = JSON.parse(JSON.stringify(columns.value ?? []))
    if (_columns.length === 0) {
      return []
    }
    _columns.unshift({
      type: 'checkbox',
      width: 60,
      fixed: 'left',
      slots: {
        checkbox: 'checkboxIndex'
      },
      headerAlign: 'right',
      align: 'center'
    })
    const data = _columns
      .map((col: any) => {
        if (col.type === 'checkbox') return col

        if (!col.business_type) col.business_type = ColumnFieldType.Text
        // if (col.field === 'name') col.rowGroupNode = true
        const colConfig = {
          ...col,
          field: col.field_name,
          title: col.field_name_alias,
          aggFunc: true,
          colId: col.field_name,
          ...rendererManager.getColumnConfig(col.business_type as ColumnFieldType, col.display_structure, col.display_structure)
        }
        colConfig.slots = {
          footer: 'footerCount',
          header: 'header'
        }
        // 数字类型默认右对齐
        if (col.business_type === ColumnFieldType.Number) {
          colConfig.align = 'right'
        }
        return colConfig
      })
      .filter((col: any) => !col.hidden)
    if (isGroupingEnabled.value) {
      data[1].treeNode = true
    }
    console.log('data', data)
    return data
  })
  const processedEditRules = computed(() => {
    if (!columns.value) {
      return []
    }
    const _columns = JSON.parse(JSON.stringify(columns.value ?? []))
    return _columns.reduce((acc: any, col: any) => {
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
  const isGroupingEnabled = computed(() => {
    return (
      !!options.extraColumnConfig?.columnGroupRules &&
      options.extraColumnConfig?.columnGroupRules.value &&
      options.extraColumnConfig?.columnGroupRules.value.length > 0
    )
  })
  /**
   * 树分组用的是 treeConfig，展开状态由「树展开」API 维护；
   * getRowExpandRecords / setRowExpand 只对应「行展开」（expand 列 / expandConfig），与树无关，故在树模式下会一直为空。
   */
  function updateExpandedRows() {
    if (!isGroupingEnabled.value) {
      return
    }
    const rows: any[] = gridRef.value?.getTreeExpandRecords?.() ?? []
    expandedRowKeys.value = rows.map((row) => row?.[rowId]).filter((key): key is string | number => key !== undefined && key !== null)
  }
  async function restoreExpandedRows(rows: any[]) {
    if (!isGroupingEnabled.value || !rows.length) {
      return
    }
    const rowKeys = [...new Set([...defaultTreeExpandRowKeys, ...expandedRowKeys.value])]
    const rowKeySet = new Set(rowKeys.map(String))
    const rowsToExpand = rows.filter((row) => rowKeySet.has(String(row?.[rowId])))
    if (!rowsToExpand.length) {
      return
    }
    await nextTick()
    gridRef.value?.setTreeExpand?.(rowsToExpand, true)
  }
  const gridOptions = computed<VxeGridProps>(() => {
    const options: VxeGridProps | any = {
      height: computedHeight.value,
      autoResize,
      stripe,
      border,
      resizable,
      keepSource,
      rowId,
      loading: silentRefreshing?.value ? false : loading.value,
      columns: processedColumns.value as any,
      editRules: processedEditRules.value,
      columnConfig: {
        drag: true,
        minWidth: 150
      },
      columnDragConfig: {
        disabledMethod({ column }: any) {
          if (column.type === 'checkbox') {
            return true
          }
          return false
        }
      },
      // 虚拟滚动配置 - 性能优化
      // 注意：虚拟滚动与树形懒加载存在兼容性问题，当启用树形结构时，建议禁用虚拟滚动或使用固定行高
      virtualYConfig: {
        enabled: true,
        mode: 'wheel',
        gt: 0 // 大于20条数据时启用虚拟滚动
      },
      virtualXConfig: {
        enabled: true,
        gt: 0
      },
      'virtual-x-config': {
        enabled: true,
        gt: 0
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
      pagerConfig: {
        enabled: true,
        // pageSize : params.pageSize || 20
        pageSize: 100
      },
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
      menuConfig: {
        enabled: true
      },
      // 行配置 - 固定行高确保虚拟滚动正常工作
      rowConfig: {
        keyField: rowId,
        isHover: true,
        useKey: true,
        isCurrent: true
      },
      // 单元格类名配置 - 用于更新状态视觉反馈
      cellClassName: cellClassName || undefined
    }

    if (isGroupingEnabled.value) {
      options.treeConfig = {
        rowField: rowId,
        parentField: 'parentId',
        lazy: true,
        hasChildField: 'hasChild',
        loadMethod: treeLoadData,
        expandAll: false,
        reserve: true,
        expandRowKeys: defaultTreeExpandRowKeys
      }
      // Must disable virtual scroll when using tree config with lazy loading
      options.virtualYConfig = { enabled: false }
    }
    // 编辑配置
    // 检查是否有列配置了 editRender
    const hasEditRender = processedColumns.value.some((col: any) => col.editRender)

    // 如果显式传递了 editConfig 或者有列配置了 editRender，则启用编辑功能
    if (!!editConfig || hasEditRender) {
      const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
      const disabledFields = [...systemFieldsTypes, ColumnFieldType.VirtualColumn, ColumnFieldType.Formula, ColumnFieldType.Checkbox, ColumnFieldType.Rating]
      options.editConfig = {
        trigger: 'dblclick',
        mode: 'cell',
        showIcon: false,
        showStatus: false,
        ...((editConfig as any) || {}),
        beforeEditMethod: ({ row, column, $grid }: any) => {
          const lockedRowCell = useState<any[]>('hocuspocus-locks', () => [])

          // user have no permission to edit
          if(!canEditTable) return false
          let isLock = false
          if (lockedRowCell.value && lockedRowCell.value.length) {
            isLock = lockedRowCell.value.some(
              (l: any) => (l.editingRow && l.rowId === row.id) || (l.editingCell && l.cellId === column.field && l.rowId === row.id)
            )
          }
          const value = !row.hasChild && !disabledFields.includes(column.type) && !isLock
          if (value) {
            // dispatch event to parent
            $grid.dispatchEvent('start-edit', { row, column })
          }
          return value
        }
      }
    }
    if (apiMethod) {
      options.proxyConfig = {
        showLoading: !silentRefreshing?.value,
        ajax: {
          query: loadData
        }
      }
    }
    return options
  })

  async function loadData(args: any) {
    const { page } = args
    let pageParams: any = {
      pageSize: page.pageSize,
      pageNum: page.currentPage - 1
    }
    const { entryList, totalSize } = await apiMethod(pageParams)
    void restoreExpandedRows(entryList)
    return {
      result: entryList,
      page: {
        total: totalSize
      }
    }
  }
  async function treeLoadData(params: any) {
    return new Promise<any[]>(async (resolve) => {
      try {
        const { $table, row } = params
        const rowLevel = $table.getTreeRowLevel(row)
        const data = await childApiMethod?.({ ...params.row, __level: rowLevel })
        console.log(data)
        resolve(data)
      } catch (error) {
        console.error('treeLoadData error:', error)
        resolve([])
      }
    })
  }
  watch(
    () => [options.extraColumnConfig?.columnGroupRules, options.extraColumnConfig?.columnFilterRules, options.extraColumnConfig?.columnSortRules],
    ([newColumnGroupRules, newColumnFilterRules, newColumnSortRules]) => {
      if (silentRefreshing?.value) {
        return
      }
      gridRef.value?.commitProxy('reload')
    },
    { deep: true }
  )
  return {
    gridOptions,
    updateExpandedRows
  }
}
