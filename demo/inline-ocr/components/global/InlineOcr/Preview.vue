<script setup lang="ts">
import { useCanvasViewport } from '../../../composables/useCanvasViewport'
import { useLongPress } from '../../../composables/useLongPress'
import { usePaddleOcr } from '../../../composables/usePaddleOcr'
import { useTextSelection } from '../../../composables/useTextSelection'
import type { OcrResult } from '../../../composables/usePaddleOcr'

const props = defineProps<{
  src: string | Blob | File
}>()

const containerRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

const imageLoaded = ref(false)
const imageSize = ref({ width: 0, height: 0 })
const ocrResult = ref<OcrResult | null>(null)
const showOverlays = ref(true)
const isProcessing = ref(false)

// Track mouse position over viewport for zoom-to-cursor
const mousePos = ref({ x: 0, y: 0 })

function onViewportMouseMove(e: MouseEvent) {
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  mousePos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const { state, transformStyle, cursorStyle, reset, zoomToFit, isDragging, isSpacePressed, getPointOnCanvas } = useCanvasViewport(
  canvasRef,
  containerRef,
  { minScale: 0.05, maxScale: 20, zoomSpeed: 0.002 }
)

const { isPressed } = useLongPress(
  containerRef,
  async (e: MouseEvent | TouchEvent) => {
    if (isProcessing.value) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const point = getPointOnCanvas(clientX, clientY)
    await runOcr(point)
  },
  { delay: 600, moveThreshold: 15 }
)

const selection = useTextSelection(computed(() => ocrResult.value?.boxes ?? []))

const ocr = usePaddleOcr()
const objectUrl = ref<string | null>(null)

function loadImage(src: string | Blob | File) {
  imageLoaded.value = false
  ocrResult.value = null
  selection.clearSelection()

  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }

  let url: string
  if (typeof src === 'string') {
    url = src
  } else {
    url = URL.createObjectURL(src)
    objectUrl.value = url
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    imageSize.value = { width: img.width, height: img.height }
    imageLoaded.value = true
    nextTick(() => {
      drawImage(img)
      zoomToFit(img.width, img.height)
    })
  }
  img.onerror = () => {
    console.error('Failed to load image')
  }
  img.src = url
  imageRef.value = img
}

function drawImage(img: HTMLImageElement) {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
}

function isPointInPolygon(px: number, py: number, polygon: number[][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

async function runOcr(pressPoint?: { x: number; y: number }) {
  if (!imageRef.value) return
  isProcessing.value = true
  selection.clearSelection()
  try {
    const result = await ocr.recognize(imageRef.value)
    ocrResult.value = result
    console.log('OCR result:', result.text)

    // Auto-select the text box under the long-press position
    if (pressPoint) {
      const autoIndex = result.boxes.findIndex((box) =>
        isPointInPolygon(pressPoint.x, pressPoint.y, box.points)
      )
      if (autoIndex !== -1) {
        selection.selectSingle(autoIndex)
      }
    }
  } catch (err) {
    console.error('OCR failed:', err)
  } finally {
    isProcessing.value = false
  }
}

function getBoxStyle(boxPoints: number[][]) {
  if (!boxPoints || boxPoints.length < 4) return {}
  const p0 = boxPoints[0]
  const p1 = boxPoints[1]
  const p3 = boxPoints[3]

  const textWidth = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
  const textHeight = Math.hypot(p3[0] - p0[0], p3[1] - p0[1])
  const angleRad = Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
  const angleDeg = angleRad * (180 / Math.PI)

  return {
    position: 'absolute' as const,
    left: `${p0[0]}px`,
    top: `${p0[1]}px`,
    width: `${textWidth}px`,
    height: `${textHeight}px`,
    transform: `rotate(${angleDeg}deg)`,
    transformOrigin: '0 0',
  }
}

function onBoxMouseDown(index: number, e: MouseEvent) {
  if (e.shiftKey && selection.anchorIndex.value !== null) {
    selection.selectRange(selection.anchorIndex.value, index)
    return
  }
  selection.clearSelection()
  selection.startSelection(index)
}

function onBoxMouseEnter(index: number) {
  selection.extendSelection(index)
}

function onBoxTouchStart(index: number) {
  selection.toggleSingle(index)
}

function onContainerMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.text-box')) {
    selection.clearSelection()
  }
}

