import { useState } from '#imports'
import type { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { ElNotification } from 'element-plus'
import {
  captureTableSnapshot,
  captureTableNameMap,
  resolveNewTables,
  fetchTableSnapshot,
  guessRelations,
  type TableSnapshot,
  type RelationGuess
} from './relationGuesser'

const MAX_EXISTING_TABLES = 20

export type AnalysisStatus =
  | 'idle'
  | 'analyzing'
  | 'completed'
  | 'error'

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

function createInitialState(): ImportRelationAnalysisState {
  return {
    status: 'idle',
    message: '',
    progress: 0,
    newTableIds: [],
    guesses: [],
    startedAt: null,
    completedAt: null,
    error: null
  }
}

export function useImportRelationAnalysisState() {
  return useState<ImportRelationAnalysisState>('import-relation-analysis', () =>
    createInitialState()
  )
}

export function resetAnalysis() {
  const state = useImportRelationAnalysisState()
  Object.assign(state.value, createInitialState())
}

export function dismissGuess(index: number) {
  const state = useImportRelationAnalysisState()
  if (state.value.guesses[index]) {
    state.value.guesses[index].dismissed = true
  }
}

/**
 * Capture a snapshot of current table IDs before import.
 * Call this immediately before `importExcelFile`.
 */
export { captureTableSnapshot, captureTableNameMap }

/**
 * Start the post-import relation analysis.
 *
 * 1. Resolve newly created tables by diffing the pre-import snapshot.
 * 2. Fetch fields + sample rows for new tables and existing tables.
 * 3. Run scoring.
 * 4. Store results in global state.
 */
export async function startPostImportAnalysis(
  preSnapshot: Set<string>,
  databaseId?: string
) {
  const state = useImportRelationAnalysisState()
  resetAnalysis()

  state.value.status = 'analyzing'
  state.value.message = 'Resolving imported tables...'
  state.value.progress = 10
  state.value.startedAt = new Date().toISOString()

  if (!databaseId) {
    state.value.status = 'error'
    state.value.error = 'No database context available'
    state.value.message = 'Analysis failed — no database context'
    return
  }

  const newTableIds = await resolveNewTables(preSnapshot, databaseId)
  state.value.newTableIds = newTableIds

  if (newTableIds.length === 0) {
    state.value.status = 'completed'
    state.value.completedAt = new Date().toISOString()
    state.value.message = 'No new tables detected'
    state.value.progress = 100
    return
  }

  state.value.progress = 30
  state.value.message = 'Fetching table data...'

  // Build a name map so snapshots can resolve real table names
  const nameMap = await captureTableNameMap(databaseId)

  // Fetch snapshots for new tables
  const newTables = (
    await Promise.all(newTableIds.map((id) => fetchTableSnapshot(id, nameMap)))
  ).filter((t): t is TableSnapshot => t !== null)

  if (newTables.length === 0) {
    state.value.status = 'error'
    state.value.error = 'Unable to fetch data for newly created tables'
    state.value.message = 'Analysis failed — could not fetch new table data'
    return
  }

  state.value.progress = 50

  // Fetch snapshots for existing tables (bounded)
  const currentSnapshot = await captureTableSnapshot(databaseId)
  const existingTableIds = Array.from(currentSnapshot)
    .filter((id) => !newTableIds.includes(id))
    .slice(0, MAX_EXISTING_TABLES)

  const existingTables = (
    await Promise.all(existingTableIds.map((id) => fetchTableSnapshot(id, nameMap)))
  ).filter((t): t is TableSnapshot => t !== null)

  state.value.progress = 80
  state.value.message = 'Analyzing relations...'

  // Targets = existing tables + other new tables (for inter-sheet relations)
  const targets = [...existingTables, ...newTables]

  // Run scoring in a non-blocking way
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      const guesses = guessRelations(newTables, targets)
      state.value.guesses = guesses
      state.value.status = 'completed'
      state.value.completedAt = new Date().toISOString()
      state.value.progress = 100
      state.value.message =
        guesses.length > 0
          ? `Found ${guesses.length} potential relation${guesses.length === 1 ? '' : 's'}`
          : 'Analysis complete — no strong relations detected'

      if (guesses.length > 0) {
        ElNotification({
          title: 'Relations Detected',
          message: `Found ${guesses.length} potential relation${guesses.length === 1 ? '' : 's'} between imported tables.`,
          type: 'info',
          duration: 0
        })
      }

      resolve()
    }, 0)
  })
}
