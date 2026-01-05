import type { InjectionKey, Ref, ComputedRef } from 'vue'
import type { MenuItem } from '../utils/db/schema/workspaces'
import { v4 as uuidv4 } from 'uuid'
// Menu state for component
export interface MenuState {
  items: MenuItem[]
  expandedFolders: Set<string>
  editingItemId: string | null
  isDragging: boolean
}

// Menu context interface
export interface MenuContext {
  state: Ref<MenuState>
  workspaceSlug: Ref<string>
  toggleFolder: (id: string) => void
  startEdit: (id: string) => void
  saveEdit: (id: string, newLabel: string) => Promise<void>
  cancelEdit: () => void
  deleteItem: (id: string) => Promise<void>
  addItem: (parentId: string | null, type: MenuItem['type']) => Promise<void>
  navigateToItem: (item: MenuItem) => void
  openSetting: (slug: string, type: MenuItem['type']) => void
}

export const WorkspaceMenuContextKey: InjectionKey<MenuContext> = Symbol('WorkspaceMenuContext')

export const useWorkspaceMenu = () => {
  const { query } = usePglite()

  const state = ref<MenuState>({
    items: [],
    expandedFolders: new Set(),
    editingItemId: null,
    isDragging: false
  })
  const workspaceSlug = ref('')

  async function getMenuFromDb(){
    const data = await query(`SELECT menu FROM workspaces WHERE slug = $1`, [workspaceSlug.value])
    console.log('data', data)
    state.value.items = data as MenuItem[]
  }
  async function saveMenuToDb(){
    await query(`UPDATE workspaces SET menu = $1 WHERE slug = $2`, [state.value.items, workspaceSlug.value])
  }

  function findItemById(items: MenuItem[], id: string): MenuItem | undefined {
    for (const item of items) {
      if (item.id === id) {
        return item
      }
      if (item.children) {
        const found = findItemById(item.children, id)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }

  // Helper: Remove item by id recursively
  function removeItemById(items: MenuItem[], id: string): MenuItem[] {
    return items.filter(item => {
      if (item.id === id) return false
      if (item.children) {
        item.children = removeItemById(item.children, id)
      }
      return true
    })
  }

  const toggleFolder = (id: string) => {
    state.value.expandedFolders.add(id)
  }

  const startEdit = (id: string) => {
    state.value.editingItemId = id
  }

  const saveEdit = async (id: string, newLabel: string) => {
    const item = state.value.items.find(item => item.id === id)
    if (item) {
      item.label = newLabel
    }
    await saveMenuToDb()
  }

  const cancelEdit = () => {
    state.value.editingItemId = null
  }
  
  const deleteItem = async (id: string) => {
    const item = findItemById(state.value.items, id)
    if(!item) return
    // delete folder logic
    // move all child to root
    if (item.type === 'folder' && item.children) {
      for (const child of item.children) {
        state.value.items.push(child)
      }
      // 
    }
    // table logic
    if(item.type === 'table'){

    }
    if(item.type === 'view'){

    }
    if(item.type === 'dashboard'){

    }
    //
    // delete item
    state.value.items = removeItemById(state.value.items, id)
    await saveMenuToDb()
  }

  const addItem = async (parentId: string | null, type: MenuItem['type']) => {
    const newItem: MenuItem = {
      id: uuidv4(),
      label: '',
      type,
      children: type === 'folder' ? [] : undefined,
      slug: `new-${type}-${Date.now()}`
    }
      if(parentId) {
        const parent = findItemById(state.value.items, parentId)
        if(parent && parent.type === 'folder' && parent.children) {
          parent.children.push(newItem)
        }
      } else {
        state.value.items.push(newItem)
      }
      await saveMenuToDb()
    }
  
    const router = useRouter()
    function navigateToItem(item: MenuItem) {
      const base = `/workspaces/${workspaceSlug.value}`
      console.log('navigateToItem', item)
      switch (item.type) {
        case 'folder':
          router.push(`${base}/folder/${item.slug}`)
          break
        case 'table':
          router.push(`${base}/table/${item.slug}`)
          break
        case 'view':
          router.push(`${base}/view/${item.slug}`)
          break
        case 'dashboard':
          router.push(`${base}/dashboard/${item.slug}`)
          break
        default:
          console.warn('Unknown item type:', item.type)
      }
    }
  
    function openSetting(slug: string, type: MenuItem['type']) {
      router.push(`/workspaces/${workspaceSlug.value}/${type}/${slug}/setting`)
    }

    provide(WorkspaceMenuContextKey, {
      state,
      workspaceSlug,
      toggleFolder,
      startEdit,
      saveEdit,
      cancelEdit,
      deleteItem,
      addItem,
      navigateToItem,
      openSetting
    })

    return {
      state,
      workspaceSlug,
      getMenuFromDb,
      saveMenuToDb,
      toggleFolder,
      startEdit,
      saveEdit,
      cancelEdit,
      deleteItem,
      addItem,
      navigateToItem,
      openSetting
    }

}

export function useWorkspaceMenuContext() {
  const context = inject(WorkspaceMenuContextKey)

  if (!context) {
    throw new Error('useWorkspaceMenuContext must be used within WorkspaceMenu component')
  }
  
  return context
}

