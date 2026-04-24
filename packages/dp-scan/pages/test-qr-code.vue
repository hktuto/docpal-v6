<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import { readQRCode, type QRCodeResult } from '../utils/qrCodeReader'
import { loadPDF, renderPDFPageToCanvas, getPDFPagesInfo, isPDFFile, isImageFile, type PDFPageInfo } from '../utils/pdfToImage'

// File upload
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const uploadedImageUrl = ref<string>('')

// PDF handling - Note: pdfDocument is NOT stored in a ref to avoid breaking pdfjs
let pdfDocument: any = null
const isPDF = ref(false)
const pdfPages = ref<PDFPageInfo[]>([])
const pdfThumbnails = ref<Map<number, string>>(new Map())
const selectedPage = ref(1)
const showPageSelector = ref(false)
const isConvertingPDF = ref(false)
const isGeneratingThumbnails = ref(false)
const pdfScale = ref(2) // Default scale for PDF to image conversion

// Crop dialog
const showCropDialog = ref(false)
const originalImage = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cropCanvasRef = ref<HTMLCanvasElement | null>(null)

// Crop state
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const cropRect = ref({ x: 0, y: 0, width: 0, height: 0 })
const scale = ref(1)
const zoomLevel = ref(1)
const minZoom = 0.5
const maxZoom = 3
const isMovingCrop = ref(false)
const moveStartX = ref(0)
const moveStartY = ref(0)
const cropStartX = ref(0)
const cropStartY = ref(0)

// Result
const scanResult = ref<QRCodeResult | null>(null)
const scanError = ref<string>('')
const isScanning = ref(false)
const scannedImageUrl = ref<string>('')
const croppedImageUrl = ref<string>('')
const isLoading = ref(false)

// Trigger file input
function triggerFileUpload() {
  fileInput.value?.click()
}

// Handle file upload
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Reset previous state
  resetState()
  uploadedFile.value = file
  isLoading.value = true

  try {
    // Check file type
    if (isPDFFile(file)) {
      isPDF.value = true
      await handlePDFUpload(file)
    } else if (isImageFile(file)) {
      isPDF.value = false
      await handleImageUpload(file)
    } else {
      scanError.value = 'Unsupported file type. Please upload a PDF or image file.'
    }
  } catch (error) {
    scanError.value = 'Failed to load file: ' + (error as Error).message
  } finally {
    isLoading.value = false
  }

  // Reset file input
  target.value = ''
}

// Handle PDF upload
async function handlePDFUpload(file: File) {
  try {
    // Load PDF - store in regular variable, NOT in ref
    const pdf = await loadPDF(file)
    pdfDocument = pdf.doc
    pdfPages.value = await getPDFPagesInfo(pdf)

    if (pdfPages.value.length > 1) {
      // Show page selector if multiple pages
      showPageSelector.value = true
      // Generate thumbnails
      generateThumbnails()
    } else {
      // Auto-select first page if only one page
      selectedPage.value = 1
      await convertPDFPage(1)
    }
  } catch (error) {
    scanError.value = 'Failed to load PDF: ' + (error as Error).message
    console.error(error)
  }
}

// Generate thumbnails for all pages
async function generateThumbnails() {
  if (!pdfDocument) return

  isGeneratingThumbnails.value = true
  pdfThumbnails.value = new Map()

  try {
    // Generate thumbnails for first 10 pages (to avoid too much processing)
    const pagesToProcess = Math.min(pdfPages.value.length, 10)

    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        const canvas = await renderPDFPageToCanvas(pdfDocument, i, {
          scale: 0.3, // Small scale for thumbnail
          maxWidth: 150,
          maxHeight: 200
        })
        pdfThumbnails.value.set(i, canvas.toDataURL('image/png'))
      } catch (e) {
        console.error(`Failed to generate thumbnail for page ${i}:`, e)
      }
    }
  } finally {
    isGeneratingThumbnails.value = false
  }
}

// Handle image upload
async function handleImageUpload(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImageUrl.value = e.target?.result as string
    showCropDialog.value = true

    nextTick(() => {
      loadImageForCrop()
    })
  }
  reader.readAsDataURL(file)
}

