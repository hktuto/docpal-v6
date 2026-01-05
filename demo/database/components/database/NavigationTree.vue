<script lang="ts" setup>
import type { NavItem, NavItemType, Database } from '../../types/database'
import { Plus } from '@element-plus/icons-vue'
import NavItemComponent from './NavItemComponent.vue'
import draggable from 'vuedraggable'

const props = defineProps<{
  database: Database
  activeItemId?: string
  activeItemType?: 'table' | 'view' | 'dashboard'
}>()

const emit = defineEmits<{
  selectTable: [tableId: string]
  selectView: [tableId: string, viewId: string]
  selectDashboard: [dashboardId: string]
  selectFolder: [folderId: string]
  toggleFolder: [folderId: string]
  addItem: [parentId: string | null, itemType: NavItemType]
  updateNavigation: [navigation: NavItem[]]
}>()

// Local copy of navigation for editing - this is the single source of truth during editing
const localNavigation = ref<NavItem[]>([])

// Track if dragging is in progress
const isDragging = ref(false)

// Sync local navigation with database - but not during drag
watch(() => props.database.navigation, (newNav) => {
  // Skip sync during active drag operations
  if (isDragging.value) return
  
  if (newNav && newNav.length > 0) {
    localNavigation.value = JSON.parse(JSON.stringify(newNav))
  } else {
    localNavigation.value = generateFallbackNavigation()
  }
}, { immediate: true, deep: true })

// Get navigation items
const navigationItems = computed(() => localNavigation.value)

// Generate fallback navigation from database structure
function generateFallbackNavigation(): NavItem[] {
  const items: NavItem[] = []
  
  // Add dashboards
  if (props.database.dashboards && props.database.dashboards.length > 0) {
    for (const dash of props.database.dashboards) {
      items.push({
        id: `nav-${dash.id}`,
        type: 'dashboard',
        label: dash.name,
        icon: dash.icon || 'data-analysis',
        targetId: dash.id
      })
    }
  }
  
  // Add tables folder
  if (props.database.tables && props.database.tables.length > 0) {
    const tableItems: NavItem[] = props.database.tables.map(table => ({
      id: `nav-${table.id}`,
      type: 'table' as const,
      label: table.name,
      icon: table.icon || 'grid',
      targetId: table.id
    }))
    
    items.push({
      id: 'nav-tables',
      type: 'folder',
      label: 'Tables',
      icon: 'folder',
      isExpanded: true,
      children: tableItems
    })
  }
  
  return items
}

// Folder expand state (local override)
const expandedFolders = ref<Record<string, boolean>>({})

// Initialize expanded state from navigation
onMounted(() => {
  initializeExpandState(navigationItems.value)
})

function initializeExpandState(items: NavItem[]) {
  for (const item of items) {
    if (item.type === 'folder') {
      // Use item's isExpanded if not already set locally
      if (expandedFolders.value[item.id] === undefined) {
        expandedFolders.value[item.id] = item.isExpanded ?? false
      }
      // Recurse for nested folders
      if (item.children) {
        initializeExpandState(item.children)
      }
    }
  }
}

// Check if a folder is expanded
function isFolderExpanded(folderId: string): boolean {
  return expandedFolders.value[folderId] ?? false
}

// Toggle folder expand/collapse
function handleToggleFolder(folderId: string) {
  expandedFolders.value[folderId] = !expandedFolders.value[folderId]
  emit('toggleFolder', folderId)
}

// Handle item selection
function handleSelectItem(item: NavItem) {
  if (item.type === 'folder') {
    // Emit selectFolder event to navigate to folder view
    emit('selectFolder', item.id)
    return
  }
  
  if (item.type === 'table' && item.targetId) {
    emit('selectTable', item.targetId)
  } else if (item.type === 'view' && item.targetId && item.targetTableId) {
    emit('selectView', item.targetTableId, item.targetId)
  } else if (item.type === 'dashboard' && item.targetId) {
    emit('selectDashboard', item.targetId)
  }
}

