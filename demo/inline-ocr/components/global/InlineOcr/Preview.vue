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

// Click-vs-drag detection for box-level vs character-level selection
const clickTrack = ref<{
  startTime: number
  startX: number
  startY: number
  index: number
  shiftKey: boolean
  active: boolean
} | null>(null)

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

  // Estimate font size from box height so text roughly fits
  const fontSize = Math.min(Math.max(textHeight * 0.85, 8), textHeight)

  return {
    position: 'absolute' as const,
    left: `${p0[0]}px`,
    top: `${p0[1]}px`,
    width: `${textWidth}px`,
    height: `${textHeight}px`,
    transform: `rotate(${angleDeg}deg)`,
    transformOrigin: '0 0',
    fontSize: `${fontSize}px`,
    lineHeight: `${textHeight}px`,
  }
}

function onBoxMouseDown(index: number, e: MouseEvent) {
  clickTrack.value = {
    startTime: Date.now(),
    startX: e.clientX,
    startY: e.clientY,
    index,
    shiftKey: e.shiftKey,
    active: true,
  }
}

function onWindowMouseMove(e: MouseEvent) {
  if (!clickTrack.value?.active) return
  const dx = e.clientX - clickTrack.value.startX
  const dy = e.clientY - clickTrack.value.startY
  if (Math.sqrt(dx * dx + dy * dy) > 8) {
    // Moved enough — this is a drag (native character selection)
    clickTrack.value.active = false
  }
}

function onWindowMouseUp() {
  if (!clickTrack.value) return
  const track = clickTrack.value
  clickTrack.value = null

  if (!track.active) return // Was a drag, let native selection handle it

  // It was a click (no significant movement)
  if (track.shiftKey && selection.anchorIndex.value !== null) {
    // Shift+click = range select boxes
    window.getSelection()?.removeAllRanges()
    selection.selectRange(selection.anchorIndex.value, track.index)
  } else {
    // Regular click = select/deselect single box, clearing native selection
    window.getSelection()?.removeAllRanges()
    selection.selectOnly(track.index)
  }
}

function onBoxTouchStart(index: number) {
  // On touch, tap toggles single selection
  selection.toggleSingle(index)
}

function onContainerMouseDown(e: MouseEvent) {
  // Click outside text boxes clears selection
  const target = e.target as HTMLElement
  if (!target.closest('.text-box')) {
    selection.clearSelection()
    window.getSelection()?.removeAllRanges()
  }
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
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
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
        <button class="btn" :disabled="!imageLoaded || ocr.isLoading.value" @click="runOcr">
          <span>{{ ocr.isLoading.value ? 'Processing...' : 'Run OCR' }}</span>
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
            :class="{ 'box-selected': selection.isSelected(index) }"
            :style="getBoxStyle(box.points)"
            :data-text="box.text"
            :data-index="index"
            @mousedown="onBoxMouseDown(index, $event)"
            @touchstart.stop="onBoxTouchStart(index)"
          >
            {{ box.text }}
          </div>
        </div>
      </div>

      <div v-else class="placeholder">
        <span>Loading image...</span>
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

    <div v-if="ocrResult" class="result-panel">
      <div class="result-header">
        <span class="result-title">Extracted Text</span>
        <span class="result-count">{{ ocrResult.boxes.length }} regions</span>
      </div>
      <pre class="result-text">{{ ocrResult.text }}</pre>
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
  color: transparent;
  text-shadow: none;
  background: transparent;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  user-select: text;
  -webkit-user-select: text;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-weight: 400;
  letter-spacing: normal;
  transition: background 0.15s;

  &:hover {
    background: rgba(233, 69, 96, 0.06);
  }

  // Native character-level selection highlight
  &::selection {
    background: rgba(233, 69, 96, 0.4);
    color: transparent;
    text-shadow: none;
  }

  // Custom box-level selection highlight
  &.box-selected {
    background: rgba(233, 69, 96, 0.15);
    box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.35);
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

.result-panel {
  flex-shrink: 0;
  max-height: 200px;
  overflow: auto;
  background: #16213e;
  border-top: 1px solid #0f3460;
  padding: 12px 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #e94560;
}

.result-count {
  font-size: 12px;
  color: #a0a0a0;
}

.result-text {
  margin: 0;
  font-size: 12px;
  color: #d0d0d0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 140px;
  overflow: auto;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
</style>
