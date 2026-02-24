---
type: feature
module: "[[CORE-002 - DMS]]"
feature-id: DMS-001
depends-on: []
status: stable
---

# DMS-001: Document Browse

## Overview
Core browsing functionality providing folder tree navigation, file listing with multiple view modes, and breadcrumb navigation for the document management system.

## User Flows

### Flow 1: Navigate Folder Structure
1. User views folder tree in left sidebar
2. Click on folder to expand/collapse children
3. Selected folder content displays in main area
4. Breadcrumb updates to show current path

### Flow 2: Switch View Modes
1. User clicks view mode toggle (list/grid/mini-table)
2. System re-renders file listing in selected mode
3. User preferences saved to local storage

### Flow 3: Multi-Select Files
1. User clicks individual files with Ctrl/Cmd key
2. Or uses drag-to-select box for range selection
3. Context menu appears for batch actions
4. Actions apply to all selected items

### Flow 4: Drag and Drop Navigation
1. User drags files from listing
2. Drops onto folder in tree or breadcrumb
3. System moves files to target location
4. UI updates with success/failure feedback

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/browse/{folderId}` | List folder contents |
| GET | `/api/v1/browse/tree` | Get folder tree structure |
| GET | `/api/v1/browse/breadcrumb/{folderId}` | Get breadcrumb path |
| POST | `/api/v1/browse/move` | Move files/folders |
| GET | `/api/v1/browse/recent` | Get recently accessed items |

## File Structure

```
packages/base/components/browse/
├── breadcrumb.vue           # Breadcrumb navigation component
├── miniTable.vue            # Compact file listing table view
├── table/
│   ├── table.vue           # Main file listing with sorting/filtering
│   ├── page.vue            # Table pagination layout
│   └── search.vue          # In-table search
├── ItemIcon.vue            # File/folder icon display
├── tree/
│   └── index.vue           # Folder tree navigation
├── treeTableForm/          # Combined tree and table layout
│   └── index.vue
├── contextmenu/            # Right-click context menu
│   ├── index.vue
│   ├── item.vue
│   └── list.vue
└── dragSelect/
    └── index.vue           # Drag-to-select functionality

pages/client-browse/components/global/browse/
├── page.vue                # Main browse page layout
└── detail.vue              # Browse detail panel

pages/client-browse/utils/
├── browseMenuHelper.ts     # Browse menu utilities
└── dropFileHelper.ts       # File drop handling

packages/base/composables/
├── useBrowse.ts            # Browse functionality composable
├── useBrowseDrop.ts        # Drag-drop browse operations
├── useBrowseDragMove.ts    # Drag-move between folders
├── useBrowseBreadcrumbDrop.ts  # Drop onto breadcrumbs
└── useDnD.ts               # General drag and drop utilities
```

## UI Screenshots

> [!ui] **Browse Page Layout**
> Placeholder: Main browse interface showing folder tree (left), file listing (center), and detail panel (right)

> [!ui] **Breadcrumb Navigation**
> Placeholder: Breadcrumb path showing Home > Department > Project > Documents with dropdown menus

> [!ui] **Folder Tree View**
> Placeholder: Expandable folder tree with icons, counts, and context menus

> [!ui] **Multi-Select Drag**
> Placeholder: User dragging multiple selected files onto a folder target

## Technical Notes

### Performance Considerations
- Virtual scrolling for large folder lists (1000+ items)
- Tree data lazy-loaded on expand
- Breadcrumb cached per session
- Debounced search input (300ms)

### State Management
- Current folder ID in URL query param
- View mode persisted to localStorage
- Selection state cleared on folder change
- Drag state tracked in composable

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Ctrl+A | Select all visible |
| Ctrl+Click | Toggle selection |
| Delete | Move to trash |
| F2 | Rename selected |
| Enter | Open folder/preview file |

### Related Features
- [[FEAT-002.2 - File Upload]] - Upload drops handled in browse
- [[FEAT-002.4 - Document Actions]] - Context menu actions
- [[FEAT-002.7 - Search]] - In-table search integration