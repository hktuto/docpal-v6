<script setup lang="ts">
import type { CSSProperties } from 'vue'

defineOptions({
  name: 'UiDpPopover'
})

interface PopoverPoint {
  clientX: number
  clientY: number
}

type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

type PopoverAnchor = MouseEvent | PointerEvent | PopoverPoint | HTMLElement

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    width?: string | number
    placement?: PopoverPlacement
    offset?: number
    boundaryPadding?: number
    closeOnClickOutside?: boolean
    popperClass?: string
  }>(),
  {
    modelValue: false,
    placement: 'bottom-start',
    offset: 8,
    boundaryPadding: 8,
    closeOnClickOutside: true,
    popperClass: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  show: []
  hide: []
}>()

const popoverRef = ref<HTMLElement>()
const visible = ref(props.modelValue)
const positioned = ref(false)
const anchorElement = ref<HTMLElement | null>(null)
const anchorPoint = ref<PopoverPoint>({ clientX: 0, clientY: 0 })
const popoverPosition = ref({ left: 0, top: 0 })
const globalEventsBound = ref(false)

const popoverStyle = computed<CSSProperties>(() => ({
  left: `${popoverPosition.value.left}px`,
  top: `${popoverPosition.value.top}px`,
  width: normalizeSize(props.width),
  visibility: positioned.value ? 'visible' : 'hidden'
}))

watch(
  () => props.modelValue,
  async (value) => {
    if (value === visible.value) {
      return
    }

    visible.value = value
    positioned.value = false

    if (value) {
      await nextTick()
      updatePosition()
      bindGlobalEvents()
      emit('show')
      return
    }

    unbindGlobalEvents()
    emit('hide')
  }
)

async function open(mouseEvent: MouseEvent) {
  console.log('open', mouseEvent)
  setAnchor(mouseEvent)
  positioned.value = false
  visible.value = true
  emit('update:modelValue', true)
  await nextTick()
  updatePosition()
  bindGlobalEvents()
  emit('show')
}

function close() {
  if (!visible.value) {
    return
  }

  visible.value = false
  positioned.value = false
  anchorElement.value = null
  emit('update:modelValue', false)
  unbindGlobalEvents()
  emit('hide')
}

function setAnchor(anchor?: any | null) {
  anchorElement.value = isElementAnchor(anchor) ? anchor : null

  if (isPointAnchor(anchor)) {
    anchorPoint.value = {
      clientX: anchor.clientX,
      clientY: anchor.clientY
    }
    return
  }

  if (anchorElement.value) {
    const rect = anchorElement.value.getBoundingClientRect()
    anchorPoint.value = {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    }
  }
}

function updatePosition() {
  const popoverElement = popoverRef.value
  if (!popoverElement) {
    return
  }

  const { width, height } = popoverElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const padding = props.boundaryPadding
  const nextPosition = anchorElement.value
    ? getElementPosition(anchorElement.value, width, height, viewportWidth, viewportHeight)
    : getPointPosition(width, height, viewportWidth, viewportHeight)

  popoverPosition.value = {
    left: keepInViewport(nextPosition.left, width, viewportWidth, padding),
    top: keepInViewport(nextPosition.top, height, viewportHeight, padding)
  }
  positioned.value = true
}

function getPointPosition(width: number, height: number, viewportWidth: number, viewportHeight: number) {
  const { clientX, clientY } = anchorPoint.value
  const offset = props.offset
  const padding = props.boundaryPadding

  let left = clientX + offset
  let top = clientY + offset

  if (top + height > viewportHeight - padding) {
    top = clientY - height - offset
  }

  if (top < padding) {
    top = clientY + offset
  }

  if (left + width > viewportWidth - padding) {
    left = clientX - width - offset
  }

  if (left < padding) {
    left = clientX + offset
  }

  return { left, top }
}

