import { clientApi } from 'api'

export interface SoInventoryAgingFilterForm {
  brand: string
  year: string
}

export interface SoInventoryAgingSummary {
  totalQty: number
  totalAmount: number
  hasAmount: boolean
  amountSource: string
  yearAffectsInventory: boolean
}

export interface SoInventoryAgingRow {
  key: string
  label: string
  sortOrder: number
  qty: number
  amount: number
  ratio: number
}

const EMPTY_SUMMARY: SoInventoryAgingSummary = {
  totalQty: 0,
  totalAmount: 0,
  hasAmount: false,
  amountSource: '',
  yearAffectsInventory: false
}

export function createEmptySoInventoryAgingFilter(): SoInventoryAgingFilterForm {
  return {
    brand: '',
    year: String(new Date().getFullYear())
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

export function formatSoInventoryAgingQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function formatSoInventoryAgingAmount(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatSoInventoryAgingAmountCompact(value: number) {
  const n = Number(value || 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

export function formatSoInventoryAgingRatio(value: number) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`
}

function mapRow(item: any): SoInventoryAgingRow {
  return {
    key: String(item?.key ?? ''),
    label: String(item?.label ?? ''),
    sortOrder: Number(item?.sortOrder ?? 0),
    qty: Math.round(Number(item?.qty ?? 0)),
    amount: Number(item?.amount ?? 0),
    ratio: Number(item?.ratio ?? 0)
  }
}

function mapSummary(raw: any): SoInventoryAgingSummary {
  return {
    totalQty: Math.round(Number(raw?.totalQty ?? 0)),
    totalAmount: Number(raw?.totalAmount ?? 0),
    hasAmount: !!raw?.hasAmount,
    amountSource: String(raw?.amountSource ?? ''),
    yearAffectsInventory: !!raw?.yearAffectsInventory
  }
}

export function useSoInventoryAging() {
  const filterForm = reactive<SoInventoryAgingFilterForm>(createEmptySoInventoryAgingFilter())
  const summary = ref<SoInventoryAgingSummary>({ ...EMPTY_SUMMARY })
  const list = ref<SoInventoryAgingRow[]>([])
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      const body = omitEmpty({
        brand: filterForm.brand,
        year: filterForm.year
      })
      const res = await clientApi.instance.post('/v1/ms/oracle/wcl/so/inventory-aging', body, {
        baseURL: '/apis'
      })
      const data = res.data?.data ?? res.data ?? {}
      list.value = (data.list || [])
        .map(mapRow)
        .sort((a: SoInventoryAgingRow, b: SoInventoryAgingRow) => a.sortOrder - b.sortOrder)
      summary.value = mapSummary(data.summary || {})
      return { list: list.value, summary: summary.value }
    } finally {
      loading.value = false
    }
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptySoInventoryAgingFilter())
  }

  return {
    filterForm,
    summary,
    list,
    loading,
    fetchList,
    resetFilter
  }
}
