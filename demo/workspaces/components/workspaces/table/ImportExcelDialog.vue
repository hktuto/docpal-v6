<template>
  <el-dialog v-model="dialogVisible" title="Import from Excel" width="500px" :close-on-click-modal="false" :close-on-press-escape="!isImporting" @close="close">
    <div class="import-excel-dialog">
      <!-- Upload Section -->
      <div v-if="!isImporting" class="upload-section">
        <el-upload class="excel-uploader" drag :auto-upload="false" :show-file-list="false" :on-change="handleFileChange" accept=".xlsx,.xls,.csv">
          <div class="upload-content">
            <Icon name="material-symbols:upload-file-outline" class="upload-icon" />
            <div class="upload-text">
              <p class="primary-text">Drop your Excel file here</p>
              <p class="secondary-text">or click to browse</p>
            </div>
            <p class="file-types">Supports .xlsx, .xls, .csv</p>
          </div>
        </el-upload>
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="error-alert" />
      </div>
      <div class="import-progress">
        <div class="progress-container">
          <el-progress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : undefined" type="circle" stroke-width="8" />
        </div>
        <p class="progress-text">Importing Excel file...</p>
      </div>
    </div>
    <!-- Import Progress -->

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close" :disabled="isImporting"> Cancel </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Import To Table Dialog for updating existing tables -->
  <WorkspacesDialogsImportToTableDialog ref="importToTableDialogRef" @complete="handleUpdateComplete" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { CaseFieldRecord } from '../../../utils/db/schema/newTableSchema'

// Internal state for dynamic entityId and parentFolderId
const effectiveEntityId = ref<string>('')
const effectiveParentFolderId = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'success', tables: { id: string; name: string }[]): void
  (e: 'close'): void
}>()

const { workspace } = useSingleWorkspaceContext()
const { importExcelFile, initData, uploadProgress, isImporting, reset, selectedFile, errorMessage } = useImportBatch()
const { query } = usePglite()

const dialogVisible = ref(false)

// Update existing tables state
const importToTableDialogRef = ref()
const pendingDuplicates = ref<DuplicateSheetInfo[]>([])
const tablesUpdated = ref<{ id: string; name: string }[]>([])

function open(entityId?: string, parentFolderId?: string | null) {
  effectiveEntityId.value = entityId || workspace.value?.id || ''
  effectiveParentFolderId.value = parentFolderId !== undefined ? parentFolderId : null
  initData({ entityId: effectiveEntityId.value, parentFolderId: effectiveParentFolderId.value })
  dialogVisible.value = true
  reset()
}

function openWithFile(file: File, entityId?: string, parentFolderId?: string | null) {
  if (!isExcelFile(file)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
  }
  open(entityId, parentFolderId)
  selectedFile.value = file
}

function close() {
  console.log('[ImportExcelDialog] close() called, stack:', new Error().stack)
  dialogVisible.value = false
  reset()
  emit('close')
}

async function handleFileChange(file: any) {
  selectedFile.value = file.raw
  errorMessage.value = ''
  console.log('handleFileChange', selectedFile.value)
  // Validate file type immediately
  if (selectedFile.value && !isExcelFile(selectedFile.value)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }
  await importExcelFile(selectedFile.value)
  dialogVisible.value = false
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
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
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
