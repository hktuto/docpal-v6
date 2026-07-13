export interface ContextMenuOption {
  label: string
  icon: string
  visible?: boolean
  disabled?: boolean
  onClick: () => void | Promise<void>
}

export interface RowContextMenuTriggerParams {
  event: MouseEvent
  row: any
  rowIndex?: number
  column?: any
}

export interface RowContextMenuClickContext {
  row: any
  selectedRows: any[]
  refresh: () => void | Promise<void>
}

export interface RowContextMenuEventItem {
  label: string
  icon?: string
  visible?: boolean | ((ctx: RowContextMenuClickContext) => boolean)
  disabled?: boolean | ((ctx: RowContextMenuClickContext) => boolean)
  onClick: (ctx: RowContextMenuClickContext) => void | Promise<void>
}

export type RowContextMenuEventList =
  | MaybeRef<RowContextMenuEventItem[]>
  | ((ctx: RowContextMenuClickContext) => RowContextMenuEventItem[] | Promise<RowContextMenuEventItem[]>)

export interface RowContextMenuTableRef {
  gridRef?: Ref<{ getCheckboxRecords?: () => any[] } | undefined> | { getCheckboxRecords?: () => any[] }
  clearCheckboxRow?: () => void
  refreshTableData?: (options?: { silent?: boolean; keepPage?: boolean }) => Promise<void>
  refresh?: () => void | Promise<void>
}

export interface UseRowContextMenuActionsOptions {
  tableRef: MaybeRef<RowContextMenuTableRef | undefined>
  eventList: RowContextMenuEventList
}

function resolveGridInstance(table?: RowContextMenuTableRef | null) {
  if (!table?.gridRef) {
    return undefined
  }
  const gridRef = table.gridRef
  return gridRef && typeof gridRef === 'object' && 'value' in gridRef ? gridRef.value : gridRef
}

export function getSelectedRowsFromTableRef(tableRef: MaybeRef<RowContextMenuTableRef | undefined>) {
  const grid = resolveGridInstance(toValue(tableRef))
  return grid?.getCheckboxRecords?.() ?? []
}

function clearSelectionFromTableRef(tableRef: MaybeRef<RowContextMenuTableRef | undefined>) {
  toValue(tableRef)?.clearCheckboxRow?.()
}

function createRefreshFromTableRef(tableRef: MaybeRef<RowContextMenuTableRef | undefined>) {
  return async () => {
    const table = toValue(tableRef)
    if (!table) {
      return
    }
    if (typeof table.refreshTableData === 'function') {
      await table.refreshTableData({ silent: true, keepPage: true })
      return
    }
    if (typeof table.refresh === 'function') {
      await table.refresh()
    }
  }
}

function createClickContext(
  row: any,
  tableRef: MaybeRef<RowContextMenuTableRef | undefined>
): RowContextMenuClickContext {
  return {
    row,
    selectedRows: getSelectedRowsFromTableRef(tableRef),
    refresh: createRefreshFromTableRef(tableRef)
  }
}

function resolveMenuFlag(
  value: boolean | ((ctx: RowContextMenuClickContext) => boolean) | undefined,
  ctx: RowContextMenuClickContext,
  defaultValue: boolean
) {
  if (value === undefined) {
    return defaultValue
  }
  return typeof value === 'function' ? value(ctx) : value
}

function toMenuOptions(
  eventList: RowContextMenuEventItem[],
  ctx: RowContextMenuClickContext,
  close: () => void
): ContextMenuOption[] {
  return eventList
    .filter((item) => resolveMenuFlag(item.visible, ctx, true))
    .map((item) => ({
      label: item.label,
      icon: item.icon ?? 'lucide:circle',
      disabled: resolveMenuFlag(item.disabled, ctx, false),
      onClick: async () => {
        try {
          await item.onClick(ctx)
        } finally {
          close()
        }
      }
    }))
}

export function useRowContextMenuActions(options: UseRowContextMenuActionsOptions) {
  const contextMenuRef = ref<{ open: (event: MouseEvent, options: ContextMenuOption[]) => void; close: () => void }>()

  async function handleRowContextMenu(params: RowContextMenuTriggerParams) {
    const { event, row } = params
    if (!row?.id) {
      return
    }
 
    const ctx = createClickContext(row, options.tableRef)

    if (ctx.selectedRows.length > 0) {
      const isInSelected = ctx.selectedRows.some((item) => item.id === row.id)
      if (!isInSelected) {
        clearSelectionFromTableRef(options.tableRef)
        return
      }
    }

    const eventList =
      typeof options.eventList === 'function' ? await options.eventList(ctx) : toValue(options.eventList)
    const close = () => contextMenuRef.value?.close()
    const menuOptions = toMenuOptions(eventList, ctx, close)

    if (menuOptions.length === 0) {
      return
    }
    contextMenuRef.value?.open(event, menuOptions)
  }

  return {
    contextMenuRef,
    handleRowContextMenu
  }
}
