import type { CaseTypeRecord, CaseTreeRecord } from '../utils/db/schema/newTableSchema'
import type { CaseTreeItemType } from '../utils/db/schema/newTableSchema'

export type { CaseTreeItemType }
import { v7 as uuidv7 } from 'uuid'

export const SingleWorkspaceContextKey: InjectionKey<WorkspaceContext> = Symbol('SingleWorkspaceContext')

// Tree item for component rendering (includes computed children)
export interface TreeItem extends CaseTreeRecord {
  children?: TreeItem[]
}

// Menu state for component
export interface MenuState {
  items: TreeItem[]
  expandedFolders: Set<string>
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
  openMenuItemActions: (data: {item: TreeItem | null, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) => void
  // Menu functions
  toggleFolder: (id: string) => void
  startEdit: (id: string) => void
  saveEdit: (id: string, newLabel: string) => Promise<void>
  cancelEdit: () => void
  deleteItem: (id: string) => Promise<void>
  addItem: (parentId: string | null, type: CaseTreeItemType) => Promise<TreeItem>
  navigateToItem: (item?: TreeItem) => void
  openSetting: (slug: string, type: CaseTreeItemType) => void
  getMenuFromDb: () => Promise<void>
  saveMenuItemToDb: (item: Partial<CaseTreeRecord>) => Promise<void>
  findItemById: (items: TreeItem[], id: string) => TreeItem | undefined
  recursiveUpdateItem: (items: TreeItem[], id: string, data: Partial<TreeItem>) => void
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
  detailId: string | null,
  detailType: 'folder' | 'table' | 'view' | 'dashboard' | 'root'
}

export function useSingleWorkspace() {
  const { query, exec } = usePglite()
  const router = useRouter()
  const workspace = ref<CaseTypeRecord | null>(null)

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

  function openMenuItemActions(data: {item: TreeItem | null, isAdmin: boolean}, target?: HTMLElement, highlight?: HTMLElement) {
    console.log('openMenuItemActions', data, menuActionsRef.value)
    menuActionsRef.value?.open(data, target, highlight)
  }

  async function getWorkspaceById(id: string) {
    const data = await query(`SELECT * FROM case_type WHERE id = $1`, [id])
    if (!data || data.length === 0) {
      workspace.value = null
      return
    }
    workspace.value = data[0] as CaseTypeRecord
  }

  async function saveWorkspaceToDb(newWorkspaceData?: CaseTypeRecord) {
    if (!newWorkspaceData && !workspace.value) return
    newWorkspaceData ||= workspace.value as CaseTypeRecord
    const { name, description, icon, id } = newWorkspaceData
    const now = new Date().toISOString()
    await query(
      `UPDATE case_type SET name = $1, icon = $2, description = $3, "updatedAt" = $4 WHERE id = $5`,
      [name, icon, description, now, id]
    )
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
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!
        parent.children = parent.children || []
        parent.children.push(treeItem)
      } else {
        rootItems.push(treeItem)
      }
    }

