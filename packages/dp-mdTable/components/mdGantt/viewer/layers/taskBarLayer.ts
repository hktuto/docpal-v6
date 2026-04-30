import Konva from 'konva'
import type { GanttViewport, GanttStageConfig, GanttTask, DateViewType } from '../types'

export interface RenderTaskBarOptions {
  layer: Konva.Layer
  viewport: GanttViewport
  stageConfig: GanttStageConfig
  tableWidth: number
  dateView: DateViewType
  dateRange: { start: Date; end: Date }
  tasks: GanttTask[]
  onTaskClick?: (task: GanttTask) => void
  onTaskDragStart?: (task: GanttTask, type: 'move' | 'resize-start' | 'resize-end', x: number) => void
}

function getColumnWidth(dateView: DateViewType, stageConfig: GanttStageConfig): number {
  return stageConfig.timelineColumnWidth[dateView]
}

function getMsPerColumn(dateView: DateViewType): number {
  const msPerDay = 24 * 60 * 60 * 1000
  switch (dateView) {
    case 'day': return msPerDay
    case 'week': return msPerDay * 7
    case 'quarter': return msPerDay * 90
    default: return msPerDay
  }
}

function dateToX(
  date: Date,
  rangeStart: Date,
  dateView: DateViewType,
  stageConfig: GanttStageConfig,
  tableWidth: number,
  scrollLeft: number
): number {
  const colWidth = getColumnWidth(dateView, stageConfig)
  const msPerCol = getMsPerColumn(dateView)
  const diff = date.getTime() - rangeStart.getTime()
  const colIndex = diff / msPerCol
  return tableWidth + stageConfig.splitterWidth + colIndex * colWidth - scrollLeft
}

export function renderTaskBarLayer(options: RenderTaskBarOptions) {
  const { layer, viewport, stageConfig, tableWidth, dateView, dateRange, tasks, onTaskClick, onTaskDragStart } = options

  layer.destroyChildren()

  const timelineX = tableWidth + stageConfig.splitterWidth
  const timelineWidth = viewport.containerWidth - timelineX

  const group = new Konva.Group({
    clip: {
      x: timelineX,
      y: stageConfig.headerHeight,
      width: timelineWidth,
      height: viewport.containerHeight - stageConfig.headerHeight
    }
  })

  const startY = stageConfig.headerHeight + viewport.offsetY
  const startRow = viewport.visibleStartIndex

  for (const task of tasks) {
    const rowIndex = startRow + tasks.indexOf(task)
    const y = startY + (rowIndex - startRow) * stageConfig.rowHeight + 8
    const barHeight = stageConfig.rowHeight - 16

    if (!task.start || !task.end) {
      // Unscheduled task indicator
      const indicator = new Konva.Rect({
        x: timelineX + 8,
        y,
        width: 12,
        height: barHeight,
        fill: 'var(--app-grey-600)',
        cornerRadius: 3
      })
      group.add(indicator)
      continue
    }

    const x = dateToX(task.start, dateRange.start, dateView, stageConfig, tableWidth, viewport.scrollLeft)
    const endX = dateToX(task.end, dateRange.start, dateView, stageConfig, tableWidth, viewport.scrollLeft)
    const width = Math.max(4, endX - x)

    // Skip if completely outside viewport
    if (x + width < timelineX || x > timelineX + timelineWidth) continue

    // Bar background
    const bar = new Konva.Rect({
      x,
      y,
      width,
      height: barHeight,
      fill: 'var(--app-primary)',
      cornerRadius: 4
    })
    group.add(bar)

    // Label
    if (width > 40 && task.label) {
      group.add(new Konva.Text({
        x: x + 6,
        y: y + (barHeight - 12) / 2,
        text: task.label,
        fontSize: 11,
        fill: '#fff',
        width: width - 12,
        ellipsis: true
      }))
    }

    // Resize handles (invisible but interactive)
    const handleWidth = 6

    const leftHandle = new Konva.Rect({
      x: x - handleWidth / 2,
      y: y - 2,
      width: handleWidth,
      height: barHeight + 4,
      opacity: 0
    })
    leftHandle.on('mouseenter', () => { document.body.style.cursor = 'ew-resize' })
    leftHandle.on('mouseleave', () => { document.body.style.cursor = 'default' })
    leftHandle.on('mousedown', (e) => {
      e.evt.stopPropagation()
      onTaskDragStart?.(task, 'resize-start', e.evt.clientX)
    })
    group.add(leftHandle)

    const rightHandle = new Konva.Rect({
      x: x + width - handleWidth / 2,
      y: y - 2,
      width: handleWidth,
      height: barHeight + 4,
      opacity: 0
    })
    rightHandle.on('mouseenter', () => { document.body.style.cursor = 'ew-resize' })
    rightHandle.on('mouseleave', () => { document.body.style.cursor = 'default' })
    rightHandle.on('mousedown', (e) => {
      e.evt.stopPropagation()
      onTaskDragStart?.(task, 'resize-end', e.evt.clientX)
    })
    group.add(rightHandle)

    // Bar body click / drag
    const bodyRect = new Konva.Rect({
      x: x + handleWidth,
      y,
      width: width - handleWidth * 2,
      height: barHeight,
      opacity: 0
    })
    bodyRect.on('click', () => onTaskClick?.(task))
    bodyRect.on('mouseenter', () => { document.body.style.cursor = 'grab' })
    bodyRect.on('mouseleave', () => { document.body.style.cursor = 'default' })
    bodyRect.on('mousedown', (e) => {
      e.evt.stopPropagation()
      onTaskDragStart?.(task, 'move', e.evt.clientX)
    })
    group.add(bodyRect)
  }

  layer.add(group)
  layer.batchDraw()
}
