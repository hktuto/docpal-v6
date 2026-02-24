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

### 1. Authentication (Login, Logout, Password Reset)

**Main Package**: `packages/authApp/`

#### Pages
| File | Description |
|------|-------------|
| `packages/authApp/pages/login.vue` | Main login page with username/password form, JWT token storage |
| `packages/authApp/pages/resetPassword.vue` | Password reset page for logged-in users, enforces password policy rules |
| `packages/authApp/pages/forgetPassword.vue` | Forgot password page for requesting password reset via email |
| `packages/authApp/pages/initPassword.vue` | Initial password setup page for new users |
| `packages/authApp/pages/index.vue` | Auth app entry point |
| `packages/authApp/pages/admin.vue` | Admin panel entry |

#### Composables
| File | Description |
|------|-------------|
| `packages/authApp/composables/useAuth.ts` | Core auth composable: login(), logout(), verifly(), JWT parsing, user state management, role checking (isAdmin/isSuperAdmin), user preferences |
| `packages/authApp/composables/useMenu.ts` | Menu state management based on auth |
| `packages/authApp/composables/useAppUpdate.ts` | App update checking |
| `packages/authApp/composables/useDocumentType.ts` | Document type handling with auth |

#### Plugins
| File | Description |
|------|-------------|
| `packages/authApp/plugins/auth.ts` | Auth plugin: sets up API interceptors, auto-login on app mount, handles public page bypass |

#### Components
| File | Description |
|------|-------------|
| `packages/authApp/components/auth/state.vue` | Auth state wrapper component (shows content only when logged in) |
| `packages/authApp/components/auth/user.vue` | User display component |
| `packages/authApp/components/app/updateToast.vue` | App update notification |

#### Layouts
| File | Description |
|------|-------------|
| `packages/authApp/layouts/auth.vue` | Main authenticated layout with tab management, layout persistence |

#### Utils
| File | Description |
|------|-------------|
| `packages/authApp/utils/axiosResponseHelper.ts` | Axios interceptors: token injection, 401/403 handling, automatic refresh token flow, logout on auth failure |

#### Types
| File | Description |
|------|-------------|
| `packages/authApp/types/user.ts` | User TypeScript interfaces |

---

### 2. RBAC (Users, Roles, Org Chart)

**Main Package**: `packages/rbac/`

#### Composables
| File | Description |
|------|-------------|
| `packages/rbac/composables/useRBAC.ts` | RBAC composable: role tree management, org chart data fetching, flat role list generation |

#### Components - Role Management
| File | Description |
|------|-------------|
| `packages/rbac/components/rbac/user/list.vue` | User list table with filtering and actions |
| `packages/rbac/components/rbac/userGroup/list.vue` | User group list management |
| `packages/rbac/components/rbac/table.vue` | RBAC data table component |
| `packages/rbac/components/rbac/createDialog.vue` | Dialog for creating new roles/groups |
| `packages/rbac/components/rbac/editRoleSidebar/index.vue` | Sidebar for editing role details, parent roles, and permissions |
| `packages/rbac/components/rbac/editRoleSidebar/userTable.vue` | User assignment table within role editor |
| `packages/rbac/components/rbac/editRoleSidebar/AddUserDialog.vue` | Dialog for adding users to roles |

#### Components - Org Chart
| File | Description |
|------|-------------|
| `packages/rbac/components/rbac/OrgChart/index.vue` | Main org chart container, handles CRUD operations for roles |
| `packages/rbac/components/rbac/OrgChart/X6/index.vue` | X6 graph visualization engine integration |
| `packages/rbac/components/rbac/OrgChart/X6/nodes/person.vue` | Person/role node component for org chart |
| `packages/rbac/components/rbac/OrgChart/X6/ContextMenu.vue` | Right-click context menu for org chart nodes |
| `packages/rbac/components/rbac/OrgChart/X6/types.ts` | TypeScript types for org chart nodes |

