// ui_v6\demo\canvas-renderer\composables\useViewport.ts

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface ViewportOptions {
  /** Width of the viewport in pixels */
  width: number
  /** Height of the viewport in pixels */
  height: number
  /** X position of the viewport (scroll left) */
  scrollX?: number
  /** Y position of the viewport (scroll top) */
  scrollY?: number
  /** Scale factor for zooming */
  scale?: number
  /** Minimum scale factor */
  minScale?: number
  /** Maximum scale factor */
  maxScale?: number
  /** Whether to enable panning */
  draggable?: boolean
  /** Whether to enable zooming */
  zoomable?: boolean
  /** Zoom step for wheel events */
  zoomStep?: number
}

export interface ViewportState {
  /** Current viewport width */
  width: number
  /** Current viewport height */
  height: number
  /** Current scroll position X */
  scrollX: number
  /** Current scroll position Y */
  scrollY: number
  /** Current scale factor */
  scale: number
  /** Whether user is currently panning */
  isPanning: boolean
  /** Whether user is currently zooming */
  isZooming: boolean
  /** Viewport transform matrix */
  transform: {
    x: number
    y: number
    scale: number
  }
}

export interface ViewportBounds {
  /** Minimum X scroll position */
  minX: number
  /** Maximum X scroll position */
  maxX: number
  /** Minimum Y scroll position */
  minY: number
  /** Maximum Y scroll position */
  maxY: number
  /** Content width */
  contentWidth: number
  /** Content height */
  contentHeight: number
}

/**
 * Composable for canvas viewport management
 * Handles panning, zooming, and viewport transformations
 */
