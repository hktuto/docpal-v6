import { ref, computed } from 'vue'

export interface UpdateStatus {
  rowId: string
  field: string
  status: 'loading' | 'success' | 'error'
  timestamp: number
  error?: string
}
const useUpdateStatusState = () => useState<Map<string, UpdateStatus>>('updateStatus', () => new Map())

// Auto-clear success statuses after a delay
const AUTO_CLEAR_DELAY = 2000 // 2 seconds

/**
 * Composable for tracking cell/row update statuses across different views
 * Provides a centralized way to track loading, success, and error states
 */
export function useUpdateStatus() {

  const updateStatuses = useUpdateStatusState()
  /**
   * Generate a unique key for a cell update
   */
  const getUpdateKey = (rowId: string, field?: string): string => {
    return field ? `${rowId}:${field}` : rowId
  }

  /**
   * Set an update as loading
   */
  const setLoading = (rowId: string, field?: string): void => {
    const key = getUpdateKey(rowId, field)
    updateStatuses.value.set(key, {
      rowId,
      field: field || '',
      status: 'loading',
      timestamp: Date.now()
    })
  }

  /**
   * Set an update as successful
   */
  const setSuccess = (rowId: string, field?: string): void => {
    const key = getUpdateKey(rowId, field)
    updateStatuses.value.set(key, {
      rowId,
      field: field || '',
      status: 'success',
      timestamp: Date.now()
    })

    // Auto-clear after delay
    setTimeout(() => {
      clearStatus(rowId, field)
    }, AUTO_CLEAR_DELAY)
  }

  /**
   * Set an update as failed
   */
  const setError = (rowId: string, field?: string, error?: string): void => {
    const key = getUpdateKey(rowId, field)
    updateStatuses.value.set(key, {
      rowId,
      field: field || '',
      status: 'error',
      timestamp: Date.now(),
      error
    })

    // Auto-clear after longer delay for errors
    setTimeout(() => {
      clearStatus(rowId, field)
    }, AUTO_CLEAR_DELAY * 2)
  }

  /**
   * Clear a specific update status
   */
  const clearStatus = (rowId: string, field?: string): void => {
    const key = getUpdateKey(rowId, field)
    updateStatuses.value.delete(key)
  }

  /**
   * Clear all update statuses
   */
  const clearAllStatuses = (): void => {
    updateStatuses.value.clear()
  }

  /**
   * Get the status for a specific cell
   */
  const getStatus = (rowId: string, field?: string): UpdateStatus | undefined => {
    const key = getUpdateKey(rowId, field)
    return updateStatuses.value.get(key)
  }

  /**
   * Check if a cell is currently being updated
   */
  const isLoading = (rowId: string, field?: string): boolean => {
    const status = getStatus(rowId, field)
    return status?.status === 'loading'
  }

  /**
   * Check if a cell was recently updated successfully
   */
  const isSuccess = (rowId: string, field?: string): boolean => {
    const status = getStatus(rowId, field)
    return status?.status === 'success'
  }

  /**
   * Check if a cell update failed
   */
  const isError = (rowId: string, field?: string): boolean => {
    const status = getStatus(rowId, field)
    return status?.status === 'error'
  }

  /**
   * Get all current update statuses
   */
  const allStatuses: ComputedRef<UpdateStatus[]> = computed(() => Array.from(updateStatuses.value.values()))

  /**
   * Get CSS class for a cell based on its update status
   */
  const getCellClass = (rowId: string, field: string): string => {
    const status = getStatus(rowId, field)
    if (!status) return ''

    return `cell-update-${status.status}`
  }

  return {
    // State
    allStatuses,

    // Setters
    setLoading,
    setSuccess,
    setError,

    // Getters
    getStatus,
    isLoading,
    isSuccess,
    isError,
    getCellClass,

    // Clear
    clearStatus,
    clearAllStatuses
  }
}
