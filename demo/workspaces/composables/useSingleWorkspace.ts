import type { WorkspaceType, MenuItem } from '../utils/db/schema/workspaces';
import type { WorkspaceSchema } from '../utils/db/schema/workspaces.zod'
import { v7 as uuidv7 } from 'uuid'

export const SingleWorkspaceContextKey: InjectionKey<WorkspaceContext> = Symbol('SingleWorkspaceContext')

// Menu state for component
export interface MenuState {
  items: MenuItem[]
  expandedFolders: Set<string>
  editingItemId: string | null
  isDragging: boolean
}

export interface WorkspaceContext {
  workspace: Ref<WorkspaceType | null>
  menuActionsRef: Ref<any | null>
  menuState: Ref<MenuState>
  workspaceRouteParams: Ref<WorkspaceRouteParams>
  getWorkspaceById: (id: string) => Promise<void>
  saveWorkspaceToDb: (workspace: WorkspaceType) => Promise<void>
  openMenuItemActions: (data: {item: MenuItem | null, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) => void
  // Menu functions
  toggleFolder: (id: string) => void
  startEdit: (id: string) => void
  saveEdit: (id: string, newLabel: string) => Promise<void>
  cancelEdit: () => void
  deleteItem: (id: string) => Promise<void>
  addItem: (parentId: string | null, type: MenuItem['type']) => Promise<void>
  navigateToItem: (item: MenuItem) => void
  openSetting: (slug: string, type: MenuItem['type']) => void
  getMenuFromDb: () => Promise<void>
  saveMenuToDb: () => Promise<void>
  findItemById: (items: MenuItem[], id: string) => MenuItem | undefined
  recursiveUpdateItem: (items: MenuItem[], id: string, data:Partial<MenuItem>) => void
  getMenuIcon: (menuItem: MenuItem) => string
}

export function useSingleWorkspaceContext() {
  const context = inject(SingleWorkspaceContextKey)
  if (!context) {
    throw new Error('SingleWorkspaceContext is not provided')
  }
  return context
}

type WorkspaceRouteParams = {
  detailId: string | null,
  detailType: 'root' | 'folder' | 'table' | 'view' | 'dashboard'
}

export function useSingleWorkspace() {
  const { query } = usePglite()
  const router = useRouter()
  const workspace = ref<WorkspaceType | null>(null)

  const menuActionsRef = ref()


  const workspaceRouteParams = ref<WorkspaceRouteParams>({
    detailId: null,
    detailType: 'root',
  })

  const menuState = ref<MenuState>({
    items: [],
    expandedFolders: new Set(),
    editingItemId: null,
    isDragging: false
  })



  function openMenuItemActions(data: {item: MenuItem | null, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) {
    console.log('openMenuItemActions', data, menuActionsRef.value)
    menuActionsRef.value?.open(data, target, highlight)
  }

  async function getWorkspaceById(id: string) {
    const data = await query(`SELECT * FROM workspaces WHERE id = $1`, [id])
    if(!data || data.length === 0) {
      workspace.value = null
      return
    }
    console.log('menuActionsRef', data[0])
    workspace.value =  data[0] as WorkspaceType
  }

  async function saveWorkspaceToDb(workspace: WorkspaceType) {
    await query(`UPDATE workspaces SET name = $1, slug = $2, icon = $3, description = $4 WHERE id = $5`, [workspace.name, workspace.slug, workspace.icon, workspace.description, workspace.id])
  }

  // Menu Functions
  async function saveMenuToDb(){
    console.log('saveMenuToDb', menuState.value.items, workspace.value?.id)
    await query(`UPDATE workspaces SET menu = $1 WHERE id = $2`, [JSON.parse(JSON.stringify(menuState.value.items)), workspace.value?.id])
  }

  async function getMenuFromDb() {
    if(!workspace.value) return
    const menu = workspace.value?.menu
    if(!menu) return
    menu.forEach((item: any) => {
      if(item.type === 'folder'){
        menuState.value.expandedFolders.add(item.id)
        if(item.children && item.children.length > 0) {
          item.children.forEach((child: any) => {
            if(child.type === 'folder'){
              menuState.value.expandedFolders.add(child.id)
            }
          })
        }
      }
    })
    menuState.value.items = menu
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

  function removeItemById(items: MenuItem[], id: string): MenuItem[] {
    return items.filter(item => {
      if (item.id === id) return false
      if (item.children) {
        item.children = removeItemById(item.children, id)
      }
      return true
    })
  }

  function toggleFolder(id: string) {
    if(menuState.value.expandedFolders.has(id)) {
      menuState.value.expandedFolders.delete(id)
    } else {
      menuState.value.expandedFolders.add(id)
    }
  }

  function startEdit(id: string) {
    menuState.value.editingItemId = id
  }

  
  function recursiveUpdateItem(items: MenuItem[], id: string, data:any) {
    for (const item of items) {
      if(item.id === id) {
        Object.keys(data).forEach((key: any) => {
          item[key as keyof MenuItem] = data[key]
        })
        console.log('update item', item, data)
      }
      if(item.children) {
        recursiveUpdateItem(item.children, id, data)
      }
    }
  }

  async function saveEdit(id: string, newLabel: string) {
    recursiveUpdateItem(menuState.value.items, id, {label: newLabel})
    await saveMenuToDb()
    cancelEdit()
  }

  function cancelEdit() {
    menuState.value.editingItemId = null
  }

  async function deleteItem(id: string) {
    const item = findItemById(menuState.value.items, id)
    if(!item) return
    // delete folder logic
    // move all child to root
    if (item.type === 'folder' && item.children) {
      for (const child of item.children) {
        menuState.value.items.push(child)
      }
    }
    // table logic
    if(item.type === 'table'){
      // TODO: implement table deletion logic
    }
    if(item.type === 'view'){
      // TODO: implement view deletion logic
    }
    if(item.type === 'dashboard'){
      // TODO: implement dashboard deletion logic
    }
    // delete item
    menuState.value.items = removeItemById(menuState.value.items, id)
    await saveMenuToDb()
  }

  async function addItem(parentId: string | null, type: MenuItem['type']) {
    const newItem: MenuItem = {
      id: uuidv7(),
      label: 'new folder',
      type,
      children: type === 'folder' ? [] : undefined,
      slug: `new-${type}-${Date.now()}`
    }
    if(parentId) {
      // open parent folder
      menuState.value.expandedFolders.add(parentId)
      const parent = findItemById(menuState.value.items, parentId)
      if(parent && parent.type === 'folder' && parent.children) {
        parent.children.push(newItem)
      }
    } else {
      menuState.value.items.push(newItem)
    }
    startEdit(newItem.id)
    await saveMenuToDb()
  }

  function navigateToItem(item: MenuItem) {
    const base = `/workspaces/${workspace.value?.slug}`
    // console.log('navigateToItem', item)
    switch (item.type) {
      case 'folder':
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = 'folder'
        break
      case 'table':
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = 'table'
        break
      case 'view':
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = 'view'
        break
      case 'dashboard':
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = 'dashboard'
        break
      default:
        console.warn('Unknown item type:', item.type)
    }
  }

  function openSetting(slug: string, type: MenuItem['type']) {
    router.push(`/workspaces/${workspace.value?.slug}/${type}/${slug}/setting`)
  }

  function getMenuIcon(menuItem: MenuItem) {
    const item = findItemById(menuState.value.items, menuItem.id)
    switch (item?.type) {
      case 'folder':
        return 'material-symbols:folder-outline'
      case 'table':
        return 'material-symbols:table-outline'
      case 'view':
        return 'material-symbols:view-list-outline'
      case 'dashboard':
        return 'material-symbols:dashboard-outline'
      default:
        return 'material-symbols:description-outline'
    }
  }

  const context: WorkspaceContext = {
    workspace,
    menuActionsRef,
    menuState,
    workspaceRouteParams,
    getWorkspaceById,
    saveWorkspaceToDb,
    openMenuItemActions,
    toggleFolder,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    addItem,
    navigateToItem,
    openSetting,
    getMenuFromDb,
    saveMenuToDb,
    findItemById,
    recursiveUpdateItem,
    getMenuIcon,
  }

  provide(SingleWorkspaceContextKey, context)

  return context
}
