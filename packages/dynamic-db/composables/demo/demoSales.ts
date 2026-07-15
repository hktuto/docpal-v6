// Shared sales-order math for the demo widgets.
// Cancelled SOs are excluded from sales metrics (they live in the Inactive Item Report).

export function isActiveSO(row: any): boolean {
  return row.status !== 'Cancelled'
}

/** Line value × shipped ratio (unit price assumed constant across the line). */
export function shippedValue(row: any): number {
  return row.orderQty > 0 ? (row.value * row.shippedQty) / row.orderQty : 0
}

/** Line value not yet shipped. */
export function outstandingValue(row: any): number {
  return row.value - shippedValue(row)
}
