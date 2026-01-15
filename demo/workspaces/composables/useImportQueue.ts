import { v7 as uuidv7 } from 'uuid'
import { parseImportError, type ParsedImportError } from '../utils/importErrorParser'

export interface ImportRowError {
  rowIndex: number
  rowData: Record<string, any>
  error: string
  parsedError?: ParsedImportError
}

export interface ImportJob {
  id: string
  tableName: string
  tableDisplayName: string
  physicalTableName: string
  columns: any[]
  rows: Record<string, any>[]
  status: 'pending' | 'importing' | 'completed' | 'error'
  progress: {
    total: number
    imported: number
    errors: ImportRowError[]
  }
  startedAt?: string
  completedAt?: string
}

export interface ImportReport {
  id: string
  jobs: ImportJob[]
  totalTables: number
  totalRowsAttempted: number
  totalRowsImported: number
  totalErrors: number
  startedAt: string
  completedAt: string
}

// Global state for import queue
const importQueue = ref<ImportJob[]>([])
const currentJob = ref<ImportJob | null>(null)
const isProcessing = ref(false)
const completedReports = ref<ImportReport[]>([])
const currentReportId = ref<string | null>(null)

// Event emitter for UI updates
const eventBus = {
  listeners: new Map<string, Set<Function>>(),
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  },
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
  },
  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }
}

