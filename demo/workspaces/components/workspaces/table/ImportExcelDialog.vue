<template>
  <el-dialog v-model="dialogVisible" title="Import from Excel" width="500px" :close-on-click-modal="false" :close-on-press-escape="!isImporting" @close="close">
    <div class="import-excel-dialog">
      <!-- Upload Section -->
      <div class="upload-section">
        <el-upload
          class="excel-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls,.csv"
          :disabled="isImporting"
        >
          <div class="upload-content">
            <el-icon v-if="isImporting" class="is-loading upload-icon">
              <Icon name="material-symbols:progress-activity" />
            </el-icon>
            <Icon v-else name="material-symbols:upload-file-outline" class="upload-icon" />
            <div class="upload-text">
              <p class="primary-text">{{ isImporting ? 'Importing...' : 'Drop your Excel file here' }}</p>
              <p class="secondary-text">or click to browse</p>
            </div>
            <p class="file-types">Supports .xlsx, .xls, .csv</p>
          </div>
        </el-upload>

        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="error-alert" />

        <!-- Import Progress -->
        <div v-if="isImporting" class="import-progress">
          <el-progress :percentage="importProgress" :status="importProgress === 100 ? 'success' : undefined" :show-text="false" />
          <p class="progress-text">Importing Excel file...</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close" :disabled="isImporting"> Cancel </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Import To Table Dialog for updating existing tables -->
  <WorkspacesDialogsImportToTableDialog
    ref="importToTableDialogRef"
    @complete="handleUpdateComplete"
    @close="handleUpdateClose"
  />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useImportBatch, isExcelFile, type DuplicateSheetInfo } from '../../../composables/useImportBatch'
import { useSingleWorkspaceContext } from '../../../composables/useSingleWorkspace'
import { usePglite } from '../../../composables/usePglite'
import type { CaseFieldRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  entityId?: string
  parentFolderId?: string | null
}>()

// Internal state for dynamic entityId and parentFolderId
const effectiveEntityId = ref<string>('')
const effectiveParentFolderId = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'success', tables: { id: string; name: string }[]): void
  (e: 'close'): void
}>()

const { workspace } = useSingleWorkspaceContext()
const { importExcelFile } = useImportBatch()
const { query } = usePglite()

const dialogVisible = ref(false)
const isImporting = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)
const importProgress = ref(0)

// Update existing tables state
const importToTableDialogRef = ref()
const pendingDuplicates = ref<DuplicateSheetInfo[]>([])
const tablesUpdated = ref<{ id: string; name: string }[]>([])

function open(entityId?: string, parentFolderId?: string | null) {
  // Use provided values or fall back to props
  effectiveEntityId.value = entityId || props.entityId || workspace.value?.id || ''
  effectiveParentFolderId.value = parentFolderId !== undefined ? parentFolderId : (props.parentFolderId ?? null)

  dialogVisible.value = true
  reset()
}

function openWithFile(file: File, entityId?: string, parentFolderId?: string | null) {
  // Use provided values or fall back to props
  effectiveEntityId.value = entityId || props.entityId || workspace.value?.id || ''
  effectiveParentFolderId.value = parentFolderId !== undefined ? parentFolderId : (props.parentFolderId ?? null)

  dialogVisible.value = true
  reset()

  // Process the file directly
  selectedFile.value = file
  errorMessage.value = ''

  // Validate file type immediately
  if (!isExcelFile(file)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
  }
}

function close() {
  console.log('[ImportExcelDialog] close() called, stack:', new Error().stack)
  dialogVisible.value = false
  reset()
  emit('close')
}

function reset() {
  selectedFile.value = null
  errorMessage.value = ''
  isImporting.value = false
  importProgress.value = 0
}

function handleFileChange(file: any) {
  selectedFile.value = file.raw
  errorMessage.value = ''
  console.log('handleFileChange', selectedFile.value)
  // Validate file type immediately
  if (selectedFile.value && !isExcelFile(selectedFile.value)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }
  handleImport()
}

async function handleImport() {
  console.log('[ImportExcelDialog] handleImport called, file:', selectedFile.value?.name, 'entityId:', effectiveEntityId.value, 'isImporting:', isImporting.value)
  if (!selectedFile.value || !effectiveEntityId.value || isImporting.value) return

  // Validate file type
  if (!isExcelFile(selectedFile.value)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }

  isImporting.value = true
  importProgress.value = 10 // Show some initial progress

  try {
    console.log('[ImportExcelDialog] Calling importExcelFile...')
    
    // Import the Excel file
    const result = await importExcelFile(selectedFile.value, effectiveEntityId.value, effectiveParentFolderId.value)

    console.log('[ImportExcelDialog] Import result received:', result)

    // Handle "Update Existing" action - open ImportToTableDialog for each duplicate
    if (result.action === 'update' && result.duplicateSheets && result.duplicateSheets.length > 0) {
      console.log('[ImportExcelDialog] Update action with duplicates:', result.duplicateSheets.length)
      importProgress.value = 50
      
      // Store duplicates to process sequentially
      pendingDuplicates.value = [...result.duplicateSheets]
      tablesUpdated.value = []
      
      // Show message about new tables created
      if (result.tablesCreated && result.tablesCreated.length > 0) {
        ElMessage.success(`${result.tablesCreated.length} new table(s) created. Now updating ${pendingDuplicates.value.length} existing table(s)...`)
      } else {
        ElMessage.info(`Updating ${pendingDuplicates.value.length} existing table(s)...`)
      }
      
      // Start processing the first duplicate
      processNextDuplicate(result.tablesCreated || [])
      return
    }

    importProgress.value = 100

    if (result.success) {
      // Show success message
      if (result.tablesCreated && result.tablesCreated.length > 0) {
        ElMessage.success(`${result.tablesCreated.length} table(s) imported successfully!`)
        emit('success', result.tablesCreated)
      } else if (result.action === 'skip') {
        ElMessage.info('Duplicate sheets skipped. No new tables created.')
        emit('success', [])
      } else {
        ElMessage.success('File imported successfully!')
      }

      // Close dialog after a brief delay
      setTimeout(() => {
        close()
      }, 1000)
    } else {
      // Handle import errors
      if (result.action === 'cancelled') {
        errorMessage.value = 'Import cancelled'
      } else if (result.error) {
        errorMessage.value = result.error
      } else {
        errorMessage.value = 'Failed to import Excel file'
      }

      isImporting.value = false
      importProgress.value = 0
    }
  } catch (error: any) {
    console.error('Error importing Excel file:', error)
    errorMessage.value = error.message || 'Failed to import Excel file'
    isImporting.value = false
    importProgress.value = 0
  }
}

