# Design: Pre-Upload Relation Guessing (Client-Side)

## Objective
After a user selects an Excel file — but **before** uploading it to the server — parse the file client-side, extract headers and sample rows from each sheet, and guess potential relations between the incoming sheets and existing tables in the same database. Store the results in a global `useState` ref so the UI can present them to the user for confirmation while the upload proceeds.

## Constraints
- No server-side changes.
- No web-worker infrastructure exists in the project.
- Analysis must be chunked so it does not block the main thread.
- Design only — no implementation yet.

---

## 1. Why Client-Side Pre-Processing?

The Excel file already contains every column name and data row required for relation guessing. Waiting for the server to import the data and then re-fetching it adds latency, requires fragile menu snapshot diffs, and couples the analysis to server-side job polling.

By parsing the file on the client **before** upload:
- The user sees relation suggestions immediately.
- No menu snapshot diff or post-import polling is required.
- The source of truth for the new data is the Excel file itself.

The only server data still required is the field metadata of **existing** tables (names and types), which is a fast parallel API call.

---

## 2. What Is Already in the Codebase

| Asset | Location | Reuse |
|-------|----------|-------|
| `xlsx` library | Workspace dependency (used in `dp-contact/composables/importHelper.ts`) | Read and parse the `File` object. |
| `detectAndFlattenHeaders(jsonData)` | `useImportBatch.ts` (lines 175–305) | Extract flattened headers from parsed sheet data. |
| `detectColumnType(samples, excelFormat?)` | `useImportBatch.ts` (lines 310–493) | Infer column types from sample values. |
| `generateFieldName(title)` | `useImportBatch.ts` (lines 52–68) | Sanitize header text into DB-safe field names (must match server normalization). |
| `cellValueToString(value, ...)` | `useImportBatch.ts` (lines 760–828) | Normalize cell values for comparison. |
| `isExcelFile(file)` | `useImportBatch.ts` (lines 834–840) | File-type gate. |
| `newClientApi.getDynamicDbTableTableidFields(tableId)` | API client | Fetch existing table field metadata. |
| `newClientApi.getDynamicDbMenusTree(...)` | API client | List existing tables in the current database. |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (ImportExcelDialog.vue / menu/index.vue)          │
│  ─────────────────────────────────────────────────────      │
│  1. User selects Excel file                                 │
│  2. triggerPreUploadAnalysis(file)                          │
│  3. Show progress / relation suggestions from useState      │
│  4. User clicks Confirm → importExcelFile(file)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Analysis Orchestrator (useImportRelationAnalysis.ts)       │
│  ─────────────────────────────────────────────────────      │
│  - Read File with FileReader (binary)                       │
│  - Parse with xlsx → workbook                               │
│  - Per sheet: headers + sample rows + types                 │
│  - In parallel: fetch existing table field metadata         │
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

## 4. Global State Shape

Use a single Nuxt `useState` keyed `'import-relation-analysis'`.

```ts
// packages/dynamic-db/composables/import/useImportRelationAnalysis.ts

export interface ImportRelationAnalysisState {
  /** 'idle' | 'parsing' | 'fetching_existing' | 'analyzing' | 'completed' | 'error' */
  status: AnalysisStatus
  /** Human-readable progress message */
  message: string
  /** 0 → 100 */
  progress: number
  /** Parsed sheets from the Excel file */
  parsedSheets: ParsedSheet[]
  /** Guessed relations ordered by confidence desc */
  guesses: RelationGuess[]
  /** ISO timestamp of when this analysis started */
  startedAt: string | null
  /** ISO timestamp of when this analysis finished */
  completedAt: string | null
  /** If the analysis errored out */
  error: string | null
}

export type AnalysisStatus =
  | 'idle'
  | 'parsing'
  | 'fetching_existing'
  | 'analyzing'
  | 'completed'
  | 'error'

export interface ParsedSheet {
  /** Original Excel sheet name */
  sheetName: string
  /** Predicted table name (sanitized from sheet name) */
  predictedTableName: string
  /** Flattened column headers */
  headers: string[]
  /** Generated DB field names for each header */
  fieldNames: string[]
  /** Inferred column types */
  columnTypes: ColumnFieldType[]
  /** First N data rows (after header rows) */
  sampleRows: Record<string, any>[]
}

export interface RelationGuess {
  /** The incoming sheet that would contain the foreign-key column */
  sourceSheetName: string
  sourceFieldName: string
  sourceFieldType: ColumnFieldType
  /** The existing table being referenced */
  targetTableId: string
  targetTableName: string
  /** The field in the existing table being referenced */
  targetFieldId: string
  targetFieldName: string
  /** 0.0 → 1.0 composite confidence */
  confidence: number
  /** Breakdown of why this score was given */
  reasons: RelationGuessReason[]
  /** Whether the user has already acted on this guess */
  dismissed: boolean
}

export interface RelationGuessReason {
  type: 'name_match' | 'value_overlap' | 'type_compatibility' | 'table_name_in_field'
  score: number
  detail: string
}
```

