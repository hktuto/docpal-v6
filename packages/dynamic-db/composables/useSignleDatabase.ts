import type { DatabaseItem } from '../../../utils/databaseType'
import { newClientApi, clientApi } from 'api'
import { useUserId } from '../../authApp/composables/useAuth'
import { MenuType } from '@packages/dp-mdTable/types/menu-type'

export type PermissionLevel = 'Member' | 'Manage'
export type MenuItemPermissionLevel = 'View' | 'Edit' | 'Manage'
export type DatabaseMenuRouteParams = {
  detailId: string,
  pageType: string,
  detailType: string,
  parentId?: string
  item_id?: string
  [key:string]:any
}
export interface PermissionRow {
  id: string
  targetId: string
  targetName: string
  targetType: number
  permissionLevel: PermissionLevel
  permissionIds: number[]
  isInherit: boolean
  inheritFrom: string
  loading: boolean
}
export interface MenuItemPermissionRow {
  id: string
  targetId: string
  targetName: string
  targetType: number
  permissionLevel: MenuItemPermissionLevel
  permissionIds: number[]
  isInherit: boolean
  inheritFrom: string
  loading: boolean
}
// Menu state for component
export interface MenuState {
  items: MenuDTO[]
  editingItemId: string | null
  isDragging: boolean
}
export interface ViewCreationData {
  name: string
  tableId: string
  viewId: string
}

