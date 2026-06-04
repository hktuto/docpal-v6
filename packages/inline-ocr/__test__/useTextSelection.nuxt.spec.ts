import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useTextSelection, type SelectableBox } from '../composables/useTextSelection'

function mountTextSelection(boxes: Ref<SelectableBox[]>) {
  let exposed: ReturnType<typeof useTextSelection>
  const Comp = defineComponent({
    setup() {
      exposed = useTextSelection(boxes)
      return () => h('div')
    },
  })
  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, exposed: exposed! }
}

describe('useTextSelection', () => {
  let boxes: ReturnType<typeof ref<SelectableBox[]>>

  beforeEach(() => {
    boxes = ref([
      { text: 'Hello' },
      { text: 'World' },
      { text: 'Foo' },
      { text: 'Bar' },
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty selection', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    expect(sel.selectedCount.value).toBe(0)
    expect(sel.hasSelection.value).toBe(false)
    expect(sel.selectedText.value).toBe('')
    expect(sel.isSelecting.value).toBe(false)
    expect(sel.copied.value).toBe(false)
    expect(sel.anchorIndex.value).toBeNull()
  })

  it('selectSingle selects one box', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectSingle(1)

    expect(sel.isSelected(1)).toBe(true)
    expect(sel.isSelected(0)).toBe(false)
    expect(sel.selectedCount.value).toBe(1)
    expect(sel.anchorIndex.value).toBe(1)
  })

  it('selectOnly toggles off if same single selection', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectOnly(1)
    expect(sel.isSelected(1)).toBe(true)

    sel.selectOnly(1)
    expect(sel.isSelected(1)).toBe(false)
    expect(sel.hasSelection.value).toBe(false)
  })

  it('selectOnly selects a different box', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectOnly(1)
    sel.selectOnly(2)

    expect(sel.isSelected(1)).toBe(false)
    expect(sel.isSelected(2)).toBe(true)
  })

  it('toggleSingle adds and removes indices', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.toggleSingle(0)
    expect(sel.isSelected(0)).toBe(true)

    sel.toggleSingle(1)
    expect(sel.isSelected(0)).toBe(true)
    expect(sel.isSelected(1)).toBe(true)

    sel.toggleSingle(0)
    expect(sel.isSelected(0)).toBe(false)
    expect(sel.isSelected(1)).toBe(true)
  })

  it('toggleSingle updates anchor when removing current anchor', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.toggleSingle(1)
    sel.toggleSingle(2)
    expect(sel.anchorIndex.value).toBe(2)

    sel.toggleSingle(2)
    // anchor falls back to remaining smallest index
    expect(sel.anchorIndex.value).toBe(1)
  })

  it('selectRange selects contiguous indices', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectRange(1, 3)

    expect(sel.isSelected(0)).toBe(false)
    expect(sel.isSelected(1)).toBe(true)
    expect(sel.isSelected(2)).toBe(true)
    expect(sel.isSelected(3)).toBe(true)
  })

  it('selectRange handles reverse order', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectRange(3, 1)

    expect(sel.isSelected(1)).toBe(true)
    expect(sel.isSelected(2)).toBe(true)
    expect(sel.isSelected(3)).toBe(true)
  })

  it('selectRange clamps out-of-bounds indices', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectRange(-1, 10)

    expect(sel.isSelected(0)).toBe(true)
    expect(sel.isSelected(3)).toBe(true)
    expect(sel.isSelected(4)).toBe(false)
  })

  it('startSelection without extend sets single anchor', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.startSelection(2)

    expect(sel.isSelecting.value).toBe(true)
    expect(sel.isSelected(2)).toBe(true)
    expect(sel.anchorIndex.value).toBe(2)
  })

  it('startSelection with extend uses anchor range', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectSingle(0)
    sel.startSelection(2, true)

    expect(sel.isSelected(0)).toBe(true)
    expect(sel.isSelected(1)).toBe(true)
    expect(sel.isSelected(2)).toBe(true)
  })

  it('extendSelection expands from anchor while selecting', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.startSelection(0)
    sel.extendSelection(2)

    expect(sel.isSelected(0)).toBe(true)
    expect(sel.isSelected(1)).toBe(true)
    expect(sel.isSelected(2)).toBe(true)
  })

  it('extendSelection does nothing when not selecting', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectSingle(0)
    sel.extendSelection(2)

    expect(sel.isSelected(2)).toBe(false)
  })

  it('finalizeSelection stops selecting mode', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.startSelection(0)
    expect(sel.isSelecting.value).toBe(true)

    sel.finalizeSelection()
    expect(sel.isSelecting.value).toBe(false)
  })

  it('clearSelection empties everything', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectRange(0, 3)
    sel.clearSelection()

    expect(sel.selectedCount.value).toBe(0)
    expect(sel.anchorIndex.value).toBeNull()
    expect(sel.isSelecting.value).toBe(false)
  })

  it('selectAll selects every box', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectAll()

    expect(sel.selectedCount.value).toBe(4)
    expect(sel.isSelected(0)).toBe(true)
    expect(sel.isSelected(3)).toBe(true)
  })

  it('selectedText joins selected box texts with newlines', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectRange(0, 1)

    expect(sel.selectedText.value).toBe('Hello\nWorld')
  })

  it('selectedText sorts by index', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.toggleSingle(3)
    sel.toggleSingle(1)

    expect(sel.selectedText.value).toBe('World\nBar')
  })

  it('selectedText skips missing boxes gracefully', () => {
    const { exposed: sel } = mountTextSelection(boxes)

    sel.selectSingle(0)
    boxes.value = []

    expect(sel.selectedText.value).toBe('')
  })

  it('copyToClipboard uses navigator.clipboard when available', async () => {
    const { exposed: sel, wrapper } = mountTextSelection(boxes)
    sel.selectRange(0, 1)

    const result = await sel.copyToClipboard()

    expect(result).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello\nWorld')
    expect(sel.copied.value).toBe(true)
    wrapper.unmount()
  })

  it('copyToClipboard falls back to execCommand when clipboard fails', async () => {
    const { exposed: sel, wrapper } = mountTextSelection(boxes)
    sel.selectSingle(0)

    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Denied'))

    const result = await sel.copyToClipboard()

    expect(result).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(sel.copied.value).toBe(true)
    wrapper.unmount()
  })

  it('copyToClipboard returns false when nothing selected', async () => {
    const { exposed: sel, wrapper } = mountTextSelection(boxes)

    const result = await sel.copyToClipboard()

    expect(result).toBe(false)
    wrapper.unmount()
  })

  it('keyboard Ctrl+C copies selection', async () => {
    const { exposed: sel, wrapper } = mountTextSelection(boxes)
    sel.selectSingle(0)

    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'c' })
    window.dispatchEvent(event)
    await nextTick()

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keyboard Escape clears selection', () => {
    const { exposed: sel, wrapper } = mountTextSelection(boxes)
    sel.selectSingle(0)

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)

    expect(sel.hasSelection.value).toBe(false)
    wrapper.unmount()
  })
})
