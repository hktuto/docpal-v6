<script lang="ts" setup>
import { useBatchDetailContext } from '#imports'

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access (no .value needed in template)
const { 
  previewLoading, 
  previewImgUrl, 
  currentPageNumber, 
  totalPages, 
  highlightedSection, 
  highlightedField,
  changePage,
  currentSelectedDoc
} = context

// Check if current document has error status
const hasError = computed(() => {
  const status = currentSelectedDoc.value?.status
  return status?.includes('fail') || status === 'error'
})

// Canvas refs
const canvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLDivElement>()

// Image loading state
const imageObj = ref<HTMLImageElement>()
const imageLoading = ref(false)

// Zoom state
const zoomScale = ref(1) // 1 = 100%, can be >1 for zoom in, <1 for zoom out
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.2

// Pan state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })

// Calculate base scale to fit image in container (fit-to-screen)
const baseScale = computed(() => {
  const img = imageObj.value
  const container = containerRef.value
  if (!img || !container) return 1
  
  const containerRect = container.getBoundingClientRect()
  return Math.min(
    containerRect.width / img.naturalWidth,
    containerRect.height / img.naturalHeight,
    1 // Don't upscale beyond 100%
  )
})

// Current effective scale = base scale * zoom
const effectiveScale = computed(() => {
  return baseScale.value * zoomScale.value
})

// Parse zone string to coordinates
function parseZone(zone: string): { x: number; y: number; width: number; height: number } | null {
  if (!zone) return null
  const parts = zone.split(',').map(p => parseFloat(p.trim()))
  if (parts.length !== 4 || parts.some(isNaN)) return null
  const [x1, y1, x2, y2] = parts
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  }
}

// Draw image and highlights on canvas
function drawCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  const img = imageObj.value
  
  if (!canvas || !container || !img) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const scale = effectiveScale.value
  
  const displayWidth = img.naturalWidth * scale
  const displayHeight = img.naturalHeight * scale
  
  // Set canvas size
  canvas.width = displayWidth
  canvas.height = displayHeight
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw image
  ctx.drawImage(img, 0, 0, displayWidth, displayHeight)
  
  // Draw section highlight if on current page
  if (highlightedSection.value && currentPageNumber.value === highlightedSection.value.page) {
    const zone = parseZone(highlightedSection.value.zone)
    if (zone) {
      drawHighlightBox(ctx, zone, scale, '#409EFF', 2) // Blue for section
    }
  }
  
  // Draw field highlight if on current page
  if (highlightedField.value && currentPageNumber.value === highlightedField.value.page) {
    const zone = parseZone(highlightedField.value.zone)
    if (zone) {
      drawHighlightBox(ctx, zone, scale, '#67C23A', 2) // Green for field
    }
  }
}

// Draw a single highlight box
function drawHighlightBox(
  ctx: CanvasRenderingContext2D,
  zone: { x: number; y: number; width: number; height: number },
  scale: number,
  color: string,
  lineWidth: number
) {
  const x = zone.x * scale
  const y = zone.y * scale
  const w = zone.width * scale
  const h = zone.height * scale
  
  // Draw semi-transparent fill
  ctx.fillStyle = color + '20' // 20 hex = ~12% opacity
  ctx.fillRect(x, y, w, h)
  
  // Draw border
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.strokeRect(x, y, w, h)
  
  // Draw corner handles
  const handleSize = 6
  ctx.fillStyle = color
  
  // Top-left
  ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
  // Top-right
  ctx.fillRect(x + w - handleSize/2, y - handleSize/2, handleSize, handleSize)
  // Bottom-left
  ctx.fillRect(x - handleSize/2, y + h - handleSize/2, handleSize, handleSize)
  // Bottom-right
  ctx.fillRect(x + w - handleSize/2, y + h - handleSize/2, handleSize, handleSize)
}

// Center the canvas in the container
function centerCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return
  
  // Reset margins before calculating (in case of zoom change)
  canvas.style.marginLeft = ''
  canvas.style.marginRight = ''
  canvas.style.marginTop = ''
  canvas.style.marginBottom = ''
  
  // Only center if canvas is larger than container (scrollable)
  const maxScrollLeft = canvas.width - container.clientWidth
  const maxScrollTop = canvas.height - container.clientHeight
  
  if (maxScrollLeft > 0) {
    container.scrollLeft = maxScrollLeft / 2
  } else {
    // Canvas fits horizontally - center via flexbox by adding margin
    canvas.style.marginLeft = 'auto'
    canvas.style.marginRight = 'auto'
  }
  
  if (maxScrollTop > 0) {
    container.scrollTop = maxScrollTop / 2
  } else {
    // Canvas fits vertically - center via flexbox by adding margin
    canvas.style.marginTop = 'auto'
    canvas.style.marginBottom = 'auto'
  }
}

// Load image when preview URL changes
watch(() => previewImgUrl.value, (url) => {
  if (!url) return
  
  // Reset zoom when new image loads
  zoomScale.value = 1
  
  imageLoading.value = true
  const img = new Image()
  img.onload = () => {
    imageObj.value = img
    imageLoading.value = false
    nextTick(() => {
      drawCanvas()
      // Center canvas after drawing
      nextTick(() => centerCanvas())
    })
  }
  img.onerror = () => {
    imageLoading.value = false
  }
  img.src = url
}, { immediate: true })

