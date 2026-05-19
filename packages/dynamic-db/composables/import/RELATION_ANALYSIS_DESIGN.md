# Design: Post-Import Relation Guessing

## Objective
After a user imports an Excel file and the server has created/updated the tables, run a background analysis that guesses potential relations between the newly imported tables and existing tables in the same database. Store the results in a global `useState` ref so the UI can present them to the user for confirmation.

## Constraints
- No server-side changes.
- No web-worker infrastructure exists in the project.
- Analysis must be chunked so it does not block the main thread.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (ImportExcelDialog.vue / menu/index.vue)          │
│  ─────────────────────────────────────────────────────      │
│  1. User selects Excel file                                 │
│  2. Capture pre-import menu snapshot                        │
│  3. importExcelFile(file) → server creates tables           │
│  4. getMenuFromDb() → refresh menu                          │
│  5. startPostImportAnalysis(preSnapshot)                    │
│  6. Poll / react to importRelationAnalysisState             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Analysis Orchestrator (useImportRelationAnalysis.ts)       │
│  ─────────────────────────────────────────────────────      │
│  - Resolve new tables by diffing pre/post menu snapshots    │
│  - Fetch fields + sample rows for new tables                │
│  - Fetch fields + sample rows for existing tables (bounded) │
│  - Run chunked scoring loop                                 │
│  - Write final result to global useState                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Scoring Engine (relationGuesser.ts)                        │
│  ─────────────────────────────────────────────────────      │
│  - Heuristic name matching                                  │
│  - Value-overlap detection                                  │
│  - Confidence scoring (0.0 → 1.0)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Why Post-Import?

The database may already contain many tables. To detect relations between newly imported data and existing tables, both datasets must be materialized in the database first. Client-side parsing of the Excel file cannot know how the server transformed the data (column renaming, type coercion, deduplication). Running the analysis after import ensures the guessed field names align with the actual server-created schema.

---

## 3. Global State Shape

Use a single Nuxt `useState` keyed `'import-relation-analysis'`.

```ts
export type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error'

export interface ImportRelationAnalysisState {
  status: AnalysisStatus
  message: string
  progress: number
  newTableIds: string[]
  guesses: RelationGuess[]
  startedAt: string | null
  completedAt: string | null
  error: string | null
}

export interface RelationGuess {
  sourceTableId: string
  sourceTableName: string
  sourceFieldName: string
  sourceFieldType: ColumnFieldType
  targetTableId: string
  targetTableName: string
  targetFieldId: string
  targetFieldName: string
  confidence: number
  reasons: RelationGuessReason[]
  dismissed: boolean
}

export interface RelationGuessReason {
  type: 'name_match' | 'value_overlap' | 'type_compatibility' | 'table_name_in_field'
  score: number
  detail: string
}
```

---

## 4. Table Discovery (Menu Snapshot Diff)

The server import job status endpoint does **not** return created/updated table IDs. Use a snapshot diff:

1. **Before import**: `captureTableSnapshot(databaseId)` fetches the menu tree and collects all `master_table` `item_id`s into a `Set<string>`.
2. **After import**: `getMenuFromDb()` refreshes the menu.
3. **Diff**: `resolveNewTables(preSnapshot, databaseId)` fetches the current menu and returns any `master_table` `item_id` not present in the pre-import snapshot.

This identifies newly created tables without server cooperation.

---

## 5. Background Task Strategy

No Web Workers exist. The scoring loop runs inside a `setTimeout(..., 0)` to yield the main thread. Network I/O (fetching fields and rows) is naturally async and non-blocking.

---

## 6. Data Fetching Phase

For every **newly imported table**:
- `newClientApi.getDynamicDbTableTableidFields(tableId)` → fields
- `postDynamicActions({ tableId, columns: [], pagination: { pageNum: 1, pageSize: 50 } })` → sample rows

For **existing tables** (bounded scope):
- Same APIs as above.
- Limit to the first 20 existing `master_table` entries to keep runtime predictable.

```ts
interface TableSnapshot {
  tableId: string
  tableName: string
  fields: TableFieldDTO[]
  sampleRows: Record<string, any>[]
}
```

---

## 7. Scoring Algorithm

For every **new table** (source) and every **other table** (target — existing or also newly imported):

For each field `sf` in source and each field `tf` in target:

### 7.1 Name-match heuristics (`name_match`)
- **Exact match**: `sf.field_name === tf.field_name` → +0.25
- **ID suffix/prefix**: `sf.field_name` ends with `_id`, `_no`, `_code` and the prefix matches `tf.field_name` or `targetTableName` → +0.35
- **Table name inside field name**: `sf.field_name` contains normalized `targetTableName` → +0.15
- **Levenshtein similarity** > 0.8 → +0.15

