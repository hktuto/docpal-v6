export interface GroupedAuditLog<T> {
  date: string
  items: T[]
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function groupAuditLogsByDate<T extends { timestamp?: string }>(
  logs: T[] | null | undefined,
): GroupedAuditLog<T>[] {
  if (!Array.isArray(logs)) return []

  const groups = new Map<string, T[]>()
  const unknownItems: T[] = []

  for (const log of logs) {
    const datePart = log.timestamp?.split('T')[0]
    const isValidDate = ISO_DATE_RE.test(datePart ?? '')

    if (isValidDate) {
      const existing = groups.get(datePart!)
      if (existing) {
        existing.push(log)
      } else {
        groups.set(datePart!, [log])
      }
    } else {
      unknownItems.push(log)
    }
  }

  const sortedDates = Array.from(groups.keys()).sort()
  const result: GroupedAuditLog<T>[] = sortedDates.map((date) => ({
    date,
    items: groups.get(date)!,
  }))

  if (unknownItems.length > 0) {
    result.push({ date: 'Unknown', items: unknownItems })
  }

  return result
}
