<script lang="ts" setup>
import { clientApi } from 'api'
import { pdfPageToImageUrl, loadPDF } from '#imports'
import { readQRCode } from '#imports'

interface DraftBatch {
  id: string
  batchNo: string
  projectId: string
  projectName: string
  status: string
  formId: string | null
  formName: string | null
  createdAt: string
  createdBy: string
}

interface UploadedFile {
  fileName: string
  filePath: string
  thumbnail?: string
  applicationNumber?: string
  isProcessing?: boolean
  detectedFormId?: string
  isUploaded?: boolean  // Track if successfully uploaded to server
}

interface QrCodeField {
  key: string
  zone: { page: number; zone: string }
  label: string
  format: string
}

interface FormSetting {
  id: string
  name: string
  fieldsSetting: {
    qrcode?: QrCodeField[]
  }
}

const props = defineProps<{
  id: string
  batchNo: string
  projectId: string
  projectName: string
  status: string
  formId: string | null
  formName: string | null
  createdAt: string
  createdBy: string
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

// Loading states
const loading = ref(false)
const projectLoading = ref(false)
const confirmLoading = ref(false)

// Project forms - a project can have multiple forms
const projectForms = ref<FormSetting[]>([])

// Uploaded files
const uploadedFiles = ref<UploadedFile[]>([])

// Form data
const formData = ref({
  isOverwrite: 'I',
  remark: ''
})

// Computed: Application numbers from uploaded files
const applicationNumbers = computed(() => {
  const numbers = uploadedFiles.value
    .map(f => f.applicationNumber)
    .filter((n): n is string => !!n && n.trim() !== '')
  return [...new Set(numbers)] // Remove duplicates
})

const fromApplicationNumber = computed(() => {
  if (applicationNumbers.value.length === 0) return '-'
  return applicationNumbers.value.sort()[0]
})

const toApplicationNumber = computed(() => {
  if (applicationNumbers.value.length === 0) return '-'
  return applicationNumbers.value.sort()[applicationNumbers.value.length - 1]
})

const noOfApplications = computed(() => {
  return applicationNumbers.value.length
})

// Fetch all forms in the project
async function getProjectForms() {
  if (!props.projectId) return

  projectLoading.value = true
  try {
    // Get all forms in the project
    const response = await clientApi.api.postCaptureProjformsettingPage({
      projectId: props.projectId
    })

    if (response.result && response.data) {
      // Parse fieldsSetting for each form
      projectForms.value = response.data.map((form: any): FormSetting => {
        let fieldsSetting: any = {}
        try {
          if (form.fieldsSetting) {
            fieldsSetting = JSON.parse(form.fieldsSetting)
          }
        } catch (e) {
          console.error('Failed to parse fieldsSetting:', e)
        }

        return {
          id: form.id,
          name: form.name,
          fieldsSetting
        }
      })
    }
  } catch (error) {
    console.error('Failed to get project forms:', error)
    routerProvider?.message.error('Failed to load project forms')
  } finally {
    projectLoading.value = false
  }
}

// Try to detect which form matches the document by checking QR code
async function detectFormForDocument(imageBlob: Blob): Promise<{ form: FormSetting; applicationNumber: string } | null> {
  if (projectForms.value.length === 0) return null

  // Create image from blob
  const imageUrl = URL.createObjectURL(imageBlob)

  try {
    // Load image to get dimensions
    const img = await loadImage(imageUrl)

    // STEP 1: Try each form's configured QR code zones
    for (const form of projectForms.value) {
      const qrFields = form.fieldsSetting?.qrcode || []

      for (const qrField of qrFields) {
        if (!qrField.zone?.zone) continue

        // Parse zone coordinates: "x1,y1,x2,y2"
        const zoneCoords = parseZone(qrField.zone.zone)
        if (!zoneCoords) continue

        // Crop image to zone
        const croppedImageUrl = await cropImageToZone(img, zoneCoords)

        // Try to read QR code from cropped region
        const qrResult = await readQRCode(croppedImageUrl)

        if (qrResult?.value) {
          // Found a valid QR code in configured zone
          console.log('QR found in form zone:', form.name, qrResult.value)
          return {
            form,
            applicationNumber: qrResult.value
          }
        }
      }
    }

    // STEP 2: If all form zones fail, try grid-based scanning
    console.log('No QR found in form zones, trying grid scan...')
    const gridResult = await scanImageGrid(img, 4, 0.5)  // 4x4 grid with 50% overlap

    if (gridResult?.value) {
      // Found QR code in grid scan, use first form as default
      console.log('QR found in grid scan:', gridResult.value)
      return {
        form: projectForms.value[0],
        applicationNumber: gridResult.value
      }
    }

    // STEP 3: No QR code found anywhere, return first form with empty application number
    console.log('No QR found anywhere')
    return {
      form: projectForms.value[0],
      applicationNumber: ''
    }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }

  return null
}

// Parse zone string "x1,y1,x2,y2" to coordinates
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

// Crop image to specified zone
async function cropImageToZone(
  img: HTMLImageElement,
  zone: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = zone.width
  canvas.height = zone.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(img, zone.x, zone.y, zone.width, zone.height, 0, 0, zone.width, zone.height)
  return canvas.toDataURL('image/png')
}

// Scan image using grid-based approach
// gridSize: number of rows/cols (e.g., 4 = 4x4 grid = 16 regions)
// overlapRatio: 0.5 = 50% overlap between grid cells
async function scanImageGrid(
  img: HTMLImageElement,
  gridSize: number = 4,
  overlapRatio: number = 0.5
): Promise<{ value: string } | null> {
  const width = img.width
  const height = img.height

  // Calculate base cell size
  const baseCellWidth = width / gridSize
  const baseCellHeight = height / gridSize

  // Calculate overlap size
  const overlapX = baseCellWidth * overlapRatio
  const overlapY = baseCellHeight * overlapRatio

  // Calculate actual cell size with overlap
  const cellWidth = baseCellWidth + overlapX
  const cellHeight = baseCellHeight + overlapY

  console.log(`Grid scan: ${gridSize}x${gridSize} grid, cell size: ${cellWidth.toFixed(0)}x${cellHeight.toFixed(0)}`)

  // Scan each grid cell
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Calculate cell position with overlap
      // Start position accounts for overlap to ensure coverage
      const x = Math.max(0, col * baseCellWidth - overlapX / 2)
      const y = Math.max(0, row * baseCellHeight - overlapY / 2)

      // Adjust width/height for edge cells
      const w = Math.min(cellWidth, width - x)
      const h = Math.min(cellHeight, height - y)

      console.log(`Scanning grid cell [${row},${col}]: x=${x.toFixed(0)}, y=${y.toFixed(0)}, w=${w.toFixed(0)}, h=${h.toFixed(0)}`)

      try {
        // Crop to grid cell
        const cellImageUrl = await cropImageToZone(img, { x, y, width: w, height: h })

        // Try to read QR code from this cell
        const result = await readQRCode(cellImageUrl)

        if (result?.value) {
          console.log(`QR found in grid cell [${row},${col}]:`, result.value)
          return { value: result.value }
        }
      } catch (error) {
        console.warn(`Error scanning grid cell [${row},${col}]:`, error)
      }
    }
  }

  console.log('No QR found in any grid cell')
  return null
}

