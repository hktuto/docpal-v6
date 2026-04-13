# My Views - Development Document

## Document Information
- **Feature Name**: My Views (Personal & Shared Views)
- **Version**: 2.0
- **Date**: December 17, 2024
- **Status**: Planning

---

## 1. Feature Overview

### 1.1 Context: Case Management System

This feature is part of the DocPal Case Management module. The module consists of:

| Component | Purpose |
|-----------|---------|
| **Tables** | Data structure - how case data is stored and related |
| **Dashboard** | Reports, charts, actions for admin/manager quick access |
| **My Views** | User-customized views with filters, sorting, and layout preferences |
| **Automate** | Workflow automation and job status monitoring |

### 1.2 What is a View?

A **View** is a personalized lens through which users see table data. Views allow users to:
- Filter data to show only relevant records
- Sort data in preferred order
- Choose which columns to display (from base table + related tables)
- Select visualization type (Table, Kanban, Gantt, Calendar, etc.)
- Save and reuse these configurations
- Share configurations with other users

**Important**: Views are backed by real PostgreSQL VIEWs on the backend.

### 1.3 Key Benefits

| Stakeholder | Benefit |
|-------------|---------|
| **Users** | Self-service view creation, personalized data organization |
| **Admins** | Reduced support burden, users can customize without changing schema |
| **System** | Real PG views enable optimized queries and consistent data access |

### 1.4 Scope

**Phase 1 (MVP):**
- ✅ Create personal views
- ✅ View type switching (Table, Kanban, Gantt, Calendar)
- ✅ Column visibility (show/hide columns from base table)
- ✅ Column visibility (show/hide columns from related tables via JOINs)
- ✅ Filters (persisted to view)
- ✅ Sorting (persisted to view)
- ✅ Save view configuration
- ✅ Share view with other users (UI)

**Phase 2 (Future):**
- Pivot table view type
- Group by functionality for table view
- Advanced aggregations in views
- View templates
- Bulk operations in views

**Out of Scope:**
- ❌ Adding custom data columns to views (e.g., personal notes column)
  - *Rationale*: Industry standard is columns belong to tables, views configure visibility
  - *Alternative*: Use record-level notes feature or add column to base table

---

## 2. User Experience

### 2.1 View Creation Flow

**Principle**: Create first, configure in place (not a wizard)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 1: User clicks [+ New View]                                │
│          (from table toolbar OR sidebar MY VIEWS section)        │
│                                                                  │
│                            ↓                                     │
│                                                                  │
│  Step 2: Simple dialog appears                                   │
│          ┌────────────────────────────────────────┐             │
│          │ Create New View                    [×] │             │
│          ├────────────────────────────────────────┤             │
│          │                                        │             │
│          │ View Name *                            │             │
│          │ ┌────────────────────────────────┐    │             │
│          │ │ My Sales Pipeline              │    │             │
│          │ └────────────────────────────────┘    │             │
│          │                                        │             │
│          │ Base Table *                           │             │
│          │ ┌────────────────────────────────┐    │             │
│          │ │ Quotations                 [▼] │    │             │
│          │ └────────────────────────────────┘    │             │
│          │ (Pre-selected if created from table)  │             │
│          │                                        │             │
│          │           [Cancel]  [Create]           │             │
│          └────────────────────────────────────────┘             │
│                                                                  │
│                            ↓                                     │
│                                                                  │
│  Step 3: View page opens immediately                             │
│          User configures view using inline toolbar               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 View Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 My Sales Pipeline                                    [···]    │
│ Quotations • Created by You • Last saved 2 min ago              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ View: [Table ▼]  │ + Filter  │ + Sort  │ Columns [▼]  │ Save ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │                                                              ││
│ │   (Table / Kanban / Gantt / Calendar renders here)          ││
│ │                                                              ││
│ │   ┌─────────┬─────────────┬──────────────┬─────────────┐   ││
│ │   │ Quote # │ Company     │ Contact      │ Amount      │   ││
│ │   ├─────────┼─────────────┼──────────────┼─────────────┤   ││
│ │   │ QT-001  │ TechCorp    │ John Smith   │ $125,000    │   ││
│ │   │ QT-002  │ GlobalInd   │ Sarah Chen   │ $75,000     │   ││
│ │   └─────────┴─────────────┴──────────────┴─────────────┘   ││
│ │                                                              ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Toolbar Components

