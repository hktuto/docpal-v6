---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-002
depends-on:
  - "[[AUTH-001 - Authentication]]"
---

# AUTH-002: RBAC & Permissions

## Overview
Role-Based Access Control (RBAC) system with organization chart-based permission hierarchy. Supports users, roles, groups, and resource-level permissions.

## Concepts

### User
- Individual with login credentials
- Can have multiple roles
- Belongs to groups

### Role
- Collection of permissions
- Hierarchical (org chart structure)
- Examples: Admin, Manager, User, Guest

### Group
- Collection of users
- Used for bulk permission assignment
- Can be nested (via org chart)

### Permission
- Action on a resource
- Examples: `document:read`, `document:write`, `admin:access`

## User Flows

### Assign Role to User
1. Admin opens RBAC management
2. Selects user from list
3. Assigns role(s) to user
4. Permissions immediately effective

### Check Permission (Runtime)
1. User attempts action
2. System checks user's roles
3. System checks role permissions
4. Access granted/denied

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/acl/users` | GET | List all users with roles |
| `/api/acl/users/{id}/roles` | POST | Assign roles to user |
| `/api/acl/roles` | GET | List all roles |
| `/api/acl/roles/{id}` | GET | Get role details |
| `/api/acl/roles/hierarchy` | GET | Get role org chart |
| `/api/acl/groups` | GET | List all groups |
| `/api/acl/permissions/check` | POST | Check if user has permission |

## File Structure

### UI Components
| File | Purpose |
|------|---------|
| `packages/rbac/components/rbac/user/list.vue` | User management list |
| `packages/rbac/components/rbac/editRoleSidebar/index.vue` | Role editing panel |
| `packages/rbac/components/rbac/editRoleSidebar/userTable.vue` | Users in role table |
| `packages/rbac/components/rbac/editRoleSidebar/AddUserDialog.vue` | Add user to role dialog |
| `packages/rbac/components/rbac/userGroup/list.vue` | Group management |
| `packages/rbac/components/rbac/OrgChart/X6/index.vue` | Org chart visualization |
| `packages/rbac/components/rbac/OrgChart/X6/nodes/person.vue` | Person node in org chart |
| `packages/rbac/components/resource/document/permission/table.vue` | Document permissions table |
| `packages/rbac/components/resource/document/permission/dialog.vue` | Permission assignment dialog |

### Logic
| File | Purpose |
|------|---------|
| `packages/rbac/composables/useRBAC.ts` | RBAC composable - role tree, user assignment |
| `packages/rbac/components/rbac/OrgChart/X6/types.ts` | Org chart type definitions |

## UI Screenshots
> *To be added: User list screenshot*
> *To be added: Org chart visualization*
> *To be added: Permission assignment dialog*

## Permission Structure

### Document Permissions
- `document:read` - View documents
- `document:write` - Edit documents
- `document:delete` - Delete documents
- `document:share` - Share documents
- `document:download` - Download documents

### Admin Permissions
- `admin:access` - Access admin panel
- `admin:users` - Manage users
- `admin:roles` - Manage roles
- `admin:settings` - System settings

## Related Features
- [[AUTH-001 - Authentication]]
- [[AUTH-005 - External Portal / Guest Access]]

## Completion Checklist
- [x] User-role assignment
- [x] Role hierarchy (org chart)
- [x] Group management
- [x] Document-level permissions
- [x] Permission checking composable
- [x] UI for permission management
