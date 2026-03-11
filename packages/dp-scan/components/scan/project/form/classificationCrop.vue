<script lang="ts" setup>
import { clientApi } from 'api'
import { pdfPageToImageUrl, loadPDF } from '#imports'

const props = defineProps<{
  formDetail: any
}>()

const emits = defineEmits<{
  refresh: []
}>()

const routerProvider = inject(MenuRouterKey)

// State
const loading = ref(false)
const saving = ref(false)
const previewImage = ref<string>()
const imageDimensions = ref({ width: 0, height: 0 })

// Canvas for cropping
const canvasRef = ref<HTMLCanvasElement>()
const imageRef = ref<HTMLImageElement>()
const isDrawing = ref(false)
const selection = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const startPos = ref({ x: 0, y: 0 })

// Classification config
const codeType = ref(props.formDetail?.formClassificationConfig?.codeType || 'QR')
const codeValue = ref(props.formDetail?.formClassificationConfig?.codeValue || '')

// Load PDF preview
async function loadPreview() {
  if (!props.formDetail?.sampleDocPath) return

  loading.value = true
  try {
    const blob = await clientApi.api.postCaptureFileQuerycapturefilebypath(
      { path: props.formDetail.sampleDocPath },
      { format: 'blob', headers: { noThrowError: true } }
    )

    const fileName = props.formDetail.sampleDocPath.split('/').pop() || 'document'
    const file = new File([blob], fileName, { type: blob.type })

    if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const pdf = await loadPDF(file)
      previewImage.value = await pdfPageToImageUrl(pdf, 1, {
        scale: 2,
        maxWidth: 1200,
        maxHeight: 1600
      })
    } else if (file.type.startsWith('image/')) {
      previewImage.value = URL.createObjectURL(blob)
    }
  } catch (error) {
    console.error('Failed to load preview:', error)
    routerProvider?.message.error('Failed to load document preview')
  } finally {
    loading.value = false
  }
}

// Handle image load to get dimensions
function onImageLoad() {
  if (imageRef.value) {
    imageDimensions.value = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight
    }
    initCanvas()
  }
}

// Initialize canvas
function initCanvas() {
  const canvas = canvasRef.value
  const img = imageRef.value
  if (!canvas || !img) return

  const rect = img.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height

  // Restore existing selection if any
  if (props.formDetail?.formClassificationConfig?.cropRegion) {
    const region = props.formDetail.formClassificationConfig.cropRegion
    const scaleX = rect.width / imageDimensions.value.width
    const scaleY = rect.height / imageDimensions.value.height
    selection.value = {
      x: region.x * scaleX,
      y: region.y * scaleY,
      width: region.width * scaleX,
      height: region.height * scaleY
    }
    drawSelection()
  }
}

// Mouse events for selection
function onMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  isDrawing.value = true
  startPos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  selection.value = null
}

function onMouseMove(e: MouseEvent) {
  if (!isDrawing.value) return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const currentPos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }

  selection.value = {
    x: Math.min(startPos.value.x, currentPos.x),
    y: Math.min(startPos.value.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.value.x),
    height: Math.abs(currentPos.y - startPos.value.y)
  }

  drawSelection()
}

function onMouseUp() {
  isDrawing.value = false
}

function onMouseLeave() {
  isDrawing.value = false
}

// Draw selection rectangle
function drawSelection() {
  const canvas = canvasRef.value
  if (!canvas || !selection.value) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Clear the selection area
  ctx.clearRect(
    selection.value.x,
    selection.value.y,
    selection.value.width,
    selection.value.height
  )

  // Draw selection border
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.strokeRect(
    selection.value.x,
    selection.value.y,
    selection.value.width,
    selection.value.height
  )

  // Draw resize handles
  const handles = [
    { x: selection.value.x, y: selection.value.y },
    { x: selection.value.x + selection.value.width, y: selection.value.y },
    { x: selection.value.x, y: selection.value.y + selection.value.height },
    { x: selection.value.x + selection.value.width, y: selection.value.y + selection.value.height }
  ]

  ctx.fillStyle = '#409eff'
  handles.forEach(handle => {
    ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8)
  })
}

// Clear selection
function clearSelection() {
  selection.value = null
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// Generate QR code value
function generateCodeValue() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  codeValue.value = `FORM-${timestamp}-${random}`
}

// Save classification config
async function saveConfig() {
  if (!selection.value) {
    routerProvider?.message.warning('Please select a region for the QR code')
    return
  }

  if (!codeValue.value) {
    routerProvider?.message.warning('Please enter a code value')
    return
  }

  saving.value = true
  try {
    // Convert selection back to original image coordinates
    const canvas = canvasRef.value
    const img = imageRef.value
    if (!canvas || !img) return

    const scaleX = imageDimensions.value.width / canvas.width
    const scaleY = imageDimensions.value.height / canvas.height

    const cropRegion = {
      x: Math.round(selection.value.x * scaleX),
      y: Math.round(selection.value.y * scaleY),
      width: Math.round(selection.value.width * scaleX),
      height: Math.round(selection.value.height * scaleY)
    }

    const config = {
      codeType: codeType.value,
      codeValue: codeValue.value,
      cropRegion
    }

    // Save to backend
    await clientApi.api.patchCaptureProjformsettingId(props.formDetail.id, {
      formClassificationConfig: config
    })

    routerProvider?.message.success('Classification configuration saved')
    // Refresh to get updated form detail with new status
    emits('refresh')
  } catch (error) {
    console.error('Save error:', error)
    routerProvider?.message.error('Failed to save configuration')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPreview()
})

