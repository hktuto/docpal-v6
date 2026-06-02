<script setup lang="ts">
function generateSampleImage(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#1a1a2e'
  ctx.font = 'bold 36px "Segoe UI", sans-serif'
  ctx.fillText('DocPal Inline OCR Demo', 40, 60)

  ctx.fillStyle = '#333333'
  ctx.font = '18px "Segoe UI", sans-serif'
  ctx.fillText('This is a demonstration of the inline OCR image preview component.', 40, 110)
  ctx.fillText('Long-press on the image to trigger PaddleOCR text recognition.', 40, 140)
  ctx.fillText('You can also zoom, pan, and select recognized text from the overlay.', 40, 170)

  ctx.strokeStyle = '#e94560'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 200, 720, 1)

  ctx.fillStyle = '#1a1a2e'
  ctx.font = 'bold 24px "Segoe UI", sans-serif'
  ctx.fillText('Sample Document', 40, 250)

  ctx.font = '16px "Segoe UI", sans-serif'
  const lines = [
    'Invoice #: INV-2024-001',
    'Date: June 2, 2026',
    '',
    'To: DocPal Solutions Ltd.',
    'Address: 123 Innovation Drive, Tech City',
    '',
    'Item description          Qty    Unit Price    Total',
    '-------------------------------------------------------',
    'Document Processing       10     $50.00        $500.00',
    'OCR Recognition Service   5      $120.00       $600.00',
    'Cloud Storage (1TB)       1      $99.00        $99.00',
    '-------------------------------------------------------',
    '                                              $1,199.00',
    '',
    'Thank you for your business!',
    'For support, contact: support@docpal.com',
  ]

  let y = 290
  lines.forEach((line) => {
    if (line.startsWith('---')) {
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, y - 5)
      ctx.lineTo(760, y - 5)
      ctx.stroke()
    } else if (line.includes('DocPal') || line.includes('Invoice') || line.includes('Sample')) {
      ctx.fillStyle = '#1a1a2e'
      ctx.font = 'bold 16px "Courier New", monospace'
      ctx.fillText(line, 40, y)
      ctx.font = '16px "Courier New", monospace'
    } else {
      ctx.fillStyle = '#333333'
      ctx.fillText(line, 40, y)
    }
    y += 24
  })

  ctx.strokeStyle = '#0f3460'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 220, 740, 340)

  return canvas.toDataURL('image/png')
}

const currentSrc = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function useSample() {
  currentSrc.value = generateSampleImage()
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    currentSrc.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

function triggerUpload() {
  fileInput.value?.click()
}

onMounted(() => {
  useSample()
})
</script>

<template>
  <div class="demo-page">
    <div class="demo-header">
      <h1>Inline OCR Image Preview</h1>
      <p class="subtitle">
        Canvas-based image preview with zoom, pan, and PaddleOCR text overlay
      </p>
      <div class="actions">
        <button class="action-btn" @click="triggerUpload">
          Upload Image
        </button>
        <button class="action-btn secondary" @click="useSample">
          Use Sample
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileChange"
        >
      </div>
    </div>

    <div class="preview-container">
      <InlineOcrPreview v-if="currentSrc" :src="currentSrc" />
    </div>

    <div class="instructions">
      <div class="instruction-card">
        <div class="icon">🖱️</div>
        <h3>Zoom & Pan</h3>
        <p>Scroll to zoom, drag to pan. Use toolbar buttons for quick zoom controls.</p>
      </div>
      <div class="instruction-card">
        <div class="icon">👆</div>
        <h3>Long Press</h3>
        <p>Hold down on the image for 600ms to trigger OCR recognition.</p>
      </div>
      <div class="instruction-card">
        <div class="icon">✏️</div>
        <h3>Select Text</h3>
        <p>After OCR completes, click "Show Text" and select text from the overlay.</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.demo-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f23;
  color: #eaeaea;
}

.demo-header {
  padding: 20px 24px;
  background: #1a1a2e;
  border-bottom: 1px solid #16213e;
  flex-shrink: 0;

  h1 {
    margin: 0 0 6px 0;
    font-size: 24px;
    font-weight: 700;
    color: #e94560;
  }

  .subtitle {
    margin: 0 0 14px 0;
    font-size: 14px;
    color: #a0a0a0;
  }
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  background: #e94560;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #d13650;
  }

  &.secondary {
    background: #16213e;
    border: 1px solid #0f3460;

    &:hover {
      background: #0f3460;
    }
  }
}

.preview-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.instructions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px 24px;
  background: #1a1a2e;
  border-top: 1px solid #16213e;
  flex-shrink: 0;
}

.instruction-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #0f3460;

  .icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  h3 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #e94560;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #a0a0a0;
    line-height: 1.4;
  }
}

@media (max-width: 768px) {
  .instructions {
    grid-template-columns: 1fr;
  }
}
</style>