// Convert PDF page to image
async function convertPDFPage(pageNumber: number) {
  if (!pdfDocument) return

  isConvertingPDF.value = true
  showPageSelector.value = false

  try {
    const canvas = await renderPDFPageToCanvas(pdfDocument, pageNumber, {
      scale: pdfScale.value,
      maxWidth: 2000,
      maxHeight: 2000
    })

    uploadedImageUrl.value = canvas.toDataURL('image/png')
    showCropDialog.value = true

    nextTick(() => {
      loadImageForCrop()
    })
  } catch (error) {
    scanError.value = 'Failed to convert PDF page: ' + (error as Error).message
    console.error(error)
  } finally {
    isConvertingPDF.value = false
  }
}

// Select page from thumbnail
async function selectPageFromThumbnail(pageNumber: number) {
  selectedPage.value = pageNumber
  await convertPDFPage(pageNumber)
}

// Load image on canvas for cropping
function loadImageForCrop() {
  if (!canvasRef.value) return

  const img = new Image()
  img.onload = () => {
    originalImage.value = img

    const canvas = canvasRef.value!
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to fit within dialog (max 600x400)
    const maxWidth = 600
    const maxHeight = 400

    let width = img.width
    let height = img.height

    // Calculate scale to fit image in canvas
    if (width > maxWidth || height > maxHeight) {
      const scaleX = maxWidth / width
      const scaleY = maxHeight / height
      scale.value = Math.min(scaleX, scaleY)
      width = width * scale.value
      height = height * scale.value
    } else {
      scale.value = 1
    }

    // Store base dimensions for zoom
    baseWidth.value = width
    baseHeight.value = height
    zoomLevel.value = 1

    canvas.width = width
    canvas.height = height

    // Draw image
    ctx.drawImage(img, 0, 0, width, height)
  }
  img.src = uploadedImageUrl.value
}

// Mouse events for cropping
function onMouseDown(event: MouseEvent) {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / zoomLevel.value
  const y = (event.clientY - rect.top) / zoomLevel.value
  
  // Check if clicking inside existing crop rectangle to move it
  if (cropRect.value.width > 0) {
    if (
      x >= cropRect.value.x &&
      x <= cropRect.value.x + cropRect.value.width &&
      y >= cropRect.value.y &&
      y <= cropRect.value.y + cropRect.value.height
    ) {
      isMovingCrop.value = true
      moveStartX.value = event.clientX
      moveStartY.value = event.clientY
      cropStartX.value = cropRect.value.x
      cropStartY.value = cropRect.value.y
      return
    }
  }
  
  // Start new crop selection
  isDragging.value = true
  startX.value = x
  startY.value = y

  cropRect.value = {
    x: startX.value,
    y: startY.value,
    width: 0,
    height: 0
  }
}