// Load image from URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

// Handle file upload
async function handleFileUpload(file: File) {
  const formDataUpload = new FormData()
  formDataUpload.append('file', file)
  formDataUpload.append('batchId', props.id)

  try {
    console.log("handleFileUpload", formDataUpload)
    const response = await clientApi.api.postCaptureFileUploadtempfiletobatch(formDataUpload)
    console.log("handleFileUpload response", response)
    if (response.result && response.data) {
      // Ensure we have fileName (fallback to original file name if API doesn't return it)
      const uploadedFileName = response.data.fileName || file.name
      const uploadedFilePath = response.data.filePath || response.data.path || ''

      if (!uploadedFileName || !uploadedFilePath) {
        routerProvider?.message.error('Invalid upload response')
        return
      }

      const uploadedFile: UploadedFile = {
        fileName: uploadedFileName,
        filePath: uploadedFilePath,
        isProcessing: true,
        isUploaded: true  // Mark as successfully uploaded
      }

      uploadedFiles.value.push(uploadedFile)
      console.log("handleFileUpload uploadedFile", uploadedFile)
      // Process file for QR code and form detection
      await processUploadedFile(uploadedFile, file)
    } else {
      routerProvider?.message.error(response.message || 'Upload failed')
    }
  } catch (error) {
    console.error('Upload error:', error)
    routerProvider?.message.error('Failed to upload file')
  }
}

