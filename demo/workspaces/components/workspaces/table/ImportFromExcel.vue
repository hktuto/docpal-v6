<script setup lang="ts">
import * as XLSX from 'xlsx'
import type { DataTableColumnType } from '../../../utils/db/schema/table'
import { ColumnFieldType } from '../../../utils/tableColumnType'
import { v7 as uuidv7 } from 'uuid'

interface ImportResult {
  columns: Partial<DataTableColumnType>[]
  rows: Record<string, any>[]
  sheetName: string
}

interface SheetInfo {
  name: string
  rowCount: number
  columnCount: number
}

const props = defineProps<{
  workspaceId: string
  dataTableId?: string
}>()

const emit = defineEmits<{
  (e: 'import', data: ImportResult): void
  (e: 'cancel'): void
}>()

const fileList = ref<File[]>([])
const isProcessing = ref(false)
const errorMessage = ref('')
const sheets = ref<SheetInfo[]>([])
const selectedSheet = ref('')
const workbook = ref<XLSX.WorkBook | null>(null)
const previewData = ref<ImportResult | null>(null)

/**
 * Reserved column names that cannot be used as field names
 */
const RESERVED_COLUMN_NAMES = [
  'id', 'created_at', 'created_by', 'updated_at', 'updated_by',
  'oid', 'tableoid', 'xmin', 'cmin', 'xmax', 'cmax', 'ctid'
]

/**
 * Generate a field name from a title
 * Converts to lowercase, replaces spaces with underscores, removes invalid characters
 */
function generateFieldName(title: string): string {
  let field = title
    .toLowerCase()
    .trim()
    // Replace spaces and common separators with underscores
    .replace(/[\s\-\.]+/g, '_')
    // Remove any character that's not alphanumeric or underscore
    .replace(/[^a-z0-9_]/g, '')
    // Remove consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_|_$/g, '')
    // Ensure it doesn't start with a number (prefix with 'col_')
    .replace(/^(\d)/, 'col_$1')
    // Fallback if empty
    || 'column'
  
  // If field is a reserved name, prefix with 'col_'
  if (RESERVED_COLUMN_NAMES.includes(field)) {
    field = `col_${field}`
  }
  
  return field
}

/**
 * Generate unique field names for all columns
 * Handles duplicate field names by appending _2, _3, etc.
 */
function generateUniqueFieldNames(titles: string[]): string[] {
  const fieldCounts: Record<string, number> = {}
  const fields: string[] = []
  
  for (const title of titles) {
    let baseField = generateFieldName(title)
    
    // Check if this field already exists
    if (fieldCounts[baseField] !== undefined) {
      fieldCounts[baseField]++
      fields.push(`${baseField}_${fieldCounts[baseField]}`)
    } else {
      fieldCounts[baseField] = 1
      fields.push(baseField)
    }
  }
  
  return fields
}

function handleFileChange(file: any) {
  errorMessage.value = ''
  previewData.value = null
  sheets.value = []
  selectedSheet.value = ''
  
  if (!file.raw) return
  
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
    errorMessage.value = 'Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }
  
  processFile(file.raw)
}

