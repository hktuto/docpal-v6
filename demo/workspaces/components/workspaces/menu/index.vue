<script setup lang="ts">
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import { useSingleWorkspaceContext } from '../../../composables/useSingleWorkspace'
import { useImportBatch, isExcelFile } from '../../../composables/useImportBatch'

interface Props {
  workspaceId: string
  initialMenu: MenuItem[]
  isAdmin: boolean
}

const props = withDefaults(defineProps<Props>(), {
  workspaceId: '',
  initialMenu: [] as any,
  isAdmin: true,
})

const { menuState: state, addItem, saveMenuToDb, getMenuFromDb, workspace } = useSingleWorkspaceContext()
const { importExcelFile } = useImportBatch()

// Excel drop import
const isDraggingOver = ref(false)

function handleDragOver(event: DragEvent) {
  if (!props.isAdmin) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // Check if dragging files
  if (event.dataTransfer?.types.includes('Files')) {
    isDraggingOver.value = true
    event.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  // Only set to false if leaving the container entirely
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDraggingOver.value = false
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
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

async function handleFolderDrop(folderId: string, file: File) {
  if (workspace.value?.id) {
    await importExcelFile(file, workspace.value.id, folderId)
  }
}

// Expose for child components
provide('handleFolderDrop', handleFolderDrop)
provide('isExcelFile', isExcelFile)



const debouncedSave = useDebounceFn(async (menu: MenuItem[]) => {
  await saveMenuToDb()
}, 1000)
// Helper: Update order numbers
function updateOrderNumbers(items: MenuItem[]): MenuItem[] {
  return items.map((item, index) => ({
    ...item,
    order: index,
    children: item.children ? updateOrderNumbers(item.children) : undefined,
  }))
}




// Handle menu changes from draggable list (v-model update)
async function handleMenuChange(newItems: MenuItem[]) {
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
</script>

<template>
  <div 
    class="workspace-menu"
    :class="{ 'is-drag-over': isDraggingOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Drop Overlay -->
    <Transition name="fade">
      <div v-if="isDraggingOver && isAdmin" class="drop-overlay">
        <div class="drop-content">
          <Icon name="material-symbols:upload-file-outline" size="48" />
          <p>Drop Excel file to import tables</p>
        </div>
      </div>
    </Transition>

    <!-- Menu Content -->
    <div class="menu-content">
      <!-- Empty State -->
      <div v-if="state.items.length === 0" class="empty-state">
        <Icon name="material-symbols:folder-open-outline" size="48" />
        <p class="empty-title">No items yet</p>
        <p class="empty-description">
          {{ isAdmin ? 'Click + to add your first table, or drop an Excel file' : 'No items to display' }}
        </p>
      </div>

      <!-- Draggable Menu Items -->
      <WorkspacesMenuDraggableList
        v-else
        v-model="state.items"
        :level="0"
        :parent-id="null"
        :is-admin="isAdmin"
        @update:model-value="handleMenuChange"
      />
    </div>

    <slot/>
  </div>
</template>

<style scoped lang="scss">
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
    font-size: var(--app-font-size-m);
    font-weight: 500;
  }

  .empty-description {
    margin: 0;
    font-size: var(--app-font-size-s);
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
