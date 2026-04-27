import Konva from 'konva'
import type { GanttViewport, GanttStageConfig, GanttColumn, GanttRow } from '../types'

export interface RenderTaskTableOptions {
  layer: Konva.Layer
  viewport: GanttViewport
  stageConfig: GanttStageConfig
  tableWidth: number
  columns: GanttColumn[]
  rows: GanttRow[]
  selectedRowId?: string | null
  onRowClick?: (row: GanttRow) => void
}

export function renderTaskTableLayer(options: RenderTaskTableOptions) {
  const { layer, viewport, stageConfig, tableWidth, columns, rows, selectedRowId, onRowClick } = options

  layer.destroyChildren()

  const group = new Konva.Group({
    clip: {
      x: 0,
      y: 0,
      width: tableWidth,
      height: viewport.containerHeight
    }
  })

  // Background
  group.add(new Konva.Rect({
    x: 0,
    y: 0,
    width: tableWidth,
    height: viewport.containerHeight,
    fill: 'var(--app-paper)'
  }))

  // Header background
  group.add(new Konva.Rect({
    x: 0,
    y: 0,
    width: tableWidth,
    height: stageConfig.headerHeight,
    fill: 'var(--app-color-bg)'
  }))

  // Header bottom border
  group.add(new Konva.Line({
    points: [0, stageConfig.headerHeight, tableWidth, stageConfig.headerHeight],
    stroke: 'var(--app-grey-800)',
    strokeWidth: 1
  }))

  // Column headers
  let x = 0
  for (const col of columns) {
    group.add(new Konva.Text({
      x: x + 8,
      y: (stageConfig.headerHeight - 14) / 2,
      text: col.title,
      fontSize: 12,
      fontStyle: 'bold',
      fill: 'var(--app-grey-300)',
      ellipsis: true,
      width: col.width - 16
    }))

    // Column divider
    group.add(new Konva.Line({
      points: [x + col.width, 0, x + col.width, stageConfig.headerHeight],
      stroke: 'var(--app-grey-800)',
      strokeWidth: 1
    }))

    x += col.width
  }

  // Rows
  const startY = stageConfig.headerHeight + viewport.offsetY
  const startRow = viewport.visibleStartIndex
  const endRow = viewport.visibleEndIndex

  for (let i = startRow; i <= endRow; i++) {
    const row = rows[i]
    if (!row) continue

    const y = startY + (i - startRow) * stageConfig.rowHeight
    const isSelected = row.id === selectedRowId

    // Row background
    group.add(new Konva.Rect({
      x: 0,
      y: y,
      width: tableWidth,
      height: stageConfig.rowHeight,
      fill: isSelected ? 'var(--app-primary-light)' : (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)')
    }))

    // Row bottom border
    group.add(new Konva.Line({
      points: [0, y + stageConfig.rowHeight, tableWidth, y + stageConfig.rowHeight],
      stroke: 'var(--app-grey-800)',
      strokeWidth: 0.5
    }))

    // Cell text
    let cx = 0
    for (const col of columns) {
      const value = row[col.field]
      const text = value !== null && value !== undefined ? String(value) : ''

      group.add(new Konva.Text({
        x: cx + 8,
        y: y + (stageConfig.rowHeight - 14) / 2,
        text,
        fontSize: 12,
        fill: 'var(--app-grey-300)',
        ellipsis: true,
        width: col.width - 16
      }))

      cx += col.width
    }

    // Row click area
    const clickRect = new Konva.Rect({
      x: 0,
      y: y,
      width: tableWidth,
      height: stageConfig.rowHeight,
      opacity: 0
    })
    clickRect.on('click', () => onRowClick?.(row))
    clickRect.on('mouseenter', () => {
      document.body.style.cursor = 'pointer'
    })
    clickRect.on('mouseleave', () => {
      document.body.style.cursor = 'default'
    })
    group.add(clickRect)
  }

  layer.add(group)
  layer.batchDraw()
}
