# Suggestion Status UI & Notifications

## Overview

This document explains the UI indicators and notifications for relation suggestion analysis status.

## Status Flow

```
Import Table → 'pending' → 'processing' → 'ready' (with notification)
                                        → 'none' (no suggestions)
                                        → 'error' (analysis failed)
```

## UI Indicators

### Status Badge Location

All status indicators appear in the **table header right section** via Teleport:

```vue
<Teleport to="#database-table-header-right">
  <!-- Status indicators here -->
</Teleport>
```

### Status Types

#### 1. **Pending** - Queued for Analysis

```vue
<el-tag type="info" size="large">
  <Icon name="lucide:clock" />
  Queued for analysis...
</el-tag>
```

**When shown:**
- Table is imported and waiting for background poller
- Status: `suggestionStatus === 'pending'`

**User experience:**
- Indicates analysis will start soon
- No action required from user

---

#### 2. **Processing** - Currently Analyzing

```vue
<el-tag type="info" size="large">
  <Icon name="lucide:loader-2" class="spinning" />
  Analyzing relations...
</el-tag>
```

**When shown:**
- Background poller is actively analyzing the table
- Status: `suggestionStatus === 'processing'`

**User experience:**
- Spinning icon shows active work
- User can continue working while analysis runs

---

#### 3. **Ready** - Suggestions Available

```vue
<el-badge :value="suggestionCount">
  <el-button type="primary" @click="openSuggestionsDialog">
    <Icon name="lucide:lightbulb" />
    View Relation Suggestions
  </el-button>
</el-badge>
```

**When shown:**
- Analysis complete with suggestions found
- Status: `suggestionStatus === 'ready' && suggestionCount > 0`

**User experience:**
- Badge shows number of suggestions
- Click to view and accept suggestions
- **Notification shown when status changes from 'processing' to 'ready'**

---

#### 4. **Error** - Analysis Failed

```vue
<el-tag type="danger" size="large">
  <Icon name="lucide:alert-circle" />
  Error analyzing relations
</el-tag>
```

**When shown:**
- Analysis encountered an error
- Status: `suggestionStatus === 'error'`

**User experience:**
- Red indicator shows error state
- Check console logs for details

---

#### 5. **None** - No Indicator

**When shown:**
- No analysis needed or completed with no suggestions
- Status: `suggestionStatus === 'none'`

**User experience:**
- Clean header, no distractions

## Status Polling

### How It Works

```typescript
// Start polling when status is 'pending' or 'processing'
function startStatusPolling() {
  statusCheckInterval = setInterval(() => {
    loadSuggestionStatus()
  }, 5000) // Check every 5 seconds
}

// Stop polling when status is 'ready', 'none', or 'error'
function stopStatusPolling() {
  clearInterval(statusCheckInterval)
}
```

### Polling Lifecycle

1. **Component mounts** → Load initial status
2. **If pending/processing** → Start polling (every 5 seconds)
3. **Status changes to ready** → Show notification + stop polling
4. **Component unmounts** → Clean up polling interval

### Why 5 Seconds?

- **Fast enough** - User sees updates quickly
- **Not too aggressive** - Doesn't overload database
- **Balances UX and performance**

## Notifications

### Success Notification

```typescript
ElMessage.success({
  message: `Found ${suggestionCount} relation suggestion${suggestionCount > 1 ? 's' : ''}!`,
  duration: 5000
})
```

**When shown:**
- Status changes from `'processing'` to `'ready'`
- At least 1 suggestion found

**Examples:**
- "Found 1 relation suggestion!"
- "Found 3 relation suggestions!"

**Duration:** 5 seconds

### Why Notification?

✅ **User feedback** - Confirms analysis completed  
✅ **Attention** - Draws user to suggestions  
✅ **Non-intrusive** - Auto-dismisses after 5s  
✅ **Context-aware** - Only shown when transitioning from processing  

## Implementation Details

### Status Check Query

```typescript
const tableData = await query<CaseTableRecord>(
  `SELECT "suggestionStatus" FROM case_tables WHERE id = $1`,
  [props.dataTableId]
)
```

### Status Change Detection

