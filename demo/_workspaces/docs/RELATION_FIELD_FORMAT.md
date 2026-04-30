# Relation Field Format Changes

## Overview
Updated relation field storage to align with backend schema where `displayFieldIds` is an array, and view fields use dot notation to specify which display field to show.

## Key Changes

### 1. Database Schema Alignment

#### Before:
```typescript
// displayStructure stored single displayField
displayStructure: {
  type: 14,
  properties: {
    relationTableId: "uuid",
    displayField: "name"  // Single field
  }
}

// displayFieldIds was empty
displayFieldIds: []
```

#### After:
```typescript
// displayStructure only stores relation config
displayStructure: {
  type: 14,
  properties: {
    relationTableId: "uuid",
    allowMultiple: true/false
  }
}

// displayFieldIds stores array of available display fields
displayFieldIds: ["name", "email", "phone"]
```

### 2. View Field Format

#### Before:
```typescript
// View fields array
fields: ["id", "name", "rel_client"]

// Only one way to display the relation
```

#### After:
```typescript
// View fields array with dot notation
fields: ["id", "name", "rel_client.name", "rel_client.email"]

// Multiple display fields from same relation
// Format: {relationFieldName}.{displayFieldName}
```

### 3. Separator Choice

**Why dot (`.`) instead of underscore (`_`)?**
- Database column names CAN contain underscores
- Database column names CANNOT contain dots
- This prevents conflicts and ambiguity

Example conflict with underscore:
```typescript
// Ambiguous: Is this a relation or a regular field?
"rel_client_name"  // Could be: rel_client.name OR a field named rel_client_name

// Clear with dot:
"rel_client.name"  // Definitely: relation field "rel_client" showing "name"
```

## Implementation Details

### createRelationFromColumn

```typescript
async function createRelationFromColumn(
  sourceFieldName: string,
  targetTableId: string,
  targetFieldId: string,
  relationColumnName: string,
  allowMultiple: boolean = false
): Promise<void> {
  // ... validation ...
  
  // Check if relation to target table already exists
  const existingRelations = await query<CaseFieldRecord>(
    `SELECT * FROM case_fields 
     WHERE "tableId" = $1 
     AND "businessType" = 'relation' 
     AND "relationTableId" = $2`,
    [tableId.value, targetTableId]
  )
  
  if (existingRelations.length > 0) {
    throw new Error(`A relation to table "${targetTable.name}" already exists.`)
  }
  
  // Store display field in displayFieldIds array
  const displayFieldIds = [targetField.fieldName]
  
  // Insert into case_fields
  await query(`INSERT INTO case_fields (...) VALUES (...)`, [
    // ...
    displayFieldIds,  // Array instead of empty
    // ...
  ])
  
  // Add to view with dot notation
  const viewFieldName = `${relationFieldName}.${targetField.fieldName}`
  currentFields.splice(sourceFieldIndex + 1, 0, viewFieldName)
}
```

### createReverseRelationToOtherTable

```typescript
async function createReverseRelationToOtherTable(
  sourceFieldName: string,
  targetTableId: string,
  targetFieldId: string,
  relationColumnName: string,
  allowMultiple: boolean = false
): Promise<void> {
  // ... validation ...
  
  // Check if target table already has relation back to current table
  const existingRelations = await query<CaseFieldRecord>(
    `SELECT * FROM case_fields 
     WHERE "tableId" = $1 
     AND "businessType" = 'relation' 
     AND "relationTableId" = $2`,
    [targetTableId, tableId.value]
  )
  
  if (existingRelations.length > 0) {
    throw new Error(`Table "${targetTable.name}" already has a relation to "${currentTableName}".`)
  }
  
  // Store display field in displayFieldIds array
  const displayFieldIds = [sourceFieldName]
  
  // Insert into target table's case_fields
  await query(`INSERT INTO case_fields (...) VALUES (...)`, [
    // ...
    displayFieldIds,  // Array instead of empty
    // ...
  ])
  
  // Add to target table's view with dot notation
  const viewFieldName = `${relationFieldName}.${sourceFieldName}`
  fields.add(viewFieldName)
}
```

## Validation Added

### Duplicate Relation Check

Both methods now check if a relation between the two tables already exists:

**createRelationFromColumn:**
- Checks if current table already has a relation to target table
- Prevents: `Projects → Clients` when `Projects → Clients` already exists

**createReverseRelationToOtherTable:**
- Checks if target table already has a relation back to current table
- Prevents: Adding `Clients → Projects` when `Clients → Projects` already exists

### Error Messages

Clear, actionable error messages:
```
"A relation to table 'Clients' already exists. Please use the existing relation field or delete it first."

"Table 'Clients' already has a relation to 'Projects'. Please use the existing relation field or delete it first."
```

## Benefits

### 1. Multiple Display Fields
```typescript
// Same relation, different views
fields: [
  "rel_client.name",      // Show client name
  "rel_client.email",     // Show client email
  "rel_client.company"    // Show client company
]
```

### 2. Backend Compatibility
- Aligns with backend's `displayFieldIds` array schema
- No schema migration needed
- Frontend and backend use same data structure

### 3. Flexibility
- Add/remove display fields without affecting base relation
- Users control which fields appear in each view
- Same relation can show different data in different views

### 4. Performance
- Only fetch display fields that are actually shown
- Avoid fetching unused display data
- Optimize queries based on view configuration

### 5. Data Integrity
- Prevents duplicate relations between same tables
- Clear error messages guide users
- Validates before creating database objects

## Next Steps

### Phase 2: Column Management (Not Yet Implemented)

1. **Parse View Fields**: Split `rel_client.name` into `relationField` + `displayField`
2. **Fetch Display Data**: Use parsed info to fetch correct display values
3. **Column Editor**: Allow users to add/remove display fields from existing relations
4. **Column Renderer**: Show correct display value based on view field format

### Example Flow:
```typescript
// View field: "rel_client.name"
const [relationField, displayField] = viewField.split('.')
// relationField = "rel_client"
// displayField = "name"

// Find relation field in case_fields
const field = fields.find(f => f.fieldName === relationField)

// Fetch display data
const displayValue = await fetchRelationDisplay(
  row[relationField],      // UUID or UUID[]
  field.relationTableId,   // Target table
  displayField             // Which field to show
)
```

## Migration Notes

### Existing Relations
- Old relations may have `displayField` in `displayStructure.properties`
- Old relations may have empty `displayFieldIds` array
- Need backward compatibility handling

### Recommended Migration:
1. Read `displayStructure.properties.displayField` if exists
2. Move to `displayFieldIds` array
3. Update view fields to use dot notation
4. Remove `displayField` from `displayStructure.properties`

## Testing Checklist

- [x] Create relation stores `displayFieldIds` array
- [x] View field uses dot notation format
- [x] Duplicate relation check works (same table)
- [x] Reverse relation stores `displayFieldIds` array
- [x] Reverse relation view field uses dot notation
- [x] Duplicate reverse relation check works
- [x] Parse view field format in getAllColumns
- [x] Fetch display data based on parsed field
- [x] Render correct display value
- [x] Handle backward compatibility