// Check if an item is active
function isItemActive(item: NavItem): boolean {
  if (!props.activeItemId) return false
  
  if (item.type === 'table' && props.activeItemType === 'table') {
    return item.targetId === props.activeItemId
  }
  if (item.type === 'view' && props.activeItemType === 'view') {
    return item.targetId === props.activeItemId
  }
  if (item.type === 'dashboard' && props.activeItemType === 'dashboard') {
    return item.targetId === props.activeItemId
  }
  
  return false
}

// Check if a folder contains the active item
function folderContainsActive(item: NavItem): boolean {
  if (item.type !== 'folder' || !item.children) return false
  
  for (const child of item.children) {
    if (isItemActive(child)) return true
    if (child.type === 'folder' && folderContainsActive(child)) return true
  }
  
  return false
}

// Handle add item from folder
function handleAddItem(parentId: string | null, itemType: NavItemType) {
  emit('addItem', parentId, itemType)
}

// Handle add at root level
function handleAddRoot() {
  emit('addItem', null, 'folder')
}

// Debounce timer for consolidating rapid updates
let updateTimer: ReturnType<typeof setTimeout> | null = null

// Handle drag start
function handleDragStart() {
  isDragging.value = true
}

// Handle drag end
function handleDragEnd() {
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

// Handle root-level drag change (when items are dropped at root)
function handleRootDragChange() {
  isDragging.value = true
  scheduleNavigationUpdate()
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

// Handle folder children change (from nested draggable)
function handleFolderChange(parentId: string, children: NavItem[]) {
  // Mark as dragging to prevent watcher from re-syncing during update
  isDragging.value = true
  
  // Update the children in our local navigation tree
  updateFolderChildren(localNavigation.value, parentId, children)
  scheduleNavigationUpdate()
  
  // Reset dragging flag after a short delay
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

// Recursively update folder children
function updateFolderChildren(items: NavItem[], parentId: string, newChildren: NavItem[]): boolean {
  for (const item of items) {
    if (item.id === parentId && item.type === 'folder') {
      item.children = newChildren
      return true
    }
    if (item.type === 'folder' && item.children) {
      if (updateFolderChildren(item.children, parentId, newChildren)) {
        return true
      }
    }
  }
  return false
}

// Schedule a debounced navigation update
function scheduleNavigationUpdate() {
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  updateTimer = setTimeout(() => {
    emitNavigationUpdate()
    updateTimer = null
  }, 50) // Small delay to consolidate rapid changes
}

// Emit the updated navigation
function emitNavigationUpdate() {
  emit('updateNavigation', JSON.parse(JSON.stringify(localNavigation.value)))
}

</script>

<template>
  <nav class="navigation-tree">
    <!-- Root-level dropzone - allows dropping items to move to root -->
    <draggable
      v-model="localNavigation"
      group="nav-items"
      item-key="id"
      handle=".nav-item__drag-handle"
      ghost-class="nav-item-ghost"
      drag-class="nav-item-drag"
      :animation="200"
      class="root-dropzone"
      @start="handleDragStart"
      @end="handleDragEnd"
      @change="handleRootDragChange"
    >
      <template #item="{ element: item }">
        <NavItemComponent
          :item="item"
          :depth="0"
          :is-active="isItemActive(item)"
          :is-expanded="item.type === 'folder' ? isFolderExpanded(item.id) : false"
          :contains-active="folderContainsActive(item)"
          :active-item-id="activeItemId"
          :active-item-type="activeItemType"
          @select="handleSelectItem"
          @toggle="handleToggleFolder"
          @add-item="handleAddItem"
          @change="handleFolderChange"
        />
      </template>
    </draggable>
    
    <!-- Add root folder button -->
    <div class="add-root-btn" @click="handleAddRoot">
      <el-icon :size="14"><Plus /></el-icon>
      <span>Add Folder</span>
    </div>
    
    <div v-if="navigationItems.length === 0" class="empty-nav">
      <span>No navigation items</span>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.navigation-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--app-space-xs);
}

.root-dropzone {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 20px;
  
  // Show visual feedback when items can be dropped
  &.sortable-ghost {
    opacity: 0.4;
  }
}

.empty-nav {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.add-root-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
  transition: all 0.15s ease;
  border: 1px dashed var(--el-border-color);
  
  &:hover {
    background-color: var(--el-fill-color-light);
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}
</style>
