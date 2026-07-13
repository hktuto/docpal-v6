export interface ContextMenuOption {
  label: string
  icon: string
  visible?: boolean
  disabled?: boolean
  onClick: () => void | Promise<void>
}

export interface RowContextMenuParams {
  event: MouseEvent
  row: any
  rowIndex?: number
  column?: any
  selectedRows: any[]
}

export interface RowContextMenuClickContext {
  row: any
  selectedRows: any[]
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
  | ((params: RowContextMenuParams) => RowContextMenuEventItem[] | Promise<RowContextMenuEventItem[]>)

export interface UseRowContextMenuActionsOptions {
  contextMenuRef: Ref<{ open: (event: MouseEvent, options: ContextMenuOption[]) => void; close: () => void } | undefined>
  eventList: RowContextMenuEventList
  clearSelection?: () => void
}

function resolveVisible(item: RowContextMenuEventItem, ctx: RowContextMenuClickContext) {
  if (item.visible === undefined) {
    return true
  }
  return typeof item.visible === 'function' ? item.visible(ctx) : item.visible
}

function resolveDisabled(item: RowContextMenuEventItem, ctx: RowContextMenuClickContext) {
  if (item.disabled === undefined) {
    return false
  }
  return typeof item.disabled === 'function' ? item.disabled(ctx) : item.disabled
}

export function useRowContextMenuActions(options: UseRowContextMenuActionsOptions) {
  async function resolveEventList(params: RowContextMenuParams) {
    if (typeof options.eventList === 'function') {
      return options.eventList(params)
    }
    return toValue(options.eventList)
  }

  async function buildOptions(params: RowContextMenuParams): Promise<ContextMenuOption[]> {
    const { row, selectedRows } = params
    const ctx: RowContextMenuClickContext = { row, selectedRows }

    if (selectedRows.length > 0) {
      const isInSelected = selectedRows.some((item) => item.id === row.id)
      if (!isInSelected) {
        options.clearSelection?.()
        return []
      }
    }

    const eventList = await resolveEventList(params)
    const close = () => options.contextMenuRef.value?.close()

    return eventList
      .filter((item) => resolveVisible(item, ctx))
      .map((item) => ({
        label: item.label,
        icon: item.icon ?? 'lucide:circle',
        disabled: resolveDisabled(item, ctx),
        onClick: async () => {
          try {
            await item.onClick(ctx)
          } finally {
            close()
          }
        }
      }))
  }

  async function handleRowContextMenu(params: RowContextMenuParams) {
    const { event, row } = params
    if (!row?.id) {
      return
    }

    const menuOptions = await buildOptions(params)
    if (menuOptions.length === 0) {
      return
    }
    options.contextMenuRef.value?.open(event, menuOptions)
  }

  return {
    handleRowContextMenu,
    buildOptions
  }
}
