<script setup lang="ts">
import * as XLSX from 'xlsx'
import { v7 as uuidv7 } from 'uuid'
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import type { DataTableColumnType } from '../../../utils/db/schema/table'
import { ColumnFieldType } from '../../../utils/tableColumnType'
import { ElMessage } from 'element-plus'

interface SheetImportConfig {
  name: string
  tableName: string
  slug: string
  selected: boolean
  rowCount: number
  columnCount: number
  headers: string[]
  columns: Partial<DataTableColumnType>[]
  rows: Record<string, any>[]
}

const props = defineProps<{
  workspaceId?: string
  parentFolderId?: string | null
}>()

// Internal state for dynamic workspaceId and parentFolderId
const effectiveWorkspaceId = ref<string>('')
const effectiveParentFolderId = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'success', tables: { id: string; name: string }[]): void
  (e: 'close'): void
}>()

const { menuState, saveMenuToDb, findItemById } = useSingleWorkspaceContext()
const { createDataTable, generateSlug } = useTableSchema()
const { queueImportJobs } = useImportQueue()

const dialogVisible = ref(false)
const isProcessing = ref(false)
const isImporting = ref(false)
const errorMessage = ref('')
const workbook = ref<XLSX.WorkBook | null>(null)
const sheets = ref<SheetImportConfig[]>([])
const fileName = ref('')

// Computed
const selectedSheets = computed(() => sheets.value.filter(s => s.selected))
const hasSelectedSheets = computed(() => selectedSheets.value.length > 0)
const totalRows = computed(() => selectedSheets.value.reduce((sum, s) => sum + s.rowCount, 0))

function open(workspaceId?: string, parentFolderId?: string | null) {
  // Use provided values or fall back to props
  effectiveWorkspaceId.value = workspaceId || props.workspaceId || ''
  effectiveParentFolderId.value = parentFolderId !== undefined ? parentFolderId : (props.parentFolderId ?? null)
  
  dialogVisible.value = true
  reset()
}

function openWithFile(file: File, workspaceId?: string, parentFolderId?: string | null) {
  // Use provided values or fall back to props
  effectiveWorkspaceId.value = workspaceId || props.workspaceId || ''
  effectiveParentFolderId.value = parentFolderId !== undefined ? parentFolderId : (props.parentFolderId ?? null)
  
  dialogVisible.value = true
  reset()
  
  // Process the file directly
  fileName.value = file.name
  processFile(file)
}

function close() {
  dialogVisible.value = false
  reset()
  emit('close')
}

function reset() {
  workbook.value = null
  sheets.value = []
  fileName.value = ''
  errorMessage.value = ''
  isProcessing.value = false
  isImporting.value = false
}

/**
 * Reserved column names that cannot be used as field names
 */
const RESERVED_COLUMN_NAMES = [
  'id', 'created_at', 'created_by', 'updated_at', 'updated_by',
  'oid', 'tableoid', 'xmin', 'cmin', 'xmax', 'cmax', 'ctid'
]

/**
 * Generate a field name from a title
 */
