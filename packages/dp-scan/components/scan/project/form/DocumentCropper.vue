<script lang="ts" setup>
import { pdfPageToImageUrl, loadPDF } from '#imports'

const props = defineProps<{
  sampleDocPath: string | null
}>()

const emits = defineEmits<{
  cancel: []
  confirm: [{ zone: string; croppedImage: string }]
}>()

const routerProvider = inject(MenuRouterKey)

// State
const loading = ref(false)

// Canvas and container refs
const canvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLDivElement>()

// Image state
const imageObj = ref<HTMLImageElement>()
const imageLoading = ref(false)

// Store selection in ORIGINAL image coordinates
const selectionInOriginalCoords = ref<{ x: number; y: number; width: number; height: number } | null>(null)

// Is in crop editing mode (has selection)
const hasSelection = computed(() => selectionInOriginalCoords.value !== null)

// Zoom state
const zoomScale = ref(1)
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.2

// Calculate base scale to fit image in container
const baseScale = computed(() => {
  const img = imageObj.value
  const container = containerRef.value
  if (!img || !container) return 1

  const containerRect = container.getBoundingClientRect()
  return Math.min(
    containerRect.width / img.naturalWidth,
    containerRect.height / img.naturalHeight,
    1
  )
})

// Current effective scale
const effectiveScale = computed(() => {
  return baseScale.value * zoomScale.value
})

// Canvas cursor
const canvasCursor = computed(() => {
  if (isResizing.value) return 'grabbing'
  if (isDragging.value) return 'grabbing'
  if (isHoveringHandle.value) return 'pointer'
  if (selectionInOriginalCoords.value) return 'move'
  return 'grab'
})

// Interaction state
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })
const isHoveringHandle = ref(false)

// Default crop size in original image pixels
const DEFAULT_CROP_SIZE = 150

// Convert display (screen) coordinates to original image coordinates
function displayToOriginal(displayX: number, displayY: number) {
  const scale = effectiveScale.value
  return {
    x: displayX / scale,
    y: displayY / scale
  }
}

// Convert original image coordinates to display (screen) coordinates
function originalToDisplay(originalX: number, originalY: number) {
  const scale = effectiveScale.value
  return {
    x: originalX * scale,
    y: originalY * scale
  }
}

// Get current viewport center in original coordinates
function getViewportCenterInOriginal(): { x: number; y: number } {
  const container = containerRef.value
  if (!container) return { x: 0, y: 0 }

  // Current scroll position + half of visible area
  const displayX = container.scrollLeft + container.clientWidth / 2
  const displayY = container.scrollTop + container.clientHeight / 2

  return displayToOriginal(displayX, displayY)
}

// Load document preview
async function loadPreview() {
  if (!props.sampleDocPath) return

  loading.value = true
  try {
    const { clientApi } = await import('api')
    const blob = await clientApi.api.postCaptureFileQuerycapturefilebypath(
      { path: props.sampleDocPath },
      { format: 'blob', headers: { noThrowError: true } }
    )

    const fileName = props.sampleDocPath.split('/').pop() || 'document'
    const file = new File([blob], fileName, { type: blob.type })

    let imageUrl: string
    if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const pdf = await loadPDF(file)
      imageUrl = await pdfPageToImageUrl(pdf, 1, {
        scale: 2,
        maxWidth: 1200,
        maxHeight: 1600
      })
    } else if (file.type.startsWith('image/')) {
      imageUrl = URL.createObjectURL(blob)
    } else {
      throw new Error('Unsupported file type')
    }

    // Load image
    imageLoading.value = true
    const img = new Image()
    img.onload = () => {
      imageObj.value = img
      imageLoading.value = false
      zoomScale.value = 1
      nextTick(() => {
        drawCanvas()
        centerCanvas()
      })
    }
    img.onerror = () => {
      imageLoading.value = false
      routerProvider?.message.error('Failed to load image')
    }
    img.src = imageUrl
  } catch (error) {
    console.error('Failed to load preview:', error)
    routerProvider?.message.error('Failed to load document preview')
  } finally {
    loading.value = false
  }
}

// Draw canvas with image and selection
function drawCanvas() {
  const canvas = canvasRef.value
  const img = imageObj.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scale = effectiveScale.value
  const displayWidth = img.naturalWidth * scale
  const displayHeight = img.naturalHeight * scale

  // Set canvas size
  canvas.width = displayWidth
  canvas.height = displayHeight

  // Clear and draw image
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

  // Draw selection if exists
  if (selectionInOriginalCoords.value) {
    drawSelection(ctx)
  }
}