#### View Type Switcher
```
┌─────────────────────┐
│ View Type      [▼]  │
├─────────────────────┤
│ ○ Table             │
│ ● Kanban            │
│ ○ Gantt             │
│ ○ Calendar          │
│ ○ Gallery           │
└─────────────────────┘
```
*Note: Some view types require configuration (e.g., Kanban needs groupBy field)*

#### Filter Builder
```
┌───────────────────────────────────────────────────────────┐
│ Filters                                              [×]  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────┐ ┌──────────┐ ┌─────────────────┐ [×]    │
│ │ Status  [▼] │ │ is   [▼] │ │ Sent, Accepted  │        │
│ └─────────────┘ └──────────┘ └─────────────────┘        │
│                                                           │
│ ┌─────────────┐ ┌──────────┐ ┌─────────────────┐ [×]    │
│ │ Amount  [▼] │ │ >    [▼] │ │ 50000           │        │
│ └─────────────┘ └──────────┘ └─────────────────┘        │
│                                                           │
│ [+ Add Filter]                                            │
│                                                           │
│                                    [Clear All]  [Apply]   │
└───────────────────────────────────────────────────────────┘
```

#### Sort Builder
```
┌───────────────────────────────────────────────────────────┐
│ Sorting                                              [×]  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐ ┌────────────┐                   │
│ │ 1. Amount       [▼] │ │ Desc   [▼] │  [×]              │
│ └─────────────────────┘ └────────────┘                   │
│                                                           │
│ ┌─────────────────────┐ ┌────────────┐                   │
│ │ 2. Created At   [▼] │ │ Asc    [▼] │  [×]              │
│ └─────────────────────┘ └────────────┘                   │
│                                                           │
│ [+ Add Sort]                                              │
│                                                           │
│                                    [Clear All]  [Apply]   │
└───────────────────────────────────────────────────────────┘
```

#### Column Selector
```
┌───────────────────────────────────────────────────────────┐
│ Columns                                              [×]  │
├───────────────────────────────────────────────────────────┤
│ 🔍 Search columns...                                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ 📋 QUOTATIONS (Base Table)                               │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ☑ Quotation Number                                  │  │
│ │ ☑ Status                                            │  │
│ │ ☑ Amount                                            │  │
│ │ ☐ Valid Until                                       │  │
│ │ ☐ Notes                                             │  │
│ │ ☑ Created At                                        │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ 🔗 COMPANY (Related)                                      │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ☑ Company → Name                                    │  │
│ │ ☐ Company → Email                                   │  │
│ │ ☐ Company → Phone                                   │  │
│ │ ☐ Company → Type                                    │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ 🔗 CONTACT (Related)                                      │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ☑ Contact → Name                                    │  │
│ │ ☐ Contact → Email                                   │  │
│ │ ☐ Contact → Phone                                   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ 👤 SALES PERSON (Related User)                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ☑ Sales Person → Name                               │  │
│ │ ☐ Sales Person → Email                              │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│                              [Select All]  [Clear All]    │
└───────────────────────────────────────────────────────────┘
```

### 2.4 View Actions Menu

```
Right-click on view in sidebar OR click [...] menu:

┌─────────────────────┐
│ ✏️ Rename           │
│ 📋 Duplicate        │
│ 🔗 Share...         │
│ ─────────────────── │
│ 🗑️ Delete           │
└─────────────────────┘
```

### 2.5 Share View Dialog

```
┌───────────────────────────────────────────────────────────┐
│ Share View: My Sales Pipeline                        [×]  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Share with                                                │
│ ┌─────────────────────────────────────────────────┐ [+]  │
│ │ Search users or groups...                        │      │
│ └─────────────────────────────────────────────────┘      │
│                                                           │
│ Shared with:                                              │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 👤 Alice Chen              Can view  [▼]       [×]  │  │
│ │ 👥 Sales Team              Can view  [▼]       [×]  │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ 🔗 Copy link                                              │
│                                                           │
│                                              [Done]       │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Technical Specifications

### 3.1 Data Models

#### Updated View Interface
```typescript
interface View {
  id: string
  name: string
  type: ViewType
  baseTableId: string              // Which table this view is based on
  isDefault: boolean               // Is this the default view for the table?
  
