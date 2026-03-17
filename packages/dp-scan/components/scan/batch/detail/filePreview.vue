<script lang="ts" setup>
import { useBatchDetailContext, useScanClient } from '#imports'

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access (no .value needed in template)
const {
  previewLoading,
  previewImgUrl,
  currentPageNumber,
  totalPages,
  highlightedSection,
  highlightedField,
  changePage,
  currentSelectedDoc,
  sectionsWithValues,
  isLockedByOther,
  projectId,
  updateSectionZone
} = context

// Check user permissions
const { isVerifier } = useScanClient()
const canEdit = computed(() => isVerifier(projectId.value) && !isLockedByOther.value)

// Check if current document has error status
const hasError = computed(() => {
  const status = currentSelectedDoc.value?.status
  return status?.includes('fail') || status === 'error'
})

// Crop editing state
const isEditingCrop = ref(false)
const editingZone = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const editingSectionId = ref<string | null>(null)
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const resizeStart = ref({ x: 0, y: 0, zoneX: 0, zoneY: 0, zoneW: 0, zoneH: 0 })

// Canvas refs
const canvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLDivElement>()

// Image loading state
const imageObj = ref<HTMLImageElement>()
const imageLoading = ref(false)

// Zoom state
const zoomScale = ref(1) // 1 = 100%, can be >1 for zoom in, <1 for zoom out
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.2

// Pan state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })

// Calculate base scale to fit image in container (fit-to-screen)
const baseScale = computed(() => {
  const img = imageObj.value
  const container = containerRef.value
  if (!img || !container) return 1

  const containerRect = container.getBoundingClientRect()
  return Math.min(
    containerRect.width / img.naturalWidth,
    containerRect.height / img.naturalHeight,
    1 // Don't upscale beyond 100%
  )
})

// Canvas cursor based on state
const canvasCursor = computed(() => {
  if (isResizing.value) return 'grabbing'
  if (isDragging.value) return 'grabbing'
  if (isEditingCrop.value) {
    // Could enhance to show resize cursors based on hover
    return 'crosshair'
  }
  return 'grab'
})



// Current effective scale = base scale * zoom
const effectiveScale = computed(() => {
  return baseScale.value * zoomScale.value
})

// Parse zone string to coordinates
function parseZone(zone: string): { x: number; y: number; width: number; height: number } | null {
  if (!zone) return null
  const parts = zone.split(',').map(p => parseFloat(p.trim()))
  if (parts.length !== 4 || parts.some(isNaN)) return null
  const [x1, y1, x2, y2] = parts
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  }
}

// Draw image and highlights on canvas
function drawCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  const img = imageObj.value

  if (!canvas || !container || !img) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scale = effectiveScale.value

  const displayWidth = img.naturalWidth * scale
  const displayHeight = img.naturalHeight * scale

  // Set canvas size
  canvas.width = displayWidth
  canvas.height = displayHeight

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw image
  ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

  // Draw editing highlight if in edit mode
  if (isEditingCrop.value && editingZone.value) {
    drawEditingHighlightBox(ctx, editingZone.value, scale)
  } else {
    // Draw section highlight if on current page
    if (highlightedSection.value && currentPageNumber.value === highlightedSection.value.page) {
      const zone = parseZone(highlightedSection.value.zone)
      if (zone) {
        drawHighlightBox(ctx, zone, scale, '#409EFF', 2) // Blue for section
      }
    }
    // Draw field highlight if on current page
    if (highlightedSection.value?.section_type !== 'table' && highlightedField.value && currentPageNumber.value === highlightedField.value.page) {
      const zone = parseZone(highlightedField.value.zone)
      if (zone) {
        drawHighlightBox(ctx, zone, scale, '#67C23A', 2) // Green for field
      }
    }
  }
}

