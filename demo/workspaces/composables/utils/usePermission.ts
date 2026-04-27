/**
 * Permission Composable
 *
 * Manages workspace permissions with support for:
 * - CRUD operations on permissions
 * - Permission inheritance (folder -> table -> view)
 * - Current user permission checks
 * - Menu filtering based on permissions
 */

import type { PermissionRole, PermissionWithUser, EffectivePermission, WorkspacePermissionRecord } from '../../utils/db/schema/permission'
import type { TreeItem } from '../workspace/useSingleWorkspace'

export type { PermissionRole, PermissionWithUser, EffectivePermission }

/**
 * Role hierarchy (higher index = more permissions)
 */
const ROLE_HIERARCHY: PermissionRole[] = ['read', 'readWrite', 'manage']

/**
 * Check if a role has at least the required permission level
 */
export function hasMinimumRole(actualRole: PermissionRole | null, requiredRole: PermissionRole): boolean {
  if (!actualRole) return false

  const actualIndex = ROLE_HIERARCHY.indexOf(actualRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)

  return actualIndex >= requiredIndex
}

/**
 * Permission operations composable
 */
export function usePermission() {
  const { query } = usePglite()
  const { getCurrentUserId } = useCurrentUser()

  /**
   * Grant a permission to a user for an item
   */
  async function grantPermission(itemId: string, userId: string, role: PermissionRole, grantedBy?: string): Promise<WorkspacePermissionRecord> {
    if (!itemId) throw new Error('itemId is required')
    if (!userId) throw new Error('userId is required')
    
    const now = new Date().toISOString()
    const granterId = grantedBy || getCurrentUserId()

    // Check if permission already exists
    const existing = await query<WorkspacePermissionRecord[]>(
      `SELECT * FROM workspace_permissions
       WHERE "itemId" = $1 AND "userId" = $2`,
      [itemId, userId]
    )

    if (existing.length > 0) {
      // Update existing permission
      await query(
        `UPDATE workspace_permissions
         SET role = $1, "grantedBy" = $2, "updatedAt" = $3
         WHERE "itemId" = $4 AND "userId" = $5`,
        [role, granterId, now, itemId, userId]
      )
    } else {
      // Insert new permission
      await query(
        `INSERT INTO workspace_permissions ("itemId", "userId", role, "grantedBy", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, userId, role, granterId, now, now]
      )
    }

    // Return the updated/created permission
    const result = await query<WorkspacePermissionRecord[]>(
      `SELECT * FROM workspace_permissions
       WHERE "itemId" = $1 AND "userId" = $2`,
      [itemId, userId]
    )

    return result[0]
  }

  /**
   * Revoke a permission from a user for an item
   */
  async function revokePermission(itemId: string, userId: string): Promise<void> {
    if (!itemId) throw new Error('itemId is required')
    if (!userId) throw new Error('userId is required')
    
    await query(
      `DELETE FROM workspace_permissions
       WHERE "itemId" = $1 AND "userId" = $2`,
      [itemId, userId]
    )
  }

  /**
   * Get all permissions for an item
   */
  async function getItemPermissions(itemId: string): Promise<PermissionWithUser[]> {
    if (!itemId) return []
    
    const results = await query<PermissionWithUser[]>(
      `SELECT
        p.*,
        u.name as "userName",
        u.email as "userEmail",
        u.avatar as "userAvatar"
       FROM workspace_permissions p
       LEFT JOIN users u ON p."userId" = u.id
       WHERE p."itemId" = $1
       ORDER BY p."createdAt" DESC`,
      [itemId]
    )
    return results
  }

  /**
   * Get direct permission for a user on an item (no inheritance)
   */
  async function getDirectPermission(itemId: string, userId: string): Promise<PermissionRole | null> {
    const result = await query<{ role: PermissionRole }[]>(
      `SELECT role FROM workspace_permissions
       WHERE "itemId" = $1 AND "userId" = $2
       LIMIT 1`,
      [itemId, userId]
    )
    return result.length > 0 ? result[0].role : null
  }

  /**
   * Get effective permission for a user on an item (with inheritance)
   */
  async function getEffectivePermission(itemId: string, userId: string, menuItems: TreeItem[]): Promise<EffectivePermission> {
    // Check direct permission first
    const directRole = await getDirectPermission(itemId, userId)
    if (directRole) {
      return {
        itemId,
        userId,
        role: directRole,
        isInherited: false,
        sourceItemId: itemId
      }
    }

    // Walk up the hierarchy to find inherited permission
    let currentId: string | null = itemId
    const visited = new Set<string>()

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)

      // Get parent
      const parentId = getParentItemId(menuItems, currentId)
      if (!parentId) break

      // Check permission on parent
      const parentRole = await getDirectPermission(parentId, userId)
      if (parentRole) {
        return {
          itemId,
          userId,
          role: parentRole,
          isInherited: true,
          sourceItemId: parentId
        }
      }

      currentId = parentId
    }

    // No permission found
    return {
      itemId,
      userId,
      role: null,
      isInherited: false,
      sourceItemId: null
    }
  }

  /**
   * Check if a user has a specific permission level on an item
   */
  async function checkPermission(
    itemId: string,
    userId: string,
    requiredRole: PermissionRole,
    menuItems: TreeItem[]
  ): Promise<{ hasPermission: boolean; role: PermissionRole | null; isInherited: boolean }> {
    const effective = await getEffectivePermission(itemId, userId, menuItems)

    return {
      hasPermission: hasMinimumRole(effective.role, requiredRole),
      role: effective.role,
      isInherited: effective.isInherited
    }
  }

  /**
   * Get the parent item ID for a given item
   */
  function getParentItemId(items: TreeItem[], childId: string): string | null {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          if (child.id === childId) {
            return item.id
          }
        }
        const foundInChildren = getParentItemId(item.children, childId)
        if (foundInChildren) return foundInChildren
      }
    }
    return null
  }

  /**
   * Filter menu items based on user permissions
   * Returns only items where user has at least 'read' permission
   */
  async function filterMenuByPermission(items: TreeItem[], userId: string): Promise<TreeItem[]> {
    const filtered: TreeItem[] = []

    for (const item of items) {
      const effective = await getEffectivePermission(item.id, userId, items)

      // Include if user has any permission (read or higher)
      if (effective.role) {
        const filteredItem: TreeItem = { ...item }

        // Recursively filter children
        if (item.children && item.children.length > 0) {
          filteredItem.children = await filterMenuByPermission(item.children, userId)
        }

        filtered.push(filteredItem)
      }
    }

    return filtered
  }

  /**
   * Auto-assign 'manage' role to creator when creating an item
   */
  async function assignCreatorPermission(itemId: string, creatorId?: string): Promise<WorkspacePermissionRecord> {
    const userId = creatorId || getCurrentUserId()
    return grantPermission(itemId, userId, 'manage', userId)
  }

  /**
   * Transfer ownership (change creator's permission and update createdBy)
   */
  async function transferOwnership(itemId: string, newOwnerId: string, oldOwnerId?: string): Promise<void> {
    const currentOwner = oldOwnerId || getCurrentUserId()

    // Downgrade old owner to readWrite
    await grantPermission(itemId, currentOwner, 'readWrite', currentOwner)

    // Upgrade new owner to manage
    await grantPermission(itemId, newOwnerId, 'manage', currentOwner)
  }

  return {
    // CRUD
    grantPermission,
    revokePermission,
    getItemPermissions,
    getDirectPermission,

    // Checking
    getEffectivePermission,
    checkPermission,
    hasMinimumRole,

    // Filtering
    filterMenuByPermission,

    // Setup
    assignCreatorPermission,
    transferOwnership
  }
}
