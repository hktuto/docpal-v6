<template>
  <div class="document-preview">
    <!-- Toolbar -->
    <div class="preview-toolbar">
      <div class="toolbar-left">
        <!-- Page Navigation -->
        <div v-if="pageCount > 1" class="page-nav">
          <ElButton
            circle
            size="small"
            :disabled="currentPage <= 1"
            @click="prevPage"
          >
            <template #icon>
              <ElIcon><ArrowLeft /></ElIcon>
            </template>
          </ElButton>
          <div class="page-input-wrapper">
            <ElInput
              v-model="pageInputValue"
              class="page-input"
              size="small"
              maxlength="4"
              @blur="handlePageInputBlur"
              @keyup.enter="handlePageInputConfirm"
            />
            <span class="page-separator">/</span>
            <span class="page-total">{{ pageCount }}</span>
          </div>
          <ElButton
            circle
            size="small"
            :disabled="currentPage >= pageCount"
            @click="nextPage"
          >
            <template #icon>
              <ElIcon><ArrowRight /></ElIcon>
            </template>
          </ElButton>
        </div>
        <slot name="toolbar-left" />
      </div>
      <div class="zoom-controls">
        <ElButton
          circle
          size="small"
          :disabled="zoom <= MIN_ZOOM"
          @click="zoomOut"
        >
          <template #icon>
            <ElIcon><ZoomOut /></ElIcon>
          </template>
        </ElButton>
        <span class="zoom-text">{{ Math.round(zoom * 100) }}%</span>
        <ElButton
          circle
          size="small"
          :disabled="zoom >= MAX_ZOOM"
          @click="zoomIn"
        >
          <template #icon>
            <ElIcon><ZoomIn /></ElIcon>
          </template>
        </ElButton>
        <ElButton size="small" @click="resetZoom">Reset</ElButton>
      </div>
    </div>

    <!-- Canvas Container -->
    <div
        v-loading="loading"
      ref="previewContainerRef"
      class="preview-container"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @wheel="handleWheel"
    >
      <div
        class="canvasWrapper"
        :style="canvasWrapperStyle"
      >
        <canvas id="canvas" ref="canvasRef" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fabric } from "fabric"
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'
import { watch, nextTick, onMounted, onUnmounted } from 'vue'

// ==================== Constants ====================
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4.0
const ZOOM_STEP = 0.25
const DEFAULT_CROP_SIZE = 200
const MIN_CROP_SIZE = 20
const HANDLE_SIZE = 20

const CROP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#6C5CE7', '#A29BFE', '#FD79A8'
]

// ==================== Types ====================
type CropType = 'section' | 'field' | 'qrcode'

export interface CropItem {
  id: string | number
  type: string
  page: number
  zone: string
  label?: string
  color?: string
  editable?: boolean
  [key: string]: any
}

export interface CropInput {
  id?: string | number
  type: CropType
  page?: number
  zone?: string
  label?: string
  editable?: boolean
  [key: string]: any
}

interface FabricCropItem {
  id: string | number
  rect: fabric.Rect
  editable: boolean
  isResizing: boolean
  resizeHandle: string | null
}

// ==================== Props & Emits ====================
export interface CropUpdateEvent {
  crop: CropItem
  imageData?: string  // Base64 encoded crop area image
}

const emit = defineEmits<{
  update: [event: CropUpdateEvent]
  remove: [cropId: string | number]
}>()

// ==================== State ====================
const canvasRef = ref<HTMLCanvasElement>()
const previewContainerRef = ref<HTMLDivElement>()
const canvasWrapperRef = ref<HTMLDivElement>()

// Fabric canvas instance
let canvas: fabric.Canvas | null = null

// Document data
const documentPaths = ref<string[]>([])
const currentPage = ref(1)
const pageCount = ref(0)
const pageImages = new Map<number, string>()
const pageInputValue = ref('1')
const loading = ref(false)

// Scale and zoom
const baseScale = ref(1) // Scale to fit container initially
const zoom = ref(1) // User zoom
const canvasSize = ref({ width: 0, height: 0 })

// ==================== Watchers ====================
watch(currentPage, (newPage) => {
  pageInputValue.value = String(newPage)
})

