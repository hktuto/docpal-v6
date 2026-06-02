import { ref } from 'vue'

export interface OcrTextBox {
  text: string
  points: number[][] // [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
  score: number
}

export interface OcrResult {
  text: string
  boxes: OcrTextBox[]
}

export function usePaddleOcr() {
  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)
  const progress = ref('')

  let ocrInstance: any = null

  async function init() {
    if (isReady.value) return
    isLoading.value = true
    error.value = null
    progress.value = 'Loading OCR engine...'

    try {
      const { PaddleOCR } = await import('@paddleocr/paddleocr-js')
      progress.value = 'Downloading models (first time may take a while)...'
      ocrInstance = await PaddleOCR.create({
        lang: 'ch',
        ocrVersion: 'PP-OCRv5',
        ortOptions: {
          backend: 'auto',
        },
      })
      isReady.value = true
      progress.value = 'Ready'
    } catch (err: any) {
      error.value = err?.message || 'Failed to initialize OCR'
      console.error('OCR init error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function recognize(image: HTMLImageElement | HTMLCanvasElement): Promise<OcrResult> {
    if (!isReady.value) {
      await init()
    }

    if (!ocrInstance) {
      throw new Error('OCR module not loaded')
    }

    isLoading.value = true
    progress.value = 'Recognizing text...'
    error.value = null

    try {
      // Convert canvas/image to blob for the SDK
      let input: Blob | HTMLImageElement | HTMLCanvasElement = image
      if (image instanceof HTMLCanvasElement) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          image.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png')
        })
        input = blob
      }

      const [result] = await ocrInstance.predict(input)
      const items = result?.items || []

      const boxes: OcrTextBox[] = items.map((item: any) => ({
        text: item.text || '',
        points: item.poly || [],
        score: item.score || 0,
      }))

      const fullText = boxes.map((b) => b.text).join('\n')

      return {
        text: fullText,
        boxes,
      }
    } catch (err: any) {
      error.value = err?.message || 'OCR recognition failed'
      throw err
    } finally {
      isLoading.value = false
      progress.value = ''
    }
  }

  return {
    isLoading,
    isReady,
    error,
    progress,
    init,
    recognize,
  }
}
