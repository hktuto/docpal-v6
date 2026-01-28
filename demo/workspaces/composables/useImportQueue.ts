import { v7 as uuidv7 } from 'uuid'
import { parseImportError, type ParsedImportError } from '../utils/importErrorParser'
import { useCurrentUser } from './useCurrentUser'
import { useAuditLog } from './useAuditLog'
import type { SkippedSheetInfo } from './useImportBatch'

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
  entityId?: string // For relation analysis after import
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
  skippedSheets?: SkippedSheetInfo[]
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
  const { initCurrentUser, getCurrentUserId } = useCurrentUser()
  const { logBulkInsert } = useAuditLog()

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

    // Phase 3: Analyze tables for relation suggestions (after all data is imported)
    // Group jobs by entityId to avoid duplicate analysis
    const jobsByEntity = new Map<string, Set<string>>()
    for (const job of processedJobs) {
      if (job.entityId && job.status === 'completed') {
        if (!jobsByEntity.has(job.entityId)) {
          jobsByEntity.set(job.entityId, new Set())
        }
        jobsByEntity.get(job.entityId)!.add(job.tableName)
      }
    }

    // Set all tables to 'analyzing' status immediately (before actual analysis starts)
    const allTableIds: string[] = []
    for (const tableIds of jobsByEntity.values()) {
      allTableIds.push(...Array.from(tableIds))
    }

    if (allTableIds.length > 0) {
      // Batch update all tables to 'pending' status
      // The background poller will pick them up and process them
      const now = new Date()
      const placeholders = allTableIds.map((_, i) => `$${i + 2}`).join(', ')
      await query(
        `UPDATE case_tables
         SET "suggestionStatus" = 'pending', "updatedAt" = $1
         WHERE id IN (${placeholders})`,
        [now, ...allTableIds]
      )

      console.log(`📋 Queued ${allTableIds.length} table(s) for relation analysis (background poller will process)`)
    }
  }

  /**
   * Process a single import job
   */
  async function processJob(job: ImportJob) {
    const { physicalTableName, columns, rows } = job

    // Ensure current user is initialized before processing
    await initCurrentUser()
    const currentUserId = getCurrentUserId()

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
    const BATCH_SIZE = 50 // Increased from 10 - single INSERT can handle many rows
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE
      const endIndex = Math.min(startIndex + BATCH_SIZE, rows.length)
      const batchRows = rows.slice(startIndex, endIndex)

      try {
        // Prepare all rows for batch insert
        const batchData: Array<{
          values: any[]
          rowIndex: number
          rowData: Record<string, any>
        }> = []

        // First pass: validate and prepare all rows
        for (let batchRowIndex = 0; batchRowIndex < batchRows.length; batchRowIndex++) {
          const row = batchRows[batchRowIndex]
          const rowIndex = startIndex + batchRowIndex
          const values: any[] = []

          // Add user data columns
          for (const column of userColumns) {
            const colName = column.fieldName || column.field
            const displayName = column.fieldNameAlias || column.title

            if (!colName && !displayName) continue

            const sqlColName = colName || displayName.toLowerCase().replace(/\s+/g, '_')
            let value = row[displayName]

            // Handle empty values
            if (value === '' || value === undefined || value === null) {
              value = null
            } else if (typeof value === 'string') {
              const trimmed = value.trim()
              const columnType = column.type || column.fieldType
              const fieldType = column.fieldType || ''
              const businessType = column.businessType || ''

              // Check if this is a numeric column
              const isNumericType = columnType === 1 || columnType === 2 || columnType === 3
              const isNumericField = fieldType === 'number' || fieldType === 'integer' || fieldType === 'decimal' || fieldType === 'numeric'
              const isNumericBusiness = businessType === 'number' || businessType === 'integer'

              if ((isNumericType || isNumericField || isNumericBusiness) && trimmed !== '') {
                const num = Number(trimmed)
                if (!isNaN(num) && trimmed !== '') {
                  value = num
                }
              } else if (trimmed === '') {
                value = null
              }
            }

            values.push(value !== undefined ? value : null)
          }

          // Add system columns (createdBy, updatedBy)
          values.push(currentUserId, currentUserId)

          batchData.push({ values, rowIndex, rowData: row })
        }

        // Skip batch if no valid rows
        if (batchData.length === 0) continue

        // Build column names (once for the whole batch)
        const columnNames: string[] = []
        for (const column of userColumns) {
          const colName = column.fieldName || column.field
          const displayName = column.fieldNameAlias || column.title
          if (!colName && !displayName) continue
          const sqlColName = colName || displayName.toLowerCase().replace(/\s+/g, '_')
          columnNames.push(`"${sqlColName}"`)
        }
        columnNames.push('"createdBy"', '"updatedBy"')

        // Build multi-row INSERT statement
        const valueSets: string[] = []
        const allValues: any[] = []
        let paramIndex = 1

        for (const { values } of batchData) {
          const placeholders = values.map(() => `$${paramIndex++}`)
          valueSets.push(`(${placeholders.join(', ')})`)
          allValues.push(...values)
        }

        const sql = `INSERT INTO "${physicalTableName}" (${columnNames.join(', ')}) VALUES ${valueSets.join(', ')} RETURNING id`

        // Execute single batch INSERT
        const insertedRows = await query<{ id: string }>(sql, allValues)

        // All rows in batch succeeded
        job.progress.imported += batchData.length

        // Log audit entry for bulk insert
        if (insertedRows.length > 0) {
          try {
            await logBulkInsert(
              physicalTableName,
              insertedRows.map((r, idx) => ({
                id: r.id,
                data: batchData[idx]?.rowData || {}
              })),
              {
                tableType: 'dynamic',
                caseTableId: job.tableName,
                description: `Imported ${insertedRows.length} records from Excel`
              }
            )
          } catch (auditError) {
            console.warn('[Audit] Failed to log bulk insert:', auditError)
          }
        }
      } catch (error: any) {
        // If batch INSERT fails, fall back to individual inserts to identify problem rows
        console.warn(`Batch insert failed, falling back to individual inserts: ${error.message}`)

        for (let batchRowIndex = 0; batchRowIndex < batchRows.length; batchRowIndex++) {
          const row = batchRows[batchRowIndex]
          const rowIndex = startIndex + batchRowIndex

          try {
            const columnNames: string[] = []
            const placeholders: string[] = []
            const values: any[] = []
            let paramIndex = 1

            for (const column of userColumns) {
              const colName = column.fieldName || column.field
              const displayName = column.fieldNameAlias || column.title
              if (!colName && !displayName) continue

              const sqlColName = colName || displayName.toLowerCase().replace(/\s+/g, '_')
              let value = row[displayName]

              if (value === '' || value === undefined || value === null) {
                value = null
              } else if (typeof value === 'string') {
                const trimmed = value.trim()
                const columnType = column.type || column.fieldType
                const fieldType = column.fieldType || ''
                const businessType = column.businessType || ''

                const isNumericType = columnType === 1 || columnType === 2 || columnType === 3
                const isNumericField = fieldType === 'number' || fieldType === 'integer' || fieldType === 'decimal' || fieldType === 'numeric'
                const isNumericBusiness = businessType === 'number' || businessType === 'integer'

                if ((isNumericType || isNumericField || isNumericBusiness) && trimmed !== '') {
                  const num = Number(trimmed)
                  if (!isNaN(num) && trimmed !== '') {
                    value = num
                  }
                } else if (trimmed === '') {
                  value = null
                }
              }

              columnNames.push(`"${sqlColName}"`)
              placeholders.push(`$${paramIndex}`)
              values.push(value !== undefined ? value : null)
              paramIndex++
            }

            if (columnNames.length === 0) {
              job.progress.errors.push({
                rowIndex: rowIndex + 2,
                rowData: row,
                error: 'No valid columns to insert',
                parsedError: {
                  technicalError: 'No valid columns to insert',
                  userFriendlyMessage: 'No valid columns to insert. Check if all columns are system columns.',
                  errorType: 'validation',
                  suggestedFix: 'Make sure your Excel file has at least one non-system column.'
                }
              })
              continue
            }

            columnNames.push('"createdBy"', '"updatedBy"')
            placeholders.push(`$${paramIndex}`, `$${paramIndex + 1}`)
            values.push(currentUserId, currentUserId)

            const sql = `INSERT INTO "${physicalTableName}" (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`
            const insertedRows = await query<{ id: string }>(sql, values)
            job.progress.imported++

            // Log audit entry for individual insert (fallback)
            if (insertedRows.length > 0) {
              try {
                await logBulkInsert(physicalTableName, [{ id: insertedRows[0].id, data: row }], {
                  tableType: 'dynamic',
                  caseTableId: job.tableName,
                  description: 'Imported record from Excel'
                })
              } catch (auditError) {
                console.warn('[Audit] Failed to log insert:', auditError)
              }
            }
          } catch (rowError: any) {
            const parsedError = parseImportError(rowError.message || 'Unknown error', row, columnMapping)
            job.progress.errors.push({
              rowIndex: rowIndex + 2,
              rowData: row,
              error: parsedError.userFriendlyMessage,
              parsedError
            })
          }
        }
      }

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

  /**
   * Emit import-completed event with a report (for cases where no import queue was needed)
   */
  function notifyImportCompleted(report: ImportReport): void {
    completedReports.value.push(report)
    eventBus.emit('import-completed', report)
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
    onImportEvent,
    notifyImportCompleted
  }
}

// Export singleton-like access to state
export const importQueueState = {
  importQueue,
  currentJob,
  isProcessing,
  completedReports
}
