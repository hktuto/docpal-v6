---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-008
depends-on:
  - "[[FEAT-002.3 - Document Preview]]"
  - "[[FEAT-002.4 - Document Actions]]"
status: stable
---

# DMS-008: Watermark Integration

## Overview
Document watermarking system for security and branding, supporting both text and image watermarks with configurable positioning, opacity, and conditional application.

## User Flows

### Flow 1: Apply Watermark to Document
1. User selects document(s)
2. Clicks "Watermark" action
3. Selects from preset watermarks
4. Preview shows applied watermark
5. Apply creates watermarked copy or overlays

### Flow 2: Create Custom Watermark
1. Admin navigates to Watermark Management
2. Clicks "Create Watermark"
3. Chooses text or image type
4. Configures:
   - Content (text or image upload)
   - Position (corners, center, tiled)
   - Opacity (0-100%)
   - Size and rotation
5. Saves as preset

### Flow 3: Auto-Watermark on Download
1. User downloads confidential document
2. System checks document classification
3. Applies configured watermark automatically
4. Downloaded file contains watermark
5. Activity logged with watermark ID

### Flow 4: Preview Watermark Effect
1. User configures watermark settings
2. Live preview updates in real-time
3. Test document shows final appearance
4. User adjusts until satisfied
5. Settings saved for application

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/watermarks` | List watermark presets |
| POST | `/api/v1/watermarks` | Create watermark preset |
| GET | `/api/v1/watermarks/{id}` | Get watermark details |
| PUT | `/api/v1/watermarks/{id}` | Update watermark |
| DELETE | `/api/v1/watermarks/{id}` | Delete watermark |
| POST | `/api/v1/documents/{id}/watermark` | Apply watermark to document |
| POST | `/api/v1/documents/{id}/watermark/preview` | Preview watermark effect |
| GET | `/api/v1/watermarks/{id}/preview` | Get watermark preview image |

## File Structure

```
packages/base/components/browse/Actions/
├── watermark.vue           # Watermark action
└── WatermarkBtn.vue        # Watermark button

pages/client-browse/components/global/browse/
└── watermark.vue           # Browse watermark dialog

packages/dp-watermark/components/Watermark/
├── Edit.vue                # Watermark editor
├── detail.vue              # Watermark detail view
├── list.vue                # Watermark list
├── create.vue              # Create watermark
├── editImage.vue           # Image watermark editor
├── editText.vue            # Text watermark editor
├── empty.vue               # Empty watermark state
├── anchor.vue              # Watermark anchor/position
└── preset/
    └── index.vue           # Preset watermarks

packages/dp-watermark/components/Watermark/ui/
└── properties.vue          # Watermark properties UI

packages/dp-watermark/composables/
└── Watermark.ts            # Watermark composable
```

## UI Screenshots

> [!ui] **Watermark Selection Dialog**
> Placeholder: Dialog showing available watermark presets with preview thumbnails

> [!ui] **Watermark Editor**
> Placeholder: Editor interface with text input, position grid, opacity slider, and live preview

> [!ui] **Image Watermark Configuration**
> Placeholder: Interface for uploading and positioning image watermarks

> [!ui] **Document with Watermark Preview**
> Placeholder: PDF preview showing diagonal "CONFIDENTIAL" watermark overlay

## Technical Notes

### Watermark Types
| Type | Use Case | Supported Formats |
|------|----------|-------------------|
| Text | Username, classification | PDF, Images |
| Image | Logo, stamp | PDF, Images |
| Dynamic | Timestamp, user info | PDF only |
| Tiled | Draft indicators | PDF only |

### Positioning Options
```javascript
const positions = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
  'tiled'  // Repeating pattern
];
```

### PDF Watermark Implementation
- Library: pdf-lib (client) / iText (server)
- Method: Overlay on existing PDF
- Text: Embedded with font subset
- Images: Embedded as XObject
- Vector: Preserves quality at all zoom

### Image Watermark Implementation
- Library: Sharp (server) / Canvas (client)
- Method: Alpha composite overlay
- Preservation: Original kept separately
- Output: New watermarked file

### Watermark Configuration Schema
```json
{
  "id": "confidential-wm",
  "name": "Confidential",
  "type": "text",
  "text": "CONFIDENTIAL - {{username}} - {{date}}",
  "position": "center",
  "opacity": 0.3,
  "rotation": 45,
  "fontSize": 72,
  "color": "#FF0000",
  "fontFamily": "Arial",
  "tiled": false
}
```

### Dynamic Variables
| Variable | Description |
|----------|-------------|
| {{username}} | Current user name |
| {{email}} | User email |
| {{date}} | Current date |
| {{datetime}} | Current date and time |
| {{documentId}} | Document ID |
| {{filename}} | Original filename |

### Security Levels
| Level | Watermark | Auto-Apply |
|-------|-----------|------------|
| Public | None | No |
| Internal | Light logo | On external share |
| Confidential | User+date | On all download |
| Restricted | Full page | On view & download |

### Conditional Application
```javascript
const shouldApplyWatermark = (doc, action, user) => {
  if (doc.classification === 'public') return false;
  if (action === 'view' && doc.classification !== 'restricted') return false;
  if (user.hasPermission('bypass-watermark')) return false;
  return true;
};
```

### Performance Considerations
- Watermarking large PDFs: Async processing
- Preview: Client-side canvas for speed
- Batch: Queue for background processing
- Caching: Watermarked versions cached briefly

### Related Features
- [[FEAT-002.4 - Document Actions]] - Watermark action in downloads
- [[FEAT-002.3 - Document Preview]] - Watermark in preview mode
- [[FEAT-002.6 - Metadata Properties]] - Classification drives watermark rules