// Draw editing highlight box with resize handles and buttons
function drawEditingHighlightBox(
  ctx: CanvasRenderingContext2D,
  zone: { x: number; y: number; width: number; height: number },
  scale: number
) {
  const x = zone.x * scale
  const y = zone.y * scale
  const w = zone.width * scale
  const h = zone.height * scale

  const color = '#409EFF' // Blue (same as section highlight)

  // Draw semi-transparent fill
  ctx.fillStyle = color + '20' // 20 hex = ~12% opacity (same as section)
  ctx.fillRect(x, y, w, h)

  // Draw border
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5]) // Dashed line for editing
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([]) // Reset dash

  // Draw larger resize handles (10px)
  const handleSize = 10
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = color
  ctx.lineWidth = 2

  // Helper to draw handle
  const drawHandle = (hx: number, hy: number) => {
    ctx.fillRect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize)
    ctx.strokeRect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize)
  }

  // Top-left
  drawHandle(x, y)
  // Top-right
  drawHandle(x + w, y)
  // Bottom-left
  drawHandle(x, y + h)
  // Bottom-right
  drawHandle(x + w, y + h)

  // Draw Save/Cancel buttons below the crop area
  const buttonHeight = 28
  const buttonPadding = 8
  const gap = 8
  const fontSize = 12

  // Button text
  const saveText = 'Save'
  const cancelText = 'Cancel'

  // Measure text width
  ctx.font = `500 ${fontSize}px sans-serif`
  const saveTextWidth = ctx.measureText(saveText).width
  const cancelTextWidth = ctx.measureText(cancelText).width

  // Calculate button widths
  const saveBtnWidth = saveTextWidth + buttonPadding * 2
  const cancelBtnWidth = cancelTextWidth + buttonPadding * 2
  const totalWidth = saveBtnWidth + gap + cancelBtnWidth

  // Position buttons centered below crop area with 20px offset
  const startX = x + (w - totalWidth) / 2
  const btnY = y + h + 20

  // Store button positions for click detection
  canvasButtons.value = {
    save: { x: startX, y: btnY, width: saveBtnWidth, height: buttonHeight },
    cancel: { x: startX + saveBtnWidth + gap, y: btnY, width: cancelBtnWidth, height: buttonHeight }
  }

  // Helper to draw button
  const drawButton = (
    bx: number, by: number, bwidth: number, bheight: number,
    text: string, bgColor: string, textColor: string
  ) => {
    // Button background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2

    // Button background
    ctx.fillStyle = bgColor
    ctx.beginPath()
    ctx.roundRect(bx, by, bwidth, bheight, 4)
    ctx.fill()

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Button text
    ctx.fillStyle = textColor
    ctx.font = `500 ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, bx + bwidth / 2, by + bheight / 2 + 1)
  }

  // Draw Save button (green)
  drawButton(startX, btnY, saveBtnWidth, buttonHeight, saveText, '#67C23A', '#fff')

  // Draw Cancel button (gray)
  drawButton(startX + saveBtnWidth + gap, btnY, cancelBtnWidth, buttonHeight, cancelText, '#909399', '#fff')
}

// Draw a single highlight box
function drawHighlightBox(
  ctx: CanvasRenderingContext2D,
  zone: { x: number; y: number; width: number; height: number },
  scale: number,
  color: string,
  lineWidth: number
) {
  const x = zone.x * scale
  const y = zone.y * scale
  const w = zone.width * scale
  const h = zone.height * scale

  // Draw semi-transparent fill
  ctx.fillStyle = color + '20' // 20 hex = ~12% opacity
  ctx.fillRect(x, y, w, h)

  // Draw border
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.strokeRect(x, y, w, h)

  // Draw corner handles
  const handleSize = 6
  ctx.fillStyle = color

  // Top-left
  ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
  // Top-right
  ctx.fillRect(x + w - handleSize/2, y - handleSize/2, handleSize, handleSize)
  // Bottom-left
  ctx.fillRect(x - handleSize/2, y + h - handleSize/2, handleSize, handleSize)
  // Bottom-right
  ctx.fillRect(x + w - handleSize/2, y + h - handleSize/2, handleSize, handleSize)
}

// Center the canvas in the container
function centerCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  // Reset margins before calculating (in case of zoom change)
  canvas.style.marginLeft = ''
  canvas.style.marginRight = ''
  canvas.style.marginTop = ''
  canvas.style.marginBottom = ''

  // Only center if canvas is larger than container (scrollable)
  const maxScrollLeft = canvas.width - container.clientWidth
  const maxScrollTop = canvas.height - container.clientHeight

  if (maxScrollLeft > 0) {
    container.scrollLeft = maxScrollLeft / 2
  } else {
    // Canvas fits horizontally - center via flexbox by adding margin
    canvas.style.marginLeft = 'auto'
    canvas.style.marginRight = 'auto'
  }

  if (maxScrollTop > 0) {
    container.scrollTop = maxScrollTop / 2
  } else {
    // Canvas fits vertically - center via flexbox by adding margin
    canvas.style.marginTop = 'auto'
    canvas.style.marginBottom = 'auto'
  }
}

// Track pending highlight pan (for cross-page highlights)
const pendingHighlightPan = ref<{ zone: string; page: number } | null>(null)

// Pan timeout for debouncing same-page highlight pans
let highlightPanTimeout: ReturnType<typeof setTimeout> | null = null

// Canvas button state for edit mode
const canvasButtons = ref<{
  save: { x: number; y: number; width: number; height: number } | null
  cancel: { x: number; y: number; width: number; height: number } | null
}>({ save: null, cancel: null })

// Load image when preview URL changes
watch(() => previewImgUrl.value, (url) => {
  if (!url) return

  // Reset zoom when new image loads
  zoomScale.value = 1

  imageLoading.value = true
  const img = new Image()
  img.onload = () => {
    imageObj.value = img
    imageLoading.value = false
    nextTick(() => {
      drawCanvas()
      // Check if we have a pending highlight pan
      if (pendingHighlightPan.value && pendingHighlightPan.value.page === currentPageNumber.value) {
        const zone = parseZone(pendingHighlightPan.value.zone)
        if (zone) {
          nextTick(() => panToZone(zone))
        }
        pendingHighlightPan.value = null
      } else {
        // Center canvas after drawing
        nextTick(() => centerCanvas())
      }
    })
  }
  img.onerror = () => {
    imageLoading.value = false
  }
  img.src = url
}, { immediate: true })

// Pan to center a zone in the viewport
function panToZone(zone: { x: number; y: number; width: number; height: number } | null) {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas || !zone) return

  const scale = effectiveScale.value

  // Calculate zone center in screen coordinates
  const zoneCenterX = (zone.x + zone.width / 2) * scale
  const zoneCenterY = (zone.y + zone.height / 2) * scale

  // Calculate target scroll position to center the zone
  const targetScrollLeft = zoneCenterX - container.clientWidth / 2
  const targetScrollTop = zoneCenterY - container.clientHeight / 2

  // Smooth scroll to target
  container.scrollTo({
    left: Math.max(0, targetScrollLeft),
    top: Math.max(0, targetScrollTop),
    behavior: 'smooth'
  })
}

// Redraw when highlights change and auto-pan to highlight
watch(() => highlightedSection.value, (newVal) => {
  drawCanvas()
  if (!newVal) return

  // Don't auto-pan when in edit mode
  if (isEditingCrop.value) return

  // Clear any pending pan timeout
  if (highlightPanTimeout) {
    clearTimeout(highlightPanTimeout)
    highlightPanTimeout = null
  }

  // If highlight is on current page, pan after short delay
  if (currentPageNumber.value === newVal.page) {
    highlightPanTimeout = setTimeout(() => {
      const zone = parseZone(newVal.zone)
      if (zone) panToZone(zone)
    }, 100)
  } else {
    // Highlight is on a different page, set pending pan for after page load
    pendingHighlightPan.value = { zone: newVal.zone, page: newVal.page }
  }
}, { deep: true })

watch(() => highlightedField.value, (newVal) => {
  drawCanvas()
  if (!newVal) return
  // Don't auto-pan when in edit mode
  if (isEditingCrop.value) return

  // Clear any pending pan timeout
  if (highlightPanTimeout) {
    clearTimeout(highlightPanTimeout)
    highlightPanTimeout = null
  }

  // If highlight is on current page, pan after short delay
  if (currentPageNumber.value === newVal.page) {
    highlightPanTimeout = setTimeout(() => {
      const zone = parseZone(newVal.zone)
      if (zone) panToZone(zone)
    }, 100)
  } else {
    // Highlight is on a different page, set pending pan for after page load
    pendingHighlightPan.value = { zone: newVal.zone, page: newVal.page }
  }
}, { deep: true })

// Store the mouse position for zoom-to-cursor
const lastMousePosition = ref<{ x: number; y: number } | null>(null)

// Zoom towards a focal point (mouse position)
function zoomTo(newZoom: number, focalPoint?: { x: number; y: number } | null) {
  const container = containerRef.value
  const canvas = canvasRef.value
  const img = imageObj.value
  if (!container || !canvas || !img) return

  // Clamp zoom
  const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM))
  if (clampedZoom === zoomScale.value) return

  // If no focal point provided, zoom to center
  const focus = focalPoint || {
    x: container.clientWidth / 2 + container.scrollLeft,
    y: container.clientHeight / 2 + container.scrollTop
  }

  // Calculate the point on the image that we're zooming towards (as ratio 0-1)
  const oldScale = baseScale.value * zoomScale.value
  const imageX = focus.x / oldScale
  const imageY = focus.y / oldScale

  // Apply new zoom
  zoomScale.value = clampedZoom

  // After zoom, calculate where that same point should be
  nextTick(() => {
    const newScale = baseScale.value * zoomScale.value
    const newCanvasWidth = img.naturalWidth * newScale
    const newCanvasHeight = img.naturalHeight * newScale

    // Update canvas size
    canvas.width = newCanvasWidth
    canvas.height = newCanvasHeight

    // Redraw
    drawCanvas()

    // Adjust scroll to keep the focal point in the same position
    const newFocusX = imageX * newScale
    const newFocusY = imageY * newScale

    container.scrollLeft = newFocusX - focus.x + container.scrollLeft
    container.scrollTop = newFocusY - focus.y + container.scrollTop

    // Apply margins if canvas fits in container
    const maxScrollLeft = canvas.width - container.clientWidth
    const maxScrollTop = canvas.height - container.clientHeight

    if (maxScrollLeft <= 0) {
      canvas.style.marginLeft = 'auto'
      canvas.style.marginRight = 'auto'
    } else {
      canvas.style.marginLeft = ''
      canvas.style.marginRight = ''
    }

    if (maxScrollTop <= 0) {
      canvas.style.marginTop = 'auto'
      canvas.style.marginBottom = 'auto'
    } else {
      canvas.style.marginTop = ''
      canvas.style.marginBottom = ''
    }
  })
}

// Handle window resize - recalculate base scale but keep zoom level
function handleResize() {
  nextTick(() => drawCanvas())
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // Clear any pending highlight pan timeout
  if (highlightPanTimeout) {
    clearTimeout(highlightPanTimeout)
  }
})

// Zoom functions
function zoomIn() {
  zoomTo(zoomScale.value + ZOOM_STEP)
}

function zoomOut() {
  zoomTo(zoomScale.value - ZOOM_STEP)
}

function resetZoom() {
  zoomScale.value = 1
  nextTick(() => centerCanvas())
}



// ==================== CROP EDITING FUNCTIONS ====================

// Check if highlighted section is editable (save_to_result = true)
const canEditCrop = computed(() => {
  if (!canEdit.value || !highlightedSection.value) return false

  const section = sectionsWithValues.value.find(
    s => s.zone.page === highlightedSection.value?.page &&
         s.zone.zone === highlightedSection.value?.zone
  )

  return section?.save_to_result === true
})

// Auto-enter edit mode when editable section is highlighted
watch(() => highlightedSection.value, (newVal) => {
  if (!newVal) {
    // Exit edit mode when no section highlighted
    cancelCropEdit()
    return
  }
  // Check if new section is editable
  const section = sectionsWithValues.value.find(
    s => {
      return s.zone && s.zone.page === newVal.page && s.zone.zone === newVal.zone
    }
  )
  if (section?.save_to_result === true && canEdit.value) {
    // Auto-enter edit mode for this section
    nextTick(() => {
      startCropEditForSection(section)
    })
  } else {
    // Exit edit mode if current section not editable
    cancelCropEdit()
  }
}, { immediate: true })

// Get the currently editing section
const editingSection = computed(() => {
  if (!editingSectionId.value) return null
  return sectionsWithValues.value.find(s => s.section_id === editingSectionId.value)
})

// Start editing the crop area for a specific section
function startCropEditForSection(section: any) {
  if (!section) return

  const zone = parseZone(section.zone.zone)
  if (!zone) return

  editingSectionId.value = section.section_id
  editingZone.value = { ...zone }
  isEditingCrop.value = true
}

// Start editing the crop area (manual trigger)
function startCropEdit() {
  if (!canEditCrop.value || !highlightedSection.value) return

  const section = sectionsWithValues.value.find(
    s => s.zone.page === highlightedSection.value?.page &&
         s.zone.zone === highlightedSection.value?.zone
  )

  startCropEditForSection(section)
}

// Cancel crop editing
function cancelCropEdit() {
  isEditingCrop.value = false
  editingZone.value = null
  editingSectionId.value = null
  isResizing.value = false
  resizeHandle.value = null
}

// Save crop changes
async function saveCropEdit() {
  if (!editingSection.value || !editingZone.value) return

  try {
    // Convert zone back to string format
    const zoneString = `${editingZone.value.x},${editingZone.value.y},${editingZone.value.x + editingZone.value.width},${editingZone.value.y + editingZone.value.height}`

    await updateSectionZone(editingSection.value.section_id, {
      page: editingSection.value.zone.page,
      zone: zoneString
    })

    // Update local highlight to match new zone
    if (highlightedSection.value) {
      highlightedSection.value.zone = zoneString
    }

    // Exit edit mode
    cancelCropEdit()

    // Show success message
    const routerProvider = inject(MenuRouterKey)
    routerProvider?.message.success('Crop area updated successfully')
  } catch (error) {
    console.error('Failed to save crop:', error)
    const routerProvider = inject(MenuRouterKey)
    routerProvider?.message.error('Failed to save crop area')
  }
}

// Handle resize handle mouse down
function handleResizeHandleMouseDown(event: MouseEvent, handle: string) {
  event.stopPropagation()
  if (!editingZone.value) return

  isResizing.value = true
  resizeHandle.value = handle
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    zoneX: editingZone.value.x,
    zoneY: editingZone.value.y,
    zoneW: editingZone.value.width,
    zoneH: editingZone.value.height
  }
}

// Handle resize mouse move
function handleResizeMouseMove(event: MouseEvent) {
  if (!isResizing.value || !editingZone.value || !resizeHandle.value) return

  const scale = effectiveScale.value
  const dx = (event.clientX - resizeStart.value.x) / scale
  const dy = (event.clientY - resizeStart.value.y) / scale

  let newX = editingZone.value.x
  let newY = editingZone.value.y
  let newW = editingZone.value.width
  let newH = editingZone.value.height

  switch (resizeHandle.value) {
    case 'nw':
      newX = resizeStart.value.zoneX + dx
      newY = resizeStart.value.zoneY + dy
      newW = resizeStart.value.zoneW - dx
      newH = resizeStart.value.zoneH - dy
      break
    case 'ne':
      newY = resizeStart.value.zoneY + dy
      newW = resizeStart.value.zoneW + dx
      newH = resizeStart.value.zoneH - dy
      break
    case 'sw':
      newX = resizeStart.value.zoneX + dx
      newW = resizeStart.value.zoneW - dx
      newH = resizeStart.value.zoneH + dy
      break
    case 'se':
      newW = resizeStart.value.zoneW + dx
      newH = resizeStart.value.zoneH + dy
      break
  }

  // Enforce minimum size
  if (newW < 10) newW = 10
  if (newH < 10) newH = 10

  // Update editing zone
  editingZone.value = {
    x: newX,
    y: newY,
    width: newW,
    height: newH
  }

  // Redraw canvas
  drawCanvas()
}

// Handle resize mouse up
function handleResizeMouseUp() {
  isResizing.value = false
  resizeHandle.value = null
}

// Combined mouse move handler for pan and zoom tracking
function handleContainerMouseMove(event: MouseEvent) {
  // Track mouse position for zoom-to-cursor
  if (containerRef.value) {
    const container = containerRef.value
    lastMousePosition.value = {
      x: event.clientX - container.getBoundingClientRect().left + container.scrollLeft,
      y: event.clientY - container.getBoundingClientRect().top + container.scrollTop
    }
  }

  // Handle pan drag
  handleMouseMove(event)
}

// Mouse wheel zoom - zooms towards mouse position
function handleWheel(event: WheelEvent) {
  event.preventDefault()

  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = zoomScale.value + delta

  // Calculate mouse position relative to the container
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left + container.scrollLeft
  const mouseY = event.clientY - rect.top + container.scrollTop

  zoomTo(newZoom, { x: mouseX, y: mouseY })
}

// Check if mouse is over a resize handle
function getResizeHandleAtPosition(mouseX: number, mouseY: number): string | null {
  if (!isEditingCrop.value || !editingZone.value || !canvasRef.value) return null

  const scale = effectiveScale.value
  const zone = editingZone.value
  const x = zone.x * scale
  const y = zone.y * scale
  const w = zone.width * scale
  const h = zone.height * scale
  const handleSize = 14 // Slightly larger hit area (10px visual + padding)

  // Check each handle
  const handles = [
    { name: 'nw', x: x, y: y },
    { name: 'ne', x: x + w, y: y },
    { name: 'sw', x: x, y: y + h },
    { name: 'se', x: x + w, y: y + h }
  ]

  for (const handle of handles) {
    if (
      mouseX >= handle.x - handleSize/2 &&
      mouseX <= handle.x + handleSize/2 &&
      mouseY >= handle.y - handleSize/2 &&
      mouseY <= handle.y + handleSize/2
    ) {
      return handle.name
    }
  }

  return null
}

// Check if mouse is over a canvas button
function getCanvasButtonAtPosition(mouseX: number, mouseY: number): 'save' | 'cancel' | null {
  if (!isEditingCrop.value) return null

  // Check Save button
  const saveBtn = canvasButtons.value.save
  if (saveBtn &&
      mouseX >= saveBtn.x &&
      mouseX <= saveBtn.x + saveBtn.width &&
      mouseY >= saveBtn.y &&
      mouseY <= saveBtn.y + saveBtn.height) {
    return 'save'
  }

  // Check Cancel button
  const cancelBtn = canvasButtons.value.cancel
  if (cancelBtn &&
      mouseX >= cancelBtn.x &&
      mouseX <= cancelBtn.x + cancelBtn.width &&
      mouseY >= cancelBtn.y &&
      mouseY <= cancelBtn.y + cancelBtn.height) {
    return 'cancel'
  }

  return null
}

// Pan/drag functions
function handleMouseDown(event: MouseEvent) {
  if (!containerRef.value || !canvasRef.value) return

  const container = containerRef.value
  const canvas = canvasRef.value

  // Calculate mouse position relative to canvas
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Check if clicking on a canvas button (Save/Cancel)
  const button = getCanvasButtonAtPosition(mouseX, mouseY)
  if (button) {
    event.preventDefault()
    event.stopPropagation()
    if (button === 'save') {
      console.log("sve button click")
      saveCropEdit()
    } else if (button === 'cancel') {
      cancelCropEdit()
    }
    return
  }

  // Check if clicking on a resize handle
  const handle = getResizeHandleAtPosition(mouseX, mouseY)
  if (handle) {
    handleResizeHandleMouseDown(event, handle)
    return
  }

  // Don't start pan if resizing
  if (isResizing.value) return

  // Only start dragging if image is larger than container
  const canPanHorizontal = canvas.width > container.clientWidth
  const canPanVertical = canvas.height > container.clientHeight

  if (!canPanHorizontal && !canPanVertical) return

  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  scrollStart.value = { x: container.scrollLeft, y: container.scrollTop }

  container.style.cursor = 'grabbing'
}

function handleMouseMove(event: MouseEvent) {
  // Handle resize if in resize mode
  if (isResizing.value) {
    handleResizeMouseMove(event)
    return
  }

  if (!isDragging.value || !containerRef.value) return

  event.preventDefault()

  const container = containerRef.value
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y

  container.scrollLeft = scrollStart.value.x - dx
  container.scrollTop = scrollStart.value.y - dy
}

function handleMouseUp() {
  // Handle resize mouse up
  if (isResizing.value) {
    handleResizeMouseUp()
    return
  }

  if (!containerRef.value) return

  isDragging.value = false
  containerRef.value.style.cursor = 'grab'
}

function handleMouseLeave() {
  if (isResizing.value) {
    handleResizeMouseUp()
  }
  if (isDragging.value) {
    isDragging.value = false
    if (containerRef.value) {
      containerRef.value.style.cursor = 'grab'
    }
  }
}

// Navigation functions
function prevPage() {
  if (currentPageNumber.value && currentPageNumber.value > 1) {
    changePage(currentPageNumber.value - 1)
  }
}

function nextPage() {
  if (currentPageNumber.value && totalPages.value &&
      currentPageNumber.value < totalPages.value) {
    changePage(currentPageNumber.value + 1)
  }
}

// ==================== PAGINATION FUNCTIONS ====================

// Input value for current page input
const pageInputValue = ref(currentPageNumber.value?.toString() || '1')

// Sync input value when current page changes
watch(() => currentPageNumber.value, (newVal) => {
  pageInputValue.value = newVal?.toString() || '1'
})

// Handle page input change
function handlePageInputChange() {
  const page = parseInt(pageInputValue.value, 10)
  if (!isNaN(page) && page >= 1 && page <= (totalPages.value || 1)) {
    changePage(page)
  } else {
    // Reset to current page if invalid
    pageInputValue.value = currentPageNumber.value?.toString() || '1'
  }
}

// Handle page input blur - reset if invalid
function handlePageInputBlur() {
  pageInputValue.value = currentPageNumber.value?.toString() || '1'
}

// Computed pagination items based on current page
const paginationItems = computed(() => {
  const total = totalPages.value || 1
  const current = currentPageNumber.value || 1

  // If 7 or fewer pages, show all without ellipsis
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // For more than 7 pages, use compact format with ellipsis
  const items: (number | string)[] = []

  if (current <= 3) {
    // Near start: < [1] 2 3 ... > or < 1 [2] 3 ... > or < 1 2 [3] ... >
    items.push(1, 2, 3)
    items.push('...')
  } else if (current >= total - 2) {
    // Near end: < ... 5 6 [7] >
    items.push('...')
    items.push(total - 2, total - 1, total)
  } else {
    // Middle: < ... 2 3 [4] 5 6 ... >
    items.push('...')
    items.push(current - 1, current, current + 1)
    items.push('...')
  }

  return items
})
</script>

<template>
  <div v-loading="previewLoading" class="previewContainer">
    <div class="previewHeader">
      <div class="action">
        <!-- Zoom Controls -->
        <div class="zoomControls">
          <ElButton link size="small" @click="zoomOut">
            <Icon name="lucide:zoom-out" />
          </ElButton>
          <span class="zoomLevel">{{ Math.round(zoomScale * 100) }}%</span>
          <ElButton link size="small" @click="zoomIn">
            <Icon name="lucide:zoom-in" />
          </ElButton>
        </div>
      </div>
      <div class="pageNav">

      </div>

      <div class="pageInfo">
          <ElButton
            :disabled="(currentPageNumber || 1) <= 1"
            link
            @click="prevPage"
          >
            <Icon name="lucide:chevron-left" />
          </ElButton>

          <div class="pageNumbers">
              <input
                v-model="pageInputValue"
                type="number"
                min="1"
                :max="totalPages || 1"
                class="pageInput active"
                @change="handlePageInputChange"
                @blur="handlePageInputBlur"
                @keyup.enter="handlePageInputChange"
              />
              / <span>{{totalPages}}</span>

          </div>

          <ElButton
            :disabled="(currentPageNumber || 1) >= (totalPages || 1)"
            link
            @click="nextPage"
          >
            <Icon name="lucide:chevron-right" />
          </ElButton>
      </div>
    </div>

    <div
      ref="containerRef"
      v-loading="imageLoading"
      class="previewBody"
      :class="{ canPan: effectiveScale > baseScale, editing: isEditingCrop }"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleContainerMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <!-- Error State -->
      <div v-if="hasError" class="errorState">
        <Icon name="lucide:file-x" class="errorIcon" />
        <span class="errorText">Can Not Preview File</span>
      </div>
      <!-- Normal Preview -->
      <canvas
        v-else-if="previewImgUrl"
        ref="canvasRef"
        class="previewCanvas"
        :class="{ editing: isEditingCrop }"
        :style="{ cursor: canvasCursor }"
      />
      <ElEmpty v-else description="No preview available" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.previewContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.previewHeader {
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.action {
  flex: 1;
  display: flex;
  align-items: center;
}

.zoomControls {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);

  :deep(.el-button) {
    padding: 4px 8px;
    font-size: var(--app-font-size-m);
  }
}

.zoomLevel {
  min-width: 48px;
  text-align: center;
  font-size: var(--app-font-size-s);
  font-weight: 500;
  color: var(--app-text-color-primary);
  user-select: none;
}

.pageNav {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.pageNumbers {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.num {
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-color-secondary);
  cursor: pointer;
  border-radius: var(--app-radius-s);
  font-size: var(--app-font-size-s);
  padding: 0 4px;

  &:hover {
    background-color: var(--app-bg-color-hover);
  }

  &.active {
    background-color: var(--app-primary-color);
    color: white;
    cursor: default;
  }
}

.pageInput {

  text-align: center;
  border-radius: var(--app-radius-s);
  background-color: var(--app-primary-color);
  color: white;
  /* font-size: var(--app-font-size-s); */
  font-weight: 500;
  padding: var(--app-space-xs) var(--app-space-xs);
  border: none;
  outline: none;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    box-shadow: 0 0 0 2px var(--app-primary-color-light, rgba(64, 158, 255, 0.3));
  }
}

.ellipsis {
  min-width: 20px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
  user-select: none;
  cursor: default;
}

.pageInfo {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
}

.previewBody {
  flex: 1;
  overflow: auto;
  display: flex;
  background-color: var(--app-bg-color-secondary);
  padding: var(--app-space-m);
  cursor: grab;
  user-select: none;

  &.canPan {
    cursor: grab;
  }

  &:active {
    cursor: grabbing;
  }

  // Hide scrollbar when not needed
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--app-bg-color-secondary);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-border-color);
    border-radius: 4px;

    &:hover {
      background: var(--app-text-color-disabled);
    }
  }
}

.previewCanvas {
  box-shadow: var(--app-shadow-l);
  flex-shrink: 0;

  // Center canvas when it's smaller than container
  // When canvas is larger, margins are cleared by centerCanvas() for scroll to work
  margin: auto;

  // Prevent flexbox from stretching the canvas
  align-self: flex-start;

  &.editing {
    box-shadow: 0 0 0 2px var(--app-warning-color), var(--app-shadow-l);
  }
}

.errorState {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);
  width: 100%;
  height: 100%;
}

.errorIcon {
  font-size: 48px;
  color: var(--app-error-color);
}

.errorText {
  font-size: var(--app-font-size-l);
}
</style>
