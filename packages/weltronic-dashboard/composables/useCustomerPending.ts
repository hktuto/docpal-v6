import { clientApi } from 'api'

export type CustomerPendingLevel = 'customer_group' | 'customer'

export interface CustomerPendingFilterForm {
  brand: string
  year: string
}

export interface CustomerPendingSummary {
  customerGroupCount: number
  customerCount: number
  pendingQty: number
  pendingAmount: number
}

export interface CustomerPendingRow {
  level: CustomerPendingLevel
  key: string
  label: string
  hasChildren: boolean
  customerGroup?: string
  customer?: string
  pendingQty: number
  pendingAmount: number
}

const EMPTY_SUMMARY: CustomerPendingSummary = {
  customerGroupCount: 0,
  customerCount: 0,
  pendingQty: 0,
  pendingAmount: 0
}

export function createEmptyCustomerPendingFilter(): CustomerPendingFilterForm {
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

export function formatCustomerPendingQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function formatCustomerPendingAmount(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatCustomerPendingAmountCompact(value: number) {
  const n = Number(value || 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function mapRow(item: any): CustomerPendingRow {
  return {
    level: item?.level === 'customer' ? 'customer' : 'customer_group',
    key: String(item?.key ?? ''),
    label: String(item?.label ?? ''),
    hasChildren: !!item?.hasChildren,
    customerGroup: item?.customerGroup != null ? String(item.customerGroup) : undefined,
    customer: item?.customer != null ? String(item.customer) : undefined,
    pendingQty: Math.round(Number(item?.pendingQty ?? 0)),
    pendingAmount: Number(item?.pendingAmount ?? 0)
  }
}

function mapSummary(raw: any): CustomerPendingSummary {
  return {
    customerGroupCount: Number(raw?.customerGroupCount ?? 0),
    customerCount: Number(raw?.customerCount ?? 0),
    pendingQty: Math.round(Number(raw?.pendingQty ?? 0)),
    pendingAmount: Number(raw?.pendingAmount ?? 0)
  }
}

export function useCustomerPending() {
  const filterForm = reactive<CustomerPendingFilterForm>(createEmptyCustomerPendingFilter())
  const summary = ref<CustomerPendingSummary>({ ...EMPTY_SUMMARY })
  const list = ref<CustomerPendingRow[]>([])
  const currentLevel = ref<CustomerPendingLevel>('customer_group')
  const loading = ref(false)

  async function fetchList(options: { parentCustomerGroup?: string } = {}) {
    loading.value = true
    try {
      const body = omitEmpty({
        brand: filterForm.brand,
        year: filterForm.year,
        parentCustomerGroup: options.parentCustomerGroup
      })
      const res = await clientApi.instance.post('/v1/ms/oracle/wcl/so/customer-pending', body, {
        baseURL: '/apis'
      })
      const data = res.data?.data ?? res.data ?? {}
      const rows = (data.list || []).map(mapRow) as CustomerPendingRow[]
      list.value = rows.sort(
        (a, b) => b.pendingAmount - a.pendingAmount || b.pendingQty - a.pendingQty
      )
      summary.value = mapSummary(data.summary || {})
      currentLevel.value =
        data.currentLevel === 'customer' || options.parentCustomerGroup
          ? 'customer'
          : 'customer_group'
      return {
        list: list.value,
        summary: summary.value,
        currentLevel: currentLevel.value
      }
    } finally {
      loading.value = false
    }
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyCustomerPendingFilter())
  }

  return {
    filterForm,
    summary,
    list,
    currentLevel,
    loading,
    fetchList,
    resetFilter
  }
}
