import Konva from 'konva'
import type { GanttViewport, GanttStageConfig, DateViewType } from '../types'

export interface RenderTimelineOptions {
  layer: Konva.Layer
  viewport: GanttViewport
  stageConfig: GanttStageConfig
  tableWidth: number
  dateView: DateViewType
  dateRange: { start: Date; end: Date }
}

function getColumnWidth(dateView: DateViewType, stageConfig: GanttStageConfig): number {
  return stageConfig.timelineColumnWidth[dateView]
}

function getColumnCount(dateView: DateViewType, start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1

  switch (dateView) {
    case 'day':
      return days
    case 'week':
      return Math.ceil(days / 7)
    case 'quarter':
      return Math.ceil(days / 90)
    default:
      return days
  }
}

function getColumnLabel(dateView: DateViewType, index: number, rangeStart: Date): string {
  const d = new Date(rangeStart)

  switch (dateView) {
    case 'day': {
      d.setDate(d.getDate() + index)
      return `${d.getMonth() + 1}/${d.getDate()}`
    }
    case 'week': {
      d.setDate(d.getDate() + index * 7)
      return `W${index + 1}`
    }
    case 'quarter': {
      const month = d.getMonth() + index * 3
      const q = Math.floor(month / 3) + 1
      return `Q${q}`
    }
    default:
      return ''
  }
}

export function renderTimelineLayer(options: RenderTimelineOptions) {
  const { layer, viewport, stageConfig, tableWidth, dateView, dateRange } = options

  layer.destroyChildren()

  const timelineX = tableWidth + stageConfig.splitterWidth
  const timelineWidth = viewport.containerWidth - timelineX
  const colWidth = getColumnWidth(dateView, stageConfig)
  const colCount = getColumnCount(dateView, dateRange.start, dateRange.end)

  const group = new Konva.Group({
    clip: {
      x: timelineX,
      y: 0,
      width: timelineWidth,
      height: viewport.containerHeight
    }
  })

  // Header background
  group.add(new Konva.Rect({
    x: timelineX,
    y: 0,
    width: timelineWidth,
    height: stageConfig.headerHeight,
    fill: 'var(--app-color-bg)'
  }))

  // Header bottom border
  group.add(new Konva.Line({
    points: [timelineX, stageConfig.headerHeight, viewport.containerWidth, stageConfig.headerHeight],
    stroke: 'var(--app-grey-800)',
    strokeWidth: 1
  }))

  // Column headers & vertical grid lines
  const scrollOffset = viewport.scrollLeft
  const startCol = Math.floor(scrollOffset / colWidth)
  const endCol = Math.min(colCount - 1, Math.ceil((scrollOffset + timelineWidth) / colWidth))

  for (let i = startCol; i <= endCol; i++) {
    const x = timelineX + i * colWidth - scrollOffset
    const label = getColumnLabel(dateView, i, dateRange.start)

    // Vertical grid line
    group.add(new Konva.Line({
      points: [x, 0, x, viewport.containerHeight],
      stroke: 'var(--app-grey-800)',
      strokeWidth: 0.5
    }))

    // Header text
    group.add(new Konva.Text({
      x: x + 4,
      y: (stageConfig.headerHeight - 12) / 2,
      text: label,
      fontSize: 11,
      fill: 'var(--app-grey-300)',
      width: colWidth - 8,
      ellipsis: true
    }))
  }

  // Horizontal grid lines for visible rows
  const startY = stageConfig.headerHeight + viewport.offsetY
  const startRow = viewport.visibleStartIndex
  const endRow = viewport.visibleEndIndex

  for (let i = startRow; i <= endRow; i++) {
    const y = startY + (i - startRow) * stageConfig.rowHeight
    group.add(new Konva.Line({
      points: [timelineX, y + stageConfig.rowHeight, viewport.containerWidth, y + stageConfig.rowHeight],
      stroke: 'var(--app-grey-800)',
      strokeWidth: 0.5
    }))
  }

  layer.add(group)
  layer.batchDraw()
}
