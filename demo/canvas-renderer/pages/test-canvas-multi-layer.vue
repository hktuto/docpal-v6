<template>
  <div class="multi-layer-demo">
    <h1>Multi-Layer Canvas Architecture POC</h1>
    <p class="subtitle">Testing vanilla Konva with composable-based layer management</p>

    <div class="controls">
      <div class="control-group">
        <label for="layerCount">Number of Layers:</label>
        <input id="layerCount" v-model.number="layerCount" type="range" min="1" max="10" @input="updateLayers" />
        <span>{{ layerCount }}</span>
      </div>

      <div class="control-group">
        <button @click="addTableLayer" class="btn-add">Add Table Layer</button>
        <button @click="addRectangleLayer" class="btn-add">Add Rectangle Layer</button>
        <button @click="addTextLayer" class="btn-add">Add Text Layer</button>
      </div>

      <div class="control-group">
        <button @click="toggleRandomLayer" class="btn-toggle">Toggle Random Layer</button>
        <button @click="moveRandomLayer" class="btn-move">Move Random Layer</button>
        <button @click="clearAllLayers" class="btn-clear">Clear All</button>
      </div>
    </div>

    <div class="demo-container">
      <div class="canvas-section">
        <div class="section-header">
          <h3>Multi-Layer Canvas</h3>
          <div class="viewport-info">
            <span>Layers: {{ activeLayers.length }} active</span>
            <span>Nodes: {{ totalNodes }}</span>
          </div>
        </div>

        <div class="canvas-wrapper" ref="canvasContainer">
          <!-- Konva canvas will be mounted here -->
        </div>
      </div>

      <div class="info-section">
        <div class="layers-panel">
          <h3>Active Layers</h3>
          <div class="layers-list">
            <div
              v-for="layer in activeLayers"
              :key="layer.id"
              class="layer-item"
              :class="{ 'layer-hidden': !layer.visible }"
              @click="toggleLayerVisibility(layer.id)"
            >
              <div class="layer-header">
                <span class="layer-type">{{ layer.type }}</span>
                <span class="layer-id">#{{ layer.id.slice(0, 8) }}</span>
                <span class="layer-visibility">{{ layer.visible ? '👁️' : '👁️‍🗨️' }}</span>
              </div>
              <div class="layer-info">
                <span>Z: {{ layer.zIndex }}</span>
                <span>Nodes: {{ layer.nodes.length }}</span>
              </div>
              <div class="layer-actions">
                <button @click.stop="moveLayerUp(layer.id)" class="btn-small">↑</button>
                <button @click.stop="moveLayerDown(layer.id)" class="btn-small">↓</button>
                <button @click.stop="removeLayer(layer.id)" class="btn-small btn-remove">×</button>
              </div>
            </div>
          </div>
        </div>

        <div class="instructions-panel">
          <h3>Instructions</h3>
          <ul>
            <li>Click <strong>Add Table Layer</strong> to create scrollable tables</li>
            <li><strong>Hover over table</strong> to show custom resize handles on edges</li>
            <li>Drag <strong>right edge handle</strong> to resize width</li>
            <li>Drag <strong>bottom edge handle</strong> to resize height</li>
            <li>Drag <strong>corner handle</strong> to resize both dimensions</li>
            <li>Use <strong>mouse wheel</strong> on tables to scroll vertically</li>
            <li>Hold <strong>Shift + wheel</strong> on tables to scroll horizontally</li>
            <li>Drag scrollbar thumbs for precise scrolling</li>
            <li>Drag tables by their container to move them</li>
            <li>Click on layer in list to toggle visibility</li>
            <li>Use ↑↓ buttons to change layer z-index</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Konva from 'konva'

// Types
interface CanvasLayer {
  id: string
  type: 'table' | 'rectangle' | 'text' | 'grid'
  zIndex: number
  visible: boolean
  nodes: Konva.Node[]
  config: any
  scrollState?: {
    scrollX: number
    scrollY: number
    contentWidth: number
    contentHeight: number
  }
}

