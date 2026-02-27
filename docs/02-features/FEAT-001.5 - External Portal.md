---
type: feature
module: "[[CORE-001 - Auth]]"
status: stable
feature-id: AUTH-005
depends-on:
  - "[[FEAT-001.1 - Authentication]]"
  - "[[CORE-002 - DMS]]"
---

# FEAT-001.5: External Portal (Guest Access)

## Overview
Guest access portal allowing external users (clients, vendors) to view shared documents and submit forms without full system accounts.

## User Flows

### Guest Share Flow
1. Internal user shares document → generates public link
2. Link sent to external guest (email/IM)
3. Guest clicks link → public share page
4. Guest enters access code (if required)
5. Guest views/downloads shared documents
6. No login required for read-only access

### Guest Upload Flow
1. Internal user creates upload request → public upload link
2. Link sent to external party
3. External party opens public upload page
4. Drag-drop files or browse to select
5. Files uploaded to designated folder
6. Internal user notified of upload

### Guest Form Flow
1. Internal user creates public form (via easy-form)
2. Form published with public URL
3. External users fill and submit form
4. Data captured in workflow/Dynamic DB
5. Notifications sent to internal team

## Access Types

| Type | Authentication | Capabilities |
|------|----------------|--------------|
| Public Share | Access code (optional) | View/download only |
| Public Upload | Access code (optional) | Upload files only |
| Public Form | None or access code | Fill form, submit data |
| Guest Account | Password | Limited view based on assignment |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/public-api/share/{token}` | GET | Get shared document info |
| `/public-api/share/{token}/download` | GET | Download shared file |
| `/public-api/upload/{token}` | POST | Upload file to folder |
| `/public-api/form/{id}` | GET | Get public form schema |
| `/public-api/form/{id}/submit` | POST | Submit form data |

## File Structure

### Pages
| File | Purpose |
|------|---------|
| `pages/public-share/components/global/publicShare/page.vue` | Public share viewer |
| `pages/public-share/components/global/publicShare/detail.vue` | Document detail view |
| `pages/public-upload/components/global/publicUpload/page.vue` | Public upload page |
| `pages/public-upload/components/upload/dropZone.vue` | Drag-drop upload zone |
| `pages/public-easy-form/components/global/easyForm/page.vue` | Public form renderer |

### Packages
| File | Purpose |
|------|---------|
| `packages/dp-dashboard/components/global/personal/publicUpload/index.vue` | Dashboard upload widget |
| `packages/dp-contact/` | Contact/guest management |

## UI Screenshots
> *To be added: Public share page*
> *To be added: Public upload interface*
> *To be added: Public form example*

## Security Considerations

### Access Control
- Links expire after configured time (default: 30 days)
- Optional access code for additional security
- IP logging for audit trail
- Rate limiting on download/upload

### Data Isolation
- Guests can only see explicitly shared content
- No access to system internals
- Uploaded files scanned (if AV integration enabled)
- Form submissions validated server-side

## Configuration

### Link Settings
```typescript
{
  defaultExpiry: 30,        // days
  allowCustomExpiry: true,
  maxExpiry: 365,           // days
  requireAccessCode: false, // default
  allowUpload: true,
  allowDownload: true
}
```

## Related Features
- [[FEAT-001.1 - Authentication]]
- [[FEAT-002.3 - Document Preview]] (share preview)
- [[FEAT-003.4 - Form Renderer]] (public forms)

## Completion Checklist
- [x] Public share page
- [x] Access code protection
- [x] Public upload with drag-drop
- [x] Public form rendering
- [x] Link expiration
- [x] Download/upload tracking
