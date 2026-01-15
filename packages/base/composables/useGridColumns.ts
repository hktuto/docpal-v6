import { useResizeObserver } from '@vueuse/core'
import type { Ref } from 'vue'

interface GridColumnsOptions {
  /**
   * Minimum column width in pixels
   * @default 260
   */
  minColumnWidth?: number

  /**
   * Minimum number of columns
   * @default 1
   */
  minColumns?: number

  /**
   * Maximum number of columns
   * @default Infinity
   */
  maxColumns?: number

  /**
   * Gap between columns in pixels (used for accurate calculations)
   * @default 16
   */
  gap?: number
}

/**
 * Composable for calculating responsive grid columns based on container width
 * @param target - The container element to observe
 * @param options - Configuration options
 * @returns Reactive grid column count
 */
export function useGridColumns(target: Ref<HTMLElement | null | undefined>, options: GridColumnsOptions = {}) {
  const { minColumnWidth = 260, minColumns = 1, maxColumns = Infinity, gap = 16 } = options

  const columnCount = ref(minColumns)
  const columnWidthPerScreen = computed(() => {
    return `calc(${100 / columnCount.value}% - ${gap}px)`
  })
  /**
   * Calculate optimal number of columns based on container width
   */
  function calculateColumns(width: number): number {
    if (width <= 0) return minColumns

    // Calculate how many columns can fit with gaps
    // Formula: (width + gap) / (minColumnWidth + gap)
    const possibleColumns = Math.floor((width + gap) / (minColumnWidth + gap))

    // Clamp between min and max
    return Math.max(minColumns, Math.min(maxColumns, possibleColumns))
  }

  // Watch for size changes
  useResizeObserver(target, (entries) => {
    const entry = entries[0]
    if (entry) {
      const { width } = entry.contentRect
      columnCount.value = calculateColumns(width)
    }
  })

  // Initial calculation when target is set
  watch(
    target,
    (newTarget) => {
      if (newTarget) {
        const width = newTarget.offsetWidth
        columnCount.value = calculateColumns(width)
      }
    },
    { immediate: true }
  )

  return {
    columnCount: readonly(columnCount),
    columnWidthPerScreen: readonly(columnWidthPerScreen)
  }
}
