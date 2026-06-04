import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useLongPress } from '../composables/useLongPress'

function mountLongPress(
  handler: (e: MouseEvent | TouchEvent) => void,
  options: { delay?: number; moveThreshold?: number } = {}
) {
  let exposed: ReturnType<typeof useLongPress>
  const Comp = defineComponent({
    setup() {
      const elRef = ref<HTMLElement>()
      exposed = useLongPress(elRef, handler, { delay: 600, moveThreshold: 10, ...options })
      return { elRef }
    },
    render() {
      return h('div', { ref: 'elRef' })
    },
  })
  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, exposed: exposed! }
}

describe('useLongPress', () => {
  const DEFAULT_DELAY = 600

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not fire before delay elapses', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    vi.advanceTimersByTime(DEFAULT_DELAY - 1)
    expect(handler).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('fires after delay on hold', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('sets isPressed to true while holding', async () => {
    const handler = vi.fn()
    const { wrapper, exposed } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()

    expect(exposed.isPressed.value).toBe(true)

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(exposed.isPressed.value).toBe(false)
    wrapper.unmount()
  })

  it('cancels on mouseup before delay', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cancels on mouseleave before delay', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cancels when mouse moves beyond threshold', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 0, clientY: 0 }))
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 0 }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not cancel when mouse moves within threshold', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 0, clientY: 0 }))
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 5, clientY: 5 }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('works with touch events', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      touches: [new Touch({ identifier: 1, target: el, clientX: 0, clientY: 0 })]
    }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('cancels on touchmove beyond threshold', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      touches: [new Touch({ identifier: 1, target: el, clientX: 0, clientY: 0 })]
    }))
    el.dispatchEvent(new TouchEvent('touchmove', {
      bubbles: true,
      touches: [new Touch({ identifier: 1, target: el, clientX: 20, clientY: 0 })]
    }))

    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(handler).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('uses custom delay option', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler, { delay: 200 })
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    vi.advanceTimersByTime(199)
    expect(handler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(handler).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('prevents default on contextmenu', () => {
    const handler = vi.fn()
    const { wrapper } = mountLongPress(handler)
    const el = wrapper.element as HTMLElement

    const contextmenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    el.dispatchEvent(contextmenu)

    expect(contextmenu.defaultPrevented).toBe(true)
    wrapper.unmount()
  })
})
