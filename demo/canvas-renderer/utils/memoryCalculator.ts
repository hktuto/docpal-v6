// ui_v6\demo\canvas-renderer\utils\memoryCalculator.ts

/**
 * Memory Calculator Utility
 * Provides accurate memory usage calculations for table data and rendering
 */

export interface MemoryMetrics {
  /** Total data memory in MB */
  totalDataMemory: number
  /** Rendered data memory in MB */
  renderedDataMemory: number
  /** Konva rendering memory in MB */
  konvaMemory: number
  /** Total estimated memory usage in MB */
  totalMemory: number
  /** Memory savings percentage from virtual scrolling */
  memorySavingsPercentage: number
  /** Number of bytes per data cell */
  bytesPerDataCell: number
  /** Number of bytes per Konva object */
  bytesPerKonvaObject: number
}

export interface TableDataMetrics {
  /** Total number of rows */
  totalRows: number
  /** Total number of columns */
  totalColumns: number
  /** Number of rendered rows */
  renderedRows: number
  /** Number of rendered columns */
  renderedColumns: number
  /** Average text length per cell */
  averageTextLength?: number
  /** Additional data per cell (e.g., styles, metadata) in bytes */
  additionalDataPerCell?: number
}

/**
 * Calculate memory usage for table data and rendering
 */
export function calculateMemoryUsage(metrics: TableDataMetrics): MemoryMetrics {
  const {
    totalRows,
    totalColumns,
    renderedRows,
    renderedColumns,
    averageTextLength = 20,
    additionalDataPerCell = 0
  } = metrics

  // Calculate cell counts
  const totalCells = totalRows * totalColumns
  const renderedCells = renderedRows * renderedColumns

  // Data memory calculations
  // Each cell has:
  // - Row index: 4 bytes (number)
  // - Column index: 4 bytes (number)
  // - Text: 2 bytes per character (UTF-16)
  // - Additional data: configurable
  const bytesPerDataCell = 8 + (averageTextLength * 2) + additionalDataPerCell

  const totalDataBytes = totalCells * bytesPerDataCell
  const renderedDataBytes = renderedCells * bytesPerDataCell

  // Konva rendering memory
  // Each rendered cell requires:
  // - Rect object: ~200 bytes (geometry, styles, event handlers)
  // - Text object: ~250 bytes (text, font, positioning)
  const bytesPerKonvaObject = 450
  const konvaObjects = renderedCells * 2 // Rect + Text for each cell
  const konvaBytes = konvaObjects * bytesPerKonvaObject

  // Convert to MB (1 MB = 1024 * 1024 bytes)
  const mbDivisor = 1024 * 1024
  const totalDataMemory = totalDataBytes / mbDivisor
  const renderedDataMemory = renderedDataBytes / mbDivisor
  const konvaMemory = konvaBytes / mbDivisor
  const totalMemory = totalDataMemory + renderedDataMemory + konvaMemory

  // Calculate memory savings
  const memorySavingsPercentage = totalDataMemory > 0
    ? (1 - (renderedDataMemory + konvaMemory) / totalDataMemory) * 100
    : 0

  return {
    totalDataMemory,
    renderedDataMemory,
    konvaMemory,
    totalMemory,
    memorySavingsPercentage,
    bytesPerDataCell,
    bytesPerKonvaObject
  }
}

/**
 * Format memory values for display
 */
export function formatMemory(mb: number, decimals: number = 2): string {
  if (mb < 0.001) {
    return `${(mb * 1024).toFixed(decimals)} KB`
  } else if (mb < 1) {
    return `${(mb * 1024).toFixed(decimals)} KB`
  } else if (mb < 1024) {
    return `${mb.toFixed(decimals)} MB`
  } else {
    return `${(mb / 1024).toFixed(decimals)} GB`
  }
}

/**
 * Calculate memory for specific data types
 */
export function calculateStringMemory(text: string): number {
  // UTF-16 uses 2 bytes per character
  return text.length * 2
}

export function calculateNumberMemory(): number {
  // Numbers in JavaScript are 64-bit floating point = 8 bytes
  return 8
}

