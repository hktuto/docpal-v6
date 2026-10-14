import { clientApi } from 'api'

export type IncomingStatLevel =
  | 'warehouse'
  | 'delivery_date'
  | 'brand'
  | 'item'
  | 'po'

export interface IncomingStatFilterForm {
  level: '' | IncomingStatLevel
  warehouse: string
  brand: string
  deliveryDateStart: string
  deliveryDateEnd: string
}

export interface IncomingStatSummary {
  warehouseCount?: number
  deliveryDateCount?: number
  brandCount?: number
  itemCount?: number
  poCount?: number
  shipmentQty: number
}

export interface IncomingStatRow {
  level: IncomingStatLevel
  key: string
  label: string
  hasChildren: boolean
  warehouse?: string
  deliveryDate?: string
  brand?: string
  itemNo?: string
  poNumber?: string
  carrier?: string
  trackingNo?: string
  status?: string
  shipmentQty: number
  _rowKey: string
  parentId: string | null
  hasChild: boolean
  [key: string]: any
}

const LEVEL_ORDER: IncomingStatLevel[] = [
  'warehouse',
  'delivery_date',
  'brand',
  'item',
  'po'
]

const EMPTY_SUMMARY: IncomingStatSummary = {
  shipmentQty: 0
}

export function nextIncomingStatLevel(
  level: IncomingStatLevel
): IncomingStatLevel | null {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[idx + 1]
}

export function createEmptyIncomingStatFilter(): IncomingStatFilterForm {
  return {
    level: '',
    warehouse: '',
    brand: '',
    deliveryDateStart: '',
    deliveryDateEnd: ''
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

export function buildParentsFromRow(row: IncomingStatRow) {
  const parents: Record<string, any> = {}
  if (row.warehouse) parents.parentWarehouse = row.warehouse
  if (row.deliveryDate) parents.parentDeliveryDate = row.deliveryDate
  if (row.brand) parents.parentBrand = row.brand
  if (row.itemNo) parents.parentItemNo = row.itemNo
  return parents
}

export function mapIncomingStatRow(
  item: any,
  parentId: string | null = null
): IncomingStatRow {
  return {
    ...item,
    level: item.level,
    key: item.key,
    label: item.label,
    hasChildren: !!item.hasChildren,
    warehouse: item.warehouse,
    deliveryDate: item.deliveryDate,
    brand: item.brand,
    itemNo: item.itemNo,
    poNumber: item.poNumber,
    carrier: item.carrier,
    trackingNo: item.trackingNo,
    status: item.status,
    shipmentQty: Math.round(Number(item.shipmentQty ?? 0)),
    _rowKey: item.key,
    parentId,
    hasChild: !!item.hasChildren
  }
}

export function formatIncomingStatQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function useIncomingStat() {
  const filterForm = reactive<IncomingStatFilterForm>(createEmptyIncomingStatFilter())
  const summary = ref<IncomingStatSummary>({ ...EMPTY_SUMMARY })
  const loading = ref(false)

  function buildFilterBody() {
    return omitEmpty({
      warehouse: filterForm.warehouse,
      brand: filterForm.brand,
      deliveryDateStart: filterForm.deliveryDateStart,
      deliveryDateEnd: filterForm.deliveryDateEnd
    })
  }

  async function fetchIncomingStat(
    options: {
      level?: IncomingStatLevel
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

    const res = await clientApi.instance.post('/v1/ms/oracle/wcl/incoming-stat', body, {
      baseURL: '/apis'
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = (data.list || []).map((item: any) => mapIncomingStatRow(item, null))
    const rawSummary = data.summary || {}
    const nextSummary: IncomingStatSummary = {
      ...EMPTY_SUMMARY,
      ...rawSummary,
      shipmentQty: Math.round(Number(rawSummary.shipmentQty ?? 0))
    }
    return {
      list,
      summary: nextSummary,
      currentLevel: data.currentLevel as IncomingStatLevel | undefined
    }
  }

  async function fetchRoot() {
    loading.value = true
    try {
      const result = await fetchIncomingStat({ asRoot: true })
      summary.value = result.summary
      return result
    } finally {
      loading.value = false
    }
  }

  async function fetchChildren(row: IncomingStatRow) {
    const next = nextIncomingStatLevel(row.level)
    if (!next) return []
    const { list } = await fetchIncomingStat({
      level: next,
      parents: buildParentsFromRow(row)
    })
    return list.map((item) => mapIncomingStatRow(item, row._rowKey))
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyIncomingStatFilter())
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