#### Components - Resource Permissions
| File | Description |
|------|-------------|
| `packages/rbac/components/resource/document/breadcrumb.vue` | Document permission breadcrumb navigation |
| `packages/rbac/components/resource/document/table.vue` | Document resource table |
| `packages/rbac/components/resource/document/userSet/dialog.vue` | User set assignment dialog |
| `packages/rbac/components/resource/document/userSet/form.vue` | User set form |
| `packages/rbac/components/resource/document/userSet/docForm.vue` | Document-specific user set form |
| `packages/rbac/components/resource/document/permission/dialog.vue` | Permission assignment dialog |
| `packages/rbac/components/resource/document/permission/table.vue` | Permission table view |
| `packages/rbac/components/resource/document/permission/detail/dialog.vue` | Permission detail dialog |
| `packages/rbac/components/resource/document/permission/detail/form.vue` | Permission detail form |
| `packages/rbac/components/resource/document/permission/detail/checkbox.vue` | Checkbox-based permission selector |
| `packages/rbac/components/resource/document/permission/detail/checkboxForm.vue` | Checkbox permission form |

#### i18n
| File | Description |
|------|-------------|
| `packages/rbac/i18n/zh-CN.json` | Chinese translations for RBAC |

---

### 3. Password Policy

**Main Package**: `pages/admin-password-policy/`

#### Components
| File | Description |
|------|-------------|
| `pages/admin-password-policy/components/passwordPolicy/index.vue` | Main password policy configuration form with all settings |
| `pages/admin-password-policy/components/passwordPolicy/switch.vue` | Toggle switch component for policy options |
| `pages/admin-password-policy/components/global/passwordPolicy/page.vue` | Global password policy page wrapper |

#### Password Policy Features
- Minimum password length (8-24 characters)
- Require lowercase and uppercase letters
- Require numeric digits
- Require special characters (!@#$%&*)
- Force password reset on first login
- Password expiration settings
- Account lockout policy (retry period, lock period, lock count)
- Password reuse restriction

#### Tests
| File | Description |
|------|-------------|
| `pages/admin-password-policy/__test__/passwordPolicy.nuxt.spec.ts` | Password policy unit tests |
| `pages/admin-password-policy/__test__/setup.ts` | Test setup |
| `pages/admin-password-policy/__test__/util.ts` | Test utilities |
| `pages/admin-password-policy/__test__/mock/api.ts` | API mocks |
| `pages/admin-password-policy/__test__/mock/element-plus.ts` | Element Plus mocks |

---

### 4. Guest/External Portal

**Public Share Package**: `pages/public-share/`
| File | Description |
|------|-------------|
| `pages/public-share/pages/public/share.vue` | Public share access page |
| `pages/public-share/components/sharePassword.vue` | Password verification form for shared links |
| `pages/public-share/components/sharePassword.vform.json` | Form schema for share password |
| `pages/public-share/components/shareTable.vue` | Shared content table view |

**Public Upload Package**: `pages/public-upload/`
| File | Description |
|------|-------------|
| `pages/public-upload/pages/public/upload.vue` | Public file upload page |
| `pages/public-upload/pages/public/uploadTip.vue` | Upload tips/instructions page |
| `pages/public-upload/components/uploadPassword.vue` | Password verification for upload links |
| `pages/public-upload/components/uploadPassword.vform.json` | Form schema for upload password |
| `pages/public-upload/components/uploadForm.vue` | Upload form component |
| `pages/public-upload/components/fileInputBlob.vue` | File input with blob handling |

**Public Easy Form Package**: `pages/public-easy-form/`
| File | Description |
|------|-------------|
| `pages/public-easy-form/pages/public/public-form.vue` | Public form submission page |

**Public App Package**: `packages/publicApp/`
| File | Description |
|------|-------------|
| `packages/publicApp/plugins/response.ts` | Axios interceptors for public API |
| `packages/publicApp/utils/axiosResponseHelper.ts` | Public API auth helper with token handling |

---

### 5. Session Management

**Token Storage & Management**
| Location | Description |
|----------|-------------|
| `localStorage.getItem('access_token')` | JWT access token storage |
| `localStorage.getItem('refresh_token')` | JWT refresh token storage |
| `localStorage.getItem('docpal-user')` | Cached user info |
| `localStorage.clear()` | Called on logout |

**Session Handling Files**
| File | Description |
|------|-------------|
| `packages/authApp/composables/useAuth.ts` | Session verification (verifly), token parsing, user state restoration |
| `packages/authApp/utils/axiosResponseHelper.ts` | 401/403 error handling, automatic token refresh, session expiry redirect |
| `packages/publicApp/utils/axiosResponseHelper.ts` | Public API session handling |

**Session Features**
- JWT access token + refresh token pattern
- Automatic token refresh on 401 errors
- Session expiry detection (420 status code)
- Event bus notifications for login/logout events
- User info caching in localStorage
- SQLite user data synchronization for offline support

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
