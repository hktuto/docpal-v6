import type { MaybeRefOrGetter } from 'vue'
import { toValue, onUnmounted } from 'vue'

export interface UseMenuDragOptions {
  /** 是否允许拖放（如 isAdmin） */
  enabled: MaybeRefOrGetter<boolean>
  /** 拖入时是否仅识别文件（Files） */
  filesOnly?: boolean
  /** 放下文件时回调，由调用方做导入等业务逻辑 */
  onDrop: (files: File[]) => void | Promise<void>
}

/**
 * 菜单区域文件拖放状态与事件封装
 * 负责 isDraggingOver、dragLeave 防抖与 dragover/dragenter/dragleave/drop/dragend 处理
 */
export function useMenuDrag(options: UseMenuDragOptions) {
  const { enabled, filesOnly = true, onDrop } = options

  const isDraggingOver = ref(false)
  const dragLeaveTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  function handleDragOver(event: DragEvent) {
    if (!toValue(enabled)) return
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer?.types.includes('Files')) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  function handleDragEnter(event: DragEvent) {
    if (!toValue(enabled)) return
    event.preventDefault()
    event.stopPropagation()
    if (!filesOnly || event.dataTransfer?.types.includes('Files')) {
      if (dragLeaveTimeout.value) {
        clearTimeout(dragLeaveTimeout.value)
        dragLeaveTimeout.value = null
      }
      isDraggingOver.value = true
    } 
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    const relatedTarget = event.relatedTarget as Node | null
    if (!relatedTarget) {
      isDraggingOver.value = false
      dragLeaveTimeout.value = null
      return
    }
    if (
      (relatedTarget as Element).classList?.contains('workspace-menu') ||
      (relatedTarget as Element).classList?.contains('menu-content')
    ) {
      return
    }
    isDraggingOver.value = false
    dragLeaveTimeout.value = null
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (dragLeaveTimeout.value) {
      clearTimeout(dragLeaveTimeout.value)
      dragLeaveTimeout.value = null
    }
    isDraggingOver.value = false
    if (!toValue(enabled)) return
    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return
    await onDrop(Array.from(files))
  }

  function handleDragEnd() {
    if (dragLeaveTimeout.value) {
      clearTimeout(dragLeaveTimeout.value)
      dragLeaveTimeout.value = null
    }
    isDraggingOver.value = false
  }

  onUnmounted(() => {
    if (dragLeaveTimeout.value) {
      clearTimeout(dragLeaveTimeout.value)
      dragLeaveTimeout.value = null
    }
  })

  return {
    isDraggingOver,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  }
}