export function useViewport(options: ViewportOptions) {
  const {
    width,
    height,
    scrollX = 0,
    scrollY = 0,
    scale = 1,
    minScale = 0.1,
    maxScale = 5,
    draggable = true,
    zoomable = true,
    zoomStep = 0.1
  } = options

  // Viewport state
  const viewportWidth = ref(width)
  const viewportHeight = ref(height)
  const viewportScrollX = ref(scrollX)
  const viewportScrollY = ref(scrollY)
  const viewportScale = ref(scale)
  const isPanning = ref(false)
  const isZooming = ref(false)

  // Panning state
  let panStartX = 0
  let panStartY = 0
  let panStartScrollX = 0
  let panStartScrollY = 0

  // Content bounds
  const contentBounds = ref<ViewportBounds>({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    contentWidth: 0,
    contentHeight: 0
  })

  // Update viewport dimensions
  function updateDimensions(newWidth: number, newHeight: number) {
    viewportWidth.value = newWidth
    viewportHeight.value = newHeight
    ensureBounds()
  }

  // Update content bounds
  function updateContentBounds(
    contentWidth: number,
    contentHeight: number,
    padding: number = 100
  ) {
    const scaledWidth = contentWidth * viewportScale.value
    const scaledHeight = contentHeight * viewportScale.value

    contentBounds.value = {
      minX: -padding,
      maxX: Math.max(0, scaledWidth - viewportWidth.value + padding),
      minY: -padding,
      maxY: Math.max(0, scaledHeight - viewportHeight.value + padding),
      contentWidth: scaledWidth,
      contentHeight: scaledHeight
    }

    ensureBounds()
  }

  // Ensure scroll position stays within bounds
  function ensureBounds() {
    const bounds = contentBounds.value

    viewportScrollX.value = Math.max(
      bounds.minX,
      Math.min(bounds.maxX, viewportScrollX.value)
    )

    viewportScrollY.value = Math.max(
      bounds.minY,
      Math.min(bounds.maxY, viewportScrollY.value)
    )
  }

  // Panning handlers
  function startPanning(clientX: number, clientY: number) {
    if (!draggable) return

    isPanning.value = true
    panStartX = clientX
    panStartY = clientY
    panStartScrollX = viewportScrollX.value
    panStartScrollY = viewportScrollY.value
  }

  function updatePanning(clientX: number, clientY: number) {
    if (!isPanning.value) return

    const deltaX = clientX - panStartX
    const deltaY = clientY - panStartY

    viewportScrollX.value = panStartScrollX - deltaX
    viewportScrollY.value = panStartScrollY - deltaY

    ensureBounds()
  }

  function stopPanning() {
    isPanning.value = false
  }

  // Zoom handlers
  function zoomToPoint(scaleDelta: number, clientX: number, clientY: number) {
    if (!zoomable) return

    isZooming.value = true

    // Calculate mouse position relative to viewport
    const rect = { left: 0, top: 0 } // Assuming viewport is at (0, 0)
    const mouseX = clientX - rect.left
    const mouseY = clientY - rect.top

    // Calculate mouse position in content space before zoom
    const contentX = (mouseX + viewportScrollX.value) / viewportScale.value
    const contentY = (mouseY + viewportScrollY.value) / viewportScale.value

    // Update scale with bounds
    const newScale = Math.max(
      minScale,
      Math.min(maxScale, viewportScale.value + scaleDelta)
    )
    viewportScale.value = newScale

    // Update content bounds with new scale
    if (contentBounds.value.contentWidth > 0 && contentBounds.value.contentHeight > 0) {
      const oldWidth = contentBounds.value.contentWidth
      const oldHeight = contentBounds.value.contentHeight
      updateContentBounds(oldWidth / viewportScale.value, oldHeight / viewportScale.value)
    }

    // Adjust scroll position to keep mouse point in same content position
    viewportScrollX.value = contentX * newScale - mouseX
    viewportScrollY.value = contentY * newScale - mouseY

    ensureBounds()

    // Reset zooming state after animation
    setTimeout(() => {
      isZooming.value = false
    }, 150)
  }

  function zoomIn(centerX?: number, centerY?: number) {
    const x = centerX ?? viewportWidth.value / 2
    const y = centerY ?? viewportHeight.value / 2
    zoomToPoint(zoomStep, x, y)
  }

  function zoomOut(centerX?: number, centerY?: number) {
    const x = centerX ?? viewportWidth.value / 2
    const y = centerY ?? viewportHeight.value / 2
    zoomToPoint(-zoomStep, x, y)
  }

  function resetZoom() {
    viewportScale.value = 1
    viewportScrollX.value = 0
    viewportScrollY.value = 0
    ensureBounds()
  }

  // Wheel event handler (combines panning and zooming)
  function handleWheel(event: WheelEvent) {
    event.preventDefault()

    if (event.ctrlKey || event.metaKey) {
      // Zoom with Ctrl/Cmd + wheel
      const scaleDelta = -event.deltaY * 0.01
      zoomToPoint(scaleDelta, event.clientX, event.clientY)
    } else {
      // Pan with wheel
      viewportScrollX.value += event.deltaX
      viewportScrollY.value += event.deltaY
      ensureBounds()
    }
  }

  // Scroll to position
  function scrollTo(x: number, y: number, animate: boolean = false) {
    if (animate) {
      // Simple linear animation
      const startX = viewportScrollX.value
      const startY = viewportScrollY.value
      const duration = 300 // ms
      const startTime = Date.now()

      function animateScroll() {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function
        const ease = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

        viewportScrollX.value = startX + (x - startX) * ease
        viewportScrollY.value = startY + (y - startY) * ease

        ensureBounds()

        if (progress < 1) {
          requestAnimationFrame(animateScroll)
        }
      }

      animateScroll()
    } else {
      viewportScrollX.value = x
      viewportScrollY.value = y
      ensureBounds()
    }
  }

  // Scroll to make a rectangle visible
  function scrollIntoView(
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number = 20
  ) {
    const scaledX = x * viewportScale.value
    const scaledY = y * viewportScale.value
    const scaledWidth = width * viewportScale.value
    const scaledHeight = height * viewportScale.value

    let targetX = viewportScrollX.value
    let targetY = viewportScrollY.value

    // Check if rectangle is outside viewport
    if (scaledX < viewportScrollX.value + padding) {
      targetX = scaledX - padding
    } else if (scaledX + scaledWidth > viewportScrollX.value + viewportWidth.value - padding) {
      targetX = scaledX + scaledWidth - viewportWidth.value + padding
    }

    if (scaledY < viewportScrollY.value + padding) {
      targetY = scaledY - padding
    } else if (scaledY + scaledHeight > viewportScrollY.value + viewportHeight.value - padding) {
      targetY = scaledY + scaledHeight - viewportHeight.value + padding
    }

    scrollTo(targetX, targetY, true)
  }

  // Convert viewport coordinates to content coordinates
  function viewportToContent(x: number, y: number) {
    return {
      x: (x + viewportScrollX.value) / viewportScale.value,
      y: (y + viewportScrollY.value) / viewportScale.value
    }
  }

  // Convert content coordinates to viewport coordinates
  function contentToViewport(x: number, y: number) {
    return {
      x: x * viewportScale.value - viewportScrollX.value,
      y: y * viewportScale.value - viewportScrollY.value
    }
  }

  // Check if a content rectangle is visible in viewport
  function isContentVisible(
    x: number,
    y: number,
    width: number,
    height: number,
    partial: boolean = true
  ): boolean {
    const viewportRect = {
      x: viewportScrollX.value,
      y: viewportScrollY.value,
      width: viewportWidth.value,
      height: viewportHeight.value
    }

    const contentRect = {
      x: x * viewportScale.value,
      y: y * viewportScale.value,
      width: width * viewportScale.value,
      height: height * viewportScale.value
    }

    if (partial) {
      // Check for any overlap
      return !(
        contentRect.x + contentRect.width < viewportRect.x ||
        contentRect.x > viewportRect.x + viewportRect.width ||
        contentRect.y + contentRect.height < viewportRect.y ||
        contentRect.y > viewportRect.y + viewportRect.height
      )
    } else {
      // Check if completely contained
      return (
        contentRect.x >= viewportRect.x &&
        contentRect.x + contentRect.width <= viewportRect.x + viewportRect.width &&
        contentRect.y >= viewportRect.y &&
        contentRect.y + contentRect.height <= viewportRect.y + viewportRect.height
      )
    }
  }

  // Combined state
  const state = computed<ViewportState>(() => ({
    width: viewportWidth.value,
    height: viewportHeight.value,
    scrollX: viewportScrollX.value,
    scrollY: viewportScrollY.value,
    scale: viewportScale.value,
    isPanning: isPanning.value,
    isZooming: isZooming.value,
    transform: {
      x: -viewportScrollX.value,
      y: -viewportScrollY.value,
      scale: viewportScale.value
    }
  }))

  // Watch for options changes
  watch(() => width, (newWidth) => {
    viewportWidth.value = newWidth
    ensureBounds()
  })

  watch(() => height, (newHeight) => {
    viewportHeight.value = newHeight
    ensureBounds()
  })

  // Cleanup
  onUnmounted(() => {
    // Remove any event listeners if added externally
  })

  return {
    // State
    state,
    contentBounds,

    // Getters
    width: viewportWidth,
    height: viewportHeight,
    scrollX: viewportScrollX,
    scrollY: viewportScrollY,
    scale: viewportScale,
    isPanning,
    isZooming,

    // Actions
    updateDimensions,
    updateContentBounds,
    startPanning,
    updatePanning,
    stopPanning,
    zoomToPoint,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    scrollTo,
    scrollIntoView,

    // Coordinate conversion
    viewportToContent,
    contentToViewport,
    isContentVisible,

    // Utilities
    ensureBounds
  }
}

/**
 * Helper to create viewport event handlers
 */
export function createViewportEventHandlers(
  viewport: ReturnType<typeof useViewport>
) {
  return {
    onWheel: viewport.handleWheel,
    onMouseDown: (event: MouseEvent) => {
      viewport.startPanning(event.clientX, event.clientY)
    },
    onMouseMove: (event: MouseEvent) => {
      viewport.updatePanning(event.clientX, event.clientY)
    },
    onMouseUp: () => {
      viewport.stopPanning()
    },
    onMouseLeave: () => {
      viewport.stopPanning()
    }
  }
}