function generateFieldName(title: string): string {
  let field = title
    .toLowerCase()
    .trim()
    .replace(/[\s\-\.]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .replace(/^(\d)/, 'col_$1')
    || 'column'
  
  // If field is a reserved name, prefix with 'col_'
  if (RESERVED_COLUMN_NAMES.includes(field)) {
    field = `col_${field}`
  }
  
  return field
}

/**
 * Generate unique field names for columns
 */
function generateUniqueFieldNames(titles: string[]): string[] {
  const fieldCounts: Record<string, number> = {}
  const fields: string[] = []
  
  for (const title of titles) {
    let baseField = generateFieldName(title)
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

/**
 * Generate unique table slug
 */
function generateUniqueTableSlug(name: string, existingSlugs: string[]): string {
  let baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    counter++
    slug = `${baseSlug}-${counter}`
  }
  
  return slug
}

function handleFileChange(file: any) {
  errorMessage.value = ''
  sheets.value = []
  
  if (!file.raw) return
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
    errorMessage.value = 'Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }
  
  fileName.value = file.name
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
    
    // Get existing table slugs to avoid duplicates
    const existingSlugs: string[] = []
    function collectSlugs(items: MenuItem[]) {
      for (const item of items) {
        if (item.type === 'table' && item.slug) {
          existingSlugs.push(item.slug)
        }
        if (item.children) {
          collectSlugs(item.children)
        }
      }
    }
    collectSlugs(menuState.value.items)
    
    // Parse each sheet
    const parsedSheets: SheetImportConfig[] = []
    
    for (const sheetName of sheetNames) {
      const sheet = workbook.value.Sheets[sheetName]
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      
      const rowCount = Math.max(0, jsonData.length - 1) // Exclude header row
      const columnCount = range.e.c - range.s.c + 1
      
      // Get headers from first row
      const headerRow = jsonData[0] || []
      const validHeaders = headerRow
        .filter((h: any) => h !== undefined && h !== null && String(h).trim() !== '')
        .map((h: any) => String(h).trim())
      
      // Skip sheets with no valid headers
      if (validHeaders.length === 0) {
        parsedSheets.push({
          name: sheetName,
          tableName: sheetName,
          slug: '',
          selected: false,
          rowCount: 0,
          columnCount: 0,
          headers: [],
          columns: [],
          rows: []
        })
        continue
      }
      
      // Generate unique field names for columns
      const columnFields = generateUniqueFieldNames(validHeaders)
      
      // Create column definitions
      const columns: Partial<DataTableColumnType>[] = validHeaders.map((header, idx) => ({
        id: uuidv7(),
        workspaceId: effectiveWorkspaceId.value,
        field: columnFields[idx],
        title: header,
        type: ColumnFieldType.MultiText,
        required: false,
        properties: { defaultValue: '', maxLength: 1000 }
      }))
      
      // Parse data rows
      const rows: Record<string, any>[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i]
        if (!rowData || rowData.every((cell: any) => cell === undefined || cell === null || cell === '')) {
          continue
        }
        
        const row: Record<string, any> = {}
        headerRow.forEach((header: any, idx: number) => {
          if (header !== undefined && header !== null && String(header).trim() !== '') {
            const colTitle = String(header).trim()
            row[colTitle] = cellValueToString(rowData[idx])
          }
        })
        rows.push(row)
      }
      
      // Generate unique table slug
      const tableSlug = generateUniqueTableSlug(sheetName, [...existingSlugs, ...parsedSheets.map(s => s.slug)])
      existingSlugs.push(tableSlug)
      
      parsedSheets.push({
        name: sheetName,
        tableName: sheetName,
        slug: tableSlug,
        selected: validHeaders.length > 0 && rows.length > 0,
        rowCount: rows.length,
        columnCount: validHeaders.length,
        headers: validHeaders,
        columns,
        rows
      })
    }
    
    sheets.value = parsedSheets
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
 * Convert a cell value to string, handling Date objects properly
 */
function cellValueToString(value: any): string {
  if (value === undefined || value === null) {
    return ''
  }
  
  // Handle Date objects - format as ISO string or locale date
  if (value instanceof Date) {
    // Check if it's a valid date
    if (isNaN(value.getTime())) {
      return ''
    }
    // Return ISO date string (YYYY-MM-DD) for date-only values
    // or ISO datetime string for datetime values
    return value.toISOString()
  }
  
  // Handle numbers - preserve precision
  if (typeof value === 'number') {
    return String(value)
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  // Default: convert to string
  return String(value)
}

function toggleSheet(sheet: SheetImportConfig) {
  // Only allow toggling if sheet has valid data
  if (sheet.headers.length > 0) {
    sheet.selected = !sheet.selected
  }
}

function toggleAll(selected: boolean) {
  sheets.value.forEach(sheet => {
    if (sheet.headers.length > 0) {
      sheet.selected = selected
    }
  })
}

async function handleImport() {
  if (!hasSelectedSheets.value || isImporting.value) return
  
  isImporting.value = true
  const createdTables: { id: string; name: string; physicalTableName: string; columns: any[]; rows: any[] }[] = []
  
  try {
    // Phase 1: Create tables, columns, migrations (fast)
    for (const sheet of selectedSheets.value) {
      const dataTableId = uuidv7()
      
      // Create the data table structure (without importing rows)
      const result = await createDataTable(
        {
          id: dataTableId,
          name: sheet.tableName,
          slug: sheet.slug,
          workspaceId: effectiveWorkspaceId.value,
          description: `Imported from ${fileName.value} - Sheet: ${sheet.name}`
        },
        sheet.columns,
        undefined // createdBy
      )
      
      // Create menu item
      const menuItem: MenuItem = {
        id: uuidv7(),
        label: sheet.tableName,
        slug: sheet.slug,
        type: 'table',
        itemId: dataTableId
      }
      
      // Add to parent folder or root
      if (effectiveParentFolderId.value) {
        const parentFolder = findItemById(menuState.value.items, effectiveParentFolderId.value)
        if (parentFolder && parentFolder.type === 'folder') {
          if (!parentFolder.children) {
            parentFolder.children = []
          }
          parentFolder.children.push(menuItem)
        } else {
          menuState.value.items.push(menuItem)
        }
      } else {
        menuState.value.items.push(menuItem)
      }
      
      createdTables.push({ 
        id: dataTableId, 
        name: sheet.tableName,
        physicalTableName: result.dataTable.tableName,
        columns: result.columns,
        rows: sheet.rows
      })
    }
    
    // Save menu
    await saveMenuToDb()
    
    // Close dialog immediately - user can now navigate
    const tableCount = createdTables.length
    const rowCount = createdTables.reduce((sum, t) => sum + t.rows.length, 0)
    
    emit('success', createdTables.map(t => ({ id: t.id, name: t.name })))
    close()
    
    // Show initial message
    if (rowCount > 0) {
      ElMessage.success(`${tableCount} table(s) created. Importing ${rowCount} rows in background...`)
    } else {
      ElMessage.success(`${tableCount} table(s) created successfully!`)
    }
    
    // Phase 2: Queue row imports for background processing
    if (rowCount > 0) {
      const importJobs = createdTables
        .filter(t => t.rows.length > 0)
        .map(t => ({
          tableName: t.id,
          tableDisplayName: t.name,
          physicalTableName: t.physicalTableName,
          columns: t.columns,
          rows: t.rows
        }))
      
      queueImportJobs(importJobs)
    }
  } catch (error) {
    console.error('Error creating tables:', error)
    ElMessage.error('Failed to create tables. Please try again.')
  } finally {
    isImporting.value = false
  }
}

function handleRemoveFile() {
  reset()
}

defineExpose({ open, openWithFile, close })
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Import from Excel"
    width="700px"
    :close-on-click-modal="false"
    :close-on-press-escape="!isImporting"
    @close="close"
  >
    <div class="import-excel-dialog">
      <!-- Upload Section -->
      <div v-if="sheets.length === 0" class="upload-section">
        <el-upload
          class="excel-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls,.csv"
          :disabled="isProcessing"
        >
          <div class="upload-content">
            <el-icon v-if="isProcessing" class="is-loading upload-icon">
              <Icon name="material-symbols:progress-activity" />
            </el-icon>
            <Icon v-else name="material-symbols:upload-file-outline" class="upload-icon" />
            <div class="upload-text">
              <p class="primary-text">{{ isProcessing ? 'Processing...' : 'Drop your Excel file here' }}</p>
              <p class="secondary-text">or click to browse</p>
            </div>
            <p class="file-types">Supports .xlsx, .xls, .csv</p>
          </div>
        </el-upload>
        
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
          class="error-alert"
        />
      </div>

      <!-- Sheet Selection -->
      <div v-else class="sheets-section">
        <div class="sheets-header">
          <div class="file-info">
            <Icon name="material-symbols:description-outline" />
            <span class="file-name">{{ fileName }}</span>
            <el-button text size="small" @click="handleRemoveFile">
              <Icon name="material-symbols:close" />
            </el-button>
          </div>
          <div class="selection-actions">
            <el-button text size="small" @click="toggleAll(true)">Select All</el-button>
            <el-button text size="small" @click="toggleAll(false)">Deselect All</el-button>
          </div>
        </div>

        <div class="sheets-list">
          <div
            v-for="sheet in sheets"
            :key="sheet.name"
            class="sheet-item"
            :class="{ 
              selected: sheet.selected, 
              disabled: sheet.headers.length === 0 
            }"
            @click="toggleSheet(sheet)"
          >
            <el-checkbox
              :model-value="sheet.selected"
              :disabled="sheet.headers.length === 0"
              @click.stop
              @change="sheet.selected = $event as boolean"
            />
            
            <div class="sheet-info">
              <div class="sheet-name-row">
                <span class="sheet-original-name">{{ sheet.name }}</span>
                <Icon 
                  v-if="sheet.headers.length === 0" 
                  name="material-symbols:warning-outline" 
                  class="warning-icon"
                  v-tooltip="'No valid headers found in first row'"
                />
              </div>
              
              <div v-if="sheet.headers.length > 0" class="sheet-stats">
                <span>{{ sheet.columnCount }} columns</span>
                <span class="separator">•</span>
                <span>{{ sheet.rowCount }} rows</span>
              </div>
              <div v-else class="sheet-stats empty">
                No data or invalid headers
              </div>
            </div>

            <div v-if="sheet.headers.length > 0 && sheet.selected" class="table-name-input" @click.stop>
              <label>Table name:</label>
              <el-input
                v-model="sheet.tableName"
                size="small"
                placeholder="Table name"
                @input="sheet.slug = generateSlug(sheet.tableName)"
              />
            </div>
          </div>
        </div>

        <div v-if="hasSelectedSheets" class="import-summary">
          <Icon name="material-symbols:info-outline" />
          <span>
            Will create <strong>{{ selectedSheets.length }}</strong> table(s) 
            with <strong>{{ totalRows }}</strong> total rows
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close" :disabled="isImporting">Cancel</el-button>
        <el-button
          type="primary"
          :disabled="!hasSelectedSheets"
          :loading="isImporting"
          @click="handleImport"
        >
          {{ isImporting ? 'Importing...' : `Import ${selectedSheets.length} Table(s)` }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.import-excel-dialog {
  min-height: 300px;
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
      padding: 48px 20px;
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
    gap: 12px;
    
    .upload-icon {
      font-size: 56px;
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
  
  .error-alert {
    margin-top: 16px;
  }
}

.sheets-section {
  .sheets-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .file-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
    
    .selection-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .sheets-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 350px;
    overflow-y: auto;
  }
  
  .sheet-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(.disabled) {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
    
    &.selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
    
    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .el-checkbox {
      margin-top: 2px;
    }
    
    .sheet-info {
      flex: 1;
      min-width: 0;
      
      .sheet-name-row {
        display: flex;
        align-items: center;
        gap: 6px;
        
        .sheet-original-name {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
        
        .warning-icon {
          color: var(--el-color-warning);
          font-size: 16px;
        }
      }
      
      .sheet-stats {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
        
        .separator {
          margin: 0 6px;
        }
        
        &.empty {
          color: var(--el-color-warning);
        }
      }
    }
    
    .table-name-input {
      display: flex;
      align-items: center;
      gap: 8px;
      
      label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
      }
      
      .el-input {
        width: 180px;
      }
    }
  }
  
  .import-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: var(--el-color-info-light-9);
    border-radius: 6px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    
    .iconify {
      color: var(--el-color-info);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
