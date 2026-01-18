<template>
  <div class="virtual-scroll-demo">
    <h1>Virtual Scrolling POC with Konva</h1>
    <p class="subtitle">Stage 2: Virtual Scrolling Foundation</p>

    <div class="controls">
      <div class="control-group">
        <label for="totalRows">Total Rows:</label>
        <input id="totalRows" v-model.number="totalRows" type="number" min="1" max="100000" @change="generateData" />
      </div>

      <div class="control-group">
        <label for="totalCols">Total Columns:</label>
        <input id="totalCols" v-model.number="totalCols" type="number" min="1" max="50" @change="generateData" />
      </div>

      <div class="control-group">
        <label for="rowHeight">Row Height:</label>
        <input id="rowHeight" v-model.number="rowHeight" type="number" min="20" max="100" @change="updateViewport" />
      </div>

      <div class="control-group">
        <label for="colWidth">Column Width:</label>
        <input id="colWidth" v-model.number="colWidth" type="number" min="50" max="200" @change="updateViewport" />
      </div>

      <div class="control-group">
        <label for="overscan">Overscan Rows:</label>
        <input id="overscan" v-model.number="overscan" type="number" min="0" max="10" @change="updateViewport" />
      </div>

      <button @click="generateData" class="btn-refresh">Refresh Data</button>
      <button @click="resetViewport" class="btn-reset">Reset View</button>
    </div>

    <div class="demo-container">
      <div class="canvas-section">
        <div class="section-header">
          <h3>Canvas Table with Virtual Scrolling</h3>
          <div class="viewport-info">
            <span>Viewport: {{ viewportWidth }} × {{ viewportHeight }}</span>
            <span>Scale: {{ viewportScale.toFixed(2) }}x</span>
          </div>
        </div>

        <div class="canvas-wrapper" ref="canvasContainer">
          <v-stage ref="stageRef" :config="stageConfig" @wheel="handleStageWheel">
            <!-- Single table layer with everything -->
            <v-layer
              ref="tableLayerRef"
              :config="{
                clip: {
                  x: 0,
                  y: 0,
                  width: viewportWidth,
                  height: viewportHeight
                }
              }"
              @wheel="handleStageWheel"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseLeave"
            >
              <!-- Background rectangle to capture events -->
              <v-rect
                :config="{
                  x: 0,
                  y: 0,
                  width: viewportWidth,
                  height: viewportHeight,
                  fill: 'transparent',
                  listening: true
                }"
                @click="handleBackgroundClick"
                @dblclick="handleBackgroundDoubleClick"
              />

              <!-- Table content (scrolls vertically, starts below header) -->
              <v-group>
                <!-- Visible rows -->
                <v-group v-for="rowIndex in visibleRows" :key="`row-${rowIndex}`">
                  <!-- Row background -->
                  <v-rect
                    :config="{
                      x: 0,
                      y: rowHeight + rowIndex * rowHeight - scrollTop,
                      width: totalWidth,
                      height: rowHeight,
                      fill: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9',
                      stroke: '#eee',
                      strokeWidth: 0.5
                    }"
                  />

                  <!-- Visible cells in this row -->
                  <v-group v-for="colIndex in visibleColumns" :key="`cell-${rowIndex}-${colIndex}`">
                    <v-rect
                      :config="{
                        x: colIndex * colWidth - scrollLeft,
                        y: rowHeight + rowIndex * rowHeight - scrollTop,
                        width: colWidth,
                        height: rowHeight,
                        stroke: '#e0e0e0',
                        strokeWidth: 0.5
                      }"
                      @click="(e: any) => handleCellClick(e, rowIndex, colIndex)"
                      @dblclick="(e: any) => handleCellDoubleClick(e, rowIndex, colIndex)"
                    />
                    <v-text
                      :config="{
                        x: colIndex * colWidth - scrollLeft + 5,
                        y: rowHeight + rowIndex * rowHeight - scrollTop + rowHeight / 2 - 8,
                        text: getCachedCellText(rowIndex, colIndex),
                        fontSize: 11,
                        fontFamily: 'Arial',
                        fill: '#444',
                        align: 'left',
                        verticalAlign: 'middle',
                        width: colWidth - 10,
                        ellipsis: true
                      }"
                    />
                  </v-group>
                </v-group>
              </v-group>

              <!-- Fixed header (always at top, scrolls horizontally) -->
              <v-group>
                <!-- Header background -->
                <v-rect
                  :config="{
                    x: -scrollLeft,
                    y: 0,
                    width: totalWidth,
                    height: rowHeight,
                    fill: '#f5f5f5',
                    stroke: '#ddd',
                    strokeWidth: 1
                  }"
                />

                <!-- Visible column headers -->
                <v-group v-for="colIndex in visibleColumns" :key="`header-${colIndex}`">
                  <v-rect
                    :config="{
                      x: colIndex * colWidth - scrollLeft,
                      y: 0,
                      width: colWidth,
                      height: rowHeight,
                      fill: '#e8e8e8',
                      stroke: '#ccc',
                      strokeWidth: 1
                    }"
                  />
                  <v-text
                    :config="{
                      x: colIndex * colWidth - scrollLeft + 5,
                      y: rowHeight / 2 - 8,
                      text: `Col ${colIndex + 1}`,
                      fontSize: 12,
                      fontFamily: 'Arial',
                      fill: '#333',
                      align: 'left',
                      verticalAlign: 'middle',
                      width: colWidth - 10
                    }"
                  />
                </v-group>
              </v-group>

              <!-- Scrollbars -->
              <v-group v-if="showVerticalScrollbar">
                <v-rect
                  :config="{
                    x: viewportWidth - scrollbarSize,
                    y: 0,
                    width: scrollbarSize,
                    height: viewportHeight - (showHorizontalScrollbar ? scrollbarSize : 0),
                    fill: '#f0f0f0',
                    stroke: '#ddd',
                    strokeWidth: 1
                  }"
                />
                <v-rect
                  ref="verticalThumbRef"
                  :config="{
                    x: viewportWidth - scrollbarSize,
                    y: verticalThumbTop,
                    width: scrollbarSize,
                    height: verticalThumbHeight,
                    fill: '#c1c1c1',
                    cornerRadius: 4,
                    draggable: true,
                    dragBoundFunc: (pos: { x: number; y: number }) => ({
                      x: viewportWidth - scrollbarSize,
                      y: Math.max(0, Math.min(pos.y, viewportHeight - (showHorizontalScrollbar ? scrollbarSize : 0) - verticalThumbHeight))
                    })
                  }"
                  @dragmove="handleVerticalThumbDrag"
                />
              </v-group>

              <!-- Horizontal scrollbar -->
              <v-group v-if="showHorizontalScrollbar">
                <v-rect
                  :config="{
                    x: 0,
                    y: viewportHeight - scrollbarSize,
                    width: viewportWidth - (showVerticalScrollbar ? scrollbarSize : 0),
                    height: scrollbarSize,
                    fill: '#f0f0f0',
                    stroke: '#ddd',
                    strokeWidth: 1
                  }"
                />
                <v-rect
                  ref="horizontalThumbRef"
                  :config="{
                    x: horizontalThumbLeft,
                    y: viewportHeight - scrollbarSize,
                    width: horizontalThumbWidth,
                    height: scrollbarSize,
                    fill: '#c1c1c1',
                    cornerRadius: 4,
                    draggable: true,
                    dragBoundFunc: (pos: { x: number; y: number }) => ({
                      x: Math.max(0, Math.min(pos.x, viewportWidth - (showVerticalScrollbar ? scrollbarSize : 0) - horizontalThumbWidth)),
                      y: viewportHeight - scrollbarSize
                    })
                  }"
                  @dragmove="handleHorizontalThumbDrag"
                />
              </v-group>
            </v-layer>
          </v-stage>
        </div>
      </div>

      <div class="info-section">
        <div class="stats-panel">
          <h3>Performance Stats</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total Items:</span>
              <span class="stat-value">{{ totalRows.toLocaleString() }} × {{ totalCols }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Visible Items:</span>
              <span class="stat-value">{{ visibleRows.length }} × {{ visibleColumns.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Rendered Cells:</span>
              <span class="stat-value">{{ renderedCells }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Scroll Position:</span>
              <span class="stat-value">{{ Math.round(scrollTop) }}px, {{ Math.round(scrollLeft) }}px</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Viewport Range:</span>
              <span class="stat-value">Rows {{ visibleStartRow }}-{{ visibleEndRow }}, Cols {{ visibleStartCol }}-{{ visibleEndCol }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Data Size:</span>
              <span class="stat-value">{{ dataMemory }} MB</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Rendered Data:</span>
              <span class="stat-value">{{ renderedMemory }} MB</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Konva Memory:</span>
              <span class="stat-value">{{ konvaMemory }} MB</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Memory:</span>
              <span class="stat-value">{{ totalMemory }} MB</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Cached Cells:</span>
              <span class="stat-value">{{ cachedCellsCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Loading Cells:</span>
              <span class="stat-value">{{ loadingCellsCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Loaded Chunks:</span>
              <span class="stat-value">{{ lazyLoadingStats.totalChunks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Cache Memory:</span>
              <span class="stat-value">{{ lazyLoadingStats.cacheMemory }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Cache Hit Rate:</span>
              <span class="stat-value">{{ lazyLoadingStats.cacheHitRate }}</span>
            </div>
          </div>
        </div>

        <div class="controls-panel">
          <h3>Scroll Controls</h3>
          <div class="scroll-controls">
            <button @click="scrollToTop" class="btn-scroll">Scroll to Top</button>
            <button @click="scrollToBottom" class="btn-scroll">Scroll to Bottom</button>
            <button @click="scrollToMiddle" class="btn-scroll">Scroll to Middle</button>
            <button @click="scrollToRandom" class="btn-scroll">Scroll to Random</button>
            <button @click="clearCache" class="btn-scroll" style="background: #e74c3c">Clear Cache</button>
          </div>

          <div class="zoom-controls">
            <h4>Zoom Controls</h4>
            <div class="zoom-buttons">
              <button @click="zoomIn" class="btn-zoom">Zoom In</button>
              <button @click="zoomOut" class="btn-zoom">Zoom Out</button>
              <button @click="resetZoom" class="btn-zoom">Reset Zoom</button>
            </div>
            <div class="zoom-slider">
              <label>Zoom Level: {{ (viewportScale * 100).toFixed(0) }}%</label>
              <input type="range" v-model.number="viewportScale" min="0.1" max="3" step="0.1" @input="updateZoom" />
            </div>
          </div>
        </div>

        <div class="instructions-panel">
          <h3>Instructions</h3>
          <ul>
            <li><strong>Mouse Wheel:</strong> Scroll vertically</li>
            <li><strong>Shift + Wheel:</strong> Scroll horizontally</li>
            <li><strong>Ctrl/Cmd + Wheel:</strong> Zoom in/out</li>
            <li><strong>Click & Drag:</strong> Pan the viewport</li>
            <li><strong>Drag Scrollbars:</strong> Navigate quickly</li>
            <li><strong>Double-click Cell:</strong> Edit cell (future)</li>
          </ul>
          <div class="performance-tip">
            <strong>Performance Analysis:</strong>
            • Rendering: {{ renderedCells.toLocaleString() }}/{{ (totalRows * totalCols).toLocaleString() }} cells ({{ renderPercentage }}%) • Memory Savings:
            {{ memorySavingsPercentage }}% ({{ dataMemory }} → {{ totalMemory }}) • Estimated Performance: {{ estimatedFPS }} FPS at current scroll speed •
            Efficiency Score: {{ memoryEfficiency }}/100
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { Stage as VStage, Layer as VLayer, Group as VGroup, Rect as VRect, Text as VText } from 'vue-konva'
import { calculateMemoryUsage, calculatePerformanceMetrics, formatMemory } from '../utils/memoryCalculator'
import { createLazyDataManager } from '../composables/useLazyData'

// Configuration
const totalRows = ref(1000)
const totalCols = ref(5)
const rowHeight = ref(30)
const colWidth = ref(100)
const overscan = ref(3)
const scrollbarSize = ref(12)

// Lazy loading data manager
const lazyDataManager = createLazyDataManager(totalRows.value, totalCols.value, {
  pageSize: 100,
  colPageSize: 5,
  apiDelay: 30, // Simulate API delay
  enableCache: true,
  maxCacheSize: 50
})

// Watch for changes in total rows/cols to update lazy data manager
watch(totalRows, (newValue) => {
  lazyDataManager.clearCache()
})
watch(totalCols, (newValue) => {
  lazyDataManager.clearCache()
})

// Cell data cache for visible cells
const cellDataCache = reactive(new Map<string, string>())
const loadingCells = reactive(new Set<string>())

// Viewport state
const viewportWidth = ref(800)
const viewportHeight = ref(600)
const viewportScale = ref(1)
const scrollTop = ref(0)
const scrollLeft = ref(0)

// Interaction state
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartScrollX = ref(0)
const dragStartScrollY = ref(0)

// Refs
const canvasContainer = ref<HTMLElement>()
const stageRef = ref()
const tableLayerRef = ref()
const verticalThumbRef = ref()
const horizontalThumbRef = ref()

// Calculate total dimensions
const totalWidth = computed(() => totalCols.value * colWidth.value)
const totalHeight = computed(() => (totalRows.value + 1) * rowHeight.value) // +1 for header

// Calculate visible range with overscan
const visibleStartRow = computed(() => {
  const row = Math.floor(scrollTop.value / rowHeight.value)
  return Math.max(0, row - overscan.value)
})

const visibleEndRow = computed(() => {
  const row = Math.floor((scrollTop.value + viewportHeight.value) / rowHeight.value)
  return Math.min(totalRows.value - 1, row + overscan.value)
})

const visibleStartCol = computed(() => {
  const col = Math.floor(scrollLeft.value / colWidth.value)
  return Math.max(0, col - overscan.value)
})

const visibleEndCol = computed(() => {
  const col = Math.floor((scrollLeft.value + viewportWidth.value) / colWidth.value)
  return Math.min(totalCols.value - 1, col + overscan.value)
})

// Generate arrays of visible indices
const visibleRows = computed(() => {
  const start = visibleStartRow.value
  const end = visibleEndRow.value
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const visibleColumns = computed(() => {
  const start = visibleStartCol.value
  const end = visibleEndCol.value
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// Calculate rendered cells count
const renderedCells = computed(() => visibleRows.value.length * visibleColumns.value.length)

// Calculate scrollbar visibility and thumb positions
const showVerticalScrollbar = computed(() => totalHeight.value > viewportHeight.value)
const showHorizontalScrollbar = computed(() => totalWidth.value > viewportWidth.value)

const verticalThumbHeight = computed(() => {
  if (!showVerticalScrollbar.value) return 0
  const ratio = viewportHeight.value / totalHeight.value
  return Math.max(20, ratio * (viewportHeight.value - (showHorizontalScrollbar.value ? scrollbarSize.value : 0)))
})

const horizontalThumbWidth = computed(() => {
  if (!showHorizontalScrollbar.value) return 0
  const ratio = viewportWidth.value / totalWidth.value
  return Math.max(20, ratio * (viewportWidth.value - (showVerticalScrollbar.value ? scrollbarSize.value : 0)))
})

const verticalThumbTop = computed(() => {
  if (!showVerticalScrollbar.value) return 0
  const maxScroll = Math.max(0, totalHeight.value - viewportHeight.value)
  const scrollRatio = maxScroll > 0 ? scrollTop.value / maxScroll : 0
  const trackHeight = viewportHeight.value - (showHorizontalScrollbar.value ? scrollbarSize.value : 0) - verticalThumbHeight.value
  return scrollRatio * trackHeight
})

const horizontalThumbLeft = computed(() => {
  if (!showHorizontalScrollbar.value) return 0
  const maxScroll = Math.max(0, totalWidth.value - viewportWidth.value)
  const scrollRatio = maxScroll > 0 ? scrollLeft.value / maxScroll : 0
  const trackWidth = viewportWidth.value - (showVerticalScrollbar.value ? scrollbarSize.value : 0) - horizontalThumbWidth.value
  return scrollRatio * trackWidth
})

// Stage configuration
const stageConfig = computed(() => ({
  width: viewportWidth.value,
  height: viewportHeight.value,
  scaleX: viewportScale.value,
  scaleY: viewportScale.value,
  draggable: false
}))

// Advanced memory usage calculations
const memoryMetrics = computed(() => {
  return calculateMemoryUsage({
    totalRows: totalRows.value,
    totalColumns: totalCols.value,
    renderedRows: visibleRows.value.length,
    renderedColumns: visibleColumns.value.length,
    averageTextLength: 15, // Average length of cell text like "R10000C20"
    additionalDataPerCell: 16 // Additional metadata per cell
  })
})

const performanceMetrics = computed(() => {
  return calculatePerformanceMetrics(totalRows.value * totalCols.value, renderedCells.value, scrollSpeed.value)
})

// Lazy loading statistics
const lazyLoadingStats = computed(() => lazyDataManager.getStats())
const cachedCellsCount = computed(() => cellDataCache.size)
const loadingCellsCount = computed(() => loadingCells.size)

// Formatted memory values for display
const dataMemory = computed(() => formatMemory(memoryMetrics.value.totalDataMemory, 2))
const renderedMemory = computed(() => formatMemory(memoryMetrics.value.renderedDataMemory, 4))
const konvaMemory = computed(() => formatMemory(memoryMetrics.value.konvaMemory, 4))
const totalMemory = computed(() => formatMemory(memoryMetrics.value.totalMemory, 2))
const memorySavingsPercentage = computed(() => memoryMetrics.value.memorySavingsPercentage.toFixed(1))

// Performance metrics
const estimatedFPS = computed(() => performanceMetrics.value.estimatedFPS.toFixed(0))
const memoryEfficiency = computed(() => performanceMetrics.value.memoryEfficiency.toFixed(1))
const renderPercentage = computed(() => performanceMetrics.value.renderPercentage.toFixed(2))

// Scroll speed tracking
const scrollSpeed = ref(1)
let lastScrollTime = 0
let lastScrollTop = 0
let scrollSamples: number[] = []
const maxScrollSamples = 10

// Generate cell text with lazy loading
async function getCellText(rowIndex: number, colIndex: number): Promise<string> {
  const cellKey = `${rowIndex}-${colIndex}`

  // Check cache first
  if (cellDataCache.has(cellKey)) {
    return cellDataCache.get(cellKey)!
  }

  // Mark as loading
  if (!loadingCells.has(cellKey)) {
    loadingCells.add(cellKey)

    // Load data asynchronously
    lazyDataManager
      .getCellData(rowIndex, colIndex)
      .then((data) => {
        cellDataCache.set(cellKey, data)
        loadingCells.delete(cellKey)
      })
      .catch(() => {
        loadingCells.delete(cellKey)
      })
  }

  // Return placeholder while loading
  return `R${rowIndex + 1}C${colIndex + 1}`
}

// Get cached cell text for immediate rendering
function getCachedCellText(rowIndex: number, colIndex: number): string {
  const cellKey = `${rowIndex}-${colIndex}`

  if (cellDataCache.has(cellKey)) {
    return cellDataCache.get(cellKey)!
  }

  // If not in cache but loading, show loading indicator
  if (loadingCells.has(cellKey)) {
    return `Loading...`
  }

  // Trigger async load
  getCellText(rowIndex, colIndex)

  // Return placeholder
  return `R${rowIndex + 1}C${colIndex + 1}`
}

// Preload data for visible viewport
async function preloadVisibleData() {
  const startRow = visibleStartRow.value
  const endRow = visibleEndRow.value
  const startCol = visibleStartCol.value
  const endCol = visibleEndCol.value

  await lazyDataManager.preloadViewport(startRow, endRow, startCol, endCol, 1)
}

// Update viewport with lazy loading support
async function updateViewport() {
  // Preload data for the new viewport
  await preloadVisibleData()

  // Clear old cache entries (keep only visible + buffer)
  const keepRows = 2 * overscan.value
  const keepCols = 2 * overscan.value

  const minRow = Math.max(0, visibleStartRow.value - keepRows)
  const maxRow = Math.min(totalRows.value - 1, visibleEndRow.value + keepRows)
  const minCol = Math.max(0, visibleStartCol.value - keepCols)
  const maxCol = Math.min(totalCols.value - 1, visibleEndCol.value + keepCols)

  // Remove cells outside the keep area
  for (const [key] of cellDataCache) {
    const [rowStr, colStr] = key.split('-')
    const row = parseInt(rowStr)
    const col = parseInt(colStr)

    if (row < minRow || row > maxRow || col < minCol || col > maxCol) {
      cellDataCache.delete(key)
    }
  }
}

// Watch for viewport changes to trigger lazy loading
watch(
  [scrollTop, scrollLeft, viewportWidth, viewportHeight],
  () => {
    updateViewport()
  },
  { immediate: true }
)

// Generate sample data
async function generateData() {
  // Data is generated on-demand in getCellText
  await updateViewport()
}

// Clear all cached data
function clearCache() {
  cellDataCache.clear()
  loadingCells.clear()
  lazyDataManager.clearCache()
}

// Reset viewport
function resetViewport() {
  scrollTop.value = 0
  scrollLeft.value = 0
  viewportScale.value = 1
}

// Scroll handlers
function handleContainerWheel(event: WheelEvent) {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()

  // Track scroll speed
  const now = Date.now()
  if (lastScrollTime > 0) {
    const timeDiff = now - lastScrollTime
    const scrollDiff = Math.abs(scrollTop.value - lastScrollTop)
    if (timeDiff > 0 && scrollDiff > 0) {
      const speed = scrollDiff / timeDiff // pixels per millisecond
      scrollSamples.push(speed)
      if (scrollSamples.length > maxScrollSamples) {
        scrollSamples.shift()
      }
      // Calculate average speed
      const avgSpeed = scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length
      scrollSpeed.value = Math.min(10, Math.max(1, avgSpeed * 100)) // Scale to 1-10 range
    }
  }

  lastScrollTime = now
  lastScrollTop = scrollTop.value

  if (event.shiftKey) {
    // Horizontal scroll
    const maxScrollLeft = Math.max(0, totalWidth.value - viewportWidth.value)
    scrollLeft.value = Math.max(0, Math.min(maxScrollLeft, scrollLeft.value + event.deltaY))
    console.log('Horizontal scroll:', { deltaY: event.deltaY, scrollLeft: scrollLeft.value })
  } else if (event.ctrlKey || event.metaKey) {
    // Zoom
    const zoomDelta = -event.deltaY * 0.01
    const newScale = Math.max(0.1, Math.min(3, viewportScale.value + zoomDelta))
    viewportScale.value = newScale
    console.log('Zoom:', { deltaY: event.deltaY, scale: viewportScale.value })
  } else {
    // Vertical scroll
    const maxScrollTop = Math.max(0, totalHeight.value - viewportHeight.value)
    scrollTop.value = Math.max(0, Math.min(maxScrollTop, scrollTop.value + event.deltaY))
    console.log('Vertical scroll:', { deltaY: event.deltaY, scrollTop: scrollTop.value })
  }
}

function handleStageWheel(event: any) {
  // Prevent default on the original event
  event.evt.preventDefault()
  event.evt.stopPropagation()

  // Pass wheel events to container handler
  const wheelEvent = new WheelEvent('wheel', {
    deltaX: event.evt.deltaX,
    deltaY: event.evt.deltaY,
    shiftKey: event.evt.shiftKey,
    ctrlKey: event.evt.ctrlKey,
    metaKey: event.evt.metaKey
  })
  handleContainerWheel(wheelEvent)
}

// Mouse interaction handlers
function handleMouseDown(event: any) {
  // Check if click is in the header area (not draggable)
  const stage = stageRef.value?.getStage()
  if (stage) {
    const pointerPos = stage.getPointerPosition()
    if (pointerPos && pointerPos.y < rowHeight.value) {
      // Click is in header area, don't start dragging
      return
    }
  }

  isDragging.value = true
  dragStartX.value = event.evt.clientX
  dragStartY.value = event.evt.clientY
  dragStartScrollX.value = scrollLeft.value
  dragStartScrollY.value = scrollTop.value
}

function handleMouseMove(event: any) {
  if (!isDragging.value) return

  const deltaX = event.evt.clientX - dragStartX.value
  const deltaY = event.evt.clientY - dragStartY.value

  const maxScrollLeft = Math.max(0, totalWidth.value - viewportWidth.value)
  const maxScrollTop = Math.max(0, totalHeight.value - viewportHeight.value)

  const newScrollLeft = Math.max(0, Math.min(maxScrollLeft, dragStartScrollX.value - deltaX))
  const newScrollTop = Math.max(0, Math.min(maxScrollTop, dragStartScrollY.value - deltaY))

  // Track scroll speed during dragging
  const now = Date.now()
  if (lastScrollTime > 0) {
    const timeDiff = now - lastScrollTime
    const scrollDiff = Math.abs(newScrollTop - lastScrollTop)
    if (timeDiff > 0 && scrollDiff > 0) {
      const speed = scrollDiff / timeDiff
      scrollSamples.push(speed)
      if (scrollSamples.length > maxScrollSamples) {
        scrollSamples.shift()
      }
      const avgSpeed = scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length
      scrollSpeed.value = Math.min(10, Math.max(1, avgSpeed * 100))
    }
  }

  lastScrollTime = now
  lastScrollTop = newScrollTop
  scrollLeft.value = newScrollLeft
  scrollTop.value = newScrollTop
}

function handleMouseUp(event: any) {
  isDragging.value = false
}

function handleMouseLeave(event: any) {
  isDragging.value = false
}

// Scrollbar drag handlers
function handleVerticalThumbDrag(event: any) {
  const thumbY = event.target.y()
  const trackHeight = viewportHeight.value - (showHorizontalScrollbar.value ? scrollbarSize.value : 0) - verticalThumbHeight.value

  if (trackHeight > 0) {
    const scrollRatio = thumbY / trackHeight
    const maxScrollTop = Math.max(0, totalHeight.value - viewportHeight.value)
    const newScrollTop = scrollRatio * maxScrollTop

    // Track scroll speed during thumb drag
    const now = Date.now()
    if (lastScrollTime > 0) {
      const timeDiff = now - lastScrollTime
      const scrollDiff = Math.abs(newScrollTop - lastScrollTop)
      if (timeDiff > 0 && scrollDiff > 0) {
        const speed = scrollDiff / timeDiff
        scrollSamples.push(speed)
        if (scrollSamples.length > maxScrollSamples) {
          scrollSamples.shift()
        }
        const avgSpeed = scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length
        scrollSpeed.value = Math.min(10, Math.max(1, avgSpeed * 100))
      }
    }

    lastScrollTime = now
    lastScrollTop = newScrollTop
    scrollTop.value = newScrollTop
  }
}

function handleHorizontalThumbDrag(event: any) {
  const thumbX = event.target.x()
  const trackWidth = viewportWidth.value - (showVerticalScrollbar.value ? scrollbarSize.value : 0) - horizontalThumbWidth.value

  if (trackWidth > 0) {
    const scrollRatio = thumbX / trackWidth
    const maxScrollLeft = Math.max(0, totalWidth.value - viewportWidth.value)
    const newScrollLeft = scrollRatio * maxScrollLeft

    // Track scroll speed during thumb drag
    const now = Date.now()
    if (lastScrollTime > 0) {
      const timeDiff = now - lastScrollTime
      const scrollDiff = Math.abs(newScrollLeft - scrollLeft.value)
      if (timeDiff > 0 && scrollDiff > 0) {
        const speed = scrollDiff / timeDiff
        scrollSamples.push(speed)
        if (scrollSamples.length > maxScrollSamples) {
          scrollSamples.shift()
        }
        const avgSpeed = scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length
        scrollSpeed.value = Math.min(10, Math.max(1, avgSpeed * 100))
      }
    }

    lastScrollTime = now
    scrollLeft.value = newScrollLeft
  }
}

// Cell interaction handlers
function handleBackgroundClick(event: any) {
  event.evt.preventDefault()
  event.evt.stopPropagation()
  console.log('Background clicked')
}

function handleBackgroundDoubleClick(event: any) {
  event.evt.preventDefault()
  event.evt.stopPropagation()
  console.log('Background double-clicked')
}

function handleCellClick(event: any, rowIndex: number, colIndex: number) {
  event.evt.preventDefault()
  event.evt.stopPropagation()
  console.log('Cell clicked:', { row: rowIndex, col: colIndex })
  // TODO: Implement cell selection
}

function handleCellDoubleClick(event: any, rowIndex: number, colIndex: number) {
  event.evt.preventDefault()
  event.evt.stopPropagation()
  console.log('Cell double-clicked:', { row: rowIndex, col: colIndex })
  // TODO: Implement cell editing
}

// Scroll control functions
function scrollToTop() {
  scrollTop.value = 0
  // Reset scroll speed tracking for sudden jumps
  scrollSamples = []
  scrollSpeed.value = 1
}

function scrollToBottom() {
  const maxScrollTop = Math.max(0, totalHeight.value - viewportHeight.value)
  scrollTop.value = maxScrollTop
  // Reset scroll speed tracking for sudden jumps
  scrollSamples = []
  scrollSpeed.value = 1
}

function scrollToMiddle() {
  const maxScrollTop = Math.max(0, totalHeight.value - viewportHeight.value)
  scrollTop.value = maxScrollTop / 2
  // Reset scroll speed tracking for sudden jumps
  scrollSamples = []
  scrollSpeed.value = 1
}

function scrollToRandom() {
  const maxScrollTop = Math.max(0, totalHeight.value - viewportHeight.value)
  const maxScrollLeft = Math.max(0, totalWidth.value - viewportWidth.value)
  scrollTop.value = Math.floor(Math.random() * maxScrollTop)
  scrollLeft.value = Math.floor(Math.random() * maxScrollLeft)
}

// Zoom control functions
function zoomIn() {
  const newScale = Math.min(3, viewportScale.value + 0.1)
  viewportScale.value = newScale
}

function zoomOut() {
  const newScale = Math.max(0.1, viewportScale.value - 0.1)
  viewportScale.value = newScale
}

function resetZoom() {
  viewportScale.value = 1
}

function updateZoom() {
  // Viewport scale is already bound to the slider via v-model
}

// Initialize
onMounted(() => {
  generateData()

  // Update viewport dimensions based on container
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    viewportWidth.value = rect.width
    viewportHeight.value = rect.height
  }
})

// Watch for changes
watch([totalRows, totalCols], () => {
  generateData()
})

watch([rowHeight, colWidth, overscan], () => {
  updateViewport()
})

// Resize observer for container
const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(() => {
  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === canvasContainer.value) {
        viewportWidth.value = entry.contentRect.width
        viewportHeight.value = entry.contentRect.height
      }
    }
  })

  if (canvasContainer.value) {
    resizeObserver.value.observe(canvasContainer.value)
  }
})

onUnmounted(() => {
  if (canvasContainer.value && resizeObserver.value) {
    resizeObserver.value.unobserve(canvasContainer.value)
  }
})
</script>

<style scoped lang="scss">
.virtual-scroll-demo {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  /* height: 100vh; */
  box-sizing: border-box;
  margin: 0;
}

h1 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin-bottom: 24px;
  font-weight: 500;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: #5a6c7d;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input {
    padding: 8px 12px;
    border: 2px solid #e1e8ed;
    border-radius: 6px;
    width: 100px;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    &:hover {
      border-color: #bdc3c7;
    }
  }
}

.btn-refresh,
.btn-reset {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  align-self: flex-end;
}

.btn-refresh {
  background: #3498db;
  color: white;

  &:hover {
    background: #2980b9;
    transform: translateY(-1px);
  }

  &:active {
    background: #21618c;
    transform: translateY(0);
  }
}

.btn-reset {
  background: #95a5a6;
  color: white;
  margin-left: 8px;

  &:hover {
    background: #7f8c8d;
    transform: translateY(-1px);
  }

  &:active {
    background: #616a6b;
    transform: translateY(0);
  }
}

.demo-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  margin-bottom: 24px;
}

.canvas-section {
  background: white;
  border-radius: 10px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  background: #f8fafc;

  h3 {
    color: #2c3e50;
    margin: 0 0 8px 0;
    font-size: 18px;
  }
}

.viewport-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #7f8c8d;

  span {
    background: #edf2f7;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Monaco', 'Consolas', monospace;
  }
}

.canvas-wrapper {
  height: 600px;
  background: white;
  position: relative;
  cursor: grab;
  overflow: hidden;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-panel,
.controls-panel,
.instructions-panel {
  background: white;
  border-radius: 10px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.stats-panel h3,
.controls-panel h3,
.instructions-panel h3 {
  color: #2c3e50;
  margin: 0 0 16px 0;
  font-size: 18px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.stat-label {
  font-size: 11px;
  color: #5a6c7d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  font-family: 'Monaco', 'Consolas', monospace;
}

.scroll-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.btn-scroll {
  padding: 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;

  &:hover {
    background: #2980b9;
    transform: translateY(-1px);
  }

  &:active {
    background: #21618c;
    transform: translateY(0);
  }
}

.zoom-controls {
  h4 {
    color: #5a6c7d;
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }
}

.zoom-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-zoom {
  padding: 8px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;

  &:hover {
    background: #7f8c8d;
    transform: translateY(-1px);
  }

  &:active {
    background: #616a6b;
    transform: translateY(0);
  }
}

.zoom-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    color: #5a6c7d;
    font-weight: 600;
  }

  input[type='range'] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e1e8ed;
    outline: none;
    -webkit-appearance: none;
    appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      appearance: none;
    }
  }
}

.instructions-panel {
  ul {
    margin: 0;
    padding-left: 20px;
    color: #5a6c7d;

    li {
      margin-bottom: 8px;
      line-height: 1.5;

      strong {
        color: #2c3e50;
      }
    }
  }
}

.performance-tip {
  margin-top: 16px;
  padding: 12px;
  background: #e8f4fc;
  border-radius: 6px;
  border: 1px solid #3498db;
  color: #2c3e50;
  font-size: 13px;
  line-height: 1.5;

  strong {
    color: #2980b9;
  }
}

// Responsive adjustments
@media (max-width: 1200px) {
  .demo-container {
    grid-template-columns: 1fr;
  }

  .canvas-wrapper {
    height: 500px;
  }
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    width: 100%;

    input {
      width: 100%;
    }
  }

  .btn-refresh,
  .btn-reset {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .performance-tip {
    font-size: 12px;
    line-height: 1.4;
  }

  .scroll-controls {
    grid-template-columns: 1fr;
  }

  .zoom-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
