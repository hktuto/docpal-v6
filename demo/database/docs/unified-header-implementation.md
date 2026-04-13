# Unified Header Implementation Guide

## Overview

The `UnifiedHeader` component provides a consistent header layout across all database views with:
- **Breadcrumb navigation** (left)
- **Flexible spacer** (middle)
- **Collaborator avatars** (right, max 5 visible)
- **Settings dropdown** (right, context-specific actions)

---

## Component API

### Props

```typescript
interface UnifiedHeaderProps {
  // Breadcrumb navigation path
  breadcrumb: BreadcrumbItem[]
  
  // Context information for determining collaborators
  context: {
    type: 'database' | 'table' | 'view' | 'dashboard' | 'record'
    database?: Database
    table?: Table
    view?: View
    dashboard?: Dashboard
    recordId?: string
  }
  
  // Actions for settings dropdown
  actions?: HeaderAction[]
  
  // Show/hide collaborators section
  showCollaborators?: boolean
}

interface BreadcrumbItem {
  label: string
  icon?: string
  to?: () => void  // Optional navigation function
}

interface HeaderAction {
  code: string
  label: string
  icon?: string
  divided?: boolean   // Show divider above
  disabled?: boolean
  danger?: boolean    // Red text for destructive actions
  action: () => void
}
```

### Events

```typescript
// Emitted when any action is clicked
@action: (code: string) => void
```

---

## Implementation Examples

### 1. Table View (ViewRenderer.vue)

```vue
<script setup>
import UnifiedHeader from './UnifiedHeader.vue'

const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    icon: '📊',
    to: () => router.push('/database')
  },
  {
    label: props.table.name,
    icon: '📋'
  },
  {
    label: props.view.name
  }
])

const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'add-record',
    label: 'Add Record',
    icon: '➕',
    action: () => handleCreate()
  },
  {
    code: 'manage-columns',
    label: 'Manage Columns',
    icon: '📋',
    action: () => handleAddColumn()
  },
  {
    code: 'table-settings',
    label: 'Table Settings',
    icon: '⚙️',
    divided: true,
    action: () => showTableSettings.value = true
  },
  {
    code: 'export',
    label: 'Export Data',
    icon: '📤',
    action: () => handleExport()
  },
  {
    code: 'delete-view',
    label: 'Delete View',
    icon: '🗑️',
    danger: true,
    divided: true,
    action: () => handleDeleteView()
  }
])
</script>

<template>
  <div class="view-renderer">
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'table',
        database: props.database,
        table: props.table,
        view: props.view
      }"
      :actions="headerActions"
      :show-collaborators="true"
      @action="handleHeaderAction"
    />
    
    <!-- View Content -->
    <div class="view-content">
      <TableView ... />
    </div>
  </div>
</template>
```

---

### 2. Dashboard View

```vue
<script setup>
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    icon: '📊',
    to: () => emit('back')
  },
  {
    label: props.dashboard.name,
    icon: '📈'
  }
])

const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'edit-dashboard',
    label: 'Edit Dashboard',
    icon: '✏️',
    action: () => handleEditDashboard()
  },
  {
    code: 'add-widget',
    label: 'Add Widget',
    icon: '➕',
    action: () => handleAddWidget()
  },
  {
    code: 'dashboard-settings',
    label: 'Dashboard Settings',
    icon: '⚙️',
    divided: true,
    action: () => showDashboardSettings.value = true
  },
  {
    code: 'share',
    label: 'Share Dashboard',
    icon: '🔗',
    action: () => handleShare()
  },
  {
    code: 'export-pdf',
    label: 'Export as PDF',
    icon: '📄',
    divided: true,
    action: () => handleExportPDF()
  }
])
</script>

<template>
  <div class="dashboard-view">
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'dashboard',
        database: props.database,
        dashboard: props.dashboard
      }"
      :actions="headerActions"
      :show-collaborators="true"
    />
    
    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Widgets -->
    </div>
  </div>
</template>
```

---

### 3. Record Detail View

```vue
<script setup>
const recordTitle = computed(() => {
  const titleField = props.table.titleField || 'name'
  return props.record[titleField] || 'Untitled'
})

const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    icon: '📊',
    to: () => emit('close')
  },
  {
    label: props.table.name,
    icon: '📋',
    to: () => emit('close')
  },
  {
    label: recordTitle.value,
    icon: '📄'
  }
])

const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'edit-record',
    label: 'Edit Record',
    icon: '✏️',
    action: () => handleEdit()
  },
  {
    code: 'duplicate',
    label: 'Duplicate',
    icon: '📋',
    action: () => handleDuplicate()
  },
  {
    code: 'share',
    label: 'Share Record',
    icon: '🔗',
    divided: true,
    action: () => handleShare()
  },
  {
    code: 'export',
    label: 'Export',
    icon: '📤',
    action: () => handleExport()
  },
  {
    code: 'delete',
    label: 'Delete Record',
    icon: '🗑️',
    danger: true,
    divided: true,
    action: () => handleDelete()
  }
])
</script>

<template>
  <div class="record-detail-view">
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'record',
        database: props.database,
        table: props.table,
        recordId: props.recordId
      }"
      :actions="headerActions"
      :show-collaborators="false"
    />
    
    <!-- Record Content -->
    <div class="record-content">
      <!-- Fields and widgets -->
    </div>
  </div>
</template>
```