export function useImportQueue() {
  const { query } = usePglite()

  /**
   * Add jobs to the import queue and start processing
   */
  function queueImportJobs(jobs: Omit<ImportJob, 'id' | 'status' | 'progress'>[]): string {
    const reportId = uuidv7()
    currentReportId.value = reportId

    const newJobs: ImportJob[] = jobs.map((job) => ({
      ...job,
      id: uuidv7(),
      status: 'pending',
      progress: {
        total: job.rows.length,
        imported: 0,
        errors: []
      }
    }))

    importQueue.value.push(...newJobs)

    // Start processing if not already running
    if (!isProcessing.value) {
      processQueue(reportId)
    }

    return reportId
  }

  /**
   * Process the import queue
   */
  async function processQueue(reportId: string) {
    if (isProcessing.value) return
    isProcessing.value = true

    const startedAt = new Date().toISOString()
    const processedJobs: ImportJob[] = [] // Track processed jobs for report

    eventBus.emit('import-started', { reportId })

    while (importQueue.value.length > 0) {
      const job = importQueue.value[0]
      currentJob.value = job
      job.status = 'importing'
      job.startedAt = new Date().toISOString()

      eventBus.emit('job-started', job)

      try {
        await processJob(job)
        job.status = 'completed'
      } catch (error) {
        console.error('Job error:', error)
        job.status = 'error'
      }

      job.completedAt = new Date().toISOString()
      eventBus.emit('job-completed', job)

      // Save to processed jobs before removing
      processedJobs.push({ ...job })

      // Remove from queue
      importQueue.value.shift()
    }

    currentJob.value = null
    isProcessing.value = false

    // Generate report from processed jobs
    const report: ImportReport = {
      id: reportId,
      jobs: processedJobs,
      totalTables: processedJobs.length,
      totalRowsAttempted: processedJobs.reduce((sum, j) => sum + j.progress.total, 0),
      totalRowsImported: processedJobs.reduce((sum, j) => sum + j.progress.imported, 0),
      totalErrors: processedJobs.reduce((sum, j) => sum + j.progress.errors.length, 0),
      startedAt,
      completedAt: new Date().toISOString()
    }

    completedReports.value.push(report)
    eventBus.emit('import-completed', report)
    currentReportId.value = null
  }

  /**
   * Process a single import job
   */
  async function processJob(job: ImportJob) {
    const { physicalTableName, columns, rows } = job

    // Filter out system columns for import
    // System columns: CreatedTime, LastModifiedTime, CreatedBy, LastModifiedBy
    const systemColumnTypes = [21, 22, 23, 24]
    const systemFieldNames = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'id']

    const userColumns = columns.filter((c: any) => {
      // Check by type (old schema)
      if (c.type && systemColumnTypes.includes(c.type)) return false
      // Check by fieldName (new schema)
      if (c.fieldName && systemFieldNames.includes(c.fieldName)) return false
      return true
    })

    // Create column mapping for error parsing (used by all rows)
    const columnMapping: Record<string, string> = {}
    for (const column of userColumns) {
      const colName = column.fieldName || column.field
      const displayName = column.fieldNameAlias || column.title
      if (colName && displayName) {
        columnMapping[displayName] = colName
      }
    }

    // Process rows in batches for better performance
    const BATCH_SIZE = 10
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE
      const endIndex = Math.min(startIndex + BATCH_SIZE, rows.length)
      const batchRows = rows.slice(startIndex, endIndex)

      // Create promises for all rows in this batch
      const batchPromises = batchRows.map((row, batchRowIndex) => {
        const rowIndex = startIndex + batchRowIndex

        return (async () => {
          try {
            const columnNames: string[] = []
            const placeholders: string[] = []
            const values: any[] = []
            let paramIndex = 1

            // Add user data columns
            // Support both old schema (field/title) and new schema (fieldName/fieldNameAlias)
            for (const column of userColumns) {
              // Get the SQL column name (fieldName in new schema, field in old)
              const colName = column.fieldName || column.field
              // Get the display name for row data lookup (fieldNameAlias in new schema, title in old)
              const displayName = column.fieldNameAlias || column.title

              if (!colName && !displayName) continue

              const sqlColName = colName || displayName.toLowerCase().replace(/\s+/g, '_')
              let value = row[displayName]

              // Handle empty values
              if (value === '' || value === undefined || value === null) {
                value = null
              } else if (typeof value === 'string') {
                // Try to convert string values based on column type
                const trimmed = value.trim()

                // Check column type information
                const columnType = column.type || column.fieldType
                const fieldType = column.fieldType || ''
                const businessType = column.businessType || ''

                // Check if this is a numeric column
                const isNumericType = columnType === 1 || columnType === 2 || columnType === 3 // Number types
                const isNumericField = fieldType === 'number' || fieldType === 'integer' || fieldType === 'decimal' || fieldType === 'numeric'
                const isNumericBusiness = businessType === 'number' || businessType === 'integer'

                if ((isNumericType || isNumericField || isNumericBusiness) && trimmed !== '') {
                  // Try to parse as number
                  const num = Number(trimmed)
                  if (!isNaN(num) && trimmed !== '') {
                    value = num
                  }
                  // If conversion fails, leave as string - database will error with helpful message
                } else if (trimmed === '') {
                  // Empty string after trimming
                  value = null
                }
              }

              columnNames.push(`"${sqlColName}"`)
              placeholders.push(`$${paramIndex}`)
              values.push(value !== undefined ? value : null)
              paramIndex++
            }

            // Skip if no columns to insert
            if (columnNames.length === 0) {
              job.progress.errors.push({
                rowIndex: rowIndex + 2,
                rowData: row,
                error: 'No valid columns to insert. Check if all columns are system columns or if column names are properly defined.',
                parsedError: {
                  technicalError: 'No valid columns to insert',
                  userFriendlyMessage: 'No valid columns to insert. Check if all columns are system columns or if column names are properly defined.',
                  errorType: 'validation',
                  suggestedFix: 'Make sure your Excel file has at least one non-system column with valid column names.'
                }
              })
              return { success: false, rowIndex }
            }

            // Add system columns
            columnNames.push('"createdBy"', '"updatedBy"')
            placeholders.push(`$${paramIndex}`, `$${paramIndex + 1}`)
            values.push(null, null)

            const sql = `INSERT INTO "${physicalTableName}" (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`
            await query(sql, values)

            // Update progress atomically
            job.progress.imported++
            return { success: true, rowIndex }
          } catch (error: any) {
            const parsedError = parseImportError(error.message || 'Unknown error', row, columnMapping)

            job.progress.errors.push({
              rowIndex: rowIndex + 2, // +2 because: +1 for header row, +1 for 1-based index
              rowData: row,
              error: parsedError.userFriendlyMessage,
              parsedError
            })
            return { success: false, rowIndex }
          }
        })()
      })

      // Process all rows in this batch concurrently
      await Promise.all(batchPromises)

      // Emit progress update after each batch
      eventBus.emit('job-progress', job)
    }
  }

  /**
   * Get the latest report
   */
  function getLatestReport(): ImportReport | null {
    return completedReports.value[completedReports.value.length - 1] || null
  }

  /**
   * Clear a report from history
   */
  function clearReport(reportId: string) {
    const index = completedReports.value.findIndex((r) => r.id === reportId)
    if (index !== -1) {
      completedReports.value.splice(index, 1)
    }
  }

  /**
   * Subscribe to import events
   */
  function onImportEvent(event: string, callback: Function) {
    eventBus.on(event, callback)
    return () => eventBus.off(event, callback)
  }

  return {
    // State
    importQueue: readonly(importQueue),
    currentJob: readonly(currentJob),
    isProcessing: readonly(isProcessing),
    completedReports: readonly(completedReports),

    // Actions
    queueImportJobs,
    getLatestReport,
    clearReport,
    onImportEvent
  }
}

// Export singleton-like access to state
export const importQueueState = {
  importQueue,
  currentJob,
  isProcessing,
  completedReports
}