---

## 5. Parsing Phase (Client-Side)

### 5.1 File Reading

```ts
const arrayBuffer = await file.arrayBuffer()
const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: true })
```

### 5.2 Per-Sheet Extraction

For each `workbook.SheetNames`:

1. Convert sheet to raw 2-D array:
   ```ts
   const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
   ```
2. Detect and flatten headers (reuse `detectAndFlattenHeaders`):
   ```ts
   const { headers, headerRowCount } = detectAndFlattenHeaders(rawData)
   ```
3. Extract sample data rows (up to 100 rows after header):
   ```ts
   const dataRows = rawData.slice(headerRowCount, headerRowCount + 100)
   ```
4. Generate DB field names (reuse `generateUniqueFieldNames`):
   ```ts
   const fieldNames = generateUniqueFieldNames(headers)
   ```
5. Detect column types (reuse `detectColumnType`):
   ```ts
   const columnTypes = headers.map((_, colIdx) => {
     const samples = dataRows.map((row) => row[colIdx]).filter((v) => v !== undefined && v !== null && v !== '')
     const format = sheet['!ref'] ? /* derive per-column Excel format if available */ : undefined
     return detectColumnType(samples, format).type
   })
   ```
6. Normalize rows into `Record<string, any>` keyed by `fieldName`.

### 5.3 Chunking

If a sheet contains > 1,000 rows, only parse the first 1,000 for analysis. The relation guesser does not need the full dataset — it needs representative sample values.

---

## 6. Fetch Existing Tables (Parallel)

While parsing proceeds, fetch existing table metadata in the same database:

1. Call `newClientApi.getDynamicDbMenusTree({ referenceEntityType: 'case', referenceEntityId: databaseId })`.
2. Filter to `item_type === 'master_table'`.
3. For each existing table, call `newClientApi.getDynamicDbTableTableidFields(table.item_id)`.
4. Cache the results in a transient in-memory map.

**Bounded scope**: limit to the first 20 `master_table` entries to keep API calls predictable.

```ts
interface ExistingTableSnapshot {
  tableId: string
  tableName: string
  fields: MasterTableFieldResponseDTO[]
}
```

---

## 7. Scoring Algorithm

For every **parsed sheet** (source) and every **existing table** (target):

For each field `sf` in the parsed sheet and each field `tf` in the existing table:

### 7.1 Name-match heuristics (`name_match`)
- **Exact match**: `sf.fieldName === tf.field_name` → +0.25
- **ID suffix/prefix**: `sf.fieldName` ends with `_id`, `_no`, `_code` and the prefix matches `tf.field_name` or `targetTableName` → +0.35
- **Table name inside field name**: `sf.fieldName` contains normalized `targetTableName` → +0.20
- **Levenshtein similarity** between `sf.fieldName` and `tf.field_name` > 0.8 → +0.15

### 7.2 Value overlap (`value_overlap`)
- Build a `Set` of non-null sample values from `tf` (existing table field).
- Count how many non-null sample values from `sf` (parsed sheet) exist in that Set.
- Overlap ratio = `matched / sf_non_null_samples`.
- Ratio > 0.7 → +0.40
- Ratio > 0.5 → +0.25
- Ratio > 0.3 → +0.10

> **Note**: because `tf` is fetched from the server and `sf` comes from the Excel file, the overlap is computed across two different data sources.

### 7.3 Type compatibility (`type_compatibility`)
- Both fields have compatible `business_type` (e.g., Text ↔ Text, Number ↔ Number) → +0.05
- Mismatched types (e.g., Number vs DateTime) → -0.10 penalty

### 7.4 Table-name-in-field (`table_name_in_field`)
- `sf.header` or `sf.fieldName` contains target table name (case-insensitive, normalized) → +0.15

### Composite confidence
Sum all positive scores, apply penalty, then clamp to `[0, 1]`.

**Threshold**: only store guesses with `confidence >= 0.45`. Max results per source sheet: 5.

### Sorting
Sort all guesses globally by `confidence` descending.

---

## 8. Background Task Strategy (Chunked Async)

No Web Workers exist. Use a cooperative scheduler that yields every N milliseconds.

```ts
async function runChunked<T>(
  items: T[],
  chunkSize: number,
  yieldMs: number,
  processor: (item: T) => Promise<void>,
  onProgress: (done: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const slice = items.slice(i, i + chunkSize)
    await Promise.all(slice.map(processor))
    onProgress(Math.min(i + chunkSize, items.length), items.length)
    await new Promise((r) => setTimeout(r, yieldMs))
  }
}
```

This keeps the UI responsive while parsing large Excel files and running CPU scoring.

---

## 9. Proposed File Structure

```
packages/dynamic-db/composables/import/
├── useImportBatch.ts                          (existing)
├── useImportRelationAnalysis.ts               (new — orchestrator + global state)
├── relationGuesser.ts                         (new — pure scoring logic)
├── excelParser.ts                             (new — xlsx wrapper + header/type extraction)
└── RELATION_ANALYSIS_DESIGN.md                (this file)
```

