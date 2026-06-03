import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SelectableBox {
  text: string
}

export interface SelectedWord {
  boxIndex: number
  wordIndex: number
  word: string
}

export function useTextSelection(boxes: Ref<SelectableBox[]>) {
  const selectedWords = ref<SelectedWord[]>([])
  const anchorBoxIndex = ref<number | null>(null)
  const anchorWordIndex = ref<number | null>(null)
  const isSelecting = ref(false)
  const copied = ref(false)

  const selectedCount = computed(() => selectedWords.value.length)
  const hasSelection = computed(() => selectedWords.value.length > 0)

  const selectedText = computed(() => {
    if (!selectedWords.value.length) return ''
    // Group by box, sort by word index, join words
    const grouped = new Map<number, SelectedWord[]>()
    for (const sw of selectedWords.value) {
      const arr = grouped.get(sw.boxIndex) || []
      arr.push(sw)
      grouped.set(sw.boxIndex, arr)
    }
    const lines: string[] = []
    const sortedBoxes = Array.from(grouped.keys()).sort((a, b) => a - b)
    for (const boxIdx of sortedBoxes) {
      const words = grouped.get(boxIdx)!
      words.sort((a, b) => a.wordIndex - b.wordIndex)
      lines.push(words.map((w) => w.word).join(''))
    }
    return lines.join('\n')
  })

  function makeKey(boxIndex: number, wordIndex: number) {
    return `${boxIndex}:${wordIndex}`
  }

  const selectedKeys = computed(() => {
    const set = new Set<string>()
    for (const sw of selectedWords.value) {
      set.add(makeKey(sw.boxIndex, sw.wordIndex))
    }
    return set
  })

  function isWordSelected(boxIndex: number, wordIndex: number): boolean {
    return selectedKeys.value.has(makeKey(boxIndex, wordIndex))
  }

  function selectWord(boxIndex: number, wordIndex: number, word: string) {
    const key = makeKey(boxIndex, wordIndex)
    if (!selectedKeys.value.has(key)) {
      selectedWords.value.push({ boxIndex, wordIndex, word })
    }
    copied.value = false
  }

  function deselectWord(boxIndex: number, wordIndex: number) {
    const key = makeKey(boxIndex, wordIndex)
    selectedWords.value = selectedWords.value.filter(
      (sw) => makeKey(sw.boxIndex, sw.wordIndex) !== key
    )
    copied.value = false
  }

  function toggleWord(boxIndex: number, wordIndex: number, word: string) {
    if (isWordSelected(boxIndex, wordIndex)) {
      deselectWord(boxIndex, wordIndex)
    } else {
      selectWord(boxIndex, wordIndex, word)
    }
  }

  function selectRange(
    fromBox: number,
    fromWord: number,
    toBox: number,
    toWord: number,
    getWordText: (boxIdx: number, wordIdx: number) => string
  ) {
    // Only support range selection within the same box for clean UX
    if (fromBox !== toBox) {
      // Cross-box: just select both anchor and target words individually
      toggleWord(fromBox, fromWord, getWordText(fromBox, fromWord))
      toggleWord(toBox, toWord, getWordText(toBox, toWord))
      return
    }

    const min = Math.min(fromWord, toWord)
    const max = Math.max(fromWord, toWord)
    const newWords: SelectedWord[] = []
    for (let i = min; i <= max; i++) {
      newWords.push({ boxIndex: fromBox, wordIndex: i, word: getWordText(fromBox, i) })
    }

    // Merge with existing selection, keeping other boxes intact
    const otherBoxes = selectedWords.value.filter((sw) => sw.boxIndex !== fromBox)
    selectedWords.value = [...otherBoxes, ...newWords]
    copied.value = false
  }

  function selectAll(getWords: (boxIdx: number) => string[]) {
    const all: SelectedWord[] = []
    for (let b = 0; b < boxes.value.length; b++) {
      const words = getWords(b)
      for (let w = 0; w < words.length; w++) {
        all.push({ boxIndex: b, wordIndex: w, word: words[w] })
      }
    }
    selectedWords.value = all
    anchorBoxIndex.value = 0
    anchorWordIndex.value = 0
    copied.value = false
  }

  function clearSelection() {
    selectedWords.value = []
    anchorBoxIndex.value = null
    anchorWordIndex.value = null
    isSelecting.value = false
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

  function startSelection(boxIndex: number, wordIndex: number) {
    isSelecting.value = true
    anchorBoxIndex.value = boxIndex
    anchorWordIndex.value = wordIndex
    copied.value = false
  }

  function extendSelection(
    boxIndex: number,
    wordIndex: number,
    getWordText: (boxIdx: number, wordIdx: number) => string
  ) {
    if (!isSelecting.value || anchorBoxIndex.value === null || anchorWordIndex.value === null) return
    selectRange(anchorBoxIndex.value, anchorWordIndex.value, boxIndex, wordIndex, getWordText)
  }

  function finalizeSelection() {
    isSelecting.value = false
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
    window.addEventListener('keydown', onWindowKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onWindowKeyDown)
  })

  return {
    selectedWords,
    selectedCount,
    hasSelection,
    selectedText,
    isSelecting,
    copied,
    anchorBoxIndex,
    anchorWordIndex,
    isWordSelected,
    selectWord,
    deselectWord,
    toggleWord,
    selectRange,
    selectAll,
    clearSelection,
    startSelection,
    extendSelection,
    finalizeSelection,
    copyToClipboard,
  }
}
