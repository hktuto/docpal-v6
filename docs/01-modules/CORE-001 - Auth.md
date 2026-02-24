# CORE-001: Auth (Identity & Access)

## Metadata
type:: core
depend-on:: *(none - this is a foundation)*
status:: stable
required-by:: All other modules

## Marketing Description
User authentication, profile management, and permission frameworks (RBAC).

## Technical Scope
- Login/Logout
- ~~SSO (Keycloak)~~ **LEGACY - Removed**
- JWT-based authentication (current)
- User profiles
- User groups
- RBAC permissions
- Session management
- Password policies

## Implementation

### Authentication
- **Package**: `packages/authApp/`
- **Composables**: `packages/authApp/composables/useAuth.ts`
- **Pages**:
  - `packages/authApp/pages/login.vue`
  - `packages/authApp/pages/resetPassword.vue`
  - `packages/authApp/pages/forgetPassword.vue`
  - `packages/authApp/pages/initPassword.vue`

### RBAC (Role-Based Access Control)
- **Package**: `packages/rbac/`
- **Components**:
  - `packages/rbac/components/rbac/user/list.vue`
  - `packages/rbac/components/rbac/OrgChart/X6/`
  - `packages/rbac/components/resource/document/`

### Password Policy
- **Admin Pages**: `pages/admin-password-policy/`
- Configurable password rules
- Policy enforcement

### External Portal / Guest Access
- Integrated with Auth system
- Public pages: `pages/public-share/`, `pages/public-upload/`, `pages/public-easy-form/`

## Architecture

### Current Implementation (JWT)
- Token-based auth using localStorage
- Access token + refresh token pattern
- Role-based access control (RBAC) implemented
- Org chart-based permission hierarchy

### Legacy (Removed)
- ~~Keycloak SSO integration~~ - **REMOVED**
- ~~LDAP integration~~ - **REMOVED**

## Completion Checklist
- [x] Core auth flow stable (JWT)
- [x] Login/Logout/Password reset
- [x] RBAC with org chart permissions
- [x] Password policy implementation
- [x] Guest account support (External Portal)
- [ ] ~~SSO integration~~ (REMOVED from scope)
