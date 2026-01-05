# Two-Level Aggregations Implementation

## Overview

The grouped table view now supports **two levels of aggregations**:
1. **Level 1 (Primary Groups)**: Footer row showing grand totals for each primary group
2. **Level 2 (Secondary Groups)**: Header badges showing sub-totals for each secondary group

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 Alice Chen (6 quotations)                ← Primary Group │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ▼ Sent (3)            │ Σ $156,700.00 │   ← Level 2 Badge  │
│   ├─ QT-2024-001      │ $126,000.00   │                    │
│   ├─ QT-2024-004      │ $10,500.00    │                    │
│   └─ QT-2024-015      │ $48,510.00    │                    │
│                                                              │
│ ▼ Draft (2)           │ Σ $68,512.50  │   ← Level 2 Badge  │
│   ├─ QT-2024-005      │ $56,700.00    │                    │
│   └─ QT-2024-003      │ $11,812.50    │                    │
│                                                              │
│ ▼ Accepted (1)        │ Σ $11,812.50  │   ← Level 2 Badge  │
│   └─ QT-2024-006      │ $11,812.50    │                    │
│                                                              │
├═════════════════════════════════════════════════════════════┤
│ Total                 │ Σ $236,725.00 │   ← Level 1 Footer │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Level 1: Primary Group Footer

**How it works:**
- Uses VxeTable's built-in `show-footer` prop
- Calculates aggregations via `footer-method`
- Shows "Total" label in first column
- Displays aggregations in configured columns

**Code:**
```vue
<vxe-grid
  :show-footer="viewGroupBy?.aggregations && viewGroupBy.aggregations.length > 0"
  :footer-method="({ columns, data }) => getGroupFooterData(columns, data, group)"
/>
```

**Function:**
```typescript
function getGroupFooterData(columns, data, group) {
  // Filter out group nodes if secondary grouping is enabled
  const actualRows = hasSecondaryGrouping 
    ? data.filter(row => !row._isGroupNode) 
    : data
  
  // Calculate aggregations for entire primary group
  // Return formatted footer row
}
```

**Styling:**
- Background: Light gray (`var(--app-fill-color-lighter)`)
- Border: 2px solid top border
- Font Weight: Bold (600)
- First column "Total": Primary color, extra bold (700)

### Level 2: Secondary Group Headers

**How it works:**
- Calculated during tree data transformation
- Stored in group node with `_agg_${field}` property
- Rendered as badges in group header cells

**Code:**
```typescript
// During transformRowsForTreeGrouping():
aggregations.forEach(agg => {
  const value = calculateAggregation(groupRows, agg.field, agg.type)
  parentNode[`_agg_${agg.field}`] = {
    value,
    type: agg.type,
    label: formatAggregationLabel(agg.type)
  }
})
```

**Template:**
```vue
<template v-else-if="row._isGroupNode">
  <span v-if="row[`_agg_${column.field}`]" class="aggregation-value">
    <span class="agg-label">{{ row[`_agg_${column.field}`].label }}</span>
    <span class="agg-number">{{ formatNumberValue(...) }}</span>
  </span>
</template>
```

**Styling:**
- Background: Light primary color (`var(--app-primary-color-light-9)`)
- Color: Primary color
- Font Weight: Bold (600)
- Padding: Compact (2px 8px)
- Border Radius: Small rounded corners

## Calculation Logic

### Level 1: Grand Total
```typescript
// Calculate across ALL rows in primary group
const actualRows = hasSecondaryGrouping 
  ? data.filter(row => !row._isGroupNode)  // Exclude group nodes
  : data

const grandTotal = calculateAggregation(actualRows, field, type)
```

### Level 2: Sub-Total
```typescript
// Calculate only for rows in secondary group
const subTotal = calculateAggregation(groupRows, field, type)
```

### Rollup Field Handling
```typescript
function calculateAggregation(rows, field, type) {
  const column = table.columns.find(c => c.field === field)
  
  const values = rows.map(row => {
    let value = row[field]
    
    // Calculate rollup values on-the-fly if needed
    if (column?.type === 'rollup' && !value) {
      value = calculateRollupValue(column, row)
    }
    
    return parseFloat(value)
  }).filter(v => !isNaN(v))
  
  // Perform aggregation (sum, avg, min, max, count)
}
```

## User Configuration

Aggregations are configured in **View Settings**:

1. Select Primary Group By (Level 1)
2. Select Secondary Group By (Level 2)
3. In "Aggregations" section:
   - Click "Add Aggregation"
   - Choose field (number, rollup, or fx)
   - Choose type (sum, avg, min, max, count)
4. Save view

**Same configuration applies to both levels** - the system automatically:
- Shows sub-totals in Level 2 group headers
- Shows grand totals in Level 1 footer rows

## Benefits

