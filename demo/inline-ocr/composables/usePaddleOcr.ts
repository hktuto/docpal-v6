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

  async function recognize(image: HTMLImageElement | HTMLCanvasElement): Promise<OcrResult> {
    if (!paddleOcrState.isReady) {
      await waitForReady()
    }

    if (!paddleOcrState.instance) {
      throw new Error('OCR module not loaded')
    }

    try {
      // Convert canvas/image to blob for the SDK
      let input: Blob | HTMLImageElement | HTMLCanvasElement = image
      if (image instanceof HTMLCanvasElement) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          image.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png')
        })
        input = blob
      }

      const [result] = await paddleOcrState.instance.predict(input)
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