// ==================== Resize Handling ====================
function setupResizeObserver() {
  if (!previewContainerRef.value || typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect

      // Update reactive container size to trigger style re-computation
      containerSize.value = { width, height }

      // If canvas is smaller than container, re-center it by scrolling
      const scale = effectiveScale.value
      const scaledWidth = canvasSize.value.width * scale
      const scaledHeight = canvasSize.value.height * scale

      // Only auto-scroll if the canvas fits within the container
      // and we're not currently panning
      if (!isPanning.value && scaledWidth < width && scaledHeight < height) {
        // Center the scroll
        const container = previewContainerRef.value
        if (container) {
          container.scrollLeft = (scaledWidth - width) / 2
          container.scrollTop = (scaledHeight - height) / 2
        }
      }
    }
  })

  resizeObserver.observe(previewContainerRef.value)
}

function cleanupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// Crops
const crops = ref<CropItem[]>([])
const activeCropId = ref<string | number | null>(null)
const focusedCropId = ref<string | number | null>(null)
const fabricCrops = ref<Map<string | number, FabricCropItem>>(new Map())

// Pan state
const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)
const panStartScrollLeft = ref(0)
const panStartScrollTop = ref(0)

// Resize observer
let resizeObserver: ResizeObserver | null = null
const containerSize = ref({ width: 0, height: 0 })

// ==================== Computed ====================
const effectiveScale = computed(() => baseScale.value * zoom.value)

const canvasWrapperStyle = computed(() => {
  const scale = effectiveScale.value
  const width = canvasSize.value.width
  const height = canvasSize.value.height
  const scaledWidth = width * scale
  const scaledHeight = height * scale

  // Use reactive containerSize to trigger re-computation on resize
  // Falls back to direct container ref if size not yet captured
  const containerWidth = containerSize.value.width || previewContainerRef.value?.clientWidth || 0
  const containerHeight = containerSize.value.height || previewContainerRef.value?.clientHeight || 0

  // Calculate left offset to center the canvas
  // If scaled canvas is smaller than container, center it
  // If larger, start from 0 (left aligned)
  const leftOffset = scaledWidth < containerWidth
    ? (containerWidth - scaledWidth) / 2 / scale  // Divide by scale to get pre-transform offset
    : 0
  const topOffset = scaledHeight < containerHeight
    ? (containerHeight - scaledHeight) / 2 / scale
    : 0

  return {
    transform: `scale(${scale}) translate(${leftOffset}px, ${topOffset}px)`,
    transformOrigin: 'top left',
    width: `${width}px`,
    height: `${height}px`,
    // Set explicit size for the wrapper to enable proper scrolling
    // This is the actual space the element takes up after transform
    marginRight: `${scaledWidth - width}px`,
    marginBottom: `${scaledHeight - height}px`
  }
})

// ==================== Helper Functions ====================

function getRandomColor(): string {
  return CROP_COLORS[Math.floor(Math.random() * CROP_COLORS.length)]
}

function parseZoneString(zone: string): { x: number; y: number; width: number; height: number } | null {
  if (!zone) return null
  const coords = zone.split(',').map(Number)
  if (coords.length === 4) {
    return {
      x: coords[0],
      y: coords[1],
      width: coords[2] - coords[0],
      height: coords[3] - coords[1]
    }
  }
  return null
}

function zoneToString(x: number, y: number, width: number, height: number): string {
  return `${Math.round(x)},${Math.round(y)},${Math.round(x + width)},${Math.round(y + height)}`
}

function calculateBaseScale(): number {
  if (!previewContainerRef.value || !canvas) return 1

  const container = previewContainerRef.value
  const canvasWidth = canvas.getWidth()
  const canvasHeight = canvas.getHeight()

  if (canvasWidth === 0 || canvasHeight === 0) return 1

  // Calculate scale to fit container while maintaining aspect ratio
  const scaleX = container.clientWidth / canvasWidth
  const scaleY = container.clientHeight / canvasHeight

  // Use the smaller scale to ensure the canvas fits within the container
  baseScale.value = Math.min(scaleX, scaleY, 1)
  return baseScale.value
}

function updateCanvasScale() {
  // The scaling is handled via CSS transform on the wrapper
  // Canvas maintains its original dimensions for accurate calculations
}

// ==================== Lifecycle ====================
onMounted(() => {
  setupResizeObserver()
})

onUnmounted(() => {
  cleanupResizeObserver()
})

// ==================== Public Methods ====================

async function init(documentUrlList: string[], existingCrops?: CropItem[]) {
  focusedCropId.value = null
  documentPaths.value = documentUrlList
  pageCount.value = documentUrlList.length
  currentPage.value = 1
  crops.value = existingCrops || []
  activeCropId.value = null
  fabricCrops.value.clear()
  zoom.value = 1

  await getAllCropImages()
}


