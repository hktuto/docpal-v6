# Edit Column Enhancements

## Overview

Enhanced the `updateField` function in `useTableView.ts` to handle two critical scenarios:
1. Data type changes with automatic conversion or data clearing
2. Relation field display field updates with automatic view synchronization

## Changes Made

### 1. Data Type Change Handling

When a column's `businessType` or `fieldType` changes, the system now:

#### Conversion Strategy

**Step 1: Detect Type Change**
```typescript
const isBusinessTypeChange = updates.businessType && updates.businessType !== field.businessType
const isFieldTypeChange = updates.fieldType && updates.fieldType !== field.fieldType
```

**Step 2: Attempt Conversion**
- **To Text/String**: Always attempts to convert existing data using `::text` cast
- **To Other Types**: Attempts direct conversion using PostgreSQL casting
- **Fallback**: If conversion fails, clears all data and changes column type

#### Special Cases

**Relation Type Changes**
- Changing from/to `businessType: 'relation'` always clears data
- Cannot preserve UUIDs when converting to/from relation
- Automatically updates column type in physical table

**Conversion Examples**

```typescript
// Number to Text - Success
// Before: column contains [1, 2, 3]
// After: column contains ["1", "2", "3"]

// Text to Number - May Fail
// Before: column contains ["abc", "123"]
// After: Data cleared, column type changed to number

// Any to Relation - Always Clears
// Before: column contains any data
// After: column is NULL, type is uuid or uuid[]
```

### 2. Relation Display Field Updates

When `displayFieldIds` is updated for a relation field:

#### Automatic View Synchronization

**Detection**
```typescript
if (field.businessType === 'relation' && updates.displayFieldIds) {
  await handleRelationDisplayFieldUpdate(field, updates.displayFieldIds)
}
```

**Process**
1. Compare old and new `displayFieldIds` arrays
2. Identify newly added display field IDs
3. Query target table to get field names for new IDs
4. Add new view fields using dot notation: `relationFieldName.displayFieldName`
5. Update the current view in database and local state

**Example**

```typescript
// Initial State
field.displayFieldIds = ["uuid-name"]
view.fields = ["id", "rel_company.name"]

// User Updates
updates.displayFieldIds = ["uuid-name", "uuid-address", "uuid-email"]

// Result
view.fields = [
  "id", 
  "rel_company.name",      // Existing
  "rel_company.address",   // Added
  "rel_company.email"      // Added
]
```

## Implementation Details

### New Helper Functions

#### `handleDataTypeConversion()`

**Purpose**: Manage data type changes with intelligent conversion or clearing

**Parameters**:
- `fieldName`: Name of the field being updated
- `oldType`: Current PostgreSQL data type
- `newType`: Target PostgreSQL data type
- `oldBusinessType`: Current business type (e.g., 'relation', 'text')
- `newBusinessType`: Target business type

**Returns**: `boolean` - `true` if successful, `false` if failed

**Logic Flow**:
```
1. Check if relation type change
   ├─ Yes: Clear data, ALTER TABLE type
   └─ No: Continue

2. Check if converting to text
   ├─ Yes: Try USING ::text cast
   │   ├─ Success: Done
   │   └─ Fail: Clear data, ALTER TABLE
   └─ No: Continue

3. Try direct type conversion
   ├─ Success: Done
   └─ Fail: Clear data, ALTER TABLE
```

#### `handleRelationDisplayFieldUpdate()`

**Purpose**: Synchronize view fields when relation display fields change

**Parameters**:
- `field`: The relation field being updated
- `newDisplayFieldIds`: Array of new display field IDs

**Process**:
1. Calculate diff: `addedFieldIds = new - old`
2. Query target table fields by IDs
3. Generate view field names: `${relationFieldName}.${displayFieldName}`
4. Update view in database
5. Update local state

## Usage Examples

### Example 1: Change Column Type

```typescript
// User changes "age" column from number to text
await tableView.updateField('age', {
  fieldType: 'text'
})

// System automatically:
// 1. Detects type change
// 2. Converts: 25 → "25", 30 → "30"
// 3. Updates column type in database
```

### Example 2: Change to Relation

```typescript
// User changes "company_name" from text to relation
await tableView.updateField('company_name', {
  businessType: 'relation',
  fieldType: 'uuid',
  relationTableId: 'company-table-uuid',
  displayFieldIds: ['company-name-field-uuid']
})

// System automatically:
// 1. Clears all existing data
// 2. Changes column type to uuid
// 3. User must manually populate relation data
```

### Example 3: Add Display Field to Relation

```typescript
// User adds "address" display field to existing relation
const field = tableView.getField('rel_company')
await tableView.updateField('rel_company', {
  displayFieldIds: [
    ...field.displayFieldIds,
    'company-address-field-uuid'
  ]
})

// System automatically:
// 1. Detects new display field
// 2. Adds "rel_company.address" to current view
// 3. Next data fetch will include address values
```

## Error Handling

### Type Conversion Failures

When conversion fails:
1. Data is cleared (`UPDATE ... SET column = NULL`)
2. Column type is changed
3. Operation continues (no error thrown)
4. User can re-populate data manually

### Relation Update Failures

If view update fails:
- Error is logged but not thrown
- Field metadata is still updated
- User can manually add view fields later

## Database Operations

### ALTER TABLE Commands

```sql
-- Convert to text (with data preservation)
ALTER TABLE "table_name" 
ALTER COLUMN "field_name" TYPE text 
USING "field_name"::text

-- Convert to number (may fail)
ALTER TABLE "table_name" 
ALTER COLUMN "field_name" TYPE integer 
USING "field_name"::integer

-- Change type after clearing data
ALTER TABLE "table_name" 
ALTER COLUMN "field_name" TYPE uuid
```

### View Updates

```sql
-- Add new display fields to view
UPDATE case_views 
SET fields = $1, "updatedAt" = $2 
WHERE id = $3
```

## Testing Checklist

- [ ] Change text column to number (with valid numbers)
- [ ] Change text column to number (with invalid data - should clear)
- [ ] Change number column to text (should preserve as strings)
- [ ] Change regular column to relation (should clear data)
- [ ] Change relation to regular column (should clear data)
- [ ] Add display field to existing relation
- [ ] Add multiple display fields at once
- [ ] Remove display field (should not affect view - manual removal needed)
- [ ] Update relation with same display fields (no-op)

## Future Enhancements

1. **User Confirmation**: Prompt user before clearing data
2. **Data Preview**: Show sample conversions before applying
3. **Rollback Support**: Allow undo of type changes
4. **Batch Conversion**: Handle multiple column updates efficiently
5. **Display Field Removal**: Automatically remove view fields when display fields are removed

## Notes

- Type conversions use PostgreSQL's casting system
- Some conversions may lose precision (e.g., float to integer)
- Relation data must be valid UUIDs from the target table
- View field order is preserved when adding new fields
- Display field removal from `displayFieldIds` does NOT remove view fields (manual cleanup needed)