function onWindowMouseUp() {
  selection.finalizeSelection()
}

function toggleOverlays() {
  showOverlays.value = !showOverlays.value
}

function zoomIn() {
  const newScale = Math.min(20, state.scale * 1.25)
  const scaleRatio = newScale / state.scale
  const cx = mousePos.value.x
  const cy = mousePos.value.y
  const newTx = cx - (cx - state.translateX) * scaleRatio
  const newTy = cy - (cy - state.translateY) * scaleRatio
  state.scale = newScale
  state.translateX = newTx
  state.translateY = newTy
}

function zoomOut() {
  const newScale = Math.max(0.05, state.scale / 1.25)
  const scaleRatio = newScale / state.scale
  const cx = mousePos.value.x
  const cy = mousePos.value.y
  const newTx = cx - (cx - state.translateX) * scaleRatio
  const newTy = cy - (cy - state.translateY) * scaleRatio
  state.scale = newScale
  state.translateX = newTx
  state.translateY = newTy
}

function onWindowResize() {
  if (imageLoaded.value && imageSize.value.width > 0) {
    zoomToFit(imageSize.value.width, imageSize.value.height)
  }
}

onMounted(() => {
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('resize', onWindowResize)
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
  }
})

watch(() => props.src, (newSrc) => {
  if (newSrc) loadImage(newSrc)
}, { immediate: true })
</script>

<template>
  <div class="inline-ocr-preview">
    <div class="toolbar">
      <div class="toolbar-group">
        <button class="btn" :disabled="!imageLoaded" @click="zoomIn">
          <span>+</span>
        </button>
        <button class="btn" :disabled="!imageLoaded" @click="zoomOut">
          <span>-</span>
        </button>
        <button class="btn" :disabled="!imageLoaded" @click="reset">
          <span>Reset</span>
        </button>
        <button class="btn" :disabled="!imageLoaded" @click="zoomToFit(imageSize.width, imageSize.height)">
          <span>Fit</span>
        </button>
      </div>
      <div class="toolbar-group">
        <button
          class="btn"
          :disabled="!imageLoaded || ocr.isLoading.value || !ocr.isReady.value"
          @click="runOcr"
        >
          <span v-if="ocr.isLoading.value">Loading OCR...</span>
          <span v-else-if="!ocr.isReady.value">OCR Initializing...</span>
          <span v-else>Run OCR</span>
        </button>
        <button class="btn" :disabled="!ocrResult" @click="toggleOverlays">
          <span>{{ showOverlays ? 'Hide Text' : 'Show Text' }}</span>
        </button>
      </div>
      <div v-if="ocr.progress" class="status-text">
        {{ ocr.progress }}
      </div>
    </div>

    <div
      ref="containerRef"
      class="viewport"
      :class="{ 'is-dragging': isDragging, 'is-pressed': isPressed }"
      :style="{ cursor: cursorStyle }"
      @mousedown="onContainerMouseDown"
      @mousemove="onViewportMouseMove"
    >
      <div
        v-if="imageLoaded"
        ref="wrapperRef"
        class="canvas-wrapper"
        :style="transformStyle"
      >
        <canvas
          ref="canvasRef"
          class="image-canvas"
          :width="imageSize.width"
          :height="imageSize.height"
        />

        <div
          v-if="ocrResult && showOverlays"
          class="overlay-layer"
          :style="{ width: imageSize.width + 'px', height: imageSize.height + 'px' }"
        >
          <div
            v-for="(box, index) in ocrResult.boxes"
            :key="index"
            class="text-box"
            :class="{ selected: selection.isSelected(index) }"
            :style="getBoxStyle(box.points)"
            :data-text="box.text"
            :data-index="index"
            @mousedown.stop="onBoxMouseDown(index, $event)"
            @mouseenter="onBoxMouseEnter(index)"
            @touchstart.stop="onBoxTouchStart(index)"
          />
        </div>
      </div>

      <div v-else class="placeholder">
        <span>Loading image...</span>
      </div>

      <div v-if="isProcessing" class="ocr-loading-overlay">
        <div class="dot-grid" />
      </div>

      <div v-if="isPressed && !isProcessing" class="long-press-indicator">
        <div class="long-press-ring" />
      </div>

      <div v-if="isSpacePressed" class="space-hint">
        Pan mode — drag to move
      </div>

      <div v-if="selection.hasSelection" class="copy-toolbar">
        <span class="copy-count">{{ selection.selectedCount }} selected</span>
        <button class="copy-btn" @click="selection.copyToClipboard()">
          {{ selection.copied ? 'Copied!' : 'Copy' }}
        </button>
        <button class="copy-btn secondary" @click="selection.selectAll()">
          Select All
        </button>
        <button class="copy-btn secondary" @click="selection.clearSelection()">
          Clear
        </button>
      </div>
    </div>


  </div>