```typescript
const previousStatus = suggestionStatus.value
const newStatus = tableData[0].suggestionStatus

// Detect transition from processing to ready
if (previousStatus === 'processing' && newStatus === 'ready') {
  // Show notification
}
```

### Cleanup on Unmount

```typescript
onUnmounted(() => {
  stopStatusPolling()
})
```

**Important:** Always clean up intervals to prevent memory leaks!

## User Experience Flow

### Scenario 1: Immediate Analysis

```
1. User imports table
2. Status: 'pending' → Shows "Queued for analysis..."
3. Poller picks up (< 30s)
4. Status: 'processing' → Shows "Analyzing relations..." (spinning)
5. Analysis completes (< 10s)
6. Status: 'ready' → Shows badge + notification
7. User clicks badge → Views suggestions
```

**Total time:** ~40 seconds

---

### Scenario 2: Page Refresh During Analysis

```
1. User imports table
2. Status: 'pending'
3. User refreshes page
4. Component remounts → Loads status
5. Status: 'processing' → Starts polling
6. Analysis completes
7. Polling detects change → Shows notification
```

**Result:** User doesn't lose progress!

---

### Scenario 3: Navigation Away and Back

```
1. User imports table
2. Status: 'processing'
3. User navigates to different table
4. Component unmounts → Stops polling
5. Background poller continues (independent)
6. User navigates back
7. Component remounts → Loads status
8. Status: 'ready' → Shows badge (no notification)
```

**Note:** Notification only shown if user was on the page during transition.

## Styling

### Spinning Animation

```scss
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### Badge Styling

```scss
.suggestion-badge {
  :deep(.el-badge__content) {
    background-color: var(--el-color-primary);
  }
}

.badge-icon {
  margin-right: 4px;
}
```

## Testing Checklist

### Visual Testing
- [ ] Import table → See "Queued for analysis..."
- [ ] Wait ~30s → See "Analyzing relations..." with spinning icon
- [ ] Wait for completion → See badge with count
- [ ] Verify notification appears
- [ ] Click badge → Dialog opens

### Polling Testing
- [ ] Import table → Verify polling starts
- [ ] Check console logs every 5s
- [ ] Analysis completes → Verify polling stops
- [ ] Navigate away → Verify polling stops
- [ ] Navigate back → Verify status persists

### Edge Cases
- [ ] Refresh during 'pending' → Status persists
- [ ] Refresh during 'processing' → Polling resumes
- [ ] Multiple tables → Each has independent status
- [ ] No suggestions found → No badge shown
- [ ] Analysis error → Error indicator shown

## Troubleshooting

### Issue: Status not updating
**Cause:** Polling not started or stopped prematurely  
**Solution:** Check console logs for "[TableDetailView] Starting/Stopping status polling"  
**Debug:** Verify `statusCheckInterval` is set  

### Issue: Notification not showing
**Cause:** Status transition not detected (e.g., user navigated away during processing)  
**Solution:** This is expected behavior - notification only shown if user is on the page  
**Note:** Badge will still appear when user returns  

### Issue: Polling continues after unmount
**Cause:** `onUnmounted` not called or interval not cleared  
**Solution:** Check `stopStatusPolling()` is called in `onUnmounted`  
**Debug:** Look for memory leaks in browser DevTools  

### Issue: Multiple notifications
**Cause:** Polling detecting status change multiple times  
**Solution:** Ensure `stopStatusPolling()` is called when status becomes 'ready'  
**Fix:** Check condition in `loadSuggestionStatus()`  

## Related Files

- `/demo/workspaces/components/workspaces/table/TableDetailView.vue` - Main implementation
- `/demo/workspaces/composables/useSuggestionPoller.ts` - Background poller
- `/demo/workspaces/utils/db/schema/newTableSchema.ts` - Status type definition

## Future Enhancements

### Possible Improvements
1. **Progress Bar** - Show percentage of analysis completion
2. **Estimated Time** - Display time remaining
3. **Retry Button** - Allow manual retry on error
4. **Dismiss Notification** - Add action to dismiss suggestions permanently
5. **Sound Notification** - Optional sound when analysis completes
6. **Browser Notification** - Use Web Notifications API for background tabs
