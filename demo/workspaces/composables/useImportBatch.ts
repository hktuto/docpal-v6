import * as XLSX from 'xlsx'
import { v7 as uuidv7 } from 'uuid'
import type { CaseTreeRecord, CaseFieldRecord, FieldDisplayStructure } from '../utils/db/schema/newTableSchema'
import { ColumnFieldType } from '../utils/tableColumnType'
import { ElMessage, ElMessageBox } from 'element-plus'

interface SheetData {
  name: string
  tableName: string
  slug: string
  headers: string[]
  fields: Partial<CaseFieldRecord>[]
  rows: Record<string, any>[]
}

interface ImportBatchResult {
  success: boolean
  duplicates?: string[]
  tablesCreated?: { id: string; name: string }[]
  error?: string
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
 * Detect the column type based on cell values
 */
function detectColumnType(
  samples: any[]
): { type: ColumnFieldType; properties: Record<string, any> } {
  if (samples.length === 0) {
    return { type: ColumnFieldType.Text, properties: { defaultValue: '' } }
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
  
  // Check for Number type
  const numberCount = samples.filter(v => typeof v === 'number').length
  if (numberCount >= samples.length * 0.8) {
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
    
    // Check for Phone pattern
    const phonePattern = /^[\+\d\s\-\(\)]{7,}$/
    const phoneCount = stringValues.filter(v => phonePattern.test(v)).length
    if (phoneCount >= stringValues.length * 0.8) {
      return { type: ColumnFieldType.Phone, properties: { includeCountryCode: false } }
    }
  }
  
  // Default to Text
  return { type: ColumnFieldType.Text, properties: { defaultValue: '' } }
}

/**
 * Convert a cell value to string
 */
function cellValueToString(value: any): string {
  if (value === undefined || value === null) {
    return ''
  }
  
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return ''
    }
    return value.toISOString()
  }
  
  if (typeof value === 'number') {
    return String(value)
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  return String(value)
}

/**
 * Read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Check if a file is an Excel file
 */
export function isExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
  const validExtensions = ['xlsx', 'xls', 'csv']
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  return validTypes.includes(file.type) || validExtensions.includes(extension || '')
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

export function useImportBatch() {
  const { menuState, saveMenuItemToDb, findItemById, workspace } = useSingleWorkspaceContext()
  const { createCaseTable, generateSlug } = useTableSchema()
  const { queueImportJobs } = useImportQueue()

  /**
   * Get all existing table names/slugs in the workspace
   */
  function getExistingTableNames(): { names: string[]; slugs: string[] } {
    const names: string[] = []
    const slugs: string[] = []
    
    function collectFromItems(items: any[]) {
      for (const item of items) {
        if (item.itemType === 'table') {
          names.push(item.label.toLowerCase())
          if (item.slug) {
            slugs.push(item.slug.toLowerCase())
          }
        }
        if (item.children) {
          collectFromItems(item.children)
        }
      }
    }
    
    collectFromItems(menuState.value.items)
    return { names, slugs }
  }

  /**
   * Generate unique table slug
   */
  function generateUniqueTableSlug(name: string, existingSlugs: string[]): string {
    let baseSlug = generateSlug(name)
    let slug = baseSlug
    let counter = 1
    
    while (existingSlugs.includes(slug.toLowerCase())) {
      counter++
      slug = `${baseSlug}-${counter}`
    }
    
    return slug
  }

  /**
   * Parse Excel file and extract sheet data
   */
  async function parseExcelFile(file: File, entityId: string): Promise<SheetData[]> {
    const data = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
    
    const sheetNames = workbook.SheetNames || []
    if (sheetNames.length === 0) {
      throw new Error('No sheets found in the file')
    }
    
    const { slugs: existingSlugs } = getExistingTableNames()
    const parsedSheets: SheetData[] = []
    const usedSlugs = [...existingSlugs]
    
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      
      // Get headers from first row
      const headerRow = jsonData[0] || []
      const validHeaders = headerRow
        .filter((h: any) => h !== undefined && h !== null && String(h).trim() !== '')
        .map((h: any) => String(h).trim())
      
      // Skip sheets with no valid headers
      if (validHeaders.length === 0) {
        continue
      }
      
      // Generate unique field names
      const fieldNames = generateUniqueFieldNames(validHeaders)
      
      // Get data rows (excluding header)
      const dataRows = jsonData.slice(1).filter((row: any[]) => 
        row && !row.every((cell: any) => cell === undefined || cell === null || cell === '')
      )
      
      // Create field definitions with auto-detected types
      const fields: Partial<CaseFieldRecord>[] = validHeaders.map((header, idx) => {
        const originalIdx = headerRow.findIndex((h: any, i: number) => 
          h !== undefined && h !== null && String(h).trim() === header && 
          headerRow.slice(0, i).filter((hh: any) => hh !== undefined && hh !== null && String(hh).trim() === header).length === 
          validHeaders.slice(0, idx).filter(vh => vh === header).length
        )
        
        // Collect samples for type detection
        const samples: any[] = []
        for (let i = 0; i < Math.min(20, dataRows.length) && samples.length < 10; i++) {
          const value = dataRows[i]?.[originalIdx]
          if (value !== undefined && value !== null && value !== '') {
            samples.push(value)
          }
        }
        
        const { type, properties } = detectColumnType(samples)
        
        // Create display structure
        const displayStructure: FieldDisplayStructure = {
          type,
          properties,
        }
        
        return {
          id: uuidv7(),
          fieldName: fieldNames[idx],
          fieldNameAlias: header,
          businessType: mapToBusinessType(type) as any,
          fieldType: mapToDatabaseType(type) as any,
          displayStructure,
          isRequired: false,
          isHidden: false,
          isArray: false,
          isUnique: false,
          fieldLength: 0,
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
            row[colTitle] = cellValueToString(rowData[idx])
          }
        })
        rows.push(row)
      }
      
      // Generate unique table slug
      const tableSlug = generateUniqueTableSlug(sheetName, usedSlugs)
      usedSlugs.push(tableSlug.toLowerCase())
      
      parsedSheets.push({
        name: sheetName,
        tableName: sheetName,
        slug: tableSlug,
        headers: validHeaders,
        fields,
        rows
      })
    }
    
