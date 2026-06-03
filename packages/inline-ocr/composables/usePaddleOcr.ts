import { computed, watch } from 'vue'
import { paddleOcrState } from '../plugins/paddleocr.client'

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
  const isLoading = computed(() => paddleOcrState.isLoading)
  const isReady = computed(() => paddleOcrState.isReady)
  const error = computed(() => paddleOcrState.error)
  const progress = computed(() => paddleOcrState.progress)

  async function waitForReady(): Promise<void> {
    if (paddleOcrState.isReady) return
    if (paddleOcrState.error) throw new Error(paddleOcrState.error)

    return new Promise<void>((resolve, reject) => {
      const stop = watch(
        [() => paddleOcrState.isReady, () => paddleOcrState.error],
        ([ready, err]) => {
          if (ready) {
            stop()
            resolve()
          }
          if (err) {
            stop()
            reject(new Error(err))
          }
        },
        { immediate: true }
      )
    })
  }

  async function preprocessImage(image: HTMLImageElement | HTMLCanvasElement): Promise<{ blob: Blob; scale: number }> {
    const MAX_SIZE = 1920

    const canvas = document.createElement('canvas')
    const origWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width
    const origHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height
    let width = origWidth
    let height = origHeight
    let scale = 1

    if (Math.max(width, height) > MAX_SIZE) {
      scale = MAX_SIZE / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
    ctx.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png')
    })

    return { blob, scale }
  }

  async function recognize(image: HTMLImageElement | HTMLCanvasElement): Promise<OcrResult> {
    if (!paddleOcrState.isReady) {
      await waitForReady()
    }

    if (!paddleOcrState.instance) {
      throw new Error('OCR module not loaded')
    }

    try {
      const { blob: input, scale } = await preprocessImage(image)

      const [result] = await paddleOcrState.instance.predict(input)
      const items = result?.items || []

      const boxes: OcrTextBox[] = items.map((item: any) => ({
        text: item.text || '',
        points: (item.poly || []).map((p: number[]) => [p[0] / scale, p[1] / scale]),
        score: item.score || 0,
      }))

      const fullText = boxes.map((b) => b.text).join('\n')

      return {
        text: fullText,
        boxes,
      }
    } catch (err: any) {
      throw err
    }
  }

  return {
    isLoading,
    isReady,
    error,
    progress,
    recognize,
  }
}
