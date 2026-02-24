---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-002
depends-on:
  - "[[CORE-002_DMS-001_Document Browse]]"
status: stable
---

# DMS-002: File Upload

## Overview
Comprehensive file upload functionality including drag-drop, bulk uploads, upload progress tracking, folder structure preservation, and metadata collection during upload.

## User Flows

### Flow 1: Drag and Drop Upload
1. User drags files from desktop to browse area
2. Drop zone highlights with visual feedback
3. Files queued for upload with progress indicators
4. Metadata form appears for document type selection
5. Upload completes with success notification

### Flow 2: Bulk Upload with Structure
1. User selects "Upload Folder" option
2. File picker opens with folder selection
3. System preserves folder hierarchy
4. Each folder level prompts for metadata
5. Progress shows per-file and overall status

### Flow 3: AI-Assisted Upload
1. User navigates to AI Upload page
2. Drops documents for automatic classification
3. AI suggests document types and metadata
4. User reviews and confirms suggestions
5. Documents uploaded with extracted metadata

### Flow 4: Public Upload (External)
1. External user receives upload link
2. Opens public upload page (no login required)
3. Fills required metadata fields
4. Uploads files with validation
5. Receives confirmation email

### Flow 5: Replace Existing File
1. User selects file and chooses "Replace"
2. New file selected via dialog
3. System validates file type compatibility
4. Previous version archived automatically
5. New version becomes active

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Single file upload |
| POST | `/api/v1/upload/bulk` | Bulk file upload |
| POST | `/api/v1/upload/chunk` | Chunked upload (large files) |
| GET | `/api/v1/upload/status/{uploadId}` | Check upload progress |
| POST | `/api/v1/upload/ai-classify` | AI classification request |
| PUT | `/api/v1/documents/{id}/replace` | Replace existing document |
| POST | `/api/v1/upload/public/{token}` | Public upload endpoint |

## File Structure

```
packages/base/components/browse/Actions/
├── upload.vue              # Main upload action with drag-drop
├── uploadDoc.vue           # Document upload handling
├── uploadRequest.vue       # Upload request management
└── replace/
    ├── upload.vue          # File replacement upload
    ├── index.vue           # Replace action entry
    └── dialog.vue          # Replace confirmation

packages/base/components/uploadStructure/
├── index.vue               # Upload structure/folder upload
├── button.vue              # Upload button component
├── metaForm.vue            # Metadata form during upload
└── preview.vue             # Upload preview component

packages/base/components/form/
└── upload.vue              # Form-integrated upload

pages/client-browse/components/global/uploadRequest/
├── page.vue                # Upload request page
└── detail.vue              # Upload request detail

pages/client-ai-upload/components/global/AiUpload/
├── index.vue               # AI-assisted upload page
└── detail.vue              # AI upload detail view

pages/client-ai-upload/components/
├── aiPreview.vue           # AI upload preview
└── aiUploadPreviewDialog.vue   # AI upload preview dialog

pages/public-upload/
├── pages/public/upload.vue # Public upload page
└── components/
    ├── uploadForm.vue      # Public upload form
    └── fileInputBlob.vue   # File input handling

pages/client-folder-cabinet/components/folderCabinet/create/
├── uploadFileDialog.vue    # Folder cabinet upload dialog
├── uploadStatusDialog.vue  # Upload status display
└── uploadTree.vue          # Upload folder tree

packages/base/composables/
└── uploadAI.ts             # AI upload composable
```

## UI Screenshots

> [!ui] **Drag and Drop Zone**
> Placeholder: Browse area showing highlighted drop zone with "Drop files here" overlay

> [!ui] **Upload Progress Panel**
> Placeholder: Side panel showing multiple files uploading with progress bars

> [!ui] **Metadata Form During Upload**
> Placeholder: Modal showing document type selector and metadata fields

> [!ui] **AI Upload Preview**
> Placeholder: AI classification results showing suggested document types per file

> [!ui] **Folder Upload Structure**
> Placeholder: Tree view of folder structure being preserved during upload

## Technical Notes

### Chunked Upload Strategy
- Files > 10MB automatically chunked
- Chunk size: 5MB per piece
- Parallel uploads: 3 chunks concurrent
- Resume support for interrupted uploads
- Checksum validation per chunk

### Supported File Types
| Category | Extensions | Max Size |
|----------|------------|----------|
| Documents | pdf, doc, docx, xls, xlsx, ppt, pptx | 100MB |
| Images | jpg, jpeg, png, gif, tiff, bmp | 50MB |
| Archives | zip, rar, 7z | 500MB |
| Media | mp4, avi, mov, mp3 | 1GB |
| Text | txt, csv, xml, json, html | 10MB |

### Upload States
```
QUEUED → UPLOADING → PROCESSING → COMPLETED
    ↓         ↓            ↓            ↓
PAUSED   FAILED (retry)   EXTRACTING   ARCHIVED
```

### Metadata Extraction
- EXIF data from images
- PDF properties extraction
- Office document properties
- Custom mapping to document types

### Security Considerations
- Virus scanning on server side
- File type validation (magic numbers)
- Size limits enforced server-side
- Public uploads require valid tokens
- Rate limiting: 100 uploads/hour per user

### Related Features
- [[CORE-002_DMS-001_Document Browse]] - Upload target folders
- [[CORE-002_DMS-006_Metadata Properties]] - Metadata forms
- [[CORE-002_DMS-005_Version Control]] - Replace creates versions