interface LayerConfig {
  x: number
  y: number
  width: number
  height: number
  color: string
  text?: string
  rows?: number
  cols?: number
}

// Refs
const canvasContainer = ref<HTMLElement>()
const stage = ref<Konva.Stage>()
const konvaLayer = ref<Konva.Layer>()
const layers = ref<Map<string, CanvasLayer>>(new Map())
const layerCount = ref(3)

// Canvas dimensions
const canvasWidth = 800
const canvasHeight = 600

// Computed
const activeLayers = computed(() => {
  return Array.from(layers.value.values()).sort((a, b) => a.zIndex - b.zIndex)
})

const totalNodes = computed(() => {
  let count = 0
  layers.value.forEach((layer) => {
    count += layer.nodes.length
  })
  return count
})

// Layer ID generator
function generateLayerId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Layer renderers
function createTableLayer(config: LayerConfig): Konva.Node[] {
  const rows = config.rows || 10
  const cols = config.cols || 8
  const cellWidth = 100
  const cellHeight = 40
  const contentWidth = cols * cellWidth
  const contentHeight = rows * cellHeight
  
  // Store current dimensions
  let currentWidth = config.width
  let currentHeight = config.height
  
  // Main container group
  const containerGroup = new Konva.Group({
    x: config.x,
    y: config.y,
    draggable: true,
    name: 'tableContainer'
  })

  // Table background
  const background = new Konva.Rect({
    width: config.width,
    height: config.height,
    fill: config.color || '#ffffff',
    stroke: '#409eff',
    strokeWidth: 2,
    cornerRadius: 4,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.5
  })

  // Create clipping group for scrollable content
  const clipGroup = new Konva.Group({
    clipFunc: (ctx) => {
      ctx.rect(0, 0, config.width, config.height)
    }
  })

  // Content group (this will move for scrolling)
  const contentGroup = new Konva.Group({
    x: 0,
    y: 0
  })

  // Draw grid lines and cells
  for (let i = 0; i <= rows; i++) {
    const line = new Konva.Line({
      points: [0, i * cellHeight, contentWidth, i * cellHeight],
      stroke: i === 0 ? '#409eff' : '#e0e0e0',
      strokeWidth: i === 0 ? 2 : 1
    })
    contentGroup.add(line)
  }

  for (let j = 0; j <= cols; j++) {
    const line = new Konva.Line({
      points: [j * cellWidth, 0, j * cellWidth, contentHeight],
      stroke: j === 0 ? '#409eff' : '#e0e0e0',
      strokeWidth: j === 0 ? 2 : 1
    })
    contentGroup.add(line)
  }

  // Add header row with different styling
  for (let j = 0; j < cols; j++) {
    const headerBg = new Konva.Rect({
      x: j * cellWidth,
      y: 0,
      width: cellWidth,
      height: cellHeight,
      fill: '#f0f7ff',
      stroke: '#409eff',
      strokeWidth: 1
    })
    contentGroup.add(headerBg)

    const headerText = new Konva.Text({
      x: j * cellWidth + 5,
      y: cellHeight / 2,
      text: `Col ${j + 1}`,
      fontSize: 12,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: '#409eff',
      verticalAlign: 'middle'
    })
    contentGroup.add(headerText)
  }

  // Add data cells
  for (let i = 1; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const text = new Konva.Text({
        x: j * cellWidth + 5,
        y: i * cellHeight + 5,
        text: `R${i}C${j + 1}`,
        fontSize: 11,
        fontFamily: 'Arial',
        fill: '#333',
        width: cellWidth - 10,
        height: cellHeight - 10,
        align: 'left',
        verticalAlign: 'top'
      })
      contentGroup.add(text)
    }
  }

  // Scrollbars
  const scrollbarWidth = 12
  const scrollbarColor = '#409eff'
  const scrollbarBgColor = '#f0f0f0'

  // Vertical scrollbar background
  const vScrollBg = new Konva.Rect({
    x: currentWidth - scrollbarWidth,
    y: 0,
    width: scrollbarWidth,
    height: currentHeight,
    fill: scrollbarBgColor,
    cornerRadius: 4,
    name: 'vScrollBg'
  })

  // Vertical scrollbar thumb
  let vScrollHeight = Math.min(currentHeight, (currentHeight / contentHeight) * currentHeight)
  const vScrollThumb = new Konva.Rect({
    x: currentWidth - scrollbarWidth,
    y: 0,
    width: scrollbarWidth,
    height: vScrollHeight,
    fill: scrollbarColor,
    cornerRadius: 4,
    opacity: 0.7,
    name: 'vScrollThumb'
  })

  // Horizontal scrollbar background
  const hScrollBg = new Konva.Rect({
    x: 0,
    y: currentHeight - scrollbarWidth,
    width: currentWidth - scrollbarWidth,
    height: scrollbarWidth,
    fill: scrollbarBgColor,
    cornerRadius: 4,
    name: 'hScrollBg'
  })

  // Horizontal scrollbar thumb
  let hScrollWidth = Math.min(currentWidth, (currentWidth / contentWidth) * currentWidth)
  const hScrollThumb = new Konva.Rect({
    x: 0,
    y: currentHeight - scrollbarWidth,
    width: hScrollWidth,
    height: scrollbarWidth,
    fill: scrollbarColor,
    cornerRadius: 4,
    opacity: 0.7,
    name: 'hScrollThumb'
  })

  // Custom resize handles
  const handleSize = 8
  const handleColor = '#409eff'
  const handleHoverColor = '#1c7ed6'

  // Right edge resize handle
  const rightHandle = new Konva.Rect({
    x: currentWidth - handleSize / 2,
    y: currentHeight / 2 - 20,
    width: handleSize,
    height: 40,
    fill: handleColor,
    cornerRadius: handleSize / 2,
    opacity: 0,
    name: 'rightHandle',
    draggable: true,
    dragBoundFunc: function (pos) {
      return {
        x: pos.x,
        y: this.absolutePosition().y
      }
    }
  })

  // Bottom edge resize handle
  const bottomHandle = new Konva.Rect({
    x: currentWidth / 2 - 20,
    y: currentHeight - handleSize / 2,
    width: 40,
    height: handleSize,
    fill: handleColor,
    cornerRadius: handleSize / 2,
    opacity: 0,
    name: 'bottomHandle',
    draggable: true,
    dragBoundFunc: function (pos) {
      return {
        x: this.absolutePosition().x,
        y: pos.y
      }
    }
  })

  // Corner resize handle (bottom-right)
  const cornerHandle = new Konva.Circle({
    x: currentWidth,
    y: currentHeight,
    radius: handleSize,
    fill: handleColor,
    opacity: 0,
    name: 'cornerHandle',
    draggable: true
  })

  clipGroup.add(contentGroup)
  containerGroup.add(background)
  containerGroup.add(clipGroup)
  containerGroup.add(vScrollBg)
  containerGroup.add(vScrollThumb)
  containerGroup.add(hScrollBg)
  containerGroup.add(hScrollThumb)
  containerGroup.add(rightHandle)
  containerGroup.add(bottomHandle)
  containerGroup.add(cornerHandle)

  // Scrolling logic
  let scrollY = 0
  let scrollX = 0
  let maxScrollY = Math.max(0, contentHeight - currentHeight)
  let maxScrollX = Math.max(0, contentWidth - currentWidth)

  function updateScrollbars() {
    // Recalculate scroll thumb sizes
    vScrollHeight = Math.min(currentHeight, (currentHeight / contentHeight) * currentHeight)
    hScrollWidth = Math.min(currentWidth - scrollbarWidth, (currentWidth / contentWidth) * currentWidth)

    // Update scrollbar sizes and positions
    vScrollBg.height(currentHeight)
    vScrollBg.x(currentWidth - scrollbarWidth)
    vScrollThumb.height(vScrollHeight)
    vScrollThumb.x(currentWidth - scrollbarWidth)

    hScrollBg.width(currentWidth - scrollbarWidth)
    hScrollBg.y(currentHeight - scrollbarWidth)
    hScrollThumb.width(hScrollWidth)
    hScrollThumb.y(currentHeight - scrollbarWidth)

    // Update vertical scrollbar position
    const vScrollRange = currentHeight - vScrollHeight
    const vScrollPos = maxScrollY > 0 ? (scrollY / maxScrollY) * vScrollRange : 0
    vScrollThumb.y(vScrollPos)

    // Update horizontal scrollbar position
    const hScrollRange = currentWidth - hScrollWidth - scrollbarWidth
    const hScrollPos = maxScrollX > 0 ? (scrollX / maxScrollX) * hScrollRange : 0
    hScrollThumb.x(hScrollPos)

    // Update content position
    contentGroup.y(-scrollY)
    contentGroup.x(-scrollX)

    // Update resize handles positions
    rightHandle.x(currentWidth - handleSize / 2)
    rightHandle.y(currentHeight / 2 - 20)
    
    bottomHandle.x(currentWidth / 2 - 20)
    bottomHandle.y(currentHeight - handleSize / 2)
    
    cornerHandle.x(currentWidth)
    cornerHandle.y(currentHeight)
  }

  function updateTableSize(newWidth: number, newHeight: number) {
    // Minimum size constraints
    currentWidth = Math.max(200, newWidth)
    currentHeight = Math.max(150, newHeight)

    // Update background size
    background.width(currentWidth)
    background.height(currentHeight)

    // Update clip function
    clipGroup.clipFunc((ctx) => {
      ctx.rect(0, 0, currentWidth, currentHeight)
    })

    // Constrain scroll positions
    maxScrollY = Math.max(0, contentHeight - currentHeight)
    maxScrollX = Math.max(0, contentWidth - currentWidth)
    scrollY = Math.min(scrollY, maxScrollY)
    scrollX = Math.min(scrollX, maxScrollX)

    updateScrollbars()
  }

  // Mouse wheel scrolling
  containerGroup.on('wheel', (e) => {
    e.evt.preventDefault()
    
    const delta = e.evt.deltaY
    
    if (e.evt.shiftKey) {
      // Horizontal scroll with shift key
      scrollX = Math.max(0, Math.min(maxScrollX, scrollX + delta))
    } else {
      // Vertical scroll
      scrollY = Math.max(0, Math.min(maxScrollY, scrollY + delta))
    }
    
    updateScrollbars()
  })

  // Drag vertical scrollbar thumb
  let isDraggingVScroll = false
  vScrollThumb.on('mousedown touchstart', (e) => {
    isDraggingVScroll = true
    e.cancelBubble = true
  })

  vScrollThumb.on('mousemove touchmove', (e) => {
    if (!isDraggingVScroll) return
    
    const pos = konvaLayer.value?.getRelativePointerPosition()
    if (!pos) return
    
    const localY = pos.y - containerGroup.y()
    const scrollRatio = localY / (config.height - vScrollHeight)
    scrollY = Math.max(0, Math.min(maxScrollY, scrollRatio * maxScrollY))
    updateScrollbars()
  })

  // Drag horizontal scrollbar thumb
  let isDraggingHScroll = false
  hScrollThumb.on('mousedown touchstart', (e) => {
    isDraggingHScroll = true
    e.cancelBubble = true
  })

  hScrollThumb.on('mousemove touchmove', (e) => {
    if (!isDraggingHScroll) return
    
    const pos = konvaLayer.value?.getRelativePointerPosition()
    if (!pos) return
    
    const localX = pos.x - containerGroup.x()
    const scrollRatio = localX / (config.width - hScrollWidth - scrollbarWidth)
    scrollX = Math.max(0, Math.min(maxScrollX, scrollRatio * maxScrollX))
    updateScrollbars()
  })

  // Stop dragging on mouseup
  containerGroup.on('mouseup touchend', () => {
    isDraggingVScroll = false
    isDraggingHScroll = false
  })

  // Hover effects for scrollbars
  vScrollThumb.on('mouseenter', () => {
    vScrollThumb.opacity(1)
  })
  vScrollThumb.on('mouseleave', () => {
    vScrollThumb.opacity(0.7)
  })

  hScrollThumb.on('mouseenter', () => {
    hScrollThumb.opacity(1)
  })
  hScrollThumb.on('mouseleave', () => {
    hScrollThumb.opacity(0.7)
  })

  // Show/hide resize handles on hover
  containerGroup.on('mouseenter', () => {
    rightHandle.opacity(0.8)
    bottomHandle.opacity(0.8)
    cornerHandle.opacity(0.8)
  })

  containerGroup.on('mouseleave', () => {
    if (!rightHandle.isDragging() && !bottomHandle.isDragging() && !cornerHandle.isDragging()) {
      rightHandle.opacity(0)
      bottomHandle.opacity(0)
      cornerHandle.opacity(0)
    }
  })

  // Right handle resize
  let startWidth = currentWidth
  rightHandle.on('dragstart', (e) => {
    e.cancelBubble = true
    containerGroup.draggable(false)
    startWidth = currentWidth
    rightHandle.opacity(1)
  })

  rightHandle.on('dragmove', (e) => {
    e.cancelBubble = true
    const localPos = containerGroup.getRelativePointerPosition()
    if (localPos) {
      updateTableSize(localPos.x, currentHeight)
    }
  })

  rightHandle.on('dragend', (e) => {
    e.cancelBubble = true
    containerGroup.draggable(true)
  })

  rightHandle.on('mouseenter', () => {
    rightHandle.fill(handleHoverColor)
    rightHandle.opacity(1)
    document.body.style.cursor = 'ew-resize'
  })

  rightHandle.on('mouseleave', () => {
    rightHandle.fill(handleColor)
    if (!rightHandle.isDragging()) {
      rightHandle.opacity(0.8)
    }
    document.body.style.cursor = 'default'
  })

  // Bottom handle resize
  let startHeight = currentHeight
  bottomHandle.on('dragstart', (e) => {
    e.cancelBubble = true
    containerGroup.draggable(false)
    startHeight = currentHeight
    bottomHandle.opacity(1)
  })

  bottomHandle.on('dragmove', (e) => {
    e.cancelBubble = true
    const localPos = containerGroup.getRelativePointerPosition()
    if (localPos) {
      updateTableSize(currentWidth, localPos.y)
    }
  })

  bottomHandle.on('dragend', (e) => {
    e.cancelBubble = true
    containerGroup.draggable(true)
  })

  bottomHandle.on('mouseenter', () => {
    bottomHandle.fill(handleHoverColor)
    bottomHandle.opacity(1)
    document.body.style.cursor = 'ns-resize'
  })

  bottomHandle.on('mouseleave', () => {
    bottomHandle.fill(handleColor)
    if (!bottomHandle.isDragging()) {
      bottomHandle.opacity(0.8)
    }
    document.body.style.cursor = 'default'
  })

  // Corner handle resize (both width and height)
  cornerHandle.on('dragstart', (e) => {
    e.cancelBubble = true
    containerGroup.draggable(false)
    startWidth = currentWidth
    startHeight = currentHeight
    cornerHandle.opacity(1)
  })

  cornerHandle.on('dragmove', (e) => {
    e.cancelBubble = true
    const localPos = containerGroup.getRelativePointerPosition()
    if (localPos) {
      updateTableSize(localPos.x, localPos.y)
    }
  })

  cornerHandle.on('dragend', (e) => {
    e.cancelBubble = true
    containerGroup.draggable(true)
  })

  cornerHandle.on('mouseenter', () => {
    cornerHandle.fill(handleHoverColor)
    cornerHandle.opacity(1)
    document.body.style.cursor = 'nwse-resize'
  })

  cornerHandle.on('mouseleave', () => {
    cornerHandle.fill(handleColor)
    if (!cornerHandle.isDragging()) {
      cornerHandle.opacity(0.8)
    }
    document.body.style.cursor = 'default'
  })

  return [containerGroup]
}

