<template>
  <div
    ref="editorRef"
    class="formula-input-editor"
    :class="{ 'is-readonly': props.readonly }"
    :contenteditable="!props.readonly"
    role="textbox"
    tabindex="0"
    :aria-label="placeholder"
    :aria-readonly="props.readonly ? 'true' : 'false'"
    :data-placeholder="placeholder"
    @beforeinput="handleBeforeInput"
    @input="handleInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    @compositionstart="isComposing = true"
    @compositionend="handleCompositionEnd"
  />
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { Variable } from './formulaValid'
import {
  buildFormulaEditorHtml,
  extractFormulaDisplayText,
  findVariableByToken,
  scanVariableMatches
} from './formulaTransform'

interface Props {
  displayText: string
  variables?: Variable[]
  placeholder?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  displayText: '',
  variables: () => [],
  placeholder: '',
  readonly: false
})

const emit = defineEmits<{
  'update:displayText': [value: string]
  input: []
}>()

const editorRef = ref<HTMLElement>()
const isComposing = ref(false)
let isRendering = false
let isInsertingComma = false
let lastChipRenderKey = ''
let savedSelection: Range | null = null

function isCommaKey(event: KeyboardEvent | InputEvent): boolean {
  const data = 'data' in event ? event.data : null
  return event instanceof KeyboardEvent
    ? event.key === ',' || event.key === '，'
    : data === ',' || data === '，'
}

function getChipRenderKey(text: string): string {
  return scanVariableMatches(text, props.variables, 'label')
    .map((match) => `${match.start}:${match.end}:${match.token}`)
    .join('|')
}

function saveSelection() {
  const el = editorRef.value
  const selection = window.getSelection()
  if (!el || !selection?.rangeCount) {
    return
  }
  const range = selection.getRangeAt(0)
  if (el.contains(range.commonAncestorContainer)) {
    savedSelection = range.cloneRange()
  }
}

function restoreSelection(): boolean {
  if (!savedSelection || !editorRef.value) {
    return false
  }
  try {
    if (!editorRef.value.contains(savedSelection.startContainer)) {
      savedSelection = null
      return false
    }
    const selection = window.getSelection()
    if (!selection) {
      return false
    }
    selection.removeAllRanges()
    selection.addRange(savedSelection)
    return true
  } catch {
    savedSelection = null
    return false
  }
}

function placeCursorAtEnd() {
  const el = editorRef.value
  const selection = window.getSelection()
  if (!el || !selection) {
    return
  }
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
  saveSelection()
}

function ensureSelectionInEditor() {
  const el = editorRef.value
  if (!el) {
    return
  }
  el.focus()
  if (!restoreSelection()) {
    placeCursorAtEnd()
  }
}

function renderEditor(cursorOffset?: number, displayText?: string) {
  const el = editorRef.value
  if (!el || isRendering) {
    return
  }
  const text = displayText ?? props.displayText
  const html = buildFormulaEditorHtml(text, props.variables)
  lastChipRenderKey = getChipRenderKey(text)
  if (el.innerHTML === html) {
    if (cursorOffset !== undefined) {
      setCursorOffset(el, cursorOffset)
      saveSelection()
    }
    return
  }
  isRendering = true
  const offset = cursorOffset ?? getCursorOffset(el)
  el.innerHTML = html || ''
  setCursorOffset(el, offset)
  saveSelection()
  isRendering = false
}

function emitDisplayText() {
  const el = editorRef.value
  if (!el) {
    return
  }
  const text = extractFormulaDisplayText(el)
  emit('update:displayText', text)
  emit('input')
}

function handleBeforeInput(event: InputEvent) {
  if (props.readonly) {
    event.preventDefault()
    return
  }
  const selection = window.getSelection()
  if (!selection?.rangeCount) {
    return
  }
  let node: Node | null = selection.anchorNode
  const root = editorRef.value
  while (node && node !== root) {
    if (node instanceof HTMLElement && node.classList.contains('formula-variable-chip')) {
      event.preventDefault()
      return
    }
    node = node.parentNode
  }

  if (isCommaKey(event)) {
    event.preventDefault()
    insertEnglishCommaOnce()
  }
}

