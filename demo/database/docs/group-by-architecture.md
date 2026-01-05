# Group By Feature - Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Actions                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ViewSettingsDrawer.vue                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [View Type: Table ▼]                                     │  │
│  │                                                            │  │
│  │  Group By Field: [Status ▼]  ← User selects field       │  │
│  │  Hint: Group records by field...                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                    buildSettings()                               │
│  config.groupBy = {                                             │
│    field: 'status',                                             │
│    collapsed: [],                                               │
│    showEmptyGroups: true                                        │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ViewPage.vue                               │
│  Calls: updateViewConfig(settings.config)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      useView.ts                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  const groupBy = computed(() =>                           │  │
│  │    view.value?.config?.groupBy || null                    │  │
│  │  )                                                         │  │
│  │                                                            │  │
│  │  function setGroupBy(field: string | null)                │  │
│  │  function toggleGroupCollapsed(groupValue: string)        │  │
│  │  function isGroupCollapsed(groupValue: string)            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TableView.vue                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Fetch data via mockTableApi()                         │  │
│  │     ↓                                                      │  │
│  │  2. Check if viewGroupBy.field exists                     │  │
│  │     ↓                                                      │  │
│  │  3. organizeGroupedData(rows)                             │  │
│  │     - Group rows by field value                           │  │
│  │     - Format labels (single-select, user, etc.)          │  │
│  │     - Sort groups (non-empty first)                       │  │
│  │     ↓                                                      │  │
│  │  4. Render grouped view                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI Rendering                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Toolbar (Filters + Export)                               │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  ▼ In Progress (5) ← Click to collapse                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [VxeGrid with 5 records]                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ▼ Completed (12)                                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [VxeGrid with 12 records]                          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ▼ (Empty) (3)                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [VxeGrid with 3 records]                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
ViewPage.vue
  │
  ├─ UnifiedHeader.vue
  │   └─ Actions: [Save, Settings, Share, ...]
  │
  ├─ ViewRenderer.vue
  │   └─ TableView.vue (if view.type === 'table')
  │       │
  │       ├─ [Grouped Mode] (if viewGroupBy.field)
  │       │   ├─ Toolbar (ResponsiveFilter + Export)
  │       │   └─ Groups Container
  │       │       ├─ Group Section 1
  │       │       │   ├─ Group Header (clickable)
  │       │       │   └─ VxeGrid (if not collapsed)
  │       │       ├─ Group Section 2
  │       │       └─ ...
  │       │
  │       └─ [Regular Mode] (if no groupBy)
  │           └─ VxeGrid (full table)
  │
  └─ ViewSettingsDrawer.vue
      ├─ General Section
      ├─ View Type Section
      │   └─ [Table Config] Group By Field dropdown
      ├─ Filters Section
      ├─ Sorting Section
      └─ Columns Section
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      View Object                                 │
│  {                                                               │
│    id: 'view-123',                                              │
│    name: 'My Table View',                                       │
│    type: 'table',                                               │
│    config: {                                                    │
│      groupBy: {                    ← Persisted in view config  │
│        field: 'status',            ← Which field to group by   │
│        collapsed: [],              ← Which groups are collapsed│
│        showEmptyGroups: true       ← Show empty groups?        │
│      },                                                         │
│      filters: [...],                                            │
│      sorting: [...]                                             │
│    },                                                           │
│    columns: [...]                                               │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TableView Local State                           │
│  const groupedRows = ref<GroupedData[]>([])                     │
│  const collapsedGroups = ref<Set<string>>(new Set())           │
│                                                                  │
│  interface GroupedData {                                        │
│    groupValue: any        // 'in-progress', 'user-123', etc.  │
│    groupLabel: string     // 'In Progress', 'John Doe', etc.  │
│    rows: Row[]            // Records in this group             │
│    count: number          // Number of records                 │
│    collapsed: boolean     // Expand/collapse state             │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Grouping Algorithm

```typescript
function organizeGroupedData(rows: Row[]) {
  // 1. Get grouping field
  const groupField = viewGroupBy.value.field  // e.g., 'status'
  const groupColumn = table.columns.find(c => c.field === groupField)
  
  // 2. Create groups map
  const groups = new Map<string, Row[]>()
  
  for (const row of rows) {
    const value = row[groupField]  // e.g., 'in-progress'
    const key = value ?? '__empty__'
    
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(row)
  }
  
  // 3. Format labels based on field type
  groupedRows.value = Array.from(groups.entries()).map(([key, rows]) => {
    let label = key
    
    if (key === '__empty__') {
      label = '(Empty)'
    } else if (groupColumn.type === 'single-select') {
      label = groupColumn.options.find(o => o.id === key)?.label || key
    } else if (groupColumn.type === 'user') {
      label = resolveUser(key)?.name || key
    } else if (groupColumn.type === 'checkbox') {
      label = key === 'true' ? '✓ Yes' : '✗ No'
    }
    
    return {
      groupValue: key,
      groupLabel: label,
      rows: rows,
      count: rows.length,
      collapsed: collapsedGroups.value.has(key)
    }
  })
  
  // 4. Sort: non-empty first, then alphabetically
  groupedRows.value.sort((a, b) => {
    if (a.groupValue === '__empty__') return 1
    if (b.groupValue === '__empty__') return -1
    return a.groupLabel.localeCompare(b.groupLabel)
  })
}
```

## Field Type Support Matrix

| Field Type    | Supported | Group Label Format        | Example                |
|---------------|-----------|---------------------------|------------------------|
| single-select | ✅        | Option label              | "In Progress"          |
| user          | ✅        | User name                 | "John Doe"             |
| checkbox      | ✅        | ✓ Yes / ✗ No             | "✓ Yes"                |
| switch        | ✅        | ✓ Yes / ✗ No             | "✗ No"                 |
| text          | ❌ Phase 2 | Text value               | "Category A"           |
| number        | ❌ Phase 2 | Number or range          | "0-10", "10-20"        |
| date          | ❌ Phase 2 | Month/Year               | "January 2025"         |
| multi-select  | ❌ Phase 2 | Complex (multiple groups)| "Tag1, Tag2"           |
| relation      | ❌ Phase 2 | Related record name      | "Company ABC"          |

## Performance Characteristics

### Current Implementation (Phase 1)
- **Grouping**: Client-side (after data fetch)
- **Optimal for**: <10,000 records
- **Memory**: O(n) where n = number of records
- **Rendering**: Each group has own VxeGrid instance

### Future Optimization (Phase 2)
- **Grouping**: Server-side via API query param
- **Optimal for**: 100,000+ records
- **API**: `GET /records?groupBy=status`
- **Pagination**: Per-group pagination

## Integration Points

### 1. With Filters
```
User applies filter → Fetch filtered data → Group filtered data → Render
```

### 2. With Sorting
```
User sets sort → Fetch sorted data → Group sorted data → Render
(Sorting applies within each group)
```

### 3. With Search
```
User searches → Fetch matching data → Group matching data → Render
```

### 4. With Export
```
User clicks export → Get all grouped data → Export to Excel
(Groups are preserved in export)
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Group field deleted | Grouping automatically disabled |
| Group field changed type | Grouping may show unexpected results |
| No records | Shows empty state |
| All records in one group | Shows single group |
| Empty group values | Shows "(Empty)" group |

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Accessibility

- ✅ Keyboard navigation (Tab, Enter)
- ✅ Screen reader support (group headers are buttons)
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators

---

**Last Updated**: December 18, 2025