function createRectangleLayer(config: LayerConfig): Konva.Node[] {
  const rect = new Konva.Rect({
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    fill: config.color || '#4CAF50',
    stroke: '#2E7D32',
    strokeWidth: 2,
    cornerRadius: 8,
    shadowColor: 'black',
    shadowBlur: 5,
    shadowOffset: { x: 2, y: 2 },
    shadowOpacity: 0.2
  })

  return [rect]
}

function createTextLayer(config: LayerConfig): Konva.Node[] {
  const text = new Konva.Text({
    x: config.x,
    y: config.y,
    text: config.text || 'Sample Text',
    fontSize: 24,
    fontFamily: 'Arial',
    fill: config.color || '#2196F3',
    width: config.width
  })

  const background = new Konva.Rect({
    x: config.x - 10,
    y: config.y - 10,
    width: text.width() + 20,
    height: text.height() + 20,
    fill: 'rgba(255, 255, 255, 0.9)',
    stroke: '#ddd',
    strokeWidth: 1,
    cornerRadius: 4
  })

  return [background, text]
}

function createGridLayer(config: LayerConfig): Konva.Node[] {
  const group = new Konva.Group({
    x: config.x,
    y: config.y
  })

  const gridSize = 50
  const gridWidth = config.width
  const gridHeight = config.height

  // Draw grid lines
  for (let x = 0; x <= gridWidth; x += gridSize) {
    const line = new Konva.Line({
      points: [x, 0, x, gridHeight],
      stroke: x % 100 === 0 ? '#ccc' : '#eee',
      strokeWidth: x % 100 === 0 ? 1 : 0.5
    })
    group.add(line)
  }

  for (let y = 0; y <= gridHeight; y += gridSize) {
    const line = new Konva.Line({
      points: [0, y, gridWidth, y],
      stroke: y % 100 === 0 ? '#ccc' : '#eee',
      strokeWidth: y % 100 === 0 ? 1 : 0.5
    })
    group.add(line)
  }

  return [group]
}