function insertEnglishCommaOnce() {
  if (isInsertingComma) {
    return
  }

  const el = editorRef.value
  const selection = window.getSelection()
  if (!el || !selection?.rangeCount) {
    return
  }

  isInsertingComma = true

  const range = selection.getRangeAt(0)
  range.deleteContents()
  const textNode = document.createTextNode(',')
  range.insertNode(textNode)
  range.setStartAfter(textNode)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  savedSelection = range.cloneRange()

  syncEditorFromDom()

  queueMicrotask(() => {
    isInsertingComma = false
  })
}

function syncEditorFromDom() {
  const el = editorRef.value
  if (!el) {
    return
  }

  const rawText = extractFormulaDisplayText(el)
  const text = rawText.replaceAll('，', ',')
  if (text !== rawText) {
    const offset = getCursorOffset(el)
    renderEditor(offset, text)
  }

  emit('update:displayText', text)
  emit('input')

  const chipRenderKey = getChipRenderKey(text)
  if (chipRenderKey !== lastChipRenderKey) {
    nextTick(() => renderEditor(getCursorOffset(el), text))
  }
}

function handleInput() {
  if (props.readonly) {
    return
  }
  if (isComposing.value || isRendering || isInsertingComma) {
    return
  }
  syncEditorFromDom()
}

function handleCompositionEnd(event: CompositionEvent) {
  if (props.readonly) {
    return
  }
  isComposing.value = false
  if (isInsertingComma) {
    return
  }

  if (event.data === '，' || event.data === ',') {
    normalizeCommaInEditor()
    return
  }

  handleInput()
}

function collapseCommaRunAt(text: string, offset: number): string {
  let start = Math.min(offset, text.length)
  let end = Math.min(offset, text.length)
  while (start > 0 && text[start - 1] === ',') {
    start--
  }
  while (end < text.length && text[end] === ',') {
    end++
  }
  if (end - start <= 1) {
    return text
  }
  return text.slice(0, start) + ',' + text.slice(end)
}

/** IME 提交中文逗号后仅做替换，不再二次插入 */
function normalizeCommaInEditor() {
  const el = editorRef.value
  if (!el) {
    return
  }

  const rawText = extractFormulaDisplayText(el)
  let text = rawText.replaceAll('，', ',')
  const offset = getCursorOffset(el)
  text = collapseCommaRunAt(text, offset)

  if (text === rawText) {
    syncEditorFromDom()
    return
  }

  renderEditor(offset, text)
  emit('update:displayText', text)
  emit('input')
  lastChipRenderKey = getChipRenderKey(text)
}

function handlePaste(event: ClipboardEvent) {
  if (props.readonly) {
    event.preventDefault()
    return
  }
  event.preventDefault()
  const text = (event.clipboardData?.getData('text/plain') ?? '').replaceAll('，', ',')
  document.execCommand('insertText', false, text)
  nextTick(() => {
    emitDisplayText()
    renderEditor()
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (props.readonly) {
    return
  }
  if (isCommaKey(event) && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault()
    event.stopPropagation()
    insertEnglishCommaOnce()
    return
  }

  if (event.key !== 'Backspace' && event.key !== 'Delete') {
    return
  }
  const chip = findAdjacentChip(event)
  if (!chip) {
    return
  }
  event.preventDefault()
  chip.remove()
  emitDisplayText()
  nextTick(() => renderEditor())
}

function findAdjacentChip(event: KeyboardEvent): HTMLElement | null {
  const selection = window.getSelection()
  if (!selection?.rangeCount || !selection.isCollapsed) {
    return null
  }
  const range = selection.getRangeAt(0)
  const { startContainer, startOffset } = range
  if (event.key === 'Backspace') {
    const node = startOffset === 0 ? startContainer.previousSibling : startContainer
    return findChipFromNode(node, 'prev')
  }
  const node = startContainer
  return findChipFromNode(node, 'next')
}

function findChipFromNode(node: Node | null, direction: 'prev' | 'next'): HTMLElement | null {
  let current: Node | null = node
  while (current) {
    if (current instanceof HTMLElement && current.classList.contains('formula-variable-chip')) {
      return current
    }
    if (current.nodeType === Node.TEXT_NODE && current.textContent) {
      return null
    }
    current = direction === 'prev' ? current.previousSibling : current.nextSibling
  }
  return null
}

function getCursorOffset(root: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection?.rangeCount) {
    return 0
  }
  const range = selection.getRangeAt(0)
  const preRange = document.createRange()
  preRange.selectNodeContents(root)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().length
}

function setCursorOffset(root: HTMLElement, offset: number) {
  const selection = window.getSelection()
  if (!selection) {
    return
  }
  const range = document.createRange()
  let remaining = Math.max(0, offset)
  let placed = false

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0
      if (remaining <= len) {
        range.setStart(node, remaining)
        range.collapse(true)
        placed = true
        return true
      }
      remaining -= len
      return false
    }
    if (node instanceof HTMLElement && node.dataset.formulaToken) {
      const len = node.dataset.formulaToken.length
      if (remaining <= len) {
        range.setStartAfter(node)
        range.collapse(true)
        placed = true
        return true
      }
      remaining -= len
      return false
    }
    for (const child of Array.from(node.childNodes)) {
      if (walk(child)) {
        return true
      }
    }
    return false
  }

  walk(root)
  if (!placed) {
    range.selectNodeContents(root)
    range.collapse(false)
  }
  selection.removeAllRanges()
  selection.addRange(range)
}

