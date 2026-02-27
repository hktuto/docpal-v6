---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-001
depends-on: []
---

# FEAT-001.1: Authentication (Login/Logout)

## Overview
JWT-based authentication system with login, logout, and password reset flows. Replaces legacy Keycloak SSO.

## User Flows

### Login Flow
1. User enters username/password on login page
2. Credentials validated against backend API
3. JWT access token + refresh token returned
4. Token stored in localStorage
5. User state updated, redirected to default path

### Logout Flow
1. User clicks logout or token expires
2. localStorage cleared
3. User redirected to login page

### Password Reset Flow
1. User clicks "Forgot Password"
2. Reset email sent (via backend)
3. User clicks link in email → resetPassword.vue
4. New password validated against policy
5. Password updated, user redirected to login

## API Endpoints

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/auth/login` | POST | Authenticate user | `{username, password}` | `{token, refreshToken, user}` |
| `/api/auth/logout` | POST | End session | `{token}` | `200 OK` |
| `/api/auth/refresh` | POST | Refresh token | `{refreshToken}` | `{newToken}` |
| `/api/auth/reset-password` | POST | Request reset | `{email}` | `200 OK` |
| `/api/auth/verify-token` | GET | Validate token | Header: `Authorization: Bearer {token}` | `{valid: boolean}` |

## File Structure

### UI Components
| File | Purpose |
|------|---------|
| `packages/authApp/pages/login.vue` | Main login form UI |
| `packages/authApp/pages/resetPassword.vue` | Password reset form (logged-in) |
| `packages/authApp/pages/forgetPassword.vue` | Forgot password request |
| `packages/authApp/pages/initPassword.vue` | New user password setup |
| `packages/authApp/layouts/auth.vue` | Auth layout wrapper |

### Logic
| File | Purpose |
|------|---------|
| `packages/authApp/composables/useAuth.ts` | Core auth composable - login(), logout(), JWT handling |
| `packages/authApp/plugins/auth.ts` | Plugin setup - interceptors, auto-login |
| `packages/authApp/types/user.ts` | User DTO types |

### Utilities
| File | Purpose |
|------|---------|
| `packages/authApp/utils/axiosResponseHelper.ts` | Axios request/response interceptors |

## UI Screenshots
> *To be added: Login page screenshot*
> *To be added: Password reset flow screenshots*

## Technical Notes

### JWT Handling
- Access token: Short-lived (configurable, typically 15-30 min)
- Refresh token: Longer-lived, used to get new access tokens
- Tokens stored in localStorage (not cookies - no CSRF issues)
- Auto-refresh implemented via axios interceptor

### Public Pages
These pages bypass auth check:
- `/login`
- `/forgetPassword`
- `/resetPassword`
- `/initPassword`
- `/public/*`

### Security Considerations
- Password never stored client-side
- JWT tokens cleared on logout
- Role checks (isAdmin/isSuperAdmin) from token claims

## Related Features
- [[FEAT-001.2 - RBAC]]
- [[FEAT-001.3 - Password Policy]]
- [[FEAT-001.4 - Session Management]]

## Completion Checklist
- [x] Login page with form validation
- [x] JWT token storage and management
- [x] Password reset flow
- [x] Auto-refresh token
- [x] Role-based redirects
- [x] Public page bypass
- [ ] ~~Keycloak SSO~~ (removed from scope)