// Layer management
function addLayer(type: CanvasLayer['type'], config?: Partial<LayerConfig>) {
  const defaultConfig: LayerConfig = {
    x: Math.random() * (canvasWidth - 300),
    y: Math.random() * (canvasHeight - 200),
    width: 300,
    height: 200,
    color: `hsl(${Math.random() * 360}, 70%, 80%)`,
    rows: type === 'table' ? 15 : 5,
    cols: type === 'table' ? 8 : 5
  }

  const layerConfig = { ...defaultConfig, ...config }
  const layerId = generateLayerId(type)

  let nodes: Konva.Node[] = []

  switch (type) {
    case 'table':
      nodes = createTableLayer(layerConfig)
      break
    case 'rectangle':
      nodes = createRectangleLayer(layerConfig)
      break
    case 'text':
      nodes = createTextLayer(layerConfig)
      break
    case 'grid':
      nodes = createGridLayer(layerConfig)
      break
  }

  const layer: CanvasLayer = {
    id: layerId,
    type,
    zIndex: layers.value.size,
    visible: true,
    nodes,
    config: layerConfig
  }

  // Add nodes to Konva layer
  nodes.forEach((node: any) => {
    konvaLayer.value?.add(node)
  })

  layers.value.set(layerId, layer)
  updateLayerDrawingOrder()
}

