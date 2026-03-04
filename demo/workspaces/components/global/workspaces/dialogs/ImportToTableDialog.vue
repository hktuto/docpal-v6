<template>
  <el-dialog
    v-model="visible"
    title="Import Data"
    class="big"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-to-table-dialog">
      <!-- Steps indicator -->
      <el-steps :active="currentStep" finish-status="success" class="import-steps">
        <el-step title="Select File" />
        <el-step title="Map Columns" />
        <el-step title="Import Settings" />
      </el-steps>

      <!-- Step 1: File Upload + Sheet Selection -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="step-description">
          Upload an Excel (.xlsx, .xls) or CSV file to import data into "{{ tableName }}".
        </div>

        <!-- Drop zone -->
        <div
          class="drop-zone"
          :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls,.csv"
            style="display: none"
            @change="handleFileSelect"
          />
          <div v-if="!selectedFile" class="drop-zone-content">
            <Icon name="lucide:upload" class="upload-icon" />
            <div class="drop-zone-text">
              <span class="primary-text">Drop file here or click to browse</span>
              <span class="secondary-text">Supports .xlsx, .xls, .csv</span>
            </div>
          </div>
          <div v-else class="file-selected">
            <Icon name="lucide:file-spreadsheet" class="file-icon" />
            <div class="file-info">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
            <el-button type="danger" text size="small" @click.stop="clearFile">
              <Icon name="lucide:x" />
            </el-button>
          </div>
        </div>

        <!-- Sheet Selection (if multiple sheets) -->
        <div v-if="sheets.length > 1" class="sheet-selection">
          <div class="section-title">Select Sheet</div>
          <el-radio-group v-model="selectedSheetIndex" class="sheet-list">
            <el-radio
              v-for="sheet in sheets"
              :key="sheet.index"
              :value="sheet.index"
              class="sheet-item"
            >
              <div class="sheet-info">
                <span class="sheet-name">{{ sheet.name }}</span>
                <el-tag size="small" type="info">{{ sheet.rowCount }} rows</el-tag>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <!-- Preview -->
        <div v-if="selectedSheet" class="preview-section">
          <div class="section-title">
            Preview ({{ selectedSheet.columns.length }} columns, {{ selectedSheet.rowCount }} rows)
          </div>
          <div class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="col in selectedSheet.columns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in selectedSheet.previewRows" :key="idx">
                  <td v-for="col in selectedSheet.columns" :key="col">
                    {{ row[col] || '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Step 2: Column Mapping -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-description">
          Map Excel columns to table fields. Auto-suggested mappings are marked with a star.
        </div>

        <div class="mapping-list">
          <div class="mapping-header">
            <span class="col-excel">Excel Column</span>
            <span class="col-arrow"></span>
            <span class="col-field">Table Field</span>
            <span class="col-sample">Sample Value</span>
          </div>

          <div
            v-for="mapping in columnMappings"
            :key="mapping.excelColumn"
            class="mapping-row"
            :class="{ 'auto-suggested': mapping.autoSuggested && mapping.fieldName }"
          >
            <div class="col-excel">
              <span class="excel-col-name">{{ mapping.excelColumn }}</span>
              <Icon v-if="mapping.autoSuggested && mapping.fieldName" name="lucide:sparkles" class="auto-icon" title="Auto-suggested" />
            </div>
            <div class="col-arrow">
              <Icon name="lucide:arrow-right" />
            </div>
            <div class="col-field">
              <el-select
                v-model="mapping.fieldName"
                placeholder="Skip this column"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="field in eligibleFields"
                  :key="field.fieldName"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                  :disabled="isFieldUsed(field.fieldName, mapping.excelColumn)"
                >
                  <div class="field-option">
                    <span>{{ field.fieldNameAlias }}</span>
                    <span class="field-name">{{ field.fieldName }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div class="col-sample">
              <span class="sample-value">{{ getSampleValue(mapping.excelColumn) }}</span>
            </div>
          </div>
        </div>

        <div class="mapping-summary">
          <el-tag type="success" size="small">
            {{ mappedCount }} / {{ columnMappings.length }} columns mapped
          </el-tag>
          <el-tag v-if="unmappedRequiredFields.length > 0" type="warning" size="small">
            {{ unmappedRequiredFields.length }} required fields not mapped
          </el-tag>
        </div>
      </div>

      <!-- Step 3: Import Settings -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="step-description">
          Configure how to handle existing records and import behavior.
        </div>

        <!-- Lookup Columns -->
        <div class="settings-section">
          <div class="section-title">
            <Icon name="lucide:search" />
            Match Existing Records By
          </div>
          <div class="section-description">
            Select columns to identify existing records. If a record matches, it will be updated instead of creating a new one.
          </div>
          <el-checkbox-group v-model="lookupColumns" class="lookup-columns">
            <el-checkbox
              v-for="mapping in mappedColumns"
              :key="mapping.fieldName!"
              :value="mapping.fieldName!"
              :label="mapping.fieldName!"
            >
              {{ getFieldLabel(mapping.fieldName!) }} ({{ mapping.excelColumn }})
            </el-checkbox>
          </el-checkbox-group>
          <div v-if="lookupColumns.length === 0" class="no-lookup-hint">
            <Icon name="lucide:info" />
            No lookup columns selected. All rows will be inserted as new records.
          </div>
        </div>

        <!-- Update Strategy -->
        <div class="settings-section">
          <div class="section-title">
            <Icon name="lucide:settings" />
            Update Strategy
          </div>
          <el-radio-group v-model="updateStrategy">
            <el-radio value="all">
              <div class="strategy-option">
                <span class="strategy-label">Update all mapped fields</span>
                <span class="strategy-desc">Replace field values even if Excel cell is empty</span>
              </div>
            </el-radio>
            <el-radio value="non_empty">
              <div class="strategy-option">
                <span class="strategy-label">Skip empty cells</span>
                <span class="strategy-desc">Only update fields where Excel has a value</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <!-- Import Summary -->
        <div class="import-summary">
          <div class="summary-title">Import Summary</div>
          <div class="summary-items">
            <div class="summary-item">
              <span class="label">Rows to process:</span>
              <span class="value">{{ selectedSheet?.rowCount || 0 }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Columns mapped:</span>
              <span class="value">{{ mappedCount }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Lookup columns:</span>
              <span class="value">{{ lookupColumns.length > 0 ? lookupColumns.length : 'None (insert only)' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Progress -->
      <div v-if="isImporting" class="import-progress">
        <el-progress
          :percentage="progressPercent"
          :status="importResult ? 'success' : undefined"
        />
        <div class="progress-text">
          {{ progressText }}
        </div>
      </div>

      <!-- Import Result -->
      <div v-if="importResult" class="import-result">
        <div class="result-header">
          <Icon name="lucide:check-circle" class="result-icon success" />
          <span>Import Complete</span>
        </div>
        <div class="result-stats">
          <div class="stat-item success">
            <span class="stat-value">{{ importResult.inserted }}</span>
            <span class="stat-label">Inserted</span>
          </div>
          <div class="stat-item info">
            <span class="stat-value">{{ importResult.updated }}</span>
            <span class="stat-label">Updated</span>
          </div>
          <div v-if="importResult.skipped > 0" class="stat-item warning">
            <span class="stat-value">{{ importResult.skipped }}</span>
            <span class="stat-label">Skipped</span>
          </div>
          <div v-if="importResult.errors.length > 0" class="stat-item danger">
            <span class="stat-value">{{ importResult.errors.length }}</span>
            <span class="stat-label">Errors</span>
          </div>
        </div>

        <!-- Relation Errors -->
        <div v-if="importResult.relationErrors.length > 0" class="relation-errors">
          <div class="errors-title">
            <Icon name="lucide:alert-triangle" />
            Relation Lookup Warnings ({{ importResult.relationErrors.length }})
          </div>
          <div class="errors-list">
            <div v-for="(err, idx) in importResult.relationErrors.slice(0, 5)" :key="idx" class="error-item">
              Row {{ err.row }}: "{{ err.value }}" not found in {{ err.field }}
            </div>
            <div v-if="importResult.relationErrors.length > 5" class="more-errors">
              ... and {{ importResult.relationErrors.length - 5 }} more
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="!importResult" @click="handleClose">Cancel</el-button>
        <el-button v-if="currentStep > 0 && !isImporting && !importResult" @click="previousStep">
          Previous
        </el-button>
        <el-button
          v-if="currentStep < 2 && !isImporting"
          type="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Next
        </el-button>
        <el-button
          v-if="currentStep === 2 && !isImporting && !importResult"
          type="primary"
          :disabled="!canImport"
          @click="startImport"
        >
          Start Import
        </el-button>
        <el-button
          v-if="importResult"
          type="primary"
          @click="handleClose"
        >
          Done
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { CaseFieldRecord } from '../../../../utils/db/schema/newTableSchema'

const emit = defineEmits<{
  complete: [result: ImportResult]
}>()

// Dialog state
const visible = ref(false)
const currentStep = ref(0)
const tableName = ref('')
const tableId = ref('')

// File state
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const sheets = ref<SheetInfo[]>([])
const selectedSheetIndex = ref(0)

// Mapping state
const columnMappings = ref<ColumnMapping[]>([])
const eligibleFields = ref<CaseFieldRecord[]>([])

// Settings state
const lookupColumns = ref<string[]>([])
const updateStrategy = ref<'all' | 'non_empty'>('all')

// Import state
const isImporting = ref(false)
const importResult = ref<ImportResult | null>(null)

// Pre-loaded sheet data (for openWithSheetData)
const preloadedSheetData = ref<Record<string, any>[] | null>(null)

// Composable refs (will be initialized in open())
let importComposable: ReturnType<typeof useImportToTable> | null = null

/**
 * Normalize a string for comparison (lowercase, remove special chars)
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[_\s\-\.]+/g, '')
    .trim()
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  const normA = normalizeForComparison(a)
  const normB = normalizeForComparison(b)

  // Exact match
  if (normA === normB) return 1

  // One contains the other
  if (normA.includes(normB) || normB.includes(normA)) {
    const shorter = normA.length < normB.length ? normA : normB
    const longer = normA.length >= normB.length ? normA : normB
    return shorter.length / longer.length
  }

  return 0
}

/**
 * Guess the best sheet index based on name similarity with table name
 * Returns the index of the best matching sheet, or the first sheet if no good match
 */
function guessBestSheetIndex(sheetList: SheetInfo[], targetTableName: string): number {
  if (sheetList.length === 0) return 0
  if (sheetList.length === 1) return sheetList[0].index
  if (!targetTableName) return sheetList[0].index

  let bestScore = 0
  let bestIndex = sheetList[0].index

  for (const sheet of sheetList) {
    const score = calculateSimilarity(sheet.name, targetTableName)
    if (score > bestScore) {
      bestScore = score
      bestIndex = sheet.index
    }
  }

  // Only use the match if score is reasonable (>= 0.3)
  // Otherwise fall back to first sheet
  if (bestScore >= 0.3) {
    return bestIndex
  }

  return sheetList[0].index
}

// Computed
const selectedSheet = computed(() => {
  return sheets.value.find((s) => s.index === selectedSheetIndex.value) || null
})

const mappedCount = computed(() => {
  return columnMappings.value.filter((m) => m.fieldName).length
})

const mappedColumns = computed(() => {
  return columnMappings.value.filter((m) => m.fieldName)
})

const unmappedRequiredFields = computed(() => {
  const mappedFieldNames = new Set(columnMappings.value.map((m) => m.fieldName).filter(Boolean))
  return eligibleFields.value.filter((f) => f.isRequired && !mappedFieldNames.has(f.fieldName))
})

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return selectedFile.value && sheets.value.length > 0
  }
  if (currentStep.value === 1) {
    return mappedCount.value > 0
  }
  return true
})

const canImport = computed(() => {
  return mappedCount.value > 0 && !isImporting.value
})

const progressPercent = computed(() => {
  if (!importComposable) return 0
  const { progress } = importComposable
  if (progress.value.total === 0) return 0
  return Math.round((progress.value.current / progress.value.total) * 100)
})

const progressText = computed(() => {
  if (!importComposable) return ''
  const { progress } = importComposable
  if (progress.value.phase === 'parsing') return 'Parsing file...'
  if (progress.value.phase === 'mapping') return 'Mapping columns...'
  if (progress.value.phase === 'importing') {
    return `Importing row ${progress.value.current} of ${progress.value.total}...`
  }
  return 'Done'
})

// Methods
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function triggerFileInput() {
  if (!selectedFile.value) {
    fileInputRef.value?.click()
  }
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file: File) {
  if (!isExcelFile(file)) {
    ElMessage.error('Please select an Excel (.xlsx, .xls) or CSV file')
    return
  }

  selectedFile.value = file
  sheets.value = []
  selectedSheetIndex.value = 0

  try {
    if (!importComposable) {
      ElMessage.error('Import not initialized')
      return
    }

    sheets.value = await importComposable.parseExcelSheets(file)

    if (sheets.value.length === 0) {
      ElMessage.warning('No valid sheets found in the file')
      clearFile()
      return
    }

    // Smart sheet selection: guess based on table name, fallback to first
    selectedSheetIndex.value = guessBestSheetIndex(sheets.value, tableName.value)
  } catch (err: any) {
    ElMessage.error(err.message || 'Failed to parse file')
    clearFile()
  }
}

function clearFile() {
  selectedFile.value = null
  sheets.value = []
  selectedSheetIndex.value = 0
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function isFieldUsed(fieldName: string, currentExcelColumn: string): boolean {
  return columnMappings.value.some(
    (m) => m.fieldName === fieldName && m.excelColumn !== currentExcelColumn
  )
}

function getSampleValue(excelColumn: string): string {
  const sheet = selectedSheet.value
  if (!sheet || sheet.previewRows.length === 0) return ''
  const value = sheet.previewRows[0][excelColumn]
  if (value === undefined || value === null) return ''
  const str = String(value)
  return str.length > 30 ? str.substring(0, 30) + '...' : str
}

function getFieldLabel(fieldName: string): string {
  const field = eligibleFields.value.find((f) => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

function nextStep() {
  if (currentStep.value === 0 && selectedSheet.value) {
    // Initialize column mappings when moving to step 2
    if (importComposable) {
      eligibleFields.value = importComposable.getEligibleFields()
      columnMappings.value = importComposable.suggestMappings(selectedSheet.value.columns)
    }
  }
  currentStep.value++
}

function previousStep() {
  currentStep.value--
}

async function startImport() {
  // Either we have a selected file, or pre-loaded sheet data
  if ((!selectedFile.value && !preloadedSheetData.value) || !importComposable) return

  isImporting.value = true
  importResult.value = null

  try {
    let rows: Record<string, any>[]

    if (preloadedSheetData.value) {
      // Use pre-loaded data (from openWithSheetData)
      rows = preloadedSheetData.value
    } else if (selectedFile.value) {
      // Parse full sheet data from file
      const parsed = await importComposable.parseSheetData(selectedFile.value, selectedSheetIndex.value)
      rows = parsed.rows
    } else {
      throw new Error('No data to import')
    }

    // Run import
    const result = await importComposable.importData(rows, {
      sheetIndex: selectedSheetIndex.value,
      columnMappings: columnMappings.value,
      lookupColumns: lookupColumns.value,
      updateStrategy: updateStrategy.value
    })

    importResult.value = result
    emit('complete', result)

    if (result.errors.length === 0) {
      ElMessage.success(`Import complete: ${result.inserted} inserted, ${result.updated} updated`)
    } else {
      ElMessage.warning(`Import complete with ${result.errors.length} errors`)
    }
  } catch (err: any) {
    ElMessage.error(err.message || 'Import failed')
  } finally {
    isImporting.value = false
  }
}

function handleClose() {
  visible.value = false
  resetState()
}

function resetState() {
  currentStep.value = 0
  selectedFile.value = null
  sheets.value = []
  selectedSheetIndex.value = 0
  columnMappings.value = []
  eligibleFields.value = []
  lookupColumns.value = []
  updateStrategy.value = 'all'
  isImporting.value = false
  importResult.value = null
  isDragOver.value = false
  preloadedSheetData.value = null
}

interface OpenOptions {
  physicalTableName: Ref<string>
  fields: Ref<CaseFieldRecord[]>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  tableDisplayName: string
  tableIdValue: string
}

function open(options: OpenOptions) {
  resetState()
  tableName.value = options.tableDisplayName
  tableId.value = options.tableIdValue

  // Initialize composable with provided options
  importComposable = useImportToTable({
    physicalTableName: options.physicalTableName,
    fields: options.fields,
    query: options.query
  })

  visible.value = true
}

function openWithFile(file: File, options: OpenOptions) {
  open(options)
  // Process file after dialog opens
  nextTick(() => {
    processFile(file)
  })
}

/**
 * Open the dialog with pre-parsed sheet data (for updating existing tables)
 * This skips the file selection step and goes directly to column mapping
 */
function openWithSheetData(
  rows: Record<string, any>[],
  headers: string[],
  options: OpenOptions
) {
  console.log('[ImportToTableDialog] openWithSheetData called:', {
    rowCount: rows.length,
    headers,
    tableName: options.tableDisplayName,
    tableId: options.tableIdValue
  })
  
  resetState()
  tableName.value = options.tableDisplayName
  tableId.value = options.tableIdValue

  // Initialize composable with provided options
  importComposable = useImportToTable({
    physicalTableName: options.physicalTableName,
    fields: options.fields,
    query: options.query
  })

  // Create a synthetic sheet from the provided data
  const previewRows = rows.slice(0, 5).map((row) => {
    const preview: Record<string, any> = {}
    headers.forEach((h) => {
      preview[h] = row[h]
    })
    return preview
  })

  sheets.value = [{
    name: tableName.value,
    index: 0,
    rowCount: rows.length,
    columns: headers,
    previewRows
  }]
  selectedSheetIndex.value = 0

  // Store the rows data for import (we'll need to pass it to startImport)
  preloadedSheetData.value = rows

  // Skip to step 2 (column mapping) directly
  currentStep.value = 1
  if (importComposable) {
    eligibleFields.value = importComposable.getEligibleFields()
    columnMappings.value = importComposable.suggestMappings(headers)
    console.log('[ImportToTableDialog] Eligible fields:', eligibleFields.value.length)
    console.log('[ImportToTableDialog] Column mappings:', columnMappings.value)
  }

  visible.value = true
  console.log('[ImportToTableDialog] Dialog should now be visible')
}

defineExpose({
  open,
  openWithFile,
  openWithSheetData
})
</script>

<style lang="scss" scoped>
.import-to-table-dialog {
  min-height: 400px;
}

.import-steps {
  margin-bottom: var(--app-space-xl);
}

.step-content {
  min-height: 300px;
}

.step-description {
  margin-bottom: var(--app-space-l);
  padding: var(--app-space-m);
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius);
  color: var(--el-text-color-secondary);
  font-size: var(--app-font-size-s);
}

// Drop zone
.drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: var(--app-border-radius);
  padding: var(--app-space-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover,
  &.drag-over {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &.has-file {
    border-style: solid;
    background: var(--el-fill-color-light);
    cursor: default;
  }
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-m);

  .upload-icon {
    font-size: 48px;
    color: var(--el-text-color-placeholder);
  }

  .primary-text {
    font-size: var(--app-font-size-m);
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .secondary-text {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }
}

.file-selected {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);

  .file-icon {
    font-size: 32px;
    color: var(--el-color-success);
  }

  .file-info {
    flex: 1;
    text-align: left;

    .file-name {
      display: block;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .file-size {
      font-size: var(--app-font-size-xs);
      color: var(--el-text-color-secondary);
    }
  }
}

// Section styles
.section-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  margin-bottom: var(--app-space-m);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-description {
  margin-bottom: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
}

// Sheet selection
.sheet-selection {
  margin-top: var(--app-space-l);
}

.sheet-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--app-space-s);
}

.sheet-item {
  flex: 1 0 auto;
  display: inline-block;
  padding: var(--app-space-s) var(--app-space-m);
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius);
  height: auto;
  margin-right: 0;;
  &:has(:checked) {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.sheet-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);

  .sheet-name {
    font-weight: 500;
  }
}

// Preview table
.preview-section {
  margin-top: var(--app-space-l);
}

.preview-table-wrapper {
  max-height: 200px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--app-font-size-s);

  th,
  td {
    padding: var(--app-space-xs) var(--app-space-s);
    border: 1px solid var(--el-border-color-lighter);
    white-space: nowrap;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    background: var(--el-fill-color);
    font-weight: 600;
    position: sticky;
    top: 0;
  }

  td {
    background: var(--el-bg-color);
  }
}

// Column mapping
.mapping-list {
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius);
  overflow: hidden;
}

.mapping-header {
  display: grid;
  grid-template-columns: 1fr 40px 1fr 120px;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--el-fill-color);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
}

.mapping-row {
  display: grid;
  grid-template-columns: 1fr 40px 1fr 120px;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  border-top: 1px solid var(--el-border-color-lighter);
  align-items: center;

  &.auto-suggested {
    background: var(--el-color-success-light-9);
  }
}

.col-excel {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);

  .excel-col-name {
    font-weight: 500;
  }

  .auto-icon {
    color: var(--el-color-warning);
    font-size: 14px;
  }
}

