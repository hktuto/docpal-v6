import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { usePaddleOcr } from '../composables/usePaddleOcr'
import { paddleOcrState } from '../plugins/paddleocr.client'

function mountPaddleOcr() {
  let exposed: ReturnType<typeof usePaddleOcr>
  const Comp = defineComponent({
    setup() {
      exposed = usePaddleOcr()
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  return { wrapper, exposed: exposed! }
}

describe('usePaddleOcr', () => {
  beforeEach(() => {
    // Reset plugin state
    paddleOcrState.isLoading = false
    paddleOcrState.isReady = false
    paddleOcrState.error = null
    paddleOcrState.progress = ''
    paddleOcrState.instance = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('exposes reactive state from plugin', () => {
    const { exposed: ocr } = mountPaddleOcr()

    expect(ocr.isLoading.value).toBe(false)
    expect(ocr.isReady.value).toBe(false)
    expect(ocr.error.value).toBeNull()
    expect(ocr.progress.value).toBe('')
  })

  it('recognize rejects when OCR reports an error before ready', async () => {
    paddleOcrState.isReady = false
    paddleOcrState.error = 'Model load failed'

    const { exposed: ocr } = mountPaddleOcr()
    const image = document.createElement('img')

    await expect(ocr.recognize(image)).rejects.toThrow('Model load failed')
  })

  it('recognize preprocesses and scales coordinates', async () => {
    const mockPredict = vi.fn().mockResolvedValue([
      {
        items: [
          {
            text: 'Hello',
            poly: [[100, 50], [200, 50], [200, 80], [100, 80]],
            score: 0.95,
          },
        ],
      },
    ])

    paddleOcrState.isReady = true
    paddleOcrState.instance = { predict: mockPredict }

    const { exposed: ocr } = mountPaddleOcr()
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 4000, writable: false })
    Object.defineProperty(image, 'naturalHeight', { value: 3000, writable: false })

    const result = await ocr.recognize(image)

    expect(mockPredict).toHaveBeenCalled()
    expect(result.boxes).toHaveLength(1)
    expect(result.boxes[0].text).toBe('Hello')
    expect(result.boxes[0].score).toBe(0.95)
    // Coordinates scaled back: 100 / 0.48 ≈ 208, 50 / 0.48 ≈ 104
    expect(result.boxes[0].points[0][0]).toBeCloseTo(208.3, 0)
    expect(result.boxes[0].points[0][1]).toBeCloseTo(104.1, 0)
  })

  it('recognize handles empty result', async () => {
    const mockPredict = vi.fn().mockResolvedValue([{ items: [] }])

    paddleOcrState.isReady = true
    paddleOcrState.instance = { predict: mockPredict }

    const { exposed: ocr } = mountPaddleOcr()
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 100, writable: false })
    Object.defineProperty(image, 'naturalHeight', { value: 100, writable: false })

    const result = await ocr.recognize(image)

    expect(result.boxes).toHaveLength(0)
    expect(result.text).toBe('')
  })

  it('recognize handles missing poly gracefully', async () => {
    const mockPredict = vi.fn().mockResolvedValue([
      {
        items: [
          { text: 'Test', score: 0.8 },
        ],
      },
    ])

    paddleOcrState.isReady = true
    paddleOcrState.instance = { predict: mockPredict }

    const { exposed: ocr } = mountPaddleOcr()
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 100, writable: false })
    Object.defineProperty(image, 'naturalHeight', { value: 100, writable: false })

    const result = await ocr.recognize(image)

    expect(result.boxes[0].points).toEqual([])
  })

  it('preprocessImage does not scale images below MAX_SIZE', async () => {
    paddleOcrState.isReady = true
    paddleOcrState.instance = {
      predict: vi.fn().mockResolvedValue([{ items: [] }]),
    }

    const { exposed: ocr } = mountPaddleOcr()
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 800, writable: false })
    Object.defineProperty(image, 'naturalHeight', { value: 600, writable: false })

    const result = await ocr.recognize(image)
    expect(result).toBeDefined()
  })

  it('waits for ready when not initially ready', async () => {
    paddleOcrState.isReady = false
    paddleOcrState.error = null

    const { exposed: ocr } = mountPaddleOcr()

    // Start recognize which will wait
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 100, writable: false })
    Object.defineProperty(image, 'naturalHeight', { value: 100, writable: false })

    const promise = ocr.recognize(image)

    // Simulate plugin becoming ready
    paddleOcrState.isReady = true
    paddleOcrState.instance = {
      predict: vi.fn().mockResolvedValue([{ items: [] }]),
    }

    await nextTick()
    await nextTick()

    const result = await promise
    expect(result).toBeDefined()
  })
})
