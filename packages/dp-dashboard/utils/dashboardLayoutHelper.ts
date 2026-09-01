type GridItem = { x?: number; y?: number; w: number; h: number; i?: string | number }

function collides(a: GridItem, b: GridItem) {
  return (a.x ?? 0) < (b.x ?? 0) + b.w && (a.x ?? 0) + a.w > (b.x ?? 0) && (a.y ?? 0) < (b.y ?? 0) + b.h && (a.y ?? 0) + a.h > (b.y ?? 0)
}

/** 从左到右、从上到下找第一个能放下 w×h 的空位 */
export function findFirstFitPosition(layout: GridItem[], w: number, h: number, colNum: number) {
  const width = Math.min(Math.max(w || 1, 1), colNum)
  const height = Math.max(h || 1, 1)
  const maxY = layout.reduce((max, item) => Math.max(max, (item.y ?? 0) + item.h), 0)

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= colNum - width; x++) {
      const candidate = { x, y, w: width, h: height }
      if (!layout.some((item) => collides(candidate, item))) return { x, y }
    }
  }
  return { x: 0, y: maxY }
}

/** 按阅读顺序把卡片重新排进网格，填满空隙 */
export function packLayout<T extends GridItem>(layout: T[], colNum: number): T[] {
  const sorted = [...layout].sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))
  const packed: T[] = []
  for (const item of sorted) {
    packed.push({ ...item, ...findFirstFitPosition(packed, item.w, item.h, colNum) })
  }
  return packed
}

/** 原地写入新坐标，避免替换 layout 数组触发 GridLayout 再次 compact */
export function applyPackedPositions<T extends GridItem>(layout: T[], colNum: number) {
  const packed = packLayout(layout, colNum)
  const nextById = new Map(packed.map((item) => [item.i, item]))
  for (const item of layout) {
    const next = nextById.get(item.i)
    if (!next) continue
    item.x = next.x
    item.y = next.y
  }
}