function focusCrop(cropId: string | number) {
  const crop = crops.value.find(c => c.id === cropId)
  if (!crop) {
    console.warn(`Crop with id ${cropId} not found`)
    return
  }

  // Set focused crop
  focusedCropId.value = cropId

  // If crop is on different page, navigate to that page
  if (crop.page !== currentPage.value) {
    loadPage(crop.page).then(() => {
      nextTick(() => {
        applyCropDimming()
        scrollToCrop(crop)
      })
    })
  } else {
    applyCropDimming()
    scrollToCrop(crop)
  }
}

function blur() {
  focusedCropId.value = null
  applyCropDimming()
}

function scrollToCrop(crop: CropItem) {
  if (!previewContainerRef.value || !canvas) return

  const container = previewContainerRef.value
  const zoneCoords = parseZoneString(crop.zone)
  if (!zoneCoords) return

  const scale = effectiveScale.value

  // Calculate crop center in scaled coordinates
  const cropCenterX = (zoneCoords.x + zoneCoords.width / 2) * scale
  const cropCenterY = (zoneCoords.y + zoneCoords.height / 2) * scale

  // Center the crop in the viewport
  const scrollLeft = cropCenterX - container.clientWidth / 2
  const scrollTop = cropCenterY - container.clientHeight / 2

  container.scrollLeft = Math.max(0, scrollLeft)
  container.scrollTop = Math.max(0, scrollTop)
}

function applyCropDimming() {
  if (!canvas) return

  fabricCrops.value.forEach((fabricCrop, id) => {
    const rect = fabricCrop.rect
    if (!rect) return

    if (focusedCropId.value === null) {
      // No focus - reset all to normal opacity
      rect.set({ opacity: 1 })
    } else if (id === focusedCropId.value) {
      // Focused crop - full opacity, bring to front
      rect.set({ opacity: 1 })
      canvas?.bringToFront(rect)
    } else {
      // Non-focused crops - dimmed
      rect.set({ opacity: 0.3 })
    }
  })

  canvas.renderAll()
}

function addCrop(cropInput: CropInput) {
  if (!canvas) {
    console.warn('Cannot add crop: canvas not initialized')
    return
  }

  const container = previewContainerRef.value
  if (!container) return

  // Generate random color if not provided
  const color = cropInput.color || getRandomColor()

  // Parse zone or create default at viewport center
  let zoneCoords = cropInput.zone ? parseZoneString(cropInput.zone) : null

  if (!zoneCoords) {
    // Calculate viewport center in canvas coordinates
    const viewportCenterX = container.scrollLeft + container.clientWidth / 2
    const viewportCenterY = container.scrollTop + container.clientHeight / 2

    // Convert to canvas coordinates (accounting for scale)
    const canvasX = viewportCenterX / effectiveScale.value
    const canvasY = viewportCenterY / effectiveScale.value

    // Create default crop size
    const x = Math.max(0, canvasX - DEFAULT_CROP_SIZE / 2)
    const y = Math.max(0, canvasY - DEFAULT_CROP_SIZE / 2)
    const maxX = canvasSize.value.width - DEFAULT_CROP_SIZE
    const maxY = canvasSize.value.height - DEFAULT_CROP_SIZE

    zoneCoords = {
      x: Math.min(x, maxX),
      y: Math.min(y, maxY),
      width: DEFAULT_CROP_SIZE,
      height: DEFAULT_CROP_SIZE
    }
  }
  console.log("cropInput", cropInput,currentPage.value )
  // Create crop item
  const cropItem: CropItem = {
    id: cropInput.id || `crop-${Date.now()}`,
    page: cropInput.page || currentPage.value,
    zone: zoneToString(zoneCoords.x, zoneCoords.y, zoneCoords.width, zoneCoords.height),
    label: cropInput.label,
    color: color,
    editable: cropInput.editable !== false, // Default to editable
    ...cropInput
  }

  // Add to crops array
  crops.value.push(cropItem)

  // Render if on current page
  if (cropItem.page === currentPage.value) {
    renderCropOnCanvas(cropItem)
    // Apply dimming if there's a focused crop
    if (focusedCropId.value) {
      applyCropDimming()
    }
  }

  // Emit update with crop image
  const imageData = extractCropImage(cropItem)
  emit('update', { crop: cropItem, imageData })
}

// ==================== Crop Rendering ====================

