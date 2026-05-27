<template>
  <div class="import-data-sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <span class="sidebar-title">Import Data</span>
      <button class="sidebar-close" tabindex="0" @click="handleClose" @keydown.enter="handleClose">
        <Icon name="lucide:x" size="16" />
      </button>
    </div>

    <!-- Body -->
    <div class="sidebar-body">
      <!-- Step 1: File Upload -->
      <div v-if="step === 'upload'" class="step-section">
        <el-upload
          class="excel-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls,.csv"
        >
          <div class="upload-content">
            <Icon name="material-symbols:upload-file-outline" class="upload-icon" />
            <div class="upload-text">
              <p class="primary-text">Drop your file here</p>
              <p class="secondary-text">or click to browse</p>
            </div>
            <p class="file-types">Supports .xlsx, .xls, .csv</p>
          </div>
        </el-upload>
      </div>

      <!-- Step 2: Sheet Selection -->
      <div v-else-if="step === 'sheet'" class="step-section">
        <div class="step-label">Select Sheet</div>
        <div class="sheet-list">
          <div
            v-for="sheet in parsedSheets"
            :key="sheet.sheetName"
            class="sheet-item"
            :class="{ active: selectedSheet?.sheetName === sheet.sheetName }"
            @click="selectedSheet = sheet"
          >
            <Icon name="material-symbols:table-outline" />
            <span>{{ sheet.sheetName }}</span>
            <span class="sheet-rows">{{ sheet.rows.length }} rows</span>
          </div>
        </div>
        <div class="step-actions">
          <el-button @click="reset">Back</el-button>
          <el-button type="primary" :disabled="!selectedSheet" @click="goToMapping">Next</el-button>
        </div>
      </div>

      <!-- Step 3: Column Mapping -->
      <div v-else-if="step === 'mapping'" class="step-section">
        <div class="step-label">Column Mapping</div>
        <div class="mapping-hint">Map Excel columns to table fields</div>

        <div class="mapping-list">
          <div class="mapping-header">
            <span>Excel Column</span>
            <span>Table Field</span>
          </div>
          <div v-for="(mapping, index) in columnMappings" :key="index" class="mapping-row">
            <span class="excel-col" :title="mapping.excelColumn">{{ mapping.excelColumn }}</span>
            <el-select
              v-model="mapping.tableField"
              placeholder="-- Skip --"
              clearable
              size="small"
              class="field-select"
            >
              <el-option
                v-for="field in availableFields"
                :key="field.field_name"
                :label="field.field_name_alias || field.field_name"
                :value="field.field_name"
              />
            </el-select>
          </div>
        </div>

        <div class="unique-section">
          <div class="step-label">Duplicate Handling</div>
          <div class="unique-row">
            <el-select v-model="uniqueField" placeholder="Select unique column (optional)" clearable size="small" class="unique-select">
              <el-option
                v-for="field in mappedFields"
                :key="field.field_name"
                :label="field.field_name_alias || field.field_name"
                :value="field.field_name"
              />
            </el-select>
          </div>
          <div v-if="uniqueField" class="strategy-row">
            <el-radio-group v-model="duplicateStrategy" size="small">
              <el-radio-button label="ignore">Ignore duplicates</el-radio-button>
              <el-radio-button label="update">Update existing</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="step-actions">
          <el-button @click="step = 'sheet'">Back</el-button>
          <el-button type="primary" :loading="isImporting" @click="startImport">Import</el-button>
        </div>
      </div>

      <!-- Step 4: Import Progress -->
      <div v-else-if="step === 'progress'" class="step-section">
        <div class="import-progress">
          <el-progress :percentage="progressPercent" :status="progressPercent === 100 ? 'success' : undefined" type="circle" stroke-width="8" />
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </div>

      <!-- Step 5: Results -->
      <div v-else-if="step === 'result'" class="step-section">
        <div class="result-summary">
          <div class="result-item success">
            <Icon name="material-symbols:check-circle-outline" />
            <span>{{ importResult.created }} created</span>
          </div>
          <div class="result-item warning">
            <Icon name="material-symbols:update" />
            <span>{{ importResult.updated }} updated</span>
          </div>
          <div class="result-item info">
            <Icon name="material-symbols:skip-next-outline" />
            <span>{{ importResult.ignored }} ignored</span>
          </div>
          <div v-if="importResult.errors.length" class="result-item danger">
            <Icon name="material-symbols:error-outline" />
            <span>{{ importResult.errors.length }} errors</span>
          </div>
        </div>

        <div v-if="importResult.errors.length" class="error-list">
          <div class="error-title">Errors:</div>
          <div v-for="(err, idx) in importResult.errors.slice(0, 20)" :key="idx" class="error-row">
            Row {{ err.row }}: {{ err.message }}
          </div>
          <div v-if="importResult.errors.length > 20" class="error-more">
            ... and {{ importResult.errors.length - 20 }} more
          </div>
        </div>

        <div class="step-actions">
          <el-button @click="reset">Import Another File</el-button>
          <el-button type="primary" @click="handleClose">Done</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { parseImportFile, importRowsToTable, isExcelFile, type ParsedSheet, type ColumnMapping, type DuplicateStrategy } from '../../../composables/import/useImportTableData'

