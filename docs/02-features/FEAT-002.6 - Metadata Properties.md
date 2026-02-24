---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-006
depends-on:
  - "[[FEAT-002.1 - Document Browse]]"
  - "[[FEAT-002.2 - File Upload]]"
status: stable
---

# DMS-006: Metadata Properties

## Overview
Comprehensive document metadata management including custom fields, document types, properties editing, automatic extraction, and metadata-driven workflows.

## User Flows

### Flow 1: View Document Metadata
1. User selects document in browse
2. Info panel opens on right side
3. Metadata tab shows all properties
4. Grouped by category (System, Custom, Extracted)
5. Read-only fields grayed out

### Flow 2: Edit Metadata
1. User clicks "Edit" in metadata section
2. Form fields become editable
3. User modifies values
4. Validation runs on each field
5. Save applies changes, Cancel discards

### Flow 3: Change Document Type
1. User clicks document type dropdown
2. List shows available types
3. Selection triggers metadata schema change
4. New fields appear based on type
5. Existing metadata preserved where applicable

### Flow 4: Bulk Metadata Edit
1. User multi-selects documents
2. Opens bulk metadata dialog
3. Shows only common fields across selection
4. Changes apply to all selected
5. Progress shown for large batches

### Flow 5: Metadata During Upload
1. User uploads files
2. System extracts basic metadata
3. User prompted for document type
4. Type-specific fields presented
5. Required fields must be filled

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documents/{id}/metadata` | Get all metadata |
| PUT | `/api/v1/documents/{id}/metadata` | Update metadata |
| GET | `/api/v1/document-types` | List document types |
| GET | `/api/v1/document-types/{id}/schema` | Get type schema |
| PUT | `/api/v1/documents/{id}/type` | Change document type |
| POST | `/api/v1/documents/bulk/metadata` | Bulk metadata update |
| GET | `/api/v1/metadata/extract/{id}` | Extract metadata from file |

## File Structure

```
packages/base/components/browse/info/
├── index.vue               # Document info panel main
├── DocInfo.vue             # Document information display
├── Meta/
│   ├── index.vue           # Metadata display/edit
│   ├── editField.vue       # Metadata field editor
│   └── documentType.vue    # Document type selector
└── picture.vue             # Picture metadata

packages/base/components/meta/
├── metadata.ts             # Metadata utilities
├── pathForm.vue            # Path-based metadata form
├── renderForm.vue          # Metadata form renderer
└── renderForm2.vue         # Alternative metadata form renderer

packages/base/composables/
└── metaFormHelper.ts       # Metadata form helper utilities

pages/admin-document-type/  # Document type administration (complete module)
└── composables/
    └── useDocumentTypeOptioins.ts  # Document type options
```

## UI Screenshots

> [!ui] **Metadata Panel**
> Placeholder: Info panel showing metadata fields organized by category with edit/save controls

> [!ui] **Document Type Selector**
> Placeholder: Dropdown showing document types with icons and descriptions

> [!ui] **Metadata Form Editor**
> Placeholder: Form with various field types (text, date, dropdown, multi-select)

> [!ui] **Bulk Metadata Dialog**
> Placeholder: Dialog showing common fields for multiple selected documents

## Technical Notes

### Field Types Supported
| Type | UI Component | Validation |
|------|--------------|------------|
| text | Input | Required, min/max length |
| number | Number input | Min/max values |
| date | Date picker | Date range |
| datetime | DateTime picker | Future/past restriction |
| boolean | Toggle/Switch | - |
| select | Dropdown | Single selection |
| multiselect | Multi-dropdown | Max selections |
| user | User search | Exists in directory |
| folder | Folder picker | Valid path |
| tags | Tag input | Max tags |

### Document Type Schema
```json
{
  "id": "contract",
  "name": "Contract",
  "icon": "file-contract",
  "fields": [
    {
      "key": "contractNumber",
      "type": "text",
      "required": true,
      "label": "Contract Number"
    },
    {
      "key": "expiryDate",
      "type": "date",
      "required": false,
      "validation": "future"
    }
  ]
}
```

### Auto-Extraction Sources
| Source | File Types | Extracted Fields |
|--------|------------|------------------|
| EXIF | Images | Camera, date, GPS |
| PDF Properties | PDF | Author, title, subject |
| Office Props | DOCX, XLSX | Creator, company, keywords |
| Filename | All | Pattern matching |
| OCR | Images, PDF | Text content analysis |

### Metadata Inheritance
- Folder-level default metadata
- Inherits on document creation
- User can override inherited values
- Lock option prevents override

### Search Indexing
- All metadata indexed for search
- Faceted search on select fields
- Full-text on text fields
- Date range queries supported

### Validation Rules
- Required fields enforced on save
- Regex patterns for format validation
- Cross-field dependencies
- Custom validators via plugin

### Related Features
- [[FEAT-002.2 - File Upload]] - Metadata during upload
- [[FEAT-002.7 - Search]] - Metadata indexed for search
- [[FEAT-002.1 - Document Browse]] - Metadata shown in info panel