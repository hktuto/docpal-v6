# Two-Level Grouping Feature

## Overview

Extended the Group By feature to support **2-level grouping**:
- **Level 1 (Primary)**: Separate table sections (as before)
- **Level 2 (Secondary)**: VxeTable's built-in tree grouping within each table

## Visual Structure

```
┌─────────────────────────────────────────────────────┐
│  ▼ Assigned To: Alice Chen (8)                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ▼ Status: In Progress (3)                   │   │
│  │    ├─ Record 1                                │   │
│  │    ├─ Record 2                                │   │
│  │    └─ Record 3                                │   │
│  │  ▼ Status: Completed (5)                     │   │
│  │    ├─ Record 4                                │   │
│  │    ├─ Record 5                                │   │
│  │    └─ ...                                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ▼ Assigned To: Bob Wilson (12)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  ▼ Status: In Progress (7)                   │   │
│  │    ├─ Record 6                                │   │
│  │    └─ ...                                     │   │
│  │  ▼ Status: Completed (5)                     │   │
│  │    └─ ...                                     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Type Changes

**types/database.ts**
```typescript
interface ViewConfig {
  groupBy?: {
    field: string                  // Level 1: Separate tables
    secondaryField?: string        // Level 2: Tree grouping within tables
    collapsed?: string[]
    showEmptyGroups?: boolean
  }
}
```

### 2. UI Changes

**ViewSettingsDrawer.vue**
- Added "Primary Group By (Level 1)" label
- Added "Secondary Group By (Level 2)" dropdown (appears when primary is set)
- Secondary dropdown filters out the primary field (can't group by same field twice)
- Clear hint text explaining each level

### 3. Logic Changes

**TableView.vue**

#### New Functions:

1. **`transformRowsForTreeGrouping(rows: Row[])`**
   - Groups rows by secondary field
   - Creates parent nodes with `_isGroupNode: true`
   - Formats labels based on field type
   - Returns tree structure compatible with VxeTable

2. **`getTreeConfig()`**
   - Returns VxeTable tree configuration
   - Enables expand/collapse icons
   - Sets `expandAll: true` by default

#### Modified Functions:

1. **`organizeGroupedData(rows)`**
   - Now checks if secondary grouping is enabled
   - Calls `transformRowsForTreeGrouping()` if needed
   - Returns tree-structured data for VxeTable

#### Template Changes:

- Added `:tree-config` prop to VxeGrid (when secondary grouping is enabled)
- Added special rendering for group nodes (`row._isGroupNode`)
- Group nodes show label and count in first column
- Other columns are empty for group nodes

### 4. Styling

**New CSS:**
```scss
.tree-group-label {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-weight: 600;
}

.tree-group-count {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
}

// Level 0 rows (group nodes) have lighter background
.vxe-body--row.row--level-0 {
  background: var(--app-fill-color-lighter);
}

// Level 1 rows (actual data) have normal background
.vxe-body--row.row--level-1 {
  background: var(--app-bg-color);
}
```

## How to Use

1. Open View Settings
2. Select "Primary Group By (Level 1)" - e.g., "Assigned To"
3. Select "Secondary Group By (Level 2)" - e.g., "Status"
4. Click "Save"

**Result:**
- Records are first separated into tables by "Assigned To"
- Within each table, records are grouped by "Status" with tree structure
- Click ▶/▼ icons to expand/collapse secondary groups

## Features

✅ Two-level hierarchical grouping  
✅ Separate tables for primary grouping  
✅ Tree structure for secondary grouping  
✅ Expand/collapse secondary groups  
✅ Record counts at both levels  
✅ Smart label formatting  
✅ Compatible with all table features  
✅ Works with filters and sorting  

## Technical Notes

### VxeTable Tree Mode

- Uses `tree-config` with `transform: true`
- Parent nodes have `children` array
- Expand/collapse handled by VxeTable automatically
- Custom icons: `vxe-icon-square-minus/plus`

### Data Structure

```typescript
// Without secondary grouping
rows = [
  { id: '1', name: 'Record 1', status: 'active' },
  { id: '2', name: 'Record 2', status: 'active' }
]

// With secondary grouping (tree structure)
rows = [
  {
    id: 'group-active',
    _isGroupNode: true,
    _groupLabel: 'Active',
    _groupCount: 2,
    children: [
      { id: '1', name: 'Record 1', status: 'active' },
      { id: '2', name: 'Record 2', status: 'active' }
    ]
  }
]
```

### Performance

- **Primary grouping**: O(n) where n = number of records
- **Secondary grouping**: O(n) within each primary group
- **Total**: O(n) overall complexity
- **Memory**: Minimal overhead for tree structure

## Limitations

1. **Max 2 levels** - No 3rd level grouping (would be too complex visually)
2. **Same field types** - Both levels support: single-select, user, checkbox, switch
3. **No cross-group sorting** - Sorting applies within groups only

## Future Enhancements

- [ ] Persist expand/collapse state per group
- [ ] Group aggregations (sum, count, avg) in parent nodes
- [ ] Drag & drop to reorder within groups
- [ ] Custom icons per group type
- [ ] Backend grouping for large datasets

## Comparison

### Single-Level Grouping
```
▼ Status: Active (10 records in one flat table)
```

### Two-Level Grouping
```
▼ Assigned To: Alice (primary)
  ▼ Status: Active (5 records)
  ▼ Status: Completed (3 records)
```

**Benefit**: Better organization for complex data with multiple dimensions

---

**Implementation Date**: December 18, 2025  
**Status**: ✅ Complete  
**Testing**: Ready for browser testing

