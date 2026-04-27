<script lang="ts" setup>
import type { NavItem, NavItemType } from '../../types/database'
import { Plus, ArrowRight, Rank, Folder, FolderOpened, Grid, Postcard, DataAnalysis, Document} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const props = defineProps<{
  item: NavItem
  depth: number
  isActive: boolean
  isExpanded: boolean
  containsActive: boolean
  activeItemId?: string
  activeItemType?: 'table' | 'view' | 'dashboard'
  isDragging?: boolean
}>()

const emit = defineEmits<{
  select: [item: NavItem]
  toggle: [folderId: string]
  addItem: [parentId: string, itemType: NavItemType]
  change: [parentId: string, children: NavItem[]]
}>()

// Local copy of children for draggable
const localChildren = ref<NavItem[]>([])

// Track if we're currently dragging to avoid resync during drag
const isDraggingInternal = ref(false)

// Sync local children with prop - only when not actively dragging
watch(() => props.item.children, (newChildren) => {
  // Skip if we're in the middle of a drag operation
  if (isDraggingInternal.value) return
  
  // Deep sync - always update when prop changes
  localChildren.value = newChildren ? [...newChildren] : []
}, { immediate: true, deep: true })

// Icon mapping based on item type and custom icon
const itemIcon = computed(() => {

  
  // Default icons by type
  switch (props.item.type) {
    case 'folder':
      return props.isExpanded ? FolderOpened : Folder
    case 'table':
      return Grid
    case 'view':
      return Postcard
    case 'dashboard':
      return DataAnalysis
    default:
      return Document
  }
})

// Add menu visibility
const showAddMenu = ref(false)

// Add menu options
const addMenuOptions = [
  { type: 'folder' as NavItemType, label: 'Add Folder', icon: 'Folder' },
  { type: 'table' as NavItemType, label: 'Add Table', icon: 'Grid' },
  { type: 'view' as NavItemType, label: 'Add View', icon: 'View' },
  { type: 'dashboard' as NavItemType, label: 'Add Dashboard', icon: 'DataAnalysis' }
]

// Handle click on item
function handleClick() {
  // For folders, clicking the row navigates to the folder view
  // (no longer toggles expand/collapse)
  emit('select', props.item)
}

// Handle folder toggle (arrow click only - prevents navigation)
function handleToggle(e: Event) {
  e.stopPropagation()
  emit('toggle', props.item.id)
}

// Handle add menu item click
function handleAddMenuItem(itemType: NavItemType) {
  emit('addItem', props.item.id, itemType)
  showAddMenu.value = false
}

// Check if child is active
function isChildActive(child: NavItem): boolean {
  if (!props.activeItemId) return false
  
  if (child.type === 'table' && props.activeItemType === 'table') {
    return child.targetId === props.activeItemId
  }
  if (child.type === 'view' && props.activeItemType === 'view') {
    return child.targetId === props.activeItemId
  }
  if (child.type === 'dashboard' && props.activeItemType === 'dashboard') {
    return child.targetId === props.activeItemId
  }
  
  return false
}

// Check if a folder child contains active item
function childContainsActive(child: NavItem): boolean {
  if (child.type !== 'folder' || !child.children) return false
  
  for (const grandchild of child.children) {
    if (isChildActive(grandchild)) return true
    if (grandchild.type === 'folder' && childContainsActive(grandchild)) return true
  }
  
  return false
}

// Track expanded state for child folders locally
const childExpandedState = ref<Record<string, boolean>>({})

function isChildExpanded(childId: string): boolean {
  return childExpandedState.value[childId] ?? false
}

function handleChildToggle(folderId: string) {
  childExpandedState.value[folderId] = !childExpandedState.value[folderId]
  emit('toggle', folderId)
}

// Handle child add item
function handleChildAddItem(parentId: string, itemType: NavItemType) {
  emit('addItem', parentId, itemType)
}

// Handle drag start
function handleDragStart() {
  isDraggingInternal.value = true
}

// Handle drag end
function handleDragEnd() {
  isDraggingInternal.value = false
}

// Handle draggable change - this fires when items are added/removed/moved
function handleDragChange() {
  // Emit the updated children for this folder
  emit('change', props.item.id, [...localChildren.value])
}

// Handle child folder change (propagate up)
function handleChildChange(parentId: string, children: NavItem[]) {
  emit('change', parentId, children)
}
</script>

