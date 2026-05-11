import type { MenuDTO } from 'api'
import { useSingleDatabaseContext } from '../useSignleDatabase'

export interface DatabaseDashboardLayoutItem {
  x: number
  y: number
  w: number
  h: number
  i: string
  component: string
  label: string
  setting?: Record<string, any>
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export function useDatabaseDashboard(menuItem: Ref<MenuDTO | undefined | null>) {
  const { saveMenuItemToDb } = useSingleDatabaseContext()
  const loading = ref(false)

  const layout = ref<DatabaseDashboardLayoutItem[]>([])

  function loadLayout() {
    const raw = menuItem.value?.metadata?.dashboardLayout
    if (Array.isArray(raw)) {
      layout.value = raw
    } else {
      layout.value = []
    }
  }

  watch(
    () => menuItem.value?.id,
    () => {
      loadLayout()
    },
    { immediate: true }
  )

  async function saveLayout() {
    if (!menuItem.value?.id) return
    loading.value = true
    try {
      const metadata = {
        ...(menuItem.value.metadata || {}),
        dashboardLayout: JSON.parse(JSON.stringify(layout.value))
      }
      await saveMenuItemToDb({
        id: menuItem.value.id,
        metadata
      })
      if (menuItem.value) {
        menuItem.value.metadata = metadata
      }
    } catch (error) {
      console.error('Failed to save dashboard layout:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    layout,
    loading,
    saveLayout,
    loadLayout
  }
}
