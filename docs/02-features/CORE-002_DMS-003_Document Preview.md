---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-003
depends-on:
  - "[[CORE-002_DMS-001_Document Browse]]"
status: stable
---

# DMS-003: Document Preview

## Overview
Multi-format document preview capabilities supporting PDF, Office documents (Word, Excel, PowerPoint), images, text files, and video content with specialized viewers for each format.

## User Flows

### Flow 1: Quick Preview
1. User clicks on document in browse list
2. Preview panel slides in from right
3. Document renders in appropriate viewer
4. User can navigate pages/zoom

### Flow 2: Full-Screen Preview
1. User double-clicks document or clicks preview button
2. Modal/dialog opens with full viewer
3. Advanced controls available (rotate, download, print)
4. ESC or close button returns to browse

### Flow 3: PDF Navigation
1. PDF loads with thumbnail sidebar
2. User jumps to page via thumbnail or input
3. Search within PDF functionality
4. Text selection and copying enabled

### Flow 4: Office Document Preview
1. User selects Office document
2. System checks for Collabora/Google integration
3. Document renders in embedded viewer
4. User can view but not edit (unless permitted)

### Flow 5: Image Gallery
1. User clicks image file
2. Image viewer opens with zoom/pan
3. Navigate to next/prev images in folder
4. Slideshow mode available

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/preview/{documentId}` | Get preview metadata |
| GET | `/api/v1/preview/{documentId}/content` | Stream preview content |
| GET | `/api/v1/preview/{documentId}/thumbnail` | Get thumbnail image |
| GET | `/api/v1/preview/{documentId}/page/{pageNum}` | Get specific page |
| POST | `/api/v1/preview/convert` | Request format conversion |
| GET | `/api/v1/preview/collabora/url` | Get Collabora edit URL |

## File Structure

```
packages/base/components/browse/
├── preview.vue             # Main preview component
├── info/Preview.vue        # Info panel preview
└── Actions/popPreview.vue  # Popup preview dialog

packages/base/components/reader/
├── index.vue               # Document reader main component
├── pdf.vue                 # PDF document reader
├── docx.vue                # Word document reader
├── excel.vue               # Excel spreadsheet reader
├── ppt.vue                 # PowerPoint presentation reader
├── csv.vue                 # CSV file reader
├── text.vue                # Plain text reader
├── tiff.vue                # TIFF image reader
└── dialog.vue              # Reader dialog wrapper

packages/base/components/viewer/
├── pdf.vue                 # PDF viewer component
└── picture.vue             # Picture/image viewer

packages/base/components/global/
├── pdfViewer.vue           # Global PDF viewer
├── ImageViewer.vue         # Global image viewer
├── TiffViewer.vue          # Global TIFF viewer
├── VideoPlayer.vue         # Video player component
├── collaboraViewer.vue     # Collabora Office Online viewer
├── googleDrive.vue         # Google Drive preview
├── htmlViewer.vue          # HTML content viewer
├── otherPlayer.vue         # Other file type player
└── unSupport.vue           # Unsupported file type display

packages/base/components/
└── reader/imgMouse.vue     # Image mouse interaction

libraries/
├── pdf-js/                 # Complete PDF.js library
└── pdfSign/                # PDF signature functionality
```

## UI Screenshots

> [!ui] **PDF Viewer with Thumbnails**
> Placeholder: PDF preview showing document with thumbnail sidebar and toolbar controls

> [!ui] **Office Document Preview**
> Placeholder: Word document rendered in Collabora viewer with formatting preserved

> [!ui] **Image Gallery Viewer**
> Placeholder: Full-screen image viewer with zoom controls and navigation arrows

> [!ui] **Video Player**
> Placeholder: Embedded video player with controls and timeline

> [!ui] **Unsupported File Type**
> Placeholder: Message showing file type cannot be previewed with download option

## Technical Notes

### Viewer Selection Logic
```javascript
const getViewerComponent = (mimeType, extension) => {
  if (mimeType === 'application/pdf') return 'PdfViewer';
  if (['doc', 'docx'].includes(extension)) return 'DocxViewer';
  if (['xls', 'xlsx'].includes(extension)) return 'ExcelViewer';
  if (['ppt', 'pptx'].includes(extension)) return 'PptViewer';
  if (mimeType.startsWith('image/')) return 'ImageViewer';
  if (mimeType.startsWith('video/')) return 'VideoPlayer';
  if (['text/plain', 'text/csv'].includes(mimeType)) return 'TextViewer';
  return 'UnsupportedViewer';
};
```

### PDF Rendering
- Engine: PDF.js (Mozilla)
- Rendering: Canvas-based with text layer
- Features: Search, select text, zoom (25%-400%)
- Thumbnails: Generated server-side, cached
- Large PDFs: Virtual scrolling for pages > 50

### Office Document Handling
| Method | Pros | Cons |
|--------|------|------|
| Collabora Online | Full fidelity, editing | Requires server |
| Google Drive Viewer | No server needed | External dependency |
| PDF Conversion | Fast, reliable | Static only |
| Native Rendering | No conversion | Limited format support |

### Image Processing
- Thumbnails: 200x200px, WebP format
- Preview: Max 1920x1080
- Zoom: CSS transform scale
- Pan: Mouse drag when zoomed
- EXIF: Orientation auto-corrected

### Performance Optimizations
- Lazy load pages outside viewport
- Thumbnail grid for PDF navigation
- Progressive image loading
- Cached converted formats
- Cancel preview on navigation away

### Security
- Sandboxed iframe for external viewers
- Content Security Policy headers
- Sanitized HTML previews
- No execution of embedded scripts
- Watermark overlay for sensitive docs

### Related Features
- [[CORE-002_DMS-001_Document Browse]] - Preview triggered from browse
- [[CORE-002_DMS-008_Watermark Integration]] - Watermark overlays
- [[CORE-002_DMS-005_Version Control]] - Version comparison preview