<template>
  <div 
    class="nav-item-wrapper"
    :class="{ 'nav-item-wrapper--dragging': isDragging }"
  >
    <!-- The clickable item -->
    <div
      class="nav-item"
      :class="{
        'nav-item--active': isActive,
        'nav-item--folder': item.type === 'folder',
        'nav-item--contains-active': containsActive,
        [`nav-item--depth-${depth}`]: true
      }"
      :style="{ paddingLeft: `${12 + depth * 16}px` }"
      @click="handleClick"
    >
      <!-- 1. Drag handle -->
      <span class="nav-item__drag-handle">
        <el-icon :size="12"><Rank /></el-icon>
      </span>
      
      <!-- 2. Item icon -->
      <el-icon class="nav-item__icon" :size="16">
        <component :is="itemIcon" />
      </el-icon>
      
      <!-- 3. Label (name) with tooltip -->
      <el-tooltip
        :content="item.label"
        placement="right"
        :disabled="item.label.length < 20"
        :show-after="300"
      >
        <span class="nav-item__label">{{ item.label }}</span>
      </el-tooltip>
      
      <!-- Type indicator for views -->
      <span v-if="item.type === 'view'" class="nav-item__type-badge">
        View
      </span>
      
      <!-- 4. Add button for folders (plus) -->
      <el-popover
        v-if="item.type === 'folder'"
        v-model:visible="showAddMenu"
        placement="bottom-start"
        :width="160"
        trigger="click"
        popper-class="nav-add-menu-popover"
      >
        <template #reference>
          <span
            class="nav-item__add-btn"
            @click.stop
          >
            <el-icon :size="14"><Plus /></el-icon>
          </span>
        </template>
        <div class="nav-add-menu" @click.stop>
          <div
            v-for="option in addMenuOptions"
            :key="option.type"
            class="nav-add-menu__item"
            @click.stop="handleAddMenuItem(option.type)"
          >
            <el-icon :size="14"><component :is="option.icon" /></el-icon>
            <span>{{ option.label }}</span>
          </div>
        </div>
      </el-popover>
      
      <!-- 5. Spacer -->
      <span class="nav-item__spacer"></span>
      
      <!-- 6. Folder expand/collapse arrow -->
      <span
        v-if="item.type === 'folder'"
        class="nav-item__arrow"
        :class="{ 'nav-item__arrow--expanded': isExpanded }"
        @click.stop="handleToggle"
      >
        <el-icon :size="12"><ArrowRight /></el-icon>
      </span>
    </div>
    
    <!-- Children (for folders) with drag and drop -->
    <Transition name="folder-expand">
      <div
        v-if="item.type === 'folder' && isExpanded"
        class="nav-item__children"
      >
        <draggable
          v-model="localChildren"
          group="nav-items"
          item-key="id"
          handle=".nav-item__drag-handle"
          ghost-class="nav-item-ghost"
          drag-class="nav-item-drag"
          :animation="200"
          class="nav-item__dropzone"
          :class="{ 'nav-item__dropzone--empty': localChildren.length === 0 }"
          @start="handleDragStart"
          @end="handleDragEnd"
          @change="handleDragChange"
        >
          <template #item="{ element: child }">
            <NavItemComponent
              :item="child"
              :depth="depth + 1"
              :is-active="isChildActive(child)"
              :is-expanded="child.type === 'folder' ? isChildExpanded(child.id) : false"
              :contains-active="childContainsActive(child)"
              :active-item-id="activeItemId"
              :active-item-type="activeItemType"
              @select="emit('select', $event)"
              @toggle="handleChildToggle"
              @add-item="handleChildAddItem"
              @change="handleChildChange"
            />
          </template>
        </draggable>
        
        <!-- Empty folder placeholder (visible when not dragging) -->
        <div v-if="localChildren.length === 0" class="nav-item__empty">
          <span>Drop items here</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.nav-item-wrapper {
  display: flex;
  flex-direction: column;
  
  &--dragging {
    opacity: 0.5;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--app-text-color);
  font-size: var(--app-font-size-s);
  user-select: none;
  position: relative;
  
  &:hover {
    background-color: var(--el-fill-color-light);
    
    .nav-item__drag-handle {
      opacity: 1;
    }
  }
  
  &--active {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
    
    .nav-item__icon {
      color: var(--el-color-primary);
    }
  }
  
  &--folder {
    font-weight: 500;
    
    &:hover {
      background-color: var(--el-fill-color);
    }
  }
  
  &--contains-active:not(.nav-item--active) {
    .nav-item__icon {
      color: var(--el-color-primary);
    }
  }
}

.nav-item__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  margin-right: -4px;
  color: var(--app-text-color-placeholder);
  opacity: 0;
  cursor: grab;
  transition: opacity 0.15s ease;
  
  &:active {
    cursor: grabbing;
  }
}

.nav-item__spacer {
  flex: 0 0 auto;
  width: 4px; // Minimal spacing between label and controls
}

.nav-item__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--app-border-radius-xs);
  color: var(--app-text-color-secondary);
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background-color: var(--el-fill-color);
  }
  
  &--expanded {
    transform: rotate(90deg);
  }
}

.nav-item__icon {
  flex-shrink: 0;
  color: var(--app-text-color-secondary);
}

.nav-item__label {
  flex: 1 1 auto;
  min-width: 0; // Important for flex text truncation
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item__type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: var(--el-fill-color);
  color: var(--app-text-color-secondary);
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.nav-item__add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--app-border-radius-xs);
  color: var(--app-text-color-placeholder);
  flex-shrink: 0;
  transition: all 0.15s ease;
  
  &:hover {
    background-color: var(--el-fill-color);
    color: var(--el-color-primary);
  }
}

.nav-item__children {
  display: flex;
  flex-direction: column;
}

.nav-item__dropzone {
  min-height: 4px;
  
  &--empty {
    min-height: 32px;
  }
}

.nav-item__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  margin-left: 24px;
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-xs);
  font-style: italic;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--app-border-radius-s);
  pointer-events: none;
}

// Folder expand animation
.folder-expand-enter-active,
.folder-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.folder-expand-enter-from,
.folder-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.folder-expand-enter-to,
.folder-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>

<style lang="scss">
// Global styles for add menu popover and drag states
.nav-add-menu-popover {
  padding: 4px !important;
}

.nav-add-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--app-border-radius-s);
    cursor: pointer;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color);
    transition: all 0.15s ease;
    
    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }
  }
}

// Global drag ghost and drag classes (needs to be global for vuedraggable)
.nav-item-ghost {
  opacity: 0.4;
  background-color: var(--el-color-primary-light-8) !important;
  border-radius: var(--app-border-radius-s);
  
  > .nav-item {
    background-color: transparent;
  }
}

.nav-item-drag {
  background-color: var(--app-paper);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: var(--app-border-radius-s);
}
</style>
