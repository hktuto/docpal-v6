import { useEventBus, EventType, emitBus } from 'eventbus'

import { gatewayApi } from 'api'
import type { VxeGridProps, VxeGridListeners, VxeGridPropTypes, VxeTableDefines, VxeTablePropTypes, VxeGridInstance, VxeGridDefines } from 'vxe-table'
import { useUserPreference } from '../../authApp/composables/useAuth'

export type TableActionsParams = {
  row: any
}
export interface TableMenuActions extends VxeTableDefines.MenuChildOption {
  name: string
  children?: TableMenuActions[]
  action?: (params: TableActionsParams) => void
}
export type TableMenuValidateMethodParams = {
  type?: string
  options: TableMenuActions[][]
  columns: VxeGridPropTypes.Columns
  row?: any
  rowIndex?: number
  column?: VxeTableDefines.ColumnInfo
  columnIndex?: number
  event?: MouseEvent
}
export type TableMenuValidataMethod = (params: TableMenuValidateMethodParams) => TableMenuActions[][]
export interface UseVxeTableParams<R = any> {
  id: string
  height?: string // 'auto' | number
  api?: Function
  remoteSort?: boolean
  remoteFilter?: boolean
  customeToolBar?: boolean
  defaultSort?: { field: string; order: VxeTablePropTypes.SortOrder }[]
  columns: VxeGridPropTypes.Columns<R>
  saveColumnOrder?: boolean
  virtualScroll?: boolean
  pageSize?: number
  refresh?: boolean
  zoom?: boolean
  dblClickAction?: ({ row, column, event }: any) => void
  headerActions?: TableMenuActions[][]
  footerActions?: TableMenuActions[][]
  bodyActions?: TableMenuActions[][]
  permissionMethod?: (params: PermissionMethodParams) => { visible: boolean; disabled: boolean }
  asyncPermission?: ({ row }: any) => Promise<any>
  dragConfig?: {
    dragend?: (params: any) => void
  }
  optionalConfig?: VxeGridProps<R>
  selectChangeHander?: (selectedRows: any[], selectedRow?: any) => void
  optionalEvent?: VxeGridListeners<R>
  childChangeHandler?: (childRows?: any[]) => void
  additionalPermission?: (params: any) => Promise<any>
  editRender?: {
    editClosed: (params: any) => any
    editRules?: any
    editConfig?: any
  }
}

export type PermissionMethodParams = { row: any; code?: string; rowIndex?: number; column?: any; additionalData?: any }

interface Config extends VxeGridProps {
  proxyConfig: VxeGridPropTypes.ProxyConfig
  data: any[]
  menuConfig: {
    header: VxeTableDefines.MenuOptions
    body: VxeTableDefines.MenuOptions
    footer: VxeTableDefines.MenuOptions
  }
}