function getElementPosition(anchor: HTMLElement, width: number, height: number, viewportWidth: number, viewportHeight: number) {
  const rect = anchor.getBoundingClientRect()
  const [side, align = 'start'] = props.placement.split('-')
  const offset = props.offset
  const padding = props.boundaryPadding
  const resolvedSide = resolveSide(side, rect, width, height, viewportWidth, viewportHeight, padding)

  let left = rect.left
  let top = rect.bottom + offset

  if (resolvedSide === 'top') {
    top = rect.top - height - offset
  } else if (resolvedSide === 'left') {
    left = rect.left - width - offset
    top = getVerticalAlignedTop(rect, height, align)
  } else if (resolvedSide === 'right') {
    left = rect.right + offset
    top = getVerticalAlignedTop(rect, height, align)
  } else {
    top = rect.bottom + offset
  }

  if (resolvedSide === 'top' || resolvedSide === 'bottom') {
    left = getHorizontalAlignedLeft(rect, width, align)
  }

  return { left, top }
}

function resolveSide(side: string, rect: DOMRect, width: number, height: number, viewportWidth: number, viewportHeight: number, padding: number) {
  const offset = props.offset

  if (side === 'top' && rect.top - height - offset < padding) {
    return 'bottom'
  }

  if (side === 'bottom' && rect.bottom + height + offset > viewportHeight - padding) {
    return 'top'
  }

  if (side === 'left' && rect.left - width - offset < padding) {
    return 'right'
  }

  if (side === 'right' && rect.right + width + offset > viewportWidth - padding) {
    return 'left'
  }

  return side
}

function getHorizontalAlignedLeft(rect: DOMRect, width: number, align: string) {
  if (align === 'end') {
    return rect.right - width
  }

  if (align === 'center') {
    return rect.left + (rect.width - width) / 2
  }

  return rect.left
}

function getVerticalAlignedTop(rect: DOMRect, height: number, align: string) {
  if (align === 'end') {
    return rect.bottom - height
  }

  if (align === 'center') {
    return rect.top + (rect.height - height) / 2
  }

  return rect.top
}

function keepInViewport(position: number, size: number, viewportSize: number, padding: number) {
  if (size >= viewportSize - padding * 2) {
    return padding
  }

  return Math.min(Math.max(position, padding), viewportSize - size - padding)
}

function handleDocumentMouseDown(event: MouseEvent) {
  if (!props.closeOnClickOutside || !visible.value) {
    return
  }

  const target = event.target as Node
  if (popoverRef.value?.contains(target)) {
    return
  }

  if (anchorElement.value?.contains(target)) {
    return
  }

  close()
}

function bindGlobalEvents() {
  if (globalEventsBound.value) {
    return
  }

  document.addEventListener('mousedown', handleDocumentMouseDown)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
  globalEventsBound.value = true
}

function unbindGlobalEvents() {
  if (!globalEventsBound.value) {
    return
  }

  document.removeEventListener('mousedown', handleDocumentMouseDown)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
  globalEventsBound.value = false
}

function isElementAnchor(anchor?: PopoverAnchor | null): anchor is HTMLElement {
  return !!anchor && 'getBoundingClientRect' in anchor
}

function isPointAnchor(anchor?: PopoverAnchor | null): anchor is MouseEvent | PointerEvent | PopoverPoint {
  return !!anchor && typeof anchor.clientX === 'number' && typeof anchor.clientY === 'number'
}

function normalizeSize(size?: string | number) {
  if (typeof size === 'number') {
    return `${size}px`
  }

  return size
}

onMounted(async () => {
  if (!visible.value) {
    return
  }

  await nextTick()
  updatePosition()
  bindGlobalEvents()
})

onBeforeUnmount(unbindGlobalEvents)

defineExpose({
  open,
  close,
  updatePosition
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" ref="popoverRef" class="dp-popover" :class="popperClass" :style="popoverStyle" role="dialog" tabindex="-1" @mousedown.stop>
      <slot :close="close" />
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.dp-popover {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  background: var(--app-bg-color, #fff);
  border: 1px solid var(--app-border-color, #dcdfe6);
  border-radius: var(--app-border-radius-base, 4px);
  box-shadow: var(--app-box-shadow-light, 0 2px 12px 0 rgb(0 0 0 / 10%));
}
</style>