function removeLayer(layerId: string) {
  const layer = layers.value.get(layerId)
  if (layer) {
    // Remove nodes from Konva layer
    layer.nodes.forEach((node) => {
      node.destroy()
    })
    layers.value.delete(layerId)
    updateLayerDrawingOrder()
  }
}

function toggleLayerVisibility(layerId: string) {
  const layer = layers.value.get(layerId)
  if (layer) {
    layer.visible = !layer.visible
    layer.nodes.forEach((node) => {
      node.visible(layer.visible)
    })
  }
}

function moveLayerUp(layerId: string) {
  const layer = layers.value.get(layerId)
  if (layer && layer.zIndex < layers.value.size - 1) {
    layer.zIndex++
    updateLayerDrawingOrder()
  }
}

function moveLayerDown(layerId: string) {
  const layer = layers.value.get(layerId)
  if (layer && layer.zIndex > 0) {
    layer.zIndex--
    updateLayerDrawingOrder()
  }
}

function updateLayerDrawingOrder() {
  // Sort layers by zIndex and update node z-index
  const sortedLayers = Array.from(layers.value.values()).sort((a, b) => a.zIndex - b.zIndex)

  sortedLayers.forEach((layer, index) => {
    layer.zIndex = index
    layer.nodes.forEach((node) => {
      node.zIndex(index)
    })
  })
}

