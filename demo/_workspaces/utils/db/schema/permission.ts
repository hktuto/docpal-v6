/**
 * Permission System Schema
 * 
 * Roles:
 * - read: Can view the item and its contents
 * - readWrite: Can view and edit the item and its contents
 * - manage: Can view, edit, and manage permissions (full control)
 * 
 * Permission Inheritance:
 * - Permissions are applied to folder, table, and view items
 * - If no explicit permission is set, inheritance rules apply:
 *   - Views inherit from their parent table
 *   - Tables inherit from their parent folder
 *   - Folders inherit from their parent folder
 * - If no permission found in hierarchy, default is no access
 * 
 * Phase 1: Permissions are assigned to individual users only
 * Creator is automatically assigned 'manage' role
 */

import { text, timestamp, uuid, pgTable, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './user'
import { caseTree } from './newTableSchema'

/**
 * Permission roles
 */
export type PermissionRole = 'read' | 'readWrite' | 'manage'

/**
 * Permission record for workspace items
 * Each record grants a specific role to a user for a specific item
 */
export const workspacePermissions = pgTable(
  'workspace_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // The item being permissioned (references case_tree.id)
    itemId: uuid('itemId')
      .notNull()
      .references(() => caseTree.id, { onDelete: 'cascade' }),
    
    // The user being granted permission
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // The role granted
    role: text('role').$type<PermissionRole>().notNull(),
    
    // Who granted this permission
    grantedBy: uuid('grantedBy').references(() => users.id),
    
    // Timestamps
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow()
  },
  (table) => ({
    // Ensure one permission record per user per item
    uniqueUserItemPermission: uniqueIndex('unique_user_item_permission').on(
      table.itemId,
      table.userId
    )
  })
)

// =============================================================================
// Type Exports
// =============================================================================

export type WorkspacePermissionRecord = typeof workspacePermissions.$inferSelect
export type WorkspacePermissionInsert = typeof workspacePermissions.$inferInsert

/**
 * Permission check result
 */
export interface PermissionCheck {
  hasPermission: boolean
  role: PermissionRole | null
  isInherited: boolean
  sourceItemId?: string // The item ID where the permission was found (for inheritance tracing)
}

/**
 * Permission with user details (for UI display)
 */
export interface PermissionWithUser extends WorkspacePermissionRecord {
  userName?: string
  userEmail?: string
  userAvatar?: string
}

/**
 * Effective permission for an item (resolved with inheritance)
 */
export interface EffectivePermission {
  itemId: string
  userId: string
  role: PermissionRole | null
  isInherited: boolean
  sourceItemId: string | null // null if no permission found
}
