import { ref, computed, watch, nextTick, type Ref } from 'vue'
import { useGanttStage } from './composables/useGanttStage'
import { useGanttViewport } from './composables/useGanttViewport'
import { useGanttConfig } from './composables/useGanttConfig'
import { useGanttDrag } from './composables/useGanttDrag'
import { renderTaskTableLayer } from './layers/taskTableLayer'
import { renderTimelineLayer } from './layers/timelineLayer'
import { renderTaskBarLayer } from './layers/taskBarLayer'
import { DEFAULT_STAGE_CONFIG, type GanttRow, type GanttTask, type DateViewType } from './types'

export interface GanttViewerOptions {
  container: Ref<HTMLDivElement | undefined>
  rows: Ref<GanttRow[]>
  columns: Ref<any[]>
  viewStyleConfig: Ref<any>
  onTaskClick?: (task: GanttTask) => void
  onRowClick?: (row: GanttRow) => void
}

export function createGanttViewer(options: GanttViewerOptions) {
  const { container, rows, columns, viewStyleConfig, onTaskClick, onRowClick } = options
  const stageConfig = DEFAULT_STAGE_CONFIG

  // Config
  const { config, visibleColumns, hasDateFields, startField, endField, barLabelField, dateView } = useGanttConfig({
    columns,
    viewStyleConfig
  })

  // Viewport
  const totalRows = computed(() => rows.value.length)
  const viewportCtrl = useGanttViewport({ totalRows, stageConfig, overscan: 3 })

  // Stage
  const stageCtrl = useGanttStage({
    container,
    stageConfig,
    viewport: viewportCtrl.viewport,
    tableWidth: viewportCtrl.tableWidth
  })

  // Drag
  const dragCtrl = useGanttDrag()

  // Date range
  const dateRange = computed(() => {
    const now = new Date()
    if (!hasDateFields.value || rows.value.length === 0) {
      return { start: now, end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
    }

    const tasks = computedTasks.value
    const dated = tasks.filter(t => t.start && t.end)
    if (dated.length === 0) {
      return { start: now, end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
    }

    const starts = dated.map(t => t.start!.getTime())
    const ends = dated.map(t => t.end!.getTime())
    return {
      start: new Date(Math.min(...starts)),
      end: new Date(Math.max(...ends))
    }
  })

  // Tasks
  const computedTasks = computed<GanttTask[]>(() => {
    const sField = startField.value
    const eField = endField.value
    const lField = barLabelField.value

    return rows.value.map(row => {
      const start = sField && row[sField] ? new Date(row[sField]) : null
      const end = eField && row[eField] ? new Date(row[eField]) : null
      const label = lField && row[lField] ? String(row[lField]) : row.id

      return {
        id: row.id,
        rowId: row.id,
        label,
        start,
        end,
        raw: row
      }
    })
  })

  // Rendering
  function render() {
    if (!stageCtrl.isReady.value) return

    const vp = viewportCtrl.viewport.value
    const layers = stageCtrl.getLayers()
    if (!layers.taskTableLayer || !layers.timelineLayer || !layers.taskBarLayer) return

    renderTaskTableLayer({
      layer: layers.taskTableLayer,
      viewport: vp,
      stageConfig,
      tableWidth: viewportCtrl.tableWidth.value,
      columns: visibleColumns.value,
      rows: rows.value,
      onRowClick
    })

    renderTimelineLayer({
      layer: layers.timelineLayer,
      viewport: vp,
      stageConfig,
      tableWidth: viewportCtrl.tableWidth.value,
      dateView: dateView.value,
      dateRange: dateRange.value
    })

    renderTaskBarLayer({
      layer: layers.taskBarLayer,
      viewport: vp,
      stageConfig,
      tableWidth: viewportCtrl.tableWidth.value,
      dateView: dateView.value,
      dateRange: dateRange.value,
      tasks: computedTasks.value,
      onTaskClick,
      onTaskDragStart: (task, type, x) => {
        dragCtrl.startDrag(task.id, type, x, task.start, task.end)
      }
    })
  }

  // Watchers
  let unwatchRender: (() => void) | null = null

  function startRenderLoop() {
    unwatchRender = watch(
      [viewportCtrl.viewport, computedTasks, visibleColumns, dateView],
      () => {
        nextTick(render)
      },
      { deep: true }
    )
  }

  function stopRenderLoop() {
    unwatchRender?.()
    unwatchRender = null
  }

  // Scroll handlers
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const deltaY = e.deltaY
    const deltaX = e.shiftKey ? e.deltaY : e.deltaX
    viewportCtrl.scrollBy(deltaY, deltaX)
  }

  // Init / Destroy
  function init() {
    stageCtrl.init()
    if (stageCtrl.isReady.value) {
      startRenderLoop()
      render()
    }
  }

  function destroy() {
    stopRenderLoop()
    stageCtrl.destroy()
  }

  function resize(width: number, height: number) {
    viewportCtrl.setContainerSize(width, height)
    stageCtrl.resize()
    render()
  }

  return {
    isReady: stageCtrl.isReady,
    viewport: viewportCtrl.viewport,
    tableWidth: viewportCtrl.tableWidth,
    config,
    visibleColumns,
    dateView,
    computedTasks,
    dateRange,
    dragState: dragCtrl.state,
    init,
    destroy,
    resize,
    render,
    handleWheel,
    scrollToY: viewportCtrl.scrollToY,
    scrollToX: viewportCtrl.scrollToX,
    setTableWidth: viewportCtrl.setTableWidth
  }
}

export type GanttViewer = ReturnType<typeof createGanttViewer>
