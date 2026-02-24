# CORE-001: Auth (Identity & Access)

## Metadata
- **type**: core
- **depend-on**: *(none - this is a foundation)*
- **status**: stable
- **required-by**: All other modules

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
- [ ] ~~SSO integration~~ (REMOVED from scope)
- [x] Permission system documented

## Legacy References
- Keycloak code remains commented in `packages/authApp/plugins/auth.ts` for reference only
- No plans to re-implement SSO
