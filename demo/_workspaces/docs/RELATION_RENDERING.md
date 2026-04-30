# Relation Field Rendering Implementation

## Overview
This document describes how relation fields are queried and rendered in the table view.

## Data Fetching Strategy

### Problem: N+1 Query Issue
Without proper optimization, rendering relation fields would require:
1. One query to fetch all table rows
2. One query per row per relation field to fetch the display value

For a table with 100 rows and 2 relation fields, this would result in 201 queries!

### Solution: Batch Fetching with Display Values

We solve this by:
1. Fetching all table data in one query
2. For each relation field, collecting all unique relation IDs
3. Fetching all related records in a single batch query
4. Adding display values to each row with a special key pattern

## Implementation Details

### 1. Enhanced `getTableData()` Method

Location: `demo/workspaces/composables/useTableView.ts`

```typescript
async function getTableData(): Promise<any[]> {
  // 1. Fetch main table data
  const data = await query(`SELECT * FROM "${physicalTableName.value}"`)
  
  // 2. Find all relation fields
  const relationFields = fields.value.filter(f => 
    f.businessType === 'relation' && f.relationTableId
  )
  
  // 3. For each relation field:
  for (const field of relationFields) {
    const displayField = field.displayStructure?.properties?.displayField
    const targetTable = await getTargetTable(field.relationTableId)
    
    // 4. Collect all unique relation IDs
    const relationIds = collectUniqueIds(data, field.fieldName)
    
    // 5. Batch fetch all related records
    const relatedRecords = await query(
      `SELECT id, "${displayField}" FROM "${targetTable.tableName}" 
       WHERE id = ANY($1)`,
      [Array.from(relationIds)]
    )
    
    // 6. Add display values to rows
    const displayKey = `${field.fieldName}_display`
    for (const row of data) {
      row[displayKey] = lookupDisplayValue(row[field.fieldName], relatedRecords)
    }
  }
  
  return data
}
```

### 2. Display Value Key Pattern

For a relation field named `client_id`, the data structure looks like:

```typescript
{
  id: "row-uuid",
  client_id: "client-uuid-123",           // The actual relation (UUID)
  client_id_display: "Acme Corporation",  // The display value
  // ... other fields
}
```

For multiple relations:
```typescript
{
  id: "row-uuid",
  tags: ["tag-uuid-1", "tag-uuid-2"],              // Array of UUIDs
  tags_display: ["Important", "Urgent"],           // Array of display values
  // ... other fields
}
```

### 3. Relation Renderer Component

Location: `packages/dp-mdTable/renderers/components/relation/view.ts`

The renderer reads both the relation value and its display value:

```typescript
export const RelationView = ({options, params}) => {
  const { row, column } = params
  const value = row[column.field]                    // UUID(s)
  const displayKey = `${column.field}_display`
  const displayValue = row[displayKey]               // Display text(s)
  
  // Render based on allowMultiple setting
  if (allowMultiple && Array.isArray(value)) {
    return renderMultipleTags(displayValue)
  }
  
  return renderSingleLink(displayValue)
}
```

## Rendering Modes

### Single Relation (Many-to-One)
Renders as a clickable link:
```
[Acme Corporation] → (links to related record)
```

### Multiple Relations (Many-to-Many)
Renders as tags:
```
[Important] [Urgent] [High Priority]
```

## Performance Benefits

### Before (N+1 Queries)
```
Query 1: SELECT * FROM projects                    -- 100 rows
Query 2: SELECT name FROM clients WHERE id = ?     -- row 1
Query 3: SELECT name FROM clients WHERE id = ?     -- row 2
...
Query 101: SELECT name FROM clients WHERE id = ?   -- row 100

Total: 101 queries
```

### After (Batch Fetching)
```
Query 1: SELECT * FROM projects                    -- 100 rows
Query 2: SELECT * FROM case_tables WHERE id = ?    -- 1 query for table info
Query 3: SELECT id, name FROM clients 
         WHERE id = ANY($1)                        -- 1 batch query for all clients

Total: 3 queries (97% reduction!)
```

## Data Flow

```
1. User opens table
   ↓
2. getTableData() called
   ↓
3. Fetch main table rows
   ↓
4. Identify relation fields
   ↓
5. For each relation field:
   a. Collect unique IDs
   b. Batch fetch related records
   c. Map display values
   ↓
6. Render table with display values
```

## Configuration

### In Column Properties
```typescript
{
  type: ColumnFieldType.MagicLink,  // Type 14
  properties: {
    relationTableId: "target-table-uuid",
    displayField: "name",            // Which field to display
    allowMultiple: false             // Single or multiple relations
  }
}
```

### In Database Schema
```sql
-- case_fields table
{
  businessType: 'relation',
  relationTableId: 'uuid',           -- Which table to link to
  displayStructure: {
    type: 14,
    properties: {
      displayField: 'name',          -- Which field to show
      allowMultiple: false           -- Single or multiple
    }
  }
}
```

## Future Enhancements

1. **Caching**: Cache related records to avoid re-fetching
2. **Lazy Loading**: Load display values only for visible rows
3. **Deep Relations**: Support nested relations (e.g., project → client → country)
4. **Custom Renderers**: Allow custom display templates
5. **Search**: Enable searching by related field values
6. **Sorting**: Support sorting by related field values

## Files Modified

1. `demo/workspaces/composables/useTableView.ts`
   - Enhanced `getTableData()` with batch fetching logic

2. `packages/dp-mdTable/renderers/components/relation/view.ts` (NEW)
   - Created RelationView and RelationEdit components

3. `packages/dp-mdTable/renderers/render-components.ts`
   - Updated MagicLink renderer to use new components

## Testing Checklist

- [ ] Single relation displays correctly
- [ ] Multiple relations display as tags
- [ ] Empty relations show "-"
- [ ] Display values update when related records change
- [ ] Performance is acceptable with 100+ rows
- [ ] Works with different display field types (text, number, etc.)
- [ ] Edit mode shows current selection
