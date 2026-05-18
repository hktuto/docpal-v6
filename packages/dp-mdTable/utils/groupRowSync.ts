export function matchesGroupRow(row: any, field: string, groupValue: unknown) {
  if (!row) {
    return false
  }
  return row[field] === groupValue || String(row.id) === String(groupValue)
}

export function findRowAndAncestors(rows: any[], rowId: string, ancestors: any[] = []): { row: any; ancestors: any[] } | null {
  for (const row of rows || []) {
    if (String(row?.id) === String(rowId)) {
      return { row, ancestors }
    }
    if (row.children?.length) {
      const found = findRowAndAncestors(row.children, rowId, [...ancestors, row])
      if (found) {
        return found
      }
    }
  }
  return null
}

export function patchGroupNode(target: any, groupNode: any, field: string) {
  const count = groupNode?.count ?? groupNode?.__count
  const preservedId = target.id
  Object.assign(target, groupNode, {
    id: preservedId,
    [field]: groupNode?.[field] ?? target[field],
    count,
    __count: count
  })
}

export function patchChildRowInMap(groupChildren: Record<string, any[]>, rowId: string, liveRow: Record<string, any>) {
  const nextGroupChildren = Object.entries(groupChildren).reduce<Record<string, any[]>>((acc, [key, rows]) => {
    acc[key] = rows.map((row) => (String(row?.id) === String(rowId) ? { ...row, ...liveRow } : row))
    return acc
  }, {})
  return nextGroupChildren
}