async function renderCropsForCurrentPage() {
  if (!canvas) return
  // Clear existing fabric crops
  const allObj = canvas.getObjects()
  allObj.forEach((rec:any) => {
    canvas.remove(rec)
  })

  fabricCrops.value.clear()

  // Render crops for current page
  const pageCrops = crops.value.filter(c => c.page === currentPage.value)
  // sort the pageCrops , by section, field, qrcode
  const orderMap = {
    'section': 0,
    'field': 1,
    'qrcode': 2
  }
  pageCrops.sort((a,b) => {
    const indexA = orderMap[a.type] ?? Number.MAX_SAFE_INTEGER; // Items not in order go last
      const indexB = orderMap[b.type] ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
  }).forEach(crop => {
    renderCropOnCanvas(crop)
  })
  await canvas.renderAll()
}

function renderCropOnCanvas(crop: CropItem) {
  if (!canvas) return

  const zoneCoords = parseZoneString(crop.zone)
  if (!zoneCoords) return

  const color = crop.color || getRandomColor()
  const editable = crop.editable !== false

  // Create fabric rectangle
  const rect = new fabric.Rect({
    left: zoneCoords.x,
    top: zoneCoords.y,
    width: zoneCoords.width,
    height: zoneCoords.height,
    fill: crop.type === 'section' ? `${color}11` : undefined, // 10% opacity fill
    stroke: color,
    strokeWidth: 4,
    selectable: editable,
    hasControls: editable,
    hasBorders: editable,
    lockRotation: true,
    lockScalingFlip: true,
    cornerSize: HANDLE_SIZE,
    cornerColor: '#ffffff',
    cornerStrokeColor: color,
    transparentCorners: false,
    data: { cropId: crop.id }
  })

  // Add event listeners for editable crops
  if (editable) {
    rect.on('modified', (e:any) => {
      // udpate rect width and height base on scale
      console.log(e.action)
      if(e.action.includes('scale')){
        const obj = e.target;
        const newWidth = obj.width * obj.scaleX;
        const newHeight = obj.height * obj.scaleY;

        obj.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1
        });
      }
      updateCropFromFabric(crop.id, rect)
    })

    rect.on('selected', () => {
      activeCropId.value = crop.id
      highlightCrop(crop.id)
    })

    rect.on('deselected', () => {
      if (activeCropId.value === crop.id) {
        activeCropId.value = null
      }
    })
  }

  canvas.add(rect)

  // Store fabric crop reference
  fabricCrops.value.set(crop.id, {
    id: crop.id,
    rect,
    editable,
    isResizing: false,
    resizeHandle: null
  })
}

function extractCropImage(crop: CropItem): string | undefined {

  if (!canvas) return undefined

  const zoneCoords = parseZoneString(crop.zone)
  if (!zoneCoords) return undefined
  console.log("extractCropImage",zoneCoords)
  // Get the fabric crop object to hide it temporarily
  const fabricCrop = fabricCrops.value.get(crop.id)
  const cropRect = fabricCrop?.rect

  try {
    // Hide the crop overlay before capturing
    if (cropRect) {
      cropRect.set({ visible: false })
      canvas.renderAll()
    }

    // Get the canvas element
    const canvasElement = canvas.getElement()

    // Create a temporary canvas to extract the crop area
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = zoneCoords.width
    tempCanvas.height = zoneCoords.height
    const tempCtx = tempCanvas.getContext('2d')

    if (!tempCtx) {
      // Restore the crop overlay if failed
      if (cropRect) {
        cropRect.set({ visible: true })
        canvas.renderAll()
      }
      return undefined
    }

    // Draw the cropped area from the main canvas
    tempCtx.drawImage(
      canvasElement,
      zoneCoords.x, zoneCoords.y, zoneCoords.width, zoneCoords.height,  // Source
      0, 0, zoneCoords.width, zoneCoords.height  // Destination
    )

    // Convert to base64
    const imageData = tempCanvas.toDataURL('image/png')

    // Restore the crop overlay
    if (cropRect) {
      cropRect.set({ visible: true })
      canvas.renderAll()
    }

    return imageData
  } catch (error) {
    console.error('Failed to extract crop image:', error)
    // Restore the crop overlay on error
    if (cropRect) {
      cropRect.set({ visible: true })
      canvas.renderAll()
    }
    return undefined
  }
}

