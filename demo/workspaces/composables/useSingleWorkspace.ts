import type { CaseTypeRecord, CaseTreeRecord, ViewType, ViewSettings } from '../utils/db/schema/newTableSchema'
import type { CaseTreeItemType } from '../utils/db/schema/newTableSchema'
import { getCurrentUserId } from './useCurrentUser'
import { usePermission } from './usePermission'
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
  openMenuItemActions: (data: { item: TreeItem | null; isAdmin: boolean }, target?: HTMLElement, highlight?: HTMLElement) => void
  // Menu functions
  toggleFolder: (id: string) => void
  startEdit: (id: string) => void
  saveEdit: (id: string, newLabel: string) => Promise<void>
  cancelEdit: () => void
  deleteItem: (id: string) => Promise<void>
  addItem: (parentId: string | null, type: CaseTreeItemType, viewData?: ViewCreationData) => Promise<TreeItem>
  navigateToItem: (item?: TreeItem) => void
  navigateToRecord: (tableId: string, recordId: string) => void
  goBackFromRecord: () => void
  openSetting: (slug: string, type: CaseTreeItemType) => void
  getMenuFromDb: () => Promise<void>
  saveMenuItemToDb: (item: Partial<CaseTreeRecord>) => Promise<void>
  findItemById: (items: TreeItem[], id: string) => TreeItem | undefined

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
  detailType: 'folder' | 'table' | 'view' | 'dashboard' | 'root' | 'record'
  /** For record detail view: the record ID being viewed */
  recordId?: string | null
  /** For record detail view: the table ID the record belongs to */
  tableId?: string | null
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
    expandedFolders: new Set(),
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
    const dto: any = {
      name,
      description,
      metadata: {
        icon
      }
    }

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
    const now = new Date().toISOString()

    // Check if item exists
    const existing = await query<CaseTreeRecord[]>(`SELECT id FROM case_tree WHERE id = $1`, [item.id])

    if (existing.length > 0) {
      // Update existing item
      const currentUserId = getCurrentUserId()
      await query(
        `UPDATE case_tree
         SET label = $1, slug = $2, description = $3, "itemType" = $4, "itemId" = $5,
             "parentId" = $6, "order" = $7, "updatedAt" = $8, "updatedBy" = $9
         WHERE id = $10`,
        [
          item.label,
          item.slug,
          item.description || null,
          item.itemType,
          item.itemId || null,
          item.parentId || null,
          item.order || 0,
          now,
          currentUserId,
          item.id
        ]
      )
    } else {
      // Insert new item
      const currentUserId = getCurrentUserId()
      await query(
        `INSERT INTO case_tree (id, "entityId", label, slug, description, "itemType", "itemId", "parentId", "order", "createdBy", "createdAt", "updatedBy", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
          currentUserId,
          now,
          currentUserId,
          now
        ]
      )
    }
  }

  async function getMenuFromDb() {
    if (!workspace.value) return

    const data = await query<CaseTreeRecord>(`SELECT * FROM case_tree WHERE "entityId" = $1 ORDER BY "order" ASC`, [workspace.value.id])
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
    return items.filter((item) => {
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

  async function saveEdit(id: string, newLabel: string) {
    const item = findItemById(menuState.value.items, id)

    if (item) {
      item.label = newLabel
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
      menuState.value.expandedFolders.delete(id)
    }

    // For tables, delete the physical table and all metadata
    if (item.itemType === 'table' && item.itemId) {
      try {
        // Get the physical table name first
        const tableRecords = await query<{ tableName: string }>(`SELECT "tableName" FROM case_tables WHERE id = $1`, [item.itemId])

        if (tableRecords.length > 0 && tableRecords[0].tableName) {
          // Drop the physical table
          await exec(`DROP TABLE IF EXISTS "${tableRecords[0].tableName}" CASCADE`)
        }

        // Delete relation suggestions for this table
        // (CASCADE should handle this, but explicit cleanup for clarity)
        await query(
          `DELETE FROM relation_suggestions
           WHERE "sourceTableId" = $1 OR "targetTableId" = $1`,
          [item.itemId]
        )

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

  async function addItem(parentId: string | null, type: CaseTreeItemType, viewData?: ViewCreationData): Promise<TreeItem> {
    const now = new Date()
    const treeItemId = uuidv7()
    let label = `New ${type}`
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

    // For views, create the view in the database
    if (type === 'view' && workspace.value?.id && viewData) {
      const viewId = uuidv7()
      const viewName = `view_${viewId.replace(/-/g, '_')}`
      label = viewData.name

      try {
        // Get all fields from the base table to include in the view
        const tableFields = await query<{ fieldName: string }>(`SELECT "fieldName" FROM case_fields WHERE "tableId" = $1`, [viewData.tableId])
        const fieldNames = tableFields.map((f) => f.fieldName)

        // Create the view record
        const currentUserId = getCurrentUserId()
        await query(
          `INSERT INTO case_views (
            id, name, description, "viewName", "viewType", "viewSettings",
            filter, sorting, grouping, "tableId", "isDefault", "entityId",
            fields, "createdBy", "createdAt", "updatedBy", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            viewId,
            viewData.name,
            null,
            viewName,
            viewData.viewType,
            JSON.stringify(viewData.viewSettings),
            null,
            null,
            null,
            viewData.tableId,
            false, // isDefault
            workspace.value.id,
            fieldNames,
            currentUserId,
            now,
            currentUserId,
            now
          ]
        )
        itemId = viewId
      } catch (error) {
        console.error('Error creating view:', error)
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
      children: type === 'folder' ? [] : undefined
    }

    // Save to database
    await saveMenuItemToDb(newItem)

    // Auto-assign 'manage' permission to creator
    const { assignCreatorPermission } = usePermission()
    try {
      await assignCreatorPermission(newItem.id)
    } catch (error) {
      console.error('Failed to assign creator permission:', error)
      // Don't fail the creation if permission assignment fails
    }

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
    if (type === 'folder') {
      menuState.value.expandedFolders.add(newItem.id)
    }
    // For views, we already have the name from viewData, no need to edit
    if (type !== 'view') {
      startEdit(newItem.id)
    }
    return newItem
  }

  function navigateToItem(item?: TreeItem, pageType: 'setting' | 'detail' = 'detail') {
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
        workspaceRouteParams.value.pageType = pageType
        break
      case 'view':
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = 'view'
        workspaceRouteParams.value.pageType = pageType
        break
      case 'dashboard':
        workspaceRouteParams.value.detailId = item.id
        workspaceRouteParams.value.detailType = 'dashboard'
        workspaceRouteParams.value.pageType = pageType
        break
      default:
        console.warn('Unknown item type:', item.itemType)
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
          if (item.itemType === 'table' && item.itemId === tableId) {
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
