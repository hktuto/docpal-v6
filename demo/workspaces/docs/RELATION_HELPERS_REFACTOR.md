# Relation Helpers Refactoring

## Overview

Moved table and field loading logic from individual components to `useTableView.ts` composable and provided them through `ColumnContext`. This makes the code more maintainable and easier to switch from database queries to API calls in the future.

## Changes Made

### 1. Added Helper Functions to `useTableView.ts` ✅

#### `getAvailableTablesForRelation(excludeCurrentTable?: boolean)`

**Purpose**: Get all tables from the same entity for relation selection

**Parameters**:
- `excludeCurrentTable` (optional): If `true`, excludes the current table from results

**Returns**: `Promise<CaseTableRecord[]>`

**Features**:
- Filters by `entityId` (same workspace only)
- Uses `DISTINCT ON (name, "tableName")` to avoid duplicates
- Orders by `createdAt DESC` to show most recent
- Optionally excludes current table

**SQL**:
```sql
SELECT DISTINCT ON (name, "tableName") * 
FROM case_tables 
WHERE status = 'A' AND "entityId" = $1 [AND id != $2]
ORDER BY name, "tableName", "createdAt" DESC
```

#### `getFieldsForTable(targetTableId: string)`

**Purpose**: Get all fields for a specific table

**Parameters**:
- `targetTableId`: The table ID to get fields for

**Returns**: `Promise<CaseFieldRecord[]>`

**SQL**:
```sql
SELECT * FROM case_fields 
WHERE "tableId" = $1 
ORDER BY "fieldNameAlias"
```

### 2. Updated `ColumnContext` Interface ✅

**File**: `/packages/dp-mdTable/composables/useColumns.ts`

**Added Properties**:
```typescript
export interface ColumnContext {
  // ... existing properties ...
  
  // Relation helpers
  getAvailableTablesForRelation?: (excludeCurrentTable?: boolean) => Promise<any[]>
  getFieldsForTable?: (tableId: string) => Promise<any[]>
  tableId?: Ref<string>
  entityId?: Ref<string>
}
```

### 3. Updated Components to Use Context ✅

#### A. `Relation.vue` (Edit Form)

**Before**:
```typescript
const { query } = usePglite()
const currentTableId = ref<string>('')
const currentEntityId = ref<string>('')

async function getCurrentTableContext() {
  // Complex logic to get entityId from route...
}

async function loadAvailableTables() {
  await getCurrentTableContext()
  const tables = await query<CaseTableRecord>(`SELECT...`)
  // ...
}
```

**After**:
```typescript
const columnContext = inject(ColumnContextKey)

async function loadAvailableTables() {
  if (!columnContext?.getAvailableTablesForRelation) {
    console.error('getAvailableTablesForRelation not available')
    return
  }
  
  const tables = await columnContext.getAvailableTablesForRelation(false)
  availableTables.value = tables
}
```

#### B. `CreateRelationDialog.vue`

**Before**:
```typescript
const sourceEntityId = ref<string>('')

async function open(column, tableId, tableName) {
  // Get entityId from database
  const sourceTableData = await query<CaseTableRecord>(
    `SELECT "entityId" FROM case_tables WHERE id = $1`,
    [tableId]
  )
  sourceEntityId.value = sourceTableData[0].entityId
  // ...
}

async function loadAvailableTables() {
  const tables = await query<CaseTableRecord>(
    `SELECT DISTINCT ON...`,
    [sourceTableId.value, sourceEntityId.value]
  )
  // ...
}
```

**After**:
```typescript
const tableView = inject('tableView') as any

async function open(column, tableId, tableName) {
  // No need to get entityId - tableView already has it
  // ...
}

async function loadAvailableTables() {
  if (!tableView?.getAvailableTablesForRelation) {
    console.error('getAvailableTablesForRelation not available')
    return
  }
  
  const tables = await tableView.getAvailableTablesForRelation(true)
  availableTables.value = tables
}
```

#### C. `CreateReverseRelationDialog.vue`

Same pattern as `CreateRelationDialog.vue` - inject `tableView` and use helper methods.

## Benefits

### 1. Separation of Concerns ✅
- **Components**: Focus on UI and user interaction
- **Composable**: Handles all data access logic
- **Clean Architecture**: Standard component (mdTable) doesn't contain database queries

