---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-004
depends-on:
  - "[[FEAT-001.1 - Authentication]]"
---

# FEAT-001.4: Session Management

## Overview
JWT session lifecycle management with automatic token refresh, idle timeout detection, and multi-device handling.

## Session Lifecycle

```
Login → Active → Idle Warning → Timeout → Logout
  ↓        ↓          ↓            ↓
 Token  Refresh   Prompt      Clear State
 Issued  Token    Continue?   
```

## User Flows

### Token Refresh Flow
1. Access token expires (15-30 min)
2. API call returns 401
3. Axios interceptor catches 401
4. Refresh token sent to `/api/auth/refresh`
5. New access token received
6. Original request retried

### Idle Timeout Flow
1. User inactive for configured period
2. Idle warning modal appears
3. User clicks "Stay Logged In"
4. Token refreshed, idle timer reset
5. If no response → automatic logout

### Multi-Device Handling
- Each device gets unique token pair
- Logout from one device doesn't affect others
- "Log out all devices" option available

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/refresh` | POST | Get new access token |
| `/api/auth/session` | GET | Get current session info |
| `/api/auth/sessions` | GET | List all active sessions |
| `/api/auth/sessions/{id}` | DELETE | Revoke specific session |
| `/api/auth/sessions/all` | DELETE | Logout all devices |

## File Structure

### Logic
| File | Purpose |
|------|---------|
| `packages/authApp/composables/useAuth.ts` | Session state, token management |
| `packages/authApp/plugins/auth.ts` | Axios interceptors for auto-refresh |
| `packages/authApp/utils/axiosResponseHelper.ts` | Response handling, retry logic |

### UI Components
| File | Purpose |
|------|---------|
| `packages/authApp/components/app/updateToast.vue` | Session expiry warning |
| `packages/authApp/layouts/auth.vue` | Auth-aware layout |

## Configuration

### Session Settings (Runtime Config)
```typescript
{
  accessTokenExpiry: 900,      // 15 minutes (seconds)
  refreshTokenExpiry: 604800,  // 7 days (seconds)
  idleTimeout: 1800,           // 30 minutes (seconds)
  idleWarning: 300             // 5 min warning before timeout
}
```

## UI Screenshots
> *To be added: Idle warning modal*
> *To be added: Active sessions list*

## Technical Notes

### Token Storage
- Access token: localStorage (short-lived)
- Refresh token: localStorage (httpOnly cookie preferred but not implemented)
- User preferences: localStorage

### Security
- Tokens cleared on logout
- Tokens cleared on browser close (optional)
- CSRF not needed (token in header, not cookie)

### Idle Detection
- Mouse move/keyboard events reset timer
- API activity resets timer
- Background tabs still tracked

## Related Features
- [[FEAT-001.1 - Authentication]]

## Completion Checklist
- [x] Auto token refresh
- [x] Idle timeout detection
- [x] Idle warning modal
- [x] Multi-device session list
- [x] "Logout all devices" function
