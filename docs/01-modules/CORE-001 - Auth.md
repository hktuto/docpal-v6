---
type: core
depend-on: "*(none - this is a foundation)*"
status: stable
required-by: "All other modules"
---

# CORE-001: Auth (Identity & Access)

## Marketing Description
User authentication, profile management, and permission frameworks (RBAC).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Auth System                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Authentication│  │ RBAC &       │  │ Password Policy  │  │
│  │ (Login/Logout)│  │ Permissions  │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Session Mgmt │  │ Guest/Portal │  │                  │  │
│  │              │  │ Access       │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| [[CORE-001_AUTH-001_Authentication]] | stable | Login/logout, JWT tokens, password reset |
| [[CORE-001_AUTH-002_RBAC]] | stable | Role-based access, org chart, permissions |
| [[CORE-001_AUTH-003_Password Policy]] | stable | Password rules, expiration, lockout |
| [[CORE-001_AUTH-004_Session Management]] | stable | Token refresh, session timeout |
| [[CORE-001_AUTH-005_External Portal]] | stable | Guest accounts, public access |

## Technical Scope
- ~~SSO (Keycloak)~~ **LEGACY - Removed**
- JWT-based authentication (current)
- User profiles
- User groups
- RBAC permissions
- Session management
- Password policies

## Legacy (Removed)
- ~~Keycloak SSO integration~~ - **REMOVED**
- ~~LDAP integration~~ - **REMOVED**

## Implementation Packages

| Package | Purpose |
|---------|---------|
| `packages/authApp/` | Core authentication |
| `packages/rbac/` | Role-based access control |
| `pages/admin-password-policy/` | Password policy admin |
| `pages/public-share/`, `pages/public-upload/` | External portal |

## Quick Links

### User Flows
- Login → [[CORE-001_AUTH-001_Authentication#Login Flow]]
- Permission Check → [[CORE-001_AUTH-002_RBAC#Permission Assignment Flow]]
- Password Change → [[CORE-001_AUTH-003_Password Policy#Password Change Flow]]

### Admin Pages
- Password Policy: `/admin/password-policy`
- RBAC Management: `/admin/rbac`
- User Management: `/admin/users`

## Completion Checklist
- [x] Core auth flow stable (JWT)
- [x] Login/Logout/Password reset
- [x] RBAC with org chart permissions
- [x] Password policy implementation
- [x] Guest account support (External Portal)
- [ ] ~~SSO integration~~ (REMOVED from scope)

## Notes
- All features documented in separate pages under `02-features/`
- See individual feature pages for API docs, file paths, and screenshots
