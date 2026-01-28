import * as XLSX from 'xlsx'
import type { CaseFieldRecord, CaseTableRecord } from '../utils/db/schema/newTableSchema'
import { ElMessage } from 'element-plus'
import { useCurrentUser } from './useCurrentUser'

// =============================================================================
// Types
// =============================================================================

export interface SheetInfo {
  name: string
  index: number
  rowCount: number
  columns: string[]
  previewRows: Record<string, any>[]
}

export interface ColumnMapping {
  excelColumn: string
  fieldName: string | null // null means "skip"
  autoSuggested: boolean
}

export interface ImportConfig {
  sheetIndex: number
  columnMappings: ColumnMapping[]
  lookupColumns: string[] // fieldNames to match on for update
  updateStrategy: 'all' | 'non_empty'
}

export interface ImportResult {
  inserted: number
  updated: number
  skipped: number
  errors: { row: number; field?: string; message: string }[]
  relationErrors: { row: number; field: string; value: string }[]
}

export interface ImportProgress {
  current: number
  total: number
  phase: 'parsing' | 'mapping' | 'importing' | 'done'
}

// =============================================================================
// Helper Functions
// =============================================================================

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
 * Uses a simple contains-based matching
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

// =============================================================================
// Composable
// =============================================================================

export interface UseImportToTableOptions {
  physicalTableName: Ref<string>
  fields: Ref<CaseFieldRecord[]>
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
}

