/**
 * Watches Hocuspocus remote changes and triggers a callback when
 * the target tableId receives row_created, row_updated, row_deleted, or rows_deleted events.
 */
export function useDashboardLiveUpdate(tableIdRef: Ref<string | undefined>, onChange: () => void) {
  const databaseHocuspocus = inject<any>('databaseHocuspocus', null)

  if (!databaseHocuspocus) return

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedRefresh() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      onChange()
    }, 300)
  }

  watch(
    () => databaseHocuspocus.remoteChanges?.value,
    (changes) => {
      if (!changes || changes.length === 0) return
      const targetTableId = tableIdRef.value
      if (!targetTableId) return

      const relevantTypes = ['row_created', 'row_updated', 'row_deleted', 'rows_deleted']
      const hasRelevantChange = changes.some((event: any) => {
        const change = event?.change
        return change && relevantTypes.includes(change.type) && change.tableId === targetTableId
      })

      if (hasRelevantChange) {
        debouncedRefresh()
      }
    },
    { deep: true }
  )
}
