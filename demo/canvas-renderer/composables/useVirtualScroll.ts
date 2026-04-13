// ui_v6\demo\canvas-renderer\composables\useVirtualScroll.ts

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface VirtualScrollOptions {
  /** Total number of items */
  totalItems: number
  /** Height of each item in pixels */
  itemHeight: number
  /** Height of the viewport in pixels */
  viewportHeight: number
  /** Number of extra items to render above and below the viewport (buffer) */
  overscan?: number
  /** Whether to enable horizontal scrolling */
  horizontal?: boolean
  /** Width of each item in pixels (for horizontal scrolling) */
  itemWidth?: number
  /** Width of the viewport in pixels (for horizontal scrolling) */
  viewportWidth?: number
}

export interface VirtualScrollState {
  /** Current scroll position in pixels */
  scrollTop: number
  /** Current horizontal scroll position in pixels */
  scrollLeft: number
  /** Index of the first visible item */
  startIndex: number
  /** Index of the last visible item */
  endIndex: number
  /** Number of items that fit in the viewport */
  visibleCount: number
  /** Items that should be rendered (including buffer) */
  visibleItems: number[]
  /** Offset for positioning items (for CSS transforms) */
  offsetY: number
  /** Horizontal offset for positioning items */
  offsetX: number
  /** Whether user is currently scrolling */
  isScrolling: boolean
}

export interface ScrollMetrics {
  /** Total height of all items */
  totalHeight: number
  /** Total width of all items (if horizontal) */
  totalWidth: number
  /** Whether vertical scrollbar is needed */
  needsVerticalScrollbar: boolean
  /** Whether horizontal scrollbar is needed */
  needsHorizontalScrollbar: boolean
  /** Scrollbar height in pixels */
  scrollbarHeight: number
  /** Scrollbar width in pixels */
  scrollbarWidth: number
  /** Thumb height for vertical scrollbar */
  verticalThumbHeight: number
  /** Thumb width for horizontal scrollbar */
  horizontalThumbWidth: number
}

/**
 * Composable for virtual scrolling implementation
 * Handles viewport calculations, scroll position tracking, and visible item range
 */