### 9.1 `excelParser.ts`

Responsibilities:
- `parseExcelFile(file: File): Promise<ParsedSheet[]>`
- Wraps `xlsx` reading, delegates to `detectAndFlattenHeaders`, `detectColumnType`, `generateUniqueFieldNames`.
- Enforces the 1,000-row parse limit.
- Returns fully typed `ParsedSheet[]`.

### 9.2 `useImportRelationAnalysis.ts`

Responsibilities:
- Define and export `useImportRelationAnalysisState()` composable that returns the global `useState`.
- Export `startPreUploadAnalysis(file: File, databaseId: string)`.
- Orchestrate: parse Excel → fetch existing tables → run chunked scoring → write state.
- Provide `resetAnalysis()` to clear state.
- Provide `dismissGuess(index: number)` to mark a guess as acted upon.

### 9.3 `relationGuesser.ts`

Responsibilities:
- Pure functions, no Vue/Nuxt dependencies.
- `fetchExistingTableSnapshots(databaseId: string, limit?: number): Promise<ExistingTableSnapshot[]>`
- `guessRelations(sources: ParsedSheet[], targets: ExistingTableSnapshot[]): RelationGuess[]`
- String-similarity utilities (Levenshtein, normalizeName).
- Value-overlap calculator.

---

## 10. Integration Point

Hook into the file-selection handlers **before** `importExcelFile` is called.

```ts
// In ImportExcelDialog.vue or menu/index.vue

const { startPreUploadAnalysis } = useImportRelationAnalysis()
const analysis = useImportRelationAnalysisState()

async function handleFileChange(file: File) {
  selectedFile.value = file.raw
  errorMessage.value = ''

  // 1. Start analysis immediately (non-blocking)
  startPreUploadAnalysis(file.raw, database.value?.id)

  // 2. Validate file type
  if (!isExcelFile(selectedFile.value)) {
    errorMessage.value = 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)'
    return
  }

  // 3. Proceed with upload
  const result = await importExcelFile(selectedFile.value)
  if (result.hasErrorReport) {
    errorReportMsg.value = result.errorMessage
    errorReportId.value = result.jobId
  } else {
    dialogVisible.value = false
  }
  emit('success')
}
```

The UI can read `analysis.guesses` at any time after parsing completes and render a suggestion panel.

---

## 11. Post-Import Reconciliation (Safeguard)

The server-side import may rename duplicate columns, coerce types, or skip header rows in ways the client cannot predict. To guard against divergence between guessed field names and the final server-created fields, add an optional lightweight reconciliation step:

1. After `importExcelFile` succeeds and `getMenuFromDb()` refreshes the menu, resolve the newly created table IDs from the menu tree (by matching sheet names to table names).
2. Fetch the actual table fields via `getDynamicDbTableTableidFields`.
3. Remap guess `sourceFieldName` values to the actual server-assigned `field_name` values using fuzzy string matching.
4. Update `analysis.guesses` in-place with the reconciled field names.

This step is optional. The overlap heuristic is already resilient to minor name divergence. Enable it only if the UI needs exact field IDs for the "Create Relation" action.

---

## 12. API Surface for UI Consumers

```ts
// Any Vue component can do:
const analysis = useImportRelationAnalysisState()

// Read status
analysis.status === 'analyzing'
analysis.progress // 0-100

// Read parsed sheets
analysis.parsedSheets.map(s => s.sheetName)

// Read guesses
analysis.guesses.filter(g => !g.dismissed)

// Dismiss a guess
function dismissGuess(index: number) {
  analysis.guesses[index].dismissed = true
}
```

The UI can show:
1. A preview panel listing detected sheets, headers, and inferred types while parsing.
2. A relation-suggestion banner when `status === 'completed'` and `guesses.length > 0`.
3. A progress indicator while `status === 'parsing' || status === 'analyzing'`.

---

## 13. Performance Budget

| Step | Budget | Mitigation |
|------|--------|------------|
| Parse Excel file (client) | < 500 ms for 5 sheets × 1,000 rows | `xlsx` is fast; cap rows at 1,000 |
| Fetch existing table fields | < 500 ms (parallel) | Bounded to 20 tables |
| Scoring pairwise loops | O(S × T × F_s × F_t) | Chunked scheduler |
| Main thread blocking | < 50 ms per chunk | `setTimeout(..., 0)` between chunks |
| Total runtime target | < 2 s before upload starts | Parsing and scoring overlap with user reading UI |

---

## 14. Error Handling

- File is not a valid Excel → `status = 'error'`, `error = 'Unable to parse Excel file'`.
- Network failure fetching existing tables → log to console, skip existing-table scoring, still return sheet-only analysis (useful for header/type preview).
- Analysis is best-effort; it never blocks the user from uploading the file.