// Draw selection overlay with resize handles
function drawSelection(ctx: CanvasRenderingContext2D) {
  if (!selectionInOriginalCoords.value) return

  const { x, y, width, height } = selectionInOriginalCoords.value
  const scale = effectiveScale.value

  // Convert to display coordinates
  const displayX = x * scale
  const displayY = y * scale
  const displayW = width * scale
  const displayH = height * scale

  // Draw semi-transparent fill
  ctx.fillStyle = 'rgba(64, 158, 255, 0.2)'
  ctx.fillRect(displayX, displayY, displayW, displayH)

  // Draw dashed border
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(displayX, displayY, displayW, displayH)
  ctx.setLineDash([])

  // Draw resize handles (10px white squares with blue border)
  const handleSize = 10
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2

  const handles = [
    { x: displayX, y: displayY, name: 'nw' },
    { x: displayX + displayW, y: displayY, name: 'ne' },
    { x: displayX, y: displayY + displayH, name: 'sw' },
    { x: displayX + displayW, y: displayY + displayH, name: 'se' }
  ]

  handles.forEach(handle => {
    ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize)
    ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize)
  })
}

// Center canvas in container
function centerCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  canvas.style.marginLeft = ''
  canvas.style.marginRight = ''
  canvas.style.marginTop = ''
  canvas.style.marginBottom = ''

  const maxScrollLeft = canvas.width - container.clientWidth
  const maxScrollTop = canvas.height - container.clientHeight

  if (maxScrollLeft > 0) {
    container.scrollLeft = maxScrollLeft / 2
  } else {
    canvas.style.marginLeft = 'auto'
    canvas.style.marginRight = 'auto'
  }

  if (maxScrollTop > 0) {
    container.scrollTop = maxScrollTop / 2
  } else {
    canvas.style.marginTop = 'auto'
    canvas.style.marginBottom = 'auto'
  }
}

// Zoom functions
function zoomTo(newZoom: number, focalPoint?: { x: number; y: number } | null) {
  const container = containerRef.value
  const canvas = canvasRef.value
  const img = imageObj.value
  if (!container || !canvas || !img) return

  const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM))
  if (clampedZoom === zoomScale.value) return

  const focus = focalPoint || {
    x: container.clientWidth / 2 + container.scrollLeft,
    y: container.clientHeight / 2 + container.scrollTop
  }

  const oldScale = baseScale.value * zoomScale.value
  const imageX = focus.x / oldScale
  const imageY = focus.y / oldScale

  zoomScale.value = clampedZoom

  nextTick(() => {
    const newScale = baseScale.value * zoomScale.value
    canvas.width = img.naturalWidth * newScale
    canvas.height = img.naturalHeight * newScale

    drawCanvas()

    const newFocusX = imageX * newScale
    const newFocusY = imageY * newScale

    container.scrollLeft = newFocusX - focus.x + container.scrollLeft
    container.scrollTop = newFocusY - focus.y + container.scrollTop

    const maxScrollLeft = canvas.width - container.clientWidth
    const maxScrollTop = canvas.height - container.clientHeight

    if (maxScrollLeft <= 0) {
      canvas.style.marginLeft = 'auto'
      canvas.style.marginRight = 'auto'
    } else {
      canvas.style.marginLeft = ''
      canvas.style.marginRight = ''
    }

    if (maxScrollTop <= 0) {
      canvas.style.marginTop = 'auto'
      canvas.style.marginBottom = 'auto'
    } else {
      canvas.style.marginTop = ''
      canvas.style.marginBottom = ''
    }
  })
}

function zoomIn() {
  zoomTo(zoomScale.value + ZOOM_STEP)
}

function zoomOut() {
  zoomTo(zoomScale.value - ZOOM_STEP)
}

function fitToScreen() {
  zoomScale.value = 1
  nextTick(() => centerCanvas())
}

// Wheel zoom
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = zoomScale.value + delta

  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left + container.scrollLeft
  const mouseY = event.clientY - rect.top + container.scrollTop

  zoomTo(newZoom, { x: mouseX, y: mouseY })
}

// Get resize handle at position
function getResizeHandleAtPosition(mouseX: number, mouseY: number): string | null {
  if (!selectionInOriginalCoords.value) return null

  const scale = effectiveScale.value
  const zone = selectionInOriginalCoords.value
  const x = zone.x * scale
  const y = zone.y * scale
  const w = zone.width * scale
  const h = zone.height * scale
  const handleSize = 14 // Hit area slightly larger than visual

  const handles = [
    { name: 'nw', x: x, y: y },
    { name: 'ne', x: x + w, y: y },
    { name: 'sw', x: x, y: y + h },
    { name: 'se', x: x + w, y: y + h }
  ]

  for (const handle of handles) {
    if (
      mouseX >= handle.x - handleSize/2 &&
      mouseX <= handle.x + handleSize/2 &&
      mouseY >= handle.y - handleSize/2 &&
      mouseY <= handle.y + handleSize/2
    ) {
      return handle.name
    }
  }

  return null
}

