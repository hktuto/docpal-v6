import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { emitBus, EventType } from 'eventbus'
import { newClientApi } from 'api'
import type {
  AutoRelationCandidateDTO,
  AutoRelationDetectResultDTO,
  MenuDTO,
  RelationEstablishRequestDTO,
  RelationEstablishResultDTO
} from 'api/src/generate/newClient'
import { useSingleDatabaseContext } from './useSignleDatabase'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_DURATION_MS = 5 * 60 * 1000

export type RelationAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface RelationCandidate {
  sourceTableId: string
  sourceTableName: string
  sourceFieldId: string
  sourceFieldName: string
  sourceFieldAlias: string
  targetTableId: string
  targetTableName: string
  targetFieldId: string
  targetFieldName: string
  targetFieldAlias: string
  nameSimilarity: number
  dataHitRate: number
  confidence: number
  jobId?: string | null
  progress?: number
  status?: RelationAnalysisStatus
  disabled?: boolean
}

export interface RelationAnalysisState {
  status: RelationAnalysisStatus
  message: string
  jobId: string | null
}

type RelationAnalysisContext = {
  analysis: Ref<RelationAnalysisState>
  analysisList: Ref<RelationCandidate[]>
  dismissGuess: (candidate: RelationCandidate) => void
  dismissAll: () => void
  reset: () => void
  runAnalysis: (databaseId: string, tableIds?: string[]) => Promise<void>
  submitEstablishJob: (payload: RelationEstablishRequestDTO) => Promise<string | null>
  pollEstablishJob: (
    jobId: string,
    guess: RelationCandidate,
    onUpdate?: (result: RelationEstablishResultDTO) => void
  ) => Promise<RelationEstablishResultDTO | null>
}

export const RelationAnalysisKey: InjectionKey<RelationAnalysisContext> = Symbol('RelationAnalysis')

function createInitialState(): RelationAnalysisState {
  return {
    status: 'pending',
    message: '',
    jobId: null
  }
}

function mapCandidate(candidate: AutoRelationCandidateDTO): RelationCandidate {
  const nameSimilarity = candidate.name_similarity ?? 0
  const dataHitRate = candidate.data_hit_rate ?? 0

  return {
    sourceTableId: candidate.source_table_id ?? '',
    sourceTableName: candidate.source_table_name ?? '',
    sourceFieldId: candidate.source_field_id ?? '',
    sourceFieldName: candidate.source_field_alias ?? '',
    sourceFieldAlias: candidate.source_field_alias ?? '',
    targetTableId: candidate.target_table_id ?? '',
    targetTableName: candidate.target_table_name ?? '',
    targetFieldId: candidate.target_field_id ?? '',
    targetFieldName: candidate.target_field_alias ?? '',
    targetFieldAlias: candidate.target_field_alias ?? '',
    nameSimilarity,
    dataHitRate,
    confidence: (nameSimilarity + dataHitRate) / 2,
    disabled: false
  }
}

function collectMenuTableIds(items: MenuDTO[]): string[] {
  const tableIds: string[] = []
  for (const item of items) {
    if (item.item_type === 'master_table' && item.item_id) {
      tableIds.push(item.item_id)
    }
    if (item.children?.length) {
      tableIds.push(...collectMenuTableIds(item.children))
    }
  }
  return tableIds
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function submitAutoDetectJob(entityId: string, tableIds: string[]): Promise<string | null> {
  const res: any = await newClientApi.postDynamicDbImportRelationsAutoDetect({
    entity_id: entityId,
    table_ids: tableIds
  })
  return res?.data?.job_id ?? null
}

async function pollAutoDetectJob(jobId: string, onUpdate?: (result: AutoRelationDetectResultDTO) => void): Promise<AutoRelationDetectResultDTO | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
    const res: any = await newClientApi.getDynamicDbImportRelationsAutoDetectJobidStatus(jobId)
    const result: AutoRelationDetectResultDTO | undefined = res?.data

    if (!result) {
      await sleep(POLL_INTERVAL_MS)
      continue
    }

    onUpdate?.(result)

    if (result.status === 'completed' || result.status === 'failed') {
      return result
    }

    await sleep(POLL_INTERVAL_MS)
  }

  return null
}

function updateGuessJobState(guess: RelationCandidate, result: RelationEstablishResultDTO, jobId: string) {
  guess.jobId = jobId
  if (result.status) {
    guess.status = result.status as RelationAnalysisStatus
  }
  if (result.status === 'completed') {
    guess.progress = 100
    emitBus(EventType.MD_TABLE_NEED_REFRESH, {
      table_id: guess.sourceTableId
    })
  } else {
    guess.progress = Math.min((guess.progress ?? 0) + 1, 99)
  }
}

