---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-005
depends-on:
  - "[[FEAT-002.1 - Document Browse]]"
  - "[[FEAT-002.3 - Document Preview]]"
status: stable
---

# DMS-005: Version Control

## Overview
Document version management including automatic version history tracking, version comparison, restoration to previous versions, and version metadata.

## User Flows

### Flow 1: View Version History
1. User opens document info panel
2. Clicks "Versions" tab
3. List shows all versions chronologically
4. Each version shows creator, date, size, comment
5. User can expand for more details

### Flow 2: Compare Versions
1. User selects two versions from list
2. Clicks "Compare" button
3. Side-by-side comparison view opens
4. For PDFs: visual diff highlighting
5. For Office: metadata and binary comparison

### Flow 3: Restore Previous Version
1. User identifies version to restore
2. Clicks restore option on version row
3. Confirmation dialog warns of overwrite
4. Current version archived, selected becomes active
5. Activity logged with user comment

### Flow 4: Download Old Version
1. User finds historical version needed
2. Clicks download on specific version
3. Version downloaded without affecting current
4. Useful for audit and compliance

### Flow 5: Version Commenting
1. During checkin/replace, user adds comment
2. Comment describes changes made
3. Comments visible in version history
4. Searchable for finding specific changes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documents/{id}/versions` | List all versions |
| GET | `/api/v1/documents/{id}/versions/{versionNum}` | Get specific version |
| POST | `/api/v1/documents/{id}/versions/restore` | Restore to version |
| GET | `/api/v1/documents/{id}/versions/compare` | Compare two versions |
| GET | `/api/v1/documents/{id}/versions/{versionNum}/download` | Download version |
| DELETE | `/api/v1/documents/{id}/versions/{versionNum}` | Delete version (admin) |
| GET | `/api/v1/documents/{id}/versions/latest` | Get latest version info |

## File Structure

```
packages/base/components/browse/info/
└── VersionPopover.vue      # Version history popover in info panel

pages/client-browse/components/global/browse/
└── versionComparison.vue   # Version comparison view

pages/client-browse/components/version/
└── header.vue              # Version view header
```

## UI Screenshots

> [!ui] **Version History Panel**
> Placeholder: Info panel showing version list with version numbers, dates, authors, and action buttons

> [!ui] **Version Comparison View**
> Placeholder: Side-by-side document comparison highlighting differences

> [!ui] **Restore Confirmation**
> Placeholder: Dialog confirming version restore with warning about current version

## Technical Notes

### Version Numbering
```
Major.Minor.Revision
1.0.0 → Initial upload
1.1.0 → Minor edit
2.0.0 → Major revision
```

### Storage Strategy
| Approach | Storage | Retrieval |
|----------|---------|-----------|
| Full Copy | High | Fast |
| Differential | Low | Slower |
| Snapshot | Medium | Medium |

Current implementation: Full copy for simplicity, with compression

### Auto-Versioning Rules
- New upload: Creates v1.0
- Replace file: Increments minor (v1.1)
- Major revision flag: Increments major (v2.0)
- Checkout/Checkin: Always new version
- Edit metadata: Optional versioning

### Version Metadata
```json
{
  "versionNumber": "2.3.1",
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "user@example.com",
  "size": 1543200,
  "comment": "Updated executive summary",
  "changeType": "minor",
  "checksum": "sha256:abc123..."
}
```

### Retention Policies
- Default: Keep all versions indefinitely
- Optional: Auto-delete versions > X years
- Major versions: Always retained
- Compliance mode: WORM (Write Once Read Many)

### Comparison Capabilities
| Format | Visual Diff | Text Diff | Binary Diff |
|--------|-------------|-----------|-------------|
| PDF | ✓ | ✓ | ✓ |
| Word | Limited | ✓ | ✓ |
| Excel | ✗ | Limited | ✓ |
| Images | ✓ (side-by-side) | ✗ | ✓ |
| Text | ✓ | ✓ | ✓ |

### Related Features
- [[FEAT-002.2 - File Upload]] - Replace creates new version
- [[FEAT-002.4 - Document Actions]] - Checkout/checkin versioning
- [[FEAT-002.3 - Document Preview]] - Preview any version