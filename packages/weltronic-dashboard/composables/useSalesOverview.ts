import { clientApi } from 'api'

export interface SalesOverviewFilterForm {
  brand: string
  year: string
}

export interface SalesOverviewSummary {
  orderTotalValue: number
  fulfilledValue: number
  pendingValue: number
  inventoryValue: number
  hasInventoryValue: boolean
  inventoryValueSource: string
}

const EMPTY_SUMMARY: SalesOverviewSummary = {
  orderTotalValue: 0,
  fulfilledValue: 0,
  pendingValue: 0,
  inventoryValue: 0,
  hasInventoryValue: false,
  inventoryValueSource: ''
}

export function createEmptySalesOverviewFilter(): SalesOverviewFilterForm {
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

export function formatSalesOverviewAmount(value: number) {
  const n = Number(value || 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `¥${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `¥${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `¥${(n / 1_000).toFixed(1)}K`
  return `¥${n.toFixed(0)}`
}

export function formatSalesOverviewAmountFull(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function mapSummary(raw: any): SalesOverviewSummary {
  return {
    orderTotalValue: Number(raw?.orderTotalValue ?? 0),
    fulfilledValue: Number(raw?.fulfilledValue ?? 0),
    pendingValue: Number(raw?.pendingValue ?? 0),
    inventoryValue: Number(raw?.inventoryValue ?? 0),
    hasInventoryValue: !!raw?.hasInventoryValue,
    inventoryValueSource: String(raw?.inventoryValueSource ?? '')
  }
}

export function useSalesOverview() {
  const filterForm = reactive<SalesOverviewFilterForm>(createEmptySalesOverviewFilter())
  const summary = ref<SalesOverviewSummary>({ ...EMPTY_SUMMARY })
  const loading = ref(false)

  async function fetchSummary() {
    loading.value = true
    try {
      const body = omitEmpty({
        brand: filterForm.brand,
        year: filterForm.year
      })
      const res = await clientApi.instance.post('/v1/ms/oracle/wcl/so/sales-overview', body, {
        baseURL: '/apis'
      })
      const data = res.data?.data ?? res.data ?? {}
      summary.value = mapSummary(data.summary || {})
      return summary.value
    } finally {
      loading.value = false
    }
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptySalesOverviewFilter())
  }

  return {
    filterForm,
    summary,
    loading,
    fetchSummary,
    resetFilter
  }
}