// UI actions
function addTableLayer() {
  addLayer('table', {
    text: `Table ${layers.value.size + 1}`
  })
}

function addRectangleLayer() {
  addLayer('rectangle', {
    color: `hsl(${Math.random() * 360}, 70%, 70%)`
  })
}

function addTextLayer() {
  addLayer('text', {
    text: `Layer ${layers.value.size + 1}`,
    color: `hsl(${Math.random() * 360}, 70%, 40%)`
  })
}

function toggleRandomLayer() {
  const layerIds = Array.from(layers.value.keys())
  if (layerIds.length > 0) {
    const randomId = layerIds[Math.floor(Math.random() * layerIds.length)]
    toggleLayerVisibility(randomId)
  }
}

function moveRandomLayer() {
  const layerIds = Array.from(layers.value.keys())
  if (layerIds.length > 0) {
    const randomId = layerIds[Math.floor(Math.random() * layerIds.length)]
    const layer = layers.value.get(randomId)
    if (layer) {
      layer.nodes.forEach((node) => {
        node.x(node.x() + (Math.random() * 40 - 20))
        node.y(node.y() + (Math.random() * 40 - 20))
      })
    }
  }
}

function clearAllLayers() {
  layers.value.forEach((layer) => {
    layer.nodes.forEach((node) => {
      node.destroy()
    })
  })
  layers.value.clear()
}

