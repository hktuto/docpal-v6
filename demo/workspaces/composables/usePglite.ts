type WorkerRequestType = "init" | "exec" | "query" | "transaction" | "close"

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
const pendingRequests = new Map<
  string,
  { resolve: (value: any) => void; reject: (error: any) => void }
>()

// Initialize worker
function getWorker(): Worker {
  if (!worker) {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      throw new Error("Workers are not available in this environment")
    }
    const workerUrl = new URL("../workers/pglite.worker.ts", import.meta.url)
    worker = new Worker(workerUrl.href, { type: "module" })
    worker.onmessage = handleMessage
    worker.onerror = (event) => {
      console.error("Worker error:", event.error)
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
      pendingRequest.reject(new Error(error || "Worker error"))
    }
  }
}

// Send message to worker
function send<T = any>(type: WorkerRequestType, payload?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = `req_${++requestId}_${Date.now()}`
    pendingRequests.set(id, { resolve, reject })

    const workerInstance = getWorker()
    console.log('sending message to worker',workerInstance, type, payload)
    workerInstance.postMessage({
      id,
      type,
      payload,
    } as WorkerRequest)
  })
}

export function usePglite() {
  // Initialize database and apply migrations
  async function init(): Promise<void> {
    return send("init")
  }

  // Execute SQL (for migrations, DDL, etc.)
  async function exec(sql: string): Promise<void> {
    return send("exec", { sql })
  }

  // Query database and return results
  async function query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    return send<T[]>("query", { sql, params })
  }

  // Execute a transaction
  async function transaction(
    operations: Array<{ type: "exec" | "query"; sql: string; params?: any[] }>
  ): Promise<void> {
    return send("transaction", { operations })
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

      const tableNames = result.map((row:any) => row.tablename)

      if (tableNames.length === 0) {
        console.log("No tables to drop")
        return
      }

      console.log(`Dropping ${tableNames.length} table(s)...`)

      // Drop all tables (CASCADE will handle dependencies)
      for (const tableName of tableNames) {
        await exec(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
      }

      console.log("All tables dropped successfully")
    } catch (error) {
      console.error("Failed to drop tables:", error)
      throw error
    }
  }

  // Close database connection
  async function close(): Promise<void> {
    if (worker) {
      await send("close")
      worker.terminate()
      worker = null
    }
  }

  return {
    init,
    exec,
    query,
    transaction,
    removeAllTables,
    close,
  }
}

