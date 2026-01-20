import type { CaseTableRecord, SuggestionStatus } from '../utils/db/schema/newTableSchema'

/**
 * Background poller for processing pending relation suggestions
 * 
 * This composable:
 * 1. Checks for tables with 'pending' suggestionStatus
 * 2. Processes them one at a time in the background
 * 3. Updates status to 'processing' -> 'ready'/'none'
 * 4. Survives page refresh (status stored in DB)
 * 5. Continues as long as app is open
 * 6. Provides reactive status map for all tables
 * 
 */

export interface SuggestionInterface {
  tableStatuses: Ref<Record<string, { status: SuggestionStatus; count: number }>>
}

export const SuggestionContext: InjectionKey<SuggestionInterface> = Symbol('SuggestionContext')
export function useSuggestionPoller() {
  const { query } = usePglite()
  const { analyzeTableForRelations } = useRelationSuggestions()
  
  let intervalId: number | null = null
  let isProcessing = ref(false)
  
  // Reactive map of table statuses: { tableId: { status, count } }
  const tableStatuses = ref<Record<string, { status: SuggestionStatus; count: number }>>({})
  
  /**
   * Update status map for all tables in current workspace
   */
  async function updateAllStatuses(entityId?: string) {
    try {
      const whereClause = entityId ? `WHERE "entityId" = $1` : ''
      const params = entityId ? [entityId] : []
      
      const tables = await query<CaseTableRecord>(
        `SELECT id, "suggestionStatus" FROM case_tables ${whereClause}`,
        params
      )
      
      // Update status map
      for (const table of tables) {
        const status = table.suggestionStatus || 'none'
        let count = 0
        
        // If ready, get suggestion count
        if (status === 'ready') {
          const { getPendingSuggestions } = useRelationSuggestions()
          const suggestions = await getPendingSuggestions(table.id)
          count = suggestions.length
        }
        
        tableStatuses.value[table.id] = { status, count }
      }
    } catch (error) {
      console.error('[SuggestionPoller] Error updating statuses:', error)
    }
  }
  
  /**
   * Check for pending tables and process one
   */
  async function checkAndProcessPending() {
    // Skip if already processing
    if (isProcessing.value) {
      console.log('[SuggestionPoller] Already processing, skipping...')
      return
    }
    
    try {
      isProcessing.value = true
      
      // Find tables with 'pending' status (oldest first)
      const pending = await query<CaseTableRecord>(
        `SELECT * FROM case_tables 
         WHERE "suggestionStatus" = 'pending'
         ORDER BY "createdAt" ASC
         LIMIT 1`
      )
      
      if (pending.length === 0) {
        console.log('[SuggestionPoller] No pending tables found')
        return
      }
      
      const table = pending[0]
      console.log(`[SuggestionPoller] Processing table: ${table.name} (${table.id})`)
      
      // Update status to 'processing'
      await query(
        `UPDATE case_tables 
         SET "suggestionStatus" = 'processing', "updatedAt" = $1 
         WHERE id = $2`,
        [new Date(), table.id]
      )
      
      // Update reactive status map
      tableStatuses.value[table.id] = { status: 'processing', count: 0 }
      
      // Analyze the table for relations
      const suggestionsCount = await analyzeTableForRelations(table.id, table.entityId)
      
      console.log(`[SuggestionPoller] Found ${suggestionsCount} suggestions for table: ${table.name}`)
      
      // Update status based on results
      const newStatus = suggestionsCount > 0 ? 'ready' : 'none'
      await query(
        `UPDATE case_tables 
         SET "suggestionStatus" = $1, "updatedAt" = $2 
         WHERE id = $3`,
        [newStatus, new Date(), table.id]
      )
      
      // Update reactive status map
      tableStatuses.value[table.id] = { status: newStatus, count: suggestionsCount }
      
      console.log(`[SuggestionPoller] Updated table status to: ${newStatus}`)
      
    } catch (error) {
      console.error('[SuggestionPoller] Error processing suggestions:', error)
      
      // Try to update status to 'error' if we can identify the table
      // (This is best-effort error handling)
    } finally {
      isProcessing.value = false
    }
  }
  
  /**
   * Start the background poller
   */
  function start(entityId?: string) {
    if (intervalId) {
      console.log('[SuggestionPoller] Already running')
      return
    }
    
    console.log('[SuggestionPoller] Starting background poller')
    
    // Load initial statuses
    updateAllStatuses(entityId)
    
    // Check immediately on start
    checkAndProcessPending()
    
    // Then check every 30 seconds
    intervalId = setInterval(checkAndProcessPending, 30000) as unknown as number
  }
  
  /**
   * Stop the background poller
   */
  function stop() {
    if (intervalId) {
      console.log('[SuggestionPoller] Stopping background poller')
      clearInterval(intervalId)
      intervalId = null
    }
  }
  
  /**
   * Check if poller is running
   */
  function isRunning() {
    return intervalId !== null
  }

  provide(SuggestionContext, {
    tableStatuses
  })
  
  return {
    start,
    stop,
    isRunning,
    isProcessing: readonly(isProcessing),
    tableStatuses: readonly(tableStatuses), // Expose reactive status map
    updateAllStatuses, // Expose for manual refresh
    checkAndProcessPending // Expose for manual trigger
  }
}

export const useSuggestionContext = () => {
  const context = inject(SuggestionContext)
  if (!context) {
    throw new Error('SuggestionContext is not provided')
  }
  return context
}