export function calculateBooleanMemory(): number {
  // Booleans are stored as 1 byte
  return 1
}

export function calculateObjectMemory(estimatedProperties: number): number {
  // Rough estimate: ~48 bytes base + 8 bytes per property
  return 48 + (estimatedProperties * 8)
}

/**
 * Estimate memory for a complete table dataset
 */
export function estimateTableDataMemory(
  rows: number,
  columns: number,
  dataType: 'string' | 'number' | 'mixed' = 'mixed',
  averageStringLength: number = 20
): number {
  let bytesPerCell: number

  switch (dataType) {
    case 'string':
      bytesPerCell = calculateStringMemory('x'.repeat(averageStringLength)) + 8 // +8 for indices
      break
    case 'number':
      bytesPerCell = calculateNumberMemory() + 8 // +8 for indices
      break
    case 'mixed':
    default:
      // Average of string and number
      bytesPerCell = (calculateStringMemory('x'.repeat(averageStringLength)) + calculateNumberMemory()) / 2 + 8
      break
  }

  const totalBytes = rows * columns * bytesPerCell
  return totalBytes / (1024 * 1024) // Convert to MB
}

/**
 * Performance metrics for virtual scrolling
 */
export interface PerformanceMetrics {
  /** Percentage of cells rendered vs total */
  renderPercentage: number
  /** Estimated frames per second */
  estimatedFPS: number
  /** Memory efficiency score (0-100) */
  memoryEfficiency: number
  /** Recommended batch size for optimal performance */
  recommendedBatchSize: number
}

/**
 * Calculate performance metrics for virtual scrolling
 */
export function calculatePerformanceMetrics(
  totalCells: number,
  renderedCells: number,
  scrollSpeed: number = 1
): PerformanceMetrics {
  const renderPercentage = (renderedCells / totalCells) * 100

  // Estimate FPS based on rendered cells and scroll speed
  // Base FPS decreases as rendered cells increase
  const baseFPS = Math.max(10, 60 - (renderedCells * 0.01))
  const estimatedFPS = Math.max(1, baseFPS - (scrollSpeed * 5))

  // Memory efficiency: higher is better
  const memoryEfficiency = Math.min(100, (1 - (renderedCells / totalCells)) * 100)

  // Recommended batch size for smooth scrolling
  const recommendedBatchSize = Math.max(10, Math.min(100, Math.floor(1000 / renderedCells)))

  return {
    renderPercentage,
    estimatedFPS,
    memoryEfficiency,
    recommendedBatchSize
  }
}

/**
 * Generate memory usage report
 */
export function generateMemoryReport(metrics: MemoryMetrics): string {
  const {
    totalDataMemory,
    renderedDataMemory,
    konvaMemory,
    totalMemory,
    memorySavingsPercentage,
    bytesPerDataCell,
    bytesPerKonvaObject
  } = metrics

  return `
Memory Usage Report:
====================
Data Storage:
  Total Data: ${formatMemory(totalDataMemory)} (${(totalDataMemory * 1024 * 1024).toLocaleString()} bytes)
  Rendered Data: ${formatMemory(renderedDataMemory)} (${(renderedDataMemory * 1024 * 1024).toLocaleString()} bytes)
  Bytes per data cell: ${bytesPerDataCell.toFixed(0)} bytes

Rendering (Konva):
  Konva Objects: ${formatMemory(konvaMemory)}
  Bytes per Konva object: ${bytesPerKonvaObject.toFixed(0)} bytes

Summary:
  Total Estimated Memory: ${formatMemory(totalMemory)}
  Memory Savings: ${memorySavingsPercentage.toFixed(1)}%
  Efficiency: ${(100 - memorySavingsPercentage).toFixed(1)}% of full rendering

Performance Notes:
  • Virtual scrolling reduces memory usage by ${memorySavingsPercentage.toFixed(1)}%
  • Each MB saved ≈ ${Math.floor(250000 / bytesPerDataCell).toLocaleString()} additional rows
  • Optimal for datasets > ${Math.ceil(50 / totalDataMemory * 1000).toLocaleString()}K rows
`.trim()
}
