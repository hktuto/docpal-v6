import type { CaseTypeRecord } from '../utils/db/schema/newTableSchema'
import { getCurrentUserId } from './useCurrentUser'
import { newClientApi } from 'api'

export function useWorkspaces() {
  const { query, search, removeAllTables } = usePglite()
  const workspaces = shallowRef<CaseTypeRecord[]>([])
  const loading = ref(false)

  /**
   * Get all workspaces (case types)
   */
  async function getWorkspaces(params: any = { pageNum: 0, pageSize: 100 }): Promise<CaseTypeRecord[]> {
    loading.value = true
    // TODO: need to add pagination
    try {
      const {
        data: { entryList, totalSize }
      }: any = await newClientApi.postDynamicDbCaseTypesPage(params)
      workspaces.value = entryList
      return entryList
    } finally {
      loading.value = false
    }
  }

  /**
   * Search workspaces with filters (pure function - doesn't modify workspaces.value)
   * Returns filtered results for SearchableList
   */
  async function searchWorkspaces(options: {
    keyword?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    isFilterStage?: boolean
  }): Promise<CaseTypeRecord[]> {
    // TODO: may be merge with getWorkspaces
    const data = await search<CaseTypeRecord>({
      table: 'case_type',
      searchKeys: ['name', 'description'],
      ...options
    })
    return data
  }

  /**
   * Create a new workspace
   */
  async function createWorkspace(workspace: Partial<CaseTypeRecord>): Promise<CaseTypeRecord> {
    const now = new Date().toISOString()
    const currentUserId = workspace.createdBy || getCurrentUserId()
    if (workspace.name == null || workspace.name === '') {
      throw new Error('Workspace name is required')
    }
    const dto: any = {
      name: workspace.name,
      description: workspace.description ?? undefined,
    }
    if (workspace.icon) {
      dto.metadata = {
        icon: workspace.icon
      }
    }
    const { data }: any = await newClientApi.postDynamicDbCaseTypes(dto)
    console.log('data', data)
    workspaces.value = [...workspaces.value, data]

    return data
  }

  /**
   * Delete workspace by ID and all related tables
   */
  async function deleteWorkspace(id: string): Promise<boolean> {
    const { data }: any = await newClientApi.deleteDynamicDbCaseTypesId(id)
    if(!data) {
      throw new Error('Failed to delete workspace')
    }
    workspaces.value = workspaces.value.filter((workspace) => workspace.id !== id)
    return data
  }

  /**
   * Clear all workspaces
   */
  async function clearAllWorkspaces(): Promise<void> {
    await removeAllTables()
    await getWorkspaces()
  }

  return {
    workspaces,
    loading,
    getWorkspaces,
    searchWorkspaces,
    createWorkspace,
    deleteWorkspace,
    clearAllWorkspaces
  }
}
