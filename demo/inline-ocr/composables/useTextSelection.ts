import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SelectableBox {
  text: string
}

export function useTextSelection(boxes: Ref<SelectableBox[]>) {
  const selectedIndices = ref<Set<number>>(new Set())
  const anchorIndex = ref<number | null>(null)
  const isSelecting = ref(false)
  const copied = ref(false)

  const selectedCount = computed(() => selectedIndices.value.size)
  const hasSelection = computed(() => selectedIndices.value.size > 0)

  const selectedText = computed(() => {
    const indices = Array.from(selectedIndices.value).sort((a, b) => a - b)
    return indices.map(i => boxes.value[i]?.text || '').join(' ')
  })

  function selectRange(start: number, end: number) {
    const min = Math.min(start, end)
    const max = Math.max(start, end)
    const newSet = new Set<number>()
    for (let i = min; i <= max; i++) {
      if (i >= 0 && i < boxes.value.length) {
        newSet.add(i)
      }
    }
    selectedIndices.value = newSet
  }

  function selectSingle(index: number) {
    selectedIndices.value = new Set([index])
    anchorIndex.value = index
    copied.value = false
  }

  function toggleSingle(index: number) {
    const newSet = new Set(selectedIndices.value)
    if (newSet.has(index)) {
      newSet.delete(index)
      if (anchorIndex.value === index) {
        anchorIndex.value = newSet.size > 0 ? Math.min(...newSet) : null
      }
    } else {
      newSet.add(index)
      anchorIndex.value = index
    }
    selectedIndices.value = newSet
    copied.value = false
  }

  function clearSelection() {
    selectedIndices.value = new Set()
    anchorIndex.value = null
    isSelecting.value = false
    copied.value = false
  }

  function startSelection(index: number, extend: boolean = false) {
    isSelecting.value = true
    if (extend && anchorIndex.value !== null) {
      selectRange(anchorIndex.value, index)
    } else {
      selectSingle(index)
    }
  }

  function extendSelection(index: number) {
    if (!isSelecting.value || anchorIndex.value === null) return
    selectRange(anchorIndex.value, index)
  }

  function finalizeSelection() {
    isSelecting.value = false
  }

  function isSelected(index: number): boolean {
    return selectedIndices.value.has(index)
  }

  function selectAll() {
    const newSet = new Set<number>()
    for (let i = 0; i < boxes.value.length; i++) {
      newSet.add(i)
    }
    selectedIndices.value = newSet
    anchorIndex.value = 0
    copied.value = false
  }

  async function copyToClipboard(): Promise<boolean> {
    const text = selectedText.value
    if (!text) return false
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      copied.value = success
      return success
    }
  }

  function onWindowMouseUp() {
    finalizeSelection()
  }

  function onWindowKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && hasSelection.value) {
      e.preventDefault()
      copyToClipboard()
    }
    if (e.key === 'Escape') {
      clearSelection()
    }
  }

  onMounted(() => {
    window.addEventListener('mouseup', onWindowMouseUp)
    window.addEventListener('keydown', onWindowKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('keydown', onWindowKeyDown)
  })

  return {
    selectedIndices,
    selectedCount,
    hasSelection,
    selectedText,
    isSelecting,
    copied,
    startSelection,
    extendSelection,
    clearSelection,
    isSelected,
    selectAll,
    copyToClipboard,
  }
}