export function useVirtualScroll(options: VirtualScrollOptions) {
  const {
    totalItems,
    itemHeight,
    viewportHeight,
    overscan = 3,
    horizontal = false,
    itemWidth = 100,
    viewportWidth = 800
  } = options

  // Scroll position state
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const isScrolling = ref(false)
  let scrollTimeout: NodeJS.Timeout | null = null

  // Calculate metrics
  const metrics = computed<ScrollMetrics>(() => {
    const totalHeight = totalItems * itemHeight
    const totalWidth = horizontal ? totalItems * itemWidth : 0

    const needsVerticalScrollbar = totalHeight > viewportHeight
    const needsHorizontalScrollbar = horizontal && totalWidth > viewportWidth

    // Calculate scrollbar dimensions
    const scrollbarHeight = needsVerticalScrollbar ? 16 : 0
    const scrollbarWidth = needsHorizontalScrollbar ? 16 : 0

    // Calculate thumb sizes
    const verticalThumbHeight = needsVerticalScrollbar
      ? Math.max(20, (viewportHeight / totalHeight) * (viewportHeight - scrollbarWidth))
      : 0

    const horizontalThumbWidth = needsHorizontalScrollbar
      ? Math.max(20, (viewportWidth / totalWidth) * (viewportWidth - scrollbarHeight))
      : 0

    return {
      totalHeight,
      totalWidth,
      needsVerticalScrollbar,
      needsHorizontalScrollbar,
      scrollbarHeight,
      scrollbarWidth,
      verticalThumbHeight,
      horizontalThumbWidth
    }
  })

  // Calculate visible item range
  const visibleRange = computed(() => {
    if (totalItems === 0) {
      return { startIndex: 0, endIndex: 0, visibleCount: 0 }
    }

    // Calculate which items are visible in the viewport
    const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight))
    const visibleCount = Math.ceil(viewportHeight / itemHeight)
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount - 1)

    return { startIndex, endIndex, visibleCount }
  })

  // Calculate visible items with overscan (buffer)
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value

    if (totalItems === 0) {
      return []
    }

    // Add buffer items above and below the viewport
    const start = Math.max(0, startIndex - overscan)
    const end = Math.min(totalItems - 1, endIndex + overscan)

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  // Calculate offset for positioning items
  const offsetY = computed(() => {
    const { startIndex } = visibleRange.value
    return Math.max(0, startIndex * itemHeight - (scrollTop.value % itemHeight))
  })

  const offsetX = computed(() => {
    if (!horizontal) return 0
    return Math.max(0, Math.floor(scrollLeft.value / itemWidth) * itemWidth - (scrollLeft.value % itemWidth))
  })

  // Combined state
  const state = computed<VirtualScrollState>(() => ({
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value,
    startIndex: visibleRange.value.startIndex,
    endIndex: visibleRange.value.endIndex,
    visibleCount: visibleRange.value.visibleCount,
    visibleItems: visibleItems.value,
    offsetY: offsetY.value,
    offsetX: offsetX.value,
    isScrolling: isScrolling.value
  }))

  // Scroll handlers
  function handleVerticalScroll(newScrollTop: number) {
    const maxScrollTop = Math.max(0, metrics.value.totalHeight - viewportHeight)
    scrollTop.value = Math.max(0, Math.min(maxScrollTop, newScrollTop))
    setIsScrolling()
  }

  function handleHorizontalScroll(newScrollLeft: number) {
    if (!horizontal) return

    const maxScrollLeft = Math.max(0, metrics.value.totalWidth - viewportWidth)
    scrollLeft.value = Math.max(0, Math.min(maxScrollLeft, newScrollLeft))
    setIsScrolling()
  }

  function scrollToIndex(index: number, align: 'start' | 'center' | 'end' = 'start') {
    if (index < 0 || index >= totalItems) return

    let newScrollTop = 0
    switch (align) {
      case 'start':
        newScrollTop = index * itemHeight
        break
      case 'center':
        newScrollTop = index * itemHeight - (viewportHeight / 2) + (itemHeight / 2)
        break
      case 'end':
        newScrollTop = index * itemHeight - viewportHeight + itemHeight
        break
    }

    handleVerticalScroll(newScrollTop)
  }

  function scrollToPosition(x: number, y: number) {
    handleHorizontalScroll(x)
    handleVerticalScroll(y)
  }

  // Helper to set scrolling state with timeout
  function setIsScrolling() {
    isScrolling.value = true

    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    scrollTimeout = setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }

  // Handle wheel events
  function handleWheel(event: WheelEvent) {
    event.preventDefault()

    // Use deltaY for vertical, deltaX for horizontal
    const deltaY = event.deltaY
    const deltaX = event.deltaX

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical scroll
      handleVerticalScroll(scrollTop.value + deltaY)
    } else if (horizontal && Math.abs(deltaX) > 0) {
      // Horizontal scroll
      handleHorizontalScroll(scrollLeft.value + deltaX)
    }
  }

  // Handle scrollbar drag
  function handleVerticalScrollbarDrag(dragY: number, dragHeight: number) {
    const scrollRatio = dragY / (viewportHeight - dragHeight)
    const maxScrollTop = Math.max(0, metrics.value.totalHeight - viewportHeight)
    const newScrollTop = scrollRatio * maxScrollTop
    handleVerticalScroll(newScrollTop)
  }

  function handleHorizontalScrollbarDrag(dragX: number, dragWidth: number) {
    if (!horizontal) return

    const scrollRatio = dragX / (viewportWidth - dragWidth)
    const maxScrollLeft = Math.max(0, metrics.value.totalWidth - viewportWidth)
    const newScrollLeft = scrollRatio * maxScrollLeft
    handleHorizontalScroll(newScrollLeft)
  }

  // Cleanup
  onUnmounted(() => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  })

  return {
    // State
    state,
    metrics,

    // Getters
    scrollTop,
    scrollLeft,
    isScrolling,

    // Actions
    handleVerticalScroll,
    handleHorizontalScroll,
    scrollToIndex,
    scrollToPosition,
    handleWheel,
    handleVerticalScrollbarDrag,
    handleHorizontalScrollbarDrag,

    // Utilities
    getItemPosition: (index: number) => ({
      top: index * itemHeight,
      left: horizontal ? index * itemWidth : 0
    }),

    isItemVisible: (index: number) => {
      const { startIndex, endIndex } = visibleRange.value
      return index >= startIndex && index <= endIndex
    }
  }
}

/**
 * Type for scroll event handlers
 */
export interface ScrollEventHandlers {
  onWheel: (event: WheelEvent) => void
  onVerticalScrollbarDrag: (dragY: number, dragHeight: number) => void
  onHorizontalScrollbarDrag: (dragX: number, dragWidth: number) => void
}

/**
 * Helper to create scroll event handlers
 */
export function createScrollEventHandlers(virtualScroll: ReturnType<typeof useVirtualScroll>): ScrollEventHandlers {
  return {
    onWheel: virtualScroll.handleWheel,
    onVerticalScrollbarDrag: virtualScroll.handleVerticalScrollbarDrag,
    onHorizontalScrollbarDrag: virtualScroll.handleHorizontalScrollbarDrag
  }
}
