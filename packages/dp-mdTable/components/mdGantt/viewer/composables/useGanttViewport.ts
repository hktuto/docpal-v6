import { ref, computed, watch, type Ref } from 'vue'
import type { GanttStageConfig, GanttViewport } from '../types'

export interface UseGanttViewportOptions {
  totalRows: Ref<number>
  stageConfig: GanttStageConfig
  overscan?: number
}

export function useGanttViewport(options: UseGanttViewportOptions) {
  const { totalRows, stageConfig, overscan = 3 } = options

  const containerWidth = ref(0)
  const containerHeight = ref(0)
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const tableWidth = ref(stageConfig.tableWidth)

  const contentHeight = computed(() => {
    return totalRows.value * stageConfig.rowHeight + stageConfig.headerHeight
  })

  const maxScrollTop = computed(() => {
    return Math.max(0, contentHeight.value - containerHeight.value)
  })

  const visibleStartIndex = computed(() => {
    const raw = Math.floor((scrollTop.value - stageConfig.headerHeight) / stageConfig.rowHeight)
    return Math.max(0, raw - overscan)
  })

  const visibleEndIndex = computed(() => {
    const raw = Math.ceil((scrollTop.value - stageConfig.headerHeight + containerHeight.value) / stageConfig.rowHeight)
    return Math.min(totalRows.value - 1, raw + overscan)
  })

  const offsetY = computed(() => {
    return -(scrollTop.value % stageConfig.rowHeight)
  })

  function setContainerSize(width: number, height: number) {
    containerWidth.value = width
    containerHeight.value = height
    clampScroll()
  }

  function scrollBy(deltaY: number, deltaX: number) {
    scrollTop.value = Math.max(0, Math.min(maxScrollTop.value, scrollTop.value + deltaY))
    scrollLeft.value = Math.max(0, scrollLeft.value + deltaX)
  }

  function scrollToY(y: number) {
    scrollTop.value = Math.max(0, Math.min(maxScrollTop.value, y))
  }

  function scrollToX(x: number) {
    scrollLeft.value = Math.max(0, x)
  }

  function setTableWidth(width: number) {
    tableWidth.value = Math.max(
      stageConfig.minTableWidth,
      Math.min(stageConfig.maxTableWidth, width)
    )
  }

  function clampScroll() {
    if (scrollTop.value > maxScrollTop.value) {
      scrollTop.value = maxScrollTop.value
    }
  }

  watch(totalRows, clampScroll)

  const viewport = computed<GanttViewport>(() => ({
    scrollTop: scrollTop.value,
    visibleStartIndex: visibleStartIndex.value,
    visibleEndIndex: visibleEndIndex.value,
    offsetY: offsetY.value,
    scrollLeft: scrollLeft.value,
    containerWidth: containerWidth.value,
    containerHeight: containerHeight.value,
    contentHeight: contentHeight.value
  }))

  return {
    viewport,
    tableWidth,
    contentHeight,
    maxScrollTop,
    setContainerSize,
    scrollBy,
    scrollToY,
    scrollToX,
    setTableWidth
  }
}