function updateLayers() {
  const currentCount = layers.value.size
  const targetCount = layerCount.value

  if (targetCount > currentCount) {
    // Add layers
    for (let i = currentCount; i < targetCount; i++) {
      const types: CanvasLayer['type'][] = ['table', 'rectangle', 'text', 'grid']
      const type = types[i % types.length]
      addLayer(type)
    }
  } else if (targetCount < currentCount) {
    // Remove layers
    const layerIds = Array.from(layers.value.keys())
    for (let i = currentCount - 1; i >= targetCount; i--) {
      removeLayer(layerIds[i])
    }
  }
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

  // Create main Konva layer
  konvaLayer.value = new Konva.Layer()
  stage.value.add(konvaLayer.value)

  // Add initial layers
  for (let i = 0; i < layerCount.value; i++) {
    const types: CanvasLayer['type'][] = ['table', 'rectangle', 'text', 'grid']
    const type = types[i % types.length]
    addLayer(type, {
      x: 50 + i * 30,
      y: 50 + i * 30
    })
  }

  // Background layer for better interaction
  const backgroundRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    fill: 'transparent',
    listening: true
  })
  konvaLayer.value?.add(backgroundRect)
  backgroundRect.moveToBottom()

  // Zoom with wheel (only when not over a table)
  stage.value.on('wheel', (e) => {
    // Check if we're over a table (tables handle their own wheel events)
    const target = e.target
    const isOverTable = target.getParent()?.getClassName() === 'Group' || 
                        target.getClassName() === 'Group'
    
    if (isOverTable) {
      // Let the table handle the wheel event for scrolling
      return
    }

    e.evt.preventDefault()

    const scaleBy = 1.1
    const oldScale = stage.value?.scaleX() || 1
    const pointer = stage.value?.getPointerPosition()

    if (!pointer || !stage.value) return

    const mousePointTo = {
      x: (pointer.x - stage.value.x()) / oldScale,
      y: (pointer.y - stage.value.y()) / oldScale
    }

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

    stage.value.scale({ x: newScale, y: newScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    }

    stage.value.position(newPos)
  })
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
.multi-layer-demo {
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

.control-group input[type='range'] {
  width: 150px;
}

.control-group span {
  font-weight: 600;
  color: #228be6;
  min-width: 20px;
  text-align: center;
}

.btn-add,
.btn-toggle,
.btn-move,
.btn-clear {
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

.btn-add:hover {
  background: #37b24d;
  transform: translateY(-1px);
}

.btn-add:active {
  transform: translateY(0);
}

.btn-toggle {
  background: #228be6;
  color: white;
}

.btn-toggle:hover {
  background: #1c7ed6;
  transform: translateY(-1px);
}

.btn-move {
  background: #fab005;
  color: white;
}

.btn-move:hover {
  background: #f59f00;
  transform: translateY(-1px);
}

.btn-clear {
  background: #fa5252;
  color: white;
}

.btn-clear:hover {
  background: #e03131;
  transform: translateY(-1px);
}

.demo-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
}

.canvas-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.section-header {
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  color: #343a40;
  font-size: 18px;
}

.viewport-info {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #495057;
}

.viewport-info span {
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.canvas-wrapper {
  width: 800px;
  height: 600px;
  background: #f8f9fa;
  border: 2px dashed #adb5bd;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.layers-panel,
.instructions-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.layers-panel h3,
.instructions-panel h3 {
  margin: 0;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #343a40;
  font-size: 16px;
}

.layers-list {
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.layer-item {
  padding: 12px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layer-item:hover {
  background: #e9ecef;
  border-color: #ced4da;
  transform: translateX(2px);
}

.layer-item.layer-hidden {
  opacity: 0.6;
  background: #f1f3f5;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.layer-type {
  font-weight: 600;
  color: #228be6;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.layer-id {
  font-family: monospace;
  font-size: 11px;
  color: #868e96;
  background: #f1f3f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.layer-visibility {
  font-size: 14px;
}

.layer-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #495057;
  margin-bottom: 8px;
}

.layer-info span {
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #dee2e6;
}

.layer-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}

.btn-small {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: #e9ecef;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-small:hover {
  background: #dee2e6;
  transform: translateY(-1px);
}

.btn-small.btn-remove {
  background: #ffe3e3;
  color: #fa5252;
}

.btn-small.btn-remove:hover {
  background: #ffc9c9;
}

.instructions-panel ul {
  margin: 0;
  padding: 15px 20px 15px 35px;
  list-style-type: none;
}

.instructions-panel li {
  margin-bottom: 10px;
  color: #495057;
  line-height: 1.5;
  position: relative;
}

.instructions-panel li:before {
  content: '•';
  color: #228be6;
  font-weight: bold;
  position: absolute;
  left: -15px;
}

.instructions-panel strong {
  color: #343a40;
}

@media (max-width: 1200px) {
  .demo-container {
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

  .control-group input[type='range'] {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .viewport-info {
    width: 100%;
    justify-content: space-between;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}
</style>
