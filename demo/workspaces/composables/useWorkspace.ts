import type { WorkspaceType } from '../utils/db/schema/workspaces'

export function useWorkspaces() {
  const { query, search } = usePglite()
  const workspaces = shallowRef<WorkspaceType[]>([])
  const loading = ref(false)

  /**
   * Get all workspaces
   */
  async function getWorkspaces(): Promise<WorkspaceType[]> {
    loading.value = true
    try {
      const data = await query<WorkspaceType>(`SELECT * FROM workspaces ORDER BY name ASC`)
      workspaces.value = data
      return data
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
  }): Promise<WorkspaceType[]> {
    const data = await search<WorkspaceType>({
      table: 'workspaces',
      searchKeys: ['name', 'description', 'slug'],
      ...options
    })
    // If in filter stage, need to return all items with __dim for non-matches
    // if (options.isFilterStage) {
    //   const matchedIds = new Set(data.map(item => item.id))
    //   const invertList= JSON.parse(JSON.stringify(workspaces.value)).filter((item:any) => !matchedIds.has(item.id)).map((item:any) => {item.__dim = true; return item});
    //   // Return all workspaces, with __dim for non-matches
    //   return [...data,...invertList]
    // }
    
    // After confirmation, just return filtered results
    return data
  }

  /**
   * Get workspace by ID
   */
  async function getWorkspaceById(id: string): Promise<WorkspaceType | null> {
    const data = await query<WorkspaceType>(
      `SELECT * FROM workspaces WHERE id = $1`,
      [id]
    )
    return data[0] || null
  }

  /**
   * Delete workspace by ID
   */
  async function deleteWorkspace(id: string): Promise<void> {
    await query(`DELETE FROM workspaces WHERE id = $1`, [id])
    // Update local state
    workspaces.value = workspaces.value.filter(w => w.id !== id)
  }

  /**
   * Clear all workspaces
   */
  async function clearAllWorkspaces(): Promise<void> {
    await query(`DELETE FROM workspaces`)
    workspaces.value = []
  }

  return {
    workspaces,
    loading,
    getWorkspaces,
    searchWorkspaces,
    getWorkspaceById,
    deleteWorkspace,
    clearAllWorkspaces
  }
}