### Level 1 Footer (Grand Total)
✅ **Quick Overview**: See total for entire primary group at a glance  
✅ **Always Visible**: Appears even without secondary grouping  
✅ **Clear Separation**: Strong border distinguishes from data rows  
✅ **Multiple Metrics**: Show multiple aggregations side-by-side

### Level 2 Headers (Sub-Totals)
✅ **Drill Down**: Understand how grand total breaks down by sub-groups  
✅ **Quick Compare**: Compare sub-totals across different statuses/categories  
✅ **Visual Badges**: Color-coded for easy identification  
✅ **Hierarchical**: See relationship between sub-totals and grand total

## Use Cases

### Sales Pipeline Analysis
- **Level 1**: Total pipeline value per salesperson
- **Level 2**: Pipeline value per status (Sent, Draft, Accepted)

**Insight**: See each salesperson's total opportunities AND how they're distributed across pipeline stages.

### Customer Revenue Tracking
- **Level 1**: Total revenue per customer
- **Level 2**: Revenue breakdown by product or time period

**Insight**: Identify high-value customers and understand what they're buying.

### Product Performance
- **Level 1**: Total sales per product
- **Level 2**: Sales breakdown by region or sales channel

**Insight**: See product popularity and geographic performance patterns.

### Team Workload
- **Level 1**: Total hours assigned per team member
- **Level 2**: Hours breakdown by project or priority

**Insight**: Understand team capacity and project distribution.

## Examples

### Example 1: Sales Pipeline with Both Levels

**Configuration:**
- Primary Group: Sales Person
- Secondary Group: Status
- Aggregation: Sum of Total Amount

**Result:**
```
Alice Chen
  ├─ Sent:      Σ $156,700.00  (3 quotations)
  ├─ Draft:     Σ $68,512.50   (2 quotations)
  ├─ Accepted:  Σ $11,812.50   (1 quotation)
  └─ Total:     Σ $236,725.00  (6 quotations)

Bob Smith
  ├─ Sent:      Σ $89,250.00   (2 quotations)
  ├─ Draft:     Σ $72,450.00   (2 quotations)
  └─ Total:     Σ $161,700.00  (4 quotations)
```

### Example 2: Multiple Aggregations

**Configuration:**
- Primary Group: Company
- Secondary Group: Status
- Aggregations:
  - Sum of Total Amount
  - Average of Total Amount
  - Count of Quotations

**Result:**
```
Acme Corp
  ├─ Sent:      Σ $500K  |  ⌀ $125K  |  # 4
  ├─ Draft:     Σ $300K  |  ⌀ $100K  |  # 3
  └─ Total:     Σ $800K  |  ⌀ $114K  |  # 7
```

## Technical Details

### Footer Method Signature
```typescript
function getGroupFooterData(
  columns: any[],      // VxeTable column definitions
  data: any[],         // Row data for this group
  group: GroupedRows   // Group metadata
): any[][]             // Returns array of footer rows
```

### Return Format
```typescript
[
  {
    [firstColumn._uniqueField]: 'Total',
    [aggregatedColumn._uniqueField]: 'Σ $236,725.00'
  }
]
```

### CSS Classes

**Footer Row:**
```scss
.vxe-footer--row {
  background: var(--app-fill-color-lighter);
  font-weight: 600;
  
  .vxe-footer--column {
    border-top: 2px solid var(--app-border-color);
    
    &:first-child {
      color: var(--app-primary-color);
      font-weight: 700;
    }
  }
}
```

**Badge (Level 2):**
```scss
.aggregation-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--app-primary-color);
  background: var(--app-primary-color-light-9);
  padding: 2px 8px;
  border-radius: var(--app-border-radius-s);
}
```

## Limitations

1. **Same Configuration**: Both levels use the same aggregation config (can't have different aggregations for Level 1 vs Level 2)
2. **Number Fields Only**: Only works with number, rollup, and fx field types
3. **Client-Side**: Calculations happen in browser (suitable for <10k records per group)
4. **Single Footer Row**: VxeTable footer shows one row (can't have multiple footer rows)

## Future Enhancements

- [ ] Different aggregations for Level 1 vs Level 2
- [ ] Multiple footer rows (e.g., both sum and average)
- [ ] Percentage of total calculations
- [ ] Conditional aggregations (e.g., sum only if status = 'Active')
- [ ] Grand total across all primary groups
- [ ] Server-side aggregation for large datasets
- [ ] Export aggregated values to Excel

---

**Feature**: Two-Level Aggregations  
**Implementation Date**: December 18, 2025  
**Status**: ✅ Complete and Ready for Testing  
**Files Modified**: 4 (TableView.vue, database.ts, ViewSettingsDrawer.vue, crm-database.json)  
**Documentation**: 4 files (this doc + 3 guides)

