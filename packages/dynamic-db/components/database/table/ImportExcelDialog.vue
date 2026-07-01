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
      </div>
      <div v-else class="import-progress">
        <div class="progress-container">
          <el-progress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : undefined" type="circle" stroke-width="8" />
        </div>
        <p class="progress-text">Importing Excel file...</p>
      </div>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="error-alert" />
      <template v-if="errorReportId">
        <br />
        <div v-html="errorReportMsg"></div>
        <el-button type="danger" text :icon="Download"  @click="downloadErrorReport">Download Error Report</el-button>
      </template>
    </div>
    <!-- Import Progress -->

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close" :disabled="isImporting"> Cancel </el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import {useImportBatch, isExcelFile} from '../../../composables/import/useImportBatch'
import { captureTableSnapshot, startPostImportAnalysis } from '../../../composables/import/useImportRelationAnalysis'

import { newClientApi } from 'api'
// Internal state for dynamic entityId and parentFolderId
const effectiveEntityId = ref<string>('')
const effectiveParentFolderId = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'success', tables: { id: string; name: string }[]): void
  (e: 'close'): void
}>()

const { database, getMenuFromDb } = useSingleDatabaseContext()
const { importExcelFile, initData, uploadProgress, isImporting, reset, selectedFile, errorMessage } = useImportBatch()


const dialogVisible = ref(false)
const errorReportId = ref('')
const errorReportMsg = ref('')

const tablesUpdated = ref<{ id: string; name: string }[]>([])
function resetState() {
  reset()
  errorReportId.value = ''
  errorReportMsg.value = ''
}
function open(entityId?: string, parentFolderId?: string | null) {
  effectiveEntityId.value = entityId || database.value?.id || ''
  effectiveParentFolderId.value = parentFolderId !== undefined ? parentFolderId : null
  initData({ entityId: effectiveEntityId.value, parentFolderId: effectiveParentFolderId.value })
  dialogVisible.value = true
  resetState()
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
  resetState()
  emit('close')
}

async function handleFileChange(file: any) {
  selectedFile.value = file.raw
  errorMessage.value = ''
  errorReportId.value = ''
  errorReportMsg.value = ''
  console.log('handleFileChange', selectedFile.value)
  // Validate file type immediately
  if (selectedFile.value && !isExcelFile(selectedFile.value)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }
  // Capture pre-import table snapshot for post-import relation analysis
  const preSnapshot = await captureTableSnapshot(database.value?.id)
  const result: any = await importExcelFile(selectedFile.value)
  if (result.hasErrorReport) {
    errorReportMsg.value = result.errorMessage
    errorReportId.value = result.jobId
  } else {
    dialogVisible.value = false
  }
  // Refresh menu so new tables appear, then run relation analysis
  await getMenuFromDb()
  startPostImportAnalysis(preSnapshot, database.value?.id)
  emit('success')
}
async function downloadErrorReport() {
  console.log('downloadErrorReport', errorReportId.value)
  if (!errorReportId.value) return
  try {
    const blob: any = await newClientApi.getDynamicDbImportJobidErrorReport(errorReportId.value, {
      format: 'blob',
      timeout: 0
    })
    downloadBlob(blob, 'error_report.xlsx', blob.type)
  } catch (error) {
    reset()
    console.error('downloadErrorReport error', error)
    errorMessage.value = 'Failed to download error report'
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
