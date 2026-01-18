<template>
  <div class="simple-table-test">
    <h1>Simple Table Layer Test</h1>
    <p class="subtitle">Debugging table layer positioning and rendering</p>

    <div class="controls">
      <div class="control-group">
        <button @click="addSimpleTable" class="btn-add">Add Simple Table</button>
        <button @click="scrollTable" class="btn-scroll">Scroll Table</button>
        <button @click="resetTable" class="btn-reset">Reset Table</button>
        <button @click="logTableState" class="btn-log">Log State</button>
      </div>

      <div class="control-group">
        <label>Scroll Top: {{ scrollTop }}</label>
        <input type="range" v-model.number="scrollTop" min="0" :max="maxScrollTop" @input="updateScroll" />
      </div>

      <div class="control-group">
        <label>Scroll Left: {{ scrollLeft }}</label>
        <input type="range" v-model.number="scrollLeft" min="0" :max="maxScrollLeft" @input="updateScroll" />
      </div>
    </div>

    <div class="canvas-container">
      <div class="canvas-wrapper" ref="canvasContainer">
        <!-- Konva canvas will be mounted here -->
      </div>

      <div class="debug-info">
        <h3>Debug Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Table Position:</span>
            <span class="value">x: {{ tableX }}, y: {{ tableY }}</span>
          </div>
          <div class="info-item">
            <span class="label">Content Position:</span>
            <span class="value">x: {{ contentX }}, y: {{ contentY }}</span>
          </div>
          <div class="info-item">
            <span class="label">Visible Area:</span>
            <span class="value">{{ visibleRows }} rows × {{ visibleCols }} cols</span>
          </div>
          <div class="info-item">
            <span class="label">Total Cells:</span>
            <span class="value">{{ totalRows }} × {{ totalCols }} = {{ totalRows * totalCols }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Konva from 'konva'

// Canvas dimensions
const canvasWidth = 800
const canvasHeight = 600

// Table configuration
const totalRows = 20
const totalCols = 10
const rowHeight = 30
const colWidth = 100
const showHeader = true
const headerHeight = rowHeight

// Scroll state
const scrollTop = ref(0)
const scrollLeft = ref(0)
const maxScrollTop = computed(() => Math.max(0, totalRows * rowHeight - (canvasHeight - (showHeader ? headerHeight : 0))))
const maxScrollLeft = computed(() => Math.max(0, totalCols * colWidth - canvasWidth))

// Refs
const canvasContainer = ref<HTMLElement>()
const stage = ref<Konva.Stage>()
const konvaLayer = ref<Konva.Layer>()
const tableContainer = ref<Konva.Group>()
const contentGroup = ref<Konva.Group>()
const headerGroup = ref<Konva.Group>()

// Debug info
const tableX = ref(0)
const tableY = ref(0)
const contentX = ref(0)
const contentY = ref(0)
const visibleRows = computed(() => Math.min(totalRows, Math.ceil((canvasHeight - (showHeader ? headerHeight : 0)) / rowHeight)))
const visibleCols = computed(() => Math.min(totalCols, Math.ceil(canvasWidth / colWidth)))

// Generate sample data
function generateTableData(): string[][] {
  const data: string[][] = []
  for (let row = 0; row < totalRows; row++) {
    data[row] = []
    for (let col = 0; col < totalCols; col++) {
      data[row][col] = `R${row + 1}C${col + 1}`
    }
  }
  return data
}

// Create a simple table
function createSimpleTable() {
  if (!konvaLayer.value) return

  // Clear existing table
  if (tableContainer.value) {
    tableContainer.value.destroy()
  }

  // Create table container
  tableContainer.value = new Konva.Group({
    x: 50,
    y: 50,
    draggable: true,
    clipX: 0,
    clipY: 0,
    clipWidth: canvasWidth - 100,
    clipHeight: canvasHeight - 100
  })

  // Table background
  const background = new Konva.Rect({
    width: canvasWidth - 100,
    height: canvasHeight - 100,
    fill: '#ffffff',
    stroke: '#ddd',
    strokeWidth: 1,
    cornerRadius: 4
  })

  // Create header if enabled
  if (showHeader) {
    headerGroup.value = createHeader()
    tableContainer.value.add(headerGroup.value)
  }

  // Create content group
  contentGroup.value = new Konva.Group({
    x: 0,
    y: showHeader ? headerHeight : 0
  })

  // Create all cells (for debugging)
  const data = generateTableData()
  createAllCells(contentGroup.value, data)

  // Add elements to container
  tableContainer.value.add(background)
  tableContainer.value.add(contentGroup.value)
  konvaLayer.value.add(tableContainer.value)

  // Update debug info
  updateDebugInfo()
}

// Create header
function createHeader(): Konva.Group {
  const header = new Konva.Group({
    x: 0,
    y: 0
  })

  // Header background
  const headerBg = new Konva.Rect({
    width: totalCols * colWidth,
    height: headerHeight,
    fill: '#f5f5f5',
    stroke: '#ccc',
    strokeWidth: 1
  })

  header.add(headerBg)

  // Column headers
  for (let col = 0; col < totalCols; col++) {
    const headerCell = new Konva.Rect({
      x: col * colWidth,
      y: 0,
      width: colWidth,
      height: headerHeight,
      fill: col % 2 === 0 ? '#e8e8e8' : '#f0f0f0',
      stroke: '#ddd',
      strokeWidth: 0.5
    })

    const headerText = new Konva.Text({
      x: col * colWidth + 5,
      y: headerHeight / 2 - 8,
      text: `Col ${col + 1}`,
      fontSize: 11,
      fontFamily: 'Arial',
      fill: '#333',
      width: colWidth - 10
    })

    header.add(headerCell)
    header.add(headerText)
  }

  return header
}

// Create all cells (for debugging)
function createAllCells(contentGroup: Konva.Group, data: string[][]) {
  for (let row = 0; row < totalRows; row++) {
    // Row background
    const rowBg = new Konva.Rect({
      x: 0,
      y: row * rowHeight,
      width: totalCols * colWidth,
      height: rowHeight,
      fill: row % 2 === 0 ? '#ffffff' : '#f9f9f9',
      stroke: '#eee',
      strokeWidth: 0.5
    })
    contentGroup.add(rowBg)

    // Cells in this row
    for (let col = 0; col < totalCols; col++) {
      // Cell border
      const cell = new Konva.Rect({
        x: col * colWidth,
        y: row * rowHeight,
        width: colWidth,
        height: rowHeight,
        stroke: '#e0e0e0',
        strokeWidth: 0.5
      })

      // Cell text
      const cellText = new Konva.Text({
        x: col * colWidth + 5,
        y: row * rowHeight + rowHeight / 2 - 8,
        text: data[row][col],
        fontSize: 11,
        fontFamily: 'Arial',
        fill: '#444',
        width: colWidth - 10,
        ellipsis: true
      })

      contentGroup.add(cell)
      contentGroup.add(cellText)
    }
  }
}

// Update scroll position
function updateScroll() {
  if (!contentGroup.value || !headerGroup.value) return

  // Update content group position
  contentGroup.value.y(-scrollTop.value)
  contentGroup.value.x(-scrollLeft.value)

  // Update header position for horizontal scrolling
  headerGroup.value.x(-scrollLeft.value)

  // Update debug info
  updateDebugInfo()
}

// Update debug information
function updateDebugInfo() {
  if (tableContainer.value) {
    tableX.value = tableContainer.value.x()
    tableY.value = tableContainer.value.y()
  }

  if (contentGroup.value) {
    contentX.value = contentGroup.value.x()
    contentY.value = contentGroup.value.y()
  }
}

// UI actions
function addSimpleTable() {
  createSimpleTable()
}

function scrollTable() {
  scrollTop.value = Math.random() * maxScrollTop.value
  scrollLeft.value = Math.random() * maxScrollLeft.value
  updateScroll()
}

function resetTable() {
  scrollTop.value = 0
  scrollLeft.value = 0
  updateScroll()
}

function logTableState() {
  console.log('Table State:', {
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value,
    maxScrollTop: maxScrollTop.value,
    maxScrollLeft: maxScrollLeft.value,
    tablePosition: { x: tableX.value, y: tableY.value },
    contentPosition: { x: contentX.value, y: contentY.value },
    visibleRows: visibleRows.value,
    visibleCols: visibleCols.value
  })
}

// Canvas initialization
function initCanvas() {
  if (!canvasContainer.value) return

  // Create stage
  stage.value = new Konva.Stage({
    container: canvasContainer.value as HTMLDivElement,
    width: canvasWidth,
    height: canvasHeight
  })

  // Create main layer
  konvaLayer.value = new Konva.Layer()
  stage.value.add(konvaLayer.value)

  // Add initial table
  createSimpleTable()
}

// Lifecycle
onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (stage.value) {
    stage.value.destroy()
  }
})
</script>

