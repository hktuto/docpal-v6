// ui_v6\demo\canvas-renderer\composables\canvas\useCanvas.ts

import { ref, onUnmounted } from 'vue'
import Konva from 'konva'

export interface CanvasLayer {
  id: string
  type: string
  zIndex: number
  visible: boolean
  nodes: Konva.Shape[]
  config: any
}

export interface CanvasOptions {
  width: number
  height: number
  container: HTMLElement
  backgroundColor?: string
  draggable?: boolean
}

export interface CanvasManager {
  stage: Konva.Stage
  layers: Map<string, CanvasLayer>
  addLayer: (type: string, config?: any) => string
  removeLayer: (layerId: string) => void
  updateLayer: (layerId: string, updates: Partial<CanvasLayer>) => void
  getLayer: (layerId: string) => CanvasLayer | undefined
  getAllLayers: () => CanvasLayer[]
  clear: () => void
  destroy: () => void
}

/**
 * Composable for managing Konva canvas with multiple layers
 */
export function useCanvas(options: CanvasOptions) {
  const stage = ref<Konva.Stage>()
  const layers = ref<Map<string, CanvasLayer>>(new Map())
  const isInitialized = ref(false)

  // Initialize canvas
  function init() {
    if (isInitialized.value) return

    // Create Konva stage
    stage.value = new Konva.Stage({
      container: options.container,
      width: options.width,
      height: options.height
    })

    // Set background if provided
    if (options.backgroundColor) {
      const backgroundLayer = new Konva.Layer()
      const background = new Konva.Rect({
        width: options.width,
        height: options.height,
        fill: options.backgroundColor
      })
      backgroundLayer.add(background)
      stage.value.add(backgroundLayer)
    }

    // Enable dragging if specified
    if (options.draggable) {
      setupDragging()
    }

    isInitialized.value = true
  }

  // Add a new layer to the canvas
  function addLayer(type: string, config?: any): string {
    if (!stage.value) {
      throw new Error('Canvas not initialized. Call init() first.')
    }

    const layerId = generateLayerId(type)
    const layerConfig = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      color: '#ffffff',
      ...config
    }

    // Create Konva layer
    const konvaLayer = new Konva.Layer()
    stage.value.add(konvaLayer)

    // Create layer nodes based on type
    const nodes = createLayerNodes(type, layerConfig, konvaLayer)

    const layer: CanvasLayer = {
      id: layerId,
      type,
      zIndex: layers.value.size,
      visible: true,
      nodes,
      config: layerConfig
    }

    layers.value.set(layerId, layer)
    updateLayerOrder()

    return layerId
  }

  // Remove a layer from the canvas
  function removeLayer(layerId: string) {
    const layer = layers.value.get(layerId)
    if (layer) {
      // Destroy all nodes
      layer.nodes.forEach(node => {
        node.destroy()
      })
      layers.value.delete(layerId)
      updateLayerOrder()
    }
  }

  // Update layer properties
  function updateLayer(layerId: string, updates: Partial<CanvasLayer>) {
    const layer = layers.value.get(layerId)
    if (layer) {
      Object.assign(layer, updates)

      // Update visibility
      if (updates.visible !== undefined) {
        layer.nodes.forEach(node => {
          node.visible(updates.visible!)
        })
      }

      // Update z-index if changed
      if (updates.zIndex !== undefined) {
        updateLayerOrder()
      }
    }
  }

  // Get a layer by ID
  function getLayer(layerId: string): CanvasLayer | undefined {
    return layers.value.get(layerId)
  }

  // Get all layers sorted by z-index
  function getAllLayers(): CanvasLayer[] {
    return Array.from(layers.value.values())
      .sort((a, b) => a.zIndex - b.zIndex)
  }

  // Clear all layers
  function clear() {
    layers.value.forEach(layer => {
      layer.nodes.forEach(node => {
        node.destroy()
      })
    })
    layers.value.clear()
  }

  // Update layer drawing order
  function updateLayerOrder() {
    const sortedLayers = getAllLayers()

    sortedLayers.forEach((layer, index) => {
      layer.zIndex = index
      layer.nodes.forEach(node => {
        node.zIndex(index)
      })
    })
  }

  // Create layer nodes based on type
  function createLayerNodes(type: string, config: any, konvaLayer: Konva.Layer): Konva.Shape[] {
    const nodes: Konva.Shape[] = []

    switch (type) {
      case 'rectangle':
        const rect = new Konva.Rect({
          x: config.x,
          y: config.y,
          width: config.width,
          height: config.height,
          fill: config.color,
          stroke: '#333',
          strokeWidth: 1
        })
        nodes.push(rect)
        konvaLayer.add(rect)
        break

      case 'text':
        const text = new Konva.Text({
          x: config.x,
          y: config.y,
          text: config.text || 'Sample Text',
          fontSize: config.fontSize || 16,
          fontFamily: config.fontFamily || 'Arial',
          fill: config.color || '#333'
        })
        nodes.push(text)
        konvaLayer.add(text)
        break

      case 'circle':
        const circle = new Konva.Circle({
          x: config.x,
          y: config.y,
          radius: config.radius || 50,
          fill: config.color,
          stroke: '#333',
          strokeWidth: 1
        })
        nodes.push(circle)
        konvaLayer.add(circle)
        break

      default:
        console.warn(`Unknown layer type: ${type}`)
    }

    return nodes
  }

  // Generate unique layer ID
  function generateLayerId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Setup dragging for the canvas
  function setupDragging() {
    if (!stage.value) return

    let isDragging = false
    let lastPointerPosition: { x: number; y: number } | null = null

    stage.value.on('mousedown touchstart', () => {
      isDragging = true
      lastPointerPosition = stage.value!.getPointerPosition()
    })

    stage.value.on('mouseup touchend', () => {
      isDragging = false
      lastPointerPosition = null
    })

    stage.value.on('mousemove touchmove', () => {
      if (!isDragging || !lastPointerPosition || !stage.value) return

      const pos = stage.value.getPointerPosition()
      if (!pos) return

      const dx = pos.x - lastPointerPosition.x
      const dy = pos.y - lastPointerPosition.y

      // Move all layers
      layers.value.forEach(layer => {
        layer.nodes.forEach(node => {
          node.x(node.x() + dx)
          node.y(node.y() + dy)
        })
      })

      lastPointerPosition = pos
    })
  }

  // Setup zoom with mouse wheel
  function setupZoom() {
    if (!stage.value) return

    stage.value.on('wheel', (e) => {
      e.evt.preventDefault()

      const scaleBy = 1.1
      const oldScale = stage.value!.scaleX()
      const pointer = stage.value!.getPointerPosition()

      if (!pointer) return

      const mousePointTo = {
        x: (pointer.x - stage.value!.x()) / oldScale,
        y: (pointer.y - stage.value!.y()) / oldScale
      }

      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

      stage.value!.scale({ x: newScale, y: newScale })

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
      }

      stage.value!.position(newPos)
    })
  }

  // Destroy canvas and clean up
  function destroy() {
    clear()
    if (stage.value) {
      stage.value.destroy()
    }
    isInitialized.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    destroy()
  })

  // Return public API
  return {
    // State
    stage,
    layers,
    isInitialized,

    // Methods
    init,
    addLayer,
    removeLayer,
    updateLayer,
    getLayer,
    getAllLayers,
    clear,
    destroy,
    setupZoom
  }
}

/**
 * Helper to create a canvas manager instance
 */
export function createCanvasManager(options: CanvasOptions): CanvasManager {
  const canvas = useCanvas(options)
  canvas.init()

  return {
    stage: canvas.stage.value!,
    layers: canvas.layers.value,
    addLayer: canvas.addLayer,
    removeLayer: canvas.removeLayer,
    updateLayer: canvas.updateLayer,
    getLayer: canvas.getLayer,
    getAllLayers: canvas.getAllLayers,
    clear: canvas.clear,
    destroy: canvas.destroy
  }
}
