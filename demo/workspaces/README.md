# PGlite Demo with Drizzle ORM

This package demonstrates how to use PGlite with Drizzle ORM in a web worker.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will install:
- `@electric-sql/pglite` - PostgreSQL database that runs in the browser
- `drizzle-orm` - Type-safe SQL ORM
- `drizzle-kit` (dev) - Migration generation and management

### 2. Create Database Schema

The schema is defined in `utils/db/schema/index.ts`. Currently includes:
- `users` table
- `workspaces` table

### 3. Generate Migrations

After modifying your schema, generate migrations:

```bash
pnpm db:generate
```

This will create SQL migration files in `utils/db/migration/`.

### 4. Apply Migrations

Migrations are automatically applied when the database is initialized. The worker (`workers/pglite.worker.ts`) handles migration application:

1. When `init()` is called, the worker initializes the PGlite database
2. On first initialization, it fetches the migration journal from `/migrations/meta/_journal.json`
3. Loads each migration SQL file from `/migrations/`
4. Splits the SQL into individual statements (Drizzle uses `--> statement-breakpoint` comments)
5. Executes each statement in the database

The migrations run automatically in the worker - you just need to call `init()` from your component.

### 5. Run the Application

```bash
# From the workspace root
pnpm -F demo-workspaces dev
```

Or if you have a dev script set up:

```bash
cd demo/workspaces
pnpm dev
```

## Architecture

### Web Worker (`workers/pglite.worker.ts`)

The PGlite database runs in a dedicated web worker to:
- Keep database operations off the main thread
- Prevent blocking the UI
- Isolate database state

The worker handles:
- Database initialization
- SQL execution (`exec`)
- Query execution (`query`)
- Transactions (`transaction`)
- Database closing (`close`)

### Composable (`composables/usePglite.ts`)

Provides a clean API to interact with the database worker:
- `exec(sql: string)` - Execute SQL (DDL, migrations, etc.)
- `query(sql: string, params?: any[])` - Query data
- `transaction(operations)` - Execute transactions
- `close()` - Close the database connection

### Component (`components/global/workspaces/list.vue`)

Demonstrates:
- Database initialization
- Table creation
- Data insertion
- Data querying

## File Structure

```
demo/workspaces/
├── composables/
│   └── usePglite.ts          # Client-side API for database worker
├── components/
│   └── global/workspaces/
│       └── list.vue          # Demo component
├── workers/
│   └── pglite.worker.ts      # Web worker running PGlite (handles migrations)
├── utils/
│   └── db/
│       └── schema/
│           └── index.ts      # Drizzle schema definitions
├── public/
│   └── migrations/           # Generated migration files (after db:generate)
│       ├── *.sql            # Migration SQL files
│       └── meta/            # Migration metadata
├── drizzle.config.ts         # Drizzle Kit configuration
└── package.json
```

## Available Scripts

- `pnpm db:generate` - Generate migration files from schema (outputs to `public/migrations/`)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:push` - Push schema changes directly (dev only)
- `pnpm db:migrate` - Run migrations (Node.js only, not for browser)

## Notes

1. **Migrations in Browser**: The workflow is:
   - Generate migrations with `pnpm db:generate` (outputs directly to `public/migrations/`)
   - Migrations are automatically applied in the worker when `init()` is called
   - The worker fetches and applies migrations from `/migrations/` on first initialization
   - Migrations only run once per database instance (tracked by `isInitialized` flag)

2. **Persistence**: The worker uses IndexedDB for persistence (`idb://pglite-demo`). Data will persist across page refreshes.

3. **Type Safety**: Drizzle ORM provides full TypeScript type safety for your queries.

4. **Production**: For production, consider:
   - Pre-bundling migration SQL files
   - Version tracking for applied migrations
   - Migration rollback strategy
   - Error handling and recovery

