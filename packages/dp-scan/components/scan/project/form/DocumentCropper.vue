<template>
  <div class="document-cropper">
    <!-- Header with zoom controls -->
    <div class="cropper-header">
      <div class="zoom-controls">
        <el-button 
          :icon="Minus" 
          circle 
          size="small"
          :disabled="zoomScale <= MIN_ZOOM"
          @click="zoomOut"
        />
        <span class="zoom-text">{{ Math.round(zoomScale * 100) }}%</span>
        <el-button 
          :icon="Plus" 
          circle 
          size="small"
          :disabled="zoomScale >= MAX_ZOOM"
          @click="zoomIn"
        />
        <el-button 
          size="small"
          @click="resetZoom"
        >
          Reset
        </el-button>
      </div>
    </div>

    <!-- Canvas Container -->
    <div 
      ref="containerRef"
      class="canvas-container"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          cursor: isPanning ? 'grabbing' : isOverCrop ? 'pointer' : isOverHandle ? getHandleCursor(resizeHandle) : 'default'
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { Minus, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// ==================== Types ====================
interface CropItem {
  id: string | number
  x: number
  y: number
  width: number
  height: number
  color: string
  isEditing: boolean
  [key: string]: any
}

interface CropInput {
  id: string | number
  color?: string
  [key: string]: any
}

interface CropOutput {
  id: string | number
  zone: string
  color: string
  [key: string]: any
}

// ==================== Constants ====================
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4.0
const ZOOM_STEP = 0.25
const DEFAULT_CROP_SIZE = 200
const MIN_CROP_SIZE = 20
const HANDLE_SIZE = 10
const BUTTON_HEIGHT = 28
const BUTTON_GAP = 8

// Random vibrant colors for crops
const CROP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#6C5CE7', '#A29BFE', '#FD79A8'
]

// ==================== Emits ====================
const emit = defineEmits<{
  update: [crop: CropOutput]
  remove: [cropId: string | number]
}>()

// ==================== Refs ====================
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D | null>(null)

// Image
const image = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)

// Canvas dimensions (in display pixels)
const baseScale = ref(1) // Scale to fit container initially
const zoomScale = ref(1) // User zoom
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Crops
const crops = ref<CropItem[]>([])
const activeCropId = ref<string | number | null>(null)

// Interactions
const isPanning = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const isOverCrop = ref(false)
const isOverHandle = ref(false)
const isOverButton = ref(false)

// Mouse tracking
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const panStartX = ref(0)
const panStartY = ref(0)
const panStartScrollLeft = ref(0)
const panStartScrollTop = ref(0)

// Button rectangles for hit testing (in display pixels)
const buttonRects = ref<Map<string | number, { confirm: DOMRect | null, remove: DOMRect | null }>>(new Map())

// ==================== Computed ====================
const effectiveScale = computed(() => baseScale.value * zoomScale.value)

const activeCrop = computed(() => {
  if (!activeCropId.value) return null
  return crops.value.find(c => c.id === activeCropId.value) || null
})

// ==================== Public Methods ====================

/**
 * Initialize the cropper with image URL and existing crops
 */
function init(imageUrl: string, existingCrops?: CropInput[]) {
  // Reset state
  crops.value = []
  activeCropId.value = null
  zoomScale.value = 1
  
  // Load image
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    image.value = img
    imageLoaded.value = true
    
    // Calculate base scale to fit container
    calculateBaseScale()
    
    // Set canvas dimensions
    updateCanvasDimensions()
    
    // Add existing crops
    if (existingCrops?.length) {
      existingCrops.forEach(cropInput => {
        const crop = parseCropInput(cropInput)
        crops.value.push({
          ...crop,
          isEditing: false
        })
      })
    }
    
    // Draw initial canvas
    nextTick(() => {
      initCanvas()
      drawCanvas()
    })
  }
  img.onerror = () => {
    ElMessage.error('Failed to load image')
  }
  img.src = imageUrl
}

/**
 * Add a new crop at viewport center
 */
