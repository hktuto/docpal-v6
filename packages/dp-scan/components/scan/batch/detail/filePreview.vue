<script lang="ts" setup>
import { useBatchDetailContext } from '#imports'

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const {
  previewLoading,
  previewImgUrl,
  currentPageNumber,
  totalPages,
  highlightedSection,
  highlightedField,
  changePage
} = context

// Canvas refs
const canvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLDivElement>()

// Image loading state
const imageObj = ref<HTMLImageElement>()
const imageLoading = ref(false)

// Parse zone string to coordinates
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

// Draw image and highlights on canvas
function drawCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  const img = imageObj.value

  if (!canvas || !container || !img) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Calculate scale to fit image in container while maintaining aspect ratio
  const containerRect = container.getBoundingClientRect()
  const scale = Math.min(
    containerRect.width / img.naturalWidth,
    containerRect.height / img.naturalHeight,
    1 // Don't upscale beyond 100%
  )

  const displayWidth = img.naturalWidth * scale
  const displayHeight = img.naturalHeight * scale

  // Set canvas size
  canvas.width = displayWidth
  canvas.height = displayHeight

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw image
  ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

  // Draw section highlight if on current page
  if (highlightedSection.value && currentPageNumber.value === highlightedSection.value.page) {
    const zone = parseZone(highlightedSection.value.zone)
    if (zone) {
      drawHighlightBox(ctx, zone, scale, '#409EFF', 2) // Blue for section
    }
  }

  // Draw field highlight if on current page
  if (highlightedField.value && currentPageNumber.value === highlightedField.value.page) {
    const zone = parseZone(highlightedField.value.zone)
    if (zone) {
      drawHighlightBox(ctx, zone, scale, '#67C23A', 2) // Green for field
    }
  }
}

// Draw a single highlight box
function drawHighlightBox(
  ctx: CanvasRenderingContext2D,
  zone: { x: number; y: number; width: number; height: number },
  scale: number,
  color: string,
  lineWidth: number
) {
  const x = zone.x * scale
  const y = zone.y * scale
  const w = zone.width * scale
  const h = zone.height * scale

  // Draw semi-transparent fill
  ctx.fillStyle = color + '20' // 20 hex = ~12% opacity
  ctx.fillRect(x, y, w, h)

  // Draw border
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.strokeRect(x, y, w, h)

  // Draw corner handles
  const handleSize = 6
  ctx.fillStyle = color

  // Top-left
  ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
  // Top-right
  ctx.fillRect(x + w - handleSize/2, y - handleSize/2, handleSize, handleSize)
  // Bottom-left
  ctx.fillRect(x - handleSize/2, y + h - handleSize/2, handleSize, handleSize)
  // Bottom-right
  ctx.fillRect(x + w - handleSize/2, y + h - handleSize/2, handleSize, handleSize)
}

// Load image when preview URL changes
watch(() => previewImgUrl.value, (url) => {
  if (!url) return

  imageLoading.value = true
  const img = new Image()
  img.onload = () => {
    imageObj.value = img
    imageLoading.value = false
    nextTick(() => drawCanvas())
  }
  img.onerror = () => {
    imageLoading.value = false
  }
  img.src = url
}, { immediate: true })

// Redraw when highlights change
watch(() => highlightedSection.value, () => {
  drawCanvas()
}, { deep: true })

watch(() => highlightedField.value, () => {
  drawCanvas()
}, { deep: true })

// Handle window resize
function handleResize() {
  drawCanvas()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Navigation functions
function prevPage() {
  if (currentPageNumber.value && currentPageNumber.value > 1) {
    changePage(currentPageNumber.value - 1)
  }
}

function nextPage() {
  if (currentPageNumber.value && totalPages.value &&
      currentPageNumber.value < totalPages.value) {
    changePage(currentPageNumber.value + 1)
  }
}
</script>

<template>
  <div v-loading="previewLoading" class="previewContainer">
    <div class="previewHeader">
      <div class="action">
        <!-- Action buttons can go here -->
      </div>
      <div class="pageNav">
        <ElButton
          :disabled="(currentPageNumber || 1) <= 1"
          link
          @click="prevPage"
        >
          <Icon name="lucide:chevron-left" />
        </ElButton>

        <div class="pageNumbers">
          <span
            v-for="page in totalPages"
            :key="page"
            :class="{ num: true, active: currentPageNumber === page }"
            @click="changePage(page)"
          >
            {{ page }}
          </span>
        </div>

        <ElButton
          :disabled="(currentPageNumber || 1) >= (totalPages || 1)"
          link
          @click="nextPage"
        >
          <Icon name="lucide:chevron-right" />
        </ElButton>
      </div>

      <div class="pageInfo">
        Page {{ currentPageNumber || 1 }} of {{ totalPages || 1 }}
      </div>
    </div>

    <div
      ref="containerRef"
      v-loading="imageLoading"
      class="previewBody"
    >
      <canvas
        v-if="previewImgUrl"
        ref="canvasRef"
        class="previewCanvas"
      />
      <ElEmpty v-else description="No preview available" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.previewContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.previewHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.action {
  flex: 1;
}

.pageNav {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.pageNumbers {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.num {
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-color-secondary);
  cursor: pointer;
  border-radius: var(--app-radius-s);
  font-size: var(--app-font-size-s);

  &:hover {
    background-color: var(--app-bg-color-hover);
  }

  &.active {
    background-color: var(--app-primary-color);
    color: white;
    cursor: default;
  }
}

.pageInfo {
  flex: 1;
  text-align: right;
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.previewBody {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--app-bg-color-secondary);
  padding: var(--app-space-m);
}

.previewCanvas {
  max-width: 100%;
  max-height: 100%;
  box-shadow: var(--app-shadow-l);
}
</style>
