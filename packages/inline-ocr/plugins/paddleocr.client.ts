import { reactive } from 'vue'

export interface PaddleOcrPluginState {
  isLoading: boolean
  isReady: boolean
  error: string | null
  progress: string
  instance: any
}

export const paddleOcrState = reactive<PaddleOcrPluginState>({
  isLoading: false,
  isReady: false,
  error: null,
  progress: '',
  instance: null,
})

async function loadPaddleOcr() {
  paddleOcrState.isLoading = true
  paddleOcrState.progress = 'Loading OCR engine...'

  try {
    const { PaddleOCR } = await import('@paddleocr/paddleocr-js')
    paddleOcrState.progress = 'Downloading models (first time may take a while)...'
    const instance = await PaddleOCR.create({
      textDetectionModelName: 'PP-OCRv5_mobile_det',
      textDetectionModelAsset: {
        url: '/models/PP-OCRv5_mobile_det_onnx.tar',
      },
      textRecognitionModelName: 'PP-OCRv5_mobile_rec',
      textRecognitionModelAsset: {
        url: '/models/PP-OCRv5_mobile_rec_onnx.tar',
      },
      ortOptions: {
        backend: 'auto',
      },
    })
    paddleOcrState.instance = instance
    paddleOcrState.isReady = true
    paddleOcrState.progress = 'Ready'
  } catch (err: any) {
    paddleOcrState.error = err?.message || 'Failed to initialize OCR'
    console.error('OCR init error:', err)
  } finally {
    paddleOcrState.isLoading = false
  }
}

export default defineNuxtPlugin((_nuxtApp) => {
  // Start loading in the background — do NOT await so app hydration is not blocked
  loadPaddleOcr()

  return {
    provide: {
      paddleocr: paddleOcrState,
    },
  }
})
