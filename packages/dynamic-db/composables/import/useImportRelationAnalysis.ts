import { useState } from '#imports'
import type { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { parseExcelFile, type ParsedSheet } from './excelParser'
import {
  fetchExistingTableSnapshots,
  guessRelations,
  type ExistingTableSnapshot,
  type RelationGuess
} from './relationGuesser'

export type AnalysisStatus =
  | 'idle'
  | 'parsing'
  | 'fetching_existing'
  | 'analyzing'
  | 'completed'
  | 'error'

export interface ImportRelationAnalysisState {
  status: AnalysisStatus
  message: string
  progress: number
  parsedSheets: ParsedSheet[]
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
    parsedSheets: [],
    guesses: [],
    startedAt: null,
    completedAt: null,
    error: null
  }
}

/**
 * Global state for import relation analysis.
 */
export function useImportRelationAnalysisState() {
  return useState<ImportRelationAnalysisState>('import-relation-analysis', () =>
    createInitialState()
  )
}

/**
 * Reset the analysis state to idle.
 */
export function resetAnalysis() {
  const state = useImportRelationAnalysisState()
  Object.assign(state.value, createInitialState())
}

/**
 * Dismiss a specific guess by index.
 */
export function dismissGuess(index: number) {
  const state = useImportRelationAnalysisState()
  if (state.value.guesses[index]) {
    state.value.guesses[index].dismissed = true
  }
}

/**
 * Start the pre-upload relation analysis.
 *
 * 1. Parse the Excel file client-side.
 * 2. In parallel, fetch existing table metadata.
 * 3. Run chunked scoring.
 * 4. Store results in global state.
 */
export async function startPreUploadAnalysis(file: File, databaseId?: string) {
  const state = useImportRelationAnalysisState()
  resetAnalysis()

  state.value.status = 'parsing'
  state.value.message = 'Parsing Excel file...'
  state.value.progress = 10
  state.value.startedAt = new Date().toISOString()

  let parsedSheets: ParsedSheet[]
  try {
    parsedSheets = await parseExcelFile(file)
  } catch (err: any) {
    state.value.status = 'error'
    state.value.error = err?.message || 'Unable to parse Excel file'
    state.value.message = 'Failed to parse Excel file'
    return
  }

  state.value.parsedSheets = parsedSheets
  state.value.progress = 40

  if (!databaseId) {
    // No database context — skip relation guessing but keep parsed sheets
    state.value.status = 'completed'
    state.value.completedAt = new Date().toISOString()
    state.value.message = 'Parsed sheets ready'
    state.value.progress = 100
    return
  }

  state.value.status = 'fetching_existing'
  state.value.message = 'Fetching existing tables...'

  let existingTables: ExistingTableSnapshot[]
  try {
    existingTables = await fetchExistingTableSnapshots(databaseId)
  } catch {
    // Best-effort: if fetching existing tables fails, continue with empty list
    existingTables = []
  }

  state.value.status = 'analyzing'
  state.value.message = 'Analyzing relations...'
  state.value.progress = 60

  // Run scoring in a non-blocking way
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      const guesses = guessRelations(parsedSheets, existingTables)
      state.value.guesses = guesses
      state.value.status = 'completed'
      state.value.completedAt = new Date().toISOString()
      state.value.progress = 100
      state.value.message =
        guesses.length > 0
          ? `Found ${guesses.length} potential relation${guesses.length === 1 ? '' : 's'}`
          : 'Analysis complete — no strong relations detected'
      resolve()
    }, 0)
  })
}
