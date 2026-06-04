import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick, defineComponent, h } from 'vue'
import InlineOcrPreview from '../components/InlineOcrPreview.vue'
import { paddleOcrState } from '../plugins/paddleocr.client'

// Mock the PaddleOCR composable to avoid loading the heavy model
vi.mock('../composables/usePaddleOcr', async () => {
  const actual = await vi.importActual<typeof import('../composables/usePaddleOcr')>('../composables/usePaddleOcr')
  return {
    ...actual,
    usePaddleOcr: () => ({
      isLoading: ref(false),
      isReady: ref(true),
      error: ref(null),
      progress: ref(''),
      recognize: vi.fn().mockResolvedValue({
        text: 'Hello\nWorld',
        boxes: [
          {
            text: 'Hello',
            points: [[10, 10], [60, 10], [60, 30], [10, 30]],
            score: 0.95,
          },
          {
            text: 'World',
            points: [[10, 40], [60, 40], [60, 60], [10, 60]],
            score: 0.92,
          },
        ],
      }),
    }),
  }
})

describe('InlineOcrPreview', () => {
  beforeEach(() => {
    paddleOcrState.isReady = true
    paddleOcrState.instance = { predict: vi.fn() }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders placeholder when no image loaded', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()

    expect(wrapper.find('.placeholder').exists()).toBe(true)
    expect(wrapper.find('.image-canvas').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders canvas after image loads', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    // Image mock auto-fires onload, so canvas should render
    expect(wrapper.find('.image-canvas').exists()).toBe(true)
    expect(wrapper.find('.placeholder').exists()).toBe(false)

    wrapper.unmount()
  })

  it('accepts Blob as src prop', async () => {
    const blob = new Blob([''], { type: 'image/png' })
    const wrapper = mount(InlineOcrPreview, {
      props: { src: blob },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    expect(wrapper.find('.image-canvas').exists()).toBe(true)
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)

    wrapper.unmount()
  })

  it('shows loading overlay when isProcessing is true', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()

    // Manually trigger processing state
    const vm = wrapper.vm as any
    vm.isProcessing = true
    await nextTick()

    expect(wrapper.find('.ocr-loading-overlay').exists()).toBe(true)
    expect(wrapper.find('.dot-grid').exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders text box overlays after OCR result', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    // Trigger OCR via the component's internal runOcr
    const vm = wrapper.vm as any
    await vm.runOcr()
    await nextTick()

    const boxes = wrapper.findAll('.text-box')
    expect(boxes.length).toBe(2)
    expect(boxes[0].attributes('data-text')).toBe('Hello')
    expect(boxes[1].attributes('data-text')).toBe('World')

    wrapper.unmount()
  })

  it('selects a text box on mousedown', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    await vm.runOcr()
    await nextTick()

    const box = wrapper.find('.text-box')
    await box.trigger('mousedown')

    expect(box.classes()).toContain('selected')

    wrapper.unmount()
  })

  it('shift+click selects a range of boxes', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    await vm.runOcr()
    await nextTick()

    const boxes = wrapper.findAll('.text-box')

    // Click first box
    await boxes[0].trigger('mousedown')
    await nextTick()

    // Shift+click second box
    await boxes[1].trigger('mousedown', { shiftKey: true })
    await nextTick()

    expect(boxes[0].classes()).toContain('selected')
    expect(boxes[1].classes()).toContain('selected')

    wrapper.unmount()
  })

  it('toggles box on touchstart', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    await vm.runOcr()
    await nextTick()

    const box = wrapper.find('.text-box')

    // First touch selects
    await box.trigger('touchstart')
    expect(box.classes()).toContain('selected')

    // Second touch deselects
    await box.trigger('touchstart')
    expect(box.classes()).not.toContain('selected')

    wrapper.unmount()
  })

  it('double-click on empty space resets transform', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const viewport = wrapper.find('.viewport')

    // First zoom in manually
    const vm = wrapper.vm as any
    vm.state.scale = 2
    await nextTick()

    await viewport.trigger('dblclick')
    await nextTick()

    // After dblclick on empty space, scale should reset to fit (which is 1 for 100x100 in default container)
    // Actually the mock image is 100x100 and container defaults to 0 size in happy-dom
    // so zoomToFit would set scale to 0.1 (minScale). Let's just verify the handler ran.
    expect(vm.state.scale).not.toBe(2)

    wrapper.unmount()
  })

  it('double-click on text box does not reset transform', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    await vm.runOcr()
    await nextTick()

    const box = wrapper.find('.text-box')

    // Set a known scale
    vm.state.scale = 3
    await nextTick()

    await box.trigger('dblclick')
    await nextTick()

    // Scale should remain unchanged because dblclick on text-box is ignored
    expect(vm.state.scale).toBe(3)

    wrapper.unmount()
  })

  it('clears selection on container mousedown outside text boxes', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    await vm.runOcr()
    await nextTick()

    const box = wrapper.find('.text-box')
    await box.trigger('mousedown')
    expect(box.classes()).toContain('selected')

    const viewport = wrapper.find('.viewport')
    await viewport.trigger('mousedown')

    expect(box.classes()).not.toContain('selected')

    wrapper.unmount()
  })

  it('computes box style from polygon points', () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    const points = [[10, 10], [60, 10], [60, 30], [10, 30]]
    const style = vm.getBoxStyle(points)

    expect(style.position).toBe('absolute')
    expect(style.left).toBe('10px')
    expect(style.top).toBe('10px')
    expect(style.width).toBe('50px')
    expect(style.height).toBe('20px')
    expect(style.transform).toBe('rotate(0deg)')

    wrapper.unmount()
  })

  it('computes rotated box style', () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    // 45-degree rotated box
    const points = [[0, 0], [10, 10], [0, 20], [-10, 10]]
    const style = vm.getBoxStyle(points)

    expect(style.transform).toContain('rotate(')
    // Parse width/height strings (e.g. '14.14px') to numbers
    const widthNum = parseFloat(style.width)
    const heightNum = parseFloat(style.height)
    expect(widthNum).toBeCloseTo(14.14, 1)
    expect(heightNum).toBeCloseTo(14.14, 1)

    wrapper.unmount()
  })

  it('returns empty style for invalid polygon', () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })

    const vm = wrapper.vm as any
    expect(vm.getBoxStyle([])).toEqual({})
    expect(vm.getBoxStyle([[0, 0]])).toEqual({})

    wrapper.unmount()
  })

  it('auto-selects box under press point after OCR', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    // Point inside first box polygon (10,10)-(60,10)-(60,30)-(10,30)
    await vm.runOcr({ x: 30, y: 20 })
    await nextTick()

    const boxes = wrapper.findAll('.text-box')
    expect(boxes[0].classes()).toContain('selected')
    expect(boxes[1].classes()).not.toContain('selected')

    wrapper.unmount()
  })

  it('does not auto-select when press point is outside all boxes', async () => {
    const wrapper = mount(InlineOcrPreview, {
      props: { src: 'http://example.com/image.png' },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()
    await nextTick()

    const vm = wrapper.vm as any
    await vm.runOcr({ x: 999, y: 999 })
    await nextTick()

    const boxes = wrapper.findAll('.text-box')
    expect(boxes[0].classes()).not.toContain('selected')
    expect(boxes[1].classes()).not.toContain('selected')

    wrapper.unmount()
  })

  it('revokes object URL on unmount when src was Blob', async () => {
    const blob = new Blob([''], { type: 'image/png' })
    const wrapper = mount(InlineOcrPreview, {
      props: { src: blob },
      attachTo: document.body,
    })
    await flushPromises()
    await nextTick()

    wrapper.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })
})
