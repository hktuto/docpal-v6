import type { CaseTypeRecord, CaseTreeRecord, ViewType, ViewSettings } from '../../utils/db/schema/newTableSchema'
import type { CaseTreeItemType } from '../../utils/db/schema/newTableSchema'
import type { MenuDTO, ResultListMenuDTO } from 'api'
import { MenuType } from '@packages/dp-mdTable/types/menu-type'
import { usePermission } from '../utils/usePermission'
export type { CaseTreeItemType }
import { v7 as uuidv7 } from 'uuid'
import { newClientApi } from 'api'
// View creation data passed from CreateViewDialog
export interface ViewCreationData {
  name: string
  tableId: string
  viewType: ViewType
  viewSettings: ViewSettings
}

export const SingleWorkspaceContextKey: InjectionKey<WorkspaceContext> = Symbol('SingleWorkspaceContext')

// Tree item for component rendering (includes computed children)
export interface TreeItem extends CaseTreeRecord {
  children?: TreeItem[]
  item_id?: string
}

// Menu state for component
export interface MenuState {
  items: MenuDTO[]
  editingItemId: string | null
  isDragging: boolean
}

export interface WorkspaceContext {
  workspace: Ref<CaseTypeRecord | null>
  menuActionsRef: Ref<any | null>
  menuState: Ref<MenuState>
  workspaceRouteParams: Ref<WorkspaceRouteParams>
  getWorkspaceById: (id: string) => Promise<void>
  saveWorkspaceToDb: (workspace?: CaseTypeRecord) => Promise<void>
  openMenuItemActions: (data: { item: TreeItem | null; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) => void
  // Menu functions
  startEdit: (id: string) => void
  saveEdit: (id: string, newLabel: string) => Promise<boolean>
  cancelEdit: () => void
  deleteItem: (id: string) => Promise<void>
  addItem: (parent_id: string | null, type: CaseTreeItemType, viewData?: ViewCreationData) => Promise<TreeItem>
  navigateToItem: (item?: TreeItem) => void
  navigateToRecord: (tableId: string, recordId: string) => void
  goBackFromRecord: () => void
  openSetting: (slug: string, type: CaseTreeItemType) => void
  getMenuFromDb: () => Promise<void>
  saveMenuItemToDb: (item: Partial<CaseTreeRecord>) => Promise<void>
  findItemById: (items: MenuDTO[], id: string) => MenuDTO | undefined

  getMenuIcon: (menuItem: TreeItem) => string
  buildTreeFromFlat: (flatItems: CaseTreeRecord[]) => TreeItem[]
}

export function useSingleWorkspaceContext() {
  const context = inject(SingleWorkspaceContextKey)
  if (!context) {
    throw new Error('SingleWorkspaceContext is not provided')
  }
  return context
}

export type WorkspaceRouteParams = {
  detailId: string | null
  pageType: 'setting' | 'detail'
  detailType: 'folder' | 'master_table' | 'view' | 'dashboard' | 'root' | 'record'
  /** For record detail view: the record ID being viewed */
  recordId?: string | null
  /** For record detail view: the table ID the record belongs to */
  tableId?: string | null
  /** For master_table detail view: the item ID of the master table */
  item_id?: string | null
}

export function useSingleWorkspace() {
  const { query, exec } = usePglite()
  const router = useRouter()
  const workspace = ref<CaseTypeRecord | null>(null)

  const menuActionsRef = ref()

  const workspaceRouteParams = ref<WorkspaceRouteParams>({
    detailId: null,
    pageType: 'detail',
    detailType: 'root'
  })

  const menuState = ref<MenuState>({
    items: [],
    editingItemId: null,
    isDragging: false
  })

  function openMenuItemActions(data: { item: TreeItem | null; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) {
    console.log('openMenuItemActions', data, menuActionsRef.value)
    menuActionsRef.value?.open(data, target, highlight)
  }

  async function getWorkspaceById(id: string) {
    const { data }: any = await newClientApi.getDynamicDbCaseTypesId(id)
    if (!data) {
      workspace.value = null
      return
    }
    workspace.value = data as CaseTypeRecord
  }

  async function saveWorkspaceToDb(newWorkspaceData?: CaseTypeRecord) {
    if (!newWorkspaceData && !workspace.value) return
    newWorkspaceData ||= workspace.value as CaseTypeRecord
    const { name, description, icon, id } = newWorkspaceData
    const dto: any = {}
    if (name) dto.name = name
    if (description) dto.description = description
    if (icon) dto.metadata = { icon }

    const { data }: any = await newClientApi.putDynamicDbCaseTypesId(id, dto)
    workspace.value = data as CaseTypeRecord
  }

  /**
   * Build hierarchical tree structure from flat database records
   */
  function buildTreeFromFlat(flatItems: CaseTreeRecord[]): TreeItem[] {
    const itemMap = new Map<string, TreeItem>()
    const rootItems: TreeItem[] = []

    // First pass: create all items
    for (const item of flatItems) {
      itemMap.set(item.id, { ...item, children: [] })
    }

    // Second pass: build hierarchy
    for (const item of flatItems) {
      const treeItem = itemMap.get(item.id)!
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!
        parent.children = parent.children || []
        parent.children.push(treeItem)
      } else {
        rootItems.push(treeItem)
      }
    }

    // Sort by order
    const sortByOrder = (items: TreeItem[]) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0))
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortByOrder(item.children)
        }
      })
    }
    sortByOrder(rootItems)

    return rootItems
  }

  /**
   * Flatten tree structure to flat array for saving
   */
  function flattenTree(items: TreeItem[], parent_id: string | null = null): Partial<CaseTreeRecord>[] {
    const result: Partial<CaseTreeRecord>[] = []
    items.forEach((item, index) => {
      result.push({
        id: item.id,
        reference_entity_id: workspace.value?.id,
        label: item.label,
        slug: item.slug,
        description: item.description,
        item_type: item.item_type,
        itemId: item.itemId,
        parent_id: parent_id,
        order: index
      })
      if (item.children && item.children.length > 0) {
        result.push(...flattenTree(item.children, item.id))
      }
    })
    return result
  }

  // Menu Functions
  async function saveMenuItemToDb(item: Partial<CaseTreeRecord>) {
    const dto: any = { ...item }
    if (item.id) {
      await newClientApi.putDynamicDbMenusId(item.id, dto)
    } else {
      await newClientApi.postDynamicDbMenus(dto)
    }
  }

  async function getMenuFromDb() {
    if (!workspace.value) return

    const res = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: workspace.value.id
    })
    const list = (res as ResultListMenuDTO).data ?? []
    menuState.value.items = list
  }

  function findItemById(items: MenuDTO[], id: string): MenuDTO | undefined {
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

  function removeItemById(items: MenuDTO[], id: string): MenuDTO[] {
    return items.filter((item) => {
      if (item.id === id) return false
      if (item.children) {
        item.children = removeItemById(item.children, id)
      }
      return true
    })
  }

  function startEdit(id: string) {
    menuState.value.editingItemId = id
  }

  async function saveEdit(item: any, newLabel: string): Promise<boolean> {
    try {
      const { data }: any = await newClientApi.putDynamicDbMenusId(item.id, { name: newLabel, item_type: item.item_type })
      cancelEdit()
      return data.name === newLabel
    } catch (error) {
      console.error('Error saving edit:', error)
      return false
    }
  }

  function cancelEdit() {
    menuState.value.editingItemId = null
  }

  async function deleteItem(id: string) {
    await newClientApi.deleteDynamicDbMenusId(id)
    // Update local state
    menuState.value.items = removeItemById(menuState.value.items, id)
  }

  async function addItem(parent_id: string | null, type: CaseTreeItemType, viewData?: ViewCreationData): Promise<TreeItem> {
    console.log('addItem', parent_id, type, viewData)
    const now = new Date()
    let label = `New ${type}`
    const slug = `new-${type}-${Date.now()}`
    const newItem: any = {
      name: label,
      reference_entity_type: 'case',
      reference_entity_id: workspace.value?.id || null,
      slug,
      description: null,
      item_type: type,
      parent_id: parent_id,
      order: 0
    }

    // Save to database
    const { data }: any = await newClientApi.postDynamicDbMenus(newItem)

    // Auto-assign 'manage' permission to creator
    // const { assignCreatorPermission } = usePermission()
    // try {
    //   await assignCreatorPermission(newItem.id)
    // } catch (error) {
    //   console.error('Failed to assign creator permission:', error)
    //   // Don't fail the creation if permission assignment fails
    // }

    // Update local state
    if (parent_id) {
      const parent = findItemById(menuState.value.items, parent_id)
      if (parent && parent.item_type === 'folder') {
        parent.children = parent.children || []
        parent.children.push(data)
      }
    } else {
      menuState.value.items.push(data)
    }

    // For views, we already have the name from viewData, no need to edit
    if (type !== 'view') {
      startEdit(data.id)
    }
    return data
  }

  function navigateToItem(item?: TreeItem, pageType: 'setting' | 'detail' = 'detail') {
    if (!item) {
      workspaceRouteParams.value.detailId = null
      workspaceRouteParams.value.detailType = 'root'
      return
    }
    switch (item.item_type) {
      case MenuType.folder:
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = MenuType.folder
        break
      case MenuType.table:
        console.log('navigateToItem', item)
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = MenuType.table
        workspaceRouteParams.value.item_id = item.item_id
        workspaceRouteParams.value.pageType = pageType
        break
      case MenuType.view:
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = MenuType.view
        workspaceRouteParams.value.pageType = pageType
        break
      case MenuType.dashboard:
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = MenuType.dashboard
        workspaceRouteParams.value.pageType = pageType
        break
      default:
        console.warn('Unknown item type:', item.item_type)
    }
  }

  /**
   * Navigate to a record's detail view
   * @param tableId - The table ID the record belongs to
   * @param recordId - The record ID to view
   */
  function navigateToRecord(tableId: string, recordId: string) {
    workspaceRouteParams.value.detailType = 'record'
    workspaceRouteParams.value.tableId = tableId
    workspaceRouteParams.value.recordId = recordId
    workspaceRouteParams.value.pageType = 'detail'
  }

  /**
   * Go back from record detail view to the table view
   */
  function goBackFromRecord() {
    const tableId = workspaceRouteParams.value.tableId
    // Clear record-specific params
    workspaceRouteParams.value.recordId = null
    workspaceRouteParams.value.tableId = null

    // Navigate back to table if we have a tableId
    if (tableId) {
      // Find the tree item for this table
      const findTableTreeItem = (items: TreeItem[]): TreeItem | undefined => {
        for (const item of items) {
          if (item.item_type === MenuType.table && item.itemId === tableId) {
            return item
          }
          if (item.children) {
            const found = findTableTreeItem(item.children)
            if (found) return found
          }
        }
        return undefined
      }

      const tableItem = findTableTreeItem(menuState.value.items)
      if (tableItem) {
        navigateToItem(tableItem)
        return
      }
    }

    // Fallback to root
    workspaceRouteParams.value.detailType = 'root'
    workspaceRouteParams.value.detailId = null
  }

  function openSetting(slug: string, type: CaseTreeItemType) {
    console.log('openSetting', slug, type)
    workspaceRouteParams.value.pageType = 'setting'
    workspaceRouteParams.value.detailId = slug
    workspaceRouteParams.value.detailType = type
    // router.push(`/workspaces/${workspace.value?.id}/${type}/${slug}/setting`)
  }

  function getMenuIcon(menuItem: TreeItem) {
    const item = findItemById(menuState.value.items, menuItem.id)
    switch (item?.item_type) {
      case 'folder':
        return 'material-symbols:folder-outline'
      case 'master_table':
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
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    addItem,
    navigateToItem,
    navigateToRecord,
    goBackFromRecord,
    openSetting,
    getMenuFromDb,
    saveMenuItemToDb,
    findItemById,
    getMenuIcon,
    buildTreeFromFlat
  }

  provide(SingleWorkspaceContextKey, context)

  return context
}