### 7.2 Value overlap (`value_overlap`)
- Build a `Set` of non-null sample values from `tf`.
- Count how many non-null sample values from `sf` exist in that Set.
- Overlap ratio = `matched / sf_non_null_samples`.
- Ratio > 0.7 → +0.40
- Ratio > 0.5 → +0.25
- Ratio > 0.3 → +0.10

### 7.3 Type compatibility (`type_compatibility`)
- Compatible types → +0.05
- Incompatible types (neither is text) → -0.10 penalty

### Composite confidence
Sum all scores, clamp to `[0, 1]`.

**Threshold**: only store guesses with `confidence >= 0.45`. Max results per source table: 5.

---

## 8. File Structure

```
packages/dynamic-db/composables/import/
├── useImportBatch.ts                          (existing — exported parsing utilities)
├── useImportRelationAnalysis.ts               (orchestrator + global state)
├── relationGuesser.ts                         (pure scoring logic + snapshot helpers)
├── excelParser.ts                             (client-side Excel parser — unused by main flow, kept as utility)
└── RELATION_ANALYSIS_DESIGN.md                (this file)
```

### 8.1 `relationGuesser.ts`

Responsibilities:
- `captureTableSnapshot(databaseId)` → `Promise<Set<string>>`
- `resolveNewTables(preSnapshot, databaseId)` → `Promise<string[]>`
- `fetchTableSnapshot(tableId)` → `Promise<TableSnapshot | null>`
- `guessRelations(sources, targets)` → `RelationGuess[]`
- String-similarity utilities (Levenshtein, normalizeName).

### 8.2 `useImportRelationAnalysis.ts`

Responsibilities:
- Define and export `useImportRelationAnalysisState()`.
- Export `startPostImportAnalysis(preSnapshot, databaseId)`.
- Orchestrate: resolve new tables → fetch snapshots → run scoring → write state.
- Provide `resetAnalysis()` and `dismissGuess(index)`.

---

## 9. Integration Point

Hook into the file-selection handlers **after** `importExcelFile` and `getMenuFromDb` complete.

```ts
// In ImportExcelDialog.vue or menu/index.vue

import { captureTableSnapshot, startPostImportAnalysis } from '../../../composables/import/useImportRelationAnalysis'

async function handleFileChange(file: any) {
  // ... validation ...

  // 1. Capture snapshot before upload
  const preSnapshot = await captureTableSnapshot(database.value?.id)

  // 2. Upload and import
  const result = await importExcelFile(file.raw)

  // 3. Refresh menu so new tables appear
  await getMenuFromDb()

  // 4. Run relation analysis
  startPostImportAnalysis(preSnapshot, database.value?.id)

  // ... rest of handler ...
}
```

The UI can read `analysis.guesses` at any time after `status === 'completed'`.

---

## 10. API Surface for UI Consumers

```ts
const analysis = useImportRelationAnalysisState()

// Read status
analysis.status === 'analyzing'
analysis.progress // 0-100

// Read guesses
analysis.guesses.filter(g => !g.dismissed)

// Dismiss a guess
function dismissGuess(index: number) {
  analysis.guesses[index].dismissed = true
}
```

The UI can show:
1. A toast / banner when `status` transitions to `'completed'` and `guesses.length > 0`.
2. A side panel listing guessed relations with "Create Relation" and "Ignore" buttons.
3. A progress indicator while `status === 'analyzing'`.

---

## 11. Performance Budget

| Step | Budget | Mitigation |
|------|--------|------------|
| Fetch menu snapshot | 1 network call | Lightweight |
| Resolve new tables | 1 network call | Menu tree is small |
| Fetch fields per table | 1 call per table | Parallel `Promise.all` |
| Fetch sample rows per table | 1 call per table (50 rows) | Parallel `Promise.all` |
| Scoring pairwise loops | O(N × T × F_n × F_t) | `setTimeout` yield, 20 existing-table cap |
| Main thread blocking | < 50 ms per chunk | Scoring runs in `setTimeout` |
| Total runtime target | < 3 s for 5 new tables | Early exit if zero new tables |

---

## 12. Error Handling

- Zero new tables detected → `status = 'completed'`, message explains no new tables.
- Network failure fetching table data → log to console, skip that table, continue with remaining tables.
- If **all** fetches fail → `status = 'error'`, `error = 'Unable to fetch table data for analysis'`.
- Analysis is best-effort; it never blocks the user from using the imported data.