### 2. Single Source of Truth ✅
- All table/field loading logic in one place
- Consistent filtering and sorting across all components
- Easier to maintain and update

### 3. Easy API Migration ✅
```typescript
// Current: Direct database queries
async function getAvailableTablesForRelation() {
  return await query<CaseTableRecord>(`SELECT...`)
}

// Future: API calls
async function getAvailableTablesForRelation() {
  return await fetch('/api/tables/available-for-relation')
    .then(res => res.json())
}
```

### 4. Context Awareness ✅
- Helper functions automatically use current `tableId` and `entityId`
- No need to pass these values around
- Components don't need to know about workspace structure

### 5. Reusability ✅
- Any component can inject `ColumnContext` and use these helpers
- Consistent behavior across all relation components
- Easy to add new components that need table/field data

## Usage Examples

### Example 1: Load Tables for Relation (Excluding Current)

```typescript
// In CreateRelationDialog.vue
const tableView = inject('tableView')

// Get all tables except current one
const tables = await tableView.getAvailableTablesForRelation(true)
```

### Example 2: Load Tables for Relation (Including Current)

```typescript
// In Relation.vue (edit form)
const columnContext = inject(ColumnContextKey)

// Get all tables including current one
const tables = await columnContext.getAvailableTablesForRelation(false)
```

### Example 3: Load Fields for Selected Table

```typescript
// In any component
const tableView = inject('tableView')

// Get fields for a specific table
const fields = await tableView.getFieldsForTable(selectedTableId)
```

## Migration Path to API

When ready to switch to API calls, only update `useTableView.ts`:

```typescript
// Step 1: Add API client
import { apiClient } from '@/api/client'

// Step 2: Update helper functions
async function getAvailableTablesForRelation(excludeCurrentTable = false) {
  try {
    const response = await apiClient.get('/tables/available-for-relation', {
      params: {
        entityId: entityId.value,
        excludeTableId: excludeCurrentTable ? tableId.value : undefined
      }
    })
    return response.data
  } catch (error) {
    console.error('Error loading tables:', error)
    throw error
  }
}

async function getFieldsForTable(targetTableId: string) {
  try {
    const response = await apiClient.get(`/tables/${targetTableId}/fields`)
    return response.data
  } catch (error) {
    console.error('Error loading fields:', error)
    throw error
  }
}
```

**No changes needed in components!** 🎉

## Testing Checklist

- [ ] Edit relation field - tables load correctly
- [ ] Edit relation field - fields load correctly
- [ ] Create relation dialog - tables filtered by entityId
- [ ] Create relation dialog - no duplicate tables
- [ ] Create relation dialog - current table excluded
- [ ] Create reverse relation dialog - tables filtered by entityId
- [ ] Create reverse relation dialog - source fields load
- [ ] Create reverse relation dialog - target fields load
- [ ] All components handle missing context gracefully
- [ ] Error messages displayed when context unavailable

## Files Modified

1. `/demo/workspaces/composables/useTableView.ts`
   - Added `getAvailableTablesForRelation()`
   - Added `getFieldsForTable()`
   - Updated `ColumnContext` provide to include new methods

2. `/packages/dp-mdTable/composables/useColumns.ts`
   - Updated `ColumnContext` interface with optional relation helpers

3. `/packages/dp-mdTable/components/mdTable/addColumn/field/Relation.vue`
   - Removed direct database queries
   - Inject `ColumnContext`
   - Use `getAvailableTablesForRelation()` and `getFieldsForTable()`

4. `/demo/workspaces/components/global/workspaces/dialogs/CreateRelationDialog.vue`
   - Removed `sourceEntityId` ref
   - Inject `tableView`
   - Use `getAvailableTablesForRelation()` and `getFieldsForTable()`

5. `/demo/workspaces/components/global/workspaces/dialogs/CreateReverseRelationDialog.vue`
   - Removed `sourceEntityId` ref
   - Inject `tableView`
   - Use `getAvailableTablesForRelation()` and `getFieldsForTable()`

## Notes

- All three components now use the same helper functions
- Consistent filtering and deduplication across all relation UI
- Components are cleaner and more focused on UI logic
- Easy to add caching, error handling, or retry logic in one place
- Future API migration requires changes in only one file