// Helper to update file in array (ensures Vue reactivity)
function updateFileInArray(filePath: string, fileName: string, updates: Partial<UploadedFile>) {
  // Unique key is filePath + fileName since filePath alone is not unique within a batch
  const index = uploadedFiles.value.findIndex(f => f.filePath === filePath && f.fileName === fileName)
  if (index !== -1) {
    // Create new object to trigger reactivity
    uploadedFiles.value[index] = { ...uploadedFiles.value[index], ...updates }
  }
}

// Process uploaded file - convert to image and extract QR
async function processUploadedFile(uploadedFile: UploadedFile, originalFile: File) {
  const filePath = uploadedFile.filePath
  try {
    // Check if file still exists in list (might have been deleted during processing)
    const stillExists = uploadedFiles.value.some(f => f.filePath === filePath && f.fileName === uploadedFile.fileName)
    if (!stillExists) {
      return
    }

    // For PDF files, convert to image first with 300 DPI
    let imageBlob: Blob
    let thumbnail: string | undefined

    if (originalFile.type === 'application/pdf' || originalFile.name.toLowerCase().endsWith('.pdf')) {
      const pdf = await loadPDF(originalFile)
      // Convert first page to image at 300 DPI (scale = 300/72 = 4.166...)
      const imageUrl = await pdfPageToImageUrl(pdf, 1, { dpi: 300 })
      const response = await fetch(imageUrl)

      imageBlob = await response.blob()
      thumbnail = imageUrl
    } else {
      imageBlob = originalFile
      thumbnail = URL.createObjectURL(originalFile)
    }

    // Check again if file still exists (might have been deleted during PDF conversion)
    if (!uploadedFiles.value.some(f => f.filePath === filePath && f.fileName === uploadedFile.fileName)) {
      return
    }
    // now we generated the thumbnail, update the file in the array
    // Update thumbnail immediately
    updateFileInArray(filePath, uploadedFile.fileName, { thumbnail })

    // Detect which form this document belongs to and extract application number
    const detectionResult = await detectFormForDocument(imageBlob)

    if (detectionResult) {
      const { form, applicationNumber } = detectionResult

      // Update form ID and application number
      updateFileInArray(filePath, uploadedFile.fileName, {
        detectedFormId: form.id,
        applicationNumber: applicationNumber || undefined,
        thumbnail,
        isProcessing: false
      })
    } else {
      // No form detected, just update thumbnail and stop processing
      updateFileInArray(filePath, uploadedFile.fileName, {
        thumbnail,
        isProcessing: false
      })
    }
  } catch (error) {
    console.error('Failed to process file:', error)
    updateFileInArray(filePath, uploadedFile.fileName, { isProcessing: false })
  }
}

// Handle drag and drop
function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files) {
    Array.from(files).forEach(file => handleFileUpload(file))
  }
}

// Remove file
async function removeFile(file: UploadedFile, index: number) {
  // If file was not successfully uploaded to server, just remove from UI
  if (!file.isUploaded) {
    uploadedFiles.value.splice(index, 1)
    return
  }

  try {
    const response = await clientApi.api.deleteCaptureFileTempfilefrombatch({
      batchId: props.id,
      fileName: file.fileName
    })

    if (response.result) {
      uploadedFiles.value.splice(index, 1)
      routerProvider?.message.success('File removed')
    } else {
      routerProvider?.message.error(response.message || 'Failed to remove file')
    }
  } catch (error) {
    console.error('Remove error:', error)
    routerProvider?.message.error('Failed to remove file')
  }
}

// Replace file
async function replaceFile(newFile: File, oldFile: UploadedFile, index: number) {
  // Store old file info for potential rollback
  const oldFileUploaded = oldFile.isUploaded

  // Remove old file from UI (and server if uploaded)
  await removeFile(oldFile, index)

  // Upload new file
  await handleFileUpload(newFile)
}

