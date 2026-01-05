# Aggregation Implementation Summary

## What Was Added

Added support for **aggregations in 2-level grouped tables**, allowing users to see calculated totals, averages, and other statistics for number fields directly in the group headers.

## Changes Made

### 1. Type Definitions (`types/database.ts`)

Added `aggregations` field to the `ViewConfig.groupBy` configuration:

```typescript
groupBy?: {
  field: string
  secondaryField?: string
  collapsed?: string[]
  showEmptyGroups?: boolean
  aggregations?: {               // NEW
    field: string                // Which field to aggregate
    type: 'sum' | 'avg' | 'min' | 'max' | 'count'
  }[]
}
```

### 2. Table View Component (`views/TableView.vue`)

#### New Functions:
- **`calculateAggregation(rows, field, type)`**: Calculates sum, avg, min, max, or count for a group of rows
  - Enhanced to handle rollup fields by calling `calculateRollupValue()` when needed
- **`formatAggregationLabel(type)`**: Returns symbol for aggregation type (Σ, ⌀, Min, Max, #)
- **`getGroupFooterData(columns, data, group)`**: Generates footer row data for Level 1 aggregations
  - Filters out group nodes if secondary grouping is enabled
  - Calculates aggregations for the entire primary group
  - Returns formatted footer row with "Total" label and aggregated values

#### Updated Functions:
- **`transformRowsForTreeGrouping()`**: Enhanced to calculate and store aggregations in group nodes
  - Stores aggregated values in `row[field]` for the actual value
  - Stores metadata in `row[_agg_${field}]` with value, type, and label

#### Template Updates:
- **Level 2 (Secondary Groups)**: Added conditional rendering for aggregation values in group node cells
  - Displays aggregations with styled badges showing symbol and formatted value
  - Uses existing `formatNumberValue()` to respect column formatting (currency, decimals, etc.)
- **Level 1 (Primary Groups)**: Added footer row to each group's vxe-grid
  - Enabled with `:show-footer` prop
  - Calculates totals using `:footer-method` binding
  - Shows "Total" label in first column with aggregations in configured columns

### 3. View Settings Drawer (`ViewSettingsDrawer.vue`)

#### New State:
- **`localTableAggregations`**: Array of aggregation configurations

#### New Computed:
- **`numberColumns`**: Filters columns to show only number, rollup, and fx types

#### New Functions:
- **`addAggregation()`**: Adds a new aggregation configuration
- **`removeAggregation(index)`**: Removes an aggregation

#### UI Additions:
- **Aggregations Section**: Only visible when secondary grouping is enabled
- **Aggregation Rows**: Each row has:
  - Field selector (dropdown of number columns)
  - Type selector (sum, avg, min, max, count)
  - Delete button
- **Add Aggregation Button**: Adds new aggregation row

### 4. Demo Data (`crm-database.json`)

Updated "High Value Deals" view to include aggregation example:

```json
"groupBy": {
  "field": "salesPerson",
  "secondaryField": "status",
  "aggregations": [
    { "field": "totalAmount", "type": "sum" }
  ]
}
```

### 5. Styling

Added CSS for aggregation badges:

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

## How It Works

### Data Flow

1. **User Configuration**: User selects fields and aggregation types in View Settings
2. **Data Transformation**: When rendering grouped data, `transformRowsForTreeGrouping()`:
   - Groups rows by secondary field
   - For each group, calculates aggregations for configured fields
   - Stores results in group node with `_agg_` prefix
3. **Rendering**: Template checks for `_agg_` properties and displays formatted badges
4. **Formatting**: Uses existing `formatNumberValue()` to respect column display settings

### Example Calculation

For a group with 3 quotations totaling $156,700:

```javascript
// Input
rows = [
  { totalAmount: 126000 },
  { totalAmount: 10500 },
  { totalAmount: 48510 }
]

// Calculation
sum = 126000 + 10500 + 48510 = 185010

// Storage in group node
groupNode = {
  _isGroupNode: true,
  _groupLabel: "Sent",
  _groupCount: 3,
  totalAmount: 185010,           // Actual value
  _agg_totalAmount: {            // Metadata
    value: 185010,
    type: 'sum',
    label: 'Σ'
  }
}

// Display
"Σ $185,010.00"  // Formatted with column's currency settings
```

## Testing

### To Test:
1. Navigate to: `CRM Database > Quotations > High Value Deals`
2. The view is pre-configured with:
   - Primary Group: Sales Person
   - Secondary Group: Status
   - Aggregation: Sum of Total Amount
3. You should see sum totals in each status group header

### To Configure New Aggregations:
1. Open any table view
2. Click View Settings (gear icon)
3. Set Primary Group By (Level 1)
4. Set Secondary Group By (Level 2)
5. Scroll to "Aggregations" section
6. Click "Add Aggregation"
7. Select field and aggregation type
8. Save view

## Supported Aggregation Types

| Type | Symbol | Description | Example Use |
|------|--------|-------------|-------------|
| sum | Σ | Total of all values | Total revenue, total quantity |
| avg | ⌀ | Average of values | Average deal size, avg rating |
| min | Min | Minimum value | Lowest price, earliest date |
| max | Max | Maximum value | Highest price, latest date |
| count | # | Count of records | Number of items in group |

## Supported Field Types

- ✅ **number**: Regular number fields
- ✅ **rollup**: Aggregated values from related records
- ✅ **fx**: Formula/calculated fields

## Limitations

1. **Secondary Level Only**: Aggregations only show in Level 2 groups (within tables), not Level 1 (separate table sections)
2. **Number Fields Only**: Only works with number, rollup, and fx field types
3. **Client-Side**: Calculations happen in browser (fine for <10k records)
4. **No Nested Aggregations**: Can't aggregate aggregations

## Future Enhancements

- [ ] Level 1 aggregations (totals across all groups)
- [ ] Grand totals row at bottom of each table
- [ ] Percentage calculations (% of total)
- [ ] Conditional aggregations (e.g., sum only if status = 'Active')
- [ ] Custom aggregation formulas
- [ ] Server-side aggregation for large datasets
- [ ] Export aggregated values

## Files Modified

1. `/demo/database/types/database.ts` - Type definitions
2. `/demo/database/components/database/views/TableView.vue` - Calculation and rendering
3. `/demo/database/components/database/ViewSettingsDrawer.vue` - UI configuration
4. `/demo/database/data/crm-database.json` - Demo data with example

## Files Created

1. `/demo/database/GROUP_AGGREGATIONS.md` - User documentation
2. `/demo/database/AGGREGATION_IMPLEMENTATION.md` - This file

---

**Implementation Date**: December 18, 2025  
**Status**: ✅ Complete and Ready for Testing  
**Linter Errors**: None

