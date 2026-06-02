import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
}

export interface ViewportOptions {
  minScale?: number
  maxScale?: number
  zoomSpeed?: number
}

export function useCanvasViewport(
  canvasRef: Ref<HTMLCanvasElement | null>,
  containerRef: Ref<HTMLElement | null>,
  options: ViewportOptions = {}
) {
  const { minScale = 0.1, maxScale = 10, zoomSpeed = 0.001 } = options

  const state = reactive<ViewportState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  })

  const isDragging = ref(false)
  const dragStart = ref({ x: 0, y: 0 })
  const translateStart = ref({ x: 0, y: 0 })

  const transformStyle = computed(() => ({
    transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
    transformOrigin: '0 0',
  }))

  function setTransform(s: number, tx: number, ty: number) {
    state.scale = Math.max(minScale, Math.min(maxScale, s))
    state.translateX = tx
    state.translateY = ty
  }

  function reset() {
    state.scale = 1
    state.translateX = 0
    state.translateY = 0
  }

  function zoomToFit(imageWidth: number, imageHeight: number) {
    const container = containerRef.value
    if (!container) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const scale = Math.min(cw / imageWidth, ch / imageHeight, 1)
    const tx = (cw - imageWidth * scale) / 2
    const ty = (ch - imageHeight * scale) / 2
    setTransform(scale, tx, ty)
  }

  function getPointOnCanvas(clientX: number, clientY: number) {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / state.scale,
      y: (clientY - rect.top) / state.scale,
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const container = containerRef.value
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const delta = -e.deltaY * zoomSpeed
    const newScale = Math.max(minScale, Math.min(maxScale, state.scale * (1 + delta)))
    const scaleRatio = newScale / state.scale

    const newTx = mouseX - (mouseX - state.translateX) * scaleRatio
    const newTy = mouseY - (mouseY - state.translateY) * scaleRatio

    setTransform(newScale, newTx, newTy)
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    isDragging.value = true
    dragStart.value = { x: e.clientX, y: e.clientY }
    translateStart.value = { x: state.translateX, y: state.translateY }
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging.value) return
    const dx = e.clientX - dragStart.value.x
    const dy = e.clientY - dragStart.value.y
    state.translateX = translateStart.value.x + dx
    state.translateY = translateStart.value.y + dy
  }

  function onMouseUp() {
    isDragging.value = false
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      isDragging.value = true
      dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      translateStart.value = { x: state.translateX, y: state.translateY }
    } else if (e.touches.length === 2) {
      isDragging.value = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const startDist = Math.sqrt(dx * dx + dy * dy)
      const startScale = state.scale
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const rect = canvasRef.value?.getBoundingClientRect()
      if (!rect) return
      const relX = centerX - rect.left
      const relY = centerY - rect.top

      const moveHandler = (ev: TouchEvent) => {
        if (ev.touches.length !== 2) return
        const ndx = ev.touches[0].clientX - ev.touches[1].clientX
        const ndy = ev.touches[0].clientY - ev.touches[1].clientY
        const newDist = Math.sqrt(ndx * ndx + ndy * ndy)
        const newScale = Math.max(minScale, Math.min(maxScale, startScale * (newDist / startDist)))
        const scaleRatio = newScale / startScale
        const newTx = relX - (relX - state.translateX) * scaleRatio
        const newTy = relY - (relY - state.translateY) * scaleRatio
        setTransform(newScale, newTx, newTy)
      }

      const endHandler = () => {
        containerRef.value?.removeEventListener('touchmove', moveHandler)
        containerRef.value?.removeEventListener('touchend', endHandler)
        containerRef.value?.removeEventListener('touchcancel', endHandler)
      }

      containerRef.value?.addEventListener('touchmove', moveHandler, { passive: false })
      containerRef.value?.addEventListener('touchend', endHandler)
      containerRef.value?.addEventListener('touchcancel', endHandler)
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging.value || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStart.value.x
    const dy = e.touches[0].clientY - dragStart.value.y
    state.translateX = translateStart.value.x + dx
    state.translateY = translateStart.value.y + dy
  }

  function onTouchEnd() {
    isDragging.value = false
  }

  onMounted(() => {
    const container = containerRef.value
    if (!container) return
    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    container.addEventListener('touchcancel', onTouchEnd)
  })

  onUnmounted(() => {
    const container = containerRef.value
    if (!container) return
    container.removeEventListener('wheel', onWheel)
    container.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    container.removeEventListener('touchstart', onTouchStart)
    container.removeEventListener('touchmove', onTouchMove)
    container.removeEventListener('touchend', onTouchEnd)
    container.removeEventListener('touchcancel', onTouchEnd)
  })

  return {
    state,
    transformStyle,
    isDragging,
    setTransform,
    reset,
    zoomToFit,
    getPointOnCanvas,
  }
}
