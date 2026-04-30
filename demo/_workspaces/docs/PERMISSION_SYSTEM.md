# Workspace Permission System Design

## Overview

A role-based permission system for workspace items (folder, table, view) with support for permission inheritance.

## Roles

Three permission levels:

| Role | Description | Capabilities |
|------|-------------|--------------|
| `read` | Read-only access | View item and its contents |
| `readWrite` | Read and write | View and edit item contents |
| `manage` | Full control | View, edit, and manage permissions |

## Permission Inheritance

Permissions follow a hierarchical inheritance model:

```
Folder A (manage)
├── Folder B (read)         → inherits read from Folder A
│   ├── Table 1 (none)      → inherits read from Folder B
│   └── Table 2 (readWrite) → has explicit readWrite
│       └── View 1 (none)   → inherits readWrite from Table 2
└── Table 3 (none)          → inherits manage from Folder A
```

### Inheritance Rules

1. **Direct permission takes precedence** - If a user has an explicit permission on an item, that is used
2. **Walk up the tree** - If no direct permission, check parent folder
3. **Inherit from nearest ancestor** - The closest ancestor with a permission determines access
4. **No permission = No access** - If no permission found in hierarchy, access is denied

## Database Schema

### Table: `workspace_permissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `itemId` | UUID | References case_tree.id (the item being permissioned) |
| `userId` | UUID | References users.id (the user being granted access) |
| `role` | TEXT | One of: 'read', 'readWrite', 'manage' |
| `grantedBy` | UUID | Who granted this permission |
| `createdAt` | TIMESTAMP | When permission was created |
| `updatedAt` | TIMESTAMP | When permission was last updated |

### Constraints

- Unique constraint on (`itemId`, `userId`) - one permission per user per item
- Foreign key constraints with CASCADE delete

## Components

### 1. Permission Composable (`usePermission.ts`)

```typescript
// CRUD Operations
grantPermission(itemId, userId, role)
revokePermission(itemId, userId)
getItemPermissions(itemId)

// Permission Checking
getEffectivePermission(itemId, userId, menuItems) // with inheritance
checkPermission(itemId, userId, requiredRole, menuItems)
hasMinimumRole(actualRole, requiredRole)

// Filtering
filterMenuByPermission(items, userId)

// Setup
assignCreatorPermission(itemId)
transferOwnership(itemId, newOwnerId)
```

### 2. Permission Popover (`PermissionPopover.vue`)

A popover component for quick permission management from the menu:

- Shows current permissions with user avatars
- Allows role changes (if user has 'manage')
- Add new users with role selection
- Remove permissions

### 3. Menu Actions Integration

Added "Permissions" action to the menu actions dropdown:
- Opens permission popover
- Only visible to users with 'manage' permission

### 4. Settings Page Integration

Updated table permissions settings page:
- Real permission data from database
- Add/remove/update permissions
- User selection with search

## Auto-Assignment

When a user creates an item:
1. Item is created in database
2. Creator automatically gets 'manage' permission
3. Creator can then grant permissions to other users

## Usage Examples

### Check if user can edit a table

```typescript
const { checkPermission } = usePermission()
const { menuState } = useSingleWorkspaceContext()

const canEdit = await checkPermission(
  tableId, 
  currentUserId(), 
  'readWrite',
  menuState.value.items
)
```

### Grant permission to a user

```typescript
const { grantPermission } = usePermission()

await grantPermission(tableId, userId, 'readWrite')
```

### Filter menu by permissions

```typescript
const { filterMenuByPermission } = usePermission()
const { menuState } = useSingleWorkspaceContext()

const visibleItems = await filterMenuByPermission(
  menuState.value.items,
  currentUserId()
)
```

## Future Enhancements (Phase 2+)

1. **Group/Team permissions** - Assign permissions to groups, not just individual users
2. **Workspace-level permissions** - Default permissions for entire workspace
3. **Permission templates** - Predefined permission sets
4. **Audit log** - Track permission changes
5. **Time-based permissions** - Temporary access grants
6. **Public sharing** - Share items with public links (read-only)

## Migration

Run the migration to create the permissions table:

```sql
-- File: utils/db/migrations/003_add_permissions.sql
CREATE TABLE IF NOT EXISTS workspace_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL REFERENCES case_tree(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('read', 'readWrite', 'manage')),
  "grantedBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_item_permission UNIQUE ("itemId", "userId")
);

CREATE INDEX idx_workspace_permissions_item_id ON workspace_permissions("itemId");
CREATE INDEX idx_workspace_permissions_user_id ON workspace_permissions("userId");
```

## Files Created/Modified

### New Files
- `utils/db/schema/permission.ts` - TypeScript types and schema
- `composables/usePermission.ts` - Permission composable
- `components/workspaces/permission/PermissionPopover.vue` - Permission popover
- `utils/db/migrations/003_add_permissions.sql` - Database migration

### Modified Files
- `composables/useSingleWorkspace.ts` - Auto-assign creator permission
- `components/workspaces/menu/actions.vue` - Add permission action
- `components/global/workspaces/setting/table/permissions.vue` - Real permission data
- `components/global/workspaces/setting/table.vue` - Pass menu item to permissions
