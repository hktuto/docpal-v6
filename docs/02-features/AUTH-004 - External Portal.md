---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-004
depends-on:
  - "[[AUTH-001 - Authentication]]"
---

# AUTH-004: External Portal / Guest Access

## Overview
Guest access portal allowing external users (clients, vendors) to access shared documents without full system accounts. Integrated with dashboard and auth systems.

## Concepts

### Guest User
- Limited account for external access
- Can only access explicitly shared documents
- No access to internal features

### Public Pages
- `/public-share` - View shared documents
- `/public-upload` - Upload files to specific folder
- `/public-easy-form` - Fill public forms

### Document Visibility
- Documents can be shared with "Public" permission
- Optional password protection
- Optional expiration date

## User Flows

### Share Document Publicly
1. User selects document in DMS
2. Clicks "Share" → "Public Link"
3. Configures options (password, expiry)
4. System generates public URL
5. URL sent to external party

### Guest Accesses Shared Document
1. Guest receives public URL
2. Opens URL (no login required)
3. Views document in limited viewer
4. Can download (if permitted)

### Guest Upload
1. Admin creates upload request with public URL
2. Guest opens `/public-upload/{token}`
3. Uploads files directly to specified folder
4. Files appear in DMS for internal users

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/share/{token}` | GET | Get shared document info |
| `/api/public/share/{token}/download` | GET | Download shared document |
| `/api/public/upload/{token}` | POST | Upload via public token |
| `/api/public/verify` | POST | Verify public access token |

## File Structure

### UI Components
| File | Purpose |
|------|---------|
| `pages/public-share/components/global/publicShare/page.vue` | Public share viewer |
| `pages/public-share/components/publicShare/detail.vue` | Document detail for public |
| `pages/public-upload/components/global/publicUpload/page.vue` | Public upload page |
| `pages/public-upload/components/publicUpload/form.vue` | Upload form |
| `pages/public-easy-form/components/global/easyForm/page.vue` | Public form page |
| `packages/dp-dashboard/components/global/personal/dashboard/index.vue` | Guest portal dashboard |

### Integration Points
- `packages/dp-share/` - Share management (creates public links)
- `packages/authApp/` - Guest auth validation

## UI Screenshots
> *To be added: Public share page*
> *To be added: Public upload page*
> *To be added: Share configuration dialog*

## Security Considerations
- Public links are unguessable tokens
- Optional password adds layer of security
- Automatic expiry prevents stale links
- Upload restricted to specific folders only
- No access to internal DMS features

## Related Features
- [[AUTH-001 - Authentication]]
- [[CORE-002 - DMS]] (Share functionality)
- [[ADD-004 - External Portal]]

## Completion Checklist
- [x] Public share page
- [x] Public upload page
- [x] Public form page
- [x] Share token generation
- [x] Password protection option
- [x] Expiration date option
- [x] Guest dashboard integration