export function useImportToTable(options: UseImportToTableOptions) {
  const { physicalTableName, fields, query } = options
  const { initCurrentUser, getCurrentUserId } = useCurrentUser()

  const loading = ref(false)
  const progress = ref<ImportProgress>({ current: 0, total: 0, phase: 'parsing' })

  // =============================================================================
  // Excel Parsing
  // =============================================================================

  /**
   * Parse Excel file and return sheet information
   */
  async function parseExcelSheets(file: File): Promise<SheetInfo[]> {
    if (!isExcelFile(file)) {
      throw new Error('Invalid file type. Please use .xlsx, .xls, or .csv files.')
    }

    const data = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })

    const sheetNames = workbook.SheetNames || []
    if (sheetNames.length === 0) {
      throw new Error('No sheets found in the file')
    }

    const sheets: SheetInfo[] = []

    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i]
      const sheet = workbook.Sheets[sheetName]

      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][]

      // Get headers from first row
      const headerRow = jsonData[0] || []
      const columns = headerRow
        .map((h: any, idx: number) => ({ value: h, idx }))
        .filter((h) => h.value !== undefined && h.value !== null && String(h.value).trim() !== '')
        .map((h) => String(h.value).trim())

      if (columns.length === 0) continue

      // Get data rows (excluding header)
      const dataRows = jsonData.slice(1).filter((row: any[]) => 
        row && !row.every((cell: any) => cell === undefined || cell === null || cell === '')
      )

      // Create preview rows (first 5)
      const previewRows: Record<string, any>[] = []
      for (let j = 0; j < Math.min(5, dataRows.length); j++) {
        const row: Record<string, any> = {}
        headerRow.forEach((header: any, idx: number) => {
          if (header !== undefined && header !== null && String(header).trim() !== '') {
            row[String(header).trim()] = dataRows[j]?.[idx] ?? ''
          }
        })
        previewRows.push(row)
      }

      sheets.push({
        name: sheetName,
        index: i,
        rowCount: dataRows.length,
        columns,
        previewRows
      })
    }

    return sheets
  }

  /**
   * Parse a specific sheet and return all data rows
   */
  async function parseSheetData(file: File, sheetIndex: number): Promise<{ columns: string[]; rows: Record<string, any>[] }> {
    const data = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(data, { type: 'array', cellDates: false, cellNF: true })

    const sheetName = workbook.SheetNames[sheetIndex]
    if (!sheetName) {
      throw new Error(`Sheet index ${sheetIndex} not found`)
    }

    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][]

    const headerRow = jsonData[0] || []
    const columns = headerRow
      .filter((h: any) => h !== undefined && h !== null && String(h).trim() !== '')
      .map((h: any) => String(h).trim())

    const dataRows = jsonData.slice(1).filter((row: any[]) =>
      row && !row.every((cell: any) => cell === undefined || cell === null || cell === '')
    )

    const rows: Record<string, any>[] = []
    for (const dataRow of dataRows) {
      const row: Record<string, any> = {}
      headerRow.forEach((header: any, idx: number) => {
        if (header !== undefined && header !== null && String(header).trim() !== '') {
          const value = dataRow[idx]
          row[String(header).trim()] = value !== undefined && value !== null ? String(value) : ''
        }
      })
      rows.push(row)
    }

    return { columns, rows }
  }

  // =============================================================================
  // Column Mapping
  // =============================================================================

  /**
   * Get eligible fields for import (exclude relation, virtual, formula)
   */
  function getEligibleFields(): CaseFieldRecord[] {
    const excludeTypes = ['relation', 'formula', 'aggregation']
    return fields.value.filter(
      (f) => !excludeTypes.includes(f.businessType) && !f.fieldName.includes('.')
    )
  }

  /**
   * Auto-suggest column mappings based on name similarity
   */
  function suggestMappings(excelColumns: string[]): ColumnMapping[] {
    const eligibleFields = getEligibleFields()
    const usedFields = new Set<string>()
    const mappings: ColumnMapping[] = []

    for (const excelCol of excelColumns) {
      let bestMatch: CaseFieldRecord | null = null
      let bestScore = 0

      for (const field of eligibleFields) {
        if (usedFields.has(field.fieldName)) continue

        // Check similarity against both fieldName and fieldNameAlias
        const scoreByName = calculateSimilarity(excelCol, field.fieldName)
        const scoreByAlias = calculateSimilarity(excelCol, field.fieldNameAlias)
        const score = Math.max(scoreByName, scoreByAlias)

        if (score > bestScore && score >= 0.5) {
          bestScore = score
          bestMatch = field
        }
      }

      if (bestMatch) {
        usedFields.add(bestMatch.fieldName)
        mappings.push({
          excelColumn: excelCol,
          fieldName: bestMatch.fieldName,
          autoSuggested: true
        })
      } else {
        mappings.push({
          excelColumn: excelCol,
          fieldName: null,
          autoSuggested: false
        })
      }
    }

    return mappings
  }

  // =============================================================================
  // Import Logic
  // =============================================================================

  /**
   * Resolve relation values for a row
   * Returns the row with relation fields populated with UUIDs
   */
  async function resolveRelations(
    row: Record<string, any>,
    mappings: ColumnMapping[]
  ): Promise<{ resolvedRow: Record<string, any>; errors: { field: string; value: string }[] }> {
    const resolvedRow = { ...row }
    const errors: { field: string; value: string }[] = []

    // Get relation fields with lookup configuration
    const relationFields = fields.value.filter(
      (f) => f.businessType === 'relation' && f.lookupColumnName && f.lookupFieldId && f.relationTableId
    )

    for (const relField of relationFields) {
      const sourceValue = row[relField.lookupColumnName!]
      if (!sourceValue) continue

      try {
        // Get target table info
        const targetTableData = await query<CaseTableRecord>(
          `SELECT * FROM case_tables WHERE id = $1`,
          [relField.relationTableId]
        )
        if (targetTableData.length === 0) continue

        const targetTable = targetTableData[0]

        // Get target field info
        const targetFieldData = await query<CaseFieldRecord>(
          `SELECT * FROM case_fields WHERE id = $1`,
          [relField.lookupFieldId]
        )
        if (targetFieldData.length === 0) continue

        const targetField = targetFieldData[0]

        // Find matching records in target table
        const matches = await query<{ id: string }>(
          `SELECT id FROM "${targetTable.tableName}" WHERE "${targetField.fieldName}" = $1`,
          [sourceValue]
        )

        if (matches.length > 0) {
          // Set relation field to matched IDs
          resolvedRow[relField.fieldName] = matches.map((m) => m.id)
        } else {
          // Log error but continue - leave relation empty
          errors.push({ field: relField.fieldNameAlias, value: String(sourceValue) })
        }
      } catch (err) {
        console.error(`Error resolving relation ${relField.fieldName}:`, err)
        errors.push({ field: relField.fieldNameAlias, value: String(sourceValue) })
      }
    }

    return { resolvedRow, errors }
  }

  /**
   * Import data with upsert logic
   */
  async function importData(
    excelRows: Record<string, any>[],
    config: ImportConfig
  ): Promise<ImportResult> {
    if (!physicalTableName.value) {
      throw new Error('Table name is not set')
    }

    // Ensure current user is initialized before importing
    await initCurrentUser()

    const result: ImportResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      relationErrors: []
    }

    progress.value = { current: 0, total: excelRows.length, phase: 'importing' }
    loading.value = true

    try {
      // Build mapping lookup: excelColumn -> fieldName
      const mappingLookup = new Map<string, string>()
      for (const m of config.columnMappings) {
        if (m.fieldName) {
          mappingLookup.set(m.excelColumn, m.fieldName)
        }
      }

      // Get field types for proper value conversion
      const fieldTypeMap = new Map<string, CaseFieldRecord>()
      for (const f of fields.value) {
        fieldTypeMap.set(f.fieldName, f)
      }

      for (let i = 0; i < excelRows.length; i++) {
        const excelRow = excelRows[i]
        progress.value.current = i + 1

        try {
          // Map Excel columns to table fields
          const mappedRow: Record<string, any> = {}
          for (const [excelCol, value] of Object.entries(excelRow)) {
            const fieldName = mappingLookup.get(excelCol)
            if (fieldName) {
              // Convert value based on field type
              const field = fieldTypeMap.get(fieldName)
              mappedRow[fieldName] = convertValue(value, field)
            }
          }

          // Skip if no fields mapped
          if (Object.keys(mappedRow).length === 0) {
            result.skipped++
            continue
          }

          // Resolve relations
          const { resolvedRow, errors: relErrors } = await resolveRelations(mappedRow, config.columnMappings)
          for (const err of relErrors) {
            result.relationErrors.push({ row: i + 2, ...err }) // +2 for 1-indexed + header
          }

          // Check if record exists (upsert logic)
          if (config.lookupColumns.length > 0) {
            const whereConditions: string[] = []
            const whereValues: any[] = []

            for (let j = 0; j < config.lookupColumns.length; j++) {
              const col = config.lookupColumns[j]
              if (resolvedRow[col] !== undefined && resolvedRow[col] !== '') {
                whereConditions.push(`"${col}" = $${whereValues.length + 1}`)
                whereValues.push(resolvedRow[col])
              }
            }

            if (whereConditions.length > 0) {
              const existing = await query<{ id: string }>(
                `SELECT id FROM "${physicalTableName.value}" WHERE ${whereConditions.join(' AND ')}`,
                whereValues
              )

              if (existing.length > 0) {
                // Update existing record
                await updateExistingRow(existing[0].id, resolvedRow, config.updateStrategy)
                result.updated++
                continue
              }
            }
          }

          // Insert new record
          await insertNewRow(resolvedRow)
          result.inserted++
        } catch (err: any) {
          result.errors.push({
            row: i + 2, // 1-indexed + header row
            message: err.message || 'Unknown error'
          })
          result.skipped++
        }
      }

      progress.value.phase = 'done'
      return result
    } finally {
      loading.value = false
    }
  }

  /**
   * Convert a value based on field type
   */
  function convertValue(value: any, field?: CaseFieldRecord): any {
    if (value === undefined || value === null || value === '') {
      return null
    }

    const strValue = String(value).trim()
    if (strValue === '') return null

    if (!field) return strValue

    switch (field.businessType) {
      case 'number':
        // Remove common number formatting
        const cleanNum = strValue.replace(/[$€£¥,\s]/g, '')
        const num = parseFloat(cleanNum)
        return isNaN(num) ? null : num

      case 'boolean':
        const lower = strValue.toLowerCase()
        if (['true', 'yes', '1', 'on'].includes(lower)) return true
        if (['false', 'no', '0', 'off'].includes(lower)) return false
        return null

      case 'date':
        // Try to parse date
        const date = new Date(strValue)
        return isNaN(date.getTime()) ? null : date.toISOString()

      default:
        return strValue
    }
  }

  /**
   * Insert a new row
   */
  async function insertNewRow(row: Record<string, any>): Promise<void> {
    // Add createdBy and updatedBy
    const currentUserId = getCurrentUserId()
    const rowWithUser = {
      ...row,
      createdBy: currentUserId,
      updatedBy: currentUserId
    }

    const columnNames = Object.keys(rowWithUser).filter((k) => rowWithUser[k] !== null && rowWithUser[k] !== undefined)
    if (columnNames.length === 0) return

    const placeholders = columnNames.map((_, i) => `$${i + 1}`)
    const values = columnNames.map((k) => {
      const val = rowWithUser[k]
      // Convert arrays to proper format for PostgreSQL
      if (Array.isArray(val)) {
        return val
      }
      return val
    })

    const sql = `INSERT INTO "${physicalTableName.value}" (${columnNames.map((c) => `"${c}"`).join(', ')})
                 VALUES (${placeholders.join(', ')})`

    await query(sql, values)
  }

  /**
   * Update an existing row
   */
  async function updateExistingRow(
    id: string,
    row: Record<string, any>,
    strategy: 'all' | 'non_empty'
  ): Promise<void> {
    const updateKeys = Object.keys(row).filter((k) => {
      if (k === 'id') return false
      if (strategy === 'non_empty' && (row[k] === null || row[k] === undefined || row[k] === '')) {
        return false
      }
      return true
    })

    if (updateKeys.length === 0) return

    const currentUserId = getCurrentUserId()
    const setClauses = updateKeys.map((k, i) => `"${k}" = $${i + 1}`)
    const values = [...updateKeys.map((k) => {
      const val = row[k]
      if (Array.isArray(val)) return val
      return val
    }), currentUserId, id]

    const sql = `UPDATE "${physicalTableName.value}" 
                 SET ${setClauses.join(', ')}, "updatedAt" = NOW(), "updatedBy" = $${values.length - 1}
                 WHERE id = $${values.length}`

    await query(sql, values)
  }

  return {
    loading,
    progress,
    parseExcelSheets,
    parseSheetData,
    getEligibleFields,
    suggestMappings,
    importData,
    isExcelFile
  }
}