function updateCropFromFabric(cropId: string | number, rect: fabric.Rect) {
  const crop = crops.value.find(c => c.id === cropId)
  if (!crop) return

  const newZone = zoneToString(
    Math.round(rect.left || 0),
    Math.round(rect.top || 0),
    Math.round(rect.width || 0),
    Math.round(rect.height || 0)
  )

  crop.zone = newZone

  // Extract crop image and emit with update event
  const imageData = extractCropImage(crop)
  emit('update', { crop, imageData })
}

function highlightCrop(cropId: string | number) {
  fabricCrops.value.forEach((fabricCrop, id) => {
    if (fabricCrop.rect) {
      if (id === cropId) {
        fabricCrop.rect.set({ strokeWidth: 3 })
        canvas?.bringToFront(fabricCrop.rect)
      } else {
        fabricCrop.rect.set({ strokeWidth: 2 })
      }
    }
  })
  canvas?.renderAll()
}

function removeCropFromCanvas(cropId: string | number) {
  const fabricCrop = fabricCrops.value.get(cropId)
  if (fabricCrop && canvas) {
    const allObj = canvas.getObjects()
    allObj.forEach((rec:any) => {
      if(rec.data.cropId === cropId){
        canvas.remove(rec)
      }
    })

    fabricCrops.value.delete(cropId)
    canvas.renderAll()
  }
}

function removeCropItem(cropId: string | number) {
  // Remove from crops array

  const index = crops.value.findIndex(c => c.id === cropId)
  console.log("removeCropItem",index )
  if (index > -1) {
    crops.value.splice(index, 1)
  }

  // Remove from canvas if on current page
  removeCropFromCanvas(cropId)

  // Clear active/focused state if needed
  if (activeCropId.value === cropId) {
    activeCropId.value = null
  }
  if (focusedCropId.value === cropId) {
    focusedCropId.value = null
    applyCropDimming()
  }

  // Emit remove event
  emit('remove', cropId)
}

async function getAllCropImages() {
  // Iterate through all crops and emit update with image data
  // sort all crop by page so no need to change page radome
  const sortedCrop = [...crops.value].sort((a,b) => a.page - b.page);
  const lastCurrentPage = currentPage.value
  await loadPage(currentPage.value)
  for (const crop of sortedCrop) {
    // Navigate to the crop's page if not on current page
    if (crop.page !== currentPage.value) {
      await loadPage(crop.page)
    }

    // Give time for page to render
    await nextTick()

    // Extract crop image
    const imageData = extractCropImage(crop)
    // Emit update event
    emit('update', { crop, imageData })
  }
  // go back to current page before getAllCropImages
  await loadPage(lastCurrentPage)
}

// ==================== Page Navigation ====================

async function loadPage(pageNum: number) {
  if (pageNum < 1 || pageNum > pageCount.value) return

  loading.value = true

  try {
    // Check if image is already loaded in pageImages
    let pageImage = pageImages.get(pageNum)

    if (!pageImage) {
      const url = documentPaths.value[pageNum - 1]
      if (url.startsWith('data:')) {
        pageImages.set(pageNum, url)
        pageImage = url
      } else {
        const imgUrl = await loadImageFromPath(url)
        if (imgUrl) {
          pageImages.set(pageNum, imgUrl)
          pageImage = imgUrl
        }
      }
    }

    if (!pageImage) {
      ElMessage.error('Failed to load page image')
      return
    }

    // Dispose existing canvas
    if (canvas) {
      canvas.dispose()
    }

    // Create new canvas
    canvas = new fabric.Canvas(canvasRef.value, {
      selection: false
    })

    // Load background image
    await new Promise<void>((resolve) => {
      fabric.Image.fromURL(pageImage!, (img: fabric.Image) => {
        const imgWidth = img.width || 0
        const imgHeight = img.height || 0

        canvasSize.value = { width: imgWidth, height: imgHeight }

        canvas!.setWidth(imgWidth)
        canvas!.setHeight(imgHeight)

        img.set({
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        })

        canvas!.setBackgroundImage(img, () => {
          canvas!.renderAll()
          resolve()
        })
      })
    })
    currentPage.value = pageNum
    // Calculate base scale to fit canvas in container
    calculateBaseScale()

    // Render crops for this page
    renderCropsForCurrentPage()

    // Apply dimming if there's a focused crop
    if (focusedCropId.value) {
      applyCropDimming()
    }

  } catch (error) {
    console.error('Failed to load page:', error)
    ElMessage.error('Failed to load page')
  } finally {
    loading.value = false
  }
}

