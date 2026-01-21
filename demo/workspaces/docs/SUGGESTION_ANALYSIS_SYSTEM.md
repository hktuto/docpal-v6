# Relation Suggestion Analysis System

## Overview

The Relation Suggestion Analysis System automatically analyzes newly imported tables for potential relations when the user views them. The analysis runs in the background on the main thread and only processes one table at a time.

## Architecture

### Key Components

1. **`TableDetailView.vue`** - Triggers analysis when table is opened
2. **`useRelationSuggestions.ts`** - Relation analysis logic
3. **`useImportQueue.ts`** - Import flow integration
4. **Database Schema** - `case_tables.suggestionStatus` and `relation_suggestions` table

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         Import Flow                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Table Imported   │
                    │ Status: 'pending'│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ User Opens Table │
                    │ (TableDetailView)│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Check Status     │
                    │ If 'pending'...  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update Status:   │
                    │ 'processing'     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Analyze Table    │
                    │ for Relations    │
                    │ (2-5 seconds)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update Status:   │
                    │ 'ready' or 'none'│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Show Badge/      │
                    │ Notification     │
                    └──────────────────┘
```

## Status Flow

### Status Types

```typescript
type SuggestionStatus = 'none' | 'pending' | 'processing' | 'ready' | 'error'
```

- **`none`**: No analysis needed or no suggestions found
- **`pending`**: Table imported, waiting for user to open it
- **`processing`**: Analysis currently running
- **`ready`**: Analysis complete, suggestions available
- **`error`**: Analysis failed

### Status Transitions

```
Import → 'pending'
         │
         ▼ (User opens table)
    'processing'
         │
         ├─→ 'ready' (if suggestions found)
         └─→ 'none' (if no suggestions)
         
'ready' → 'none' (when all suggestions accepted/dismissed)
```

## Implementation Details

### 1. Import Flow (`useImportQueue.ts`)

When a table is imported:

```typescript
await query(
  `UPDATE case_tables 
   SET "suggestionStatus" = 'pending', "updatedAt" = $1 
   WHERE id = $2`,
  [new Date(), tableId]
)
```

### 2. Table View (`TableDetailView.vue`)

When user opens a table:

```typescript
async function loadSuggestionStatus() {
  const tableData = await query<CaseTableRecord>(
    `SELECT "suggestionStatus", "entityId" FROM case_tables WHERE id = $1`,
    [props.dataTableId]
  )
  
  const currentStatus = tableData[0].suggestionStatus || 'none'
  
  // If pending, trigger analysis immediately
  if (currentStatus === 'pending' && !isAnalyzing.value) {
    await runAnalysis(tableData[0].entityId)
  }
}
```

### 3. Analysis Execution

```typescript
async function runAnalysis(entityId: string) {
  try {
    isAnalyzing.value = true
    suggestionStatus.value = 'processing'
    
    // Update database
    await query(
      `UPDATE case_tables 
       SET "suggestionStatus" = 'processing', "updatedAt" = $1 
       WHERE id = $2`,
      [new Date(), props.dataTableId]
    )
    
    // Run analysis (2-5 seconds)
    const count = await analyzeTableForRelations(tableId, entityId)
    
    // Update status
    const newStatus = count > 0 ? 'ready' : 'none'
    await query(
      `UPDATE case_tables 
       SET "suggestionStatus" = $1, "updatedAt" = $2 
       WHERE id = $3`,
      [newStatus, new Date(), props.dataTableId]
    )
    
    // Show notification
    if (count > 0) {
      ElMessage.success(`Found ${count} relation suggestions!`)
    }
  } finally {
    isAnalyzing.value = false
  }
}
```

## UI Indicators

### Status Badge

The table header shows different indicators based on status:

```vue
<!-- Pending: Yellow tag -->
<el-tag v-if="suggestionStatus === 'pending'" type="warning">
  Queued for Analysis
</el-tag>

