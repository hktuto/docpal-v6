import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'

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

export interface UseRowContextMenuActionsOptions {
  tableId: MaybeRef<string>
  canEditTable: MaybeRef<boolean>
  contextMenuRef: Ref<{ open: (event: MouseEvent, options: ContextMenuOption[]) => void; close: () => void } | undefined>
  deleteRow: (ids: string | string[]) => Promise<void | boolean>
  clearSelection?: () => void
  onDeleted?: (ids: string[]) => void | Promise<void>
}

function collectRowIds(rows: Record<string, any>[]): string[] {
  const idsToDelete = rows.reduce((acc: string[], row) => {
    if (row.children?.length > 0) {
      acc.push(...row.children.map((child: any) => String(child.id)))
    } else {
      acc.push(String(row.id))
    }
    return acc
  }, [])
  return [...new Set(idsToDelete)]
}

export function useRowContextMenuActions(options: UseRowContextMenuActionsOptions) {
  const { t } = useI18n()

  async function loadWorkflowActions(row: any): Promise<ContextMenuOption[]> {
    const tableId = toValue(options.tableId)
    if (!tableId) {
      return []
    }

    const res = await newClientApi.postDynamicDbTableMastertableidTriggerSettingsPage(tableId, {
      pageNum: 0,
      pageSize: 200
    })

    return (res.data?.entryList || [])
      .filter((trigger: any) => trigger.event_type === 'manual' && trigger.workflow_id)
      .map((trigger: any) => ({
        label: trigger.trigger_name,
        icon: 'dp-icon:flow-outline',
        onClick: async () => {
          console.log('trigger fire', { row, workflowId: trigger.workflow_id })
        }
      }))
  }

  function createDeleteOption(rows: Record<string, any>[], close: () => void): ContextMenuOption {
    const pureIds = collectRowIds(rows)
    const isBatchDelete = pureIds.length > 1

    return {
      label: isBatchDelete ? t('mdTable.deleteSelectedRow', { count: pureIds.length }) : t('mdTable.deleteRow'),
      icon: 'material-symbols:delete-outline',
      onClick: async () => {
        const message = isBatchDelete
          ? t('mdTable.deleteSelectedRow', { count: pureIds.length })
          : t('mdTable.deleteRow', { count: 1 })
        try {
          await ElMessageBox.confirm(message, {
            confirmButtonClass: 'el-button el-button--warning',
            confirmButtonText: t('common_confirmDelete'),
            dangerouslyUseHTMLString: true
          })
          await options.deleteRow(isBatchDelete ? pureIds : pureIds[0])
          await options.onDeleted?.(pureIds)
        } catch {
          // 用户取消确认框时保持静默。
        } finally {
          close()
        }
      }
    }
  }

  async function buildOptions(params: RowContextMenuParams, close: () => void): Promise<ContextMenuOption[]> {
    const { row, selectedRows } = params
    const canEditTable = toValue(options.canEditTable)
    const menuOptions: ContextMenuOption[] = []

    if (selectedRows.length > 0) {
      const isInSelected = selectedRows.some((item) => item.id === row.id)
      if (!isInSelected) {
        options.clearSelection?.()
        return []
      }
      if (canEditTable) {
        menuOptions.push(createDeleteOption(selectedRows, close))
      }
      return menuOptions
    }

    if (canEditTable) {
      menuOptions.push(createDeleteOption([row], close))
    }
    const workflowActions = await loadWorkflowActions(row)
    menuOptions.push(...workflowActions)
    return menuOptions
  }

  async function handleRowContextMenu(params: RowContextMenuParams) {
    const { event, row } = params
    if (!row?.id) {
      return
    }

    const close = () => options.contextMenuRef.value?.close()
    const menuOptions = await buildOptions(params, close)
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