async function processFile(file: File) {
  isProcessing.value = true
  errorMessage.value = ''
  
  try {
    const data = await readFileAsArrayBuffer(file)
    workbook.value = XLSX.read(data, { type: 'array', cellDates: true })
    
    const sheetNames = workbook.value.SheetNames || []
    if (sheetNames.length === 0) {
      errorMessage.value = 'No sheets found in the file'
      return
    }
    
    sheets.value = sheetNames.map(name => {
      const sheet = workbook.value!.Sheets[name]
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
      return {
        name,
        rowCount: range.e.r - range.s.r + 1,
        columnCount: range.e.c - range.s.c + 1
      }
    })
    
    // Auto-select first sheet
    selectedSheet.value = sheetNames[0]
    await parseSheet(selectedSheet.value)
  } catch (error) {
    console.error('Error processing file:', error)
    errorMessage.value = 'Failed to process the file. Please try again.'
  } finally {
    isProcessing.value = false
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Convert a cell value to string based on the detected column type
 */
function cellValueToString(value: any, columnType?: ColumnFieldType): string {
  if (value === undefined || value === null) {
    return ''
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return ''
    }
    return value.toISOString()
  }
  
  // Handle numbers - preserve precision
  if (typeof value === 'number') {
    // For percentages stored as decimals (e.g., 0.85 for 85%)
    if (columnType === ColumnFieldType.Percent) {
      return String(value * 100)
    }
    return String(value)
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  // Default: convert to string
  return String(value)
}

/**
 * Detect the column type based on cell values and Excel formatting
 */
function detectColumnType(
  sheet: XLSX.WorkSheet, 
  columnIndex: number, 
  dataRows: any[][]
): { type: ColumnFieldType; properties: Record<string, any> } {
  const sampleSize = Math.min(20, dataRows.length)
  const samples: any[] = []
  
  for (let i = 0; i < sampleSize && samples.length < 10; i++) {
    const value = dataRows[i]?.[columnIndex]
    if (value !== undefined && value !== null && value !== '') {
      samples.push(value)
    }
  }
  
  if (samples.length === 0) {
    return { type: ColumnFieldType.MultiText, properties: { defaultValue: '', maxLength: 1000 } }
  }
  
  // Check for Date type
  const dateCount = samples.filter(v => v instanceof Date && !isNaN(v.getTime())).length
  if (dateCount >= samples.length * 0.8) {
    return { 
      type: ColumnFieldType.DateTime, 
      properties: { autoFill: false, dateFormat: 'YYYY-MM-DD HH:mm:ss', timeZone: 'local', timeFormat: 24 } 
    }
  }
  
  // Check for Number type
  const numberCount = samples.filter(v => typeof v === 'number').length
  if (numberCount >= samples.length * 0.8) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: columnIndex })
    const cell = sheet[cellRef]
    if (cell?.z) {
      if (cell.z.includes('%')) {
        return { type: ColumnFieldType.Percent, properties: { precision: 2 } }
      }
      if (cell.z.includes('$') || cell.z.includes('¥') || cell.z.includes('€') || cell.z.includes('£')) {
        const symbol = cell.z.match(/[\$\¥\€\£]/)?.[0] || '$'
        return { type: ColumnFieldType.Currency, properties: { symbol, precision: 2, symbolAlign: 0 } }
      }
    }
    return { type: ColumnFieldType.Number, properties: { symbol: '', precision: 2, symbolAlign: 2 } }
  }
  
  // Check for Boolean type
  const boolCount = samples.filter(v => typeof v === 'boolean').length
  if (boolCount >= samples.length * 0.8) {
    return { type: ColumnFieldType.Checkbox, properties: { trueIcon: 'check', falseIcon: '' } }
  }
  
  // Check for text patterns
  const stringValues = samples.filter(v => typeof v === 'string')
  if (stringValues.length > 0) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (stringValues.filter(v => emailPattern.test(v)).length >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.Email, properties: {} }
    }
    
    const urlPattern = /^https?:\/\//i
    if (stringValues.filter(v => urlPattern.test(v)).length >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.URL, properties: { openInNewTab: true } }
    }
    
    const avgLength = stringValues.reduce((sum, v) => sum + v.length, 0) / stringValues.length
    if (avgLength < 50) {
      return { type: ColumnFieldType.Text, properties: { defaultValue: '' } }
    }
  }
  
  return { type: ColumnFieldType.MultiText, properties: { defaultValue: '', maxLength: 1000 } }
}

/**
 * Get human-readable type name for display
 */
function getTypeName(type: ColumnFieldType): string {
  const typeNames: Record<number, string> = {
    [ColumnFieldType.MultiText]: 'Long Text',
    [ColumnFieldType.Number]: 'Number',
    [ColumnFieldType.DateTime]: 'Date/Time',
    [ColumnFieldType.Currency]: 'Currency',
    [ColumnFieldType.Percent]: 'Percent',
    [ColumnFieldType.Checkbox]: 'Checkbox',
    [ColumnFieldType.Email]: 'Email',
    [ColumnFieldType.URL]: 'URL',
    [ColumnFieldType.Phone]: 'Phone',
    [ColumnFieldType.Text]: 'Text',
  }
  return typeNames[type] || 'Text'
}

async function parseSheet(sheetName: string) {
  if (!workbook.value) return
  
  const sheet = workbook.value.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
  
  if (jsonData.length === 0) {
    errorMessage.value = 'The sheet is empty'
    previewData.value = null
    return
  }
  
  const headerRow = jsonData[0]
  
  // Validate first row has headers
  if (!headerRow || headerRow.length === 0 || headerRow.every(cell => cell === undefined || cell === null || cell === '')) {
    errorMessage.value = 'We only accept table header in the first row. Please ensure the first row contains column headers.'
    previewData.value = null
    return
  }
  
  // Check for at least one valid header
  const validHeaders = headerRow.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
  if (validHeaders.length === 0) {
    errorMessage.value = 'We only accept table header in the first row. No valid headers found in the first row.'
    previewData.value = null
    return
  }
  
  errorMessage.value = ''
  
  // Get valid headers and generate unique field names
  const validHeaderTitles: string[] = headerRow
    .filter(header => header !== undefined && header !== null && String(header).trim() !== '')
    .map(header => String(header).trim())
  
  const uniqueFields = generateUniqueFieldNames(validHeaderTitles)
  
  // Get data rows for type detection (excluding header row)
  const dataRows = jsonData.slice(1).filter((row: any[]) => 
    row && !row.every((cell: any) => cell === undefined || cell === null || cell === '')
  )
  
  // Create columns from headers with auto-detected types
  let fieldIndex = 0
  const columns: Partial<DataTableColumnType>[] = headerRow
    .map((header, index) => {
      if (header === undefined || header === null || String(header).trim() === '') {
        return null
      }
      const title = String(header).trim()
      const field = uniqueFields[fieldIndex++]
      
      // Detect column type based on data
      const { type, properties } = detectColumnType(sheet, index, dataRows)
      
      return {
        id: uuidv7(),
        dataTableId: props.dataTableId,
        workspaceId: props.workspaceId,
        field,
        title,
        type,
        required: false,
        properties
      }
    })
    .filter(Boolean) as Partial<DataTableColumnType>[]
  
  // Create a map of column titles to their types for row parsing
  const columnTypeMap = new Map<string, ColumnFieldType>()
  columns.forEach(col => {
    if (col.title && col.type !== undefined) {
      columnTypeMap.set(col.title, col.type as ColumnFieldType)
    }
  })
  
  // Parse data rows with proper value conversion
  const rows: Record<string, any>[] = []
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i]
    if (!rowData || rowData.every(cell => cell === undefined || cell === null || cell === '')) {
      continue // Skip empty rows
    }
    
    // Map by header title
    const simpleRow: Record<string, any> = {}
    headerRow.forEach((header, idx) => {
      if (header !== undefined && header !== null && String(header).trim() !== '') {
        const colTitle = String(header).trim()
        const colType = columnTypeMap.get(colTitle)
        simpleRow[colTitle] = cellValueToString(rowData[idx], colType)
      }
    })
    rows.push(simpleRow)
  }
  
  previewData.value = {
    columns,
    rows,
    sheetName
  }
}

