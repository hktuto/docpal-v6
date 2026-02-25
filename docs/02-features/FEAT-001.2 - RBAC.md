---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-002
depends-on:
  - "[[FEAT-001.1 - Authentication]]"
---

# FEAT-001.2: RBAC

## Overview
Role-Based Access Control (RBAC) system with org chart hierarchy, user groups, and document-level permissions.

## User Flows

### Role Hierarchy
```
CEO
└── Managing Director
    ├── Department Head
    │   ├── Manager
    │   │   └── Staff
```

### Permission Assignment Flow
1. Admin creates role in org chart
2. Assign permissions to role (document read/write/delete)
3. Add users to role
4. Users inherit permissions via role membership

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/acl/roles` | GET | List all roles |
| `/api/acl/roles/{id}` | GET | Get role details |
| `/api/acl/roles` | POST | Create new role |
| `/api/acl/roles/{id}/users` | GET | List users in role |
| `/api/acl/permissions/check` | POST | Check if user has permission |
| `/api/acl/documents/{id}/permissions` | GET | Get document permissions |

## File Structure

### UI Components
| File | Purpose |
|------|---------|
| `packages/rbac/components/rbac/user/list.vue` | User management list |
| `packages/rbac/components/rbac/userGroup/list.vue` | User group management |
| `packages/rbac/components/rbac/OrgChart/X6/index.vue` | Org chart visualization |
| `packages/rbac/components/rbac/OrgChart/X6/nodes/person.vue` | Person node in org chart |
| `packages/rbac/components/rbac/resource/document/permission/dialog.vue` | Document permission dialog |
| `packages/rbac/components/rbac/resource/document/permission/table.vue` | Permission table view |

### Logic
| File | Purpose |
|------|---------|
| `packages/rbac/composables/useRBAC.ts` | RBAC composable - getRoleTree(), makeFlapRoleList() |
| `packages/rbac/components/rbac/OrgChart/X6/types.ts` | Org node TypeScript types |

### Resource Permissions
| File | Purpose |
|------|---------|
| `packages/rbac/components/resource/document/breadcrumb.vue` | Doc breadcrumb with perms |
| `packages/rbac/components/resource/document/userSet/dialog.vue` | User permission settings dialog |
| `packages/rbac/components/resource/document/userSet/form.vue` | Permission form |
| `packages/rbac/components/resource/document/table.vue` | Document permission table |

## Permission Types

### Document Permissions
- **Read**: View document
- **Write**: Edit metadata
- **Delete**: Move to trash
- **Share**: Create share links
- **Download**: Download file
- **Admin**: Full control

### System Permissions
- `ROLE_ADMIN`: Admin access
- `ROLE_SUPER`: Super admin access

## UI Screenshots
> *To be added: Org chart screenshot*
> *To be added: Permission dialog screenshot*

## Related Features
- [[FEAT-001.1 - Authentication]]
- [[FEAT-002.1 - Document Browse]] (document permissions)

## Technical Notes

### Org Chart (X6)
- Uses AntV X6 for visualization
- Drag-drop to reorganize hierarchy
- Context menus for node actions
- Auto-save position changes

### Permission Cache
- User permissions cached in session
- Refreshed on login/role change
- Document permissions checked server-side

## Completion Checklist
- [x] Org chart visualization
- [x] Role CRUD operations
- [x] User-role assignment
- [x] Document-level permissions
- [x] Permission checking composables
- [x] Permission UI in document browser
