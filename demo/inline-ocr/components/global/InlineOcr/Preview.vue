<script setup lang="ts">
import { useCanvasViewport } from '../../../composables/useCanvasViewport'
import { useLongPress } from '../../../composables/useLongPress'
import { usePaddleOcr } from '../../../composables/usePaddleOcr'
import { useTextSelection } from '../../../composables/useTextSelection'
import type { OcrResult } from '../../../composables/usePaddleOcr'

const props = defineProps<{
  src: string
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

const { state, transformStyle, cursorStyle, reset, zoomToFit, isDragging, isSpacePressed } = useCanvasViewport(
  canvasRef,
  containerRef,
  { minScale: 0.05, maxScale: 20, zoomSpeed: 0.002 }
)

const { isPressed } = useLongPress(
  containerRef,
  async () => {
    if (isProcessing.value) return
    await runOcr()
  },
  { delay: 600, moveThreshold: 15 }
)

const selection = useTextSelection(computed(() => ocrResult.value?.boxes ?? []))

const ocr = usePaddleOcr()

function loadImage(src: string) {
  imageLoaded.value = false
  ocrResult.value = null
  selection.clearSelection()
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
  img.src = src
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

async function runOcr() {
  if (!imageRef.value) return
  isProcessing.value = true
  selection.clearSelection()
  try {
    const result = await ocr.recognize(imageRef.value)
    ocrResult.value = result
    console.log('OCR result:', result.text)
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
  const container = containerRef.value
  if (!container) return
  const cx = container.clientWidth / 2
  const cy = container.clientHeight / 2
  const scaleRatio = newScale / state.scale
  const newTx = cx - (cx - state.translateX) * scaleRatio
  const newTy = cy - (cy - state.translateY) * scaleRatio
  state.scale = newScale
  state.translateX = newTx
  state.translateY = newTy
}

function zoomOut() {
  const newScale = Math.max(0.05, state.scale / 1.25)
  const container = containerRef.value
  if (!container) return
  const cx = container.clientWidth / 2
  const cy = container.clientHeight / 2
  const scaleRatio = newScale / state.scale
  const newTx = cx - (cx - state.translateX) * scaleRatio
  const newTy = cy - (cy - state.translateY) * scaleRatio
  state.scale = newScale
  state.translateX = newTx
  state.translateY = newTy
}

onMounted(() => {
  window.addEventListener('mouseup', onWindowMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onWindowMouseUp)
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
        <div class="ocr-spinner" />
        <span class="ocr-loading-text">Processing OCR...</span>
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
  background: #1a1a2e;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 6px;
}

.btn {
  padding: 6px 12px;
  background: #0f3460;
  color: #e94560;
  border: 1px solid #e94560;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #e94560;
    color: #fff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.status-text {
  font-size: 12px;
  color: #a0a0a0;
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
    background: rgba(233, 69, 96, 0.08);
  }

  &.selected {
    background: rgba(233, 69, 96, 0.3);
    box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.5);
  }
}

.placeholder {
  color: #a0a0a0;
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
  border: 3px solid #e94560;
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
  background: rgba(233, 69, 96, 0.9);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  pointer-events: none;
  z-index: 10;
}

.ocr-loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
  z-index: 15;
}

.ocr-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(233, 69, 96, 0.2);
  border-top-color: #e94560;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ocr-loading-text {
  font-size: 14px;
  color: #e94560;
  font-weight: 600;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.copy-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(22, 33, 62, 0.95);
  border: 1px solid #0f3460;
  border-radius: 8px;
  z-index: 20;
}

.copy-count {
  font-size: 12px;
  color: #a0a0a0;
  margin-right: 4px;
}

.copy-btn {
  padding: 5px 10px;
  background: #e94560;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #d13650;
  }

  &.secondary {
    background: #0f3460;
    border: 1px solid #e94560;

    &:hover {
      background: #e94560;
    }
  }
}


</style>