<!-- Processing: Blue tag with loading icon -->
<el-tag v-if="suggestionStatus === 'processing'" type="info">
  <el-icon class="is-loading">
    <Icon name="material-symbols:progress-activity" />
  </el-icon>
  Analyzing...
</el-tag>

<!-- Ready: Green badge with count -->
<el-badge v-if="suggestionStatus === 'ready'" :value="suggestionCount">
  <el-tag type="success" @click="openSuggestionsDialog">
    Suggestions Ready
  </el-tag>
</el-badge>

<!-- Error: Red tag -->
<el-tag v-if="suggestionStatus === 'error'" type="danger">
  Analysis Failed
</el-tag>
```

### Notifications

- **Success**: When analysis completes and suggestions are found
  ```typescript
  ElMessage.success(`Found ${count} relation suggestions!`)
  ```

- **Error**: When analysis fails
  ```typescript
  ElMessage.error('Failed to analyze table for relation suggestions')
  ```

## Performance Considerations

### Why Main Thread?

The analysis runs on the main thread (not in a Web Worker) because:

1. **No Blocking**: PGlite Worker already handles DB queries asynchronously
2. **One at a Time**: Only one table analyzes at a time (user can only view one table)
3. **User-Initiated**: Analysis only runs when user opens the table
4. **Optimized**: Analysis takes only 2-5 seconds (batch queries, in-memory matching)

### Query Optimization

The analyzer uses several optimization techniques:

- **Batch Metadata Queries**: Fetch all tables/fields in parallel
- **Batch Value Queries**: Use `Promise.all` for parallel value fetching
- **In-Memory Matching**: Use `Set` for O(1) lookups instead of nested queries
- **Batch Inserts**: Single `INSERT` for all suggestions

Result: ~20-50 parallel queries instead of 300+ sequential queries

## Benefits of This Approach

### ✅ Simplicity
- No global poller
- No complex state synchronization
- All logic in one component

### ✅ User Experience
- Analysis only runs when needed (user opens table)
- Real-time status updates
- Immediate feedback with notifications

### ✅ Performance
- No background polling overhead
- No blocking of user queries
- Optimized analysis (2-5 seconds)

### ✅ Reliability
- Status persisted in database
- If user navigates away, status stays 'pending'
- Analysis will run next time user opens the table

## Cleanup

When a workspace or table is deleted, all associated suggestions are automatically cleaned up:

### Workspace Deletion
```typescript
await query(
  `DELETE FROM relation_suggestions WHERE "sourceTableId" IN (
    SELECT id FROM case_tables WHERE "entityId" = $1
  )`,
  [workspaceId]
)
```

### Table Deletion
```typescript
await query(
  `DELETE FROM relation_suggestions 
   WHERE "sourceTableId" = $1 OR "targetTableId" = $1`,
  [tableId]
)
```

## Testing Checklist

- [ ] Import a table → Status should be 'pending'
- [ ] Open the table → Status should change to 'processing'
- [ ] Wait 2-5 seconds → Status should change to 'ready' (if suggestions found)
- [ ] Click badge → Dialog should open with suggestions
- [ ] Accept/dismiss all suggestions → Status should change to 'none'
- [ ] Navigate away during analysis → Status should stay 'pending'
- [ ] Open table again → Analysis should restart
- [ ] Delete table → Suggestions should be deleted
- [ ] Delete workspace → All suggestions should be deleted

## Troubleshooting

### Analysis Never Starts
- Check if `suggestionStatus` is 'pending' in database
- Check console for errors in `loadSuggestionStatus()`
- Verify `analyzeTableForRelations` is imported correctly

### Analysis Takes Too Long
- Check console for phase timings
- Look for slow queries in PGlite worker logs
- Verify batch optimization is working

### Status Stuck at 'processing'
- Analysis likely failed with error
- Check console for error messages
- Status should auto-update to 'error' on failure

### No Suggestions Found
- Check if source table has valid fields (not just id/timestamps)
- Check if other tables exist in same workspace
- Check if value overlap exists (need >50% match)
- Review console logs for match statistics
