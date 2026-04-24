# Custom Navigation Menu

## Overview

This feature replaces the flat sidebar navigation (Tables / Dashboard / My Views) with a customizable, hierarchical folder-based navigation structure for the Case Management system.

## Goals

- Allow admins to organize tables, views, and dashboards into logical folders
- Provide a shared navigation structure visible to all users
- Improve discoverability and organization of case management components

## User Stories

1. **As an admin**, I want to organize navigation items into folders so users can easily find related components.
2. **As a user**, I want to expand/collapse folders to focus on relevant sections.
3. **As a user**, I want to quickly navigate between tables, views, and dashboards.

---

## Data Model

### NavItem Interface

```typescript
interface NavItem {
  id: string                       // Unique identifier
  type: 'folder' | 'table' | 'view' | 'dashboard'
  label: string                    // Display name in navigation
  icon?: string                    // Optional custom icon (icon name)
  description?: string             // NEW: Rich text description (especially for folders)
  targetId?: string                // For non-folder items: ID of the table/view/dashboard
  targetTableId?: string           // For views: the table the view belongs to
  children?: NavItem[]             // For folders: nested items
  isExpanded?: boolean             // For folders: expand/collapse state (default: false)
}
```

### Database Extension

```typescript
interface Database {
  id: string
  name: string
  description?: string
  icon?: string
  tables: Table[]
  dashboards?: Dashboard[]
  navigation?: NavItem[]           // NEW: Custom navigation structure
}
```

---

## Navigation Structure Example

```
CRM Database
├── 📁 Company Management
│   ├── 📊 Company Dashboard
│   └── 📋 Companies (table)
├── 📁 Quotations Management
│   ├── 👁 Large Scale Deals (view)
│   ├── 📋 Quotations (table)
│   └── 📋 Quotation Lines (table)
└── 📁 Contracts
    ├── 👁 Active Contracts (view)
    ├── 📋 Contracts (table)
    └── 📋 Contract Lines (table)
```

### JSON Example

```json
{
  "id": "db-crm",
  "name": "CRM Database",
  "navigation": [
    {
      "id": "nav-company-mgmt",
      "type": "folder",
      "label": "Company Management",
      "description": "Manage all your companies and contacts in one place. Track company details, contact information, and organizational relationships.",
      "icon": "building",
      "isExpanded": true,
      "children": [
        {
          "id": "nav-company-dashboard",
          "type": "dashboard",
          "label": "Company Dashboard",
          "targetId": "dash-company"
        },
        {
          "id": "nav-company-table",
          "type": "table",
          "label": "Companies",
          "targetId": "tbl-company"
        }
      ]
    },
    {
      "id": "nav-quotation-mgmt",
      "type": "folder",
      "label": "Quotations Management",
      "description": "Track your sales pipeline from quotation to closure. Monitor deal values, statuses, and sales performance.",
      "icon": "document",
      "children": [
        {
          "id": "nav-large-deals",
          "type": "view",
          "label": "Large Scale Deals",
          "targetId": "view-quot-personal-2"
        },
        {
          "id": "nav-quotation-table",
          "type": "table",
          "label": "Quotations",
          "targetId": "tbl-quotation"
        }
      ]
    }
  ]
}
```

---

## UI Components

### 1. NavigationTree.vue

Main component that renders the entire navigation tree.

**Props:**
- `database: Database` - The database object with navigation structure
- `activeItemId?: string` - Currently active item ID
- `activeItemType?: 'table' | 'view' | 'dashboard' | 'folder'` - Type of active item (NEW)

**Events:**
- `@selectTable(tableId: string)` - Emitted when user clicks a table
- `@selectView(tableId: string, viewId: string)` - Emitted when user clicks a view
- `@selectDashboard(dashboardId: string)` - Emitted when user clicks a dashboard
- `@selectFolder(folderId: string)` - Emitted when user clicks a folder (NEW)
- `@toggleFolder(folderId: string)` - Emitted when user clicks the arrow to expand/collapse

### 2. NavItemComponent.vue (Recursive)