async function submitEstablishJob(payload: RelationEstablishRequestDTO): Promise<string | null> {
  try {
    const res: any = await newClientApi.postDynamicDbImportRelationsEstablish(payload)
    const jobId = res?.data?.job_id
    if (!jobId) {
      ElMessage.error('Failed to start relation establishment — no job ID returned')
      return null
    }
    return jobId as string
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Unknown error'
    ElMessage.error(`Failed to establish relation: ${msg}`)
    return null
  }
}

async function pollEstablishJob(
  jobId: string,
  guess: RelationCandidate,
  onUpdate?: (result: RelationEstablishResultDTO) => void
): Promise<RelationEstablishResultDTO | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
    try {
      const res: any = await newClientApi.getDynamicDbImportRelationsJobidStatus(jobId)
      const result: RelationEstablishResultDTO | undefined = res?.data

      if (!result) {
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      updateGuessJobState(guess, result, jobId)
      onUpdate?.(result)

      if (result.status === 'completed' || result.status === 'failed') {
        return result
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error'
      ElMessage.error(`Failed to check relation status: ${msg}`)
      return null
    }

    await sleep(POLL_INTERVAL_MS)
  }

  ElMessage.warning('Timed out waiting for relation establishment.')
  return null
}

export function useRelationAnalysis() {
  const { menuState } = useSingleDatabaseContext()
  const analysis = ref<RelationAnalysisState>(createInitialState())
  const analysisList = ref<RelationCandidate[]>([])

  function dismissGuess(candidate: RelationCandidate) {
    const index = analysisList.value.indexOf(candidate)
    if (index !== -1) {
      const targetRelationId = analysisList.value[index].targetTableId
      const sourceRelationId = analysisList.value[index].sourceTableId
      analysisList.value.splice(index, 1)
      analysisList.value.forEach((item) => {
        if (item.targetTableId === targetRelationId && item.sourceTableId === sourceRelationId) {
          item.disabled = true
        }
      })
    }
  }

  function dismissAll() {
    analysisList.value = []
  }

  function reset() {
    Object.assign(analysis.value, createInitialState())
    analysisList.value = []
  }

  async function runAnalysis(databaseId: string, tableIds?: string[]) {
    reset()

    if (!databaseId) {
      analysis.value.status = 'failed'
      analysis.value.message = 'Analysis failed — no database context'
      return
    }

    analysis.value.status = 'pending'
    analysis.value.message = 'Submitting detection job...'

    try {
      const resolvedTableIds = tableIds?.length ? tableIds : collectMenuTableIds(menuState.value.items ?? [])

      if (resolvedTableIds.length === 0) {
        analysis.value.status = 'completed'
        analysis.value.message = 'No tables found in database'
        return
      }

      analysis.value.message = 'Detecting relations...'

      const jobId = await submitAutoDetectJob(databaseId, resolvedTableIds)
      if (!jobId) {
        analysis.value.status = 'failed'
        analysis.value.message = 'Analysis failed — no job ID returned'
        return
      }

      analysis.value.jobId = jobId
      analysis.value.message = 'Analyzing relations...'

      const result = await pollAutoDetectJob(jobId, (status) => {
        analysis.value.status = status.status as RelationAnalysisStatus
        if (status.status === 'processing') {
          analysis.value.message = 'Analyzing relations...'
        }
      })

      if (!result) {
        analysis.value.status = 'failed'
        analysis.value.message = 'Analysis failed — timed out waiting for results'
        return
      }

      if (result.status === 'failed') {
        analysis.value.status = 'failed'
        analysis.value.message = result.error_message ?? 'Analysis failed'
        return
      }

      const candidates = (result.candidates ?? []).map(mapCandidate)
      analysisList.value = candidates
      analysis.value.status = 'completed'
      analysis.value.message =
        candidates.length > 0 ? `Found ${candidates.length} potential relation${candidates.length === 1 ? '' : 's'}` : 'Analysis complete — no strong relations detected'

      if (candidates.length > 0) {
        ElNotification({
          title: 'Relations Detected',
          message: `Found ${candidates.length} potential relation${candidates.length === 1 ? '' : 's'} across tables.`,
          type: 'info',
          duration: 0
        })
      }
    } catch (err: any) {
      analysis.value.status = 'failed'
      analysis.value.message = err?.message ?? 'Analysis failed'
    }
  }

  const context: RelationAnalysisContext = {
    analysis,
    analysisList,
    dismissGuess,
    dismissAll,
    reset,
    runAnalysis,
    submitEstablishJob,
    pollEstablishJob
  }

  provide(RelationAnalysisKey, context)

  return context
}

export function useRelationAnalysisInject() {
  const context = inject(RelationAnalysisKey)
  if (!context) {
    throw new Error('RelationAnalysis is not provided. Make sure useRelationAnalysis is called in a parent component.')
  }
  return context
}
