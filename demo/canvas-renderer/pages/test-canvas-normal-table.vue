<template>
  <div class="canvas-container">
    <h1>Konva Table Rendering POC</h1>
    <p class="subtitle">Normal Table Demo - No Virtual Scrolling</p>

    <div class="controls">
      <div class="control-group">
        <label for="rowCount">Rows:</label>
        <input id="rowCount" v-model.number="rowCount" type="number" min="1" max="1000" @change="generateSampleData" />
      </div>

      <div class="control-group">
        <label for="colCount">Columns:</label>
        <input id="colCount" v-model.number="colCount" type="number" min="1" max="20" @change="generateSampleData" />
      </div>

      <div class="control-group">
        <label for="cellWidth">Cell Width:</label>
        <input id="cellWidth" v-model.number="cellWidth" type="number" min="50" max="200" @change="renderTable" />
      </div>

      <div class="control-group">
        <label for="cellHeight">Cell Height:</label>
        <input id="cellHeight" v-model.number="cellHeight" type="number" min="30" max="80" @change="renderTable" />
      </div>

      <button @click="generateSampleData" class="btn-refresh">Refresh Data</button>
    </div>

    <div class="canvas-wrapper">
      <v-stage ref="stageRef" :config="stageConfig" @mousedown="handleStageMouseDown" @mousemove="handleStageMouseMove" @mouseup="handleStageMouseUp">
        <v-layer ref="tableLayerRef">
          <!-- Table headers -->
          <v-group v-for="(col, colIndex) in columns" :key="`header-${colIndex}`">
            <v-rect
              :config="{
                x: colIndex * cellWidth,
                y: 0,
                width: cellWidth,
                height: cellHeight,
                fill: '#f0f0f0',
                stroke: '#ddd',
                strokeWidth: 1
              }"
            />
            <v-text
              :config="{
                x: colIndex * cellWidth + 5,
                y: cellHeight / 2 - 8,
                text: col.label,
                fontSize: 14,
                fontFamily: 'Arial',
                fill: '#333',
                align: 'left',
                verticalAlign: 'middle'
              }"
            />
          </v-group>

          <!-- Table data rows -->
          <v-group v-for="(row, rowIndex) in visibleRows" :key="`row-${rowIndex}`">
            <v-group v-for="(col, colIndex) in columns" :key="`cell-${rowIndex}-${colIndex}`">
              <v-rect
                :config="{
                  x: colIndex * cellWidth,
                  y: (rowIndex + 1) * cellHeight,
                  width: cellWidth,
                  height: cellHeight,
                  fill: rowIndex % 2 === 0 ? '#fff' : '#f9f9f9',
                  stroke: '#ddd',
                  strokeWidth: 1
                }"
                @click="handleCellClick(rowIndex, colIndex)"
                @dblclick="handleCellDoubleClick(rowIndex, colIndex)"
              />
              <v-text
                :config="{
                  x: colIndex * cellWidth + 5,
                  y: (rowIndex + 1) * cellHeight + cellHeight / 2 - 8,
                  text: String(row[col.key] || ''),
                  fontSize: 12,
                  fontFamily: 'Arial',
                  fill: '#333',
                  align: 'left',
                  verticalAlign: 'middle',
                  width: cellWidth - 10,
                  ellipsis: true
                }"
              />
            </v-group>
          </v-group>
        </v-layer>

        <!-- Selection rectangle (for future use) -->
        <v-layer v-if="selectionRect.visible">
          <v-rect :config="selectionRect" />
        </v-layer>
      </v-stage>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Total Rows:</span>
        <span class="stat-value">{{ rows.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Columns:</span>
        <span class="stat-value">{{ columns.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Visible Rows:</span>
        <span class="stat-value">{{ visibleRows.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Canvas Size:</span>
        <span class="stat-value">{{ stageConfig.width }} × {{ stageConfig.height }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Data Memory:</span>
        <span class="stat-value">{{ dataMemory }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Rendering Memory:</span>
        <span class="stat-value">{{ renderingMemory }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Memory:</span>
        <span class="stat-value">{{ totalMemory }}</span>
      </div>
    </div>

    <div class="instructions">
      <h3>Instructions:</h3>
      <ul>
        <li>Click on a cell to select it (future feature)</li>
        <li>Double-click on a cell to edit (future feature)</li>
        <li>Use controls above to adjust table parameters</li>
        <li>Scroll with mouse wheel (future feature)</li>
      </ul>
      <div class="memory-info">
        <strong>Memory Information:</strong>
        <ul>
          <li>Total data storage: {{ dataMemory }} for {{ (rowCount * colCount).toLocaleString() }} cells</li>
          <li>Rendering memory: {{ renderingMemory }} for Konva objects</li>
          <li>Each cell uses ~{{ memoryMetrics.bytesPerDataCell.toFixed(0) }} bytes for data</li>
          <li>Each rendered cell uses ~{{ memoryMetrics.bytesPerKonvaObject.toFixed(0) }} bytes for Konva objects</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Stage as VStage, Layer as VLayer, Group as VGroup, Rect as VRect, Text as VText } from 'vue-konva'
import { calculateMemoryUsage, formatMemory } from '../utils/memoryCalculator'

// Stage configuration
const stageConfig = ref({
  width: 800,
  height: 600,
  draggable: false
})

// Table configuration
const rowCount = ref(50)
const colCount = ref(8)
const cellWidth = ref(100)
const cellHeight = ref(40)

// Data structures
interface Column {
  key: string
  label: string
  type: 'text' | 'number' | 'date'
}

interface TableRow {
  [key: string]: string | number | Date
}

const columns = ref<Column[]>([])
const rows = ref<TableRow[]>([])
const visibleRows = ref<TableRow[]>([])

// Selection state
const selectionRect = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  fill: 'rgba(0, 123, 255, 0.2)',
  stroke: '#007bff',
  strokeWidth: 1,
  visible: false
})

// Refs
const stageRef = ref()
const tableLayerRef = ref()

// Memory calculations
const memoryMetrics = computed(() => {
  return calculateMemoryUsage({
    totalRows: rowCount.value,
    totalColumns: colCount.value,
    renderedRows: Math.min(50, rowCount.value), // Show first 50 rows
    renderedColumns: colCount.value,
    averageTextLength: 25, // Average length of cell content
    additionalDataPerCell: 20 // Additional metadata per cell
  })
})

const dataMemory = computed(() => formatMemory(memoryMetrics.value.totalDataMemory, 2))
const renderingMemory = computed(() => formatMemory(memoryMetrics.value.konvaMemory, 2))
const totalMemory = computed(() => formatMemory(memoryMetrics.value.totalMemory, 2))

// Generate sample data
function generateSampleData() {
  // Generate columns
  columns.value = Array.from({ length: colCount.value }, (_, i) => ({
    key: `col${i + 1}`,
    label: `Column ${i + 1}`,
    type: i % 3 === 0 ? 'number' : i % 3 === 1 ? 'date' : 'text'
  }))

  // Generate rows
  rows.value = Array.from({ length: rowCount.value }, (_, rowIndex) => {
    const row: TableRow = {}
    columns.value.forEach((col, colIndex) => {
      switch (col.type) {
        case 'number':
          row[col.key] = rowIndex * 100 + colIndex
          break
        case 'date':
          const date = new Date()
          date.setDate(date.getDate() + rowIndex)
          row[col.key] = date.toISOString().split('T')[0]
          break
        default:
          row[col.key] = `Row ${rowIndex + 1}, Col ${colIndex + 1}`
      }
    })
    return row
  })

  // Update visible rows (initially show all)
  visibleRows.value = rows.value.slice(0, Math.min(50, rows.value.length))

  // Update stage size based on table dimensions
  updateStageSize()
}

// Update stage size based on table dimensions
function updateStageSize() {
  const tableWidth = columns.value.length * cellWidth.value
  const tableHeight = (visibleRows.value.length + 1) * cellHeight.value // +1 for header

  stageConfig.value = {
    ...stageConfig.value,
    width: Math.max(800, tableWidth),
    height: Math.max(600, tableHeight)
  }
}

// Render table (recalculate positions)
function renderTable() {
  updateStageSize()
}

// Event handlers
function handleStageMouseDown(event: any) {
  const pos = event.target.getStage().getPointerPosition()
  selectionRect.value = {
    ...selectionRect.value,
    x: pos.x,
    y: pos.y,
    width: 0,
    height: 0,
    visible: true
  }
}

function handleStageMouseMove(event: any) {
  if (!selectionRect.value.visible) return

  const pos = event.target.getStage().getPointerPosition()
  selectionRect.value = {
    ...selectionRect.value,
    width: pos.x - selectionRect.value.x,
    height: pos.y - selectionRect.value.y
  }
}

function handleStageMouseUp() {
  selectionRect.value.visible = false
}

function handleCellClick(rowIndex: number, colIndex: number) {
  console.log('Cell clicked:', { row: rowIndex, col: colIndex })
  // TODO: Implement cell selection
}

function handleCellDoubleClick(rowIndex: number, colIndex: number) {
  console.log('Cell double-clicked:', { row: rowIndex, col: colIndex })
  // TODO: Implement cell editing
}

// Initialize
onMounted(() => {
  generateSampleData()
})

// Watch for changes
watch([rowCount, colCount], () => {
  generateSampleData()
})

watch([cellWidth, cellHeight], () => {
  renderTable()
})
</script>

<style scoped lang="scss">
.canvas-container {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin-bottom: 24px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    color: #666;
    font-weight: 500;
  }

  input {
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 80px;

    &:focus {
      outline: none;
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }
}

.btn-refresh {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-end;

  &:hover {
    background: #337ecc;
  }

  &:active {
    background: #2c6db2;
  }
}

.canvas-wrapper {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
  background: white;
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.instructions {
  padding: 16px;
  background: #fff3cd;
  border-radius: 8px;
  border: 1px solid #ffeaa7;

  h3 {
    color: #856404;
    margin-bottom: 8px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    color: #856404;

    li {
      margin-bottom: 4px;
    }
  }
}

.memory-info {
  margin-top: 16px;
  padding: 12px;
  background: #e8f4fc;
  border-radius: 6px;
  border: 1px solid #b3d9ff;
  color: #004085;

  strong {
    color: #004085;
    display: block;
    margin-bottom: 8px;
  }

  ul {
    margin: 8px 0 0 0;
    padding-left: 20px;
    color: #004085;

    li {
      margin-bottom: 4px;
      font-size: 14px;
      line-height: 1.4;
    }
  }
}
</style>