function onMouseMove(event: MouseEvent) {
  if (!canvasRef.value) return
  
  if (isMovingCrop.value) {
    // Move existing crop
    const deltaX = (event.clientX - moveStartX.value) / zoomLevel.value
    const deltaY = (event.clientY - moveStartY.value) / zoomLevel.value
    
    let newX = cropStartX.value + deltaX
    let newY = cropStartY.value + deltaY
    
    // Constrain to canvas bounds (using base dimensions)
    newX = Math.max(0, Math.min(newX, baseWidth.value - cropRect.value.width))
    newY = Math.max(0, Math.min(newY, baseHeight.value - cropRect.value.height))
    
    cropRect.value = {
      ...cropRect.value,
      x: newX,
      y: newY
    }
    
    applyZoom()
    return
  }
  
  if (!isDragging.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const currentX = (event.clientX - rect.left) / zoomLevel.value
  const currentY = (event.clientY - rect.top) / zoomLevel.value

  cropRect.value = {
    x: Math.min(startX.value, currentX),
    y: Math.min(startY.value, currentY),
    width: Math.abs(currentX - startX.value),
    height: Math.abs(currentY - startY.value)
  }

  applyZoom()
}

function onMouseUp() {
  isDragging.value = false
  isMovingCrop.value = false
}

// Store base dimensions for zoom calculations
const baseWidth = ref(0)
const baseHeight = ref(0)

// Zoom functions
function zoomIn() {
  if (zoomLevel.value < maxZoom) {
    zoomLevel.value = Math.min(zoomLevel.value + 0.25, maxZoom)
    applyZoom()
  }
}

function zoomOut() {
  if (zoomLevel.value > minZoom) {
    zoomLevel.value = Math.max(zoomLevel.value - 0.25, minZoom)
    applyZoom()
  }
}

function resetZoom() {
  zoomLevel.value = 1
  applyZoom()
}

function applyZoom() {
  if (!canvasRef.value || !originalImage.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Calculate new dimensions based on zoom level
  const newWidth = baseWidth.value * zoomLevel.value
  const newHeight = baseHeight.value * zoomLevel.value
  
  // Resize canvas
  canvas.width = newWidth
  canvas.height = newHeight
  
  // Draw image at new size
  ctx.drawImage(originalImage.value, 0, 0, newWidth, newHeight)
  
  // Redraw crop rectangle if exists
  if (cropRect.value.width > 0 && cropRect.value.height > 0) {
    // Scale crop rectangle coordinates
    const scaledRect = {
      x: cropRect.value.x * zoomLevel.value,
      y: cropRect.value.y * zoomLevel.value,
      width: cropRect.value.width * zoomLevel.value,
      height: cropRect.value.height * zoomLevel.value
    }
    drawCropRectangleScaled(scaledRect)
  }
}

function drawCropRectangleScaled(scaledRect: { x: number; y: number; width: number; height: number }) {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Draw selection rectangle
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(scaledRect.x, scaledRect.y, scaledRect.width, scaledRect.height)
  
  // Fill with semi-transparent overlay
  ctx.fillStyle = 'rgba(64, 158, 255, 0.2)'
  ctx.fillRect(scaledRect.x, scaledRect.y, scaledRect.width, scaledRect.height)
  
  // Draw resize handles
  const handleSize = 8
  ctx.fillStyle = '#409eff'
  ctx.setLineDash([])
  
  // Corner handles
  const corners = [
    { x: scaledRect.x, y: scaledRect.y },
    { x: scaledRect.x + scaledRect.width, y: scaledRect.y },
    { x: scaledRect.x, y: scaledRect.y + scaledRect.height },
    { x: scaledRect.x + scaledRect.width, y: scaledRect.y + scaledRect.height }
  ]
  
  corners.forEach(corner => {
    ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)
  })
}

// Move crop rectangle
function startMoveCrop(event: MouseEvent) {
  if (!canvasRef.value || cropRect.value.width === 0) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / zoomLevel.value
  const y = (event.clientY - rect.top) / zoomLevel.value
  
  // Check if clicking inside crop rectangle
  if (
    x >= cropRect.value.x &&
    x <= cropRect.value.x + cropRect.value.width &&
    y >= cropRect.value.y &&
    y <= cropRect.value.y + cropRect.value.height
  ) {
    isMovingCrop.value = true
    moveStartX.value = event.clientX
    moveStartY.value = event.clientY
    cropStartX.value = cropRect.value.x
    cropStartY.value = cropRect.value.y
    event.preventDefault()
  }
}

function moveCrop(event: MouseEvent) {
  if (!isMovingCrop.value || !canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const canvas = canvasRef.value
  
  // Calculate movement delta
  const deltaX = (event.clientX - moveStartX.value) / zoomLevel.value
  const deltaY = (event.clientY - moveStartY.value) / zoomLevel.value
  
  // Calculate new position
  let newX = cropStartX.value + deltaX
  let newY = cropStartY.value + deltaY
  
  // Constrain to canvas bounds
  newX = Math.max(0, Math.min(newX, canvas.width / zoomLevel.value - cropRect.value.width))
  newY = Math.max(0, Math.min(newY, canvas.height / zoomLevel.value - cropRect.value.height))
  
  cropRect.value = {
    ...cropRect.value,
    x: newX,
    y: newY
  }
  
  applyZoom()
}

// Draw crop rectangle
function drawCropRectangle() {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Draw selection rectangle
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2 / zoomLevel.value
  ctx.setLineDash([5 / zoomLevel.value, 5 / zoomLevel.value])
  ctx.strokeRect(
    cropRect.value.x * zoomLevel.value,
    cropRect.value.y * zoomLevel.value,
    cropRect.value.width * zoomLevel.value,
    cropRect.value.height * zoomLevel.value
  )
  
  // Fill with semi-transparent overlay
  ctx.fillStyle = 'rgba(64, 158, 255, 0.2)'
  ctx.fillRect(
    cropRect.value.x * zoomLevel.value,
    cropRect.value.y * zoomLevel.value,
    cropRect.value.width * zoomLevel.value,
    cropRect.value.height * zoomLevel.value
  )
  
  // Draw resize handles
  const handleSize = 8 / zoomLevel.value
  ctx.fillStyle = '#409eff'
  ctx.setLineDash([])
  
  // Corner handles
  const corners = [
    { x: cropRect.value.x, y: cropRect.value.y },
    { x: cropRect.value.x + cropRect.value.width, y: cropRect.value.y },
    { x: cropRect.value.x, y: cropRect.value.y + cropRect.value.height },
    { x: cropRect.value.x + cropRect.value.width, y: cropRect.value.y + cropRect.value.height }
  ]
  
  corners.forEach(corner => {
    ctx.fillRect(
      corner.x * zoomLevel.value - handleSize / 2,
      corner.y * zoomLevel.value - handleSize / 2,
      handleSize,
      handleSize
    )
  })
}

// Clear crop selection
function clearCrop() {
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 }
  applyZoom()
}

// Draw canvas with selection rectangle (legacy function, now uses applyZoom)
function drawCanvasWithSelection() {
  applyZoom()
}

// Perform crop and scan
async function cropAndScan() {
  if (!originalImage.value || !cropCanvasRef.value) return

  // If no selection made, use full image
  let finalRect = { ...cropRect.value }
  if (cropRect.value.width === 0 || cropRect.value.height === 0) {
    const canvas = canvasRef.value!
    finalRect = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    }
  }

  // Calculate original image coordinates
  const originalX = finalRect.x / scale.value
  const originalY = finalRect.y / scale.value
  const originalWidth = finalRect.width / scale.value
  const originalHeight = finalRect.height / scale.value

  // Draw cropped image on crop canvas
  const cropCanvas = cropCanvasRef.value
  cropCanvas.width = originalWidth
  cropCanvas.height = originalHeight

  const cropCtx = cropCanvas.getContext('2d')
  if (!cropCtx) return

  cropCtx.drawImage(originalImage.value, originalX, originalY, originalWidth, originalHeight, 0, 0, originalWidth, originalHeight)

  // Save images for display
  croppedImageUrl.value = cropCanvas.toDataURL('image/png')
  scannedImageUrl.value = uploadedImageUrl.value

  // Scan QR code
  isScanning.value = true
  scanError.value = ''
  scanResult.value = null

  try {
    const result = await readQRCode(cropCanvas)

    if (result) {
      scanResult.value = result
    } else {
      scanError.value = 'No QR code found in the selected area'
    }
  } catch (error) {
    scanError.value = 'Error scanning QR code: ' + (error as Error).message
  } finally {
    isScanning.value = false
  }

  // Close dialog
  showCropDialog.value = false
}

