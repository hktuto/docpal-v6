# Group By Feature - Developer Quick Reference

## Quick Start

### Enable Grouping in Code

```typescript
import { useView } from '@/composables/useView'

const { setGroupBy } = useView(databaseId, tableId, viewId)

// Enable grouping by 'status' field
setGroupBy('status')

// Disable grouping
setGroupBy(null)
```

### Check if Grouping is Active

```typescript
const { groupBy } = useView(databaseId, tableId, viewId)

if (groupBy.value?.field) {
  console.log('Grouping by:', groupBy.value.field)
}
```

### Toggle Group Collapse

```typescript
const { toggleGroupCollapsed, isGroupCollapsed } = useView(databaseId, tableId, viewId)

// Toggle a group
toggleGroupCollapsed('in-progress')

// Check if collapsed
const collapsed = isGroupCollapsed('in-progress')
```

## API Reference

### Type Definitions

```typescript
// In types/database.ts

interface ViewConfig {
  groupBy?: {
    field: string                  // Field to group by
    collapsed?: string[]           // Collapsed group values
    showEmptyGroups?: boolean      // Show empty groups (default: true)
  }
}

interface GroupedData {
  groupValue: any                  // Raw field value
  groupLabel: string               // Formatted display label
  rows: Row[]                      // Records in group
  count: number                    // Number of records
  collapsed: boolean               // Collapse state
}
```

### Composable Functions

```typescript
// useView.ts exports:

// Computed property
const groupBy: ComputedRef<{ field: string, collapsed?: string[], showEmptyGroups?: boolean } | null>

// Functions
function setGroupBy(field: string | null): void
function toggleGroupCollapsed(groupValue: string): void
function isGroupCollapsed(groupValue: string): boolean
```

## Component Integration

### In Your Table Component

```vue
<script setup lang="ts">
import { useView } from '@/composables/useView'

const props = defineProps<{
  databaseId: string
  tableId: string
  viewId: string
}>()

const { groupBy, setGroupBy } = useView(
  props.databaseId, 
  props.tableId, 
  props.viewId
)

// Check if grouping is enabled
const isGrouped = computed(() => !!groupBy.value?.field)

// Get the grouping field
const groupField = computed(() => groupBy.value?.field)
</script>

<template>
  <div>
    <div v-if="isGrouped">
      Grouping by: {{ groupField }}
    </div>
  </div>
</template>
```

### In Settings UI

```vue
<script setup lang="ts">
const localGroupBy = ref('')

// Initialize from view config
onMounted(() => {
  localGroupBy.value = props.view.config?.groupBy?.field || ''
})

// Save grouping
function saveSettings() {
  const config = {
    groupBy: localGroupBy.value ? {
      field: localGroupBy.value,
      collapsed: [],
      showEmptyGroups: true
    } : undefined
  }
  
  emit('save', { config })
}
</script>

<template>
  <el-select v-model="localGroupBy" clearable>
    <el-option 
      v-for="col in groupableColumns" 
      :key="col.field"
      :value="col.field"
      :label="col.title"
    />
  </el-select>
</template>
```

## Grouping Logic

### Organize Data into Groups

```typescript
function organizeGroupedData(rows: Row[], groupField: string) {
  const groups = new Map<string, Row[]>()
  
  // Group rows
  for (const row of rows) {
    const value = row[groupField]
    const key = value ?? '__empty__'
    
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(row)
  }
  
  // Convert to array with labels
  return Array.from(groups.entries()).map(([key, rows]) => ({
    groupValue: key,
    groupLabel: formatGroupLabel(key, groupField),
    rows,
    count: rows.length,
    collapsed: false
  }))
}
```

### Format Group Labels

```typescript
function formatGroupLabel(value: any, column: Column): string {
  if (value === '__empty__') return '(Empty)'
  
  switch (column.type) {
    case 'single-select':
      return column.options?.find(o => o.id === value)?.label || value
    
    case 'user':
      return resolveUser(value)?.name || value
    
    case 'checkbox':
    case 'switch':
      return value === 'true' ? '✓ Yes' : '✗ No'
    
    default:
      return String(value)
  }
}
```

## Styling

### CSS Classes

