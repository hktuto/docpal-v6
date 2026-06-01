// composables/useTableConfig.ts
import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import type { ColumnConfig } from '../types/column-context'
import { ColumnFieldType } from '../types/column-types'
import { rendererManager } from '../renderers/registry-manager'

export interface TableConfigOptions {
  extraColumnConfig?: {
    columns: ColumnConfig[]
    deleteColumn: (fieldId: string) => Promise<void> | void
    updateColumn: (fieldName: string, updates: Partial<ColumnConfig>) => Promise<void> | void
    addColumn: (columns: ColumnConfig[], targetFieldId?: string, dragPos?: 'left' | 'right') => Promise<void> | void
    updateViewColumnCountMethod?: (fieldId: string, countMethod: string) => Promise<void>
    columnFilterRules: Ref<any[]>
    columnGroupRules: Ref<any[]>
    columnSortRules: Ref<any[]>
    menuId?: Ref<string> | string
  }
  canEditTable?: boolean
  height?: string | number
  autoResize?: boolean
  stripe?: boolean
  border?: boolean
  resizable?: boolean
  keepSource?: boolean
  rowId?: string
  editConfig?: boolean | object
  loading: Ref<boolean> | ComputedRef<boolean>
  silentRefreshing?: Ref<boolean>
  apiMethod: Function
  childApiMethod?: Function
  cellClassName?: (params: { row: any; column: any; rowIndex: number; columnIndex: number }) => string
}

const CHECKBOX_COLUMN = {
  type: 'checkbox',
  width: 60,
  fixed: 'left',
  slots: { checkbox: 'checkboxIndex' },
  headerAlign: 'right',
  align: 'center'
} as const

const SYSTEM_READONLY_FIELD_TYPES = [
  ColumnFieldType.CreatedTime,
  ColumnFieldType.LastModifiedTime,
  ColumnFieldType.CreatedBy,
  ColumnFieldType.LastModifiedBy
]

