import { clientApi } from 'api'

export interface MonthlyShipmentFilterForm {
  brand: string
  year: string
  monthsBack: number | null
}

export interface MonthlyShipmentSummary {
  monthCount: number
  orderTotalValue: number
  fulfilledValue: number
  pendingValue: number
}

export interface MonthlyShipmentRow {
  month: string
  orderTotalValue: number
  fulfilledValue: number
  pendingValue: number
}

const EMPTY_SUMMARY: MonthlyShipmentSummary = {
  monthCount: 0,
  orderTotalValue: 0,
  fulfilledValue: 0,
  pendingValue: 0
}

export function createEmptyMonthlyShipmentFilter(): MonthlyShipmentFilterForm {
  return {
    brand: '',
    year: String(new Date().getFullYear()),
    monthsBack: null
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

export function formatMonthlyShipmentAmount(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatMonthlyShipmentAmountCompact(value: number) {
  const n = Number(value || 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function mapRow(item: any): MonthlyShipmentRow {
  return {
    month: String(item?.month ?? ''),
    orderTotalValue: Number(item?.orderTotalValue ?? 0),
    fulfilledValue: Number(item?.fulfilledValue ?? 0),
    pendingValue: Number(item?.pendingValue ?? 0)
  }
}

function mapSummary(raw: any): MonthlyShipmentSummary {
  return {
    monthCount: Number(raw?.monthCount ?? 0),
    orderTotalValue: Number(raw?.orderTotalValue ?? 0),
    fulfilledValue: Number(raw?.fulfilledValue ?? 0),
    pendingValue: Number(raw?.pendingValue ?? 0)
  }
}

export function useMonthlyShipment() {
  const filterForm = reactive<MonthlyShipmentFilterForm>(createEmptyMonthlyShipmentFilter())
  const summary = ref<MonthlyShipmentSummary>({ ...EMPTY_SUMMARY })
  const list = ref<MonthlyShipmentRow[]>([])
  const months = ref<string[]>([])
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      const monthsBack =
        filterForm.monthsBack != null && Number(filterForm.monthsBack) > 0
          ? Math.floor(Number(filterForm.monthsBack))
          : undefined
      const body = omitEmpty({
        brand: filterForm.brand,
        year: filterForm.year,
        monthsBack
      })
      const res = await clientApi.instance.post('/v1/ms/oracle/wcl/so/monthly-shipment', body, {
        baseURL: '/apis'
      })
      const data = res.data?.data ?? res.data ?? {}
      list.value = (data.list || []).map(mapRow)
      summary.value = mapSummary(data.summary || {})
      months.value = Array.isArray(data.months)
        ? data.months.map((m: any) => String(m))
        : list.value.map((row) => row.month).filter(Boolean)
      return { list: list.value, summary: summary.value, months: months.value }
    } finally {
      loading.value = false
    }
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyMonthlyShipmentFilter())
  }

  return {
    filterForm,
    summary,
    list,
    months,
    loading,
    fetchList,
    resetFilter
  }
}
