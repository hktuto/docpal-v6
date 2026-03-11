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

// Store selection in ORIGINAL image coordinates (not display coordinates)
// This ensures selection persists through zoom changes
const selectionInOriginalCoords = ref<{ x: number; y: number; width: number; height: number } | null>(null)

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

// Current effective scale = base scale * zoom
const effectiveScale = computed(() => {
  return baseScale.value * zoomScale.value
})

// Canvas cursor
const canvasCursor = computed(() => {
  if (isResizing.value) return 'grabbing'
  if (isDragging.value) return 'grabbing'
  return 'crosshair'
})

// Interaction state
const isDrawing = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<number>(-1)
const startPosInOriginalCoords = ref({ x: 0, y: 0 })
const selectionStartInOriginalCoords = ref({ x: 0, y: 0, width: 0, height: 0 })

// Pan state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })

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

// Draw selection overlay
function drawSelection(ctx: CanvasRenderingContext2D) {
  if (!selectionInOriginalCoords.value) return

  const { x, y, width, height } = selectionInOriginalCoords.value
  const scale = effectiveScale.value

  // Convert to display coordinates
  const displayX = x * scale
  const displayY = y * scale
  const displayW = width * scale
  const displayH = height * scale

  // Draw semi-transparent overlay outside selection
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Clear the selection area
  ctx.clearRect(displayX, displayY, displayW, displayH)

  // Redraw image in selection area (from original source for clarity)
  ctx.drawImage(
    imageObj.value!,
    x, y, width, height,
    displayX, displayY, displayW, displayH
  )

  // Draw selection border
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.strokeRect(displayX, displayY, displayW, displayH)

  // Draw resize handles
  const handles = [
    { x: displayX, y: displayY },
    { x: displayX + displayW, y: displayY },
    { x: displayX, y: displayY + displayH },
    { x: displayX + displayW, y: displayY + displayH }
  ]

  ctx.fillStyle = '#409eff'
  handles.forEach(handle => {
    ctx.fillRect(handle.x - 5, handle.y - 5, 10, 10)
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

  // Calculate the point on the ORIGINAL image that we're zooming towards
  const oldScale = baseScale.value * zoomScale.value
  const imageX = focus.x / oldScale
  const imageY = focus.y / oldScale

  zoomScale.value = clampedZoom

  nextTick(() => {
    const newScale = baseScale.value * zoomScale.value
    canvas.width = img.naturalWidth * newScale
    canvas.height = img.naturalHeight * newScale

    // Redraw canvas (selection will be redrawn at new scale automatically)
    drawCanvas()

    // Adjust scroll to keep the focal point at the same position
    const newFocusX = imageX * newScale
    const newFocusY = imageY * newScale

    container.scrollLeft = newFocusX - focus.x + container.scrollLeft
    container.scrollTop = newFocusY - focus.y + container.scrollTop

    // Apply margins if canvas fits in container
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

// Mouse handlers
function handleMouseDown(event: MouseEvent) {
  if (!containerRef.value || !canvasRef.value || !imageObj.value) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const displayX = event.clientX - rect.left
  const displayY = event.clientY - rect.top

  // Convert to original coordinates
  const originalPos = displayToOriginal(displayX, displayY)

  // Check if clicking on resize handle (only if selection exists)
  if (selectionInOriginalCoords.value) {
    const { x, y, width, height } = selectionInOriginalCoords.value
    const scale = effectiveScale.value

    // Convert handle positions to display coordinates for hit testing
    const handles = [
      { x: x * scale, y: y * scale, idx: 0 },
      { x: (x + width) * scale, y: y * scale, idx: 1 },
      { x: x * scale, y: (y + height) * scale, idx: 2 },
      { x: (x + width) * scale, y: (y + height) * scale, idx: 3 }
    ]

    for (const handle of handles) {
      if (Math.abs(displayX - handle.x) < 10 && Math.abs(displayY - handle.y) < 10) {
        isResizing.value = true
        resizeHandle.value = handle.idx
        startPosInOriginalCoords.value = { ...originalPos }
        selectionStartInOriginalCoords.value = { ...selectionInOriginalCoords.value }
        return
      }
    }
  }

  // Start new selection in original coordinates
  isDrawing.value = true
  startPosInOriginalCoords.value = { ...originalPos }
  selectionInOriginalCoords.value = { x: originalPos.x, y: originalPos.y, width: 0, height: 0 }
}

function handleMouseMove(event: MouseEvent) {
  if (!canvasRef.value || !imageObj.value) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const displayX = event.clientX - rect.left
  const displayY = event.clientY - rect.top

  // Convert to original coordinates
  const originalPos = displayToOriginal(displayX, displayY)

  if (isResizing.value && selectionInOriginalCoords.value) {
    const start = startPosInOriginalCoords.value
    const selStart = selectionStartInOriginalCoords.value
    const newSelection = { ...selectionInOriginalCoords.value }

    switch (resizeHandle.value) {
      case 0: // Top-left
        newSelection.x = Math.min(originalPos.x, selStart.x + selStart.width)
        newSelection.y = Math.min(originalPos.y, selStart.y + selStart.height)
        newSelection.width = Math.abs(selStart.x + selStart.width - originalPos.x)
        newSelection.height = Math.abs(selStart.y + selStart.height - originalPos.y)
        break
      case 1: // Top-right
        newSelection.x = selStart.x
        newSelection.y = Math.min(originalPos.y, selStart.y + selStart.height)
        newSelection.width = Math.abs(originalPos.x - selStart.x)
        newSelection.height = Math.abs(selStart.y + selStart.height - originalPos.y)
        break
      case 2: // Bottom-left
        newSelection.x = Math.min(originalPos.x, selStart.x + selStart.width)
        newSelection.y = selStart.y
        newSelection.width = Math.abs(selStart.x + selStart.width - originalPos.x)
        newSelection.height = Math.abs(originalPos.y - selStart.y)
        break
      case 3: // Bottom-right
        newSelection.x = selStart.x
        newSelection.y = selStart.y
        newSelection.width = Math.abs(originalPos.x - selStart.x)
        newSelection.height = Math.abs(originalPos.y - selStart.y)
        break
    }

    // Enforce minimum size in original coordinates (10 pixels at current zoom)
    const minSize = 10 / effectiveScale.value
    if (newSelection.width >= minSize && newSelection.height >= minSize) {
      selectionInOriginalCoords.value = newSelection
      drawCanvas()
    }
  } else if (isDrawing.value) {
    const start = startPosInOriginalCoords.value
    selectionInOriginalCoords.value = {
      x: Math.min(start.x, originalPos.x),
      y: Math.min(start.y, originalPos.y),
      width: Math.abs(originalPos.x - start.x),
      height: Math.abs(originalPos.y - start.y)
    }
    drawCanvas()
  } else if (isDragging.value && containerRef.value) {
    // Handle pan
    event.preventDefault()
    const container = containerRef.value
    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y
    container.scrollLeft = scrollStart.value.x - dx
    container.scrollTop = scrollStart.value.y - dy
  }
}

function handleMouseUp() {
  isResizing.value = false
  isDrawing.value = false
  isDragging.value = false
  resizeHandle.value = -1
  if (containerRef.value) {
    containerRef.value.style.cursor = ''
  }
}

function handleMouseLeave() {
  isResizing.value = false
  isDrawing.value = false
  isDragging.value = false
  resizeHandle.value = -1
  if (containerRef.value) {
    containerRef.value.style.cursor = ''
  }
}

// Handle pan drag start
function handlePanStart(event: MouseEvent) {
  if (isDrawing.value || isResizing.value) return
  if (!containerRef.value) return

  const container = containerRef.value
  const canvas = canvasRef.value
  if (!canvas) return

  // Only pan if canvas is larger than container
  const canPanHorizontal = canvas.width > container.clientWidth
  const canPanVertical = canvas.height > container.clientHeight

  if (!canPanHorizontal && !canPanVertical) return

  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  scrollStart.value = { x: container.scrollLeft, y: container.scrollTop }
  container.style.cursor = 'grabbing'
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

// Expose methods
defineExpose({
  startCrop
})

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
        <Icon name="lucide:crop" />
        Drag to select region
      </div>
    </div>

    <!-- Canvas Container -->
    <div
      ref="containerRef"
      v-loading="loading || imageLoading"
      class="cropBody"
      @wheel="handleWheel"
      @mousedown="handlePanStart"
    >
      <canvas
        v-if="imageObj"
        ref="canvasRef"
        class="cropCanvas"
        :style="{ cursor: canvasCursor }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
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
  color: var(--app-primary-color);
  font-size: var(--app-font-size-s);
  font-weight: 500;
}

.cropBody {
  flex: 1;
  overflow: auto;
  display: flex;
  background-color: var(--app-bg-color-secondary);
  padding: var(--app-space-m);
  user-select: none;

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
