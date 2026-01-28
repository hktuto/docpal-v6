import type { DetailWidgetSetting } from '../utils/detailWidgetHelper'
import type { Ref } from 'vue'
import { ref } from 'vue'

/**
 * Composable for handling drag-and-drop of widgets in detail view
 * Follows the same pattern as useDashboardDrag
 */
export function useDetailViewDrag(options: {
  wrapper: Ref<HTMLElement | undefined>
  layout: Ref<DetailWidgetSetting[]>
  colNum: Ref<number>
  rowHeight?: number
  onAdd?: (item: DetailWidgetSetting) => void
}) {
  const { wrapper, layout, colNum: colNumRef, rowHeight = 80, onAdd } = options
  const _colNum = colNumRef.value

  // Store drag data
  const dragData = ref<DetailWidgetSetting | null>(null)

  // Store placeholder data
  const placeholder = ref<{
    x: number
    y: number
    w: number
    h: number
    show: boolean
  }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    show: false
  })

  /**
   * Handle widget drag start
   */
  function handleDragStart(event: DragEvent, item: DetailWidgetSetting) {
    if (!event.dataTransfer) return
    dragData.value = {
      ...item,
      component: item.component,
      label: item.label,
      icon: item.icon
    }

    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData.value))
  }

  /**
   * Handle drag over container
   */
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }

    // Show placeholder if we have drag data
    if (dragData.value) {
      const position = calculateDropPosition(event)
      placeholder.value = {
        x: position.x,
        y: position.y,
        w: dragData.value.w,
        h: dragData.value.h,
        show: true
      }
    }
  }

  /**
   * Calculate drop position
   */
  function calculateDropPosition(event: DragEvent) {
    if (!wrapper.value) return { x: 0, y: 0 }

    const rect = wrapper.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left + wrapper.value.scrollLeft
    const mouseY = event.clientY - rect.top + wrapper.value.scrollTop

    // Calculate grid position (considering margin)
    const margin = 12
    const colWidth = (wrapper.value.offsetWidth - margin * (_colNum + 1)) / _colNum
    const effectiveRowHeight = rowHeight + margin

    let x = Math.floor(mouseX / (colWidth + margin))
    let y = Math.floor(mouseY / effectiveRowHeight)

    // Ensure x is within valid range
    x = Math.max(0, Math.min(x, _colNum - 1))
    y = Math.max(0, y)

    return { x, y }
  }

  /**
   * Handle drop
   */
  function handleDrop(event: DragEvent) {
    event.preventDefault()

    if (!dragData.value) return

    try {
      const position = calculateDropPosition(event)
      // Create new widget item
      const newItem: DetailWidgetSetting = {
        ...dragData.value,
        x: position.x,
        y: position.y,
        i: new Date().valueOf().toString(),
      }

      // Add to layout
      layout.value.push(newItem)

      // Trigger callback
      if (onAdd) {
        onAdd(newItem)
      }
    } catch (error) {
      console.error('Drop error:', error)
    } finally {
      dragData.value = null
      placeholder.value.show = false
    }
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(event: DragEvent) {
    // Check if we really left the container
    if (!event.relatedTarget || !(event.relatedTarget as HTMLElement).closest) {
      placeholder.value.show = false
    }
  }

  /**
   * Handle drag end
   */
  function handleDragEnd() {
    dragData.value = null
    placeholder.value.show = false
  }

  return {
    dragData,
    placeholder,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragLeave,
    handleDragEnd
  }
}
