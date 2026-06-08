<script lang="ts" setup>
import { clientApi } from 'api'
import { pdfPageToImageUrl, loadPDF } from '#imports'
import { readQRCode } from '#imports'

const props = defineProps<{
  visible: boolean
  originalFilename: string
  batchId: string
  docId: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
  error: [message: string]
}>()

const routerProvider = inject(MenuRouterKey)

const loading = ref(false)
const fileInputRef = ref<HTMLInputElement>()

// Two-stage flow: 'select' | 'confirm' | 'error'
const step = ref<'select' | 'confirm' | 'error'>('select')
const selectedFile = ref<File | null>(null)
const scannedAppNumber = ref('')
const errorMsg = ref('')

// Expected application number (original filename without .pdf)
const expectedAppNumber = computed(() => props.originalFilename.replace(/\.pdf$/i, ''))

function close() {
  reset()
  emit('update:visible', false)
}

function reset() {
  step.value = 'select'
  selectedFile.value = null
  scannedAppNumber.value = ''
  errorMsg.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Stage 1: trigger file picker
function triggerFileSelect() {
  fileInputRef.value?.click()
}

// Stage 1: handle file selection and validate
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errorMsg.value = 'Please select a PDF file'
    step.value = 'error'
    clearFileInput()
    return
  }

  loading.value = true
  try {
    const appNumber = await extractApplicationNumberFromPdf(file)
    scannedAppNumber.value = appNumber

    if (appNumber !== expectedAppNumber.value) {
      errorMsg.value = `Application number mismatch. Expected: ${expectedAppNumber.value}, Found: ${appNumber || 'none'}`
      step.value = 'error'
      return
    }

    // Match - proceed to confirm stage
    selectedFile.value = file
    step.value = 'confirm'
  } catch (err: any) {
    console.error('File validation error:', err)
    errorMsg.value = err.message || 'Failed to read application number from PDF'
    step.value = 'error'
  } finally {
    loading.value = false
    clearFileInput()
  }
}

// Stage 2: confirm and perform replacement
async function handleConfirmReplace() {
  if (!selectedFile.value) return

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    await clientApi.api.postCaptureBatchBatchidDocDocidReplaceAndRetry(
      props.batchId,
      props.docId,
      formData
    )

    routerProvider?.message.success('File replaced successfully')
    emit('success')
    close()
  } catch (err: any) {
    console.error('Replace error:', err)
    errorMsg.value = err.message || 'Failed to replace file'
    step.value = 'error'
    emit('error', errorMsg.value)
  } finally {
    loading.value = false
  }
}

function clearFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Extract application number from PDF by reading QR code on first page
async function extractApplicationNumberFromPdf(file: File): Promise<string> {
  const pdf = await loadPDF(file)
  const imageUrl = await pdfPageToImageUrl(pdf, 1, { dpi: 300 })

  const result = await readQRCode(imageUrl)
  if (result?.value) {
    return result.value
  }

  // Fallback: try grid scan if direct QR read fails
  const img = await loadImage(imageUrl)
  const gridResult = await scanImageGrid(img, 4, 0.5)
  if (gridResult?.value) {
    return gridResult.value
  }

  return ''
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function scanImageGrid(
  img: HTMLImageElement,
  gridSize: number = 4,
  overlapRatio: number = 0.5
): Promise<{ value: string } | null> {
  const width = img.width
  const height = img.height
  const baseCellWidth = width / gridSize
  const baseCellHeight = height / gridSize
  const overlapX = baseCellWidth * overlapRatio
  const overlapY = baseCellHeight * overlapRatio
  const cellWidth = baseCellWidth + overlapX
  const cellHeight = baseCellHeight + overlapY

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = Math.max(0, col * baseCellWidth - overlapX / 2)
      const y = Math.max(0, row * baseCellHeight - overlapY / 2)
      const w = Math.min(cellWidth, width - x)
      const h = Math.min(cellHeight, height - y)

      try {
        const cellImageUrl = await cropImageToZone(img, { x, y, width: w, height: h })
        const result = await readQRCode(cellImageUrl)
        if (result?.value) {
          return { value: result.value }
        }
      } catch {
        // ignore
      }
    }
  }

  return null
}

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
</script>

<template>
  <ElDialog
    :model-value="visible"
    title="Replace Form"
    width="420px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
    @closed="reset"
  >
    <div v-loading="loading">
      <!-- Stage 1: Select file -->
      <template v-if="step === 'select'">
        <p>Please select a PDF file to replace the current form.</p>
        <p class="hint">The new file must have the same application number as the original.</p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Original file:</span>
            <span class="info-value">{{ originalFilename }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Expected App No:</span>
            <span class="info-value">{{ expectedAppNumber }}</span>
          </div>
        </div>
      </template>

      <!-- Stage 2: Confirm replacement -->
      <template v-if="step === 'confirm'">
        <p class="success-text">Application number matched!</p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Selected file:</span>
            <span class="info-value">{{ selectedFile?.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Scanned App No:</span>
            <span class="info-value">{{ scannedAppNumber }}</span>
          </div>
        </div>
        <p class="hint">Click <strong>Confirm Replace</strong> to proceed.</p>
      </template>

      <!-- Error state -->
      <template v-if="step === 'error'">
        <p class="error-text">Validation failed</p>
        <p class="error-message">{{ errorMsg }}</p>
      </template>
    </div>

    <template #footer>
      <template v-if="step === 'select'">
        <ElButton @click="close">Cancel</ElButton>
        <ElButton type="primary" @click="triggerFileSelect">
          <Icon name="lucide:upload" />
          Select PDF File
        </ElButton>
      </template>

      <template v-if="step === 'confirm'">
        <ElButton @click="step = 'select'">Back</ElButton>
        <ElButton type="warning" @click="handleConfirmReplace">
          <Icon name="lucide:refresh-ccw" />
          Confirm Replace
        </ElButton>
      </template>

      <template v-if="step === 'error'">
        <ElButton @click="close">Cancel</ElButton>
        <ElButton type="primary" @click="step = 'select'">
          <Icon name="lucide:upload" />
          Try Again
        </ElButton>
      </template>
    </template>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".pdf"
      style="display: none"
      @change="handleFileChange"
    />
  </ElDialog>
</template>

<style scoped>
.hint {
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
  margin-top: var(--app-space-xs);
}

.info-box {
  margin-top: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--app-bg-color-secondary);
  border-radius: var(--app-radius-s);
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: var(--app-space-s);
  font-size: var(--app-font-size-s);
  padding: var(--app-space-xs) 0;
}

.info-label {
  color: var(--app-text-color-secondary);
  flex-shrink: 0;
}

.info-value {
  font-weight: 500;
  word-break: break-all;
  text-align: right;
}

.success-text {
  color: var(--app-success-color);
  font-weight: 600;
}

.error-text {
  color: var(--app-error-color);
  font-weight: 600;
}

.error-message {
  color: var(--app-text-color-primary);
  font-size: var(--app-font-size-s);
  margin-top: var(--app-space-xs);
  padding: var(--app-space-s);
  background: var(--app-error-color-light, rgba(245, 108, 108, 0.1));
  border-radius: var(--app-radius-s);
}
</style>
