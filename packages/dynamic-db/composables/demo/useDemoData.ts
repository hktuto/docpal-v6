// packages/dynamic-db/composables/demo/useDemoData.ts
// Local-data layer for the Inventory Summary demo widgets. No API calls.

export interface DemoTreeNode {
  id: string
  key: string
  label: string
  level: number
  children?: DemoTreeNode[]
  [key: string]: any
}

export interface TreeBuildOptions {
  /** Returns one group key per tree level for a row (length = tree depth). */
  levels: (row: any) => string[]
  /** Extra fields set on leaf nodes (first row that creates the leaf). */
  init?: (row: any) => Record<string, any>
  /** Folds a source row into the node — called for the leaf and every ancestor. */
  merge?: (node: DemoTreeNode, row: any) => void
}

// ---- Cached lazy JSON loaders (dynamic import: data loads only when a widget renders) ----

let inventoryPromise: Promise<any[]> | null = null
let transactionsPromise: Promise<any[]> | null = null
let arrivalsPromise: Promise<any[]> | null = null
let partCostsPromise: Promise<Record<string, number>> | null = null

export function loadInventory(): Promise<any[]> {
  if (!inventoryPromise) {
    inventoryPromise = import('../../demo/data/inventory.json').then((m) => m.default as any[])
  }
  return inventoryPromise
}

export function loadTransactions(): Promise<any[]> {
  if (!transactionsPromise) {
    transactionsPromise = import('../../demo/data/transactions.json').then((m) => m.default as any[])
  }
  return transactionsPromise
}

export function loadArrivals(): Promise<any[]> {
  if (!arrivalsPromise) {
    arrivalsPromise = import('../../demo/data/arrivals.json').then((m) => m.default as any[])
  }
  return arrivalsPromise
}

export function loadPartCosts(): Promise<Record<string, number>> {
  if (!partCostsPromise) {
    partCostsPromise = import('../../demo/data/partCosts.json').then((m) => m.default as Record<string, number>)
  }
  return partCostsPromise
}

// ---- Tree building ----

export function buildTree(rows: any[], opts: TreeBuildOptions): DemoTreeNode[] {
  const { levels, init, merge } = opts
  const roots: DemoTreeNode[] = []

  for (const row of rows) {
    const keys = levels(row)
    const path: DemoTreeNode[] = []
    let siblings = roots
    let parentId = ''

    for (let i = 0; i < keys.length; i++) {
      const id = parentId ? `${parentId}::${keys[i]}` : keys[i]
      let node = siblings.find((n) => n.key === keys[i])
      if (!node) {
        node = { id, key: keys[i], label: keys[i], level: i }
        if (i === keys.length - 1 && init) {
          Object.assign(node, init(row))
        }
        siblings.push(node)
      }
      path.push(node)
      if (i < keys.length - 1) {
        siblings = node.children || (node.children = [])
      }
      parentId = id
    }

    if (merge) {
      for (const node of path) merge(node, row)
    }
  }

  return roots
}

// ---- Inbound/Outbound classification (decision: MOVE excluded as internal transfer) ----

export const INBOUND_TYPES = ['RECEIVE', 'RETURN', 'ADJUST+']
export const OUTBOUND_TYPES = ['PICK', 'ADJUST-']

// ---- Date / age helpers ----

/** '2025-07-11' -> '2025-07' */
export function monthKey(isoDate: string | null): string {
  return isoDate ? isoDate.slice(0, 7) : 'Unknown'
}

export const AGE_BUCKETS = [
  { key: 'b0_3', label: '≤ 3 months' },
  { key: 'b3_6', label: '3–6 months' },
  { key: 'b6_9', label: '6–9 months' },
  { key: 'b9_12', label: '9–12 months' },
  { key: 'b12p', label: '> 12 months' }
] as const

export function ageBucket(days: number): string {
  if (days <= 90) return 'b0_3'
  if (days <= 180) return 'b3_6'
  if (days <= 270) return 'b6_9'
  if (days <= 365) return 'b9_12'
  return 'b12p'
}

// ---- Formatting ----

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function formatCompactCurrency(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}