const props = defineProps<{
  tableId: string
  tableFields: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

type Step = 'upload' | 'sheet' | 'mapping' | 'progress' | 'result'

const step = ref<Step>('upload')
const parsedSheets = ref<ParsedSheet[]>([])
const selectedSheet = ref<ParsedSheet | null>(null)
const columnMappings = ref<ColumnMapping[]>([])
const uniqueField = ref<string | null>(null)
const duplicateStrategy = ref<DuplicateStrategy>('ignore')
const isImporting = ref(false)
const progressPercent = ref(0)
const progressText = ref('Importing...')
const importResult = ref({ created: 0, updated: 0, ignored: 0, errors: [] as { row: number; message: string }[] })

const systemFieldNames = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'col_id'])

const availableFields = computed(() => {
  return props.tableFields.filter((f: any) => {
    const name = f.field_name
    return !name?.startsWith('_') && !systemFieldNames.has(name)
  })
})

const mappedFields = computed(() => {
  const mappedNames = columnMappings.value.map((m) => m.tableField).filter(Boolean) as string[]
  return props.tableFields.filter((f: any) => mappedNames.includes(f.field_name))
})

async function handleFileChange(file: any) {
  const rawFile = file.raw as File
  if (!rawFile || !isExcelFile(rawFile)) {
    ElMessage.error('Please select an Excel file (.xlsx, .xls) or CSV file (.csv)')
    return
  }

  try {
    const sheets = await parseImportFile(rawFile)
    if (!sheets.length) {
      ElMessage.error('No valid data found in the file')
      return
    }
    parsedSheets.value = sheets

    if (sheets.length === 1) {
      selectedSheet.value = sheets[0]
      goToMapping()
    } else {
      step.value = 'sheet'
    }
  } catch (error) {
    console.error('Parse error', error)
    ElMessage.error('Failed to parse file')
  }
}

function isSystemField(field: any): boolean {
  const name = field.field_name
  return name?.startsWith('_') || systemFieldNames.has(name)
}

function goToMapping() {
  if (!selectedSheet.value) return

  // Auto-map columns by matching names (case-insensitive), skip system fields
  const mappings: ColumnMapping[] = selectedSheet.value.headers.map((header) => {
    const match = props.tableFields.find(
      (f: any) => !isSystemField(f) && (
        f.field_name.toLowerCase() === header.toLowerCase() ||
        (f.field_name_alias && f.field_name_alias.toLowerCase() === header.toLowerCase())
      )
    )
    return {
      excelColumn: header,
      tableField: match ? match.field_name : null
    }
  })

  columnMappings.value = mappings
  uniqueField.value = null
  duplicateStrategy.value = 'ignore'
  step.value = 'mapping'
}