/**
 * Process the next duplicate sheet by opening ImportToTableDialog
 */
async function processNextDuplicate(tablesCreated: { id: string; name: string }[]) {
  console.log('[ImportExcelDialog] processNextDuplicate called, pending:', pendingDuplicates.value.length)
  
  if (pendingDuplicates.value.length === 0) {
    // All duplicates processed, finish up
    finishImport(tablesCreated)
    return
  }

  const duplicate = pendingDuplicates.value[0]
  console.log('[ImportExcelDialog] Processing duplicate:', duplicate.existingTableName, duplicate.existingTableId)
  
  try {
    // Get table fields for the existing table
    const fields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1`,
      [duplicate.existingTableId]
    )
    console.log('[ImportExcelDialog] Got fields:', fields.length)
    
    // Get physical table name (stored as "tableName" in DB)
    const tableData = await query<{ tableName: string }>(
      `SELECT "tableName" FROM case_tables WHERE id = $1`,
      [duplicate.existingTableId]
    )
    
    if (tableData.length === 0) {
      console.error('Table not found:', duplicate.existingTableId)
      pendingDuplicates.value.shift()
      processNextDuplicate(tablesCreated)
      return
    }

    // Open the import dialog for this duplicate with pre-loaded data
    // The dialog will handle column mapping and import
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
    processNextDuplicate(tablesCreated)
  }
}

/**
 * Handle completion of a single table update from ImportToTableDialog
 */
function handleUpdateComplete(result: any) {
  const duplicate = pendingDuplicates.value.shift()
  
  if (duplicate && (result.inserted > 0 || result.updated > 0)) {
    tablesUpdated.value.push({
      id: duplicate.existingTableId,
      name: duplicate.existingTableName
    })
  }
  
  // Process next duplicate or finish
  // We need to pass tablesCreated, but we store it differently
  if (pendingDuplicates.value.length > 0) {
    // Continue with next duplicate after a brief delay
    setTimeout(() => {
      processNextDuplicate([])
    }, 300)
  } else {
    finishImport([])
  }
}

/**
 * Handle cancellation/close of ImportToTableDialog
 */
function handleUpdateClose() {
  // User closed the dialog, skip this duplicate and continue
  pendingDuplicates.value.shift()
  
  if (pendingDuplicates.value.length > 0) {
    setTimeout(() => {
      processNextDuplicate([])
    }, 300)
  } else {
    finishImport([])
  }
}

/**
 * Finish the import process after all duplicates are processed
 */
function finishImport(tablesCreated: { id: string; name: string }[]) {
  importProgress.value = 100
  isImporting.value = false
  
  const createdCount = tablesCreated.length
  const updatedCount = tablesUpdated.value.length
  
  if (createdCount > 0 || updatedCount > 0) {
    const messages = []
    if (createdCount > 0) messages.push(`${createdCount} table(s) created`)
    if (updatedCount > 0) messages.push(`${updatedCount} table(s) updated`)
    ElMessage.success(messages.join(', '))
    
    // Emit both created and updated tables
    emit('success', [...tablesCreated, ...tablesUpdated.value])
  } else {
    ElMessage.info('Import completed')
  }
  
  setTimeout(() => {
    close()
  }, 1000)
}

defineExpose({ open, openWithFile, close })
</script>

<style scoped lang="scss">
.import-excel-dialog {
  .upload-section {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-m);
  }

  .excel-uploader {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: var(--app-space-xl) var(--app-space-m);
      border: 2px dashed var(--el-border-color);
      border-radius: var(--app-border-radius-m);
      background: var(--el-fill-color-light);
      cursor: pointer;
      transition: border-color 0.2s ease;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--app-space-m);

    .upload-icon {
      font-size: 48px;
      color: var(--el-color-primary);
    }

    .upload-text {
      text-align: center;

      .primary-text {
        margin: 0 0 var(--app-space-xs);
        font-size: var(--app-font-size-l);
        font-weight: 500;
        color: var(--app-text-color-primary);
      }

      .secondary-text {
        margin: 0;
        font-size: var(--app-font-size-m);
        color: var(--app-text-color-secondary);
      }
    }

    .file-types {
      margin: 0;
      font-size: var(--app-font-size-s);
      color: var(--app-text-color-tertiary);
    }
  }

  .error-alert {
    margin-top: var(--app-space-s);
  }

  .import-progress {
    margin-top: var(--app-space-m);

    .progress-text {
      margin: var(--app-space-xs) 0 0;
      font-size: var(--app-font-size-s);
      color: var(--app-text-color-secondary);
      text-align: center;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
