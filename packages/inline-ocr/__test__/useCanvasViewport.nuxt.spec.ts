import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useCanvasViewport } from '../composables/useCanvasViewport'

function mountComposable<T>(factory: () => T): { wrapper: ReturnType<typeof mount>; result: T } {
  let result!: T
  const Comp = defineComponent({
    setup() {
      result = factory()
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  return { wrapper, result }
}

describe('useCanvasViewport', () => {
  let container: HTMLElement
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '600px'
    document.body.appendChild(container)

    canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    container.appendChild(canvas)

    // Mock layout metrics for happy-dom
    Object.defineProperty(container, 'clientWidth', { value: 800, writable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, writable: true })
    canvas.getBoundingClientRect = vi.fn(() => ({
      x: 100, y: 100, width: 400, height: 300, top: 100, left: 100, right: 500, bottom: 400,
      toJSON: () => ({}),
    }))
  })

  afterEach(() => {
    document.body.removeChild(container)
    vi.restoreAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    expect(result.state.scale).toBe(1)
    expect(result.state.translateX).toBe(0)
    expect(result.state.translateY).toBe(0)
    expect(result.isDragging.value).toBe(false)
    expect(result.isSpacePressed.value).toBe(false)
  })

  it('computes transformStyle from state', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    result.setTransform(2, 50, 100)

    expect(result.transformStyle.value.transform).toBe('translate(50px, 100px) scale(2)')
    expect(result.transformStyle.value.transformOrigin).toBe('0 0')
  })

  it('computes cursorStyle based on interaction state', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    expect(result.cursorStyle.value).toBe('default')

    result.isSpacePressed.value = true
    expect(result.cursorStyle.value).toBe('grab')

    result.isDragging.value = true
    expect(result.cursorStyle.value).toBe('grabbing')
  })

  it('reset restores default transform', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    result.setTransform(3, 100, 200)
    result.reset()

    expect(result.state.scale).toBe(1)
    expect(result.state.translateX).toBe(0)
    expect(result.state.translateY).toBe(0)
  })

  it('setTransform clamps scale to min and max', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef, { minScale: 0.5, maxScale: 5 })
    })

    result.setTransform(0.1, 0, 0)
    expect(result.state.scale).toBe(0.5)

    result.setTransform(10, 0, 0)
    expect(result.state.scale).toBe(5)
  })

  it('zoomToFit scales image to fit container', async () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    result.zoomToFit(1600, 1200)
    await nextTick()

    // container 800x600, image 1600x1200 => scale = min(800/1600, 600/1200, 1) = 0.5
    expect(result.state.scale).toBe(0.5)
    expect(result.state.translateX).toBe(0)
    expect(result.state.translateY).toBe(0)
  })

  it('zoomToFit centers smaller image', async () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    result.zoomToFit(200, 150)
    await nextTick()

    // scale = min(800/200, 600/150, 1) = 1
    expect(result.state.scale).toBe(1)
    expect(result.state.translateX).toBe(300) // (800 - 200) / 2
    expect(result.state.translateY).toBe(225) // (600 - 150) / 2
  })

  it('getPointOnCanvas converts client coordinates to canvas space', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    result.setTransform(2, 10, 20)

    const rect = canvas.getBoundingClientRect()
    const point = result.getPointOnCanvas(rect.left + 30, rect.top + 40)

    // (130 - 100) / 2 = 15, (140 - 100) / 2 = 20
    expect(point.x).toBeCloseTo(15, 1)
    expect(point.y).toBeCloseTo(20, 1)
  })

  it('getPointOnCanvas returns zero when canvas is null', () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref<HTMLCanvasElement | null>(null)
      return useCanvasViewport(canvasRef, containerRef)
    })

    const point = result.getPointOnCanvas(100, 100)
    expect(point.x).toBe(0)
    expect(point.y).toBe(0)
  })

  it('wheel event zooms toward cursor', async () => {
    const { result } = mountComposable(() => {
      const containerRef = ref(container)
      const canvasRef = ref(canvas)
      return useCanvasViewport(canvasRef, containerRef)
    })

    result.zoomToFit(400, 300)
    await nextTick()

    const initialScale = result.state.scale

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      clientX: 200,
      clientY: 150,
      bubbles: true,
    })
    container.dispatchEvent(wheelEvent)
    await nextTick()

    // Zooming in (negative deltaY) should increase scale
    expect(result.state.scale).toBeGreaterThan(initialScale)
  })
})
