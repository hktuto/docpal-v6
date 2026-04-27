import { reactive, readonly } from 'vue'

export interface GanttDragState {
  isDragging: boolean
  dragType: 'move' | 'resize-start' | 'resize-end' | null
  taskId: string | null
  startX: number
  originalStart: Date | null
  originalEnd: Date | null
}

export function useGanttDrag() {
  const state = reactive<GanttDragState>({
    isDragging: false,
    dragType: null,
    taskId: null,
    startX: 0,
    originalStart: null,
    originalEnd: null
  })

  function startDrag(taskId: string, type: 'move' | 'resize-start' | 'resize-end', x: number, start?: Date | null, end?: Date | null) {
    state.isDragging = true
    state.dragType = type
    state.taskId = taskId
    state.startX = x
    state.originalStart = start || null
    state.originalEnd = end || null
  }

  function endDrag() {
    state.isDragging = false
    state.dragType = null
    state.taskId = null
  }

  return {
    state: readonly(state),
    startDrag,
    endDrag
  }
}