.col-arrow {
  text-align: center;
  color: var(--el-text-color-placeholder);
}

.col-sample {
  .sample-value {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-secondary);
    font-family: monospace;
  }
}

.field-option {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .field-name {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-placeholder);
    font-family: monospace;
  }
}

.mapping-summary {
  margin-top: var(--app-space-m);
  display: flex;
  gap: var(--app-space-s);
}

// Settings
.settings-section {
  margin-bottom: var(--app-space-xl);
  padding: var(--app-space-m);
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius);
}

.lookup-columns {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.no-lookup-hint {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  background: var(--el-color-info-light-9);
  border-radius: var(--app-border-radius);
  font-size: var(--app-font-size-s);
  color: var(--el-color-info);
}

.strategy-option {
  display: flex;
  flex-direction: column;

  .strategy-label {
    font-weight: 500;
  }

  .strategy-desc {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-secondary);
  }
}

// Import summary
.import-summary {
  padding: var(--app-space-m);
  background: var(--el-fill-color);
  border-radius: var(--app-border-radius);

  .summary-title {
    font-weight: 600;
    margin-bottom: var(--app-space-m);
  }

  .summary-items {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);
  }

  .summary-item {
    display: flex;
    justify-content: space-between;

    .label {
      color: var(--el-text-color-secondary);
    }

    .value {
      font-weight: 500;
    }
  }
}