const DISABLED_EDIT_FIELD_TYPES = [
  ...SYSTEM_READONLY_FIELD_TYPES,
  ColumnFieldType.VirtualColumn,
  ColumnFieldType.Formula,
  ColumnFieldType.Checkbox,
  ColumnFieldType.Rating
]

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
  /** 刷新前快照：reload 后 getTreeExpandRecords 常为空，深层 key 会丢失 */
  const snapshotExpandRowKeys = ref<string[]>([])
  const lockedRowCell = useState<any[]>('hocuspocus-locks', () => [])

  const isGroupingEnabled = computed(() => {
    const rules = options.extraColumnConfig?.columnGroupRules?.value
    return !!rules?.length
  })

  const computedHeight = computed(() => {
    if (typeof height === 'number' || height === '100%') {
      return height
    }
    return 'auto'
  })

  const processedColumns = computed(() => {
    if (!columns.value?.length) {
      return []
    }

    const sourceColumns = JSON.parse(JSON.stringify(columns.value)) as any[]
    sourceColumns.unshift({ ...CHECKBOX_COLUMN })

    const data = sourceColumns
      .map((col: any) => {
        if (col.type === 'checkbox') {
          return col
        }

        if (!col.business_type) {
          col.business_type = ColumnFieldType.Text
        }

        const colConfig = {
          ...col,
          field: col.field_name,
          title: col.field_name_alias,
          aggFunc: true,
          colId: col.field_name,
          ...rendererManager.getColumnConfig(col.business_type as ColumnFieldType, col.display_structure, col.display_structure),
          slots: {
            footer: 'footerCount',
            header: 'header'
          }
        }

        if (col.business_type === ColumnFieldType.Number) {
          colConfig.align = 'right'
        }

        return colConfig
      })
      .filter((col: any) => !col.hidden)

    if (isGroupingEnabled.value && data[1]) {
      data[1].treeNode = true
    }

    return data
  })

  const processedEditRules = computed(() => {
    if (!columns.value) {
      return []
    }

    const sourceColumns = JSON.parse(JSON.stringify(columns.value)) as any[]
    return sourceColumns.reduce((acc: any, col: any) => {
      acc[col.field] = rendererManager.getRules(col.type as ColumnFieldType)
      if (col.isRequired) {
        acc[col.field].push({ required: true, message: '必填项' })
      }
      return acc
    }, {})
  })

  const columnLockSignature = computed(() => {
    return (lockedRowCell.value ?? [])
      .filter((lock: any) => lock.editingColumn)
      .map((lock: any) => `${lock.menuId || ''}:${lock.cellId || ''}`)
      .join('|')
  })

  function getCurrentMenuId() {
    const menuId = options.extraColumnConfig?.menuId
    return (menuId as Ref<string> | undefined)?.value || menuId
  }

  function isSameMenu(lock: any) {
    const currentMenuId = getCurrentMenuId()
    return !currentMenuId || !lock.menuId || lock.menuId === currentMenuId
  }

  function getColumnFieldKey(column: any) {
    return column?.field || column?.property || column?.colId
  }

  function isColumnConfigEditing(column: any) {
    const fieldKey = getColumnFieldKey(column)
    if (!fieldKey) {
      return false
    }
    return lockedRowCell.value?.some((lock: any) => isSameMenu(lock) && lock.editingColumn && lock.cellId === fieldKey) ?? false
  }

  function isCellEditLocked(row: any, column: any) {
    return (
      lockedRowCell.value?.some(
        (lock: any) =>
          isSameMenu(lock) &&
          (
            (lock.editingRow && lock.rowId === row.id) ||
            (lock.editingCell && lock.cellId === getColumnFieldKey(column) && lock.rowId === row.id) ||
            (lock.editingColumn && lock.cellId === getColumnFieldKey(column))
          )
      ) ?? false
    )
  }

  function getCellClassName(params: { row: any; column: any; rowIndex: number; columnIndex: number }) {
    const classNames = [cellClassName?.(params)]
    if (isColumnConfigEditing(params.column)) {
      classNames.push('column-config-editing')
    }
    return classNames.filter(Boolean).join(' ')
  }

  function getHeaderCellClassName({ column }: any) {
    return isColumnConfigEditing(column) ? 'column-config-editing' : ''
  }

  // --- 树分组展开状态恢复 ---
  // 树分组使用 treeConfig，展开状态由树展开 API 维护；
  // getRowExpandRecords / setRowExpand 对应行展开（expand 列），与树无关。

  function collectExpandedRowKeysFromGrid(): Array<string | number> {
    const grid = gridRef.value
    if (!grid) {
      return [...expandedRowKeys.value]
    }

    const keySet = new Set<string>()
    const keys: Array<string | number> = []

    function addKey(key: string | number | undefined | null) {
      if (key === undefined || key === null || keySet.has(String(key))) {
        return
      }
      keySet.add(String(key))
      keys.push(key)
    }

    function walkRows(rows: any[]) {
      for (const row of rows || []) {
        if (grid.isTreeExpandByRow?.(row)) {
          addKey(row[rowId])
        }
        if (row.children?.length) {
          walkRows(row.children)
        }
      }
    }

    walkRows(grid.getTableData?.()?.fullData ?? [])
    for (const row of grid.getTreeExpandRecords?.() ?? []) {
      addKey(row?.[rowId])
    }
    return keys
  }

  function updateExpandedRows() {
    if (!isGroupingEnabled.value) {
      return
    }
    const keys = collectExpandedRowKeysFromGrid()
    expandedRowKeys.value = keys
    snapshotExpandRowKeys.value = keys.map(String)
  }

  function getExpandedKeySet() {
    const keys = snapshotExpandRowKeys.value.length ? snapshotExpandRowKeys.value : expandedRowKeys.value
    return new Set(keys.map(String))
  }

  async function expandSavedKeysAmongRows(candidateRoots: any[]) {
    const grid = gridRef.value
    const rowKeySet = getExpandedKeySet()
    if (!grid || !rowKeySet.size || !candidateRoots.length) {
      return
    }

    const rowsToExpand: any[] = []
    const seen = new Set<string>()

    function tryAddRow(row: any) {
      if (!row) {
        return
      }
      const key = String(row[rowId])
      if (!rowKeySet.has(key) || seen.has(key) || grid.isTreeExpandByRow?.(row)) {
        return
      }
      seen.add(key)
      rowsToExpand.push(row)
    }

    function walkCandidates(rows: any[]) {
      for (const row of rows || []) {
        tryAddRow(row)
        if (row.children?.length) {
          walkCandidates(row.children)
        }
      }
    }

    walkCandidates(candidateRoots)
    if (!rowsToExpand.length) {
      return
    }
    await nextTick()
    grid.setTreeExpand?.(rowsToExpand, true)
  }

  async function restoreExpandedChildrenUnderRow(parentRow: any) {
    const grid = gridRef.value
    const rowKeySet = getExpandedKeySet()
    if (!grid || !parentRow || !rowKeySet.size) {
      return
    }

    await nextTick()
    let children: any[] = parentRow.children ?? []
    if (!children.length) {
      await nextTick()
      children = parentRow.children ?? []
    }
    if (!children.length) {
      return
    }

    const rowsToExpand = children.filter(
      (child) => child?.hasChild && rowKeySet.has(String(child[rowId])) && !grid.isTreeExpandByRow?.(child)
    )
    if (!rowsToExpand.length) {
      return
    }
    await nextTick()
    grid.setTreeExpand?.(rowsToExpand, true)
  }

  async function restoreExpandedRowsFromGridRoot() {
    if (!isGroupingEnabled.value || !getExpandedKeySet().size) {
      return
    }
    await nextTick()
    const fullData: any[] = gridRef.value?.getTableData?.()?.fullData ?? []
    await expandSavedKeysAmongRows(fullData)
  }

  const gridOptions = computed<VxeGridProps>(() => {
    void columnLockSignature.value

    const gridConfig: VxeGridProps | any = {
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
          return column.type === 'checkbox'
        }
      },
      virtualYConfig: {
        enabled: true,
        mode: 'wheel',
        gt: 0
      },
      virtualXConfig: {
        enabled: true,
        gt: 0
      },
      toolbarConfig: { visible: false },
      sortConfig: {
        multiple: true,
        showIcon: false
      },
      showFooter: true,
      pagerConfig: {
        enabled: true,
        pageSize: 100
      },
      footerData: [{ type: 'footerData' }],
      checkboxConfig: {
        checkStrictly: true,
        showHeader: false,
        highlight: true,
        visibleMethod: ({ row }: any) => !row.__deleted
      },
      'footer-cell-config': { height: 32 },
      menuConfig: { enabled: true },
      rowConfig: {
        keyField: rowId,
        isHover: true,
        useKey: true,
        isCurrent: true
      },
      cellClassName: getCellClassName,
      headerCellClassName: getHeaderCellClassName,
      footerCellClassName: getHeaderCellClassName
    }

    if (isGroupingEnabled.value) {
      gridConfig.treeConfig = {
        rowField: rowId,
        parentField: 'parentId',
        lazy: true,
        hasChildField: 'hasChild',
        loadMethod: treeLoadData,
        expandAll: false,
        reserve: true
      }
      gridConfig.virtualYConfig = { enabled: false }
    }

    const hasEditRender = processedColumns.value.some((col: any) => col.editRender)
    if (editConfig || hasEditRender) {
      gridConfig.editConfig = {
        trigger: 'dblclick',
        mode: 'cell',
        showIcon: false,
        showStatus: false,
        ...((editConfig as any) || {}),
        beforeEditMethod: ({ row, column, $grid }: any) => {
          if (!canEditTable) {
            return false
          }
          const isLock = isCellEditLocked(row, column)
          const canEdit = !row.hasChild && !DISABLED_EDIT_FIELD_TYPES.includes(column.type) && !isLock
          if (canEdit) {
            $grid.dispatchEvent('start-edit', { row, column })
          }
          return canEdit
        }
      }
    }

    if (apiMethod) {
      gridConfig.proxyConfig = {
        showLoading: !silentRefreshing?.value,
        ajax: { query: loadData }
      }
    }

    return gridConfig
  })

  async function loadData(args: any) {
    const { page } = args
    const pageParams = {
      pageSize: page.pageSize,
      pageNum: page.currentPage - 1
    }
    const { entryList, totalSize } = await apiMethod(pageParams)

    if (snapshotExpandRowKeys.value.length) {
      nextTick(() => {
        void restoreExpandedRowsFromGridRoot()
      })
    }

    return {
      result: entryList,
      page: { total: totalSize }
    }
  }

  async function treeLoadData(params: any) {
    const { row } = params
    try {
      const rowLevel = params.$table.getTreeRowLevel(row)
      const data = (await childApiMethod?.({ ...params.row, __level: rowLevel })) ?? []
      nextTick(async () => {
        gridRef.value?.recalculate?.(true)
        await restoreExpandedChildrenUnderRow(row)
      })
      return data
    } catch (error) {
      console.error('treeLoadData error:', error)
      return []
    }
  }

  watch(columnLockSignature, () => {
    nextTick(() => {
      const grid = gridRef.value
      grid?.recalculate?.(true)
      grid?.refreshColumn?.()
    })
  })

  watch(
    () => [
      options.extraColumnConfig?.columnGroupRules,
      options.extraColumnConfig?.columnFilterRules,
      options.extraColumnConfig?.columnSortRules
    ],
    () => {
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
