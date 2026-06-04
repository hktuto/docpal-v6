import { vi } from 'vitest'

// Stub common Nuxt/Vue globals used across the monorepo
const mockI18n = {
  t: (key: string) => key,
  locale: 'en',
  locales: ['en', 'zh'],
  setLocale: vi.fn(),
  getLocaleCookie: vi.fn(),
  setLocaleCookie: vi.fn()
}
vi.stubGlobal('useI18n', () => mockI18n)

const useRuntimeConfig = vi.fn(() => ({
  public: { endPoint: { upload: 'http://example.com' } }
}))
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)

// Canvas mocking for happy-dom
global.HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
  if (type === '2d') {
    return {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      closePath: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      measureText: vi.fn(() => ({ width: 0 })),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as any
  }
  return null
})

global.HTMLCanvasElement.prototype.toBlob = vi.fn(function (this: HTMLCanvasElement, callback: BlobCallback | null) {
  if (callback) {
    callback(new Blob([''], { type: 'image/png' }))
  }
})

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,')

// Mock URL.createObjectURL / revokeObjectURL
const objectUrls = new Map<string, Blob>()

URL.createObjectURL = vi.fn((blob: Blob) => {
  const url = `blob:mock://${Math.random().toString(36).slice(2)}`
  objectUrls.set(url, blob)
  return url
})

URL.revokeObjectURL = vi.fn((url: string) => {
  objectUrls.delete(url)
})

// Mock Image
global.Image = class MockImage {
  src = ''
  crossOrigin: string | null = null
  width = 100
  height = 100
  naturalWidth = 100
  naturalHeight = 100
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
} as any

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Mock document.execCommand
document.execCommand = vi.fn().mockReturnValue(true)

// ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Suppress console noise during tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}
