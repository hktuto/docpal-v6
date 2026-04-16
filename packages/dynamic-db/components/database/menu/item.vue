<script setup lang="ts">
import type { TreeItem } from '../../../composables/workspace/useSingleDatabase'

interface Props {
  item: TreeItem
  isAdmin: boolean
}

const props = defineProps<Props>()

const { menuState, startEdit, saveEdit, cancelEdit, navigateToItem, openMenuItemActions, databaseMenuRouteParams, getMenuIcon } = useSingleDatabaseContext()

const isHovered = ref(false)
const isDragOver = ref(false)

// Inject drop handlers from parent menu
const handleFolderDrop = inject<(folderId: string, file: File) => Promise<void>>('handleFolderDrop')
const isExcelFile = inject<(file: File) => boolean>('isExcelFile')

const isSelected = computed(() => databaseMenuRouteParams.value.detailId === props.item.id)

// Check if this item is being edited
const isEditing = computed(() => menuState.value.editingItemId === props.item.id)


const itemContentRef = ref<HTMLElement>()
// Handle actions menu
function handleActionsClick(event: MouseEvent) {
  event.stopPropagation()
  openMenuItemActions({ item: props.item, isAdmin: props.isAdmin }, event.currentTarget as HTMLElement, itemContentRef.value as HTMLElement)
  // actionsPopover.value?.open(event.currentTarget as HTMLElement, itemContentRef.value as HTMLElement)
}

// Handle save from label editor
async function handleSaveEdit(newLabel: string) {
  console.log('handleSaveEdit', JSON.stringify(props.item), props.item.id, newLabel)
  const success = await saveEdit(props.item, newLabel)
  if (success) {
    props.item.name = newLabel
    nextTick(() => {
      navigateToItem(props.item)
    })
  }
}

const calItemIcon = computed(() => {
  return getMenuIcon(props.item)
})

// Handle cancel from label editor
function handleCancelEdit() {
  cancelEdit()
}

// Folder drop handlers
function onFolderDragOver(event: DragEvent) {
  if (props.item.item_type !== 'folder' || !props.isAdmin) return
  // console.log('onFolderDragOver', event)
  event.preventDefault()
  event.stopPropagation()

  if (event.dataTransfer?.types.includes('Files')) {
    isDragOver.value = true
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onFolderDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  // Check if we're leaving the folder element
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  // Only reset if leaving the element boundaries
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false
  }
}

async function onFolderDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  if (props.item.item_type !== 'folder' || !props.isAdmin) return

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  // Find Excel file
  const excelFile = Array.from(files).find((f) => isExcelFile?.(f))
  if (excelFile && handleFolderDrop) {
    await handleFolderDrop(props.item.id, excelFile)
  }
}
</script>

<template>
  <div
    class="menu-item"
    :class="{
      'is-folder': item.item_type === 'folder',
      'is-selected': isSelected,
      'is-drag-over': isDragOver
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @dragover="onFolderDragOver"
    @dragleave="onFolderDragLeave"
    @drop="onFolderDrop"
    @dragenter.prevent
    @dragstart.prevent
  >
    <div ref="itemContentRef" class="item-content">
      <div class="item-icon">
        <Icon :name="calItemIcon" />
      </div>
      <div class="item-label">
        <UiInlineEditor
          :model-value="item.name"
          :editing="isEditing"
          :editable="false"
          wrapper="span"
          @update:editing="(val) => (val ? startEdit(item.id) : cancelEdit())"
          @save="handleSaveEdit"
          @cancel="handleCancelEdit"
        />
      </div>
      <!-- Actions Menu (shown on hover) -->
      <div v-if="isAdmin && !isEditing" class="item-actions" :class="{ visible: isHovered }">
        <Icon name="material-symbols:more-vert" size="16" @click="handleActionsClick" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.menu-item {
  position: relative;
  user-select: none;
  flex: 1;
  overflow: hidden;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0px;
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drag-handle {
  position: absolute;
  left: -4px;
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
  font-size: var(--app-font-size-m);
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

// Drag over state for folders
.menu-item.is-folder.is-drag-over {
  .item-content {
    background: var(--el-color-primary-light-9);
    border: 1px dashed var(--el-color-primary);
    border-radius: var(--app-border-radius-s);
  }

  .item-icon {
    color: var(--el-color-primary);
  }
}
</style>
