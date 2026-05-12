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
  offScreen: boolean
  indicatorTop: number
  indicatorLeft: number
  indicatorDirection: 'up' | 'down' | 'left' | 'right'
}

const props = defineProps<{
  getElement: (focus: AwarenessFocus) => CellLocation
  containerRef?: HTMLElement | null
}>()

const emit = defineEmits<{
  jump: [focus: AwarenessFocus]
}>()

interface HocuspocusInject {
  awarenessStates: ComputedRef<AwarenessState[]>
}

const hocuspocus = inject<HocuspocusInject>('databaseHocuspocus', {
  awarenessStates: computed(() => [])
})

const overlayRef = ref<HTMLElement>()
const tags = ref<TagItem[]>([])

// Cache resolved elements to avoid repeated DOM queries
const elementCache = new Map<string, { element: HTMLElement; type: string }>()
const elementVisibility = new Map<HTMLElement, boolean>()
const lastKnownRects = new Map<string, { top: number; left: number; width: number; height: number; direction: 'up' | 'down' | 'left' | 'right' }>()
let observer: IntersectionObserver | null = null

const INDICATOR_SIZE = 28
const INDICATOR_PADDING = 8

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

function resolveCell(focus: AwarenessFocus): { element: HTMLElement | null; type: string; cacheKey: string } | null {
  const cacheKey = `${focus.rowId}:${focus.cellId}`
  const cached = elementCache.get(cacheKey)

  if (cached && !isElementStale(cached.element)) {
    return { ...cached, cacheKey }
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
  return { element: loc.element, type: loc.type, cacheKey }
}

function getElementVisibility(element: HTMLElement): boolean {
  if (!elementVisibility.has(element)) {
    observer?.observe(element)
    elementVisibility.set(element, true)
  }
  return elementVisibility.get(element) ?? true
}

function computeOffScreenIndicator(
  rect: DOMRect,
  containerRect: DOMRect
): { offScreen: boolean; indicatorTop: number; indicatorLeft: number; indicatorDirection: 'up' | 'down' | 'left' | 'right' } {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const minTop = containerRect.top + INDICATOR_PADDING
  const maxTop = containerRect.bottom - INDICATOR_SIZE - INDICATOR_PADDING
  const minLeft = containerRect.left + INDICATOR_PADDING
  const maxLeft = containerRect.right - INDICATOR_SIZE - INDICATOR_PADDING

  const indicatorTop = Math.max(minTop, Math.min(centerY - INDICATOR_SIZE / 2, maxTop))
  const indicatorLeft = Math.max(minLeft, Math.min(centerX - INDICATOR_SIZE / 2, maxLeft))

  const dy = Math.max(minTop - centerY, centerY - maxTop, 0)
  const dx = Math.max(minLeft - centerX, centerX - maxLeft, 0)

  let direction: 'up' | 'down' | 'left' | 'right' = 'up'
  if (dy > dx) {
    direction = centerY < containerRect.top ? 'up' : 'down'
  } else if (dx > 0) {
    direction = centerX < containerRect.left ? 'left' : 'right'
  } else if (centerY < containerRect.top) {
    direction = 'up'
  } else if (centerY > containerRect.bottom) {
    direction = 'down'
  } else if (centerX < containerRect.left) {
    direction = 'left'
  } else {
    direction = 'right'
  }

  return {
    offScreen: true,
    indicatorTop: indicatorTop - containerRect.top,
    indicatorLeft: indicatorLeft - containerRect.left,
    indicatorDirection: direction
  }
}

function updatePositions() {
  const overlay = overlayRef.value
  if (!overlay) return

  const overlayRect = overlay.getBoundingClientRect()
  const containerRect = props.containerRef?.getBoundingClientRect() ?? overlayRect

  // Group by cell using cached elements
  const cellMap = new Map<string, { element: HTMLElement | null; type: string; states: AwarenessState[] }>()

  for (const state of hocuspocus.awarenessStates.value) {
    if (!state.focus?.rowId || !state.focus?.cellId || !state.user) continue

    const resolved = resolveCell(state.focus)
    const key = `${state.focus.rowId}:${state.focus.cellId}`

    if (!cellMap.has(key)) {
      cellMap.set(key, {
        element: resolved?.element ?? null,
        type: resolved?.type ?? lastKnownRects.get(key)?.direction ?? 'table-cell',
        states: []
      })
    }
    cellMap.get(key)!.states.push(state)
  }

  // Clean up cache entries for cells no longer in awareness
  const activeKeys = new Set(cellMap.keys())
  for (const key of elementCache.keys()) {
    if (!activeKeys.has(key)) {
      const cached = elementCache.get(key)!
      observer?.unobserve(cached.element)
      elementVisibility.delete(cached.element)
      elementCache.delete(key)
    }
  }
  for (const key of lastKnownRects.keys()) {
    if (!activeKeys.has(key)) {
      lastKnownRects.delete(key)
    }
  }

  const newTags: TagItem[] = []
  for (const [key, cell] of cellMap) {
    if (cell.element) {
      const rect = cell.element.getBoundingClientRect()
      const visible = getElementVisibility(cell.element)
      const offScreen = computeOffScreenIndicator(rect, containerRect)

      // Remember last known position for when element gets virtual-scrolled away
      lastKnownRects.set(key, {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        direction: offScreen.indicatorDirection
      })

      newTags.push({
        key,
        states: cell.states,
        type: cell.type,
        top: rect.top - overlayRect.top,
        left: rect.left - overlayRect.left,
        width: rect.width,
        height: rect.height,
        visible,
        ...offScreen
      })
    } else {
      // Element not in DOM (virtual scroll) — use last known rect for off-screen indicator
      const last = lastKnownRects.get(key)
      if (last) {
        const rect = new DOMRect(last.left, last.top, last.width, last.height)
        const offScreen = computeOffScreenIndicator(rect, containerRect)

        newTags.push({
          key,
          states: cell.states,
          type: cell.type,
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          visible: false,
          ...offScreen
        })
      }
    }
  }

  tags.value = newTags
}

function handleJump(tag: TagItem) {
  const focus = tag.states[0]?.focus
  if (focus) {
    emit('jump', focus)
  }
}

function firstUserColor(states: AwarenessState[]): string {
  return states[0]?.user?.color || '#999'
}

function firstUserInitial(states: AwarenessState[]): string {
  return (states[0]?.user?.name || '?').charAt(0).toUpperCase()
}

// rAF loop
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
  lastKnownRects.clear()
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
    <!-- On-screen tags -->
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
      @click="handleJump(tag)"
    >
      <DatabaseAwarenessUserCursorTag
        :states="tag.states"
        :type="tag.type"
        :width="tag.width"
        :height="tag.height"
      />
    </div>

    <!-- Off-screen arrow indicators -->
    <div
      v-for="tag in tags"
      :key="tag.key + '-offscreen'"
      class="off-screen-indicator"
      :class="{ 'indicator-hidden': tag.visible }"
      :style="{
        top: tag.indicatorTop + 'px',
        left: tag.indicatorLeft + 'px'
      }"
      @click="handleJump(tag)"
    >
      <Icon
        :name="`lucide:arrow-${tag.indicatorDirection}`"
        :style="{ color: firstUserColor(tag.states) }"
        size="14"
      />
      <span
        class="indicator-avatar"
        :style="{ backgroundColor: firstUserColor(tag.states) }"
      >
        {{ firstUserInitial(tag.states) }}
      </span>
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

.off-screen-indicator {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 28px;
  height: 28px;
  border-radius: var(--app-border-radius-m);
  background: var(--app-paper);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
  z-index: 101;
  transition: opacity 0.15s ease;
}

.indicator-hidden {
  opacity: 0;
  pointer-events: none;
}

.indicator-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: white;
}
</style>
