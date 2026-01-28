import type { AuditLogRecord, AuditLogInsert, AuditOperation, AuditStatus } from '../utils/db/schema/newTableSchema'
import { getCurrentUserId } from './useCurrentUser'
import { v7 as uuidv7 } from 'uuid'

/**
 * Options for creating an audit log entry
 */
export interface CreateAuditOptions {
  tableName: string
  tableType?: 'system' | 'dynamic'
  recordId?: string | null
  operation: AuditOperation
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  changedFields?: string[]
  affectedRecordIds?: string[]
  affectedCount?: number
  entityId?: string | null
  caseTableId?: string | null
  description?: string
  metadata?: Record<string, any>
}

/**
 * Options for querying audit logs
 */
export interface AuditQueryOptions {
  tableName?: string
  recordId?: string
  operation?: AuditOperation
  entityId?: string
  caseTableId?: string
  createdBy?: string
  status?: AuditStatus
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Audit log composable for tracking changes and supporting rollback
 */
export function useAuditLog() {
  const { query, exec } = usePglite()

  /**
   * Create a single audit log entry
   */
  async function createAuditLog(options: CreateAuditOptions): Promise<AuditLogRecord> {
    const {
      tableName,
      tableType = 'dynamic',
      recordId,
      operation,
      oldValues,
      newValues,
      changedFields,
      affectedRecordIds,
      affectedCount = 1,
      entityId,
      caseTableId,
      description,
      metadata
    } = options

    const currentUserId = getCurrentUserId()
    const id = uuidv7()

    const result = await query<AuditLogRecord>(
      `INSERT INTO audit_logs (
        id, "tableName", "tableType", "recordId", operation,
        "oldValues", "newValues", "changedFields",
        "affectedRecordIds", "affectedCount",
        status, "entityId", "caseTableId",
        description, metadata, "createdBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        id,
        tableName,
        tableType,
        recordId || null,
        operation,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        changedFields || null,
        affectedRecordIds || null,
        affectedCount,
        'active',
        entityId || null,
        caseTableId || null,
        description || null,
        metadata ? JSON.stringify(metadata) : null,
        currentUserId
      ]
    )

    return result[0]
  }

  /**
   * Log an INSERT operation
   */
  async function logInsert(
    tableName: string,
    recordId: string,
    newValues: Record<string, any>,
    options?: Partial<CreateAuditOptions>
  ): Promise<AuditLogRecord> {
    return createAuditLog({
      tableName,
      recordId,
      operation: 'INSERT',
      newValues,
      description: `Created new record in ${tableName}`,
      ...options
    })
  }

  /**
   * Log an UPDATE operation
   */
  async function logUpdate(
    tableName: string,
    recordId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    options?: Partial<CreateAuditOptions>
  ): Promise<AuditLogRecord> {
    // Calculate changed fields
    const changedFields = Object.keys(newValues).filter(
      key => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
    )

    return createAuditLog({
      tableName,
      recordId,
      operation: 'UPDATE',
      oldValues,
      newValues,
      changedFields,
      description: `Updated ${changedFields.length} field(s) in ${tableName}`,
      ...options
    })
  }

  /**
   * Log a DELETE operation
   */
  async function logDelete(
    tableName: string,
    recordId: string,
    oldValues: Record<string, any>,
    options?: Partial<CreateAuditOptions>
  ): Promise<AuditLogRecord> {
    return createAuditLog({
      tableName,
      recordId,
      operation: 'DELETE',
      oldValues,
      description: `Deleted record from ${tableName}`,
      ...options
    })
  }

  /**
   * Log a bulk INSERT operation
   */
  async function logBulkInsert(
    tableName: string,
    records: Array<{ id: string; data: Record<string, any> }>,
    options?: Partial<CreateAuditOptions>
  ): Promise<AuditLogRecord> {
    return createAuditLog({
      tableName,
      operation: 'BULK_INSERT',
      affectedRecordIds: records.map(r => r.id),
      affectedCount: records.length,
      newValues: { records: records.map(r => r.data) },
      description: `Bulk inserted ${records.length} record(s) into ${tableName}`,
      ...options
    })
  }

  /**
   * Log a bulk UPDATE operation
   */
  async function logBulkUpdate(
    tableName: string,
    updates: Array<{ id: string; oldData: Record<string, any>; newData: Record<string, any> }>,
    options?: Partial<CreateAuditOptions>
  ): Promise<AuditLogRecord> {
    return createAuditLog({
      tableName,
      operation: 'BULK_UPDATE',
      affectedRecordIds: updates.map(u => u.id),
      affectedCount: updates.length,
      oldValues: { records: updates.map(u => ({ id: u.id, data: u.oldData })) },
      newValues: { records: updates.map(u => ({ id: u.id, data: u.newData })) },
      description: `Bulk updated ${updates.length} record(s) in ${tableName}`,
      ...options
    })
  }

  /**
   * Log a bulk DELETE operation
   */
  async function logBulkDelete(
    tableName: string,
    records: Array<{ id: string; data: Record<string, any> }>,
    options?: Partial<CreateAuditOptions>
  ): Promise<AuditLogRecord> {
    return createAuditLog({
      tableName,
      operation: 'BULK_DELETE',
      affectedRecordIds: records.map(r => r.id),
      affectedCount: records.length,
      oldValues: { records },
      description: `Bulk deleted ${records.length} record(s) from ${tableName}`,
      ...options
    })
  }

  /**
   * Query audit logs with filters
   */
  async function getAuditLogs(options: AuditQueryOptions = {}): Promise<AuditLogRecord[]> {
    const {
      tableName,
      recordId,
      operation,
      entityId,
      caseTableId,
      createdBy,
      status,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = options

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (tableName) {
      conditions.push(`"tableName" = $${paramIndex++}`)
      params.push(tableName)
    }

    if (recordId) {
      conditions.push(`"recordId" = $${paramIndex++}`)
      params.push(recordId)
    }

    if (operation) {
      conditions.push(`operation = $${paramIndex++}`)
      params.push(operation)
    }

    if (entityId) {
      conditions.push(`"entityId" = $${paramIndex++}`)
      params.push(entityId)
    }

    if (caseTableId) {
      conditions.push(`"caseTableId" = $${paramIndex++}`)
      params.push(caseTableId)
    }

    if (createdBy) {
      conditions.push(`"createdBy" = $${paramIndex++}`)
      params.push(createdBy)
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }

    if (startDate) {
      conditions.push(`"createdAt" >= $${paramIndex++}`)
      params.push(startDate.toISOString())
    }

    if (endDate) {
      conditions.push(`"createdAt" <= $${paramIndex++}`)
      params.push(endDate.toISOString())
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    params.push(limit, offset)

    const sql = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `

    return query<AuditLogRecord>(sql, params)
  }

  /**
   * Get audit history for a specific record
   */
  async function getRecordHistory(
    tableName: string,
    recordId: string
  ): Promise<AuditLogRecord[]> {
    return getAuditLogs({ tableName, recordId })
  }

  /**
   * Rollback a single audit log entry
   * Returns the new audit log entry created for the rollback operation
   */
  async function rollbackAuditLog(auditLogId: string): Promise<AuditLogRecord | null> {
    const currentUserId = getCurrentUserId()
    const now = new Date().toISOString()

    // Get the audit log entry to rollback
    const auditLogs = await query<AuditLogRecord>(
      `SELECT * FROM audit_logs WHERE id = $1 AND status = 'active'`,
      [auditLogId]
    )

    if (auditLogs.length === 0) {
      console.warn(`[Audit] Cannot rollback: audit log ${auditLogId} not found or already rolled back`)
      return null
    }

    const auditLog = auditLogs[0]

    // Perform the rollback based on operation type
    let rollbackAuditLog: AuditLogRecord | null = null

    try {
      switch (auditLog.operation) {
        case 'INSERT': {
          // Rollback INSERT = DELETE the record
          if (auditLog.recordId) {
            // Get current state before deleting
            const currentData = await query<Record<string, any>>(
              `SELECT * FROM "${auditLog.tableName}" WHERE id = $1`,
              [auditLog.recordId]
            )

            if (currentData.length > 0) {
              await exec(`DELETE FROM "${auditLog.tableName}" WHERE id = '${auditLog.recordId}'`)

              rollbackAuditLog = await logDelete(
                auditLog.tableName,
                auditLog.recordId,
                currentData[0],
                {
                  tableType: auditLog.tableType as 'system' | 'dynamic',
                  entityId: auditLog.entityId,
                  caseTableId: auditLog.caseTableId,
                  description: `Rollback: Deleted record that was inserted`,
                  metadata: { rollbackOf: auditLogId }
                }
              )
            }
          }
          break
        }

        case 'UPDATE': {
          // Rollback UPDATE = Restore old values
          if (auditLog.recordId && auditLog.oldValues) {
            // Get current state before updating
            const currentData = await query<Record<string, any>>(
              `SELECT * FROM "${auditLog.tableName}" WHERE id = $1`,
              [auditLog.recordId]
            )

            if (currentData.length > 0) {
              const oldValues = auditLog.oldValues as Record<string, any>
              const changedFields = auditLog.changedFields || Object.keys(oldValues)

              // Build UPDATE statement to restore old values
              const setClauses = changedFields
                .filter(field => field !== 'id' && oldValues[field] !== undefined)
                .map((field, i) => `"${field}" = $${i + 1}`)

              if (setClauses.length > 0) {
                const values = changedFields
                  .filter(field => field !== 'id' && oldValues[field] !== undefined)
                  .map(field => oldValues[field])

                values.push(auditLog.recordId)

                await query(
                  `UPDATE "${auditLog.tableName}" SET ${setClauses.join(', ')}, "updatedAt" = NOW(), "updatedBy" = '${currentUserId}' WHERE id = $${values.length}`,
                  values
                )

                rollbackAuditLog = await logUpdate(
                  auditLog.tableName,
                  auditLog.recordId,
                  currentData[0],
                  oldValues,
                  {
                    tableType: auditLog.tableType as 'system' | 'dynamic',
                    entityId: auditLog.entityId,
                    caseTableId: auditLog.caseTableId,
                    description: `Rollback: Restored previous values`,
                    metadata: { rollbackOf: auditLogId }
                  }
                )
              }
            }
          }
          break
        }

        case 'DELETE': {
          // Rollback DELETE = Re-insert the record
          if (auditLog.oldValues) {
            const oldValues = auditLog.oldValues as Record<string, any>
            const columns = Object.keys(oldValues).filter(k => oldValues[k] !== undefined)
            const placeholders = columns.map((_, i) => `$${i + 1}`)
            const values = columns.map(k => oldValues[k])

            await query(
              `INSERT INTO "${auditLog.tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`,
              values
            )

            rollbackAuditLog = await logInsert(
              auditLog.tableName,
              oldValues.id,
              oldValues,
              {
                tableType: auditLog.tableType as 'system' | 'dynamic',
                entityId: auditLog.entityId,
                caseTableId: auditLog.caseTableId,
                description: `Rollback: Re-inserted deleted record`,
                metadata: { rollbackOf: auditLogId }
              }
            )
          }
          break
        }

        default:
          console.warn(`[Audit] Rollback not supported for operation: ${auditLog.operation}`)
          return null
      }

      // Mark the original audit log as rolled back
      await query(
        `UPDATE audit_logs SET status = 'rolled_back', "rolledBackAt" = $1, "rolledBackBy" = $2, "rollbackAuditId" = $3 WHERE id = $4`,
        [now, currentUserId, rollbackAuditLog?.id || null, auditLogId]
      )

      return rollbackAuditLog
    } catch (error) {
      console.error('[Audit] Rollback failed:', error)
      throw error
    }
  }

  /**
   * Get audit statistics for a table
   */
  async function getAuditStats(tableName?: string, entityId?: string): Promise<{
    totalChanges: number
    inserts: number
    updates: number
    deletes: number
    rolledBack: number
  }> {
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (tableName) {
      conditions.push(`"tableName" = $${paramIndex++}`)
      params.push(tableName)
    }

    if (entityId) {
      conditions.push(`"entityId" = $${paramIndex++}`)
      params.push(entityId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await query<{
      operation: AuditOperation
      status: AuditStatus
      count: string
    }>(
      `SELECT operation, status, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY operation, status`,
      params
    )

    const stats = {
      totalChanges: 0,
      inserts: 0,
      updates: 0,
      deletes: 0,
      rolledBack: 0
    }

    for (const row of result) {
      const count = parseInt(row.count, 10)
      stats.totalChanges += count

      if (row.status === 'rolled_back') {
        stats.rolledBack += count
      }

      if (row.operation === 'INSERT' || row.operation === 'BULK_INSERT') {
        stats.inserts += count
      } else if (row.operation === 'UPDATE' || row.operation === 'BULK_UPDATE') {
        stats.updates += count
      } else if (row.operation === 'DELETE' || row.operation === 'BULK_DELETE') {
        stats.deletes += count
      }
    }

    return stats
  }

  return {
    // Create audit logs
    createAuditLog,
    logInsert,
    logUpdate,
    logDelete,
    logBulkInsert,
    logBulkUpdate,
    logBulkDelete,

    // Query audit logs
    getAuditLogs,
    getRecordHistory,
    getAuditStats,

    // Rollback
    rollbackAuditLog
  }
}
