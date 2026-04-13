// ui_v6\demo\canvas-renderer\composables\useLazyData.ts

import { ref, computed, reactive, watch } from 'vue'

export interface LazyDataOptions {
  /** Total number of rows */
  totalRows: number
  /** Total number of columns */
  totalCols: number
  /** Number of rows per page/chunk */
  pageSize?: number
  /** Number of columns per page/chunk */
  colPageSize?: number
  /** Simulated API delay in milliseconds */
  apiDelay?: number
  /** Whether to enable caching */
  enableCache?: boolean
  /** Maximum cache size in MB */
  maxCacheSize?: number
}

export interface DataChunk {
  /** Starting row index of this chunk */
  startRow: number
  /** Ending row index of this chunk */
  endRow: number
  /** Starting column index of this chunk */
  startCol: number
  /** Ending column index of this chunk */
  endCol: number
  /** The actual data in this chunk */
  data: Map<string, string>
  /** When this chunk was loaded */
  loadedAt: Date
  /** Size of this chunk in bytes */
  size: number
}

export interface LazyDataState {
  /** Currently loaded chunks */
  loadedChunks: DataChunk[]
  /** Chunks currently being loaded */
  loadingChunks: Array<{ startRow: number; endRow: number; startCol: number; endCol: number }>
  /** Total memory used by cache */
  cacheMemory: number
  /** Number of cache hits */
  cacheHits: number
  /** Number of cache misses */
  cacheMisses: number
  /** Cache hit rate */
  cacheHitRate: number
  /** Whether data is currently being loaded */
  isLoading: boolean
}

/**
 * Composable for lazy loading table data with chunk-based loading and caching
 */