// Mouse handlers
function handleMouseDown(event: MouseEvent) {
  if (!canvasRef.value || !imageObj.value) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Check if clicking on resize handle
  const handle = getResizeHandleAtPosition(mouseX, mouseY)
  if (handle && selectionInOriginalCoords.value) {
    isResizing.value = true
    resizeHandle.value = handle
    dragStart.value = { x: event.clientX, y: event.clientY }
    return
  }

  // Check if clicking inside selection (to drag/move it)
  if (selectionInOriginalCoords.value) {
    const scale = effectiveScale.value
    const sel = selectionInOriginalCoords.value
    const displayX = sel.x * scale
    const displayY = sel.y * scale
    const displayW = sel.width * scale
    const displayH = sel.height * scale

    if (
      mouseX >= displayX &&
      mouseX <= displayX + displayW &&
      mouseY >= displayY &&
      mouseY <= displayY + displayH
    ) {
      // Start dragging the selection
      isDragging.value = true
      dragStart.value = { x: event.clientX, y: event.clientY }
      return
    }
  }
}

function handleMouseMove(event: MouseEvent) {
  if (!canvasRef.value || !imageObj.value) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Update hover state for cursor
  isHoveringHandle.value = getResizeHandleAtPosition(mouseX, mouseY) !== null

  if (isResizing.value && selectionInOriginalCoords.value && resizeHandle.value) {
    const scale = effectiveScale.value
    const originalMouse = displayToOriginal(mouseX, mouseY)
    const sel = selectionInOriginalCoords.value

    let newX = sel.x
    let newY = sel.y
    let newW = sel.width
    let newH = sel.height

    switch (resizeHandle.value) {
      case 'nw':
        newX = Math.min(originalMouse.x, sel.x + sel.width)
        newY = Math.min(originalMouse.y, sel.y + sel.height)
        newW = Math.abs(sel.x + sel.width - originalMouse.x)
        newH = Math.abs(sel.y + sel.height - originalMouse.y)
        break
      case 'ne':
        newX = sel.x
        newY = Math.min(originalMouse.y, sel.y + sel.height)
        newW = Math.abs(originalMouse.x - sel.x)
        newH = Math.abs(sel.y + sel.height - originalMouse.y)
        break
      case 'sw':
        newX = Math.min(originalMouse.x, sel.x + sel.width)
        newY = sel.y
        newW = Math.abs(sel.x + sel.width - originalMouse.x)
        newH = Math.abs(originalMouse.y - sel.y)
        break
      case 'se':
        newX = sel.x
        newY = sel.y
        newW = Math.abs(originalMouse.x - sel.x)
        newH = Math.abs(originalMouse.y - sel.y)
        break
    }

    // Enforce minimum size
    const minSize = 20
    if (newW >= minSize && newH >= minSize) {
      selectionInOriginalCoords.value = {
        x: newX,
        y: newY,
        width: newW,
        height: newH
      }
      drawCanvas()
    }
  } else if (isDragging.value && selectionInOriginalCoords.value) {
    // Drag the entire selection
    const dx = (event.clientX - dragStart.value.x) / effectiveScale.value
    const dy = (event.clientY - dragStart.value.y) / effectiveScale.value

    selectionInOriginalCoords.value = {
      ...selectionInOriginalCoords.value,
      x: selectionInOriginalCoords.value.x + dx,
      y: selectionInOriginalCoords.value.y + dy
    }

    dragStart.value = { x: event.clientX, y: event.clientY }
    drawCanvas()
  }
}

function handleMouseUp() {
  isResizing.value = false
  isDragging.value = false
  resizeHandle.value = null
}

// Pan/scroll handlers for container
function handleContainerMouseDown(event: MouseEvent) {
  // Don't pan if clicking on canvas (which handles its own events)
  if (event.target === canvasRef.value) return

  const container = containerRef.value
  if (!container) return

  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  scrollStart.value = { x: container.scrollLeft, y: container.scrollTop }
  container.style.cursor = 'grabbing'
}

function handleContainerMouseMove(event: MouseEvent) {
  if (!isDragging.value || !containerRef.value) return

  const container = containerRef.value
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y

  container.scrollLeft = scrollStart.value.x - dx
  container.scrollTop = scrollStart.value.y - dy
}

function handleContainerMouseUp() {
  if (containerRef.value) {
    containerRef.value.style.cursor = ''
  }
  isDragging.value = false
}

// Add new crop at viewport center
function addCropAtCenter() {
  const img = imageObj.value
  if (!img) return

  const center = getViewportCenterInOriginal()
  const size = Math.min(DEFAULT_CROP_SIZE, img.naturalWidth / 4, img.naturalHeight / 4)

  // Ensure crop stays within image bounds
  let x = center.x - size / 2
  let y = center.y - size / 2

  // Clamp to image bounds
  x = Math.max(0, Math.min(x, img.naturalWidth - size))
  y = Math.max(0, Math.min(y, img.naturalHeight - size))

  selectionInOriginalCoords.value = {
    x,
    y,
    width: size,
    height: size
  }

  drawCanvas()
}