export const useVxeTable = (params: UseVxeTableParams) => {
  // set Defalut value for params
  const {
    optionalConfig = {},
    optionalEvent = {},
    saveColumnOrder = true,
    columns = [],
    zoom = true,
    refresh = true,
    permissionMethod = (args: PermissionMethodParams) => {
      if (!args.row) {
        return { visible: true, disabled: false }
      }
      return { visible: true, disabled: false }
    },
    bodyActions: actions = [],
    selectChangeHander = (args: any) => {
      console.log('defauilt selectChangeHander, please implement')
    }
  } = params

  const tableRef = ref<VxeGridInstance<any>>()
  const tableData = ref<any>([])
  const tablePageParams = ref<any>({
    currentPage: 1,
    pageSize: 20,
    total: 0
  })
  const init = ref(false)

  const tableConfig = reactive<any>({
    ...{
      id: params.id,
      border: true,
      round: true,
      stripe: true,
      showOverflow: true,
      showHeaderOverflow: true,
      height: params.height || 'auto',
      toolbarConfig: {
        custom: saveColumnOrder,
        zoom,
        refresh,
        slots: {
          buttons: 'toolbar_buttons'
        }
      },
      class: params.id,
      columns: (columns || []).map((col) => {
        if (!col.width && !col.minWidth) {
          col.minWidth = '100px'
        }
        return col
      }),
      columnConfig: {
        resizable: true,
        useKey: true,
        drag: true
      },
      scrollY: {
        enabled: params.virtualScroll || false
      },
      pagerConfig: {
        enabled: params.virtualScroll ? false : true,
        // pageSize : params.pageSize || 20
        pageSize: getPageSize(params.id)
      },
      customConfig: {
        enabled: saveColumnOrder,
        storage: saveColumnOrder,
        restoreStore({ id }) {
          // TODO : move useUserPreference to a composable to store and cache tabel config
          try {
            // @ts-ignore
            const perference = useUserPreference()
            if (perference.value && perference.value.tableSettings && perference.value.tableSettings[id]) {
              return perference.value.tableSettings[id]
            }
          } catch (error) {
            console.error('error', error)
          }
        },
        updateStore({ id, storeData }) {
          // TODO : move useUserPreference to a composable to store and cache tabel config
          try {
            // @ts-ignore
            const perference = useUserPreference()
            if (!perference.value.tableSettings) perference.value.tableSettings = {}
            perference.value.tableSettings[id] = storeData
            // save perference
            //
            return gatewayApi.userSettings.putUserSettings({ settings: perference.value as any }, )
          } catch (error) {
            console.error('error', error)
          }
        }
      },
      sortConfig: {
        remote: params.remoteSort || false,
        defaultSort: params.defaultSort || []
      },
      proxyConfig: {
        enabled: !!params.api ? true : false,
        sort: params.remoteSort || false,
        filter: params.remoteFilter || false,
        ajax: {
          query: loadData
        }
      },
      menuConfig: {
        header: {
          options: params.headerActions || []
        },
        body: {
          options: actions || []
        },
        footer: {
          options: params.footerActions || []
        },
        className: 'contextMenuContainer',
        // vxe-table 不会 await visibleMethod；async 会返回 Promise（恒为真），未过滤项会全部显示
        visibleMethod: ({ options, column, row, rowIndex }: TableMenuValidateMethodParams) => {
          if (params.asyncPermission) return false
          let additionalData: any
          options.forEach((list) => {
            list.forEach((item) => {
              if (item.children) {
                // loop all children , and set visible and disabled
                // if all children are not visible , set iten.visible = false
                // if all children are disabled , set item.disabled = true

                item.children.forEach((child) => {
                  const permission = permissionMethod({ row, rowIndex, code: child.code, column, additionalData })
                  if(!permission){
                    child.visible = true
                    child.disabled = false
                  }else{
                    child.visible = permission.visible
                    child.disabled = permission.disabled
                  }
                })
                const allVisible = item.children.every((child) => child.visible)
                const allDisabled = item.children.every((child) => child.disabled)
                item.visible = allVisible
                item.disabled = allDisabled
              } else {
                const permission = permissionMethod({ row, rowIndex, code: item.code, column, additionalData })
                if (!permission) {
                  item.visible = true
                  item.disabled = false
                }else{
                  item.visible = permission.visible
                  item.disabled = permission.disabled
                }
              }
            })
          })

          return true
        }
      },
      rowConfig: {
        useKey: true,
        drag: params.dragConfig ? true : false
      },
      data: []
    },
    ...optionalConfig
  } as Config)
  const tableEvent = reactive<VxeGridListeners>({ ...optionalEvent })

  if (params.customeToolBar) {
    tableConfig.toolbarConfig.slots.tools = 'toolbarTools'
  }
  if (params.dragConfig) {
    if (params.dragConfig.dragend) {
      tableEvent.rowDragend = params.dragConfig.dragend
    }
  }
  // #region handle actions column
  // Step 1: add actions to tableEvent
  if (params.dblClickAction) {
    tableEvent.cellDblclick = params.dblClickAction
  }
  tableEvent.zoom = ({ type }) => {
    if (type === 'max') {
      emitBus(EventType.TABLE_ZOOM_MAX)
    } else if (type === 'revert') {
      emitBus(EventType.TABLE_ZOOM_REVERT)
    }
  }
  tableEvent.menuClick = ({ menu, type, row, column }: any) => {
    if (menu.action) {
      menu.action({ menu, row, column })
    }
  }

  async function openTableContextMenu({ row, column, rowIndex, event }: { row: any; column?: any; rowIndex?: number; event: MouseEvent }) {
    const clientX = event?.clientX ?? 0
    const clientY = event?.clientY ?? 0
    const pointerEvent = { clientX, clientY } as MouseEvent
    const CONTEXT_MENU_OPEN_BUS = useEventBus(EventType.TABLE_CONTEXT_MENU_OPEN)
    if (params.asyncPermission) {
      const asyncPermissionOptions = await visibleMethodHelper(row, actions, params)
      CONTEXT_MENU_OPEN_BUS.emit({
        row,
        column,
        rowIndex,
        options: asyncPermissionOptions,
        event: pointerEvent
      })
      return
    }
    let additionalData: any
    if (params.additionalPermission) {
      additionalData = await params.additionalPermission({ column, row, rowIndex })
    }
    const options = actions.map((list) => {
      return list.map((item) => {
        if (item.children) {
          item.children.forEach((child) => {
            const permission = permissionMethod({ row, rowIndex, code: child.code, additionalData })
            if (!permission) {
              child.visible = true
              child.disabled = false
            } else {
              child.visible = permission.visible
              child.disabled = permission.disabled
            }
          })
          item.visible = item.children.every((child) => child.visible)
          item.disabled = item.children.every((child) => child.disabled)
        } else {
          const permission = permissionMethod({ row, rowIndex, code: item.code, additionalData })
          if (!permission) {
            item.visible = true
            item.disabled = false
          } else {
            item.visible = permission.visible
            item.disabled = permission.disabled
          }
        }
        return item
      })
    })
    CONTEXT_MENU_OPEN_BUS.emit({
      row,
      column,
      rowIndex,
      options,
      event: pointerEvent
    })
  }

  // Step 2: handle body actions
  if (actions && actions.length > 0) {

    tableConfig.menuConfig.body.options = actions
    // add column to tableConfig
    const actionsColumn: any = {
      title: 'dpTable_actions',
      fixed: 'right',
      width: 80,
      type: 'html',
      formatter: ({ row }: any) => {
        return `<img src="/icons/dots.svg" style="width: 1.2rem; height: 1.2rem; cursor: pointer;" />`
      }
    }
    if (!tableConfig.columns || tableConfig.columns.length === 0) {
      tableConfig.columns = [actionsColumn]
    } else {
      tableConfig.columns.push(actionsColumn)
    }
    // add click event to action column
    tableEvent.cellClick = async ({
      row,
      rowIndex,
      $rowIndex,
      column,
      columnIndex,
      $columnIndex,
      triggerRadio,
      triggerCheckbox,
      triggerTreeNode,
      triggerExpandNode,
      $event,
      $grid,
      $table,
      cell
    }: any) => {
      if (column.type === actionsColumn.type && column.title === actionsColumn.title) {
        if (!actions) {
          throw new Error('bodyActions is required')
        }
        if (!columns) {
          throw new Error('columns is required')
        }
        await openTableContextMenu({ row, column, rowIndex, event: $event })
      }
      if (optionalEvent?.cellClick && typeof optionalEvent.cellClick === 'function') {
        optionalEvent.cellClick({
          row,
          rowIndex,
          $rowIndex,
          column,
          columnIndex,
          $columnIndex,
          triggerRadio,
          triggerCheckbox,
          triggerTreeNode,
          triggerExpandNode,
          $event,
          $grid,
          $table,
          cell
        }) as any
      }
    }
    tableEvent.scroll = (scrollParams: VxeGridDefines.ScrollEventParams) => {
      const bus = useEventBus(EventType.TABLE_CONTEXT_MENU_CLOSE)
      bus.emit()
    }
    if (params.asyncPermission) {
      const optionalCellMenu = optionalEvent?.cellMenu
      tableEvent.cellMenu = async (menuParams: any) => {
        const { row, column, rowIndex, $event } = menuParams
        $event?.preventDefault?.()
        await openTableContextMenu({ row, column, rowIndex, event: $event })
        if (typeof optionalCellMenu === 'function') {
          optionalCellMenu(menuParams)
        }
      }
    }
  }
  // Step 3: handle header actions
  if (params.headerActions && params.headerActions.length > 0) {
    tableConfig.menuConfig.header.options = params.headerActions
    tableEvent.headerCellMenu = (params) => {
      console.log('headerCellMenu', params)
    }
  }
  // Step 4: handle footer actions
  if (params.footerActions && params.footerActions.length > 0) {
    tableConfig.menuConfig.footer.options = params.footerActions
  }
  if (
    (params.headerActions && params.headerActions.length > 0) ||
    (actions && actions.length > 0) ||
    (params.footerActions && params.footerActions.length > 0)
  ) {
    tableConfig.menuConfig.enabled = true
  }

  // #endregion

  // #region handle checkbox column
  if (columns.find((item) => item.type === 'checkbox')) {
    const item = columns.find((item) => item.type === 'checkbox')
    if (item && !tableConfig.checkboxConfig) {
      tableConfig.checkboxConfig = {
        labelField: item.field,
        highlight: true,
        range: true
      }
    }

    tableEvent.checkboxChange = ({ checked, row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, $event }: any) => {
      const selectedRows = tableRef.value?.getCheckboxRecords() || []
      console.log('checkboxChange', selectedRows)
      selectChangeHander(selectedRows, { checked, row, rowIndex })
    }
    tableEvent.checkboxRangeChange = ({ $event }: any) => {
      const selectedRows = tableRef.value?.getCheckboxRecords() || []
      selectChangeHander(selectedRows)
    }
    tableEvent.checkboxAll = ({ $event, checked }: any) => {
      const selectedRows = tableRef.value?.getCheckboxRecords() || []
      selectChangeHander(selectedRows)
    }
  }
  // handle edit render
  if (params.editRender) {
    tableEvent.editClosed = async ({ row, rowIndex, $rowIndex, column, columnIndex, $columnIndex }: any) => {
      await params.editRender?.editClosed({
        row,
        rowIndex,
        $rowIndex,
        column,
        columnIndex,
        $columnIndex
      })
    }
    if (params.editRender.editRules) {
      tableConfig.editRules = params.editRender.editRules
    }
    if (params.editRender.editConfig) {
      tableConfig.editConfig = params.editRender.editConfig
    }
  }
  function cleanSelectedRows() {
    tableRef.value?.clearCheckboxRow()
    selectChangeHander([])
  }
  // #endregion

  async function loadData(args: any) {
    if (!params?.api) {
      throw new Error('params.api is required')
    }
    if (params.virtualScroll) {
      init.value = true
      const result = await params?.api(args)
      tableData.value = Array.isArray(result) ? result : (result?.result ?? [])
      return result
    }
    const { page, sorts, filters } = args
    // 默认接收 Promise<{ result: [], page: { total: 100 } }>
    let pageParams: any = {
      pageSize: page.pageSize,
      pageNum: page.currentPage - 1
    }
    if (sorts && sorts.length > 0) {
      pageParams.orderBy = sorts[0].property
      pageParams.isDesc = sorts[0].order === 'desc'
    }
    if (filters && filters.length > 0) {
      if (!pageParams.filter) pageParams.filter = {}
      filters.forEach((filter: any) => {
        pageParams.filter[filter.property] = filter.datas.join(',')
      })
    }
    const { data } = await params?.api(pageParams)
    init.value = true
    const result = Array.isArray(data) ? data : data.entryList
    tableData.value = result
    return {
      result,
      page: {
        total: data.totalSize
      }
    }
  }
  async function responsiveScrollHandler({ scrollTop, direction }: VxeGridDefines.ScrollEventParams) {
    if (!params.api) {
      return
    }
    // 不是 virtualScroll 或者 api 或者 大于 mobile 的时候不处理 scroll
    if (direction === 'bottom') {
      // 向下滚动
      await lazyLoad()
    }
  }

  async function lazyLoad() {
    if(tableConfig.loading) {
      return
    }
    if (tablePageParams.value.total && tablePageParams.value.total === tableConfig.data.length) {
      console.log('no more data')
      return
    }
    tableConfig.loading = true
    const data = await loadData({
      page: tablePageParams.value,
      sorts: [], // TODO : get sorts from config
      filters: [] // TODO : get filters from config
    })
    tableConfig.data.push(...data.result)
    tableData.value = tableConfig.data
    tablePageParams.value.total = data.page.total
    tablePageParams.value.currentPage += 1
    tableConfig.loading = false
  }

  function setupPagingnation() {
    tableConfig.pagerConfig = {
      enabled: params.virtualScroll ? false : true,
      pageSize: params.pageSize || 20
    }
    // tableConfig.proxyConfig.enabled = true;
  }
  function setupLazyLoad() {
    tableConfig.pagerConfig = {
      enabled: false
    }
    tableConfig.proxyConfig.enabled = false
    if (!tableEvent.scrollBoundary) {
      tableEvent.scrollBoundary = (scrollParams: VxeGridDefines.ScrollEventParams) => {
        responsiveScrollHandler(scrollParams)
      }
    }
    // @ts-ignore
    tableConfig.scrollY = {
      enabled: true,
      threshold: params.pageSize || 20
    }
    tableConfig.data = []
    tablePageParams.value.pageNum = 0
    tablePageParams.value.currentPage = 1
    tablePageParams.value.total = undefined
    tablePageParams.value.pageSize = params.pageSize || 20
    lazyLoad()
  }

  function reload() {
    // if virtualScroll is true, then reload the table
    if (!params.virtualScroll) {
      tableRef.value?.commitProxy('reload')
      return
    } else {
      tableRef.value?.loadData([])
      nextTick(() => {
        tableRef.value?.commitProxy('reload')
      })
    }
  }

  function query(params: any) {
    tableRef.value?.commitProxy('query', params)
  }
  let observer: any
  let blankMenuBoundEl: HTMLElement | null = null

  function isBrowseCellTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false
    return !!target.closest('.vxe-body--column, .vxe-header--column, .vxe-footer--column')
  }

  async function handleBlankContextmenu(event: MouseEvent) {
    const target = event.target as Element | null
    if (!target?.closest('.vxe-table--body-wrapper, .vxe-table--empty-place-wrapper')) return
    if (isBrowseCellTarget(target)) return
    event.preventDefault()
    await openTableContextMenu({ row: undefined, event })
  }

  function bindBlankContextmenu() {
    if (!params.asyncPermission) return
    nextTick(() => {
      const el = tableRef.value?.$el as HTMLElement | undefined
      if (!el || blankMenuBoundEl === el) return
      unbindBlankContextmenu()
      el.addEventListener('contextmenu', handleBlankContextmenu)
      blankMenuBoundEl = el
    })
  }

  function unbindBlankContextmenu() {
    blankMenuBoundEl?.removeEventListener('contextmenu', handleBlankContextmenu)
    blankMenuBoundEl = null
  }

  function tableActivated() {
    if (init.value) {
      reload()
    }
    bindBlankContextmenu()
    if (params.childChangeHandler) {
      if (observer && observer.disconnect) {
        observer.disconnect()
      }
      observer = new MutationObserver(params.childChangeHandler)
      observer.observe(tableRef.value?.$el, {
        childList: true,
        subtree: true
      })
      nextTick(() => {
        console.log('init table observer')
        if(params.childChangeHandler){
          params.childChangeHandler()
        }
      })
    }
  }
  onMounted(tableActivated)
  onActivated(tableActivated)
  onUnmounted(() => {
    unbindBlankContextmenu()
    if (observer && observer.disconnect) {
      observer.disconnect()
    }
  })
  onDeactivated(() => {
    unbindBlankContextmenu()
    if (observer && observer.disconnect) {
      observer.disconnect()
    }
  })
  //
  if (!params.virtualScroll) {
    tableEvent.pageChange = ({ pageSize }) => {
      try {
        if (!params.id) {
          throw new Error('table Id is null')
        }
        const tableSetting = (useUserPreference().value.tableSettings[params.id] ||= {})
        tableSetting.tablePageSize = pageSize
        const data = {
          id: params.id,
          storeData: tableSetting
        }
        tableConfig.customConfig.updateStore(data)
      } catch (e) {
        console.error(e)
      }
    }
  }

  return {
    tableConfig,
    tableEvent,
    tableRef,
    tableData,
    cleanSelectedRows,
    reload,
    query,
    setupLazyLoad
  }
}
async function visibleMethodHelper(row: any, options: any, params: any) {
  const permission: any = await params.asyncPermission({ row })
  const showEvent = permission.showBlank === true || row
  options.forEach((list: any) => {
    list.forEach((item: any) => {
      if (item.children) {
        item.children.forEach((child: any) => {
          child.visible = showEvent ? true : false
          child.disabled = false
          if (permission[child.code]) {
            child.visible = permission[child.code].visible
            child.disabled = permission[child.code].disabled
          }
        })
      } else {
        item.visible = showEvent ? true : false
        item.disabled = false
        if (permission[item.code]) {
          item.visible = permission[item.code].visible
          item.disabled = permission[item.code].disabled
        }
      }
    })
  })
  return options
}
function getPageSize(id: string) {
  try {
    return useUserPreference()?.value?.tableSettings[id]?.tablePageSize || 20
  } catch (error) {
    console.error(error)
    return 20
  }
}