async function startImport() {
  if (!selectedSheet.value || !props.tableId) return

  const activeMappings = columnMappings.value.filter((m) => m.tableField)
  if (!activeMappings.length) {
    ElMessage.warning('Please map at least one column')
    return
  }

  isImporting.value = true
  step.value = 'progress'
  progressPercent.value = 0
  progressText.value = 'Importing...'

  try {
    const result = await importRowsToTable(
      props.tableId,
      selectedSheet.value.rows,
      columnMappings.value,
      uniqueField.value,
      duplicateStrategy.value,
      props.tableFields,
      (current, total) => {
        progressPercent.value = Math.round((current / total) * 100)
        progressText.value = `Processing ${current} of ${total} rows...`
      }
    )

    importResult.value = result
    step.value = 'result'
    emit('success')
    ElMessage.success(`Import complete: ${result.created} created, ${result.updated} updated, ${result.ignored} ignored`)
  } catch (error: any) {
    console.error('Import error', error)
    ElMessage.error(error?.message || 'Import failed')
    step.value = 'mapping'
  } finally {
    isImporting.value = false
  }
}

function reset() {
  step.value = 'upload'
  parsedSheets.value = []
  selectedSheet.value = null
  columnMappings.value = []
  uniqueField.value = null
  duplicateStrategy.value = 'ignore'
  progressPercent.value = 0
  importResult.value = { created: 0, updated: 0, ignored: 0, errors: [] }
}

function handleClose() {
  emit('close')
}
</script>

<style scoped lang="scss">
.import-data-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--app-paper);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-m);
  border-bottom: 1px solid var(--app-grey-850);

  .sidebar-title {
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }

  .sidebar-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--app-grey-500);
    cursor: pointer;
    border-radius: var(--app-border-radius);
    transition: all 0.2s;

    &:hover {
      background: var(--app-grey-100);
      color: var(--app-grey-900);
    }
  }
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-m);
}

.step-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.step-label {
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.mapping-hint {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

// Upload
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

// Sheet list
.sheet-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.sheet-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: var(--app-font-size-s);

  &:hover,
  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .sheet-rows {
    margin-left: auto;
    color: var(--app-text-color-tertiary);
    font-size: var(--app-font-size-xs);
  }
}

// Mapping
.mapping-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  border: 1px solid var(--app-grey-850);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
}

.mapping-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-s);
  padding: var(--app-space-xs) var(--app-space-s);
  background: var(--app-grey-950);
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  color: var(--app-text-color-secondary);
  text-transform: uppercase;
}

.mapping-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-s);
  align-items: center;
  padding: var(--app-space-xs) var(--app-space-s);
  border-top: 1px solid var(--app-grey-850);
}

.excel-col {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-select {
  width: 100%;
}

.unique-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  margin-top: var(--app-space-s);
}

.unique-row,
.strategy-row {
  display: flex;
  align-items: center;
}

.unique-select {
  width: 100%;
}

// Progress
.import-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  padding: var(--app-space-xl) 0;

  .progress-text {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

// Results
.result-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-s);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-s);
  font-size: var(--app-font-size-s);

  &.success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  &.warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }

  &.info {
    background: var(--el-color-info-light-9);
    color: var(--el-color-info);
  }

  &.danger {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}

.error-list {
  margin-top: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--app-grey-950);
  border-radius: var(--app-border-radius-s);
  max-height: 200px;
  overflow-y: auto;

  .error-title {
    font-size: var(--app-font-size-s);
    font-weight: 600;
    color: var(--el-color-danger);
    margin-bottom: var(--app-space-xs);
  }

  .error-row {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-secondary);
    padding: 2px 0;
  }

  .error-more {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-tertiary);
    padding: var(--app-space-xs) 0;
  }
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  margin-top: var(--app-space-m);
}
</style>
