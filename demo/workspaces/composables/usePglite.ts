import { seedUsers } from '../utils/db/seed/users'

type WorkerRequestType = 'init' | 'exec' | 'query' | 'transaction' | 'close'

// Track if seeding has been performed this session
let seedingPerformed = false
let seedingPromise: Promise<void> | null = null

interface WorkerRequest<T = any> {
  id: string
  type: WorkerRequestType
  payload?: T
}

interface WorkerResponse<T = any> {
  id: string
  ok: boolean
  result?: T
  error?: string
}

let worker: Worker | null = null
let requestId = 0
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>()

// Initialize worker
function getWorker(): Worker {
  if (!worker) {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      throw new Error('Workers are not available in this environment')
    }

    worker = new Worker('/worker/pglite.worker.js', { type: 'module' })
    worker.onmessage = handleMessage
    worker.onerror = (event) => {
      console.error('Worker error:', event.error)
    }
  }
  return worker
}

// Handle messages from worker
function handleMessage(event: MessageEvent<WorkerResponse>) {
  const { id, ok, result, error } = event.data
  const pendingRequest = pendingRequests.get(id)

  if (pendingRequest) {
    pendingRequests.delete(id)
    if (ok) {
      pendingRequest.resolve(result)
    } else {
      pendingRequest.reject(new Error(error || 'Worker error'))
    }
  }
}

// Send message to worker
function send<T = any>(type: WorkerRequestType, payload?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = `req_${++requestId}_${Date.now()}`
    pendingRequests.set(id, { resolve, reject })

    const workerInstance = getWorker()
    workerInstance.postMessage({
      id,
      type,
      payload
    } as WorkerRequest)
  })
}

export function usePglite() {
  /**
   * Run seeding if not already done
   * This is called internally after first query to ensure demo data exists
   */
  async function runSeeding(): Promise<void> {
    if (seedingPerformed) return
    
    // Use a promise to prevent concurrent seeding attempts
    if (!seedingPromise) {
      seedingPromise = (async () => {
        try {
          // Use raw query to avoid recursion
          await seedUsers(queryRaw, execRaw)
          seedingPerformed = true
        } catch (error) {
          console.warn('[usePglite] Seeding failed:', error)
          seedingPerformed = true // Mark as done to prevent retries
        }
      })()
    }
    
    await seedingPromise
  }

  // Initialize database and apply migrations
  async function init(): Promise<void> {
    await send('init')
    await runSeeding()
  }

  // Execute SQL (for migrations, DDL, etc.) - raw version without seeding
  async function execRaw(sql: string): Promise<void> {
    return send('exec', { sql })
  }

  // Query database and return results - raw version without seeding
  async function queryRaw<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await send<T[]>('query', { sql, params })
    return result
  }

  // Execute SQL (for migrations, DDL, etc.)
  async function exec(sql: string): Promise<void> {
    const result = await send('exec', { sql })
    // Trigger seeding after first exec (non-blocking)
    runSeeding()
    return result
  }

  // Query database and return results
  async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await send<T[]>('query', { sql, params })
    // Trigger seeding after first query (non-blocking)
    runSeeding()
    return result
  }

  // Execute a transaction
  async function transaction(operations: Array<{ type: 'exec' | 'query'; sql: string; params?: any[] }>): Promise<void> {
    return send('transaction', { operations })
  }

  // Remove all tables from the database
  async function removeAllTables(): Promise<void> {
    try {
      // Get all table names from the public schema
      const result = await query<{ tablename: string }[]>(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      `)

      const tableNames = result.map((row: any) => row.tablename)

      if (tableNames.length === 0) {
        console.log('No tables to drop')
        return
      }

      console.log(`Dropping ${tableNames.length} table(s)...`)

      // Drop all tables (CASCADE will handle dependencies)
      for (const tableName of tableNames) {
        await exec(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
      }

      console.log('All tables dropped successfully')
    } catch (error) {
      console.error('Failed to drop tables:', error)
      throw error
    }
  }

  // Close database connection
  async function close(): Promise<void> {
    if (worker) {
      await send('close')
      worker.terminate()
      worker = null
    }
  }

  /**
   * Search function that generates SQL queries based on schema
   * @param options - Search options
   * @returns Promise with search results
   */
  async function search<T = any>(options: {
    table: string
    searchKeys?: string[]
    keyword?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<T[]> {
    const searchStartTime = performance.now()

    const { table, searchKeys = [], keyword = '', filters = {}, sortBy, sortOrder = 'asc', limit, offset = 0 } = options

    const whereClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Handle keyword search (split by spaces)
    if (keyword && keyword.trim()) {
      const keywords = keyword
        .trim()
        .split(/\s+/)
        .filter((k) => k.length > 0)

      if (keywords.length > 0 && searchKeys.length > 0) {
        // For each keyword, create OR conditions across all search keys
        const keywordClauses = keywords.map((kw) => {
          const keyConditions = searchKeys.map((key) => {
            // Column name goes in the SQL directly, not as a parameter
            const clause = `LOWER("${key}") LIKE LOWER($${paramIndex})`
            params.push(`%${kw}%`)
            paramIndex++
            return clause
          })
          return `(${keyConditions.join(' OR ')})`
        })

        whereClauses.push(`(${keywordClauses.join(' OR ')})`)
      }
    }

    // Handle filters
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        // Handle boolean filter
        if (typeof value === 'boolean') {
          whereClauses.push(`"${key}" = $${paramIndex}`)
          params.push(value)
          paramIndex++
        }
        // Handle string filter (LIKE)
        else if (typeof value === 'string' && value) {
          whereClauses.push(`LOWER("${key}") LIKE LOWER($${paramIndex})`)
          params.push(`%${value}%`)
          paramIndex++
        }
        // Handle array filter (IN)
        else if (Array.isArray(value) && value.length > 0) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ')
          whereClauses.push(`"${key}" IN (${placeholders})`)
          params.push(...value)
        }
        // Handle exact match for other types
        else if (value !== '') {
          whereClauses.push(`"${key}" = $${paramIndex}`)
          params.push(value)
          paramIndex++
        }
      })
    }

    // Build the query
    let sql = `SELECT * FROM "${table}"`

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`
    }

    // Add sorting
    if (sortBy) {
      sql += ` ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}`
    }

    // Add pagination
    if (limit !== undefined) {
      sql += ` LIMIT $${paramIndex}`
      params.push(limit)
      paramIndex++
    }

    if (offset > 0) {
      sql += ` OFFSET $${paramIndex}`
      params.push(offset)
    }

    const sqlGenTime = performance.now() - searchStartTime
    console.log(`⚙️ [Search] SQL generation: ${sqlGenTime.toFixed(2)}ms`)
    console.log('SQL:', sql)
    console.log('Params:', params)

    const result = await query<T>(sql, params)

    const totalSearchTime = performance.now() - searchStartTime
    console.log(`🔎 [Search] Total search time: ${totalSearchTime.toFixed(2)}ms`)

    return result
  }

  return {
    init,
    exec,
    query,
    transaction,
    removeAllTables,
    close,
    search
  }
}
