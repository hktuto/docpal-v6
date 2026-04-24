// ui_v6\demo\canvas-renderer\utils\layers\textLayer.ts

import Konva from 'konva'

export interface TextLayerConfig {
  x: number
  y: number
  text: string
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  padding?: number
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  rotation?: number
  opacity?: number
  shadow?: boolean
}

export interface TextLayerNodes {
  background?: Konva.Rect
  text: Konva.Text
  container?: Konva.Group
  allNodes: Konva.Node[]
}

/**
 * Create a text layer with optional background
 */
export function createTextLayer(config: TextLayerConfig): TextLayerNodes {
  const {
    x,
    y,
    text,
    fontSize = 24,
    fontFamily = 'Arial',
    color = '#2196F3',
    backgroundColor,
    padding = 10,
    maxWidth,
    align = 'left',
    rotation = 0,
    opacity = 1,
    shadow = false
  } = config

  const nodes: Konva.Node[] = []
  let background: Konva.Rect | undefined
  let container: Konva.Group | undefined

  // Create text node
  const textNode = new Konva.Text({
    x: padding,
    y: padding,
    text,
    fontSize,
    fontFamily,
    fill: color,
    align,
    opacity,
    rotation,
    draggable: true
  })

  // Set max width if specified
  if (maxWidth) {
    textNode.width(maxWidth - padding * 2)
  }

  // Add shadow if enabled
  if (shadow) {
    textNode.shadowColor('rgba(0, 0, 0, 0.3)')
    textNode.shadowBlur(3)
    textNode.shadowOffset({ x: 1, y: 1 })
    textNode.shadowOpacity(0.5)
  }

  // Create background if specified
  if (backgroundColor) {
    const textWidth = textNode.width()
    const textHeight = textNode.height()

    background = new Konva.Rect({
      x: 0,
      y: 0,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
      fill: backgroundColor,
      stroke: '#ddd',
      strokeWidth: 1,
      cornerRadius: 4,
      opacity
    })

    // Create container group for background + text
    container = new Konva.Group({
      x,
      y,
      draggable: true
    })

    container.add(background)
    container.add(textNode)
    nodes.push(container)
  } else {
    // Just text, positioned directly
    textNode.x(x)
    textNode.y(y)
    nodes.push(textNode)
  }

  // Add all nodes to array
  if (background) nodes.push(background)
  nodes.push(textNode)

  return {
    background,
    text: textNode,
    container,
    allNodes: nodes
  }
}

/**
 * Update text layer properties
 */
export function updateTextLayer(
  nodes: TextLayerNodes,
  updates: Partial<TextLayerConfig>
): void {
  const { text, background, container } = nodes

  // Update text properties
  if (updates.text !== undefined) text.text(updates.text)
  if (updates.fontSize !== undefined) text.fontSize(updates.fontSize)
  if (updates.fontFamily !== undefined) text.fontFamily(updates.fontFamily)
  if (updates.color !== undefined) text.fill(updates.color)
  if (updates.align !== undefined) text.align(updates.align)
  if (updates.opacity !== undefined) {
    text.opacity(updates.opacity)
    if (background) background.opacity(updates.opacity)
  }
  if (updates.rotation !== undefined) text.rotation(updates.rotation)

  // Update position
  if (updates.x !== undefined || updates.y !== undefined) {
    const newX = updates.x !== undefined ? updates.x : (container ? container.x() : text.x())
    const newY = updates.y !== undefined ? updates.y : (container ? container.y() : text.y())

    if (container) {
      container.x(newX)
      container.y(newY)
    } else {
      text.x(newX)
      text.y(newY)
    }
  }

  // Update background if it exists and config changes
  if (background && (updates.backgroundColor !== undefined || updates.padding !== undefined)) {
    const padding = updates.padding !== undefined ? updates.padding : 10
    const backgroundColor = updates.backgroundColor !== undefined ? updates.backgroundColor : background.fill() as string

    background.fill(backgroundColor)

    // Update background size to match new text dimensions
    const textWidth = text.width()
    const textHeight = text.height()
    background.width(textWidth + padding * 2)
    background.height(textHeight + padding * 2)
  }

  // Update max width
  if (updates.maxWidth !== undefined && background) {
    const padding = updates.padding || 10
    text.width(updates.maxWidth - padding * 2)
    background.width(updates.maxWidth)
  }
}

/**
 * Get text layer state
 */
export function getTextLayerState(
  nodes: TextLayerNodes
): TextLayerConfig {
  const { text, background, container } = nodes

  const x = container ? container.x() : text.x()
  const y = container ? container.y() : text.y()

  return {
    x,
    y,
    text: text.text(),
    fontSize: text.fontSize(),
    fontFamily: text.fontFamily(),
    color: text.fill() as string,
    backgroundColor: background ? (background.fill() as string) : undefined,
    padding: background ? 10 : 0, // Default padding if background exists
    maxWidth: text.width(),
    align: text.align() as 'left' | 'center' | 'right',
    rotation: text.rotation(),
    opacity: text.opacity()
  }
}

/**
 * Measure text dimensions
 */
export function measureText(
  text: string,
  fontSize: number = 24,
  fontFamily: string = 'Arial'
): { width: number; height: number } {
  // Create a temporary text node to measure
  const tempText = new Konva.Text({
    text,
    fontSize,
    fontFamily
  })

  return {
    width: tempText.width(),
    height: tempText.height()
  }
}