export interface SingleDatabaseCopntext {
  database: Ref<DatabaseItem | null>
  menuActionsRef: Ref<any | null>
  menuState: Ref<MenuState>
  databaseMenuRouteParams: Ref<DatabaseMenuRouteParams>
  permissions: Ref<PermissionRow[]>
  permissionsLoading: Ref<boolean>
  currentUserPermission: Ref<PermissionLevel | null>
  menuItemPermissions: Ref<MenuItemPermissionRow[]>
  menuItemPermissionsLoading: Ref<boolean>
  currentMenuItemPermission: Ref<MenuItemPermissionLevel | null>
  menuItemPermissionMap: Ref<Record<string, MenuItemPermissionLevel | null>>
  getDatabaseById: (id: string) => Promise<void>
  updateDatabase: (database?: CaseTypeRecord) => Promise<void>
  getPermissions: () => Promise<void>
  getMenuItemPermissions: (resourceId?: string) => Promise<void>
  getAllMenuItemPermissions: () => Promise<void>
  getCurrentUserMenuItemPermission: (id: string) => MenuItemPermissionLevel | null
  checkMenuItemPermission: (id: string, right: MenuItemPermissionLevel) => boolean
  openMenuItemActions: (data: { item: TreeItem | null; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) => void
  // Menu functions
  startEdit: (id: string) => void
  saveEdit: (id: string, newLabel: string) => Promise<boolean>
  cancelEdit: () => void
  deleteItem: (id: string) => Promise<void>
  addItem: (parent_id: string | null, type: CaseTreeItemType, viewData?: ViewCreationData) => Promise<TreeItem>
  navigateToItem: (item?: TreeItem) => void
  goBackFromRecord: () => void
  openSetting: (slug: string, type: CaseTreeItemType) => void
  getMenuFromDb: () => Promise<void>
  saveMenuItemToDb: (item: Partial<CaseTreeRecord>) => Promise<void>
  findItemById: (items: MenuDTO[], id: string) => MenuDTO | undefined

  getMenuIcon: (menuItem: TreeItem) => string
  buildTreeFromFlat: (flatItems: CaseTreeRecord[]) => TreeItem[]
}

export const useSingleDatabase = () => {
  const database = ref<CaseTypeRecord | null>(null)
  const currentUserId = useUserId()

  // Permissions
  const permissions = ref<PermissionRow[]>([])
  const permissionsLoading = ref(false)
  const currentUserPermission = ref<PermissionLevel | null>(null)

  // Menu Item Permissions
  const menuItemPermissions = ref<MenuItemPermissionRow[]>([])
  const menuItemPermissionsLoading = ref(false)
  const currentMenuItemPermission = ref<MenuItemPermissionLevel | null>(null)
  const menuItemPermissionMap = ref<Record<string, MenuItemPermissionLevel | null>>({})

  // menu action logic
  const menuActionsRef = ref()

  const databaseMenuRouteParams = ref<DatabaseMenuRouteParams>({
    detailId: null,
    pageType: 'detail',
    detailType: 'root',
    parentId: null
  })

  const menuState = ref<MenuState>({
    items: [],
    editingItemId: null,
    isDragging: false
  })

  function getDatabasePermissionIds(level: PermissionLevel): number[] {
    switch (level) {
      case 'Manage': return [47, 48, 49]
      case 'Member': return [47]
      default: return [47]
    }
  }

  function getMenuItemPermissionIds(level: MenuItemPermissionLevel): number[] {
    switch (level) {
      case 'Manage': return [53, 54, 61]
      case 'Edit': return [51, 52]
      case 'View': return [50]
      default: return [50]
    }
  }

  function openMenuItemActions(data: { item: TreeItem | null; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) {
    menuActionsRef.value?.open(data, target, highlight)
  }

  async function getDatabaseById(id: string) {
    const { data }: any = await newClientApi.getDynamicDbCaseTypesId(id)
    if (!data) {
      database.value = null
      return
    }
    database.value = data as CaseTypeRecord
    await getPermissions()
  }

  async function getPermissions() {
    if (!database.value?.id) return
    permissionsLoading.value = true
    try {
      const { data }: any = await newClientApi.getDynamicDbPermissionsDatabaseDatabaseidMembers(database.value.id)

      permissions.value = data.map((item: any) => ({
        id: item.permissionRecordId || item.id,
        targetId: item.targetId,
        targetName: item.targetName || item.targetId,
        targetType: item.targetType ?? 1,
        permissionLevel: item.permissionLevel === 'Manage' ? 'Manage' : 'Member',
        permissionIds: item.permissionIds || getDatabasePermissionIds(item.permissionLevel),
        isInherit: !!item.isInherit,
        inheritFrom: item.inheritFrom || '-',
        loading: false
      }))

      // Find current user's permission level
      const userPerm = permissions.value.find(
        (p) => p.targetType === 1 && p.targetId === currentUserId.value
      )
      currentUserPermission.value = userPerm?.permissionLevel || null
    } catch (error) {
      console.error('Failed to load permissions:', error)
      permissions.value = []
      currentUserPermission.value = null
    } finally {
      permissionsLoading.value = false
    }
  }

  async function getMenuItemPermissions(resourceId?: string) {
    const id = resourceId || databaseMenuRouteParams.value.detailId
    if (!id) return
    menuItemPermissionsLoading.value = true
    try {
      const { data }: any = await newClientApi.getDynamicDbPermissionsMenuMenuidPermissions(id)

      menuItemPermissions.value = data.map((item: any) => ({
        id: item.permissionRecordId || item.id,
        targetId: item.targetId,
        targetName: item.targetName || item.targetId,
        targetType: item.targetType ?? 1,
        permissionLevel: item.permissionLevel === 'Manage' ? 'Manage' : item.permissionLevel === 'Edit' ? 'Edit' : 'View',
        permissionIds: item.permissionIds || getMenuItemPermissionIds(item.permissionLevel),
        isInherit: !!item.isInherit,
        inheritFrom: item.inheritFrom || '-',
        loading: false
      }))

      const userPerm = menuItemPermissions.value.find(
        (p) => p.targetType === 1 && p.targetId === currentUserId.value
      )
      currentMenuItemPermission.value = userPerm?.permissionLevel || null
    } catch (error) {
      console.error('Failed to load menu item permissions:', error)
      menuItemPermissions.value = []
      currentMenuItemPermission.value = null
    } finally {
      menuItemPermissionsLoading.value = false
    }
  }

  async function updateDatabase(newDatabaseData: DatabaseItem) {
    if (!newDatabaseData && !database.value) return
    newDatabaseData ||= database.value as DatabaseItem
    const { name, description, icon, id } = newDatabaseData
    const dto: any = {}
    if (name) dto.name = name
    if (description) dto.description = description
    if (icon) dto.metadata = { icon }

    const { data }: any = await newClientApi.putDynamicDbCaseTypesId(id, dto)

    database.value = data as DatabaseItem
  }

  /**
   * Build hierarchical tree structure from flat database records
   */
  function buildTreeFromFlat(flatItems: TreeItem[]): TreeItem[] {
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
  function flattenTree(items: TreeItem[], parent_id: string | null = null): Partial<TreeItem>[] {
    const result: Partial<CaseTreeRecord>[] = []
    items.forEach((item, index) => {
      result.push({
        id: item.id,
        reference_entity_id: database.value?.id,
        label: item.label,
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

  /**
   * Extract all menu item IDs from a tree structure
   */
  function flattenMenuItemIds(items: MenuDTO[]): string[] {
    const ids: string[] = []
    for (const item of items) {
      ids.push(item.id)
      if (item.children && item.children.length > 0) {
        ids.push(...flattenMenuItemIds(item.children))
      }
    }
    return ids
  }

  /**
   * Fetch current user's permissions for all menu items
   */
  async function getAllMenuItemPermissions() {

    const allItems = menuState.value.items
    console.log("getAllMenuItemPermissions allItems", allItems)
    if (!allItems.length) return

    const ids = flattenMenuItemIds(allItems)
    const map: Record<string, MenuItemPermissionLevel | null> = {}

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const { data }: any = await newClientApi.getDynamicDbPermissionsMenuMenuidPermissions(id)

          const userPerm = data.find(
            (p: any) => p.targetType === 1 && p.targetId === currentUserId.value
          )
          map[id] = userPerm?.permissionLevel || null
        } catch {
          map[id] = null
        }
      })
    )
    menuItemPermissionMap.value = map
    console.log("getAllMenuItemPermissions", map)
  }

  /**
   * Get current user's permission level for a specific menu item
   */
  function getCurrentUserMenuItemPermission(id: string): MenuItemPermissionLevel | null {
    const level = menuItemPermissionMap.value[id]
    if (level) return level

    // Fallback to database-level permission
    // if (currentUserPermission.value === 'Manage') return 'Manage'
    // if (currentUserPermission.value === 'Member') return 'View'
    return null
  }

  function checkMenuItemPermission(id: string, right: MenuItemPermissionLevel): boolean {
    const level = getCurrentUserMenuItemPermission(id)
    // also add database-level permission fallback
    const dbLevel = currentUserPermission.value
    switch (right) {
      case 'View':
        return level === 'View' || level === 'Edit' || level === 'Manage' || dbLevel === 'Manage'
      case 'Edit':
        return level === 'Edit' || level === 'Manage' || dbLevel === 'Manage'
      case 'Manage':
        return level === 'Manage' || dbLevel === 'Manage'
      default:
        return false
    }
  }

  async function getMenuFromDb() {
    if (!database.value) return

    const res = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: database.value.id
    })
    const list = (res as ResultListMenuDTO).data ?? []
    menuState.value.items = list
    await getAllMenuItemPermissions()
  }

  function findItemById(items: MenuDTO[], id: string): MenuDTO | undefined {
    for (const item of items) {
      if (item.id === id || item.item_id === id) {
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
    let label = viewData?.name || `New ${type}`
    const newItem: any = {
      name: label,
      reference_entity_type: 'case',
      reference_entity_id: database.value?.id || null,
      description: null,
      item_type: type,
      parent_id: parent_id,
      order: 0
    }
    if (type === 'view') {
      newItem.view_base_table_id = viewData?.tableId
      const viewSettings = {
        viewId: viewData?.viewId,
        tableId: viewData?.tableId
      }
      newItem.metadata = viewSettings
      newItem.view_condition = {}
    }
    const { data }: any = await newClientApi.postDynamicDbMenus(newItem)

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
    getAllMenuItemPermissions()
    return data
  }

  // add router Provider here to sync naviate item to routerProvider
  const routerProvider = inject(MenuRouterKey)

  async function navigateToItem(item?: TreeItem, pageType: 'setting' | 'detail' = 'detail') {
    databaseMenuRouteParams.value.parentId = item?.parent_id || null
    databaseMenuRouteParams.value.viewId = null
    databaseMenuRouteParams.value.tableId = null
    if (!item) {
      databaseMenuRouteParams.value.detailId = null
      databaseMenuRouteParams.value.detailType = 'root'
      return
    }
    switch (item.item_type) {
      case MenuType.folder:
        databaseMenuRouteParams.value.detailId = item.id
        databaseMenuRouteParams.value.detailType = MenuType.folder
        break
      case MenuType.view:
        databaseMenuRouteParams.value.viewId = item.metadata?.viewId
        databaseMenuRouteParams.value.tableId = item.metadata?.tableId
        databaseMenuRouteParams.value.detailId = item.id
        databaseMenuRouteParams.value.detailType = item.item_type
        databaseMenuRouteParams.value.item_id = item.item_id
        databaseMenuRouteParams.value.pageType = pageType
        console.log('navigateToItem', databaseMenuRouteParams.value)
        break
      case MenuType.table:
        databaseMenuRouteParams.value.detailId = item.id
        databaseMenuRouteParams.value.detailType = item.item_type
        databaseMenuRouteParams.value.item_id = item.item_id
        databaseMenuRouteParams.value.pageType = pageType
        break
      case MenuType.dashboard:
        databaseMenuRouteParams.value.detailId = item.id
        databaseMenuRouteParams.value.detailType = MenuType.dashboard
        databaseMenuRouteParams.value.pageType = pageType
        break
      default:
        console.warn('Unknown item type:', item.item_type)
    }
    routerProvider?.updateProps({
      detailId: databaseMenuRouteParams.value.detailId,
      detailType: databaseMenuRouteParams.value.detailType,
      item_id: databaseMenuRouteParams.value.item_id,
      pageType: databaseMenuRouteParams.value.pageType,
      viewId: databaseMenuRouteParams.value.viewId,
      tableId:databaseMenuRouteParams.value.tableId
    })
  }

  /**
   * Go back from record detail view to the table view
   */
  function goBackFromRecord() {
    const tableId = databaseMenuRouteParams.value.tableId
    // Clear record-specific params
    databaseMenuRouteParams.value.recordId = null
    databaseMenuRouteParams.value.tableId = null

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
    databaseMenuRouteParams.value.detailType = 'root'
    databaseMenuRouteParams.value.detailId = null
  }

  function openSetting(slug: string, type: CaseTreeItemType) {
    console.log('openSetting', slug, type)
    databaseMenuRouteParams.value.pageType = 'setting'
    databaseMenuRouteParams.value.detailId = slug
    databaseMenuRouteParams.value.detailType = type
    // router.push(`/databases/${database.value?.id}/${type}/${slug}/setting`)
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

  const context: SingleDatabaseCopntext = {
    database,
    menuActionsRef,
    menuState,
    databaseMenuRouteParams,
    permissions,
    permissionsLoading,
    currentUserPermission,
    menuItemPermissions,
    menuItemPermissionsLoading,
    currentMenuItemPermission,
    menuItemPermissionMap,
    getDatabaseById,
    updateDatabase,
    getPermissions,
    getMenuItemPermissions,
    getAllMenuItemPermissions,
    getCurrentUserMenuItemPermission,
    checkMenuItemPermission,
    openMenuItemActions,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    addItem,
    navigateToItem,
    goBackFromRecord,
    openSetting,
    getMenuFromDb,
    saveMenuItemToDb,
    findItemById,
    getMenuIcon,
    buildTreeFromFlat
  }

  provide(SingleDatabaseContextKey, context)

  return context
}

export const SingleDatabaseContextKey: InjectionKey<SingleDatabaseCopntext> = Symbol('SingleDatabaseContext')

export function useSingleDatabaseContext() {
  const context = inject(SingleDatabaseContextKey)
  if (!context) {
    throw new Error('SingledatabaseContext is not provided')
  }
  return context
}
