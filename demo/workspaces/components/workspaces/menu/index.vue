<script setup lang="ts">
import type { CaseFieldRecord } from '../../../utils/db/schema/newTableSchema'
import { ElMessage } from 'element-plus'

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

const { menuState: state, openMenuItemActions, getMenuFromDb, workspace } = useSingleWorkspaceContext()
const { importExcelFile } = useImportBatch()

// File upload input ref
const fileInputRef = ref<HTMLInputElement>()

// Dialog refs for handling updates
const importToTableDialogRef = ref()

// Pending duplicates for sequential update processing
const pendingDuplicates = ref<DuplicateSheetInfo[]>([])
const tablesUpdated = ref<{ id: string; name: string }[]>([])

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
    const excelFile = files.find(isExcelFile)
    if (excelFile && workspace.value?.id) {
      const result = await importExcelFile(excelFile, workspace.value.id, null)
      if (result.action === 'update' && result.duplicateSheets && result.duplicateSheets.length > 0) {
        handleDuplicateUpdates(excelFile, result.duplicateSheets)
      }
    }
  }
})

async function handleFolderDrop(folderId: string, file: File) {
  if (workspace.value?.id) {
    const result = await importExcelFile(file, workspace.value.id, folderId)
    
    // If update action, open dialog to handle duplicate updates
    if (result.action === 'update' && result.duplicateSheets && result.duplicateSheets.length > 0) {
      handleDuplicateUpdates(file, result.duplicateSheets)
    }
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
    const result = await importExcelFile(file, workspace.value.id, null)
    
    // If update action, open dialog to handle duplicate updates
    if (result.action === 'update' && result.duplicateSheets && result.duplicateSheets.length > 0) {
      handleDuplicateUpdates(file, result.duplicateSheets)
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
 * Handle duplicate updates by opening ImportToTableDialog for each duplicate
 */
function handleDuplicateUpdates(file: File, duplicates: DuplicateSheetInfo[]) {
  pendingDuplicates.value = [...duplicates]
  tablesUpdated.value = []
  
  ElMessage.info(`Updating ${duplicates.length} existing table(s)...`)
  processNextDuplicate()
}

/**
 * Process the next duplicate by opening ImportToTableDialog
 */
async function processNextDuplicate() {
  if (pendingDuplicates.value.length === 0) {
    // All duplicates processed
    if (tablesUpdated.value.length > 0) {
      ElMessage.success(`${tablesUpdated.value.length} table(s) updated successfully`)
    }
    return
  }

  const duplicate = pendingDuplicates.value[0]
  console.log('[ImportToTableDialog] Processing duplicate:', duplicate)
  try {
    // Get table fields for the existing table
    const fields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1`,
      [duplicate.existingTableId]
    )
    console.log('[ImportToTableDialog] Got fields:', fields.length)
    // Get physical table name (stored as "tableName" in DB)
    const tableData = await query<{ tableName: string }>(
      `SELECT "tableName" FROM case_tables WHERE id = $1`,
      [duplicate.existingTableId]
    )
    console.log('[ImportToTableDialog] Got table data:', tableData.length)
    if (tableData.length === 0) {
      console.error('Table not found:', duplicate.existingTableId)
      pendingDuplicates.value.shift()
      processNextDuplicate()
      return
    }

    // Open the import dialog for this duplicate with pre-loaded data
    importToTableDialogRef.value?.openWithSheetData(
      duplicate.rows,
      duplicate.headers,
      {
        physicalTableName: ref(tableData[0].tableName),
        fields: ref(fields),
        query,
        tableDisplayName: duplicate.existingTableName,
        tableIdValue: duplicate.existingTableId
      }
    )
  } catch (error) {
    console.error('Error preparing duplicate update:', error)
    pendingDuplicates.value.shift()
    processNextDuplicate()
  }
}

/**
 * Handle completion of a table update from ImportToTableDialog
 */
function handleUpdateComplete(result: any) {
  const duplicate = pendingDuplicates.value.shift()
  
  if (duplicate && (result.inserted > 0 || result.updated > 0)) {
    tablesUpdated.value.push({
      id: duplicate.existingTableId,
      name: duplicate.existingTableName
    })
  }
  
  // Process next duplicate
  if (pendingDuplicates.value.length > 0) {
    setTimeout(() => processNextDuplicate(), 300)
  } else if (tablesUpdated.value.length > 0) {
    ElMessage.success(`${tablesUpdated.value.length} table(s) updated successfully`)
  }
}

/**
 * Handle close of ImportToTableDialog (skip this duplicate)
 */
function handleUpdateClose() {
  pendingDuplicates.value.shift()
  
  if (pendingDuplicates.value.length > 0) {
    setTimeout(() => processNextDuplicate(), 300)
  } else if (tablesUpdated.value.length > 0) {
    ElMessage.success(`${tablesUpdated.value.length} table(s) updated successfully`)
  }
}

// Expose for child components
provide('handleFolderDrop', handleFolderDrop)
provide('isExcelFile', isExcelFile)

const { saveMenuItemToDb } = useSingleWorkspaceContext()

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
      <WorkspacesMenuDraggableList v-else v-model="state.items" :level="0" :parent-id="null" :is-admin="isAdmin" @dragover.stop @dragenter.stop @drop.stop />
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
    <WorkspacesDialogsImportToTableDialog
      ref="importToTableDialogRef"
      @complete="handleUpdateComplete"
      @close="handleUpdateClose"
    />
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