<style scoped lang="scss">
.simple-table-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
}

.subtitle {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 16px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.control-group label {
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
}

.control-group input[type="range"] {
  width: 150px;
}

.btn-add, .btn-scroll, .btn-reset, .btn-log {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-add {
  background: #40c057;
  color: white;
}

.btn-scroll {
  background: #228be6;
  color: white;
}

.btn-reset {
  background: #fab005;
  color: white;
}

.btn-log {
  background: #7950f2;
  color: white;
}

.btn-add:hover, .btn-scroll:hover, .btn-reset:hover, .btn-log:hover {
  transform: translateY(-1px);
}

.btn-add:hover { background: #37b24d; }
.btn-scroll:hover { background: #1c7ed6; }
.btn-reset:hover { background: #f59f00; }
.btn-log:hover { background: #6741d9; }

.canvas-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
}

.canvas-wrapper {
  width: 800px;
  height: 600px;
  background: #f8f9fa;
  border: 2px solid #adb5bd;
  border-radius: 4px;
  overflow: hidden;
}

.debug-info {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 20px;
}

.debug-info h3 {
  margin: 0 0 20px 0;
  color: #343a40;
  font-size: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.info-item .label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.info-item .value {
  font-family: monospace;
  color: #228be6;
  font-size: 14px;
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #dee2e6;
}

@media (max-width: 1200px) {
  .canvas-container {
    grid-template-columns: 1fr;
  }

  .canvas-wrapper {
    width: 100%;
    height: 500px;
  }
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-group input[type="range"] {
    width: 100%;
  }
}
</style>
