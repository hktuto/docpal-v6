---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-004
depends-on:
  - "[[CORE-002_DMS-001_Document Browse]]"
  - "[[CORE-002_DMS-003_Document Preview]]"
status: stable
---

# DMS-004: Document Actions

## Overview
Comprehensive document manipulation actions including sharing, deletion, renaming, moving, copying, downloading, checkout/hold, and collection management.

## User Flows

### Flow 1: Share Document (Internal)
1. User selects document and clicks Share
2. Share dialog opens with user search
3. User selects recipients and permissions
4. Optional expiry date and message
5. Recipients receive notification

### Flow 2: Create Public Share Link
1. User selects "Create Public Link"
2. Configures access (view/download)
3. Sets password and expiry (optional)
4. Link generated and copied to clipboard
5. QR code also available for mobile

### Flow 3: Bulk Delete
1. User multi-selects files via checkboxes
2. Clicks Delete or presses Delete key
3. Confirmation dialog shows item count
4. Items moved to trash (soft delete)
5. Undo option available for 30 seconds

### Flow 4: Rename Document
1. User selects file and presses F2
2. Inline edit mode activates
3. User types new name
4. System validates name uniqueness
5. Rename applied on Enter/Blur

### Flow 5: Move/Copy Between Folders
1. User selects files and clicks Move
2. Folder picker dialog opens
3. User navigates to target folder
4. System checks permissions
5. Files moved with progress indicator

### Flow 6: Download with Conversion
1. User clicks Download arrow (split button)
2. Options: Original, PDF, or other formats
3. If conversion needed, queued and processed
4. Download starts when ready

### Flow 7: Document Checkout/Hold
1. User clicks "Checkout" to lock document
2. Other users see locked status
3. User downloads and edits locally
4. Checks in with new version
5. Or cancels checkout to release lock

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/documents/{id}/share` | Create internal share |
| POST | `/api/v1/documents/{id}/share/public` | Create public share |
| DELETE | `/api/v1/documents/{id}/share/{shareId}` | Revoke share |
| DELETE | `/api/v1/documents/bulk` | Bulk delete documents |
| PUT | `/api/v1/documents/{id}/rename` | Rename document |
| POST | `/api/v1/documents/move` | Move documents |
| POST | `/api/v1/documents/copy` | Copy documents |
| GET | `/api/v1/documents/{id}/download` | Download original |
| GET | `/api/v1/documents/{id}/download/{format}` | Download converted |
| POST | `/api/v1/documents/{id}/checkout` | Checkout document |
| POST | `/api/v1/documents/{id}/checkin` | Checkin document |
| POST | `/api/v1/collections/{id}/add` | Add to collection |

## File Structure

```
packages/base/components/browse/Actions/
├── share.vue               # Share action component
├── delete.vue              # Delete action
├── deleteSelected.vue      # Bulk delete
├── EmptyDelete.vue         # Empty trash/folder delete
├── rename.vue              # Rename action
├── edit.vue                # Edit action
├── editName.vue            # Edit name component
├── collection.vue          # Add to collection
├── copyPath.vue            # Copy file path
├── paste.vue               # Paste action
├── new.vue                 # New document/folder
├── newFolder.vue           # New folder creation
├── download.vue            # Download action
├── downloadConversion.vue  # Download with conversion
├── office.vue              # Office document actions
├── hold.vue                # Document hold/checkout
├── hold/addDialog.vue      # Hold add dialog
├── subscribe.vue           # Subscribe to document
├── changeDocType/          # Change document type
│   ├── index.vue
│   └── dialog.vue
├── info.vue                # Document info action
├── button.vue              # Generic action button
├── WatermarkBtn.vue        # Watermark action button
└── replace/                # File replacement
    ├── index.vue
    ├── upload.vue
    └── dialog.vue

packages/base/components/browse/share/
├── publicButton.vue        # Public share button
└── tableSet.vue            # Share table settings

packages/base/components/tab/
└── pastePathDialog.vue     # Paste path selection dialog

pages/client-browse/components/global/browse/
└── share.vue               # Browse share dialog

pages/client-share/components/
├── global/share/page.vue   # Share management page
├── share/dialog.vue        # Share creation dialog
└── global/internalShare/
    ├── mePage.vue          # My shares page
    └── otherPage.vue       # Shares from others

pages/public-share/pages/public/
└── share.vue               # Public share access page

packages/base/composables/
└── useShare.ts             # Share functionality composable
```

## UI Screenshots

> [!ui] **Share Dialog**
> Placeholder: Share dialog showing user search, permission dropdowns, and expiry settings

> [!ui] **Public Share Link**
> Placeholder: Generated share link with copy button, QR code, and access controls

> [!ui] **Context Menu Actions**
> Placeholder: Right-click context menu showing available actions for selected file

> [!ui] **Move/Copy Dialog**
> Placeholder: Folder picker tree dialog for selecting destination

> [!ui] **Download Options**
> Placeholder: Split button showing format options (Original, PDF, DOCX)

> [!ui] **Checkout Status**
> Placeholder: Document showing locked icon with checkout user info

## Technical Notes

### Permission Matrix
| Action | Owner | Editor | Viewer | Guest |
|--------|-------|--------|--------|-------|
| View | ✓ | ✓ | ✓ | ✓ |
| Download | ✓ | ✓ | ✓ | ✗ |
| Share | ✓ | ✓ | ✗ | ✗ |
| Rename | ✓ | ✓ | ✗ | ✗ |
| Move | ✓ | ✓ | ✗ | ✗ |
| Delete | ✓ | ✗ | ✗ | ✗ |
| Checkout | ✓ | ✓ | ✗ | ✗ |

### Share Link Security
- Tokens: Cryptographically random, 32 chars
- Expiry: Optional, default 30 days
- Password: PBKDF2 hashed, optional
- Access log: IP, timestamp, user agent
- Rate limit: 100 accesses/hour per link

### Soft Delete Strategy
- Deleted items moved to "Trash" folder
- Retention: 30 days before permanent deletion
- Restore available during retention period
- Storage quota still counts deleted items
- Audit log preserves delete history

### Checkout Mechanism
```
CHECKOUT AVAILABLE → LOCKED (by user) → EDITED LOCALLY
       ↑                                      ↓
   CANCELLED ←──────────── CHECKIN (new version)
```

### Batch Operations
- Max 100 items per batch
- Progress tracking via WebSocket
- Partial success handling
- Rollback on critical errors
- Notification on completion

### Related Features
- [[CORE-002_DMS-001_Document Browse]] - Actions triggered from browse
- [[CORE-002_DMS-005_Version Control]] - Checkin creates version
- [[CORE-002_DMS-008_Watermark Integration]] - Download applies watermark