// Redraw when highlights change
watch(() => highlightedSection.value, () => {
  drawCanvas()
}, { deep: true })

watch(() => highlightedField.value, () => {
  drawCanvas()
}, { deep: true })

// Redraw when zoom changes
watch(zoomScale, () => {
  nextTick(() => {
    drawCanvas()
    // Re-center after zoom change
    nextTick(() => centerCanvas())
  })
})

// Handle window resize - recalculate base scale but keep zoom level
function handleResize() {
  nextTick(() => drawCanvas())
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Zoom functions
function zoomIn() {
  const newZoom = zoomScale.value + ZOOM_STEP
  zoomScale.value = Math.min(newZoom, MAX_ZOOM)
}

function zoomOut() {
  const newZoom = zoomScale.value - ZOOM_STEP
  zoomScale.value = Math.max(newZoom, MIN_ZOOM)
}

function resetZoom() {
  zoomScale.value = 1
}

function fitToScreen() {
  zoomScale.value = 1
}

// Mouse wheel zoom
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = zoomScale.value + delta
  zoomScale.value = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM))
}

// Pan/drag functions
function handleMouseDown(event: MouseEvent) {
  if (!containerRef.value) return
  
  // Only start dragging if image is larger than container
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!canvas) return
  
  const canPanHorizontal = canvas.width > container.clientWidth
  const canPanVertical = canvas.height > container.clientHeight
  
  if (!canPanHorizontal && !canPanVertical) return
  
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  scrollStart.value = { x: container.scrollLeft, y: container.scrollTop }
  
  container.style.cursor = 'grabbing'
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !containerRef.value) return
  
  event.preventDefault()
  
  const container = containerRef.value
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  
  container.scrollLeft = scrollStart.value.x - dx
  container.scrollTop = scrollStart.value.y - dy
}

function handleMouseUp() {
  if (!containerRef.value) return
  
  isDragging.value = false
  containerRef.value.style.cursor = 'grab'
}

function handleMouseLeave() {
  if (isDragging.value) {
    handleMouseUp()
  }
}

// Navigation functions
function prevPage() {
  if (currentPageNumber.value && currentPageNumber.value > 1) {
    changePage(currentPageNumber.value - 1)
  }
}

function nextPage() {
  if (currentPageNumber.value && totalPages.value && 
      currentPageNumber.value < totalPages.value) {
    changePage(currentPageNumber.value + 1)
  }
}
</script>

<template>
  <div v-loading="previewLoading" class="previewContainer">
    <div class="previewHeader">
      <div class="action">
        <!-- Zoom Controls -->
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
      </div>
      <div class="pageNav">
        <ElButton 
          :disabled="(currentPageNumber || 1) <= 1" 
          link 
          @click="prevPage"
        >
          <Icon name="lucide:chevron-left" />
        </ElButton>
        
        <div class="pageNumbers">
          <span
            v-for="page in totalPages"
            :key="page"
            :class="{ num: true, active: currentPageNumber === page }"
            @click="changePage(page)"
          >
            {{ page }}
          </span>
        </div>
        
        <ElButton 
          :disabled="(currentPageNumber || 1) >= (totalPages || 1)" 
          link 
          @click="nextPage"
        >
          <Icon name="lucide:chevron-right" />
        </ElButton>
      </div>
      
      <div class="pageInfo">
        Page {{ currentPageNumber || 1 }} of {{ totalPages || 1 }}
      </div>
    </div>
    
    <div 
      ref="containerRef"
      v-loading="imageLoading" 
      class="previewBody"
      :class="{ canPan: effectiveScale > baseScale }"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <!-- Error State -->
      <div v-if="hasError" class="errorState">
        <Icon name="lucide:file-x" class="errorIcon" />
        <span class="errorText">Can Not Preview File</span>
      </div>
      <!-- Normal Preview -->
      <canvas
        v-else-if="previewImgUrl"
        ref="canvasRef"
        class="previewCanvas"
        :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
      />
      <ElEmpty v-else description="No preview available" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.previewContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.previewHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.action {
  flex: 1;
  display: flex;
  align-items: center;
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

.pageNav {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.pageNumbers {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.num {
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-color-secondary);
  cursor: pointer;
  border-radius: var(--app-radius-s);
  font-size: var(--app-font-size-s);
  
  &:hover {
    background-color: var(--app-bg-color-hover);
  }
  
  &.active {
    background-color: var(--app-primary-color);
    color: white;
    cursor: default;
  }
}

.pageInfo {
  flex: 1;
  text-align: right;
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.previewBody {
  flex: 1;
  overflow: auto;
  display: flex;
  background-color: var(--app-bg-color-secondary);
  padding: var(--app-space-m);
  cursor: grab;
  user-select: none;
  
  &.canPan {
    cursor: grab;
  }
  
  &:active {
    cursor: grabbing;
  }
  
  // Hide scrollbar when not needed
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

.previewCanvas {
  box-shadow: var(--app-shadow-l);
  flex-shrink: 0;
  
  // Center canvas when it's smaller than container
  // When canvas is larger, margins are cleared by centerCanvas() for scroll to work
  margin: auto;
  
  // Prevent flexbox from stretching the canvas
  align-self: flex-start;
}

.errorState {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);
  width: 100%;
  height: 100%;
}

.errorIcon {
  font-size: 48px;
  color: var(--app-error-color);
}

.errorText {
  font-size: var(--app-font-size-l);
}
</style>