</template>

<style scoped lang="scss">
.inline-ocr-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--app-bg-color-page);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--app-bg-color);
  border-bottom: 1px solid var(--app-border-color-dark);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 6px;
}

.btn {
  padding: 6px 12px;
  background: var(--app-fill-color-darker);
  color: var(--app-danger-color);
  border: 1px solid var(--app-danger-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--app-danger-color);
    color: var(--app-text-color-primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.status-text {
  font-size: 12px;
  color: var(--app-text-color-secondary);
  margin-left: auto;
}

.viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.canvas-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}

.image-canvas {
  display: block;
  image-rendering: auto;
}

.overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.text-box {
  position: absolute;
  pointer-events: auto;
  cursor: text;
  background: transparent;
  border-radius: 2px;
  transition: background 0.15s;

  &:hover {
    background: var(--app-danger-alpha-10);
  }

  &.selected {
    background: var(--app-danger-alpha-30);
    box-shadow: 0 0 0 1px var(--app-danger-alpha-50);
  }
}

.placeholder {
  color: var(--app-text-color-secondary);
  font-size: 16px;
}

.long-press-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.long-press-ring {
  width: 60px;
  height: 60px;
  border: 3px solid var(--app-danger-color);
  border-radius: 50%;
  animation: pulse-ring 0.6s ease-out forwards;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.space-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  background: var(--app-danger-color);
  color: var(--app-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  pointer-events: none;
  z-index: 10;
}

.ocr-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  /* background: rgba(22, 33, 62, 0.88); */
  pointer-events: none;
  z-index: 999;
}

.dot-grid {
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.4) 2px, transparent 2px);
  background-size: 10px 10px;
  background-position: center;

  -webkit-mask-image: linear-gradient(135deg,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0) 55%
  );
  mask-image: linear-gradient(135deg,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0) 55%
  );
  -webkit-mask-size: 200% 200%;
  mask-size: 200% 200%;
  -webkit-mask-position: 100% 100%;
  mask-position: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  animation: diagonalWave 2.2s ease-in-out infinite;
}

.dot-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
  background-size: 6px 6px;
  background-position: center;

  -webkit-mask-image: linear-gradient(135deg,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0) 55%
  );
  mask-image: linear-gradient(135deg,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0) 55%
  );
  -webkit-mask-size: 200% 200%;
  mask-size: 200% 200%;
  -webkit-mask-position: 100% 100%;
  mask-position: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  animation: diagonalWave 2.2s ease-in-out infinite;
  animation-delay: 0.7s;
  opacity: 0.5;
}

@keyframes diagonalWave {
  0%, 100% {
    -webkit-mask-position: 100% 100%;
    mask-position: 100% 100%;
    opacity: 0.3;
  }
  50% {
    -webkit-mask-position: 0% 0%;
    mask-position: 0% 0%;
    opacity: 1;
  }
}

.ocr-loading-text {
  position: absolute;
  bottom: 24px;
  font-size: 14px;
  color: var(--app-text-color-secondary);
  font-weight: 600;
}

.copy-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--app-bg-color-overlay);
  border: 1px solid var(--app-border-color-dark);
  border-radius: 8px;
  z-index: 20;
}

.copy-count {
  font-size: 12px;
  color: var(--app-text-color-secondary);
  margin-right: 4px;
}

.copy-btn {
  padding: 5px 10px;
  background: var(--app-danger-color);
  color: var(--app-text-color-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: var(--app-danger-5);
  }

  &.secondary {
    background: var(--app-fill-color-darker);
    border: 1px solid var(--app-danger-color);

    &:hover {
      background: var(--app-danger-color);
    }
  }
}


</style>
