# Multiple Relations Support

## Overview
Both "Create Relation" and "Create Relation to Other Table" features now support an **Allow Multiple** option, enabling one-to-many relationships where a single row can link to multiple records.

## Feature: Allow Multiple Toggle

### UI Component
Both dialogs now include a switch control:
- **Label**: "Relation Type"
- **Active State**: "Allow Multiple (One-to-Many)"
- **Inactive State**: "Single (Many-to-One)"
- **Default**: `false` (single relation)

### User Experience

#### Single Relation (Default)
- Each row links to **one** record
- If multiple matches exist, only the **first** is stored
- Database column type: `uuid`
- Display: Single clickable link

#### Multiple Relations
- Each row links to **multiple** records
- All matching records are stored
- Database column type: `uuid[]` (array)
- Display: Multiple tags (one per related record)

## Implementation Details

### 1. Dialog Changes

#### CreateRelationDialog.vue
```vue
<el-form-item label="Relation Type">
  <el-switch
    v-model="formData.allowMultiple"
    active-text="Allow Multiple (One-to-Many)"
    inactive-text="Single (Many-to-One)"
  />
  <div class="field-hint">
    {{ formData.allowMultiple 
      ? 'Each row can link to multiple records in the target table' 
      : 'Each row can link to only one record in the target table' 
    }}
  </div>
</el-form-item>
```

**Emits**: `{ targetTableId, targetFieldId, relationColumnName, allowMultiple }`

#### CreateReverseRelationDialog.vue
Same UI component, but with different hint text:
```
allowMultiple = true: 
  'Each row in the target table can link to multiple records in this table'
allowMultiple = false: 
  'Each row in the target table can link to only one record in this table'
```

### 2. Database Schema Changes

#### Field Definition
```typescript
{
  fieldType: allowMultiple ? 'uuid[]' : 'uuid',
  isArray: allowMultiple,
  displayStructure: {
    type: 14,
    properties: {
      relationTableId: '...',
      displayField: '...',
      allowMultiple: true/false  // NEW!
    }
  }
}
```

#### Physical Table Column
```sql
-- Single relation
ALTER TABLE "table_name" ADD COLUMN "field_name" uuid

-- Multiple relations
ALTER TABLE "table_name" ADD COLUMN "field_name" uuid[]
```

### 3. Data Population Logic

#### Single Relation (allowMultiple = false)
```typescript
// Build lookup: value -> single ID
const valueLookup = new Map<string, string>()
for (const row of targetRows) {
  valueLookup.set(String(row[field]), row.id)
}

// Update with single ID
UPDATE table SET column = $1 WHERE id = $2
// $1 = single UUID string
```

#### Multiple Relations (allowMultiple = true)
```typescript
// Build lookup: value -> array of IDs
const valueLookup = new Map<string, string[]>()
for (const row of targetRows) {
  const value = String(row[field])
  if (!valueLookup.has(value)) {
    valueLookup.set(value, [])
  }
  valueLookup.get(value)!.push(row.id)
}

// Update with array of IDs
UPDATE table SET column = $1 WHERE id = $2
// $1 = array of UUID strings
```

### 4. Method Signatures

#### createRelationFromColumn
```typescript
async function createRelationFromColumn(
  sourceFieldName: string,
  targetTableId: string,
  targetFieldId: string,
  relationColumnName: string,
  allowMultiple: boolean = false  // NEW parameter
): Promise<void>
```

#### createReverseRelationToOtherTable
```typescript
async function createReverseRelationToOtherTable(
  sourceFieldName: string,
  targetTableId: string,
  targetFieldId: string,
  relationColumnName: string,
  allowMultiple: boolean = false  // NEW parameter
): Promise<void>
```

## Use Cases

### Example 1: Single Relation (Many-to-One)
**Scenario**: Projects → Clients

```
Projects Table:
- Project A, client_name: "Acme Corp" → links to Client #1
- Project B, client_name: "Tech Inc" → links to Client #2
- Project C, client_name: "Acme Corp" → links to Client #1

Result: Each project links to ONE client
```

### Example 2: Multiple Relations (One-to-Many)
**Scenario**: Projects → Tags

```
Projects Table:
- Project A, tags_text: "urgent" → links to [Tag #1, Tag #3]
- Project B, tags_text: "important" → links to [Tag #2]
- Project C, tags_text: "urgent" → links to [Tag #1, Tag #3]

Result: Each project can link to MULTIPLE tags
```

### Example 3: Reverse Multiple Relations
**Scenario**: Sales Persons → Companies (reverse)

```
Sales Persons Table:
- John, company: "Acme Corp"
- Jane, company: "Acme Corp"
- Bob, company: "Tech Inc"

Companies Table (after reverse relation with allowMultiple=true):
- Acme Corp → links to [John, Jane]
- Tech Inc → links to [Bob]

Result: Each company links to MULTIPLE sales persons
```

## Rendering

The relation renderer (`RelationView`) automatically detects `allowMultiple`:

### Single Relation
```typescript
// Renders as clickable link
<a href="#">Acme Corporation</a>
```

### Multiple Relations
```typescript
// Renders as tags
<div class="relation-view multiple">
  <ElTag>Important</ElTag>
  <ElTag>Urgent</ElTag>
  <ElTag>High Priority</ElTag>
</div>
```

## Data Flow Comparison

### Single Relation Flow
```
1. User toggles OFF "Allow Multiple"
   ↓
2. System creates uuid column
   ↓
3. For each row:
   - Find first matching record
   - Store single UUID
   ↓
4. Display as single link
```

### Multiple Relations Flow
```
1. User toggles ON "Allow Multiple"
   ↓
2. System creates uuid[] column
   ↓
3. For each row:
   - Find ALL matching records
   - Store array of UUIDs
   ↓
4. Display as multiple tags
```

## Benefits

1. **Flexibility**: Users can choose the appropriate relationship type
2. **Data Integrity**: No data loss when multiple matches exist
3. **Better Modeling**: Accurately represents real-world relationships
4. **Consistent UX**: Same interface for both relation types

## Migration Notes

### Existing Relations
- All existing relations created before this feature are **single relations**
- They will continue to work as before
- To convert to multiple, user must:
  1. Delete the old relation column
  2. Create a new one with "Allow Multiple" enabled

### Database Compatibility
- PostgreSQL natively supports array types (`uuid[]`)
- PGlite (used in demo) also supports array types
- Queries use PostgreSQL array syntax

## Testing Checklist

- [ ] Single relation creates `uuid` column
- [ ] Multiple relation creates `uuid[]` column
- [ ] Single relation stores first match only
- [ ] Multiple relation stores all matches
- [ ] Single relation displays as link
- [ ] Multiple relation displays as tags
- [ ] Switch defaults to OFF (single)
- [ ] Both dialog types have the switch
- [ ] Reverse relations support multiple
- [ ] Display values fetch correctly for both types

## Future Enhancements

1. **Conversion Tool**: Convert existing single relations to multiple
2. **Max Limit**: Option to limit number of relations (e.g., max 5)
3. **Sorting**: Control order of multiple relations
4. **Filtering**: Filter by related records in table view
5. **Aggregation**: Show count of relations (e.g., "3 tags")