```scss
// Group container
.grouped-table-view {
  display: flex;
  flex-direction: column;
}

// Group section
.group-section {
  margin-bottom: var(--app-space-m);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
}

// Group header (clickable)
.group-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  cursor: pointer;
  background: var(--app-fill-color-light);
  
  &:hover {
    background: var(--app-fill-color);
  }
}

// Expand/collapse icon
.group-expand-icon {
  font-size: var(--app-font-size-xs);
  transition: transform 0.2s ease;
}

// Group title
.group-title {
  flex: 1;
  font-weight: 600;
}

// Record count badge
.group-count {
  font-size: var(--app-font-size-s);
  background: var(--app-fill-color);
  padding: 2px 8px;
  border-radius: var(--app-border-radius-s);
}

// Group content
.group-content {
  padding: var(--app-space-s);
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { useView } from '@/composables/useView'

describe('Group By Feature', () => {
  it('should set group by field', () => {
    const { groupBy, setGroupBy } = useView('db1', 'table1', 'view1')
    
    setGroupBy('status')
    expect(groupBy.value?.field).toBe('status')
  })
  
  it('should clear group by field', () => {
    const { groupBy, setGroupBy } = useView('db1', 'table1', 'view1')
    
    setGroupBy('status')
    setGroupBy(null)
    expect(groupBy.value).toBeNull()
  })
  
  it('should toggle group collapsed state', () => {
    const { toggleGroupCollapsed, isGroupCollapsed } = useView('db1', 'table1', 'view1')
    
    toggleGroupCollapsed('in-progress')
    expect(isGroupCollapsed('in-progress')).toBe(true)
    
    toggleGroupCollapsed('in-progress')
    expect(isGroupCollapsed('in-progress')).toBe(false)
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('group by feature', async ({ page }) => {
  // Navigate to table view
  await page.goto('/database/db1/table/table1/view/view1')
  
  // Open settings
  await page.click('[data-testid="view-settings-btn"]')
  
  // Select group by field
  await page.selectOption('[data-testid="group-by-select"]', 'status')
  
  // Save
  await page.click('[data-testid="save-btn"]')
  
  // Verify groups are displayed
  await expect(page.locator('.group-section')).toHaveCount(3)
  await expect(page.locator('.group-title').first()).toContainText('In Progress')
  
  // Toggle group
  await page.click('.group-header:first-child')
  await expect(page.locator('.group-content').first()).not.toBeVisible()
})
```

## Common Patterns

### Pattern 1: Conditional Grouping

```typescript
// Only enable grouping if field exists
const canGroup = computed(() => {
  const field = groupBy.value?.field
  return field && table.value?.columns.some(c => c.field === field)
})
```

### Pattern 2: Group with Filters

```typescript
// Apply filters before grouping
const filteredRows = computed(() => {
  let rows = table.value?.rows || []
  
  // Apply filters
  for (const filter of filters.value) {
    rows = rows.filter(row => matchesFilter(row, filter))
  }
  
  // Then group
  if (groupBy.value?.field) {
    return organizeGroupedData(rows, groupBy.value.field)
  }
  
  return rows
})
```

### Pattern 3: Persist Collapse State

```typescript
// Save collapse state to view config
watch(collapsedGroups, (collapsed) => {
  if (groupBy.value) {
    updateViewConfig({
      groupBy: {
        ...groupBy.value,
        collapsed: Array.from(collapsed)
      }
    })
  }
}, { deep: true })
```

## Troubleshooting

### Issue: Groups not showing

**Check:**
1. Is `view.config.groupBy.field` set?
2. Does the field exist in table columns?
3. Are there records in the table?

```typescript
console.log('GroupBy config:', view.value?.config?.groupBy)
console.log('Table columns:', table.value?.columns.map(c => c.field))
console.log('Record count:', table.value?.rows.length)
```

### Issue: Wrong group labels

**Check:**
1. Field type is supported (single-select, user, checkbox, switch)
2. Options are defined for single-select fields
3. User resolver is working for user fields

```typescript
const column = table.value?.columns.find(c => c.field === groupBy.value?.field)
console.log('Column type:', column?.type)
console.log('Column options:', column?.options)
```

### Issue: Groups not collapsing

**Check:**
1. `toggleGroupCollapsed` is being called
2. Group value matches exactly (case-sensitive)
3. Component is re-rendering after state change

```typescript
console.log('Collapsed groups:', collapsedGroups.value)
console.log('Toggling group:', groupValue)
```

## Performance Tips

### 1. Limit Group Count
```typescript
// Warn if too many groups
if (groupedRows.value.length > 50) {
  console.warn('Too many groups, consider different grouping field')
}
```

### 2. Virtual Scrolling
```typescript
// For large groups, use virtual scrolling
<vxe-grid
  :data="group.rows"
  :scroll-y="{ enabled: true, gt: 100 }"
/>
```

### 3. Lazy Loading
```typescript
// Load group data on expand
async function handleGroupExpand(groupValue: string) {
  if (!groupDataCache.has(groupValue)) {
    const data = await fetchGroupData(groupValue)
    groupDataCache.set(groupValue, data)
  }
}
```

## Migration Guide

### From No Grouping to Grouping

```typescript
// Before
const rows = queryRows({ filters, sort })

// After
const rows = queryRows({ filters, sort })
if (groupBy.value?.field) {
  const grouped = organizeGroupedData(rows, groupBy.value.field)
  // Render grouped view
} else {
  // Render regular view
}
```

### From Custom Grouping to Standard

```typescript
// Before (custom implementation)
const groupedData = ref<Map<string, Row[]>>(new Map())

// After (using useView)
const { groupBy, setGroupBy } = useView(dbId, tableId, viewId)
setGroupBy('status')
```

## Best Practices

1. **Always validate field exists** before grouping
2. **Handle empty groups** gracefully
3. **Format labels** based on field type
4. **Persist collapse state** for better UX (optional)
5. **Show group counts** for transparency
6. **Support keyboard navigation** for accessibility
7. **Test with large datasets** (1000+ records)
8. **Provide clear UI feedback** when grouping changes

## Related Documentation

- [Full Implementation Guide](../GROUP_BY_IMPLEMENTATION.md)
- [Feature Summary](../GROUP_BY_FEATURE_SUMMARY.md)
- [Architecture Diagram](./group-by-architecture.md)
- [API Requirements](../API_REQUIREMENTS.md)

---

**Last Updated**: December 18, 2025  
**Version**: 1.0.0

