// ui_v6\demo\canvas-renderer\utils\layers\rectangleLayer.ts

import Konva from 'konva'

export interface RectangleLayerConfig {
  x: number
  y: number
  width: number
  height: number
  color?: string
  strokeColor?: string
  strokeWidth?: number
  cornerRadius?: number
  shadow?: boolean
  opacity?: number
  rotation?: number
}

export interface RectangleLayerNodes {
  rectangle: Konva.Rect
  allNodes: Konva.Node[]
}

/**
 * Create a rectangle layer
 */
export function createRectangleLayer(config: RectangleLayerConfig): RectangleLayerNodes {
  const {
    x,
    y,
    width,
    height,
    color = '#4CAF50',
    strokeColor = '#2E7D32',
    strokeWidth = 2,
    cornerRadius = 8,
    shadow = true,
    opacity = 1,
    rotation = 0
  } = config

  // Create rectangle
  const rectangle = new Konva.Rect({
    x,
    y,
    width,
    height,
    fill: color,
    stroke: strokeColor,
    strokeWidth,
    cornerRadius,
    opacity,
    rotation,
    draggable: true
  })

  // Add shadow if enabled
  if (shadow) {
    rectangle.shadowColor('black')
    rectangle.shadowBlur(5)
    rectangle.shadowOffset({ x: 2, y: 2 })
    rectangle.shadowOpacity(0.2)
  }

  return {
    rectangle,
    allNodes: [rectangle]
  }
}

/**
 * Update rectangle layer properties
 */
export function updateRectangleLayer(nodes: RectangleLayerNodes, updates: Partial<RectangleLayerConfig>): void {
  const { rectangle } = nodes

  if (updates.x !== undefined) rectangle.x(updates.x)
  if (updates.y !== undefined) rectangle.y(updates.y)
  if (updates.width !== undefined) rectangle.width(updates.width)
  if (updates.height !== undefined) rectangle.height(updates.height)
  if (updates.color !== undefined) rectangle.fill(updates.color)
  if (updates.strokeColor !== undefined) rectangle.stroke(updates.strokeColor)
  if (updates.strokeWidth !== undefined) rectangle.strokeWidth(updates.strokeWidth)
  if (updates.cornerRadius !== undefined) rectangle.cornerRadius(updates.cornerRadius)
  if (updates.opacity !== undefined) rectangle.opacity(updates.opacity)
  if (updates.rotation !== undefined) rectangle.rotation(updates.rotation)
}

/**
 * Get rectangle layer state
 */
export function getRectangleLayerState(nodes: RectangleLayerNodes): RectangleLayerConfig {
  const { rectangle } = nodes

  return {
    x: rectangle.x(),
    y: rectangle.y(),
    width: rectangle.width(),
    height: rectangle.height(),
    color: rectangle.fill() as string,
    strokeColor: rectangle.stroke() as string,
    strokeWidth: rectangle.strokeWidth(),
    cornerRadius: Array.isArray(rectangle.cornerRadius()) ? rectangle.cornerRadius()[0] : rectangle.cornerRadius(),
    opacity: rectangle.opacity(),
    rotation: rectangle.rotation()
  }
}