// Cancel crop
function cancelCrop() {
  showCropDialog.value = false
  showPageSelector.value = false
  uploadedImageUrl.value = ''
  originalImage.value = null
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 }
}

// Reset and try again
function resetTest() {
  uploadedFile.value = null
  uploadedImageUrl.value = ''
  scannedImageUrl.value = ''
  croppedImageUrl.value = ''
  pdfDocument = null
  pdfPages.value = []
  pdfThumbnails.value = new Map()
  selectedPage.value = 1
  pdfScale.value = 2
  isPDF.value = false
  scanResult.value = null
  scanError.value = ''
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 }
  showPageSelector.value = false
}

// Reset state helper
function resetState() {
  uploadedImageUrl.value = ''
  scannedImageUrl.value = ''
  croppedImageUrl.value = ''
  originalImage.value = null
  pdfDocument = null
  pdfPages.value = []
  pdfThumbnails.value = new Map()
  selectedPage.value = 1
  pdfScale.value = 2
  isPDF.value = false
  scanResult.value = null
  scanError.value = ''
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 }
  showPageSelector.value = false
}
</script>

<template>
  <div class="pageContainer">
    <h1>QR Code Scan Test</h1>

    <!-- Upload Section -->
    <div v-if="!scanResult && !scanError" class="upload-section">
      <p class="description">Upload a PDF or image file with a QR code. For PDFs, you can select a specific page and crop the area before scanning.</p>

      <input ref="fileInput" type="file" accept=".pdf,image/*" style="display: none" @change="handleFileUpload" />

      <el-button type="primary" size="large" :loading="isLoading" @click="triggerFileUpload">
        <Icon name="lucide:upload" class="btn-icon" />
        {{ isLoading ? 'Loading...' : 'Upload PDF or Image' }}
      </el-button>
    </div>

    <!-- Result Section -->
    <div v-else class="result-section">
      <!-- Scanned Images -->
      <div class="scanned-images">
        <div class="image-preview">
          <h4>Original Image</h4>
          <div class="image-container">
            <img :src="scannedImageUrl" alt="Scanned Image" />
          </div>
        </div>
        <div class="image-preview">
          <h4>Cropped Area</h4>
          <div class="image-container">
            <img :src="croppedImageUrl" alt="Cropped Image" />
          </div>
        </div>
      </div>

      <div v-if="scanResult" class="success-result">
        <el-result icon="success" title="QR Code Found!">
          <template #sub-title>
            <div class="result-details">
              <p><strong>Type:</strong> {{ scanResult.type }}</p>
              <p><strong>Value:</strong></p>
              <el-input v-model="scanResult.value" type="textarea" :rows="3" readonly />
            </div>
          </template>
        </el-result>
      </div>

      <div v-else-if="scanError" class="error-result">
        <el-result icon="error" title="Scan Failed" :sub-title="scanError" />
      </div>

      <el-button type="primary" @click="resetTest"> Try Another File </el-button>
    </div>

    <!-- Hidden canvas for cropping -->
    <canvas ref="cropCanvasRef" style="display: none"></canvas>

    <!-- Page Selector Dialog with Thumbnails -->
    <el-dialog v-model="showPageSelector" title="Select PDF Page" width="800px" :close-on-click-modal="false" :show-close="false">
      <div class="page-selector-content">
        <p class="page-selector-hint">This PDF has {{ pdfPages.length }} pages. Click on a thumbnail to select a page:</p>

        <div v-if="isGeneratingThumbnails" class="thumbnails-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>Generating thumbnails...</span>
        </div>

        <div class="thumbnails-grid">
          <div
            v-for="page in pdfPages"
            :key="page.pageNumber"
            class="thumbnail-item"
            :class="{ selected: selectedPage === page.pageNumber }"
            @click="selectedPage = page.pageNumber"
          >
            <div class="thumbnail-image">
              <img v-if="pdfThumbnails.get(page.pageNumber)" :src="pdfThumbnails.get(page.pageNumber)" :alt="`Page ${page.pageNumber}`" />
              <div v-else class="thumbnail-placeholder">
                <span>Page {{ page.pageNumber }}</span>
              </div>
            </div>
            <div class="thumbnail-label">Page {{ page.pageNumber }}</div>
            <div v-if="selectedPage === page.pageNumber" class="selected-indicator">
              <el-icon><Check /></el-icon>
            </div>
          </div>
        </div>

        <!-- Scale Control -->
        <div class="scale-control">
          <span class="scale-label">Image Quality:</span>
          <el-slider
            v-model="pdfScale"
            :min="1"
            :max="4"
            :step="0.5"
            :marks="{ 1: 'Low', 2: 'Normal', 3: 'High', 4: 'Ultra' }"
            show-stops
          />
          <span class="scale-value">{{ pdfScale }}x ({{ Math.round(pdfScale * 72) }} DPI)</span>
        </div>

        <div class="page-selector-actions">
          <span class="selected-info">Selected: Page {{ selectedPage }}</span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCrop">Cancel</el-button>
          <el-button type="primary" :loading="isConvertingPDF" @click="convertPDFPage(selectedPage)">
            {{ isConvertingPDF ? 'Converting...' : 'Select Page' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Crop Dialog -->
    <el-dialog
      v-model="showCropDialog"
      :title="isPDF ? `Crop Image - Page ${selectedPage}` : 'Crop Image'"
      width="800px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="crop-dialog-content">
        <p class="crop-hint">
          Drag to select the area containing the QR code. Use zoom controls for precision. Click and drag the selection to move it.
          <span v-if="isPDF" class="pdf-notice"> <br />You can go back and select a different page if needed. </span>
        </p>

        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <el-button-group>
            <el-button @click="zoomOut" :disabled="zoomLevel <= minZoom">
              <Icon name="lucide:zoom-out" />
            </el-button>
            <el-button disabled class="zoom-level">
              {{ Math.round(zoomLevel * 100) }}%
            </el-button>
            <el-button @click="zoomIn" :disabled="zoomLevel >= maxZoom">
              <Icon name="lucide:zoom-in" />
            </el-button>
            <el-button @click="resetZoom">
              <Icon name="lucide:rotate-ccw" />
            </el-button>
          </el-button-group>
          
          <el-button 
            v-if="cropRect.width > 0" 
            type="danger" 
            size="small" 
            @click="clearCrop"
          >
            Clear Selection
          </el-button>
        </div>

        <!-- Crop Info -->
        <div v-if="cropRect.width > 0" class="crop-info">
          <span>Selection: {{ Math.round(cropRect.width) }} x {{ Math.round(cropRect.height) }} px</span>
          <span>Position: {{ Math.round(cropRect.x) }}, {{ Math.round(cropRect.y) }}</span>
        </div>

        <div class="canvas-container">
          <canvas 
            ref="canvasRef" 
            class="crop-canvas" 
            @mousedown="onMouseDown" 
            @mousemove="onMouseMove" 
            @mouseup="onMouseUp" 
            @mouseleave="onMouseUp"
          ></canvas>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCrop">Cancel</el-button>
          <el-button v-if="isPDF && pdfPages.length > 1" @click="showPageSelector = true"> Change Page </el-button>
          <el-button type="primary" :loading="isScanning" @click="cropAndScan">
            {{ cropRect.width > 0 ? 'Scan Selected Area' : 'Scan Full Image' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style>
.btn-icon {
  margin-right: 8px;
  vertical-align: middle;
}
</style>

<style scoped>
.pageContainer {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 40px;
  color: #303133;
}

.upload-section {
  text-align: center;
  padding: 60px 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.description {
  color: #606266;
  margin-bottom: 24px;
  font-size: 14px;
}

.result-section {
  text-align: center;
  padding: 20px;
}

.result-details {
  text-align: left;
  max-width: 500px;
  margin: 0 auto;
}

.result-details p {
  margin: 12px 0;
  color: #606266;
}

.scanned-images {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.image-preview {
  flex: 1;
  min-width: 250px;
  max-width: 350px;
}

.image-preview h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.image-container {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
  display: block;
}

.page-selector-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-selector-hint {
  color: #606266;
  font-size: 14px;
  text-align: center;
  margin: 0;
}

.thumbnails-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #606266;
  padding: 20px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.thumbnails-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.thumbnail-item {
  position: relative;
  cursor: pointer;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  background: #fff;
}

.thumbnail-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.thumbnail-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.thumbnail-image {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  overflow: hidden;
}

.thumbnail-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.thumbnail-label {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

.selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.page-selector-actions {
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.selected-info {
  color: #409eff;
  font-weight: 500;
}

.scale-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.scale-label {
  font-weight: 500;
  color: #606266;
}

.scale-value {
  text-align: center;
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
}

.crop-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crop-hint {
  color: #606266;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.pdf-notice {
  color: #909399;
  font-size: 12px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.zoom-level {
  min-width: 70px;
  font-weight: 500;
}

.crop-info {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.canvas-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: auto;
  max-width: 100%;
  max-height: 500px;
  background-color: #f5f7fa;
}

.crop-canvas {
  display: block;
  cursor: crosshair;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
