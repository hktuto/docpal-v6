import { clientApi } from 'api'

export type PoStatLevel = 'brand' | 'year' | 'po' | 'item'

export interface PoStatFilterForm {
  level: '' | PoStatLevel
  brand: string
  yearFilter: string
  poNumber: string
  itemNo: string
  poDateStart: string
  poDateEnd: string
  expectedArrivalDateStart: string
  expectedArrivalDateEnd: string
}

export interface PoStatSummary {
  brandCount?: number
  yearCount?: number
  poCount?: number
  itemCount?: number
  orderedQty: number
  receivedQty: number
  pendingQty: number
  amountCny: number
  amountHkd: number
}

export interface PoStatRow {
  level: PoStatLevel
  key: string
  label: string
  hasChildren: boolean
  brand?: string
  year?: number
  poNumber?: string
  itemNo?: string
  orderedQty: number
  receivedQty: number
  pendingQty: number
  amountCny: number
  amountHkd: number
  _rowKey: string
  parentId: string | null
  hasChild: boolean
  [key: string]: any
}

const LEVEL_ORDER: PoStatLevel[] = ['brand', 'year', 'po', 'item']

const EMPTY_SUMMARY: PoStatSummary = {
  orderedQty: 0,
  receivedQty: 0,
  pendingQty: 0,
  amountCny: 0,
  amountHkd: 0
}

export function nextPoStatLevel(level: PoStatLevel): PoStatLevel | null {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[idx + 1]
}

export function createEmptyPoStatFilter(): PoStatFilterForm {
  return {
    level: '',
    brand: '',
    yearFilter: '',
    poNumber: '',
    itemNo: '',
    poDateStart: '',
    poDateEnd: '',
    expectedArrivalDateStart: '',
    expectedArrivalDateEnd: ''
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

export function buildParentsFromRow(row: PoStatRow) {
  const parents: Record<string, any> = {}
  if (row.brand) parents.parentBrand = row.brand
  if (row.year != null && row.year !== '') parents.parentYear = Number(row.year)
  if (row.poNumber) parents.parentPoNumber = row.poNumber
  return parents
}

export function mapPoStatRow(item: any, parentId: string | null = null): PoStatRow {
  return {
    ...item,
    level: item.level,
    key: item.key,
    label: item.label,
    hasChildren: !!item.hasChildren,
    brand: item.brand,
    year: item.year,
    poNumber: item.poNumber,
    itemNo: item.itemNo,
    orderedQty: Math.round(Number(item.orderedQty ?? 0)),
    receivedQty: Math.round(Number(item.receivedQty ?? 0)),
    pendingQty: Math.round(Number(item.pendingQty ?? 0)),
    amountCny: Number(item.amountCny ?? 0),
    amountHkd: Number(item.amountHkd ?? 0),
    _rowKey: item.key,
    parentId,
    hasChild: !!item.hasChildren
  }
}

export function formatPoStatQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function formatPoStatAmount(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function usePoStat() {
  const filterForm = reactive<PoStatFilterForm>(createEmptyPoStatFilter())
  const summary = ref<PoStatSummary>({ ...EMPTY_SUMMARY })
  const loading = ref(false)

  function buildFilterBody() {
    return omitEmpty({
      brand: filterForm.brand,
      yearFilter: filterForm.yearFilter,
      poNumber: filterForm.poNumber,
      itemNo: filterForm.itemNo,
      poDateStart: filterForm.poDateStart,
      poDateEnd: filterForm.poDateEnd,
      expectedArrivalDateStart: filterForm.expectedArrivalDateStart,
      expectedArrivalDateEnd: filterForm.expectedArrivalDateEnd
    })
  }

  async function fetchPoStat(options: {
    level?: PoStatLevel
    parents?: Record<string, any>
    /** root query: include filter level only when selected */
    asRoot?: boolean
  } = {}) {
    const body: Record<string, any> = {
      ...buildFilterBody(),
      ...(options.parents || {})
    }
    if (options.level) {
      body.level = options.level
    } else if (options.asRoot && filterForm.level) {
      body.level = filterForm.level
    }

    const res = await clientApi.instance.post('/v1/ms/oracle/wcl/po-stat', body, {
      baseURL: '/apis'
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = (data.list || []).map((item: any) => mapPoStatRow(item, null))
    const nextSummary: PoStatSummary = {
      ...EMPTY_SUMMARY,
      ...(data.summary || {})
    }
    return { list, summary: nextSummary, currentLevel: data.currentLevel as PoStatLevel | undefined }
  }

  async function fetchRoot() {
    loading.value = true
    try {
      const result = await fetchPoStat({ asRoot: true })
      summary.value = result.summary
      return result
    } finally {
      loading.value = false
    }
  }

  async function fetchChildren(row: PoStatRow) {
    const next = nextPoStatLevel(row.level)
    if (!next) return []
    const { list } = await fetchPoStat({
      level: next,
      parents: buildParentsFromRow(row)
    })
    return list.map((item) => mapPoStatRow(item, row._rowKey))
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyPoStatFilter())
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