async function loadImageFromPath(path: string): Promise<string | null> {
  try {
    const blob = await clientApi.api.postCaptureFileQuerycapturefilebypath(
      { path },
      { format: 'blob', headers: { noThrowError: true } }
    )
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    loadPage(currentPage.value - 1)
  }
}

function nextPage() {
  if (currentPage.value < pageCount.value) {
    loadPage(currentPage.value + 1)
  }
}

function handlePageInputBlur() {
  // Reset to current page if invalid input
  const pageNum = parseInt(pageInputValue.value, 10)
  if (isNaN(pageNum) || pageNum < 1 || pageNum > pageCount.value) {
    pageInputValue.value = String(currentPage.value)
    return
  }

  // Navigate to the entered page if different
  if (pageNum !== currentPage.value) {
    loadPage(pageNum)
  }
}

function handlePageInputConfirm() {
  handlePageInputBlur()
}

// ==================== Zoom ====================

function zoomIn() {
  if (zoom.value < MAX_ZOOM) {
    zoom.value = Math.min(MAX_ZOOM, zoom.value + ZOOM_STEP)
  }
}

function zoomOut() {
  if (zoom.value > MIN_ZOOM) {
    zoom.value = Math.max(MIN_ZOOM, zoom.value - ZOOM_STEP)
  }
}

function resetZoom() {
  zoom.value = 1
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()

  if (!previewContainerRef.value) return

  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))

  if (newZoom !== zoom.value) {
    const container = previewContainerRef.value
    const rect = container.getBoundingClientRect()

    // Mouse position relative to container
    const mouseX = e.clientX - rect.left + container.scrollLeft
    const mouseY = e.clientY - rect.top + container.scrollTop

    const oldScale = effectiveScale.value
    zoom.value = newZoom
    const newScale = effectiveScale.value

    // Adjust scroll to zoom towards mouse position
    const scaleRatio = newScale / oldScale
    container.scrollLeft = mouseX * scaleRatio - (mouseX - container.scrollLeft)
    container.scrollTop = mouseY * scaleRatio - (mouseY - container.scrollTop)
  }
}

// ==================== Pan ====================

function handleMouseDown(e: MouseEvent) {
  if (!previewContainerRef.value) return

  // Only start panning if clicking on empty area (not on canvas elements)
  const target = e.target as HTMLElement
  if (target.tagName.toLowerCase() === 'canvas') {
    // Check if clicking on a fabric object
    const fabricObject = canvas?.findTarget(e as unknown as fabric.IEvent)
    if (fabricObject) return
  }

  isPanning.value = true
  panStartX.value = e.clientX
  panStartY.value = e.clientY
  panStartScrollLeft.value = previewContainerRef.value.scrollLeft
  panStartScrollTop.value = previewContainerRef.value.scrollTop

  previewContainerRef.value.style.cursor = 'grabbing'
}

function handleMouseMove(e: MouseEvent) {
  if (!isPanning.value || !previewContainerRef.value) return

  const dx = e.clientX - panStartX.value
  const dy = e.clientY - panStartY.value

  previewContainerRef.value.scrollLeft = panStartScrollLeft.value - dx
  previewContainerRef.value.scrollTop = panStartScrollTop.value - dy
}

function handleMouseUp() {
  if (isPanning.value && previewContainerRef.value) {
    previewContainerRef.value.style.cursor = 'default'
  }
  isPanning.value = false
}

// ==================== Expose ====================
defineExpose({ init, addCrop, removeCropItem, focusCrop, blur, crops, renderCropsForCurrentPage, getAllCropImages, currentPage })
</script>

<style scoped>
.document-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0;
}

.preview-toolbar {
  padding: var(--app-space-s);
  border-bottom: 1px solid var(--app-grey-800);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-grey-900);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
}

.page-nav {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.page-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--app-space-xs);
}

.page-input {
  width: 50px;
}

.page-input :deep(.el-input__wrapper) {
  padding: 0 4px;
}

.page-input :deep(.el-input__inner) {
  text-align: center;
}

.page-separator {
  color: var(--app-grey-400);
  font-size: 14px;
}

.page-total {
  font-size: 14px;
  color: var(--app-grey-300);
  min-width: 30px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.zoom-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-grey-300);
  min-width: 50px;
  text-align: center;
}

.preview-container {
  background: var(--app-grey-950);
  overflow: auto;
  position: relative;
  cursor: default;
}

.canvasWrapper {
  position: relative;
  transform-origin: top left;
}

#canvas {
  background: #fff;
  display: block;
}
</style>
