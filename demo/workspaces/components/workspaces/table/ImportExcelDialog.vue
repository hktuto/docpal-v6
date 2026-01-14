<script setup lang="ts">
import * as XLSX from 'xlsx'
import { v7 as uuidv7 } from 'uuid'
import type { CaseTreeRecord, CaseFieldRecord, FieldDisplayStructure } from '../../../utils/db/schema/newTableSchema'
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
  fields: Partial<CaseFieldRecord>[]
  rows: Record<string, any>[]
}

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

const { menuState, saveMenuItemToDb, findItemById, workspace } = useSingleWorkspaceContext()
const { createCaseTable, generateSlug } = useTableSchema()
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
  'id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
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
    function collectSlugs(items: any[]) {
      for (const item of items) {
        if (item.itemType === 'table' && item.slug) {
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
      
      // Get data rows for type detection (excluding header row)
      const dataRows = jsonData.slice(1).filter((row: any[]) => 
        row && !row.every((cell: any) => cell === undefined || cell === null || cell === '')
      )
      
      // Create field definitions with auto-detected types
      const fields: Partial<CaseFieldRecord>[] = validHeaders.map((header, idx) => {
        // Find the original column index in the full header row
        const originalIdx = headerRow.findIndex((h: any, i: number) => 
          h !== undefined && h !== null && String(h).trim() === header && 
          headerRow.slice(0, i).filter((hh: any) => hh !== undefined && hh !== null && String(hh).trim() === header).length === 
          validHeaders.slice(0, idx).filter(vh => vh === header).length
        )
        
        // Detect column type based on data
        const { type, properties } = detectColumnType(sheet, originalIdx, dataRows)
        
        // Create display structure
        const displayStructure: FieldDisplayStructure = {
          type,
          properties
        }
        
        return {
          id: uuidv7(),
          fieldName: columnFields[idx],
          fieldNameAlias: header,
          businessType: mapToBusinessType(type),
          fieldType: mapToDatabaseType(type),
          displayStructure,
          isRequired: false,
          isHidden: false,
          isArray: false,
          isUnique: false,
          fieldLength: 0,
        } as Partial<CaseFieldRecord>
      })
      
      // Create a map of field aliases to their types for row parsing
      const fieldTypeMap = new Map<string, ColumnFieldType>()
      fields.forEach(field => {
        if (field.fieldNameAlias && field.displayStructure?.type !== undefined) {
          fieldTypeMap.set(field.fieldNameAlias, field.displayStructure.type)
        }
      })
      
      // Parse data rows with proper value conversion
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
            const colType = fieldTypeMap.get(colTitle)
            row[colTitle] = cellValueToString(rowData[idx], colType)
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
        fields,
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
    // Return ISO datetime string
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
 * Analyzes the first N non-empty values in a column to determine the type
 */
function detectColumnType(
  sheet: XLSX.WorkSheet, 
  columnIndex: number, 
  dataRows: any[][]
): { type: ColumnFieldType; properties: Record<string, any> } {
  const sampleSize = Math.min(20, dataRows.length) // Check first 20 rows
  const samples: any[] = []
  
  // Collect non-empty samples from the data rows
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
      properties: { 
        autoFill: false,
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'local',
        timeFormat: 24
      } 
    }
  }
  
  // Check for Number type (including currency/percent)
  const numberCount = samples.filter(v => typeof v === 'number').length
  if (numberCount >= samples.length * 0.8) {
    // Check if values look like percentages (between 0 and 1)
    const percentLikeCount = samples.filter(v => typeof v === 'number' && v >= 0 && v <= 1).length
    if (percentLikeCount >= samples.length * 0.8) {
      // Could be percentage - check Excel format if available
      const cellRef = XLSX.utils.encode_cell({ r: 1, c: columnIndex })
      const cell = sheet[cellRef]
      if (cell?.z && (cell.z.includes('%') || cell.z.includes('0.00%'))) {
        return { 
          type: ColumnFieldType.Percent, 
          properties: { precision: 2 } 
        }
      }
    }
    
    // Check for currency format
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: columnIndex })
    const cell = sheet[cellRef]
    if (cell?.z) {
      const format = cell.z
      if (format.includes('$') || format.includes('¥') || format.includes('€') || format.includes('£')) {
        const symbol = format.match(/[\$\¥\€\£]/)?.[0] || '$'
        return { 
          type: ColumnFieldType.Currency, 
          properties: { symbol, precision: 2, symbolAlign: 0 } 
        }
      }
      if (format.includes('%')) {
        return { 
          type: ColumnFieldType.Percent, 
          properties: { precision: 2 } 
        }
      }
    }
    
    return { 
      type: ColumnFieldType.Number, 
      properties: { symbol: '', precision: 2, symbolAlign: 2 } 
    }
  }
  
  // Check for Boolean type
  const boolCount = samples.filter(v => typeof v === 'boolean').length
  if (boolCount >= samples.length * 0.8) {
    return { 
      type: ColumnFieldType.Checkbox, 
      properties: { trueIcon: 'check', falseIcon: '' } 
    }
  }
  
  // Check for text patterns
  const stringValues = samples.filter(v => typeof v === 'string')
  if (stringValues.length > 0) {
    // Check for Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailCount = stringValues.filter(v => emailPattern.test(v)).length
    if (emailCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.Email, properties: {} }
    }
    
    // Check for URL pattern
    const urlPattern = /^https?:\/\//i
    const urlCount = stringValues.filter(v => urlPattern.test(v)).length
    if (urlCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.URL, properties: { openInNewTab: true } }
    }
    
    // Check for Phone pattern (simple check)
    const phonePattern = /^[\+\d\s\-\(\)]{7,}$/
    const phoneCount = stringValues.filter(v => phonePattern.test(v)).length
    if (phoneCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.Phone, properties: { includeCountryCode: false } }
    }
    
    // Check for short text vs long text
    const avgLength = stringValues.reduce((sum, v) => sum + v.length, 0) / stringValues.length
    if (avgLength < 50) {
      return { type: ColumnFieldType.Text, properties: { defaultValue: '' } }
    }
  }
  
  // Default to MultiText
  return { type: ColumnFieldType.MultiText, properties: { defaultValue: '', maxLength: 1000 } }
}