async function handleSheetChange(sheetName: string) {
  selectedSheet.value = sheetName
  await parseSheet(sheetName)
}

function handleConfirmImport() {
  if (previewData.value) {
    emit('import', previewData.value)
  }
}

function handleCancel() {
  emit('cancel')
}

function handleRemoveFile() {
  fileList.value = []
  workbook.value = null
  sheets.value = []
  selectedSheet.value = ''
  previewData.value = null
  errorMessage.value = ''
}
</script>

<template>
  <div class="import-from-excel">
    <div class="upload-section">
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
            <p class="primary-text">Drop your Excel file here</p>
            <p class="secondary-text">or click to browse</p>
          </div>
          <p class="file-types">Supports .xlsx, .xls, .csv</p>
        </div>
      </el-upload>
    </div>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
    />

    <div v-if="isProcessing" class="processing-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Processing file...</span>
    </div>

    <template v-if="sheets.length > 0 && !isProcessing">
      <div class="sheet-selector" v-if="sheets.length > 1">
        <label>Select Sheet:</label>
        <el-select v-model="selectedSheet" @change="handleSheetChange">
          <el-option
            v-for="sheet in sheets"
            :key="sheet.name"
            :label="`${sheet.name} (${sheet.rowCount} rows, ${sheet.columnCount} columns)`"
            :value="sheet.name"
          />
        </el-select>
      </div>

      <div v-if="previewData" class="preview-section">
        <div class="preview-header">
          <h4>Preview</h4>
          <span class="preview-stats">
            {{ previewData.columns.length }} columns, {{ previewData.rows.length }} rows
          </span>
        </div>

        <div class="columns-preview">
          <h5>Columns to import:</h5>
          <div class="column-tags">
            <el-tag
              v-for="col in previewData.columns"
              :key="col.id"
              type="info"
              class="column-tag"
            >
              {{ col.title }}
              <span class="column-type-badge">{{ getTypeName(col.type as ColumnFieldType) }}</span>
            </el-tag>
          </div>
        </div>

        <div class="data-preview">
          <h5>Data preview (first 5 rows):</h5>
          <el-table
            :data="previewData.rows.slice(0, 5)"
            border
            size="small"
            class="preview-table"
            max-height="200"
          >
            <el-table-column
              v-for="col in previewData.columns"
              :key="col.id"
              :prop="col.title"
              :label="col.title"
              min-width="120"
              show-overflow-tooltip
            />
          </el-table>
        </div>

        <div class="action-buttons">
          <el-button @click="handleRemoveFile">
            <Icon name="material-symbols:delete-outline" />
            Remove File
          </el-button>
          <el-button type="primary" @click="handleConfirmImport">
            <Icon name="material-symbols:check" />
            Use This Data
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.import-from-excel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-section {
  .excel-uploader {
    width: 100%;
    
    :deep(.el-upload) {
      width: 100%;
    }
    
    :deep(.el-upload-dragger) {
      width: 100%;
      height: auto;
      padding: 32px 20px;
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      transition: all 0.3s;
      
      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    
    .upload-icon {
      font-size: 48px;
      color: var(--el-color-primary);
    }
    
    .upload-text {
      text-align: center;
      
      .primary-text {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin: 0;
      }
      
      .secondary-text {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 4px 0 0;
      }
    }
    
    .file-types {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      margin: 0;
    }
  }
}

.error-alert {
  margin-top: 8px;
}

.processing-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    font-size: 20px;
  }
}

.sheet-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  
  label {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  
  .el-select {
    flex: 1;
  }
}

.preview-section {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  
  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .preview-stats {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
  
  .columns-preview {
    margin-bottom: 16px;
    
    h5 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }
    
    .column-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .column-tag {
        font-size: 12px;
        
        .column-type-badge {
          margin-left: 6px;
          padding: 1px 4px;
          font-size: 10px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
      }
    }
  }
  
  .data-preview {
    margin-bottom: 16px;
    
    h5 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }
    
    .preview-table {
      border-radius: 6px;
      overflow: hidden;
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
