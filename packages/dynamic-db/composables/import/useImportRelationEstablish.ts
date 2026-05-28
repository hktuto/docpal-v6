import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'
import type {
  RelationEstablishRequestDTO,
  RelationEstablishResultDTO
} from 'api/src/generate/newClient'

export interface RelationJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  relation_field_id?: string
  total_source_rows?: number
  matched_rows?: number
  unmatched_rows?: number
  total_links_created?: number
  error_message?: string
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_DURATION_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Submit a relation-establishment job to the backend.
 */
export async function establishRelation(
  payload: RelationEstablishRequestDTO
): Promise<string | null> {
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

/**
 * Poll the relation-establishment job status until it completes or fails.
 *
 * @param jobId — the job returned by `establishRelation`
 * @param onUpdate — called on every poll tick with the latest status
 * @returns final status object
 */
export async function pollRelationJobStatus(
  jobId: string,
  onUpdate?: (status: RelationJobStatus) => void
): Promise<RelationJobStatus | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
    let status: RelationJobStatus | null = null

    try {
      const res: any = await newClientApi.getDynamicDbImportRelationsJobidStatus(jobId)
      const dto: RelationEstablishResultDTO | undefined = res?.data
      if (dto) {
        status = {
          status: dto.status as RelationJobStatus['status'],
          relation_field_id: dto.relation_field_id,
          total_source_rows: dto.total_source_rows,
          matched_rows: dto.matched_rows,
          unmatched_rows: dto.unmatched_rows,
          total_links_created: dto.total_links_created,
          error_message: dto.error_message
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error'
      ElMessage.error(`Failed to check relation status: ${msg}`)
      return null
    }

    if (!status) {
      await sleep(POLL_INTERVAL_MS)
      continue
    }

    onUpdate?.(status)

    if (status.status === 'completed' || status.status === 'failed') {
      return status
    }

    await sleep(POLL_INTERVAL_MS)
  }

  ElMessage.warning('Relation establishment is taking longer than expected. Please check again later.')
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
