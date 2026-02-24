---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-003
depends-on:
  - "[[CORE-001_AUTH-001_Authentication]]"
---

# CORE-001_AUTH-003: Password Policy

## Overview
Configurable password policy enforcement with rules for length, complexity, expiration, and history.

## Policy Rules

### Default Rules
| Rule | Default | Description |
|------|---------|-------------|
| Min Length | 8 chars | Minimum password length |
| Max Length | 128 chars | Maximum password length |
| Require Uppercase | Yes | At least one A-Z |
| Require Lowercase | Yes | At least one a-z |
| Require Numbers | Yes | At least one 0-9 |
| Require Special | Yes | At least one !@#$%^&* |
| Expiration | 90 days | Force password change |
| History | 5 passwords | Cannot reuse last N |
| Lockout | 5 attempts | Lock account after failures |
| Lockout Duration | 30 min | Auto-unlock after |

## User Flows

### Password Change Flow
1. User enters current password
2. Enters new password
3. System validates against policy
4. Checks password history
5. Updates password, clears history older than N

### Admin Policy Configuration
1. Admin navigates to Password Policy page
2. Adjusts policy sliders/inputs
3. Saves configuration
4. Policy applied to all password changes

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/password-policy` | GET | Get current policy |
| `/api/auth/password-policy` | PUT | Update policy (admin) |
| `/api/auth/password/validate` | POST | Check if password meets policy |
| `/api/auth/password/history` | GET | Get user's password history |

## File Structure

### Admin UI
| File | Purpose |
|------|---------|
| `pages/admin-password-policy/components/policyForm.vue` | Policy configuration form |
| `pages/admin-password-policy/components/passwordRules.vue` | Rules display component |
| `pages/admin-password-policy/composables/usePasswordPolicy.ts` | Policy CRUD composable |
| `pages/admin-password-policy/utils/policyValidator.ts` | Client-side validation |

### User UI
| File | Purpose |
|------|---------|
| `packages/authApp/pages/resetPassword.vue` | Enforces policy on reset |
| `packages/authApp/pages/initPassword.vue` | Enforces policy on init |

### Validation
| File | Purpose |
|------|---------|
| `pages/admin-password-policy/__test__/policy.test.ts` | Policy validation tests |

## UI Screenshots
> *To be added: Policy configuration page*
> *To be added: Password strength indicator*

## Technical Notes

### Policy Enforcement
- Client-side: Real-time validation as user types
- Server-side: Final validation before save
- Both must pass for password change to succeed

### Password History
- Hashed passwords stored (not plaintext)
- Only last N passwords kept (configurable)
- Bcrypt with salt for hashing

### Lockout Logic
- Failed attempts tracked per username
- Counter resets on successful login
- Admin can manually unlock accounts

## Related Features
- [[CORE-001_AUTH-001_Authentication]]

## Completion Checklist
- [x] Policy configuration UI
- [x] Real-time password strength meter
- [x] Password history enforcement
- [x] Account lockout after failed attempts
- [x] Admin unlock capability
- [x] Policy validation tests
