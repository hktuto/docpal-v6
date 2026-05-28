import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

export interface EstablishRelationPayload {
  source_table_id: string
  target_table_id: string
  source_match_field_id: string
  target_match_field_id: string
  relation_field_name: string
  display_field_ids: string[]
  is_array?: boolean
}

export interface RelationJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  relation_field_id?: string
  total_source_rows?: number
  matched_rows?: number
  unmatched_rows?: number
  total_links_created?: number
  error_message?: string
}

export interface EstablishResult {
  job_id: string
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_DURATION_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Submit a relation-establishment job to the backend.
 */
export async function establishRelation(
  payload: EstablishRelationPayload
): Promise<string | null> {
  try {
    const res: any = await clientApi.instance.post(
      '/api/dynamic-db/import/relations/establish',
      payload
    )
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
      const res: any = await clientApi.instance.get(
        `/api/dynamic-db/import/relations/${jobId}/status`
      )
      status = res?.data ?? null
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
