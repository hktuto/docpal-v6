<script setup lang="ts">
import type { MenuItem } from '../../../utils/db/schema/workspaces'

interface Props {
  item: MenuItem
  isAdmin: boolean
}

const props = defineProps<Props>()

const {menuState, toggleFolder, startEdit, saveEdit, cancelEdit, navigateToItem, openMenuItemActions, workspaceRouteParams, getMenuIcon} = useSingleWorkspaceContext()

const isHovered = ref(false)

const isSelected = computed(() => workspaceRouteParams.value.detailId === props.item.id)

// Check if this item is being edited
const isEditing = computed(() => menuState.value.editingItemId === props.item.id)

// Check if this folder is expanded
const isExpanded = computed(() => {
  if (props.item.type !== 'folder') return false
  return menuState.value.expandedFolders.has(props.item.id)
})



// Toggle folder expand/collapse
function handleToggle() {
  if (props.item.type === 'folder') {
    toggleFolder(props.item.id)
  }
}

// Handle double click on label to edit (admin only)
function handleLabelDoubleClick() {
  if (props.isAdmin && !isEditing.value) {
    startEdit(props.item.id)
  }
}

// Handle item click - navigate to the item
function handleItemClick() {
  setTimeout(() => {
    if(isEditing.value)return;
    navigateToItem(props.item)
  }, 100)
}
const itemContentRef = ref<HTMLElement>()
// Handle actions menu
function handleActionsClick(event: MouseEvent) {
  event.stopPropagation()
  openMenuItemActions({item: props.item, isAdmin: props.isAdmin}, event.currentTarget as HTMLElement, itemContentRef.value as HTMLElement)
  // actionsPopover.value?.open(event.currentTarget as HTMLElement, itemContentRef.value as HTMLElement)
}

// Handle save from label editor
async function handleSaveEdit(newLabel: string) {
  await saveEdit(props.item.id, newLabel)
}

const calItemIcon = computed(() => {
  return getMenuIcon(props.item)
})

// Handle cancel from label editor
function handleCancelEdit() {
  cancelEdit()
}
</script>

<template>
  <div
    class="menu-item"
    :class="{ 'is-folder': item.type === 'folder', 'is-expanded': isExpanded, 'is-selected': isSelected }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div ref="itemContentRef" class="item-content" @click="handleItemClick">
      <!-- Drag Handle (admin only, shown on hover) -->
      <div
        v-if="isAdmin"
        class="drag-handle"
        :class="{ visible: isHovered }"
        @mousedown.stop
        @click.stop
      >
        <Icon name="material-symbols:drag-indicator"  />
      </div>



      <!-- Item Icon -->
      <div class="item-icon">
        <Icon :name="calItemIcon"  />
      </div>
      <!-- Label or Label Editor -->
      <div class="item-label" @dblclick.stop="handleLabelDoubleClick">
        <WorkspacesMenuLabelEditor
          v-if="isEditing"
          :model-value="item.label"
          @save="handleSaveEdit"
          @cancel="handleCancelEdit"
        />
        <span v-else class="label-text">{{ item.label }}</span>
      </div>

      <!-- Actions Menu (shown on hover) -->
      <div v-if="isAdmin" class="item-actions" :class="{ visible: isHovered }">
        <el-button
          text
          circle
          size="small"
          @click="handleActionsClick"
        >
          <Icon name="material-symbols:more-horiz" size="16" />
        </el-button>
      </div>
            <!-- Expand/Collapse Icon (folders only) -->
      <div
        v-if="item.type === 'folder'"
        class="expand-icon"
        @click.stop="handleToggle"
      >
        <Icon
          :name="isExpanded ? 'material-symbols:expand-more' : 'material-symbols:chevron-right'"
          size="18"
        />
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
.menu-item {
  position: relative;
  user-select: none;
  &.is-selected {
    background: var(--app-primary-alpha-30);
    box-shadow: var(--app-shadow-s);
  }
}

.item-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.drag-handle {
  position: absolute;
  left:-4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--app-text-color-secondary);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.visible {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    color: var(--app-text-color-primary);
  }
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
  flex-shrink: 0;
}

.item-label {
  flex: 1;
  min-width: 0;
  font-size: var(--app-font-size-s);
}

.label-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.visible {
    opacity: 1;
  }
}

// Folder-specific styles
.menu-item.is-folder {
  .item-icon {
    color: var(--el-color-warning);
  }
}
</style>

