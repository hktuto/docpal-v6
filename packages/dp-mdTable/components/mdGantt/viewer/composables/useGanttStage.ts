import { ref, type Ref } from 'vue'
import Konva from 'konva'
import type { GanttStageConfig, GanttViewport } from '../types'

export interface UseGanttStageOptions {
  container: Ref<HTMLDivElement | undefined>
  stageConfig: GanttStageConfig
  viewport: Ref<GanttViewport>
  tableWidth: Ref<number>
}

export function useGanttStage(options: UseGanttStageOptions) {
  const { container, stageConfig, viewport, tableWidth } = options

  let stage: Konva.Stage | null = null
  let taskTableLayer: Konva.Layer | null = null
  let timelineLayer: Konva.Layer | null = null
  let taskBarLayer: Konva.Layer | null = null

  const isReady = ref(false)

  function init() {
    if (!container.value) return

    stage = new Konva.Stage({
      container: container.value,
      width: viewport.value.containerWidth,
      height: viewport.value.containerHeight
    })

    taskTableLayer = new Konva.Layer()
    timelineLayer = new Konva.Layer()
    taskBarLayer = new Konva.Layer()

    stage.add(taskTableLayer)
    stage.add(timelineLayer)
    stage.add(taskBarLayer)

    isReady.value = true
  }

  function destroy() {
    stage?.destroy()
    stage = null
    taskTableLayer = null
    timelineLayer = null
    taskBarLayer = null
    isReady.value = false
  }

  function resize() {
    if (!stage || !container.value) return
    stage.width(viewport.value.containerWidth)
    stage.height(viewport.value.containerHeight)
  }

  function getStage() {
    return stage
  }

  function getLayers() {
    return {
      taskTableLayer,
      timelineLayer,
      taskBarLayer
    }
  }

  function getTableClipRect() {
    return {
      x: 0,
      y: 0,
      width: tableWidth.value,
      height: viewport.value.containerHeight
    }
  }

  function getTimelineClipRect() {
    return {
      x: tableWidth.value + stageConfig.splitterWidth,
      y: 0,
      width: viewport.value.containerWidth - tableWidth.value - stageConfig.splitterWidth,
      height: viewport.value.containerHeight
    }
  }

  return {
    isReady,
    init,
    destroy,
    resize,
    getStage,
    getLayers,
    getTableClipRect,
    getTimelineClipRect
  }
}