Renders a single navigation item. For folders, recursively renders children.

**Props:**
- `item: NavItem` - The item to render
- `depth: number` - Nesting level (for indentation)
- `isActive: boolean` - Whether this item is currently active
- `isExpanded: boolean` - Whether this folder is expanded
- `containsActive: boolean` - Whether this folder contains the active item

**Features:**
- Different icons based on item type
- Indentation based on depth
- **Two-action behavior for folders**: Click label to navigate, click arrow to expand/collapse (NEW)
- Hover and active states
- Drag-and-drop support for reordering

### 3. FolderView.vue (NEW)

Displays the folder description and overview when a folder is selected.

**Props:**
- `folder: NavItem` - The folder item to display
- `database: Database` - The database context

**Features:**
- Folder header with icon and name
- Rich text description display
- Statistics about folder contents
- Grid/list of child items with quick navigation
- Responsive layout

---

## Behavior Specifications

### Folder Expand/Collapse
- Folders are collapsed by default unless `isExpanded: true`
- **Clicking folder label/row navigates to folder description view** (NEW)
- **Clicking the arrow icon toggles expand/collapse** (separates navigation from expansion)
- State is preserved during session (can be persisted to localStorage)

### Item Selection
- Clicking a table opens the table view
- Clicking a view opens the personal view page
- Clicking a dashboard opens the dashboard
- **Clicking a folder opens the folder description view** (NEW)

### Folder Description View (NEW)
When a folder is selected, the main content area displays:
- **Folder name and icon** (header)
- **Description** (supports markdown/rich text formatting)
- **Quick statistics** (e.g., "Contains 3 tables, 2 views, 1 dashboard")
- **Children list** (visual cards or list showing what's inside the folder)
- **Optional metadata** (created date, last updated, etc.)

This makes folders act as "category landing pages" providing context and overview of the grouped items.

### Fallback Behavior
- If `navigation` is undefined or empty, auto-generate navigation from:
  - All tables as flat list
  - All dashboards
  - "My Views" folder with personal views

### Active State
- The currently viewed item is highlighted
- Parent folders of active item are auto-expanded

---

## Icon Mapping

| Item Type | Default Icon |
|-----------|--------------|
| folder    | `folder` or `folder-opened` |
| table     | `grid` or `list` |
| view      | `view` or `eye` |
| dashboard | `data-analysis` or `pie-chart` |

---

## Permissions (Future)

For future implementation, navigation items could have visibility permissions:

```typescript
interface NavItem {
  // ... existing properties
  visibleTo?: {
    roles?: string[]    // Role IDs that can see this item
    users?: string[]    // User IDs that can see this item
  }
}
```

---

## Implementation Phases

### Phase 1: Core Implementation
- [x] Type definitions
- [x] Mock data with sample navigation
- [x] NavigationTree component
- [x] NavItem component
- [x] Update DatabaseDetail sidebar
- [x] Drag-and-drop reordering support

### Phase 2: Folder Descriptions (Current)
- [ ] Add description field to NavItem interface
- [ ] Create FolderView component
- [ ] Update click behavior (separate navigation from expand)
- [ ] Update mock data with folder descriptions
- [ ] Integrate FolderView into DatabaseDetail

### Phase 3: Navigation Editor (Future)
- [ ] Admin dialog for editing navigation
- [ ] Add/remove items
- [ ] Icon picker
- [ ] Description editor (markdown support)

### Phase 4: Permissions (Future)
- [ ] Role-based visibility
- [ ] User-specific visibility

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `types/database.ts` | Modify | Add/update NavItem interface with description field |
| `data/crm-database.json` | Modify | Add folder descriptions to navigation data |
| `components/database/NavigationTree.vue` | Modify | Add selectFolder event |
| `components/database/NavItemComponent.vue` | Modify | Update click behavior for folders |
| `components/database/FolderView.vue` | Create | NEW: Display folder description and overview |
| `components/database/DatabaseDetail.vue` | Modify | Handle folder selection and display FolderView |

---

## Related Documents

- [Personal Views with Related Fields](./personal-views-with-related-fields.md)