function insertTextAtCursor(text: string, cursorOffset?: number) {
  const el = editorRef.value
  if (!el) {
    return
  }
  ensureSelectionInEditor()

  const variable = findVariableByToken(text, props.variables)
  if (variable) {
    const token = variable.label
    const chip = document.createElement('span')
    chip.className = 'formula-variable-chip'
    chip.contentEditable = 'false'
    chip.dataset.formulaToken = token
    chip.textContent = token
    insertNodeAtSelection(chip)
    const nextOffset = getCursorOffset(el)
    emitDisplayText()
    nextTick(() => renderEditor(nextOffset))
    return
  }

  document.execCommand('insertText', false, text)
  if (cursorOffset !== undefined) {
    const offset = getCursorOffset(el) - text.length + cursorOffset
    setCursorOffset(el, offset)
    saveSelection()
  }
  emitDisplayText()
  nextTick(() => renderEditor(getCursorOffset(el)))
}

function insertNodeAtSelection(node: Node) {
  const selection = window.getSelection()
  if (!selection?.rangeCount) {
    editorRef.value?.appendChild(node)
    return
  }
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(node)
  range.setStartAfter(node)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  savedSelection = range.cloneRange()
}

function insertToFormula(text: string, cursorOffset?: number) {
  insertTextAtCursor(text, cursorOffset)
}

function focusEditor() {
  editorRef.value?.focus()
}

watch(
  () => props.displayText,
  () => {
    if (isComposing.value || isRendering) {
      return
    }
    nextTick(() => {
      const el = editorRef.value
      if (el && extractFormulaDisplayText(el) === props.displayText) {
        return
      }
      renderEditor()
    })
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener('selectionchange', saveSelection)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', saveSelection)
})

watch(
  () => props.variables,
  () => {
    nextTick(() => renderEditor())
  },
  { deep: true }
)

defineExpose({ insertToFormula, focus: focusEditor })
</script>

<style scoped lang="scss">
.formula-input-editor {
  min-height: 80px;
  max-height: 160px;
  overflow-y: auto;
  padding: 5px 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
  transition: border-color 0.2s;
  background-color: var(--el-fill-color-blank);

  &:focus {
    border-color: var(--app-accent-color);
  }

  &:empty::before {
    content: attr(data-placeholder);
    color: var(--el-text-color-placeholder);
    pointer-events: none;
  }

  :deep(.formula-variable-chip) {
    display: inline;
    padding: 1px 6px;
    margin: 0 1px;
    border-radius: 4px;
    background-color: var(--el-color-primary-light-9);
    color: var(--app-accent-color);
    font-weight: 500;
    cursor: default;
    user-select: all;
  }

  &.is-readonly {
    min-height: 32px;
    max-height: 120px;
    cursor: pointer;
  }
}
</style>
