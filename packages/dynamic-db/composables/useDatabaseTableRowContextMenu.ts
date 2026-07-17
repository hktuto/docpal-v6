import { inject, toValue, type MaybeRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import type { RowContextMenuClickContext, RowContextMenuEventItem } from '@packages/dp-mdTable/composables/useRowContextMenuActions'

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
  menuId: MaybeRef<string | undefined>
}) {
  const { t } = useI18n()
  const databaseHocuspocus = inject<{ broadcastChange?: (payload: any) => void } | null>('databaseHocuspocus', null)
  const newWorkflowTask = useNewWorkflowTask()

  async function deleteTableRows(ids: string | string[]) {
    const idList = Array.isArray(ids) ? ids : [ids]
    const tableId = toValue(options.tableId)
    await newClientApi.deleteDynamicDbTableTableidDataBatch(tableId, { ids: idList })

    const broadcastChange = databaseHocuspocus?.broadcastChange
    if (!broadcastChange) {
      return
    }

    const menuId = toValue(options.menuId)
    if (idList.length > 1) {
      broadcastChange({ type: 'rows_deleted', rowIds: idList, tableId, menuId })
    } else {
      broadcastChange({ type: 'row_deleted', rowId: idList[0], tableId, menuId })
    }
  }

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
          if (!trigger.workflow_id || !row) return

          // Map db data to workflow data
          const result = Object.keys(trigger.map_workflow_parameters).reduce(
            (acc, key) => {
              const fieldName = trigger.map_workflow_parameters[key]
              acc[key] = row[fieldName]
              return acc
            },
            {} as Record<string, unknown>
          )

          newWorkflowTask.value = {
            id: trigger.workflow_id,
            data: result
          }
        }
      }))
  }

  return async (ctx: RowContextMenuClickContext): Promise<RowContextMenuEventItem[]> => {
    const { row, selectedRows } = ctx
    const canEditTable = toValue(options.canEditTable)
    const targetRows = selectedRows.length > 0 ? selectedRows : [row]
    const pureIds = collectRowIds(targetRows)
    const isBatchDelete = pureIds.length > 1
    const events: RowContextMenuEventItem[] = []

    if (canEditTable) {
      events.push({
        label: isBatchDelete ? t('mdTable.deleteSelectedRow', { count: pureIds.length }) : t('mdTable.deleteRow'),
        icon: 'material-symbols:delete-outline',
        onClick: async ({ row, selectedRows, refresh }) => {
          const rowsToDelete = selectedRows.length > 0 ? selectedRows : [row]
          const ids = collectRowIds(rowsToDelete)
          const isBatch = ids.length > 1
          const message = isBatch ? t('mdTable.deleteSelectedRow', { count: ids.length }) : t('mdTable.deleteRow', { count: 1 })

          try {
            await ElMessageBox.confirm(message, {
              confirmButtonClass: 'el-button el-button--warning',
              confirmButtonText: t('common_confirmDelete'),
              dangerouslyUseHTMLString: true
            })
            await deleteTableRows(isBatch ? ids : ids[0])
            await refresh()
          } catch {
            // 用户取消确认框时保持静默。
          }
        }
      })
    }

    if (selectedRows.length === 0) {
      events.push(...(await loadWorkflowEvents()))
    }

    return events
  }
}
