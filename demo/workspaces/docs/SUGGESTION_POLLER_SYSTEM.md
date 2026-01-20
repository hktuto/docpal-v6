# Background Suggestion Poller System

## Overview

The Background Suggestion Poller is a system that processes relation suggestions for newly imported tables in the background, ensuring that the analysis continues even if the user navigates away or refreshes the page.

## Architecture

### Key Components

1. **`useSuggestionPoller.ts`** - Background polling composable
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
┌─────────────────────────────────────────────────────────────────┐
│                    Background Poller                             │
│  (Runs every 30 seconds while app is open)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Check for        │
                    │ 'pending' tables │
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
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update Status:   │
                    │ 'ready' or 'none'│
                    └──────────────────┘
```

## Database Schema

### `case_tables.suggestionStatus`

```typescript
suggestionStatus: 'none' | 'pending' | 'processing' | 'ready' | 'error'
```

- **`none`**: No suggestions or analysis completed with no results
- **`pending`**: Queued for analysis (waiting for poller)
- **`processing`**: Currently being analyzed
- **`ready`**: Analysis complete, suggestions available
- **`error`**: Analysis failed

### `relation_suggestions` Table

Stores individual relation suggestions with:
- Source/target table and field references
- Match statistics (count, rate, sample values)
- Status: `'pending'` | `'accepted'` | `'dismissed'`

## Implementation Details

### 1. Poller Composable (`useSuggestionPoller.ts`)

```typescript
export function useSuggestionPoller() {
  const { query } = usePglite()
  const { analyzeTableForRelations } = useRelationSuggestions()
  
  // Checks every 30 seconds for pending tables
  // Processes one table at a time
  // Updates status in database
  
  return {
    start,      // Start background polling
    stop,       // Stop polling
    isRunning,  // Check if running
    isProcessing, // Check if currently processing
    checkAndProcessPending // Manual trigger
  }
}
```

**Key Features:**
- ✅ Prevents concurrent processing (only one table at a time)
- ✅ Processes oldest tables first (FIFO queue)
- ✅ Logs progress to console for debugging
- ✅ Handles errors gracefully

### 2. Integration Point (`detail/index.vue`)

```typescript
// Initialize poller when workspace detail loads
const suggestionPoller = useSuggestionPoller()

onMounted(() => {
  suggestionPoller.start()
})

onUnmounted(() => {
  suggestionPoller.stop()
})
```

**Lifecycle:**
- Starts when user opens workspace
- Stops when user leaves workspace
- Automatically resumes on page refresh (reads from DB)

### 3. Import Flow (`useImportQueue.ts`)

```typescript
// After all tables imported successfully
await query(
  `UPDATE case_tables 
   SET "suggestionStatus" = 'pending', "updatedAt" = $1 
   WHERE id IN (${placeholders})`,
  [now, ...allTableIds]
)
```

**Changes:**
- ❌ Removed immediate `analyzeTableForRelations` call
- ✅ Sets status to `'pending'` instead
- ✅ Poller picks up and processes in background

## Benefits

### ✅ Survives Page Refresh
Status is stored in database, so analysis continues even after:
- Page refresh
- Navigation to other pages
- Browser tab switch

### ✅ Non-Blocking
- Import completes immediately
- Analysis happens in background
- UI remains responsive

### ✅ Simple & Maintainable
- No Web Worker complexity
- Easy to debug (console logs)
- Uses existing PGlite infrastructure

### ✅ Reliable
- Processes one table at a time (no race conditions)
- Error handling for failed analysis
- Automatic retry on app restart

## Limitations

### ⚠️ Requires App to be Open
- Poller only runs while workspace is open
- Stops when all browser tabs close
- **This is acceptable** because:
  - User needs to see results anyway
  - Analysis is fast (< 30 seconds per table)
  - Status persists in DB for resume

### ⚠️ 30-Second Polling Interval
- Not real-time (up to 30s delay)
- **This is acceptable** because:
  - Relation suggestions are not time-critical
  - Reduces system load
  - Can be adjusted if needed

## Testing Checklist

### Basic Flow
- [ ] Import a new table
- [ ] Verify status changes: `none` → `pending`
- [ ] Wait up to 30 seconds
- [ ] Verify status changes: `pending` → `processing` → `ready`
- [ ] Check console logs for progress

### Page Refresh
- [ ] Import a table
- [ ] Immediately refresh the page
- [ ] Verify status is still `pending` (persisted in DB)
- [ ] Wait for poller to resume
- [ ] Verify analysis completes

### Multiple Tables
- [ ] Import multiple tables at once
- [ ] Verify all set to `pending`
- [ ] Watch them process one by one (FIFO)
- [ ] Verify all complete successfully

### Navigation
- [ ] Import a table
- [ ] Navigate to different page in workspace
- [ ] Navigate back
- [ ] Verify analysis completed in background

### Error Handling
- [ ] Simulate analysis error (invalid table data)
- [ ] Verify status changes to `error`
- [ ] Verify poller continues with next table

## Console Logs

The poller provides detailed logging for debugging:

```
[SuggestionPoller] Starting background poller
[SuggestionPoller] Processing table: Company (abc-123-def)
[SuggestionPoller] Found 3 suggestions for table: Company
[SuggestionPoller] Updated table status to: ready
```

## Future Enhancements

### Possible Improvements
1. **Progress Tracking**: Add `progress` field to show analysis progress
2. **Priority Queue**: Process important tables first
3. **Batch Processing**: Analyze multiple tables in parallel
4. **Real-time Updates**: Use WebSocket for instant UI updates
5. **Configurable Interval**: Allow users to adjust polling frequency

### Migration to API
When moving to API-based backend:
- Replace `usePglite()` with API calls
- Keep same status flow
- Poller becomes API polling instead of DB polling
- No changes to UI components

## Related Files

- `/demo/workspaces/composables/useSuggestionPoller.ts` - Main poller logic
- `/demo/workspaces/composables/useRelationSuggestions.ts` - Analysis logic
- `/demo/workspaces/composables/useImportQueue.ts` - Import integration
- `/demo/workspaces/components/global/workspaces/detail/index.vue` - Poller initialization
- `/demo/workspaces/utils/db/schema/newTableSchema.ts` - Database schema

## Troubleshooting

### Poller Not Starting
- Check console for `[SuggestionPoller] Starting background poller`
- Verify workspace detail component is mounted
- Check for JavaScript errors

### Tables Stuck in 'pending'
- Check if poller is running: look for console logs
- Verify no errors in analysis logic
- Manually trigger: `suggestionPoller.checkAndProcessPending()`

### Analysis Takes Too Long
- Check `ANALYSIS_ROW_LIMIT` in `useRelationSuggestions.ts`
- Consider reducing sample size
- Check for database performance issues

### Status Not Updating in UI
- Verify `loadSuggestionStatus()` is called after navigation
- Check if table view is refreshing properly
- Look for caching issues
