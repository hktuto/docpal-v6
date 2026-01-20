# Relation Suggestions Cleanup on Delete

## Overview

This document explains how `relation_suggestions` are cleaned up when workspaces or tables are deleted.

## Database Schema CASCADE Rules

The `relation_suggestions` table has **automatic CASCADE deletion** configured for all foreign keys:

```typescript
export const relationSuggestion = pgTable('relation_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceTableId: uuid('sourceTableId').notNull()
    .references(() => caseTable.id, { onDelete: 'cascade' }),
  sourceFieldId: uuid('sourceFieldId').notNull()
    .references(() => caseField.id, { onDelete: 'cascade' }),
  targetTableId: uuid('targetTableId').notNull()
    .references(() => caseTable.id, { onDelete: 'cascade' }),
  targetFieldId: uuid('targetFieldId').notNull()
    .references(() => caseField.id, { onDelete: 'cascade' }),
  // ... other fields
})
```

### What CASCADE Does

When a referenced record is deleted, PostgreSQL automatically deletes all `relation_suggestions` that reference it:

- **Delete a table** → All suggestions with that table as source or target are deleted
- **Delete a field** → All suggestions with that field are deleted

## Explicit Cleanup (Defense in Depth)

While CASCADE handles cleanup automatically, we've added **explicit cleanup** for clarity and maintainability:

### 1. Delete Workspace (`useWorkspace.ts`)

```typescript
async function deleteWorkspace(id: string): Promise<void> {
  // ... drop physical tables ...
  
  // Explicit cleanup of relation suggestions
  await query(
    `DELETE FROM relation_suggestions WHERE "sourceTableId" IN (
      SELECT id FROM case_tables WHERE "entityId" = $1
    )`,
    [id]
  )
  
  // ... delete fields, tables, etc ...
}
```

**What it does:**
- Finds all tables in the workspace
- Deletes all suggestions where those tables are the source
- CASCADE will handle suggestions where they are the target

### 2. Delete Table (`useSingleWorkspace.ts`)

```typescript
async function deleteItem(id: string) {
  if (item.itemType === 'table' && item.itemId) {
    // ... drop physical table ...
    
    // Explicit cleanup of relation suggestions
    await query(
      `DELETE FROM relation_suggestions 
       WHERE "sourceTableId" = $1 OR "targetTableId" = $1`,
      [item.itemId]
    )
    
    // ... delete fields, views, table record ...
  }
}
```

**What it does:**
- Deletes all suggestions where the table is either source OR target
- Ensures complete cleanup before deleting the table record

## Why Both CASCADE and Explicit Cleanup?

### CASCADE (Database Level)
✅ **Automatic** - No code needed  
✅ **Guaranteed** - Database enforces it  
✅ **Transactional** - Atomic with parent delete  

### Explicit Cleanup (Application Level)
✅ **Clear Intent** - Code documents what happens  
✅ **Maintainable** - Easy to understand deletion flow  
✅ **Debuggable** - Can add logging if needed  
✅ **Safe** - Works even if CASCADE fails  

## Deletion Flow

### Delete Workspace Flow

```
1. Drop physical tables (DROP TABLE ... CASCADE)
2. Delete case_tree records
3. Delete case_views records
4. Delete relation_suggestions (explicit)
5. Delete case_fields (triggers CASCADE)
6. Delete case_tables (triggers CASCADE)
7. Delete case_type (workspace)
```

### Delete Table Flow

```
1. Drop physical table (DROP TABLE ... CASCADE)
2. Delete relation_suggestions (explicit)
3. Delete case_fields (triggers CASCADE)
4. Delete case_views
5. Delete case_tables (triggers CASCADE)
6. Delete case_tree record
```

## Testing Checklist

### Test Delete Workspace
- [ ] Create workspace with multiple tables
- [ ] Import tables and generate suggestions
- [ ] Verify suggestions exist in `relation_suggestions`
- [ ] Delete workspace
- [ ] Verify all suggestions are deleted
- [ ] Check no orphaned records

### Test Delete Table
- [ ] Create table with suggestions
- [ ] Verify suggestions exist (as source and target)
- [ ] Delete table
- [ ] Verify all related suggestions are deleted
- [ ] Verify suggestions for other tables remain

### Test Delete Field
- [ ] Create field with suggestions
- [ ] Delete field
- [ ] Verify CASCADE deletes related suggestions
- [ ] Verify other suggestions remain

## SQL Queries for Verification

### Check Orphaned Suggestions (Should return 0)

```sql
-- Check for suggestions with deleted source tables
SELECT COUNT(*) FROM relation_suggestions rs
WHERE NOT EXISTS (
  SELECT 1 FROM case_tables ct WHERE ct.id = rs."sourceTableId"
);

-- Check for suggestions with deleted target tables
SELECT COUNT(*) FROM relation_suggestions rs
WHERE NOT EXISTS (
  SELECT 1 FROM case_tables ct WHERE ct.id = rs."targetTableId"
);

-- Check for suggestions with deleted fields
SELECT COUNT(*) FROM relation_suggestions rs
WHERE NOT EXISTS (
  SELECT 1 FROM case_fields cf WHERE cf.id = rs."sourceFieldId"
)
OR NOT EXISTS (
  SELECT 1 FROM case_fields cf WHERE cf.id = rs."targetFieldId"
);
```

### Count Suggestions by Table

```sql
SELECT 
  ct.name as table_name,
  COUNT(*) as suggestion_count
FROM relation_suggestions rs
JOIN case_tables ct ON rs."sourceTableId" = ct.id
GROUP BY ct.name
ORDER BY suggestion_count DESC;
```

## Common Issues

### Issue: Suggestions not deleted after workspace deletion
**Cause:** CASCADE not working or explicit cleanup failed  
**Solution:** Check database foreign key constraints, verify CASCADE is enabled  
**Debug:** Run orphaned suggestions query above  

### Issue: Suggestions remain after table deletion
**Cause:** Table record not actually deleted (error in deletion flow)  
**Solution:** Check for errors in console, verify table deletion completed  
**Debug:** Check if table still exists in `case_tables`  

### Issue: Performance issues when deleting large workspaces
**Cause:** Many suggestions to delete  
**Solution:** CASCADE is optimized by database, should be fast  
**Optimization:** Consider batch deletion or background cleanup if needed  

## Related Files

- `/demo/workspaces/composables/useWorkspace.ts` - Workspace deletion
- `/demo/workspaces/composables/useSingleWorkspace.ts` - Table deletion
- `/demo/workspaces/utils/db/schema/newTableSchema.ts` - Schema with CASCADE rules
- `/demo/workspaces/composables/useRelationSuggestions.ts` - Suggestion creation

## Future Considerations

### Soft Delete
If implementing soft delete (status = 'deleted'):
- Keep CASCADE rules
- Add WHERE clause to exclude deleted records
- Periodic cleanup job to remove old deleted records

### Audit Trail
If implementing audit trail:
- Keep CASCADE rules
- Add trigger to log deletions to audit table
- Audit table should NOT have CASCADE (preserve history)

### Undo Delete
If implementing undo:
- Change to soft delete first
- Keep suggestions for X days
- Hard delete after grace period
