// ui_v6\demo\canvas-renderer\utils\layers\tableLayer.ts

import Konva from 'konva'

export interface TableLayerConfig {
  x: number
  y: number
  width: number
  height: number
  color?: string
  rows: number
  cols: number
  rowHeight?: number
  colWidth?: number
  showHeader?: boolean
  showScrollbars?: boolean
  scrollbarSize?: number
  data?: string[][]
}

export interface TableLayerState {
  scrollTop: number
  scrollLeft: number
  visibleStartRow: number
  visibleEndRow: number
  visibleStartCol: number
  visibleEndCol: number
  totalRows: number
  totalCols: number
  isScrolling: boolean
}

export interface TableLayerNodes {
  container: Konva.Group
  background: Konva.Rect
  headerGroup?: Konva.Group
  contentGroup: Konva.Group
  verticalScrollbar?: Konva.Group
  horizontalScrollbar?: Konva.Group
  clipRect: Konva.Rect
  allNodes: Konva.Node[]
}

/**
 * Create a table layer with virtual scrolling capabilities
 */
export function createTableLayer(config: TableLayerConfig): TableLayerNodes {
  const {
    x,
    y,
    width,
    height,
    color = '#ffffff',
    rows,
    cols,
    rowHeight = 30,
    colWidth = 100,
    showHeader = true,
    showScrollbars = true,
    scrollbarSize = 12,
    data = generateSampleData(rows, cols)
  } = config

  // Create container group
  const container = new Konva.Group({
    x,
    y,
    draggable: true,
    clipX: 0,
    clipY: 0,
    clipWidth: width,
    clipHeight: height
  })

  // Create clipping rectangle for scrollable area
  const clipRect = new Konva.Rect({
    x: 0,
    y: showHeader ? rowHeight : 0,
    width,
    height: showHeader ? height - rowHeight : height,
    fill: 'transparent',
    visible: false // Just for reference, not actually drawn
  })

  // Create background
  const background = new Konva.Rect({
    width,
    height,
    fill: color,
    stroke: '#ddd',
    strokeWidth: 1,
    cornerRadius: 4
  })

  // Create content group (scrollable area)
  const contentGroup = new Konva.Group({
    x: 0,
    y: showHeader ? rowHeight : 0
  })

  // Calculate total dimensions
  const totalHeight = rows * rowHeight
  const totalWidth = cols * colWidth
  const contentHeight = showHeader ? height - rowHeight : height

  // Create header if enabled
  let headerGroup: Konva.Group | undefined
  if (showHeader) {
    headerGroup = createHeader(cols, colWidth, rowHeight)
    container.add(headerGroup)
  }

  // Create visible rows and columns (virtual scrolling)
  const visibleRows = Math.min(rows, Math.ceil(contentHeight / rowHeight) + 2)
  const visibleCols = Math.min(cols, Math.ceil(width / colWidth) + 2)

  // Create grid cells - create ALL cells for now (we'll implement virtual scrolling later)
  createGridCells(contentGroup, data, rows, cols, rowHeight, colWidth)

  // Create scrollbars if enabled and needed
  let verticalScrollbar: Konva.Group | undefined
  let horizontalScrollbar: Konva.Group | undefined

  if (showScrollbars) {
    if (totalHeight > contentHeight) {
      verticalScrollbar = createVerticalScrollbar(width, height, contentHeight, totalHeight, scrollbarSize, showHeader ? rowHeight : 0)
      if (verticalScrollbar) {
        container.add(verticalScrollbar)
      }
    }

    if (totalWidth > width) {
      horizontalScrollbar = createHorizontalScrollbar(width, height, width, totalWidth, scrollbarSize, showHeader ? rowHeight : 0)
      if (horizontalScrollbar) {
        container.add(horizontalScrollbar)
      }
    }
  }

  // Add all elements to container
  container.add(background)
  container.add(contentGroup)
  // Don't add clipRect to container - it's just for reference

  // Collect all nodes
  const allNodes: Konva.Node[] = [container, background, contentGroup]
  if (headerGroup) allNodes.push(headerGroup)
  if (verticalScrollbar) allNodes.push(verticalScrollbar)
  if (horizontalScrollbar) allNodes.push(horizontalScrollbar)

  return {
    container,
    background,
    headerGroup,
    contentGroup,
    verticalScrollbar,
    horizontalScrollbar,
    clipRect,
    allNodes
  }
}

