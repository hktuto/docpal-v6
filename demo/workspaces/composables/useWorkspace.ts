import type { CaseTypeRecord } from '../utils/db/schema/newTableSchema'

export function useWorkspaces() {
  const { query, search, removeAllTables } = usePglite()
  const workspaces = shallowRef<CaseTypeRecord[]>([])
  const loading = ref(false)

  /**
   * Get all workspaces (case types)
   */
  async function getWorkspaces(): Promise<CaseTypeRecord[]> {
    loading.value = true
    try {
      const data = await query<CaseTypeRecord>(`SELECT * FROM case_type ORDER BY name ASC`)
      workspaces.value = data
      console.log('workspaces', data)
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
  }): Promise<CaseTypeRecord[]> {
    const data = await search<CaseTypeRecord>({
      table: 'case_type',
      searchKeys: ['name', 'description'],
      ...options
    })
    return data
  }

  /**
   * Get workspace by ID
   */
  async function getWorkspaceById(id: string): Promise<CaseTypeRecord | null> {
    const data = await query<CaseTypeRecord>(`SELECT * FROM case_type WHERE id = $1`, [id])
    return data[0] || null
  }

  /**
   * Create a new workspace
   */
  async function createWorkspace(workspace: Partial<CaseTypeRecord>): Promise<CaseTypeRecord> {
    const now = new Date().toISOString()
    const data = await query<CaseTypeRecord>(
      `INSERT INTO case_type (name, description, icon, "entityType", "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [workspace.name, workspace.description || null, workspace.icon || null, workspace.entityType || 'case', workspace.createdBy || null, now, now]
    )
    // Update local state
    workspaces.value = [...workspaces.value, data[0]]
    return data[0]
  }

  /**
   * Update a workspace
   */
  async function updateWorkspace(id: string, updates: Partial<CaseTypeRecord>): Promise<void> {
    const now = new Date().toISOString()
    await query(
      `UPDATE case_type
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           icon = COALESCE($3, icon),
           "updatedAt" = $4
       WHERE id = $5`,
      [updates.name, updates.description, updates.icon, now, id]
    )
    // Update local state
    getWorkspaces()
  }

  /**
   * Delete workspace by ID and all related tables
   */
  async function deleteWorkspace(id: string): Promise<void> {
    // First, get all case tables related to this workspace
    const caseTables = await query<{ tableName: string }>(`SELECT "tableName" FROM case_tables WHERE "entityId" = $1`, [id])

    // Delete all physical tables created for this workspace
    for (const table of caseTables) {
      try {
        await query(`DROP TABLE IF EXISTS "${table.tableName}" CASCADE`)
      } catch (error) {
        console.warn(`Failed to drop table ${table.tableName}:`, error)
      }
    }

    // Delete all related records in case_tree
    await query(`DELETE FROM case_tree WHERE "entityId" = $1`, [id])

    // Delete all related records in case_views
    await query(`DELETE FROM case_views WHERE "entityId" = $1`, [id])

    // Delete all related records in case_fields
    // Note: case_fields are linked through case_tables, but we'll clean them up too
    await query(
      `DELETE FROM case_fields WHERE id IN (
        SELECT cf.id FROM case_fields cf
        JOIN case_tables ct ON cf."tableId" = ct.id
        WHERE ct."entityId" = $1
      )`,
      [id]
    )

    // Delete all related records in case_tables
    await query(`DELETE FROM case_tables WHERE "entityId" = $1`, [id])

    // Finally, delete the workspace itself
    await query(`DELETE FROM case_type WHERE id = $1`, [id])

    // Update local state
    getWorkspaces()
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
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    clearAllWorkspaces
  }
}