// Back to list
function backToList() {
  const tab = createBatchListPageTab()
  routerProvider?.navigateTo(tab)
}
const isAllFileProcessed = computed(() => uploadedFiles.value.every((f) => f.isUploaded && !f.isProcessing))
// Confirm batch
async function confirmBatch() {
  if (uploadedFiles.value.length === 0) {
    routerProvider?.message.warning('Please upload at least one file')
    return
  }

  confirmLoading.value = true
  try {
    // Build applicantNumJson
    const applicantNumJson: Record<string, string> = {}
    uploadedFiles.value.forEach(file => {
      if (file.applicationNumber) {
        applicantNumJson[file.applicationNumber] = file.fileName
      }
    })

    const requestData = {
      additionFields: [
        { key: 'isOverwrite', value: formData.value.isOverwrite === 'I' },
        { key: 'remark', value: formData.value.remark }
      ],
      applicantNumJson,
      applicantStart: fromApplicationNumber.value !== '-' ? fromApplicationNumber.value : '',
      applicantEnd: toApplicationNumber.value !== '-' ? toApplicationNumber.value : '',
      documents: uploadedFiles.value.map(f => ({
        tempFilePath: f.filePath  // filePath already includes filename
      }))
    }

    const response = await clientApi.api.postCaptureBatchBatchidDraftConfirm(
      props.id,
      requestData
    )

    routerProvider?.message.success('Batch confirmed successfully')
    // Navigate to batch list
    backToList()
  } catch (error) {
    console.error('Confirm error:', error)
    routerProvider?.message.error('Failed to confirm batch')
  } finally {
    confirmLoading.value = false
  }
}

onMounted(() => {
  getProjectForms()
})
</script>

<template>
  <div v-loading="loading" class="newBatchPage">
    <!-- Header -->
    <div class="header">
      <div class="back" @click="backToList">
        <Icon name="lucide:arrow-left" />
        <span>Back</span>
      </div>
      <h2 class="title">{{ batchNo }}</h2>
      <div class="projectInfo">
        <ElTag type="info">{{ projectName }}</ElTag>
      </div>
    </div>

    <div class="content">
      <!-- Left: Full-height Upload Zone with Grid -->
      <div
        class="uploadZoneLarge"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff"
          class="fileInput"
          @change="(e: any) => Array.from(e.target.files).forEach((f: any) => handleFileUpload(f))"
        />

        <!-- Upload Placeholder (shown when no files) -->
        <div v-if="uploadedFiles.length === 0" class="uploadPlaceholder">
          <Icon name="lucide:upload-cloud" class="uploadIcon" />
          <div class="uploadText">Drop files here or click to upload</div>
          <div class="uploadHint">Supported: PDF, JPG, PNG, TIFF (300 DPI)</div>
        </div>

        <!-- File Grid (shown when files exist) -->
        <div v-else class="fileGrid">
          <div
            v-for="(file, index) in uploadedFiles"
            :key="file.filePath"
            class="fileGridItem"
          >
            <div class="fileGridThumbnail">
              <Icon v-if="!file.thumbnail" name="lucide:file-text" class="fileGridIcon" />
              <img v-else :src="file.thumbnail" alt="Thumbnail" />
              <div v-if="file.isProcessing" class="processingOverlay">
                <Icon name="lucide:loader-2" class="spinning" />
              </div>
            </div>
            <div class="fileGridInfo">
              <div class="fileGridName" :title="file.fileName">{{ file.fileName }}</div>
              <div class="fileGridMeta">
                <ElTag v-if="file.applicationNumber" size="small" type="success">
                  #{{ file.applicationNumber }}
                </ElTag>
                <ElTag v-else-if="file.isProcessing" size="small">
                  Processing...
                </ElTag>
              </div>
            </div>
            <div class="fileGridActions">
              <ElButton
                link
                type="danger"
                size="small"
                class="deleteBtn"
                @click.stop="removeFile(file, index)"
              >
                <Icon name="lucide:x" />
              </ElButton>
            </div>
          </div>

          <!-- Add More Button -->
          <div class="fileGridItem addMore" @click.stop="$event.currentTarget.querySelector('input').click()">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              style="display: none;"
              @change="(e: any) => Array.from(e.target.files).forEach((f: any) => handleFileUpload(f))"
            />
            <Icon name="lucide:plus" class="addMoreIcon" />
            <span>Add More</span>
          </div>
        </div>
      </div>

      <!-- Right: Batch Information -->
      <div class="infoSection">
        <h3>Batch Information</h3>

        <div class="infoForm">
          <div class="infoRow">
            <label>From Application Number</label>
            <div class="readOnlyValue">{{ fromApplicationNumber }}</div>
          </div>

          <div class="infoRow">
            <label>To Application Number</label>
            <div class="readOnlyValue">{{ toApplicationNumber }}</div>
          </div>

          <div class="infoRow">
            <label>No of Application</label>
            <div class="readOnlyValue">{{ noOfApplications }}</div>
          </div>

          <div class="infoRow">
            <label>Is Overwrite</label>
            <ElSelect v-model="formData.isOverwrite" class="fullWidth">
              <ElOption label="I" value="I" />
              <ElOption label="R" value="R" />
            </ElSelect>
          </div>

          <div class="infoRow">
            <label>Remark</label>
            <ElInput
              v-model="formData.remark"
              type="textarea"
              :rows="4"
              placeholder="Enter remarks..."
            />
          </div>
        </div>

        <div class="actions">
          <ElButton @click="backToList">Cancel</ElButton>
          <ElButton
            type="primary"
            :loading="confirmLoading"
            :disabled="uploadedFiles.length === 0 || !isAllFileProcessed"
            @click="confirmBatch"
          >
            <Icon name="lucide:check" />
            Confirm
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.newBatchPage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-m) var(--app-space-l);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.back {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  color: var(--app-text-color-secondary);

  &:hover {
    color: var(--app-primary-color);
  }
}

