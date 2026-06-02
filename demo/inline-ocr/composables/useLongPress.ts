import { ref, onMounted, onUnmounted } from 'vue'

export interface LongPressOptions {
  delay?: number
  moveThreshold?: number
}

export function useLongPress(
  targetRef: Ref<HTMLElement | null>,
  onLongPress: (e: MouseEvent | TouchEvent) => void,
  options: LongPressOptions = {}
) {
  const { delay = 600, moveThreshold = 10 } = options

  const isPressed = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let startPos = { x: 0, y: 0 }

  function start(e: MouseEvent | TouchEvent) {
    isPressed.value = true
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startPos = { x: clientX, y: clientY }

    timer = setTimeout(() => {
      if (isPressed.value) {
        onLongPress(e)
        isPressed.value = false
      }
    }, delay)
  }

  function move(e: MouseEvent | TouchEvent) {
    if (!isPressed.value) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const dx = clientX - startPos.x
    const dy = clientY - startPos.y
    if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
      cancel()
    }
  }

  function cancel() {
    isPressed.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onMounted(() => {
    const el = targetRef.value
    if (!el) return
    el.addEventListener('mousedown', start)
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('mousemove', move)
    el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
    el.addEventListener('contextmenu', (e) => e.preventDefault())
  })

  onUnmounted(() => {
    const el = targetRef.value
    if (!el) return
    el.removeEventListener('mousedown', start)
    el.removeEventListener('touchstart', start)
    el.removeEventListener('mousemove', move)
    el.removeEventListener('touchmove', move)
    el.removeEventListener('mouseup', cancel)
    el.removeEventListener('mouseleave', cancel)
    el.removeEventListener('touchend', cancel)
    el.removeEventListener('touchcancel', cancel)
    cancel()
  })

  return { isPressed }
}