    // Sort by order
    const sortByOrder = (items: TreeItem[]) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0))
      items.forEach(item => {
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
  function flattenTree(items: TreeItem[], parentId: string | null = null): Partial<CaseTreeRecord>[] {
    const result: Partial<CaseTreeRecord>[] = []
    items.forEach((item, index) => {
      result.push({
        id: item.id,
        entityId: workspace.value?.id,
        label: item.label,
        slug: item.slug,
        description: item.description,
        itemType: item.itemType,
        itemId: item.itemId,
        parentId: parentId,
        order: index,
      })
      if (item.children && item.children.length > 0) {
        result.push(...flattenTree(item.children, item.id))
      }
    })
    return result
  }

  // Menu Functions
  async function saveMenuItemToDb(item: Partial<CaseTreeRecord>) {
    const now = new Date().toISOString()
    
    // Check if item exists
    const existing = await query<CaseTreeRecord[]>(
      `SELECT id FROM case_tree WHERE id = $1`,
      [item.id]
    )

    if (existing.length > 0) {
      // Update existing item
      await query(
        `UPDATE case_tree 
         SET label = $1, slug = $2, description = $3, "itemType" = $4, "itemId" = $5, 
             "parentId" = $6, "order" = $7, "updatedAt" = $8
         WHERE id = $9`,
        [
          item.label,
          item.slug,
          item.description || null,
          item.itemType,
          item.itemId || null,
          item.parentId || null,
          item.order || 0,
          now,
          item.id
        ]
      )
    } else {
      // Insert new item
      await query(
        `INSERT INTO case_tree (id, "entityId", label, slug, description, "itemType", "itemId", "parentId", "order", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          item.id,
          item.entityId || workspace.value?.id,
          item.label,
          item.slug,
          item.description || null,
          item.itemType,
          item.itemId || null,
          item.parentId || null,
          item.order || 0,
          now,
          now
        ]
      )
    }
  }

  async function getMenuFromDb() {
    if (!workspace.value) return
    
    const data = await query<CaseTreeRecord>(
      `SELECT * FROM case_tree WHERE "entityId" = $1 ORDER BY "order" ASC`,
      [workspace.value.id]
    )
    console.log('getMenuFromDb', data)
    const treeItems = buildTreeFromFlat(data)
    
    // Expand all folders by default
    const expandFolders = (items: TreeItem[]) => {
      for (const item of items) {
        if (item.itemType === 'folder') {
          menuState.value.expandedFolders.add(item.id)
          if (item.children) {
            expandFolders(item.children)
          }
        }
      }
    }
    expandFolders(treeItems)
    
    menuState.value.items = treeItems
  }

  function findItemById(items: TreeItem[], id: string): TreeItem | undefined {
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

  function removeItemById(items: TreeItem[], id: string): TreeItem[] {
    return items.filter(item => {
      if (item.id === id) return false
      if (item.children) {
        item.children = removeItemById(item.children, id)
      }
      return true
    })
  }

  function toggleFolder(id: string) {
    if (menuState.value.expandedFolders.has(id)) {
      menuState.value.expandedFolders.delete(id)
    } else {
      menuState.value.expandedFolders.add(id)
    }
  }

  function startEdit(id: string) {
    menuState.value.editingItemId = id
  }

  function recursiveUpdateItem(items: TreeItem[], id: string, data: Partial<TreeItem>) {
    for (const item of items) {
      if (item.id === id) {
        Object.keys(data).forEach((key: any) => {
          (item as any)[key] = (data as any)[key]
        })
        console.log('update item', item, data)
      }
      if (item.children) {
        recursiveUpdateItem(item.children, id, data)
      }
    }
  }

  async function saveEdit(id: string, newLabel: string) {
    recursiveUpdateItem(menuState.value.items, id, { label: newLabel })
    const item = findItemById(menuState.value.items, id)
    if (item) {
      await saveMenuItemToDb(item)
    }
    cancelEdit()
  }

  function cancelEdit() {
    menuState.value.editingItemId = null
  }

  async function deleteItem(id: string) {
    const item = findItemById(menuState.value.items, id)
    if (!item) return

    // For folders, recursively delete children first
    if (item.itemType === 'folder' && item.children) {
      for (const child of item.children) {
        await deleteItem(child.id)
      }
    }

    // For tables, delete the physical table and all metadata
    if (item.itemType === 'table' && item.itemId) {
      try {
        // Get the physical table name first
        const tableRecords = await query<{ tableName: string }>(
          `SELECT "tableName" FROM case_tables WHERE id = $1`,
          [item.itemId]
        )
        
        if (tableRecords.length > 0 && tableRecords[0].tableName) {
          // Drop the physical table
          await exec(`DROP TABLE IF EXISTS "${tableRecords[0].tableName}" CASCADE`)
        }
        
        // Delete metadata: fields, views, then table record
        await query(`DELETE FROM case_fields WHERE "tableId" = $1`, [item.itemId])
        await query(`DELETE FROM case_views WHERE "tableId" = $1`, [item.itemId])
        await query(`DELETE FROM case_tables WHERE id = $1`, [item.itemId])
      } catch (error) {
        console.error('Error deleting table:', error)
      }
    }

    // Delete the tree item from case_tree
    await query(`DELETE FROM case_tree WHERE id = $1`, [id])

    // Update local state
    menuState.value.items = removeItemById(menuState.value.items, id)
    
    // If the deleted item was currently being viewed, navigate to root
    if (workspaceRouteParams.value.detailId === id) {
      workspaceRouteParams.value.detailId = null
      workspaceRouteParams.value.detailType = 'root'
    }
  }

  async function addItem(parentId: string | null, type: CaseTreeItemType): Promise<TreeItem> {
    const now = new Date()
    const treeItemId = uuidv7()
    const label = `New ${type}`
    const slug = `new-${type}-${Date.now()}`
    
    let itemId: string | null = null
    
    // For tables, automatically create the physical table with default columns
    if (type === 'table' && workspace.value?.id) {
      const { createCaseTable, generateSlug } = useTableSchema()
      const tableId = uuidv7()
      
      try {
        // Create the table with only default system columns (no user columns)
        await createCaseTable(
          {
            id: tableId,
            name: label,
            entityId: workspace.value.id,
            description: null
          },
          [], // No user-defined fields, just default system columns
          undefined // createdBy
        )
        itemId = tableId
      } catch (error) {
        console.error('Error creating table:', error)
        throw error
      }
    }
    
    const newItem: TreeItem = {
      id: treeItemId,
      entityId: workspace.value?.id || null,
      label,
      slug,
      description: null,
      itemType: type,
      itemId,
      parentId: parentId,
      order: 0,
      createdBy: null,
      createdAt: now,
      updatedBy: null,
      updatedAt: now,
      children: type === 'folder' ? [] : undefined,
    }

    // Save to database
    await saveMenuItemToDb(newItem)

    // Update local state
    if (parentId) {
      menuState.value.expandedFolders.add(parentId)
      const parent = findItemById(menuState.value.items, parentId)
      if (parent && parent.itemType === 'folder') {
        parent.children = parent.children || []
        parent.children.push(newItem)
      }
    } else {
      menuState.value.items.push(newItem)
    }

    startEdit(newItem.id)
    return newItem
  }

  function navigateToItem(item?: TreeItem) {
    console.log('navigateToItem', item)
    if (!item) {
      workspaceRouteParams.value.detailId = null
      workspaceRouteParams.value.detailType = 'root'
      return
    }
    switch (item.itemType) {
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
        console.warn('Unknown item type:', item.itemType)
    }
  }

  function openSetting(slug: string, type: CaseTreeItemType) {
    router.push(`/workspaces/${workspace.value?.id}/${type}/${slug}/setting`)
  }

  function getMenuIcon(menuItem: TreeItem) {
    const item = findItemById(menuState.value.items, menuItem.id)
    switch (item?.itemType) {
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
    saveMenuItemToDb,
    findItemById,
    recursiveUpdateItem,
    getMenuIcon,
    buildTreeFromFlat,
  }

  provide(SingleWorkspaceContextKey, context)

  return context
}
