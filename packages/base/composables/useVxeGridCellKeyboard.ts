import { nextTick, onUnmounted, ref, watch, type Ref } from 'vue'

type EditColumn = { field?: string; editRender?: { name?: string; autofocus?: string } }

type VxeGridCellKeyboardOptions = {
  /** 筛选/虚拟滚动时提供可见行；默认读 grid.getTableData().visibleData */
  getVisibleRows?: () => Record<string, any>[]
}

/**
 * vxe cell 模式 Tab/Enter 横向跳格并 focus 输入框。
 * 官方 keyboardConfig 在 cell 模式下 Tab 后常丢失 focus，需自定义 tabMethod。
 */
export function useVxeGridCellKeyboard(
  tableRef: Ref<any>,
  options: VxeGridCellKeyboardOptions = {}
) {
  const tabShiftKey = ref(false)

  function focusEditCell(column?: EditColumn, row?: Record<string, any>) {
    nextTick(() => {
      requestAnimationFrame(() => {
        const grid = tableRef.value
        const editRecord = grid?.getEditCell?.()
        const targetRow = row ?? editRecord?.row
        const targetColumn = column ?? editRecord?.column
        if (!targetRow || !targetColumn) return

        const cell = grid?.getCellElement?.(targetRow, targetColumn) as HTMLElement | undefined
        if (!cell?.querySelector) return

        const autofocus = targetColumn.editRender?.autofocus
        const selector =
          (typeof autofocus === 'string' && autofocus) ||
          (targetColumn.editRender?.name === 'VxeSelect'
            ? '.vxe-input--inner'
            : '.vxe-input--inner, .vxe-textarea--inner')
        const target = cell.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null
        if (!target) return

        target.focus()
        if (target instanceof HTMLInputElement && targetColumn.editRender?.name !== 'VxeSelect') {
          target.select()
        }
      })
    })
  }

  function getEditableColumns() {
    const grid = tableRef.value
    return ((grid?.getColumns?.() ?? []) as EditColumn[]).filter((col) => col.editRender && col.field)
  }

  function getVisibleRows() {
    const grid = tableRef.value
    return (options.getVisibleRows?.() ??
      grid?.getTableData?.()?.visibleData ??
      []) as Record<string, any>[]
  }

  function isTextareaFocused() {
    const target = document.activeElement as HTMLElement | null
    return !!target?.closest('textarea, .vxe-textarea--inner')
  }

  function activateEditCell(row: Record<string, any>, column: EditColumn) {
    const grid = tableRef.value
    if (!grid || !column.field) return
    grid.scrollToRow?.(row, column.field)
    grid.setEditCell?.(row, column.field)
  }

  function navigateEditCell(
    isShift: boolean,
    currentRow: Record<string, any>,
    currentColumn: EditColumn
  ) {
    const columns = getEditableColumns()
    const rows = getVisibleRows()
    if (!columns.length || !rows.length) return

    const colIndex = Math.max(
      0,
      columns.findIndex((col) => col.field === currentColumn.field)
    )
    const rowIndex = Math.max(
      0,
      rows.findIndex((row) => row === currentRow || (row.id && row.id === currentRow.id))
    )

    const step = isShift ? -1 : 1
    let nextColIndex = colIndex + step
    let nextRowIndex = rowIndex

    if (nextColIndex >= columns.length) {
      nextColIndex = 0
      nextRowIndex += 1
    } else if (nextColIndex < 0) {
      nextColIndex = columns.length - 1
      nextRowIndex -= 1
    }

    if (nextRowIndex < 0 || nextRowIndex >= rows.length) return

    const nextRow = rows[nextRowIndex]
    const nextColumn = columns[nextColIndex]
    if (!nextColumn?.field) return

    activateEditCell(nextRow, nextColumn)
  }

  function handleKeyboardNavigate(params: { row: Record<string, any>; column: EditColumn }) {
    navigateEditCell(tabShiftKey.value, params.row, params.column)
  }

  const keyboardConfig = {
    isEsc: true,
    isTab: true,
    isEnter: true,
    beforeEnterMethod: () => !isTextareaFocused(),
    tabMethod: handleKeyboardNavigate,
    enterMethod: handleKeyboardNavigate
  }

  function handleGridKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab' || event.key === 'Enter') {
      tabShiftKey.value = event.shiftKey
    }
  }

  let gridElement: HTMLElement | undefined
  watch(
    () => tableRef.value?.$el as HTMLElement | undefined,
    (el, prevEl) => {
      prevEl?.removeEventListener('keydown', handleGridKeydown, true)
      gridElement = el
      el?.addEventListener('keydown', handleGridKeydown, true)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    gridElement?.removeEventListener('keydown', handleGridKeydown, true)
  })

  function onEditActivated({
    row,
    column
  }: {
    row?: Record<string, any>
    column?: EditColumn
  }) {
    focusEditCell(column, row)
  }

  return { focusEditCell, keyboardConfig, onEditActivated }
}
