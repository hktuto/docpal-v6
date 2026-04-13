/// <reference lib="webworker" />

// Load PGlite from CDN
import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js'

let db = null
let isInitialized = false

/**
 * Get list of migration files from the journal
 */
async function getMigrationList() {
  try {
    const response = await fetch('/migrations/meta/_journal.json')
    if (response.ok) {
      const journal = await response.json()
      return journal.entries.map((entry) => `${entry.tag}.sql`)
    }
  } catch (error) {
    console.warn('Could not fetch migration journal, using fallback', error)
  }
  return []
}

/**
 * Load a migration SQL file
 */
async function loadMigrationFile(filename) {
  const response = await fetch(`/migrations/${filename}`)
  if (!response.ok) {
    throw new Error(`Failed to load migration file: ${filename}`)
  }
  return await response.text()
}

/**
 * Split SQL file into individual statements
 * Drizzle generates SQL files with --> statement-breakpoint comments
 */
function splitSQLStatements(sql) {
  return sql
    .split(/--> statement-breakpoint/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))
}

/**
 * Initialize the migrations tracking table
 */
async function initMigrationsTable() {
  if (!db) return

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
  } catch (error) {
    console.error('Failed to create migrations table:', error)
    throw error
  }
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations() {
  if (!db) return []

  try {
    const result = await db.query('SELECT hash FROM __drizzle_migrations ORDER BY created_at')
    return result.rows.map((row) => row.hash)
  } catch (error) {
    // Table might not exist yet, return empty array
    console.warn('Could not query applied migrations:', error)
    return []
  }
}

/**
 * Record a migration as applied
 * Note: hash is derived from filename we control, so it's safe to use in SQL
 */
async function recordMigration(hash) {
  if (!db) return

  try {
    // Escape single quotes in hash (safety measure)
    const escapedHash = hash.replace(/'/g, "''")
    await db.exec(`INSERT INTO __drizzle_migrations (hash) VALUES ('${escapedHash}') ON CONFLICT (hash) DO NOTHING`)
  } catch (error) {
    console.error(`Failed to record migration ${hash}:`, error)
    throw error
  }
}

/**
 * Extract migration hash/tag from filename
 * e.g., "0000_yellow_impossible_man.sql" -> "0000_yellow_impossible_man"
 */
function getMigrationHash(filename) {
  return filename.replace(/\.sql$/, '')
}

/**
 * Drop all tables including the migrations tracking table
 */
async function dropAllTables() {
  if (!db) return

  try {
    // Get all table names from the public schema
    const result = await db.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `)

    const tableNames = result.rows.map((row) => row.tablename)

    if (tableNames.length === 0) {
      console.log('No tables to drop')
      return
    }

    console.log(`Dropping ${tableNames.length} table(s)...`)

    // Drop all tables (CASCADE will handle dependencies)
    for (const tableName of tableNames) {
      await db.exec(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
    }

    console.log('All tables dropped successfully')
  } catch (error) {
    console.error('Failed to drop tables:', error)
    throw error
  }
}

/**
 * Apply migrations to the database (internal implementation)
 */
async function applyMigrationsInternal() {
  if (!db) {
    throw new Error('Database not initialized')
  }

  // Initialize migrations tracking table
  await initMigrationsTable()

  // Get list of migrations to apply
  const migrationFilenames = await getMigrationList()

  if (migrationFilenames.length === 0) {
    console.log('No migrations found')
    return
  }

  // Get list of already applied migrations
  const appliedMigrations = await getAppliedMigrations()

  // Filter out migrations that have already been applied
  const pendingMigrations = migrationFilenames.filter((filename) => {
    const hash = getMigrationHash(filename)
    return !appliedMigrations.includes(hash)
  })

  if (pendingMigrations.length === 0) {
    console.log('All migrations are already applied')
    return
  }

  console.log(`Applying ${pendingMigrations.length} pending migration(s)...`)

  // Apply each pending migration
  for (const filename of pendingMigrations) {
    const hash = getMigrationHash(filename)
    console.log(`Applying migration: ${filename}`)

    const sql = await loadMigrationFile(filename)
    const statements = splitSQLStatements(sql)

    // Execute all statements for this migration in a transaction
    await db.transaction(async (tx) => {
      for (const statement of statements) {
        if (statement.trim()) {
          await tx.exec(statement)
        }
      }
      // Record migration after successful execution
      // Escape single quotes in hash (safety measure)
      const escapedHash = hash.replace(/'/g, "''")
      await tx.exec(`INSERT INTO __drizzle_migrations (hash) VALUES ('${escapedHash}') ON CONFLICT (hash) DO NOTHING`)
    })

    console.log(`Migration ${filename} applied successfully`)
  }

  console.log('All pending migrations applied successfully')
}

/**
 * Apply migrations to the database with retry logic
 */
async function applyMigrations() {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const maxRetries = 2 // Allow 2 attempts (initial + 1 retry)
  let failCount = 0

  while (failCount < maxRetries) {
    try {
      await applyMigrationsInternal()
      // Success - reset fail count and return
      if (failCount > 0) {
        console.log('Migrations applied successfully after retry')
      }
      return
    } catch (error) {
      failCount++
      console.error(`Migration attempt ${failCount} failed:`, error)

      if (failCount >= maxRetries) {
        console.error('Maximum retry attempts reached. Migration failed permanently.')
        throw new Error(`Migration failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Drop all tables and retry
      console.log('Dropping all tables and retrying migration...')
      try {
        await dropAllTables()
        console.log('Tables dropped. Retrying migration...')
      } catch (dropError) {
        console.error('Failed to drop tables during retry:', dropError)
        throw new Error(`Failed to cleanup and retry: ${dropError instanceof Error ? dropError.message : String(dropError)}`)
      }
    }
  }
}