  // Ownership & Sharing
  createdBy: string                // User ID who created
  visibility: ViewVisibility       // 'personal' | 'shared'
  sharedWith?: SharedWith[]        // Users/groups with access
  
  // Column Configuration
  visibleColumns: VisibleColumn[]  // Columns to show (base + related)
  columnOrder?: string[]           // Custom column ordering
  
  // View Configuration
  config: ViewConfig               // Filters, sorting, view-specific settings
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

type ViewType = 'table' | 'kanban' | 'gantt' | 'calendar' | 'gallery'
type ViewVisibility = 'personal' | 'shared'
```

#### Visible Column Definition
```typescript
interface VisibleColumn {
  id: string                       // Unique ID for this column selection
  columnId: string                 // Original column ID
  field: string                    // Field name
  sourceTableId: string            // Which table this column is from
  sourceType: 'base' | 'relation'  // Is it from base table or related?
  relationField?: string           // If related, which relation field to traverse
  displayTitle?: string            // Optional custom display title
  width?: number                   // Column width
}
```

#### View Configuration
```typescript
interface ViewConfig {
  // Filtering
  filters?: FilterCondition[]
  
  // Sorting
  sorting?: SortConfig[]
  
  // View-type specific
  kanban?: {
    groupByField: string
    showEmptyColumns?: boolean
  }
  gantt?: {
    startDateField: string
    endDateField: string
    titleField: string
  }
  calendar?: {
    dateField: string
    titleField?: string
  }
  gallery?: {
    coverField?: string
    titleField: string
  }
}
```

#### Sharing Configuration
```typescript
interface SharedWith {
  type: 'user' | 'group' | 'role'
  id: string
  name: string
  permission: 'view' | 'edit'      // View only or can edit config
}
```

### 3.2 Component Structure

```
demo/database/components/database/
├── views/
│   ├── TableView.vue              (UPDATE: Support visible columns)
│   ├── KanbanView.vue             (UPDATE: Support visible columns)
│   ├── GanttView.vue              (existing)
│   ├── CalendarView.vue           (existing)
│   └── GalleryView.vue            (existing)
├── ViewPage.vue                   (NEW: Main view page with toolbar)
├── ViewToolbar.vue                (NEW: View type, filters, sort, columns)
├── ViewTypeSwitcher.vue           (NEW: Dropdown to switch view types)
├── FilterBuilder.vue              (NEW: Inline filter configuration)
├── SortBuilder.vue                (NEW: Inline sort configuration)
├── ColumnSelector.vue             (NEW: Column visibility with related tables)
├── ShareViewDialog.vue            (NEW: Share view with users/groups)
├── CreateViewDialog.vue           (UPDATE: Simplified - just name + table)
├── DatabaseDetail.vue             (UPDATE: Navigate to ViewPage)
└── ViewRenderer.vue               (UPDATE: Pass visible columns config)
```

### 3.3 Composable Updates

```typescript
// useTable composable additions
function getRelatedTables(): RelatedTableInfo[]
function getRelatedTableColumns(relationField: string): Column[]
function resolveVisibleColumns(visibleColumns: VisibleColumn[]): ResolvedColumn[]

// useView composable (NEW)
function useView(databaseId: string, viewId: string) {
  // View CRUD
  function getView(): View
  function updateView(data: Partial<View>): void
  function saveView(): Promise<void>
  
  // Column management
  function toggleColumn(column: VisibleColumn): void
  function reorderColumns(columnIds: string[]): void
  
  // Filter management
  function addFilter(filter: FilterCondition): void
  function removeFilter(index: number): void
  function updateFilter(index: number, filter: FilterCondition): void
  
  // Sort management
  function addSort(sort: SortConfig): void
  function removeSort(index: number): void
  function updateSort(index: number, sort: SortConfig): void
  
  // Sharing
  function shareWith(target: SharedWith): void
  function removeShare(targetId: string): void
  
  return { ... }
}
```

### 3.4 PostgreSQL View Generation

When a view is saved, the backend generates a real PostgreSQL VIEW:

```sql
-- Example: "My Sales Pipeline" view on Quotations table
CREATE OR REPLACE VIEW user_view_my_sales_pipeline AS
SELECT 
  q.id,
  q.quotation_number,
  q.status,
  q.amount,
  q.created_at,
  c.name AS "company_name",         -- Related: Company → Name
  ct.name AS "contact_name",        -- Related: Contact → Name
  u.name AS "sales_person_name"     -- Related: Sales Person → Name
FROM quotations q
LEFT JOIN companies c ON q.company_id = c.id
LEFT JOIN contacts ct ON q.contact_person_id = ct.id
LEFT JOIN users u ON q.sales_person_id = u.id
WHERE q.status IN ('sent', 'accepted')   -- Filter: Status
  AND q.amount > 50000                    -- Filter: Amount > 50000
ORDER BY q.amount DESC, q.created_at ASC; -- Sorting
```

---

## 4. Implementation Plan

### Phase 1: Foundation (Days 1-2)

#### Tasks:
1. **Update Type Definitions** (`types/database.ts`)
   - Extend `View` interface with new fields
   - Add `VisibleColumn` interface
   - Add `SharedWith` interface
   - Update `ViewConfig` interface

2. **Create useView Composable** (`composables/useView.ts`)
   - View state management
   - Column visibility logic
   - Filter/sort management
   - Related table column resolution

3. **Update Mock Data** (`data/crm-database.json`)
   - Add sample views with `visibleColumns` configuration

### Phase 2: View Page & Toolbar (Days 3-5)

#### Tasks:
1. **Create ViewPage Component**
   - Main layout with header and toolbar
   - View metadata display (name, created by, last saved)
   - Integration with view renderer

2. **Create ViewToolbar Component**
   - Container for all toolbar elements
   - Responsive layout

3. **Create ViewTypeSwitcher Component**
   - Dropdown with view type options
   - View-specific configuration prompts

4. **Update CreateViewDialog**
   - Simplify to just name + base table
   - Navigate to ViewPage after creation

### Phase 3: Filter & Sort Builders (Days 6-7)

#### Tasks:
1. **Create FilterBuilder Component**
   - Field selector with type-aware operators
   - Value input based on field type
   - Add/remove filter rows
   - Apply/clear actions

2. **Create SortBuilder Component**
   - Field selector
   - Asc/Desc toggle
   - Multi-sort with drag reorder
   - Apply/clear actions

### Phase 4: Column Selector (Days 8-9)

#### Tasks:
1. **Create ColumnSelector Component**
   - Grouped by source (base table vs related)
   - Search/filter functionality
   - Checkbox toggle for visibility
   - Related table columns with prefix notation

2. **Update View Renderers**
   - TableView: Use visibleColumns instead of table.columns
   - KanbanView: Same update
   - Resolve related column values

### Phase 5: Sharing & Polish (Days 10-11)

#### Tasks:
1. **Create ShareViewDialog Component**
   - User/group search
   - Permission level selector
   - List of current shares
   - Remove share action

2. **Update Sidebar Navigation**
   - Show shared views separately or with badge
   - Context menu for view actions

3. **Save Indicator & Auto-save**
   - "Unsaved changes" indicator
   - Save button
   - Optional: Auto-save debounced

### Phase 6: Testing & Edge Cases (Day 12)

#### Tasks:
1. Test all view types with visible columns
2. Test filter combinations
3. Test related column resolution
4. Handle missing/deleted related records
5. Performance testing with large datasets

---

## 5. User Flows

### 5.1 Create New View

```
User Action                          System Response
─────────────────────────────────────────────────────────────────
1. Click [+ New View] in sidebar    → Show CreateViewDialog
   OR click [+ View] in table       → Pre-select current table

2. Enter view name                  → Enable Create button
   Select base table (if not pre-selected)

3. Click [Create]                   → Create view record
                                    → Navigate to ViewPage
                                    → Show empty view with defaults

4. Configure in ViewPage            → Real-time preview
   - Switch view type
   - Toggle columns
   - Add filters
   - Set sorting

5. Click [Save]                     → Persist configuration
                                    → Update sidebar
                                    → Show success message
```

### 5.2 Edit Existing View

```
User Action                          System Response
─────────────────────────────────────────────────────────────────
1. Click view in sidebar            → Navigate to ViewPage
                                    → Load view configuration
                                    → Render with saved settings

2. Modify configuration             → Show "Unsaved changes" indicator
   - Change filters
   - Reorder columns
   - Switch view type

3. Click [Save]                     → Persist changes
                                    → Clear unsaved indicator
                                    → Show success message
```

### 5.3 Share View

```
User Action                          System Response
─────────────────────────────────────────────────────────────────
1. Click [...] → Share              → Open ShareViewDialog
   OR right-click view → Share

2. Search for user/group            → Show matching results

3. Click user/group to add          → Add to shared list
                                    → Default: "Can view"

4. Optionally change permission     → Update permission level

5. Click [Done]                     → Save sharing config
                                    → View appears in shared users' sidebar
```

---

## 6. Edge Cases & Considerations

### 6.1 Related Column Resolution

**Scenario**: User shows "Company → Name" column but some quotations have no company
**Solution**: Display "-" or empty cell, don't break the view

### 6.2 Multiple Relations

**Scenario**: Quotation has multiple contacts (many-to-many)
**Solution**: 
- For table view: Show first value or count ("3 contacts")
- User preference: First, Count, or Comma-separated (max 3)

### 6.3 Deleted Related Records

**Scenario**: Related company was deleted
**Solution**: Show "(Deleted)" or empty, allow view to still function

### 6.4 View Type Switching

**Scenario**: User switches from Table to Kanban but no groupBy field is set
**Solution**: Prompt user to select groupBy field before switching

### 6.5 Shared View Permissions

**Scenario**: View owner deletes view that's shared with others
**Solution**: View disappears from all users' sidebars, show notification

### 6.6 Filter on Related Columns

**Scenario**: User wants to filter by "Company → Type"
**Solution**: 
- Phase 1: Only allow filtering on base table columns
- Phase 2: Enable filtering on related columns (requires JOINs in backend)

---

## 7. Acceptance Criteria

### 7.1 View Creation
- [ ] User can create view from sidebar [+ New View]
- [ ] User can create view from table page
- [ ] View opens immediately after creation
- [ ] View is added to MY VIEWS sidebar section

### 7.2 View Configuration
- [ ] User can switch view type (Table, Kanban, Gantt, Calendar, Gallery)
- [ ] User can toggle column visibility
- [ ] User can see and select related table columns
- [ ] User can add/edit/remove filters
- [ ] User can add/edit/remove sorting
- [ ] Configuration is reflected in real-time

### 7.3 Save & Persistence
- [ ] User can save view configuration
- [ ] Saved configuration persists across sessions
- [ ] Unsaved changes indicator shows when modified

### 7.4 Sharing
- [ ] User can share view with other users/groups
- [ ] Shared users see view in their sidebar
- [ ] Share permissions (view/edit) are respected

### 7.5 View Management
- [ ] User can rename view
- [ ] User can duplicate view
- [ ] User can delete view (with confirmation)
- [ ] Only owner can delete view

---

## 8. Future Enhancements (Phase 2+)

| Feature | Description |
|---------|-------------|
| Pivot Table | Aggregated view with row/column grouping |
| Group By (Table) | Group rows by field value in table view |
| Filter on Related | Filter by related table column values |
| Column Aliases | Rename columns in view |
| View Templates | Save view as template, apply to other tables |
| Conditional Formatting | Color rows/cells based on conditions |
| Quick Filters | Saved filter presets within a view |
| Export View | Export current view data to Excel/CSV |

---

## 9. Technical Dependencies

### 9.1 Existing Code
- `types/database.ts` - Type definitions
- `composables/useDatabase.ts` - Data access layer
- `components/database/views/TableView.vue` - Table rendering
- `components/database/ViewRenderer.vue` - View type routing
- `data/crm-database.json` - Mock data

### 9.2 New Dependencies
- None - Feature uses existing tech stack

### 9.3 Backend Requirements (for production)
- API endpoint to create/update/delete views
- API endpoint to share views
- PostgreSQL VIEW generation based on configuration
- Permission checks for shared views

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Base Table** | The primary table a view is built on |
| **Related Table** | A table connected via relation column (FK) |
| **Visible Column** | A column selected to appear in the view |
| **View Configuration** | Filters, sorting, and view-specific settings |
| **Personal View** | View visible only to the creator |
| **Shared View** | View shared with other users/groups |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-16 | Development Team | Initial document |
| 2.0 | 2024-12-17 | Development Team | Simplified based on requirements clarification: removed wizard flow, removed custom columns, added inline configuration approach |
