import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import type { RowContextMenuEventItem, RowContextMenuParams } from '@packages/dp-mdTable/composables/useRowContextMenuActions'

function collectRowIds(rows: Record<string, any>[]): string[] {
  const idsToDelete = rows.reduce((acc: string[], row) => {
    if (row.children?.length > 0) {
      acc.push(...row.children.map((child: any) => String(child.id)))
    } else {
      acc.push(String(row.id))
    }
    return acc
  }, [] as string[])
  return [...new Set(idsToDelete)]
}

export function createDatabaseTableRowContextMenuEvents(options: {
  tableId: MaybeRef<string>
  canEditTable: MaybeRef<boolean>
  deleteRow: (ids: string | string[]) => Promise<void | boolean>
  onDeleted?: (ids: string[]) => void | Promise<void>
}) {
  const { t } = useI18n()

  async function loadWorkflowEvents(): Promise<RowContextMenuEventItem[]> {
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
        visible: ({ selectedRows }) => selectedRows.length === 0,
        onClick: async ({ row, selectedRows }) => {
          console.log('trigger fire', { row, selectedRows, workflowId: trigger.workflow_id })
        }
      }))
  }

  return async (params: RowContextMenuParams): Promise<RowContextMenuEventItem[]> => {
    const { row, selectedRows } = params
    const canEditTable = toValue(options.canEditTable)
    const targetRows = selectedRows.length > 0 ? selectedRows : [row]
    const pureIds = collectRowIds(targetRows)
    const isBatchDelete = pureIds.length > 1
    const events: RowContextMenuEventItem[] = []

    if (canEditTable) {
      events.push({
        label: isBatchDelete ? t('mdTable.deleteSelectedRow', { count: pureIds.length }) : t('mdTable.deleteRow'),
        icon: 'material-symbols:delete-outline',
        onClick: async ({ row, selectedRows }) => {
          const rowsToDelete = selectedRows.length > 0 ? selectedRows : [row]
          const ids = collectRowIds(rowsToDelete)
          const isBatch = ids.length > 1
          const message = isBatch
            ? t('mdTable.deleteSelectedRow', { count: ids.length })
            : t('mdTable.deleteRow', { count: 1 })
          await ElMessageBox.confirm(message, {
            confirmButtonClass: 'el-button el-button--warning',
            confirmButtonText: t('common_confirmDelete'),
            dangerouslyUseHTMLString: true
          })
          await options.deleteRow(isBatch ? ids : ids[0])
          await options.onDeleted?.(ids)
        }
      })
    }

    if (selectedRows.length === 0) {
      events.push(...(await loadWorkflowEvents()))
    }

    return events
  }
}