onUnmounted(() => {
  if (previewImage.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewImage.value)
  }
})
</script>

<template>
  <div class="cropContainer">
    <!-- Left: Document Preview with Crop -->
    <div class="previewPanel">
      <div v-loading="loading" class="previewContent">
        <div v-if="previewImage" class="imageContainer">
          <img
            ref="imageRef"
            :src="previewImage"
            class="documentImage"
            @load="onImageLoad"
            alt="Document preview"
          />
          <canvas
            ref="canvasRef"
            class="selectionCanvas"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseLeave"
          />
        </div>
        <ElEmpty v-else description="Loading document preview..." />
      </div>
      <div class="previewHint">
        <Icon name="lucide:mouse-pointer-2" />
        Drag to select the QR code region on the document
      </div>
    </div>

    <!-- Right: Configuration Panel -->
    <div class="configPanel">
      <div class="configContent">
        <ElForm label-position="top">
          <!-- Code Type -->
          <ElFormItem label="Code Type">
            <ElSelect v-model="codeType" class="fullWidth">
              <ElOption label="QR Code" value="QR">
                <span class="optionWithIcon">
                  <Icon name="lucide:qr-code" />
                  QR Code
                </span>
              </ElOption>
              <ElOption label="Data Matrix" value="DATAMATRIX">
                <span class="optionWithIcon">
                  <Icon name="lucide:grid-2x2" />
                  Data Matrix
                </span>
              </ElOption>
              <ElOption label="Barcode" value="BARCODE">
                <span class="optionWithIcon">
                  <Icon name="lucide:barcode" />
                  Barcode
                </span>
              </ElOption>
            </ElSelect>
          </ElFormItem>

          <!-- Code Value -->
          <ElFormItem label="Code Value">
            <ElInput v-model="codeValue" placeholder="Enter code value">
              <template #append>
                <ElButton @click="generateCodeValue">
                  <Icon name="lucide:refresh-cw" />
                </ElButton>
              </template>
            </ElInput>
            <div class="helpText">
              This code will be used to identify the form type when scanning
            </div>
          </ElFormItem>

          <!-- Selection Info -->
          <ElFormItem v-if="selection" label="Selected Region">
            <ElDescriptions :column="2" size="small" border>
              <ElDescriptionsItem label="X">{{ Math.round(selection.x) }}px</ElDescriptionsItem>
              <ElDescriptionsItem label="Y">{{ Math.round(selection.y) }}px</ElDescriptionsItem>
              <ElDescriptionsItem label="Width">{{ Math.round(selection.width) }}px</ElDescriptionsItem>
              <ElDescriptionsItem label="Height">{{ Math.round(selection.height) }}px</ElDescriptionsItem>
            </ElDescriptions>
            <ElButton
              type="danger"
              size="small"
              class="clearBtn"
              @click="clearSelection"
            >
              <Icon name="lucide:trash-2" />
              Clear Selection
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>

      <!-- Actions -->
      <div class="panelFooter">
        <ElButton type="primary" :loading="saving" @click="saveConfig">
          Save & Continue
          <Icon name="lucide:arrow-right" />
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cropContainer {
  display: flex;
  height: 100%;
  gap: var(--app-space-m);
}

.previewPanel {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  background-color: var(--app-bg-color);
  border-radius: var(--app-radius-m);
  border: 1px solid var(--app-border-color);
  overflow: hidden;
}

.previewContent {
  flex: 1;
  overflow: auto;
  background-color: var(--app-bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.imageContainer {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
}

.documentImage {
  max-width: 100%;
  max-height: calc(100vh - 250px);
  display: block;
}

.selectionCanvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
}

.previewHint {
  padding: var(--app-space-m);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-s);
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
  border-top: 1px solid var(--app-border-color);
}

.configPanel {
  width: 360px;
  display: flex;
  flex-flow: column nowrap;
  background-color: var(--app-bg-color);
  border-radius: var(--app-radius-m);
  border: 1px solid var(--app-border-color);
  overflow: hidden;
}

.configContent {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-m);
}

.panelFooter {
  padding: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
  display: flex;
  justify-content: flex-end;
}

.fullWidth {
  width: 100%;
}

.optionWithIcon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.helpText {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  margin-top: var(--app-space-xs);
}

.clearBtn {
  margin-top: var(--app-space-m);
}
</style>
