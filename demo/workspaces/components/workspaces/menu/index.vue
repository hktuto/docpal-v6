<script setup lang="ts">
import type { TreeItem } from '../../../composables/useSingleWorkspace'
import { useSingleWorkspaceContext } from '../../../composables/useSingleWorkspace'
import { useImportBatch, isExcelFile } from '../../../composables/useImportBatch'
import { ElMessage } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'
import { onUnmounted } from 'vue'

interface Props {
  workspaceId: string
  initialMenu?: TreeItem[]
  isAdmin: boolean
}

const props = withDefaults(defineProps<Props>(), {
  workspaceId: '',
  initialMenu: [] as any,
  isAdmin: true
})

const { menuState: state, addItem, openMenuItemActions, getMenuFromDb, workspace } = useSingleWorkspaceContext()
const { importExcelFile } = useImportBatch()

// File upload input ref
const fileInputRef = ref<HTMLInputElement>()

// Excel drop import
const isDraggingOver = ref(false)
const dragLeaveTimeout = ref<NodeJS.Timeout | null>(null)

function handleDragOver(event: DragEvent) {
  if (!props.isAdmin) return

  event.preventDefault()
  event.stopPropagation()

  // Check if dragging files
  if (event.dataTransfer?.types.includes('Files')) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragEnter(event: DragEvent) {
  if (!props.isAdmin) return

  event.preventDefault()
  event.stopPropagation()

  // Check if dragging files
  if (event.dataTransfer?.types.includes('Files')) {
    // Clear any pending drag leave timeout
    if (dragLeaveTimeout.value) {
      clearTimeout(dragLeaveTimeout.value)
      dragLeaveTimeout.value = null
    }

    isDraggingOver.value = true
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  // Use a timeout to debounce drag leave
  // This prevents flickering when moving between child elements
  if (dragLeaveTimeout.value) {
    clearTimeout(dragLeaveTimeout.value)
  }

  dragLeaveTimeout.value = setTimeout(() => {
    isDraggingOver.value = false
    dragLeaveTimeout.value = null
  }, 100)
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  // Clear any pending drag leave timeout
  if (dragLeaveTimeout.value) {
    clearTimeout(dragLeaveTimeout.value)
    dragLeaveTimeout.value = null
  }

  // Reset drag state
  isDraggingOver.value = false

  if (!props.isAdmin) return

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  // Find Excel files
  const excelFile = Array.from(files).find(isExcelFile)
  if (excelFile && workspace.value?.id) {
    // Directly import without dialog
    await importExcelFile(excelFile, workspace.value.id, null)
  }
}

// Handle drag end (when drag operation is completed)
function handleDragEnd() {
  // Clear any pending drag leave timeout
  if (dragLeaveTimeout.value) {
    clearTimeout(dragLeaveTimeout.value)
    dragLeaveTimeout.value = null
  }

  // Reset drag state when drag operation ends
  isDraggingOver.value = false
}

async function handleFolderDrop(folderId: string, file: File) {
  if (workspace.value?.id) {
    await importExcelFile(file, workspace.value.id, folderId)
  }
}

// Handle file input change
async function handleFileInputChange(event: Event) {
  if (!props.isAdmin) return

  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0 || !workspace.value?.id) return

  const file = files[0]

  if (isExcelFile(file)) {
    await importExcelFile(file, workspace.value.id, null)
  } else {
    ElMessage.error('Please select an Excel file (.xlsx, .xls) or CSV file (.csv)')
  }

  // Reset the input so the same file can be selected again
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Trigger file input click
function triggerFileInput() {
  if (!props.isAdmin) return
  fileInputRef.value?.click()
}

// Expose for child components
provide('handleFolderDrop', handleFolderDrop)
provide('isExcelFile', isExcelFile)

const { saveMenuItemToDb } = useSingleWorkspaceContext()

const debouncedSave = useDebounceFn(async (items: TreeItem[]) => {
  // Save each item to the database
  for (const item of flattenTree(items)) {
    await saveMenuItemToDb(item)
  }
}, 1000)

// Helper: Flatten tree to array for saving
function flattenTree(items: TreeItem[], parentId: string | null = null): Partial<TreeItem>[] {
  const result: Partial<TreeItem>[] = []
  items.forEach((item, index) => {
    result.push({
      id: item.id,
      entityId: item.entityId,
      label: item.label,
      slug: item.slug,
      description: item.description,
      itemType: item.itemType,
      itemId: item.itemId,
      parentId: parentId,
      order: index
    })
    if (item.children && item.children.length > 0) {
      result.push(...flattenTree(item.children, item.id))
    }
  })
  return result
}

// Helper: Update order numbers
function updateOrderNumbers(items: TreeItem[]): TreeItem[] {
  return items.map((item, index) => ({
    ...item,
    order: index,
    children: item.children ? updateOrderNumbers(item.children) : undefined
  }))
}
const editIconRef = ref()
function handleOpenActions() {
  openMenuItemActions({ item: null, isAdmin: true }, editIconRef.value || undefined)
}
// Handle menu changes from draggable list (v-model update)
async function handleMenuChange(newItems: TreeItem[]) {
  console.log('[Menu] Menu changed from drag:', newItems.length, 'items')

  // Update order numbers
  const orderedMenu = updateOrderNumbers(newItems)
  state.value.items = orderedMenu

  // Debounced save to server
  debouncedSave(orderedMenu)
}

onMounted(async () => {
  await getMenuFromDb()
})

// Clean up timeout on unmount
onUnmounted(() => {
  if (dragLeaveTimeout.value) {
    clearTimeout(dragLeaveTimeout.value)
    dragLeaveTimeout.value = null
  }
})
</script>

<template>
  <div
    class="workspace-menu"
    :class="{ 'is-drag-over': isDraggingOver }"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragend="handleDragEnd"
  >
    <!-- Drop Overlay -->
    <Transition name="fade">
      <div v-if="isDraggingOver && isAdmin" class="drop-overlay">
        <div class="drop-content">
          <Icon name="material-symbols:upload-file-outline" size="48" />
          <p>Drop Excel file here to import tables</p>
        </div>
      </div>
    </Transition>

    <!-- Menu Content -->
    <div class="menu-content" :class="{ 'is-hidden': isDraggingOver && isAdmin }">
      <!-- Empty State -->
      <div v-if="state.items.length === 0" class="empty-state">
        <Icon name="material-symbols:folder-open-outline" size="48" />
        <p class="empty-title">No items yet</p>
        <p class="empty-description">
          <template v-if="isAdmin">
            Click <Icon ref="editIconRef" class="plusIcon" name="material-symbols:add" @click="handleOpenActions" /> to add your first table, or
            <strong class="excel-upload-link" @click="triggerFileInput">upload an Excel file</strong> (or drag and drop)
          </template>
          <template v-else> No items to display </template>
        </p>
      </div>

      <!-- Draggable Menu Items -->
      <WorkspacesMenuDraggableList v-else v-model="state.items" :level="0" :parent-id="null" :is-admin="isAdmin" @update:model-value="handleMenuChange" />
    </div>

    <!-- Hidden file input for Excel upload -->
    <input
      v-show="false"
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
      @change="handleFileInputChange"
    />

    <slot />
  </div>
</template>

<style scoped lang="scss">
.plusIcon {
  cursor: pointer;
  color: var(--app-primary-color);
}

.excel-upload-link {
  cursor: pointer;
  color: var(--app-primary-color);
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
  }
}
.workspace-menu {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  position: relative;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  border: 2px dashed var(--el-color-primary);
  border-radius: var(--app-border-radius-m);
  pointer-events: none;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-s);
  color: var(--el-color-primary);

  p {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 500;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s);

  &.is-hidden {
    opacity: 0.3;
    pointer-events: none;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl) var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-secondary);

  .empty-title {
    margin: var(--app-space-m) 0 var(--app-space-xs);
    font-size: var(--app-font-size-l);
    font-weight: 500;
  }

  .empty-description {
    margin: 0;
    font-size: var(--app-font-size-m);
    strong {
      color: var(--app-primary-color);
    }
  }
}

.add-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.add-menu-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  span {
    font-size: var(--app-font-size-s);
  }
}

.create-table-form {
  padding: var(--app-space-m);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  margin-top: var(--app-space-m);
}
</style>