function addCrop(cropInput: CropInput) {
  if (!imageLoaded.value || !containerRef.value) {
    console.warn('Cannot add crop: image not loaded')
    return
  }

  const container = containerRef.value
  const scale = effectiveScale.value
  
  // Calculate viewport center in original image coordinates
  const viewportCenterX = container.scrollLeft + container.clientWidth / 2
  const viewportCenterY = container.scrollTop + container.clientHeight / 2
  
  const x = Math.max(0, (viewportCenterX / scale) - DEFAULT_CROP_SIZE / 2)
  const y = Math.max(0, (viewportCenterY / scale) - DEFAULT_CROP_SIZE / 2)
  
  // Ensure crop stays within image bounds
  const maxX = (canvasWidth.value / scale) - DEFAULT_CROP_SIZE
  const maxY = (canvasHeight.value / scale) - DEFAULT_CROP_SIZE
  
  const crop: CropItem = {
    id: cropInput.id,
    x: Math.min(x, maxX),
    y: Math.min(y, maxY),
    width: DEFAULT_CROP_SIZE,
    height: DEFAULT_CROP_SIZE,
    color: cropInput.color || getRandomColor(),
    isEditing: true,
    ...cropInput
  }
  
  // Exit edit mode for any existing crop
  crops.value.forEach(c => c.isEditing = false)
  
  // Add new crop
  crops.value.push(crop)
  activeCropId.value = crop.id
  
  drawCanvas()
}

// ==================== Helper Functions ====================

function getRandomColor(): string {
  return CROP_COLORS[Math.floor(Math.random() * CROP_COLORS.length)]
}

function parseCropInput(input: CropInput): CropItem {
  // Parse zone string "x1,y1,x2,y2" if provided
  let x = 0, y = 0, width = DEFAULT_CROP_SIZE, height = DEFAULT_CROP_SIZE
  
  if ('zone' in input && typeof input.zone === 'string') {
    const coords = input.zone.split(',').map(Number)
    if (coords.length === 4) {
      x = coords[0]
      y = coords[1]
      width = coords[2] - coords[0]
      height = coords[3] - coords[1]
    }
  }
  
  return {
    ...input,
    x,
    y,
    width,
    height,
    color: input.color || getRandomColor(),
    isEditing: false
  }
}

function calculateBaseScale() {
  if (!image.value || !containerRef.value) return
  
  const container = containerRef.value
  const img = image.value
  
  const scaleX = container.clientWidth / img.naturalWidth
  const scaleY = container.clientHeight / img.naturalHeight
  
  // Fit to container while maintaining aspect ratio
  baseScale.value = Math.min(scaleX, scaleY, 1)
}

function updateCanvasDimensions() {
  if (!image.value) return
  
  const scale = effectiveScale.value
  canvasWidth.value = image.value.naturalWidth * scale
  canvasHeight.value = image.value.naturalHeight * scale
}

function initCanvas() {
  if (!canvasRef.value) return
  ctx.value = canvasRef.value.getContext('2d')
}

// ==================== Drawing ====================

function drawCanvas() {
  if (!ctx.value || !image.value) return
  
  const context = ctx.value
  const canvas = canvasRef.value!
  
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw image
  context.drawImage(image.value, 0, 0, canvas.width, canvas.height)
  
  // Clear button rects
  buttonRects.value.clear()
  
  // Draw all crops
  crops.value.forEach(crop => {
    drawCrop(context, crop)
  })
}