/**
 * Create table header
 */
function createHeader(cols: number, colWidth: number, rowHeight: number): Konva.Group {
  const headerGroup = new Konva.Group({
    y: 0
  })

  // Header background
  const headerBg = new Konva.Rect({
    x: 0,
    y: 0,
    width: cols * colWidth,
    height: rowHeight,
    fill: '#f5f5f5',
    stroke: '#ccc',
    strokeWidth: 1
  })

  headerGroup.add(headerBg)

  // Column headers
  for (let col = 0; col < cols; col++) {
    const headerCell = new Konva.Rect({
      x: col * colWidth,
      y: 0,
      width: colWidth,
      height: rowHeight,
      fill: col % 2 === 0 ? '#e8e8e8' : '#f0f0f0',
      stroke: '#ddd',
      strokeWidth: 0.5
    })

    const headerText = new Konva.Text({
      x: col * colWidth + 5,
      y: rowHeight / 2 - 8,
      text: `Col ${col + 1}`,
      fontSize: 11,
      fontFamily: 'Arial',
      fill: '#333',
      width: colWidth - 10
    })

    headerGroup.add(headerCell)
    headerGroup.add(headerText)
  }

  return headerGroup
}

/**
 * Create grid cells with virtual scrolling
 */
function createGridCells(contentGroup: Konva.Group, data: string[][], rows: number, cols: number, rowHeight: number, colWidth: number): void {
  // Create all cells for now (we'll implement virtual scrolling later)
  for (let row = 0; row < rows; row++) {
    // Row background (full width of the row)
    const rowBg = new Konva.Rect({
      x: 0,
      y: row * rowHeight,
      width: cols * colWidth,
      height: rowHeight,
      fill: row % 2 === 0 ? '#ffffff' : '#f9f9f9',
      stroke: '#eee',
      strokeWidth: 0.5
    })
    contentGroup.add(rowBg)

    // Cells in this row
    for (let col = 0; col < cols; col++) {
      // Cell border
      const cell = new Konva.Rect({
        x: col * colWidth,
        y: row * rowHeight,
        width: colWidth,
        height: rowHeight,
        stroke: '#e0e0e0',
        strokeWidth: 0.5
      })

      // Cell text
      const cellText = new Konva.Text({
        x: col * colWidth + 5,
        y: row * rowHeight + rowHeight / 2 - 8,
        text: data[row]?.[col] || `R${row + 1}C${col + 1}`,
        fontSize: 11,
        fontFamily: 'Arial',
        fill: '#444',
        width: colWidth - 10,
        ellipsis: true
      })

      contentGroup.add(cell)
      contentGroup.add(cellText)
    }
  }
}

/**
 * Create vertical scrollbar
 */
function createVerticalScrollbar(
  width: number,
  height: number,
  visibleHeight: number,
  totalHeight: number,
  scrollbarSize: number,
  headerHeight: number
): Konva.Group | undefined {
  if (totalHeight <= visibleHeight) return undefined

  const scrollbarGroup = new Konva.Group({
    x: width - scrollbarSize,
    y: headerHeight
  })

  // Scrollbar track
  const track = new Konva.Rect({
    width: scrollbarSize,
    height: visibleHeight,
    fill: '#f0f0f0',
    stroke: '#ddd',
    strokeWidth: 1
  })

  // Scrollbar thumb
  const thumbHeight = Math.max(20, (visibleHeight / totalHeight) * visibleHeight)
  const thumb = new Konva.Rect({
    width: scrollbarSize,
    height: thumbHeight,
    fill: '#c1c1c1',
    cornerRadius: 4,
    draggable: true,
    dragBoundFunc: (pos) => ({
      x: width - scrollbarSize,
      y: Math.max(headerHeight, Math.min(pos.y, headerHeight + visibleHeight - thumbHeight))
    })
  })

  scrollbarGroup.add(track)
  scrollbarGroup.add(thumb)

  return scrollbarGroup
}

