<script setup lang="ts">
import { useImportBatch, isExcelFile } from '../../../composables/import/useImportBatch'
import { startPreUploadAnalysis } from '../../../composables/import/useImportRelationAnalysis'
import { useMenuDrag } from '../../../composables/menu/useMenuDrag'
import { ElMessage } from 'element-plus'

interface Props {
  workspaceId: string
  initialMenu?: TreeItem[]
  isAdmin: boolean
}

const props = withDefaults(defineProps<Props>(), {
  workspaceId: '',
  initialMenu: [] as any,
  isAdmin: false
})

const { menuState: state, openMenuItemActions, getMenuFromDb, database } = useSingleDatabaseContext()
const { importExcelFile, initData } = useImportBatch()

// File upload input ref
const fileInputRef = ref<HTMLInputElement>()


// Pending duplicates for sequential update processing
const pendingDuplicates = ref<DuplicateSheetInfo[]>([])
const tablesUpdated = ref<{ id: string; name: string }[]>([])
const menuLoading = ref(false);
// 菜单区域拖放：状态与事件封装在 useMenuDrag 中
const {
  isDraggingOver,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd
} = useMenuDrag({
  enabled: computed(() => props.isAdmin),
  onDrop: async (files) => {
    if(!props.isAdmin) return
    menuLoading.value = true
    try {

    const excelFile = files.find(isExcelFile)
    initData({ entityId: database.value?.id })
    if (excelFile && database.value?.id) {
      startPreUploadAnalysis(excelFile, database.value.id)
      const result = await importExcelFile(excelFile)
      await getMenuFromDb()
    }
    } catch (e) {

    } finally {
      menuLoading.value = false
    }
  }
})


async function handleFolderDrop(folderId: string, file: File) {
  if (database.value?.id) {
    try{
      menuLoading.value = true
      initData({ entityId: database.value?.id, parentFolderId:folderId })
      startPreUploadAnalysis(file, database.value.id)
      const result = await importExcelFile(file)

    }catch(e){

    }finally{
      menuLoading.value = false
    }

  }
}

// Handle file input change
async function handleFileInputChange(event: Event) {
  if (!props.isAdmin) return

  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0 || !database.value?.id) return

  const file = files[0]

  if (isExcelFile(file)) {
     menuLoading.value = true
    try {

    initData({ entityId: database.value?.id })
    startPreUploadAnalysis(file, database.value?.id)
    const result = await importExcelFile(file)
    console.log("result", result)
    if (result.hasErrorReport) {

    } else {

    }
     await getMenuFromDb()
    } catch (e) {

    } finally {
       menuLoading.value = false
    }
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



/**
 * Handle close of ImportToTableDialog (skip this duplicate)
 */
function handleUpdateClose() {
  pendingDuplicates.value.shift()

}

// Expose for child components
provide('handleFolderDrop', handleFolderDrop)
provide('isExcelFile', isExcelFile)



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
  openMenuItemActions({ item: null, isAdmin: true }, editIconRef.value.$el || undefined)
}


onMounted(async () => {
  await getMenuFromDb()
})
</script>

<template>
  <div
    v-loading="menuLoading"
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
          <p style="text-align: center">Drop Excel file here to import tables</p>
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
      <DatabaseMenuDraggableList v-else v-model="state.items" :level="0" :parent-id="null" :is-admin="isAdmin" @dragover.stop @dragenter.stop @drop.stop />
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

    <!-- Import To Table Dialog for updating existing tables -->

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
  position: relative;
  overflow: hidden;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: var(--el-color-primary-light-9); */
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


.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s);

  &.is-hidden {
    /* opacity: 0.3; */
    /* pointer-events: none; */
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
    white-space: normal;
    word-break: break-all;
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