/**
 * Map ColumnFieldType to business type
 */
function mapToBusinessType(type: ColumnFieldType): string {
  switch (type) {
    case ColumnFieldType.Number:
    case ColumnFieldType.Rating:
      return 'number'
    case ColumnFieldType.Checkbox:
      return 'boolean'
    case ColumnFieldType.DateTime:
    case ColumnFieldType.CreatedTime:
    case ColumnFieldType.LastModifiedTime:
      return 'date'
    case ColumnFieldType.Relation:
      return 'relation'
    case ColumnFieldType.Formula:
      return 'formula'
    case ColumnFieldType.Aggregation:
      return 'aggregation'
    default:
      return 'text'
  }
}

/**
 * Map ColumnFieldType to database type
 */
function mapToDatabaseType(type: ColumnFieldType): string {
  switch (type) {
    case ColumnFieldType.Number:
    case ColumnFieldType.Rating:
      return 'numeric'
    case ColumnFieldType.Checkbox:
      return 'boolean'
    case ColumnFieldType.DateTime:
    case ColumnFieldType.CreatedTime:
    case ColumnFieldType.LastModifiedTime:
      return 'timestamp'
    case ColumnFieldType.User:
    case ColumnFieldType.CreatedBy:
    case ColumnFieldType.LastModifiedBy:
    case ColumnFieldType.Relation:
      return 'uuid'
    case ColumnFieldType.MultiSelect:
    case ColumnFieldType.Document:
      return 'jsonb'
    default:
      return 'text'
  }
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

/**
 * Get tag color type based on column type
 */
function getColumnTagType(type: ColumnFieldType): '' | 'success' | 'info' | 'warning' | 'danger' {
  switch (type) {
    case ColumnFieldType.Number:
    case ColumnFieldType.Currency:
    case ColumnFieldType.Percent:
      return 'success'
    case ColumnFieldType.DateTime:
      return 'warning'
    case ColumnFieldType.Checkbox:
      return 'info'
    case ColumnFieldType.Email:
    case ColumnFieldType.URL:
    case ColumnFieldType.Phone:
      return ''
    default:
      return 'info'
  }
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
  const createdTables: { id: string; name: string; physicalTableName: string; fields: any[]; rows: any[] }[] = []
  
  try {
    // Phase 1: Create tables, fields, views (fast)
    for (const sheet of selectedSheets.value) {
      const tableId = uuidv7()
      
      // Create the case table structure (without importing rows)
      const result = await createCaseTable(
        {
          id: tableId,
          name: sheet.tableName,
          entityId: effectiveEntityId.value,
          description: `Imported from ${fileName.value} - Sheet: ${sheet.name}`
        },
        sheet.fields,
        undefined // createdBy
      )
      
      // Create tree item
      const treeItem: Partial<CaseTreeRecord> = {
        id: uuidv7(),
        entityId: effectiveEntityId.value,
        label: sheet.tableName,
        slug: sheet.slug,
        itemType: 'table',
        itemId: tableId,
        parentId: effectiveParentFolderId.value,
        order: 0,
      }
      
      // Save to database
      await saveMenuItemToDb(treeItem)
      
      // Add to local menu state
      if (effectiveParentFolderId.value) {
        const parentFolder = findItemById(menuState.value.items, effectiveParentFolderId.value)
        if (parentFolder && parentFolder.itemType === 'folder') {
          if (!parentFolder.children) {
            parentFolder.children = []
          }
          parentFolder.children.push(treeItem as any)
        } else {
          menuState.value.items.push(treeItem as any)
        }
      } else {
        menuState.value.items.push(treeItem as any)
      }
      
      createdTables.push({ 
        id: tableId, 
        name: sheet.tableName,
        physicalTableName: result.table.tableName,
        fields: result.fields,
        rows: sheet.rows
      })
    }
    
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
              
              <!-- Column types preview -->
              <div v-if="sheet.columns.length > 0 && sheet.selected" class="column-types-preview">
                <div class="column-type-tags">
                  <el-tag
                    v-for="col in sheet.columns.slice(0, 5)"
                    :key="col.id"
                    size="small"
                    :type="getColumnTagType(col.type as ColumnFieldType)"
                    class="column-type-tag"
                  >
                    {{ col.title }}: {{ getTypeName(col.type as ColumnFieldType) }}
                  </el-tag>
                  <el-tag v-if="sheet.columns.length > 5" size="small" type="info">
                    +{{ sheet.columns.length - 5 }} more
                  </el-tag>
                </div>
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
      
      .column-types-preview {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed var(--el-border-color-lighter);
        
        .column-type-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          
          .column-type-tag {
            font-size: 11px;
          }
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
