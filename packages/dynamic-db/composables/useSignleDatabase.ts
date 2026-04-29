import type { DatabaseItem, DatabaseMenuRouteParams } from '../../../utils/databaseType'
import { newClientApi } from 'api'
import { MenuType } from '@packages/dp-mdTable/types/menu-type'
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
  getDatabaseById: (id: string) => Promise<void>
  updateDatabase: (database?: CaseTypeRecord) => Promise<void>
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

  async function getMenuFromDb() {
    if (!database.value) return

    const res = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: database.value.id
    })
    const list = (res as ResultListMenuDTO).data ?? []
    menuState.value.items = list
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
    return data
  }

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
    getDatabaseById,
    updateDatabase,
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