// Extract cropped image
function extractCroppedImage(): string {
  const img = imageObj.value
  const sel = selectionInOriginalCoords.value
  if (!img || !sel) return ''

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = sel.width
  tempCanvas.height = sel.height
  const ctx = tempCanvas.getContext('2d')
  if (!ctx) return ''

  ctx.drawImage(
    img,
    sel.x, sel.y, sel.width, sel.height,
    0, 0, sel.width, sel.height
  )

  return tempCanvas.toDataURL('image/png')
}

// Public methods
function startCrop() {
  selectionInOriginalCoords.value = null
  zoomScale.value = 1
  nextTick(() => {
    drawCanvas()
    centerCanvas()
    // Add crop at center after a short delay to ensure layout is ready
    setTimeout(() => {
      addCropAtCenter()
    }, 50)
  })
}

function cancelCrop() {
  selectionInOriginalCoords.value = null
  drawCanvas()
  emits('cancel')
}

function confirmCrop() {
  if (!selectionInOriginalCoords.value) return

  const sel = selectionInOriginalCoords.value
  const zone = `${Math.round(sel.x)},${Math.round(sel.y)},${Math.round(sel.x + sel.width)},${Math.round(sel.y + sel.height)}`
  const croppedImage = extractCroppedImage()

  emits('confirm', { zone, croppedImage })
}

// Handle window resize
function handleResize() {
  nextTick(() => {
    drawCanvas()
    centerCanvas()
  })
}

onMounted(() => {
  loadPreview()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

defineExpose({
  startCrop
})
</script>

<template>
  <div class="documentCropper">
    <!-- Zoom Controls -->
    <div class="cropHeader">
      <div class="zoomControls">
        <ElButton link size="small" @click="zoomOut">
          <Icon name="lucide:zoom-out" />
        </ElButton>
        <span class="zoomLevel">{{ Math.round(zoomScale * 100) }}%</span>
        <ElButton link size="small" @click="zoomIn">
          <Icon name="lucide:zoom-in" />
        </ElButton>
        <ElButton link size="small" @click="fitToScreen">
          <Icon name="lucide:maximize-2" />
        </ElButton>
      </div>
      <div class="cropHint">
        <Icon name="lucide:move" />
        Drag to pan • Drag crop to move • Drag corners to resize
      </div>
    </div>

    <!-- Canvas Container -->
    <div
      ref="containerRef"
      v-loading="loading || imageLoading"
      class="cropBody"
      @wheel="handleWheel"
      @mousedown="handleContainerMouseDown"
      @mousemove="handleContainerMouseMove"
      @mouseup="handleContainerMouseUp"
      @mouseleave="handleContainerMouseUp"
    >
      <canvas
        v-if="imageObj"
        ref="canvasRef"
        class="cropCanvas"
        :style="{ cursor: canvasCursor }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      />
      <ElEmpty v-else description="Loading document..." />
    </div>

    <!-- Action Buttons -->
    <div class="cropActions">
      <ElButton type="info" size="small" @click="cancelCrop">
        <Icon name="lucide:x" />
        Cancel
      </ElButton>
      <ElButton
        type="success"
        size="small"
        :disabled="!selectionInOriginalCoords || selectionInOriginalCoords.width < 10 || selectionInOriginalCoords.height < 10"
        @click="confirmCrop"
      >
        <Icon name="lucide:check" />
        Confirm
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.documentCropper {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  background-color: var(--app-bg-color);
}

.cropHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.zoomControls {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);

  :deep(.el-button) {
    padding: 4px 8px;
    font-size: var(--app-font-size-m);
  }
}

.zoomLevel {
  min-width: 48px;
  text-align: center;
  font-size: var(--app-font-size-s);
  font-weight: 500;
  color: var(--app-text-color-primary);
  user-select: none;
}

.cropHint {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.cropBody {
  flex: 1;
  overflow: auto;
  display: flex;
  background-color: var(--app-bg-color-secondary);
  padding: var(--app-space-m);
  user-select: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--app-bg-color-secondary);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-border-color);
    border-radius: 4px;

    &:hover {
      background: var(--app-text-color-disabled);
    }
  }
}

.cropCanvas {
  box-shadow: var(--app-shadow-l);
  flex-shrink: 0;
  margin: auto;
  align-self: flex-start;
}

.cropActions {
  padding: var(--app-space-m);
  display: flex;
  justify-content: center;
  gap: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
  background-color: var(--app-bg-color);
  flex-shrink: 0;
}
</style>
