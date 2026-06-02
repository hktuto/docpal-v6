<script setup lang="ts">
import { useCanvasViewport } from '../../../composables/useCanvasViewport'
import { useLongPress } from '../../../composables/useLongPress'
import { usePaddleOcr } from '../../../composables/usePaddleOcr'
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

const { state, transformStyle, reset, zoomToFit, isDragging } = useCanvasViewport(
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

const ocr = usePaddleOcr()

function loadImage(src: string) {
  imageLoaded.value = false
  ocrResult.value = null
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
  const xs = boxPoints.map((p) => p[0])
  const ys = boxPoints.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  const width = maxX - minX
  const height = maxY - minY

  return {
    position: 'absolute' as const,
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${width}px`,
    height: `${height}px`,
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

watch(() => props.src, (newSrc) => {
  if (newSrc) loadImage(newSrc)
}, { immediate: true })

watch(() => [state.scale, state.translateX, state.translateY], () => {
  // Overlays automatically follow the wrapper transform
})
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
            :style="getBoxStyle(box.points)"
          >
            <span class="text-content">{{ box.text }}</span>
          </div>
        </div>
      </div>

      <div v-else class="placeholder">
        <span>Loading image...</span>
      </div>

      <div v-if="isPressed && !isProcessing" class="long-press-indicator">
        <div class="long-press-ring" />
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
  cursor: grab;

  &.is-dragging {
    cursor: grabbing;
  }

  &.is-pressed {
    cursor: grab;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: text;
  border: 1px solid rgba(233, 69, 96, 0.3);
  background: rgba(233, 69, 96, 0.08);
  border-radius: 2px;
  transition: background 0.2s;

  &:hover {
    background: rgba(233, 69, 96, 0.2);
    border-color: rgba(233, 69, 96, 0.6);
  }
}

.text-content {
  font-size: 14px;
  color: transparent;
  user-select: text;
  -webkit-user-select: text;
  line-height: 1.2;
  text-shadow: 0 0 0 rgba(255, 255, 255, 0.85);
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