// Progress
.import-progress {
  margin-top: var(--app-space-l);
  padding: var(--app-space-m);
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius);

  .progress-text {
    margin-top: var(--app-space-s);
    text-align: center;
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }
}

// Result
.import-result {
  margin-top: var(--app-space-l);
  padding: var(--app-space-l);
  background: var(--el-color-success-light-9);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--el-color-success-light-5);
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
  font-size: var(--app-font-size-l);
  font-weight: 600;

  .result-icon.success {
    color: var(--el-color-success);
    font-size: 24px;
  }
}

.result-stats {
  display: flex;
  gap: var(--app-space-l);
}

.stat-item {
  text-align: center;

  .stat-value {
    display: block;
    font-size: var(--app-font-size-xl);
    font-weight: 600;
  }

  .stat-label {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }

  &.success .stat-value {
    color: var(--el-color-success);
  }
  &.info .stat-value {
    color: var(--el-color-info);
  }
  &.warning .stat-value {
    color: var(--el-color-warning);
  }
  &.danger .stat-value {
    color: var(--el-color-danger);
  }
}

.relation-errors {
  margin-top: var(--app-space-m);
  padding: var(--app-space-m);
  background: var(--el-color-warning-light-9);
  border-radius: var(--app-border-radius);

  .errors-title {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    margin-bottom: var(--app-space-s);
    color: var(--el-color-warning-dark-2);
    font-weight: 500;
  }

  .error-item {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
    padding: var(--app-space-xxs) 0;
  }

  .more-errors {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
