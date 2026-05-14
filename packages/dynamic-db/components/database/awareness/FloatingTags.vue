<script setup lang="ts">
import type { AwarenessState, AwarenessFocus } from '../../../composables/useHocuspocusManager'

interface CellLocation {
  element: HTMLElement | null
  type: string
  selector: string
}

interface TagItem {
  key: string
  states: AwarenessState[]
  type: string
  top: number
  left: number
  width: number
  height: number
  visible: boolean
}

const props = defineProps<{
  getElement: (focus: AwarenessFocus) => CellLocation
  containerRef?: HTMLElement | null
}>()

interface HocuspocusInject {
  awarenessStates: ComputedRef<AwarenessState[]>
}

const hocuspocus = inject<HocuspocusInject>('databaseHocuspocus', {
  awarenessStates: computed(() => [])
})

const overlayRef = ref<HTMLElement>()
const tags = ref<TagItem[]>([])

const elementCache = new Map<string, { element: HTMLElement; type: string }>()
const elementVisibility = new Map<HTMLElement, boolean>()
let observer: IntersectionObserver | null = null

function isElementStale(el: HTMLElement): boolean {
  return !el.isConnected
}

function createObserver() {
  if (observer) {
    observer.disconnect()
  }
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      elementVisibility.set(entry.target as HTMLElement, entry.isIntersecting)
    })
  }, {
    root: props.containerRef ?? null,
    threshold: 0
  })
}

function resolveCell(focus: AwarenessFocus): { element: HTMLElement | null; type: string } | null {
  const cacheKey = `${focus.rowId}:${focus.cellId}`
  const cached = elementCache.get(cacheKey)

  if (cached && !isElementStale(cached.element)) {
    return cached
  }

  const loc = props.getElement(focus)
  if (!loc.element) {
    if (cached) {
      observer?.unobserve(cached.element)
      elementVisibility.delete(cached.element)
    }
    elementCache.delete(cacheKey)
    return null
  }

  elementCache.set(cacheKey, { element: loc.element, type: loc.type })
  return { element: loc.element, type: loc.type }
}

function getElementVisibility(element: HTMLElement): boolean {
  if (!elementVisibility.has(element)) {
    observer?.observe(element)
    elementVisibility.set(element, true)
  }
  return elementVisibility.get(element) ?? true
}

function updatePositions() {
  const overlay = overlayRef.value
  if (!overlay) return

  const overlayRect = overlay.getBoundingClientRect()

  const cellMap = new Map<string, { element: HTMLElement; type: string; states: AwarenessState[] }>()

  for (const state of hocuspocus.awarenessStates.value) {
    if (!state.focus?.rowId || !state.focus?.cellId || !state.user) continue

    const resolved = resolveCell(state.focus)
    if (!resolved) continue

    const key = `${state.focus.rowId}:${state.focus.cellId}`
    if (!cellMap.has(key)) {
      cellMap.set(key, { element: resolved.element, type: resolved.type, states: [] })
    }
    cellMap.get(key)!.states.push(state)
  }

  const activeKeys = new Set(cellMap.keys())
  for (const key of elementCache.keys()) {
    if (!activeKeys.has(key)) {
      const cached = elementCache.get(key)!
      observer?.unobserve(cached.element)
      elementVisibility.delete(cached.element)
      elementCache.delete(key)
    }
  }

  const newTags: TagItem[] = []
  for (const [key, cell] of cellMap) {
    const rect = cell.element.getBoundingClientRect()
    const visible = getElementVisibility(cell.element)

    newTags.push({
      key,
      states: cell.states,
      type: cell.type,
      top: rect.top - overlayRect.top,
      left: rect.left - overlayRect.left,
      width: rect.width,
      height: rect.height,
      visible
    })
  }

  tags.value = newTags
}

let rafId: number | null = null

function tick() {
  if (tags.value.length > 0 || hocuspocus.awarenessStates.value.length > 0) {
    updatePositions()
    rafId = requestAnimationFrame(tick)
  } else {
    rafId = null
  }
}

function startTick() {
  if (rafId === null) {
    rafId = requestAnimationFrame(tick)
  }
}

function stopTick() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function resetAll() {
  stopTick()
  if (observer) {
    observer.disconnect()
    observer = null
  }
  elementCache.clear()
  elementVisibility.clear()
  tags.value = []
}

watch(() => hocuspocus.awarenessStates.value, () => {
  nextTick(() => {
    updatePositions()
    if (hocuspocus.awarenessStates.value.length > 0) {
      startTick()
    } else {
      stopTick()
    }
  })
}, { deep: true })

watch([() => props.getElement, () => props.containerRef], () => {
  resetAll()
  nextTick(() => {
    createObserver()
    updatePositions()
    startTick()
  })
})

onMounted(() => {
  nextTick(() => {
    createObserver()
    updatePositions()
    startTick()
  })
})

onBeforeUnmount(() => {
  resetAll()
})
</script>

<template>
  <div ref="overlayRef" class="awareness-floating-tags">
    <div
      v-for="tag in tags"
      :key="tag.key"
      class="tag-wrapper"
      :class="{ 'tag-hidden': !tag.visible }"
      :style="{
        top: tag.top + 'px',
        left: tag.left + 'px',
        width: tag.width + 'px',
        height: tag.height + 'px'
      }"
    >
      <DatabaseAwarenessUserCursorTag
        :states="tag.states"
        :type="tag.type"
        :width="tag.width"
        :height="tag.height"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.awareness-floating-tags {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}

.tag-wrapper {
  position: absolute;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.tag-hidden {
  opacity: 0;
}
</style>
