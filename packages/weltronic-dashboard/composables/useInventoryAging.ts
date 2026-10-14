import { clientApi } from 'api'

export type InventoryAgingLevel = 'brand' | 'item'

export interface InventoryAgingFilterForm {
  level: '' | InventoryAgingLevel
  brand: string
  itemNo: string
}

export interface InventoryAgingMetrics {
  qtyLe3Months: number
  amountLe3Months: number | null
  qty3To6Months: number
  amount3To6Months: number | null
  qty6To9Months: number
  amount6To9Months: number | null
  qty9To12Months: number
  amount9To12Months: number | null
  qtyOver12Months: number
  amountOver12Months: number | null
  totalQty: number
  totalAmount: number | null
  hasAmount: boolean
}

export interface InventoryAgingSummary extends InventoryAgingMetrics {
  brandCount?: number
  itemCount?: number
}

export interface InventoryAgingRow extends InventoryAgingMetrics {
  level: InventoryAgingLevel
  key: string
  label: string
  hasChildren: boolean
  brand?: string
  itemNo?: string
  _rowKey: string
  parentId: string | null
  hasChild: boolean
  [key: string]: any
}

const LEVEL_ORDER: InventoryAgingLevel[] = ['brand', 'item']

const EMPTY_METRICS: InventoryAgingMetrics = {
  qtyLe3Months: 0,
  amountLe3Months: null,
  qty3To6Months: 0,
  amount3To6Months: null,
  qty6To9Months: 0,
  amount6To9Months: null,
  qty9To12Months: 0,
  amount9To12Months: null,
  qtyOver12Months: 0,
  amountOver12Months: null,
  totalQty: 0,
  totalAmount: null,
  hasAmount: false
}

function toQty(value: unknown) {
  return Math.round(Number(value ?? 0))
}

function toAmount(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function mapMetrics(source: Record<string, any> = {}): InventoryAgingMetrics {
  return {
    qtyLe3Months: toQty(source.qtyLe3Months),
    amountLe3Months: toAmount(source.amountLe3Months),
    qty3To6Months: toQty(source.qty3To6Months),
    amount3To6Months: toAmount(source.amount3To6Months),
    qty6To9Months: toQty(source.qty6To9Months),
    amount6To9Months: toAmount(source.amount6To9Months),
    qty9To12Months: toQty(source.qty9To12Months),
    amount9To12Months: toAmount(source.amount9To12Months),
    qtyOver12Months: toQty(source.qtyOver12Months),
    amountOver12Months: toAmount(source.amountOver12Months),
    totalQty: toQty(source.totalQty),
    totalAmount: toAmount(source.totalAmount),
    hasAmount: !!source.hasAmount
  }
}

export function nextInventoryAgingLevel(
  level: InventoryAgingLevel
): InventoryAgingLevel | null {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[idx + 1]
}

export function createEmptyInventoryAgingFilter(): InventoryAgingFilterForm {
  return {
    level: '',
    brand: '',
    itemNo: ''
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

export function buildParentsFromRow(row: InventoryAgingRow) {
  const parents: Record<string, any> = {}
  if (row.brand) parents.parentBrand = row.brand
  return parents
}

export function mapInventoryAgingRow(
  item: any,
  parentId: string | null = null
): InventoryAgingRow {
  return {
    ...item,
    ...mapMetrics(item),
    level: item.level,
    key: item.key,
    label: item.label,
    hasChildren: !!item.hasChildren,
    brand: item.brand,
    itemNo: item.itemNo,
    _rowKey: item.key,
    parentId,
    hasChild: !!item.hasChildren
  }
}

export function formatInventoryAgingQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function formatInventoryAgingAmount(value: number | null) {
  if (value == null) return '-'
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function useInventoryAging() {
  const filterForm = reactive<InventoryAgingFilterForm>(createEmptyInventoryAgingFilter())
  const summary = ref<InventoryAgingSummary>({ ...EMPTY_METRICS })
  const loading = ref(false)

  function buildFilterBody() {
    return omitEmpty({
      brand: filterForm.brand,
      itemNo: filterForm.itemNo
    })
  }

  async function fetchInventoryAging(
    options: {
      level?: InventoryAgingLevel
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

    const res = await clientApi.instance.post('/v1/ms/oracle/wcl/inventory-aging', body, {
      baseURL: '/apis'
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = (data.list || []).map((item: any) => mapInventoryAgingRow(item, null))
    const rawSummary = data.summary || {}
    const nextSummary: InventoryAgingSummary = {
      ...mapMetrics(rawSummary),
      brandCount: rawSummary.brandCount,
      itemCount: rawSummary.itemCount
    }
    return {
      list,
      summary: nextSummary,
      currentLevel: data.currentLevel as InventoryAgingLevel | undefined
    }
  }

  async function fetchRoot() {
    loading.value = true
    try {
      const result = await fetchInventoryAging({ asRoot: true })
      summary.value = result.summary
      return result
    } finally {
      loading.value = false
    }
  }

  async function fetchChildren(row: InventoryAgingRow) {
    const next = nextInventoryAgingLevel(row.level)
    if (!next) return []
    const { list } = await fetchInventoryAging({
      level: next,
      parents: buildParentsFromRow(row)
    })
    return list.map((item) => mapInventoryAgingRow(item, row._rowKey))
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyInventoryAgingFilter())
  }

  return {
    filterForm,
    summary,
    loading,
    fetchRoot,
    fetchChildren,
    resetFilter
  }
}
