---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-003
depends-on:
  - "[[AUTH-001 - Authentication]]"
---

# AUTH-003: Password Policy

## Overview
Configurable password policy enforcement for user passwords. Ensures minimum security standards across the organization.

## Policy Rules

### Minimum Length
- Default: 8 characters
- Configurable via admin panel

### Complexity Requirements
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

### Expiration
- Passwords expire after X days (configurable)
- Users prompted to reset on next login after expiry

### History
- Cannot reuse last N passwords (configurable, default: 5)

### Lockout Policy
- Account locked after N failed attempts (default: 5)
- Lockout duration: X minutes (default: 30)

## User Flows

### Password Creation/Reset
1. User enters new password
2. System validates against policy rules
3. If invalid: show specific error (e.g., "Need at least 1 uppercase")
4. If valid: accept password

### Password Expiry Warning
1. User logs in
2. System checks password age
3. If expiring soon: show warning banner
4. If expired: force password reset

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/password-policy` | GET | Get current policy settings |
| `/api/auth/password-policy` | PUT | Update policy (admin only) |
| `/api/auth/validate-password` | POST | Check password against policy |

## File Structure

### UI Components
| File | Purpose |
|------|---------|
| `pages/admin-password-policy/components/global/passwordPolicy/page.vue` | Policy configuration page |
| `pages/admin-password-policy/components/passwordPolicy/form.vue` | Policy rules form |

### Logic
Password validation integrated in:
- `packages/authApp/pages/resetPassword.vue`
- `packages/authApp/pages/initPassword.vue`

## UI Screenshots
> *To be added: Password policy admin page*
> *To be added: Password validation error example*

## Configuration Example

```json
{
  "minLength": 8,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumbers": true,
  "requireSpecialChars": true,
  "expiryDays": 90,
  "historyCount": 5,
  "lockoutAttempts": 5,
  "lockoutMinutes": 30
}
```

## Related Features
- [[AUTH-001 - Authentication]]
- [[AUTH-004 - Session Management]]

## Completion Checklist
- [x] Minimum length enforcement
- [x] Complexity requirements (upper, lower, number, special)
- [x] Password expiration
- [x] Password history check
- [x] Account lockout after failed attempts
- [x] Admin configuration UI
