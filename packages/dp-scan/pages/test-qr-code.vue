<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import { readQRCode, type QRCodeResult } from '../utils/qrCodeReader'
import { loadPDF, renderPDFPageToCanvas, getPDFPagesInfo, isPDFFile, isImageFile, type PDFPageInfo, type PDFDocument } from '../utils/pdfToImage'

// File upload
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const uploadedImageUrl = ref<string>('')

// PDF handling
const isPDF = ref(false)
const pdfDocument = ref<PDFDocument | null>(null)
const pdfPages = ref<PDFPageInfo[]>([])
const selectedPage = ref(1)
const showPageSelector = ref(false)

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
const scale = ref(1) // Scale factor between displayed image and original

// Result
const scanResult = ref<QRCodeResult | null>(null)
const scanError = ref<string>('')
const isScanning = ref(false)
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

  // Check file type
  if (isPDFFile(file)) {
    isPDF.value = true
    await handlePDFUpload(file)
  } else if (isImageFile(file)) {
    isPDF.value = false
    await handleImageUpload(file)
  } else {
    scanError.value = 'Unsupported file type. Please upload a PDF or image file.'
    return
  }

  // Reset file input
  target.value = ''
}

// Handle PDF upload
async function handlePDFUpload(file: File) {
  isLoading.value = true

  try {
    pdfDocument.value = await loadPDF(file)
    pdfPages.value = await getPDFPagesInfo(pdfDocument.value)

    if (pdfPages.value.length > 1) {
      // Show page selector if multiple pages
      showPageSelector.value = true
    } else {
      // Auto-select first page if only one page
      selectedPage.value = 1
      await loadPDFPage(1)
    }
  } catch (error) {
    scanError.value = 'Failed to load PDF: ' + (error as Error).message
  } finally {
    isLoading.value = false
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

// Load specific PDF page
async function loadPDFPage(pageNumber: number) {
  if (!pdfDocument.value) return

  isLoading.value = true
  showPageSelector.value = false

  try {
    const canvas = await renderPDFPageToCanvas(pdfDocument.value, pageNumber, {
      scale: 2, // Higher resolution for better QR scanning
      maxWidth: 1200,
      maxHeight: 1200
    })

    uploadedImageUrl.value = canvas.toDataURL('image/png')
    showCropDialog.value = true

    nextTick(() => {
      loadImageForCrop()
    })
  } catch (error) {
    scanError.value = 'Failed to render PDF page: ' + (error as Error).message
  } finally {
    isLoading.value = false
  }
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
  isDragging.value = true
  startX.value = event.clientX - rect.left
  startY.value = event.clientY - rect.top

  cropRect.value = {
    x: startX.value,
    y: startY.value,
    width: 0,
    height: 0
  }
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging.value || !canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top

  cropRect.value = {
    x: Math.min(startX.value, currentX),
    y: Math.min(startY.value, currentY),
    width: Math.abs(currentX - startX.value),
    height: Math.abs(currentY - startY.value)
  }

  drawCanvasWithSelection()
}

function onMouseUp() {
  isDragging.value = false
}

// Draw canvas with selection rectangle
function drawCanvasWithSelection() {
  if (!canvasRef.value || !originalImage.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Redraw image
  ctx.drawImage(originalImage.value, 0, 0, canvas.width, canvas.height)

  // Draw selection rectangle
  if (cropRect.value.width > 0 && cropRect.value.height > 0) {
    ctx.strokeStyle = '#409eff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(cropRect.value.x, cropRect.value.y, cropRect.value.width, cropRect.value.height)

    // Fill with semi-transparent overlay
    ctx.fillStyle = 'rgba(64, 158, 255, 0.2)'
    ctx.fillRect(cropRect.value.x, cropRect.value.y, cropRect.value.width, cropRect.value.height)
  }
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
  originalImage.value = null
  pdfDocument.value = null
  pdfPages.value = []
  selectedPage.value = 1
  isPDF.value = false
  scanResult.value = null
  scanError.value = ''
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 }
  showPageSelector.value = false
}

// Reset state helper
function resetState() {
  uploadedImageUrl.value = ''
  originalImage.value = null
  pdfDocument.value = null
  pdfPages.value = []
  selectedPage.value = 1
  isPDF.value = false
  scanResult.value = null
  scanError.value = ''
  cropRect.value = { x: 0, y: 0, width: 0, height: 0 }
  showPageSelector.value = false
}

// Change page in page selector
async function onPageChange(pageNumber: number) {
  selectedPage.value = pageNumber
  await loadPDFPage(pageNumber)
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

    <!-- Page Selector Dialog (for PDFs with multiple pages) -->
    <el-dialog v-model="showPageSelector" title="Select PDF Page" width="500px" :close-on-click-modal="false" :show-close="false">
      <div class="page-selector-content">
        <p class="page-selector-hint">This PDF has {{ pdfPages.length }} pages. Please select a page to scan:</p>

        <el-select v-model="selectedPage" placeholder="Select page" size="large" style="width: 200px" @change="onPageChange">
          <el-option
            v-for="page in pdfPages"
            :key="page.pageNumber"
            :label="`Page ${page.pageNumber} (${Math.round(page.width)} x ${Math.round(page.height)})`"
            :value="page.pageNumber"
          />
        </el-select>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCrop">Cancel</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Crop Dialog -->
    <el-dialog
      v-model="showCropDialog"
      :title="isPDF ? `Crop Image - Page ${selectedPage}` : 'Crop Image'"
      width="700px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="crop-dialog-content">
        <p class="crop-hint">
          Drag to select the area containing the QR code, or click "Scan Full Image" to scan the entire image.
          <span v-if="isPDF" class="pdf-notice"> <br />You can go back and select a different page if needed. </span>
        </p>

        <div class="canvas-container">
          <canvas ref="canvasRef" class="crop-canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"></canvas>
        </div>

        <!-- Page navigation for PDF -->
        <div v-if="isPDF && pdfPages.length > 1" class="page-navigation">
          <el-pagination
            v-model:current-page="selectedPage"
            :total="pdfPages.length"
            :page-size="1"
            layout="prev, pager, next"
            @current-change="onPageChange"
          />
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

.page-selector-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.page-selector-hint {
  color: #606266;
  font-size: 14px;
  text-align: center;
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

.canvas-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.crop-canvas {
  display: block;
  cursor: crosshair;
  max-width: 100%;
}

.page-navigation {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
