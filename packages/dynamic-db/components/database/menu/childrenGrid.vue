<script setup lang="ts">
import type { TreeItem } from '#imports'

interface Props {
  children: TreeItem[]
}

defineProps<Props>()

const { selectMenuItem, getMenuIcon } = useSingleDatabaseContext()

// Use the parent's handleFolderDrop which handles update flow
const handleFolderDrop = inject<(folderId: string, file: File) => Promise<void>>('handleFolderDrop')
const injectedIsExcelFile = inject<(file: File) => boolean>('isExcelFile', () => isExcelFile)

// Track drag state for each child card
const dragStates = ref<Record<string, boolean>>({})

function getChildIcon(child: TreeItem) {
  return getMenuIcon(child)
}

// Handle drag over for folder cards
function handleDragOver(event: DragEvent, child: TreeItem) {
  if (child.item_type !== 'folder') return

  event.preventDefault()
  event.stopPropagation()

  // Check if dragging files
  if (event.dataTransfer?.types.includes('Files')) {
    dragStates.value[child.id] = true
    event.dataTransfer.dropEffect = 'copy'
  }
}

// Handle drag leave for folder cards
function handleDragLeave(event: DragEvent, child: TreeItem) {
  if (child.item_type !== 'folder') return

  event.preventDefault()
  event.stopPropagation()

  // Reset drag state when leaving
  dragStates.value[child.id] = false
}

// Handle drop on folder cards
async function handleDrop(event: DragEvent, child: TreeItem) {
  if (child.item_type !== 'folder') return

  event.preventDefault()
  event.stopPropagation()
  dragStates.value[child.id] = false

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  // Find Excel file
  const excelFile = Array.from(files).find((f) => injectedIsExcelFile(f))
  if (excelFile && handleFolderDrop) {
    // Use parent's handler which manages update flow
    await handleFolderDrop(child.id, excelFile)
  }

  // Prevent click event from firing after drop
  event.stopImmediatePropagation()
}
</script>

<template>
  <div class="children-grid">
    <div
      v-for="child in children"
      :key="child.id"
      class="child-card"
      :class="{
        'is-folder': child.item_type === 'folder',
        'is-drag-over': dragStates[child.id]
      }"
      @click="selectMenuItem(child)"
      @dragover="(event) => handleDragOver(event, child)"
      @dragleave="(event) => handleDragLeave(event, child)"
      @drop="(event) => handleDrop(event, child)"
      @dragenter.prevent
    >
      <!-- Drop Overlay -->
      <Transition name="fade">
        <div v-if="dragStates[child.id] && child.item_type === 'folder'" class="drop-overlay">
          <div class="drop-content">
            <Icon name="material-symbols:upload-file-outline" size="32" />
            <p>Drop Excel file to import tables</p>
          </div>
        </div>
      </Transition>

      <div class="child-icon">
        <Icon :name="getChildIcon(child)" />
      </div>
      <div class="child-label">
        {{ child.name }}
      </div>
      <p class="child-description">
        {{ child.description }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--app-space-m);
}

.child-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--app-space-s);
  padding: var(--app-space-s);
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--app-primary-color);
  }

  &.is-folder.is-drag-over {
    border: 2px dashed var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.child-icon {
  font-size: var(--app-font-size-xxl);
}

.child-label {
  font-size: var(--app-font-size-l);
  font-weight: bold;
}

.child-description {
  margin: 0;
  color: var(--el-text-color-regular);
}

// Drop overlay
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  border-radius: var(--app-space-s);
  pointer-events: none;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-xs);
  color: var(--el-color-primary);
  text-align: center;
  padding: var(--app-space-m);

  p {
    margin: 0;
    font-size: var(--app-font-size-s);
    font-weight: 500;
  }
}

// Transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