function drawCrop(context: CanvasRenderingContext2D, crop: CropItem) {
  const scale = effectiveScale.value
  const displayX = crop.x * scale
  const displayY = crop.y * scale
  const displayW = crop.width * scale
  const displayH = crop.height * scale
  
  const isEditing = crop.id === activeCropId.value
  
  // Draw crop rectangle
  context.save()
  
  // Semi-transparent fill
  const rgb = hexToRgb(crop.color)
  context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isEditing ? 0.2 : 0.1})`
  context.fillRect(displayX, displayY, displayW, displayH)
  
  // Border
  context.strokeStyle = crop.color
  context.lineWidth = isEditing ? 3 : 2
  context.strokeRect(displayX, displayY, displayW, displayH)
  
  context.restore()
  
  // Draw resize handles and buttons if editing
  if (isEditing) {
    drawResizeHandles(context, displayX, displayY, displayW, displayH, crop.color)
    drawButtons(context, crop, displayX, displayY, displayW, displayH)
  }
}

function drawResizeHandles(
  context: CanvasRenderingContext2D, 
  x: number, y: number, w: number, h: number, 
  color: string
) {
  const halfHandle = HANDLE_SIZE / 2
  const handles = [
    { name: 'nw', x: x - halfHandle, y: y - halfHandle },
    { name: 'ne', x: x + w - halfHandle, y: y - halfHandle },
    { name: 'sw', x: x - halfHandle, y: y + h - halfHandle },
    { name: 'se', x: x + w - halfHandle, y: y + h - halfHandle }
  ]
  
  context.save()
  handles.forEach(handle => {
    context.fillStyle = '#ffffff'
    context.strokeStyle = color
    context.lineWidth = 2
    context.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE)
    context.strokeRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE)
  })
  context.restore()
}

function drawButtons(
  context: CanvasRenderingContext2D,
  crop: CropItem,
  x: number, y: number, w: number, h: number
) {
  const buttonY = y + h + BUTTON_GAP
  
  // Button dimensions
  const confirmText = 'Confirm'
  const removeText = 'Remove'
  
  context.font = '12px Arial'
  const confirmWidth = context.measureText(confirmText).width + 24
  const removeWidth = context.measureText(removeText).width + 24
  
  const totalWidth = confirmWidth + removeWidth + BUTTON_GAP
  const startX = x + (w - totalWidth) / 2
  
  // Draw Confirm button
  const confirmRect = { 
    left: startX, 
    top: buttonY, 
    right: startX + confirmWidth, 
    bottom: buttonY + BUTTON_HEIGHT 
  }
  drawButton(context, confirmRect, confirmText, '#409eff', '#ffffff')
  
  // Draw Remove button
  const removeRect = { 
    left: startX + confirmWidth + BUTTON_GAP, 
    top: buttonY, 
    right: startX + confirmWidth + BUTTON_GAP + removeWidth, 
    bottom: buttonY + BUTTON_HEIGHT 
  }
  drawButton(context, removeRect, removeText, '#f56c6c', '#ffffff')
  
  // Store button rects for hit testing
  buttonRects.value.set(crop.id, {
    confirm: new DOMRect(confirmRect.left, confirmRect.top, confirmWidth, BUTTON_HEIGHT),
    remove: new DOMRect(removeRect.left, removeRect.top, removeWidth, BUTTON_HEIGHT)
  })
}

function drawButton(
  context: CanvasRenderingContext2D,
  rect: { left: number, top: number, right: number, bottom: number },
  text: string,
  bgColor: string,
  textColor: string
) {
  const width = rect.right - rect.left
  const height = rect.bottom - rect.top
  const radius = 4
  
  context.save()
  
  // Button background
  context.fillStyle = bgColor
  roundRect(context, rect.left, rect.top, width, height, radius)
  context.fill()
  
  // Button text
  context.fillStyle = textColor
  context.font = '12px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, rect.left + width / 2, rect.top + height / 2)
  
  context.restore()
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  context.beginPath()
  context.moveTo(x + r, y)
  context.lineTo(x + w - r, y)
  context.quadraticCurveTo(x + w, y, x + w, y + r)
  context.lineTo(x + w, y + h - r)
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  context.lineTo(x + r, y + h)
  context.quadraticCurveTo(x, y + h, x, y + h - r)
  context.lineTo(x, y + r)
  context.quadraticCurveTo(x, y, x + r, y)
  context.closePath()
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

// ==================== Zoom ====================

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  
  if (!containerRef.value) return
  
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomScale.value + delta))
  
  if (newZoom !== zoomScale.value) {
    // Zoom towards mouse position
    const container = containerRef.value
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left + container.scrollLeft
    const mouseY = e.clientY - rect.top + container.scrollTop
    
    const oldScale = effectiveScale.value
    zoomScale.value = newZoom
    const newScale = effectiveScale.value
    
    updateCanvasDimensions()
    
    // Adjust scroll to zoom towards mouse
    const scaleRatio = newScale / oldScale
    container.scrollLeft = mouseX * scaleRatio - (mouseX - container.scrollLeft)
    container.scrollTop = mouseY * scaleRatio - (mouseY - container.scrollTop)
    
    drawCanvas()
  }
}

function zoomIn() {
  if (zoomScale.value < MAX_ZOOM) {
    zoomScale.value = Math.min(MAX_ZOOM, zoomScale.value + ZOOM_STEP)
    updateCanvasDimensions()
    drawCanvas()
  }
}

function zoomOut() {
  if (zoomScale.value > MIN_ZOOM) {
    zoomScale.value = Math.max(MIN_ZOOM, zoomScale.value - ZOOM_STEP)
    updateCanvasDimensions()
    drawCanvas()
  }
}

function resetZoom() {
  zoomScale.value = 1
  updateCanvasDimensions()
  drawCanvas()
}

// ==================== Mouse Events ====================

function getMousePos(e: MouseEvent): { x: number, y: number } {
  if (!containerRef.value) return { x: 0, y: 0 }
  const container = containerRef.value
  return {
    x: e.clientX - container.getBoundingClientRect().left + container.scrollLeft,
    y: e.clientY - container.getBoundingClientRect().top + container.scrollTop
  }
}

function getHandleAtPos(mouseX: number, mouseY: number, crop: CropItem): string | null {
  const scale = effectiveScale.value
  const x = crop.x * scale
  const y = crop.y * scale
  const w = crop.width * scale
  const h = crop.height * scale
  const halfHandle = HANDLE_SIZE / 2
  
  const handles = [
    { name: 'nw', x: x - halfHandle, y: y - halfHandle },
    { name: 'ne', x: x + w - halfHandle, y: y - halfHandle },
    { name: 'sw', x: x - halfHandle, y: y + h - halfHandle },
    { name: 'se', x: x + w - halfHandle, y: y + h - halfHandle }
  ]
  
  for (const handle of handles) {
    if (
      mouseX >= handle.x &&
      mouseX <= handle.x + HANDLE_SIZE &&
      mouseY >= handle.y &&
      mouseY <= handle.y + HANDLE_SIZE
    ) {
      return handle.name
    }
  }
  
  return null
}

function getCropAtPos(mouseX: number, mouseY: number): CropItem | null {
  // Check in reverse order (top-most first)
  for (let i = crops.value.length - 1; i >= 0; i--) {
    const crop = crops.value[i]
    const scale = effectiveScale.value
    const x = crop.x * scale
    const y = crop.y * scale
    const w = crop.width * scale
    const h = crop.height * scale
    
    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
      return crop
    }
  }
  return null
}

function getButtonAtPos(mouseX: number, mouseY: number, crop: CropItem): 'confirm' | 'remove' | null {
  const rects = buttonRects.value.get(crop.id)
  if (!rects) return null
  
  if (rects.confirm && 
      mouseX >= rects.confirm.left && 
      mouseX <= rects.confirm.right &&
      mouseY >= rects.confirm.top && 
      mouseY <= rects.confirm.bottom) {
    return 'confirm'
  }
  
  if (rects.remove && 
      mouseX >= rects.remove.left && 
      mouseX <= rects.remove.right &&
      mouseY >= rects.remove.top && 
      mouseY <= rects.remove.bottom) {
    return 'remove'
  }
  
  return null
}

function handleMouseDown(e: MouseEvent) {
  if (!containerRef.value) return
  
  const { x, y } = getMousePos(e)
  lastMouseX.value = x
  lastMouseY.value = y
  
  // Check if clicking active crop's buttons
  if (activeCropId.value) {
    const activeCrop = crops.value.find(c => c.id === activeCropId.value)
    if (activeCrop) {
      const button = getButtonAtPos(x, y, activeCrop)
      if (button === 'confirm') {
        confirmCrop(activeCrop)
        return
      } else if (button === 'remove') {
        removeCrop(activeCrop.id)
        return
      }
    }
  }
  
  // Check if clicking a handle on active crop
  if (activeCropId.value) {
    const activeCrop = crops.value.find(c => c.id === activeCropId.value)
    if (activeCrop) {
      const handle = getHandleAtPos(x, y, activeCrop)
      if (handle) {
        isResizing.value = true
        resizeHandle.value = handle
        return
      }
    }
  }
  
  // Check if clicking inside a crop
  const clickedCrop = getCropAtPos(x, y)
  if (clickedCrop) {
    // Exit edit mode for current crop
    crops.value.forEach(c => c.isEditing = false)
    // Enter edit mode for clicked crop
    clickedCrop.isEditing = true
    activeCropId.value = clickedCrop.id
    drawCanvas()
    return
  }
  
  // Clicked empty area - exit edit mode
  if (activeCropId.value) {
    crops.value.forEach(c => c.isEditing = false)
    activeCropId.value = null
    drawCanvas()
  }
  
  // Start panning
  isPanning.value = true
  panStartX.value = e.clientX
  panStartY.value = e.clientY
  panStartScrollLeft.value = containerRef.value.scrollLeft
  panStartScrollTop.value = containerRef.value.scrollTop
}

function handleMouseMove(e: MouseEvent) {
  if (!containerRef.value) return
  
  const { x, y } = getMousePos(e)
  
  // Handle panning
  if (isPanning.value) {
    const dx = e.clientX - panStartX.value
    const dy = e.clientY - panStartY.value
    containerRef.value.scrollLeft = panStartScrollLeft.value - dx
    containerRef.value.scrollTop = panStartScrollTop.value - dy
    return
  }
  
  // Handle resizing
  if (isResizing.value && activeCropId.value && resizeHandle.value) {
    const crop = crops.value.find(c => c.id === activeCropId.value)
    if (!crop) return
    
    const scale = effectiveScale.value
    const dx = (x - lastMouseX.value) / scale
    const dy = (y - lastMouseY.value) / scale
    
    resizeCrop(crop, resizeHandle.value, dx, dy)
    lastMouseX.value = x
    lastMouseY.value = y
    drawCanvas()
    return
  }
  
  // Update cursor and hover states
  updateHoverState(x, y)
}

function handleMouseUp() {
  isPanning.value = false
  isResizing.value = false
  resizeHandle.value = null
}

function updateHoverState(mouseX: number, mouseY: number) {
  isOverButton.value = false
  isOverHandle.value = false
  isOverCrop.value = false
  resizeHandle.value = null
  
  // Check buttons on active crop
  if (activeCropId.value) {
    const activeCrop = crops.value.find(c => c.id === activeCropId.value)
    if (activeCrop) {
      const button = getButtonAtPos(mouseX, mouseY, activeCrop)
      if (button) {
        isOverButton.value = true
        return
      }
      
      const handle = getHandleAtPos(mouseX, mouseY, activeCrop)
      if (handle) {
        isOverHandle.value = true
        resizeHandle.value = handle
        return
      }
    }
  }
  
  // Check crops
  const crop = getCropAtPos(mouseX, mouseY)
  if (crop) {
    isOverCrop.value = true
  }
}

function getHandleCursor(handle: string | null): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize'
    case 'ne':
    case 'sw':
      return 'nesw-resize'
    default:
      return 'default'
  }
}

// ==================== Crop Operations ====================

function resizeCrop(crop: CropItem, handle: string, dx: number, dy: number) {
  const minSize = MIN_CROP_SIZE / effectiveScale.value
  
  switch (handle) {
    case 'nw':
      crop.x = Math.min(crop.x + dx, crop.x + crop.width - minSize)
      crop.y = Math.min(crop.y + dy, crop.y + crop.height - minSize)
      crop.width = Math.max(crop.width - dx, minSize)
      crop.height = Math.max(crop.height - dy, minSize)
      break
    case 'ne':
      crop.y = Math.min(crop.y + dy, crop.y + crop.height - minSize)
      crop.width = Math.max(crop.width + dx, minSize)
      crop.height = Math.max(crop.height - dy, minSize)
      break
    case 'sw':
      crop.x = Math.min(crop.x + dx, crop.x + crop.width - minSize)
      crop.width = Math.max(crop.width - dx, minSize)
      crop.height = Math.max(crop.height + dy, minSize)
      break
    case 'se':
      crop.width = Math.max(crop.width + dx, minSize)
      crop.height = Math.max(crop.height + dy, minSize)
      break
  }
}

function confirmCrop(crop: CropItem) {
  crop.isEditing = false
  activeCropId.value = null
  
  // Emit update event
  const output: CropOutput = {
    ...crop,
    zone: `${Math.round(crop.x)},${Math.round(crop.y)},${Math.round(crop.x + crop.width)},${Math.round(crop.y + crop.height)}`
  }
  
  emit('update', output)
  drawCanvas()
}

function removeCrop(cropId: string | number) {
  // Remove from local array
  const index = crops.value.findIndex(c => c.id === cropId)
  if (index > -1) {
    crops.value.splice(index, 1)
  }
  
  activeCropId.value = null
  buttonRects.value.delete(cropId)
  
  // Emit remove event
  emit('remove', cropId)
  drawCanvas()
}

// ==================== Expose ====================
defineExpose({
  init,
  addCrop
})
</script>

<style scoped>
.document-cropper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-text {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  min-width: 50px;
  text-align: center;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #e0e0e0;
}

canvas {
  display: block;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
