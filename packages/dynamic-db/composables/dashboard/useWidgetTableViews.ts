import { ref } from 'vue'
import { newClientApi } from 'api'
import { parseViewConfigList } from '../../utils/tableViews'
import type { ViewConfig } from '../../utils/databaseType'

/**
 * Read-only list of a table's saved views, for dashboard widget settings dialogs.
 * Deliberately does NOT use useTableViews().getViews() — that auto-creates and
 * persists a "Default View" when none exists, a write we don't want here.
 */
export function useWidgetTableViews() {
  const views = ref<ViewConfig[]>([])
  const viewsLoading = ref(false)
  // Guards against out-of-order resolution when tables are switched rapidly:
  // a superseded response must not touch views or viewsLoading
  let requestSeq = 0

  async function loadViews(tableId: string) {
    const seq = ++requestSeq
    if (!tableId) {
      views.value = []
      viewsLoading.value = false
      return
    }
    viewsLoading.value = true
    try {
      const data: any = await newClientApi.getDocpalMasterTableUserConfig({
        tableId,
        userId: 'master'
      })
      if (seq !== requestSeq) return
      const allViews = parseViewConfigList(data?.data?.tableConfig)
      // Views saved before the `type` field existed are table views
      views.value = allViews.filter((v) => v.type === 'table' || !v.type)
    } catch (error) {
      if (seq !== requestSeq) return
      console.error('Failed to fetch table views:', error)
      views.value = []
    } finally {
      if (seq === requestSeq) viewsLoading.value = false
    }
  }

  return { views, viewsLoading, loadViews }
}
