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
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useImportBatch, isExcelFile } from '../../../composables/useImportBatch'
import { useSingleWorkspaceContext } from '../../../composables/useSingleWorkspace'

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

const dialogVisible = ref(false)
const isImporting = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)
const importProgress = ref(0)

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
  if (!selectedFile.value || !effectiveEntityId.value || isImporting.value) return

  // Validate file type
  if (!isExcelFile(selectedFile.value)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }

  isImporting.value = true
  importProgress.value = 10 // Show some initial progress

  try {
    // Import the Excel file
    const result = await importExcelFile(selectedFile.value, effectiveEntityId.value, effectiveParentFolderId.value)

    importProgress.value = 100

    if (result.success) {
      // Show success message
      if (result.tablesCreated && result.tablesCreated.length > 0) {
        ElMessage.success(`${result.tablesCreated.length} table(s) imported successfully!`)
        emit('success', result.tablesCreated)
      } else {
        ElMessage.success('File imported successfully!')
      }

      // Close dialog after a brief delay
      setTimeout(() => {
        close()
      }, 1000)
    } else {
      // Handle import errors
      if (result.duplicates && result.duplicates.length > 0) {
        errorMessage.value = `Duplicate tables found: ${result.duplicates.join(', ')}. Import cancelled.`
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