    return parsedSheets
  }

  /**
   * Import Excel file directly without dialog
   */
  async function importExcelFile(
    file: File, 
    entityId: string, 
    parentFolderId?: string | null
  ): Promise<ImportBatchResult> {
    // Validate file type
    if (!isExcelFile(file)) {
      ElMessage.error('Please drop an Excel file (.xlsx, .xls) or CSV file (.csv)')
      return { success: false, error: 'Invalid file type' }
    }
    
    try {
      // Parse the Excel file
      const sheets = await parseExcelFile(file, entityId)
      
      if (sheets.length === 0) {
        ElMessage.warning('No valid sheets found in the file')
        return { success: false, error: 'No valid sheets found' }
      }
      
      // Check for duplicate table names
      const { names: existingNames } = getExistingTableNames()
      const duplicates = sheets
        .map(s => s.tableName.toLowerCase())
        .filter(name => existingNames.includes(name))
      
      if (duplicates.length > 0) {
        const duplicateList = [...new Set(duplicates)].join(', ')
        
        try {
          await ElMessageBox.confirm(
            `The following sheet names already exist as tables: ${duplicateList}. These sheets will be skipped. Continue importing the remaining sheets?`,
            'Duplicate Tables Found',
            {
              confirmButtonText: 'Continue',
              cancelButtonText: 'Cancel',
              type: 'warning'
            }
          )
        } catch {
          return { success: false, duplicates: [...new Set(duplicates)], error: 'User cancelled due to duplicates' }
        }
        
        // Filter out duplicate sheets
        const filteredSheets = sheets.filter(
          s => !existingNames.includes(s.tableName.toLowerCase())
        )
        
        if (filteredSheets.length === 0) {
          ElMessage.warning('All sheets have duplicate names. No tables to import.')
          return { success: false, duplicates: [...new Set(duplicates)], error: 'All sheets are duplicates' }
        }
        
        return await createTablesFromSheets(filteredSheets, entityId, parentFolderId, file.name)
      }
      
      return await createTablesFromSheets(sheets, entityId, parentFolderId, file.name)
      
    } catch (error: any) {
      console.error('Error importing Excel file:', error)
      ElMessage.error(error.message || 'Failed to import Excel file')
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  /**
   * Create tables from parsed sheets
   */
  async function createTablesFromSheets(
    sheets: SheetData[],
    entityId: string,
    parentFolderId: string | null | undefined,
    fileName: string
  ): Promise<ImportBatchResult> {
    const createdTables: { id: string; name: string; physicalTableName: string; fields: any[]; rows: any[] }[] = []
    
    try {
      // Phase 1: Create tables, fields, views
      for (const sheet of sheets) {
        const tableId = uuidv7()
        
        // Create the case table structure
        const result = await createCaseTable(
          {
            id: tableId,
            name: sheet.tableName,
            entityId,
            description: `Imported from ${fileName} - Sheet: ${sheet.name}`
          },
          sheet.fields,
          undefined
        )
        
        // Create tree item
        const treeItem: Partial<CaseTreeRecord> = {
          id: uuidv7(),
          entityId,
          label: sheet.tableName,
          slug: sheet.slug,
          itemType: 'table',
          itemId: tableId,
          parentId: parentFolderId || null,
          order: 0,
        }
        
        // Save tree item to database
        await saveMenuItemToDb(treeItem)
        
        // Add to local menu state
        if (parentFolderId) {
          const parentFolder = findItemById(menuState.value.items, parentFolderId)
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
      
      // Show success message
      const tableCount = createdTables.length
      const rowCount = createdTables.reduce((sum, t) => sum + t.rows.length, 0)
      
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
            columns: t.fields,
            rows: t.rows
          }))
        
        queueImportJobs(importJobs)
      }
      
      return {
        success: true,
        tablesCreated: createdTables.map(t => ({ id: t.id, name: t.name }))
      }
      
    } catch (error: any) {
      console.error('Error creating tables:', error)
      ElMessage.error('Failed to create tables. Please try again.')
      return { success: false, error: error.message || 'Failed to create tables' }
    }
  }

  return {
    importExcelFile,
    isExcelFile
  }
}