// Initialize PGlite database and apply migrations
async function initDb() {
  if (!db) {
    // Using IndexedDB for persistence
    // Change to in-memory by removing the dataDir option
    // PGlite is now available globally from importScripts
    db = new PGlite('idb://pglite-demo', {
      // Optional: enable extensions
      // extensions: []
    })

    // Wait for database to be ready
    await db.waitReady
    // start migration apply process
    console.log('PGlite database initialized in worker')
  }

  // Apply migrations on first initialization
  if (!isInitialized) {
    await applyMigrations()
    isInitialized = true
  }

  return db
}

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data

  try {
    let result

    switch (type) {
      case 'init': {
        // Initialize database and apply migrations
        await initDb()
        result = { success: true }
        break
      }

      case 'exec': {
        const database = await initDb()
        // Execute SQL (for migrations, DDL, etc.)
        result = await database.exec(payload.sql)
        break
      }

      case 'query': {
        const database = await initDb()

        // Performance logging
        const startTime = performance.now()

        // Execute query and return results
        const rows = await database.query(payload.sql, payload.params || [])
        result = rows.rows

        // Log performance metrics
        const endTime = performance.now()
        const duration = (endTime - startTime).toFixed(2)

        // console.group(`🔍 [Worker Query] ${duration}ms`)
        // console.log('SQL:', payload.sql)
        // console.log('Params:', payload.params || [])
        // console.log('Results:', result.length, 'rows')
        // console.log('Duration:', duration, 'ms')
        // console.groupEnd()

        break
      }

      case 'transaction': {
        const database = await initDb()
        // Execute a transaction
        await database.transaction(async (tx) => {
          for (const op of payload.operations) {
            if (op.type === 'exec') {
              await tx.exec(op.sql)
            } else if (op.type === 'query') {
              await tx.query(op.sql, op.params || [])
            }
          }
        })
        result = { success: true }
        break
      }

      case 'close': {
        // Close database connection
        if (db) {
          await db.close()
          db = null
          isInitialized = false
        }
        result = { success: true }
        break
      }

      default:
        throw new Error(`Unknown message type: ${type}`)
    }

    // Send success response
    self.postMessage({
      id,
      ok: true,
      result
    })
  } catch (error) {
    // Send error response
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

// Error handling
self.addEventListener('error', (event) => {
  console.error('Worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Worker unhandled rejection:', event.reason)
  event.preventDefault()
})