/**
 * Create horizontal scrollbar
 */
function createHorizontalScrollbar(
  width: number,
  height: number,
  visibleWidth: number,
  totalWidth: number,
  scrollbarSize: number,
  headerHeight: number
): Konva.Group | undefined {
  if (totalWidth <= visibleWidth) return undefined

  const scrollbarGroup = new Konva.Group({
    x: 0,
    y: height - scrollbarSize
  })

  // Scrollbar track
  const track = new Konva.Rect({
    width: visibleWidth,
    height: scrollbarSize,
    fill: '#f0f0f0',
    stroke: '#ddd',
    strokeWidth: 1
  })

  // Scrollbar thumb
  const thumbWidth = Math.max(20, (visibleWidth / totalWidth) * visibleWidth)
  const thumb = new Konva.Rect({
    width: thumbWidth,
    height: scrollbarSize,
    fill: '#c1c1c1',
    cornerRadius: 4,
    draggable: true,
    dragBoundFunc: (pos) => ({
      x: Math.max(0, Math.min(pos.x, visibleWidth - thumbWidth)),
      y: height - scrollbarSize
    })
  })

  scrollbarGroup.add(track)
  scrollbarGroup.add(thumb)

  return scrollbarGroup
}

/**
 * Generate sample data for the table
 */
function generateSampleData(rows: number, cols: number): string[][] {
  const data: string[][] = []

  for (let row = 0; row < rows; row++) {
    data[row] = []
    for (let col = 0; col < cols; col++) {
      data[row][col] = `R${row + 1}C${col + 1}`
    }
  }

  return data
}

/**
 * Update table layer with new scroll position
 */
export function updateTableScroll(nodes: TableLayerNodes, scrollTop: number, scrollLeft: number, config: TableLayerConfig): void {
  const { contentGroup, headerGroup } = nodes
  const { rowHeight = 30, colWidth = 100, showHeader = true } = config

  // Update content group position for scrolling
  contentGroup.y(-scrollTop)
  contentGroup.x(-scrollLeft)

  // Update header position for horizontal scrolling
  if (headerGroup) {
    headerGroup.x(-scrollLeft)
  }

  // TODO: Implement virtual scrolling - update visible cells based on scroll position
  // This would involve:
  // 1. Calculating which rows/columns are visible
  // 2. Creating/destroying cells as needed
  // 3. Updating cell positions and content
}

/**
 * Get table layer state
 */
export function getTableLayerState(nodes: TableLayerNodes, config: TableLayerConfig): TableLayerState {
  const { contentGroup } = nodes
  const { rows, cols, rowHeight = 30, colWidth = 100, width, height, showHeader = true } = config

  const contentHeight = showHeader ? height - rowHeight : height
  const scrollTop = Math.max(0, -contentGroup.y())
  const scrollLeft = Math.max(0, -contentGroup.x())

  const visibleStartRow = Math.floor(scrollTop / rowHeight)
  const visibleEndRow = Math.min(rows - 1, visibleStartRow + Math.ceil(contentHeight / rowHeight))
  const visibleStartCol = Math.floor(scrollLeft / colWidth)
  const visibleEndCol = Math.min(cols - 1, visibleStartCol + Math.ceil(width / colWidth))

  return {
    scrollTop,
    scrollLeft,
    visibleStartRow,
    visibleEndRow,
    visibleStartCol,
    visibleEndCol,
    totalRows: rows,
    totalCols: cols,
    isScrolling: false
  }
}
