# Update Status Visual Feedback Guide

This guide explains how to implement visual feedback for data updates across different view types (Table, Kanban, Gantt, etc.).

## Architecture Overview

The update status system uses a centralized composable (`useUpdateStatus`) that tracks the state of data updates:

- **Loading**: Data is being saved to the server
- **Success**: Data was successfully saved (auto-clears after 2 seconds)
- **Error**: Data save failed (auto-clears after 4 seconds)

Each view type can consume this status and implement appropriate visual feedback.

## Core Composable

### `useUpdateStatus()`

```typescript
import { useUpdateStatus } from '@/packages/dp-mdTable/composables'

const {
  // Setters
  setLoading,    // (rowId: string, field?: string) => void
  setSuccess,    // (rowId: string, field?: string) => void
  setError,      // (rowId: string, field?: string, error?: string) => void
  
  // Getters
  getStatus,     // (rowId: string, field?: string) => UpdateStatus | undefined
  isLoading,     // (rowId: string, field?: string) => boolean
  isSuccess,     // (rowId: string, field?: string) => boolean
  isError,       // (rowId: string, field?: string) => boolean
  getCellClass,  // (rowId: string, field: string) => string
  
  // Clear
  clearStatus,   // (rowId: string, field?: string) => void
  clearAllStatuses, // () => void
  
  // State
  allStatuses    // ComputedRef<UpdateStatus[]>
} = useUpdateStatus()
```

## Implementation by View Type

### 1. Table View (Already Implemented)

The table view uses CSS classes and animations:

```vue
<script setup>
const { setLoading, setSuccess, setError, getCellClass } = useUpdateStatus()

const handleEditClosed = async (params) => {
  const { column, row } = params
  
  // Set loading state
  setLoading(row.id, column.field)
  
  try {
    await updateTableRow([{ id: row.id, [column.field]: row[column.field] }])
    // Set success - auto-clears after 2s
    setSuccess(row.id, column.field)
  } catch (error) {
    setError(row.id, column.field, error.message)
  }
}

// Apply dynamic cell classes
const cellClassName = ({ row, column }) => {
  return getCellClass(row.id, column.field)
}
</script>

<style>
/* Success: Green flash animation */
.cell-update-success {
  animation: successFlash 0.6s ease-out;
}

/* Loading: Pulsing blue overlay */
.cell-update-loading::after {
  content: '';
  background: rgba(64, 158, 255, 0.1);
  animation: pulse 1.5s ease-in-out infinite;
}

/* Error: Red shake animation */
.cell-update-error {
  animation: errorShake 0.5s ease-out;
  background-color: rgba(245, 108, 108, 0.1);
}
</style>
```

### 2. Kanban View (Example Implementation)

For Kanban cards, you might want to highlight the entire card:

```vue
<script setup>
import { useUpdateStatus } from '@/packages/dp-mdTable/composables'

const { setLoading, setSuccess, setError, getStatus } = useUpdateStatus()

const handleCardUpdate = async (card, field, value) => {
  // Use card.id as rowId
  setLoading(card.id, field)
  
  try {
    await updateCard(card.id, { [field]: value })
    setSuccess(card.id, field)
  } catch (error) {
    setError(card.id, field, error.message)
    ElMessage.error('Failed to update card')
  }
}

// Get card status for styling
const getCardClass = (cardId) => {
  const status = getStatus(cardId)
  return status ? `card-${status.status}` : ''
}
</script>

<template>
  <div 
    v-for="card in cards" 
    :key="card.id"
    :class="['kanban-card', getCardClass(card.id)]"
  >
    <!-- Card content -->
  </div>
</template>

<style scoped>
.kanban-card.card-loading {
  border: 2px solid #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.kanban-card.card-success {
  animation: cardSuccessGlow 0.6s ease-out;
}

.kanban-card.card-error {
  border: 2px solid #f56c6c;
  animation: cardErrorShake 0.5s ease-out;
}

@keyframes cardSuccessGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  }
  100% {
    box-shadow: 0 0 0 10px rgba(103, 194, 58, 0);
  }
}

@keyframes cardErrorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
</style>
```

### 3. Gantt View (Example Implementation)

For Gantt charts, highlight the bar or task row:

