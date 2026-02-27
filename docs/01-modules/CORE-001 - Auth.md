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
| [[FEAT-001.1 - Authentication]] | stable | Login/logout, JWT tokens, password reset |
| [[FEAT-001.2 - RBAC]] | stable | Role-based access, org chart, permissions |
| [[FEAT-001.3 - Password Policy]] | stable | Password rules, expiration, lockout |
| [[FEAT-001.4 - Session Management]] | stable | Token refresh, session timeout |
| [[FEAT-001.5 - External Portal]] | stable | Guest accounts, public access |

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
- Login → [[FEAT-001.1 - Authentication#Login Flow]]
- Permission Check → [[FEAT-001.2 - RBAC#Permission Assignment Flow]]
- Password Change → [[FEAT-001.3 - Password Policy#Password Change Flow]]

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