export function useLazyData(options: LazyDataOptions) {
  const {
    totalRows,
    totalCols,
    pageSize = 100,
    colPageSize = 10,
    apiDelay = 50,
    enableCache = true,
    maxCacheSize = 50 // 50MB
  } = options

  // State
  const state = reactive<LazyDataState>({
    loadedChunks: [],
    loadingChunks: [],
    cacheMemory: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    isLoading: false
  })

  // Cache for quick lookups
  const chunkCache = new Map<string, DataChunk>()

  // Calculate chunk key
  function getChunkKey(startRow: number, endRow: number, startCol: number, endCol: number): string {
    return `${startRow}-${endRow}-${startCol}-${endCol}`
  }

  // Generate cell data (simulates real data generation)
  function generateCellData(row: number, col: number): string {
    // Simulate different types of data
    const dataTypes = [
      () => `R${row + 1}C${col + 1}`, // Simple cell reference
      () => `Data-${row}-${col}`, // Data identifier
      () => `Value${Math.floor(Math.random() * 1000)}`, // Random value
      () => `Text ${row * col} chars`, // Text description
      () => `${row % 1000}.${col % 100}` // Decimal number
    ]

    const typeIndex = (row * 7 + col * 13) % dataTypes.length
    return dataTypes[typeIndex]()
  }

  // Calculate chunk size in bytes
  function calculateChunkSize(startRow: number, endRow: number, startCol: number, endCol: number): number {
    const rows = endRow - startRow + 1
    const cols = endCol - startCol + 1
    const cells = rows * cols

    // Estimate: each cell has ~50 bytes (string + overhead)
    return cells * 50
  }

  // Load a chunk of data (simulates API call)
  async function loadChunk(startRow: number, endRow: number, startCol: number, endCol: number): Promise<DataChunk> {
    const chunkKey = getChunkKey(startRow, endRow, startCol, endCol)

    // Check cache first
    if (enableCache) {
      const cachedChunk = chunkCache.get(chunkKey)
      if (cachedChunk) {
        state.cacheHits++
        updateCacheHitRate()
        return cachedChunk
      }
    }

    state.cacheMisses++
    updateCacheHitRate()

    // Add to loading chunks
    state.loadingChunks.push({ startRow, endRow, startCol, endCol })
    state.isLoading = true

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, FR))

    // Generate data for the chunk
    const data = new Map<string, string>()

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const cellKey = `${row}-${col}`
        data.set(cellKey, generateCellData(row, col))
      }
    }

    // Create chunk
    const chunk: DataChunk = {
      startRow,
      endRow,
      startCol,
      endCol,
      data,
      loadedAt: new Date(),
      size: calculateChunkSize(startRow, endRow, startCol, endCol)
    }

    // Cache the chunk
    if (enableCache) {
      chunkCache.set(chunkKey, chunk)
      state.cacheMemory += chunk.size
      state.loadedChunks.push(chunk)

      // Clean up cache if it's too large
      cleanupCache()
    }

    // Remove from loading chunks
    const loadingIndex = state.loadingChunks.findIndex((c) => c.startRow === startRow && c.endRow === endRow && c.startCol === startCol && c.endCol === endCol)
    if (loadingIndex !== -1) {
      state.loadingChunks.splice(loadingIndex, 1)
    }

    // Update loading state
    if (state.loadingChunks.length === 0) {
      state.isLoading = false
    }

    return chunk
  }

  // Get cell data with lazy loading
  async function getCellData(row: number, col: number): Promise<string> {
    // Calculate which chunk this cell belongs to
    const chunkRow = Math.floor(row / pageSize) * pageSize
    const chunkEndRow = Math.min(chunkRow + pageSize - 1, totalRows - 1)

    const chunkCol = Math.floor(col / colPageSize) * colPageSize
    const chunkEndCol = Math.min(chunkCol + colPageSize - 1, totalCols - 1)

    const chunkKey = getChunkKey(chunkRow, chunkEndRow, chunkCol, chunkEndCol)

    // Check if chunk is already loaded or loading
    let chunk = chunkCache.get(chunkKey)
    const isAlreadyLoading = state.loadingChunks.some(
      (c) => c.startRow === chunkRow && c.endRow === chunkEndRow && c.startCol === chunkCol && c.endCol === chunkEndCol
    )

    // Load chunk if not already loaded or loading
    if (!chunk && !isAlreadyLoading) {
      chunk = await loadChunk(chunkRow, chunkEndRow, chunkCol, chunkEndCol)
    }

    // Return cell data if available
    if (chunk) {
      const cellKey = `${row}-${col}`
      return chunk.data.get(cellKey) || generateCellData(row, col)
    }

    // If chunk is still loading, generate temporary data
    return generateCellData(row, col)
  }

  // Preload chunks around a viewport
  async function preloadViewport(startRow: number, endRow: number, startCol: number, endCol: number, buffer: number = 2): Promise<void> {
    const loadPromises: Promise<DataChunk>[] = []

    // Calculate chunk ranges to preload
    const rowChunkStart = Math.floor(Math.max(0, startRow - buffer * pageSize) / pageSize) * pageSize
    const rowChunkEnd = Math.floor(Math.min(totalRows - 1, endRow + buffer * pageSize) / pageSize) * pageSize

    const colChunkStart = Math.floor(Math.max(0, startCol - buffer * colPageSize) / colPageSize) * colPageSize
    const colChunkEnd = Math.floor(Math.min(totalCols - 1, endCol + buffer * colPageSize) / colPageSize) * colPageSize

    // Load all chunks in the preload area
    for (let row = rowChunkStart; row <= rowChunkEnd; row += pageSize) {
      for (let col = colChunkStart; col <= colChunkEnd; col += colPageSize) {
        const chunkRow = row
        const chunkEndRow = Math.min(row + pageSize - 1, totalRows - 1)
        const chunkCol = col
        const chunkEndCol = Math.min(col + colPageSize - 1, totalCols - 1)

        const chunkKey = getChunkKey(chunkRow, chunkEndRow, chunkCol, chunkEndCol)

        // Only load if not already cached or loading
        if (
          !chunkCache.has(chunkKey) &&
          !state.loadingChunks.some((c) => c.startRow === chunkRow && c.endRow === chunkEndRow && c.startCol === chunkCol && c.endCol === chunkEndCol)
        ) {
          loadPromises.push(loadChunk(chunkRow, chunkEndRow, chunkCol, chunkEndCol))
        }
      }
    }

    // Wait for all loads to complete
    if (loadPromises.length > 0) {
      await Promise.all(loadPromises)
    }
  }

  // Get multiple cells at once (batch operation)
  async function getCellDataBatch(cells: Array<{ row: number; col: number }>): Promise<Map<string, string>> {
    const result = new Map<string, string>()
    const promises = cells.map(async ({ row, col }) => {
      const data = await getCellData(row, col)
      result.set(`${row}-${col}`, data)
    })

    await Promise.all(promises)
    return result
  }

  // Clean up cache to stay within memory limits
  function cleanupCache() {
    if (!enableCache) return

    const maxBytes = maxCacheSize * 1024 * 1024 // Convert MB to bytes

    // Sort chunks by least recently used
    state.loadedChunks.sort((a, b) => a.loadedAt.getTime() - b.loadedAt.getTime())

    // Remove oldest chunks until we're under the limit
    while (state.cacheMemory > maxBytes && state.loadedChunks.length > 0) {
      const oldestChunk = state.loadedChunks.shift()!
      const chunkKey = getChunkKey(oldestChunk.startRow, oldestChunk.endRow, oldestChunk.startCol, oldestChunk.endCol)

      chunkCache.delete(chunkKey)
      state.cacheMemory -= oldestChunk.size
    }
  }

  // Update cache hit rate
  function updateCacheHitRate() {
    const total = state.cacheHits + state.cacheMisses
    state.cacheHitRate = total > 0 ? state.cacheHits / total : 0
  }

  // Clear all cached data
  function clearCache() {
    chunkCache.clear()
    state.loadedChunks = []
    state.cacheMemory = 0
    state.cacheHits = 0
    state.cacheMisses = 0
    state.cacheHitRate = 0
  }

  // Get statistics
  function getStats() {
    return {
      totalChunks: state.loadedChunks.length,
      loadingChunks: state.loadingChunks.length,
      cacheMemory: formatBytes(state.cacheMemory),
      cacheHits: state.cacheHits,
      cacheMisses: state.cacheMisses,
      cacheHitRate: `${(state.cacheHitRate * 100).toFixed(1)}%`,
      isLoading: state.isLoading
    }
  }

  // Helper to format bytes
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Watch for changes in total rows/cols to clear cache
  watch(
    () => totalRows,
    () => {
      if (enableCache) {
        clearCache()
      }
    }
  )

  watch(
    () => totalCols,
    () => {
      if (enableCache) {
        clearCache()
      }
    }
  )

  return {
    // State
    state,

    // Actions
    getCellData,
    getCellDataBatch,
    preloadViewport,
    loadChunk,
    clearCache,

    // Utilities
    getStats,
    formatBytes
  }
}

/**
 * Helper to create a lazy data manager with default options
 */
export function createLazyDataManager(totalRows: number, totalCols: number, options?: Partial<LazyDataOptions>) {
  return useLazyData({
    totalRows,
    totalCols,
    pageSize: 100,
    colPageSize: 10,
    apiDelay: 50,
    enableCache: true,
    maxCacheSize: 50,
    ...options
  })
}
