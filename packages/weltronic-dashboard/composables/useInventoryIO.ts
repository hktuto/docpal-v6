import { clientApi } from 'api'

export type InventoryIOLevel = 'warehouse' | 'brand' | 'item'

export interface InventoryIOFilterForm {
  level: '' | InventoryIOLevel
  warehouse: string
  brand: string
  itemNo: string
  monthStart: string
  monthEnd: string
}

export interface InventoryIOBucket {
  month: string
  inQty: number
  outQty: number
}

export interface InventoryIOSummary {
  warehouseCount?: number
  brandCount?: number
  itemCount?: number
  totalInQty: number
  totalOutQty: number
  buckets: InventoryIOBucket[]
}

export interface InventoryIORow {
  level: InventoryIOLevel
  key: string
  label: string
  hasChildren: boolean
  warehouse?: string
  brand?: string
  itemNo?: string
  totalInQty: number
  totalOutQty: number
  buckets: InventoryIOBucket[]
  _rowKey: string
  parentId: string | null
  hasChild: boolean
  [key: string]: any
}

const LEVEL_ORDER: InventoryIOLevel[] = ['warehouse', 'brand', 'item']

const EMPTY_SUMMARY: InventoryIOSummary = {
  totalInQty: 0,
  totalOutQty: 0,
  buckets: []
}

function toQty(value: unknown) {
  return Math.round(Number(value ?? 0))
}

function mapBuckets(source: any[] = []): InventoryIOBucket[] {
  return source.map((item) => ({
    month: String(item.month ?? ''),
    inQty: toQty(item.inQty),
    outQty: toQty(item.outQty)
  }))
}

/** Flatten month buckets onto row fields for dynamic columns. */
export function monthQtyField(month: string, type: 'in' | 'out') {
  return `${type}Qty_${month.replace('-', '_')}`
}

export function nextInventoryIOLevel(level: InventoryIOLevel): InventoryIOLevel | null {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[idx + 1]
}

export function createEmptyInventoryIOFilter(): InventoryIOFilterForm {
  return {
    level: '',
    warehouse: '',
    brand: '',
    itemNo: '',
    monthStart: '',
    monthEnd: ''
  }
}

function omitEmpty(source: Record<string, any>) {
  const body: Record<string, any> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value === '' || value == null) continue
    body[key] = value
  }
  return body
}

export function buildParentsFromRow(row: InventoryIORow) {
  const parents: Record<string, any> = {}
  if (row.warehouse) parents.parentWarehouse = row.warehouse
  if (row.brand) parents.parentBrand = row.brand
  return parents
}

export function mapInventoryIORow(item: any, parentId: string | null = null): InventoryIORow {
  const buckets = mapBuckets(item.buckets || [])
  const row: InventoryIORow = {
    ...item,
    level: item.level,
    key: item.key,
    label: item.label,
    hasChildren: !!item.hasChildren,
    warehouse: item.warehouse,
    brand: item.brand,
    itemNo: item.itemNo,
    totalInQty: toQty(item.totalInQty),
    totalOutQty: toQty(item.totalOutQty),
    buckets,
    _rowKey: item.key,
    parentId,
    hasChild: !!item.hasChildren
  }
  for (const bucket of buckets) {
    if (!bucket.month) continue
    row[monthQtyField(bucket.month, 'in')] = bucket.inQty
    row[monthQtyField(bucket.month, 'out')] = bucket.outQty
  }
  return row
}

export function formatInventoryIOQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function useInventoryIO() {
  const filterForm = reactive<InventoryIOFilterForm>(createEmptyInventoryIOFilter())
  const summary = ref<InventoryIOSummary>({ ...EMPTY_SUMMARY })
  const months = ref<string[]>([])
  const loading = ref(false)

  function buildFilterBody() {
    return omitEmpty({
      warehouse: filterForm.warehouse,
      brand: filterForm.brand,
      itemNo: filterForm.itemNo,
      monthStart: filterForm.monthStart,
      monthEnd: filterForm.monthEnd
    })
  }

  async function fetchInventoryIO(
    options: {
      level?: InventoryIOLevel
      parents?: Record<string, any>
      /** root query: include filter level only when selected */
      asRoot?: boolean
    } = {}
  ) {
    const body: Record<string, any> = {
      ...buildFilterBody(),
      ...(options.parents || {})
    }
    if (options.level) {
      body.level = options.level
    } else if (options.asRoot && filterForm.level) {
      body.level = filterForm.level
    }

    const res = await clientApi.instance.post('/v1/ms/oracle/wcl/inventory-io', body, {
      baseURL: '/apis'
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = (data.list || []).map((item: any) => mapInventoryIORow(item, null))
    const rawSummary = data.summary || {}
    const nextSummary: InventoryIOSummary = {
      warehouseCount: rawSummary.warehouseCount,
      brandCount: rawSummary.brandCount,
      itemCount: rawSummary.itemCount,
      totalInQty: toQty(rawSummary.totalInQty),
      totalOutQty: toQty(rawSummary.totalOutQty),
      buckets: mapBuckets(rawSummary.buckets || [])
    }
    const nextMonths: string[] = Array.isArray(data.months)
      ? data.months.map((m: any) => String(m))
      : nextSummary.buckets.map((b) => b.month).filter(Boolean)

    return {
      list,
      summary: nextSummary,
      months: nextMonths,
      currentLevel: data.currentLevel as InventoryIOLevel | undefined
    }
  }

  async function fetchRoot() {
    loading.value = true
    try {
      const result = await fetchInventoryIO({ asRoot: true })
      summary.value = result.summary
      months.value = result.months
      return result
    } finally {
      loading.value = false
    }
  }

  async function fetchChildren(row: InventoryIORow) {
    const next = nextInventoryIOLevel(row.level)
    if (!next) return []
    const { list } = await fetchInventoryIO({
      level: next,
      parents: buildParentsFromRow(row)
    })
    return list.map((item) => mapInventoryIORow(item, row._rowKey))
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyInventoryIOFilter())
  }

  return {
    filterForm,
    summary,
    months,
    loading,
    fetchRoot,
    fetchChildren,
    resetFilter
  }
}