```vue
<script setup>
import { useUpdateStatus } from '@/packages/dp-mdTable/composables'

const { setLoading, setSuccess, setError, isSuccess, isLoading } = useUpdateStatus()

const handleTaskUpdate = async (task, updates) => {
  setLoading(task.id)
  
  try {
    await updateTask(task.id, updates)
    setSuccess(task.id)
  } catch (error) {
    setError(task.id, undefined, error.message)
  }
}

// Apply status classes to gantt bars
const getBarClass = (taskId) => {
  if (isLoading(taskId)) return 'gantt-bar-loading'
  if (isSuccess(taskId)) return 'gantt-bar-success'
  return ''
}
</script>

<template>
  <div v-for="task in tasks" :key="task.id">
    <div :class="['gantt-bar', getBarClass(task.id)]">
      <!-- Task bar -->
    </div>
  </div>
</template>

<style scoped>
.gantt-bar-loading {
  opacity: 0.6;
  animation: barPulse 1s ease-in-out infinite;
}

.gantt-bar-success {
  animation: barSuccessPulse 0.5s ease-out;
}

@keyframes barPulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.1); }
}

@keyframes barSuccessPulse {
  0% { filter: brightness(1.5); }
  100% { filter: brightness(1); }
}
</style>
```

### 4. Calendar View (Example Implementation)

For calendar events, you might want to add a subtle indicator:

```vue
<script setup>
import { useUpdateStatus } from '@/packages/dp-mdTable/composables'

const { setLoading, setSuccess, setError, getStatus } = useUpdateStatus()

const handleEventUpdate = async (event, changes) => {
  setLoading(event.id)
  
  try {
    await updateEvent(event.id, changes)
    setSuccess(event.id)
  } catch (error) {
    setError(event.id, undefined, error.message)
  }
}

const getEventStatus = (eventId) => {
  return getStatus(eventId)
}
</script>

<template>
  <div 
    v-for="event in events" 
    :key="event.id"
    class="calendar-event"
  >
    <span v-if="getEventStatus(event.id)?.status === 'loading'" class="event-spinner">
      <i class="el-icon-loading" />
    </span>
    <span v-if="getEventStatus(event.id)?.status === 'success'" class="event-check">
      ✓
    </span>
    <!-- Event content -->
  </div>
</template>

<style scoped>
.event-spinner {
  position: absolute;
  top: 2px;
  right: 2px;
  animation: spin 1s linear infinite;
}

.event-check {
  position: absolute;
  top: 2px;
  right: 2px;
  color: #67c23a;
  animation: checkBounce 0.5s ease-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes checkBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>
```

## Best Practices

### 1. Always Handle Errors

Always wrap updates in try-catch and set error status:

```typescript
try {
  setLoading(id, field)
  await updateData(id, field, value)
  setSuccess(id, field)
} catch (error) {
  setError(id, field, error.message)
  // Show user-friendly error message
  ElMessage.error('Update failed')
}
```

### 2. Use Appropriate Granularity

- **Cell-level**: Good for table views where individual cells are edited
  ```typescript
  setSuccess(rowId, 'email') // Specific cell
  ```

- **Row/Item-level**: Good for card/item based views
  ```typescript
  setSuccess(cardId) // Entire card
  ```

### 3. Consistent Animation Duration

Keep animations quick (600ms or less) for good UX:

```css
.success-animation {
  animation: flash 0.6s ease-out; /* Not too long */
}
```

### 4. Accessible Visual Feedback

Don't rely solely on color. Use:
- Icons (✓, ✗, loading spinner)
- Animation (movement, scale)
- Text labels when appropriate

### 5. Auto-Clear Behavior

Success states auto-clear after 2 seconds, errors after 4 seconds. You can manually clear if needed:

```typescript
// Clear specific status
clearStatus(rowId, field)

// Clear all statuses (e.g., on view change)
clearAllStatuses()
```

## Testing

Test all three states in your view:

```typescript
// Simulate loading
setLoading('test-id', 'test-field')

// After 1 second, simulate success
setTimeout(() => setSuccess('test-id', 'test-field'), 1000)

// Test error state
setError('test-id', 'test-field', 'Network error')
```

## Summary

The `useUpdateStatus` composable provides a **view-agnostic** way to track update states. Each view type should:

1. Import and use the composable
2. Call `setLoading/setSuccess/setError` during updates
3. Implement view-appropriate visual feedback
4. Use consistent, accessible animations

This keeps the data layer centralized while allowing each view to have appropriate visual feedback for its context.