.title {
  flex: 1;
  margin: 0;
  font-size: var(--app-font-size-xl);
  font-weight: 600;
}

.projectInfo {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: var(--app-space-m);
  gap: var(--app-space-m);
}

.uploadZoneLarge {
  flex: 1;
  position: relative;
  border: 2px dashed var(--app-border-color);
  border-radius: var(--app-radius-m);
  background-color: var(--app-bg-color-secondary);
  transition: all 0.2s ease;
  overflow: auto;
  padding: var(--app-space-m);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: var(--app-primary-color);
    background-color: var(--app-primary-color-light);
  }

  .fileInput {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
  }
}

.uploadPlaceholder {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: var(--app-space-s);
  color: var(--app-text-color-secondary);
  pointer-events: none;
}

.uploadIcon {
  font-size: 64px;
}

.uploadText {
  font-size: var(--app-font-size-l);
  font-weight: 500;
}

.uploadHint {
  font-size: var(--app-font-size-s);
  opacity: 0.7;
}

/* File Grid Layout */
.fileGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--app-space-m);
  width: 100%;
  max-width: 800px;
  padding: var(--app-space-m);
  z-index: 2;
}

.fileGridItem {
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  background-color: var(--app-bg-color);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-m);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--app-primary-color);
    box-shadow: var(--app-shadow-m);

    .deleteBtn {
      opacity: 1;
    }
  }

  &.addMore {
    border-style: dashed;
    cursor: pointer;
    justify-content: center;
    min-height: 180px;

    &:hover {
      border-color: var(--app-primary-color);
      background-color: var(--app-primary-color-light);
    }
  }
}

.fileGridThumbnail {
  width: 100%;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--app-bg-color-secondary);
  border-radius: var(--app-radius-s);
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.fileGridIcon {
  font-size: 48px;
  color: var(--app-text-color-secondary);
}

.fileGridInfo {
  width: 100%;
  text-align: center;
}

.fileGridName {
  font-size: var(--app-font-size-s);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: var(--app-space-xs);
}

.fileGridMeta {
  display: flex;
  justify-content: center;
  gap: var(--app-space-xs);
}

.fileGridActions {
  position: absolute;
  top: var(--app-space-xs);
  right: var(--app-space-xs);

  .deleteBtn {
    opacity: 0;
    transition: opacity 0.2s ease;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    padding: 4px;
  }
}

.addMoreIcon {
  font-size: 32px;
  color: var(--app-primary-color);
  margin-bottom: var(--app-space-xs);
}

.processingOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.infoSection {
  width: 350px;
  display: flex;
  flex-flow: column nowrap;
  padding: var(--app-space-m);
  background-color: var(--app-bg-color);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-m);
  overflow-y: auto;

  h3 {
    margin: 0 0 var(--app-space-m) 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
  }
}

.infoForm {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-m);
}

.infoRow {
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);

  label {
    font-size: var(--app-font-size-s);
    font-weight: 500;
    color: var(--app-text-color-secondary);
  }
}

.readOnlyValue {
  padding: var(--app-space-s);
  background-color: var(--app-bg-color-secondary);
  border-radius: var(--app-radius-s);
  font-weight: 600;
  color: var(--app-text-color);
}

.fullWidth {
  width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  margin-top: var(--app-space-l);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
}
</style>