---

### 4. Folder View

```vue
<script setup>
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    icon: '📊',
    to: () => emit('back')
  },
  {
    label: folder.value?.label || 'Folder',
    icon: '📁'
  }
])

const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'add-item',
    label: 'Add Item',
    icon: '➕',
    action: () => handleAddItem()
  },
  {
    code: 'rename-folder',
    label: 'Rename Folder',
    icon: '✏️',
    divided: true,
    action: () => handleRename()
  },
  {
    code: 'delete-folder',
    label: 'Delete Folder',
    icon: '🗑️',
    danger: true,
    action: () => handleDeleteFolder()
  }
])
</script>

<template>
  <div class="folder-view">
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'database',
        database: props.database
      }"
      :actions="headerActions"
      :show-collaborators="false"
    />
    
    <!-- Folder Content -->
    <div class="folder-content">
      <!-- List of items in folder -->
    </div>
  </div>
</template>
```

---

## Visual Examples

### Table View Header
```
┌────────────────────────────────────────────────────────────────────┐
│ 📊 CRM › 📋 Customers › All Records    [👤👤👤👤👤 +3]  ⚙️ Settings │
└────────────────────────────────────────────────────────────────────┘
```

Settings Dropdown:
```
⚙️ Settings ▼
├─ ➕ Add Record
├─ 📋 Manage Columns
├─ ────────────
├─ ⚙️ Table Settings
├─ 📤 Export Data
├─ ────────────
└─ 🗑️ Delete View (red)
```

### Dashboard Header
```
┌────────────────────────────────────────────────────────────────────┐
│ 📊 CRM › 📈 Sales Dashboard              [👤👤👤👤👤]  ⚙️ Settings  │
└────────────────────────────────────────────────────────────────────┘
```

### Record Detail Header
```
┌────────────────────────────────────────────────────────────────────┐
│ 📊 CRM › 📋 Customers › 📄 Acme Corp              ⚙️ Settings       │
└────────────────────────────────────────────────────────────────────┘
```

---

## Benefits

### ✅ Consistency
- Same layout across all views
- Predictable UI patterns
- Easier for users to learn

### ✅ Context Awareness
- Breadcrumb shows navigation path
- Actions adapt to current view
- Collaborators show relevant users

### ✅ Accessibility
- Keyboard navigation support
- Tooltips for collaborators
- Clear visual hierarchy

### ✅ Maintainability
- Single component to update
- Consistent styling
- Reusable patterns

---

## Migration Plan

### Phase 1: Core Views
1. ✅ Create UnifiedHeader component
2. ⏳ Update ViewRenderer.vue
3. ⏳ Update ViewPage.vue
4. ⏳ Update RecordDetailView.vue

### Phase 2: Extended Views
5. ⏳ Update DashboardView.vue
6. ⏳ Update FolderView (if created)
7. ⏳ Update any custom views

### Phase 3: Polish
8. ⏳ Add transitions/animations
9. ⏳ Add keyboard shortcuts
10. ⏳ Add mobile responsive behavior

---

## Customization Options

### Hide Elements
```vue
<!-- No collaborators -->
<UnifiedHeader
  :show-collaborators="false"
  ...
/>

<!-- No actions -->
<UnifiedHeader
  :actions="[]"
  ...
/>
```

### Custom Styling
```vue
<UnifiedHeader
  class="custom-header"
  ...
/>

<style>
.custom-header {
  background: linear-gradient(to right, #667eea, #764ba2);
  border: none;
}
</style>
```

---

## Questions to Consider

1. **Should breadcrumb be collapsible on mobile?**
   - Show only last 2 items with "..." for earlier ones

2. **Should we show real-time presence?**
   - Green dot for "currently viewing"
   - Different styling for "has access" vs "currently here"

3. **Should actions have permissions?**
   - Hide/disable actions based on user role
   - Show "locked" icon for unavailable actions

4. **Should we add search to settings dropdown?**
   - For views with many actions
   - Quick keyboard shortcut (Cmd+K)

---

## What do you think?

This design provides:
- ✅ Consistent layout
- ✅ Context-specific actions  
- ✅ Flexible and maintainable
- ✅ User-friendly

Ready to implement across all views? Any adjustments you'd like to make?

