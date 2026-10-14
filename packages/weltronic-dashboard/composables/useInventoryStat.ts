import { clientApi } from 'api'

export type InventoryStatLevel =
  | 'brand'
  | 'item'
  | 'warehouse'
  | 'sub_inventory'
  | 'date_code'

export type InventoryWarehouse = 'HK1' | 'GZ' | 'SH' | 'SZ'

export interface InventoryStatFilterForm {
  level: '' | InventoryStatLevel
  brand: string
  itemNo: string
  warehouse: '' | InventoryWarehouse
}

export interface InventoryStatSummary {
  brandCount?: number
  itemCount?: number
  warehouseCount?: number
  subInventoryCount?: number
  dateCodeCount?: number
  currentQty: number
  allocatedQty: number
  availableQty: number
}

export interface InventoryStatRow {
  level: InventoryStatLevel
  key: string
  label: string
  hasChildren: boolean
  brand?: string
  itemNo?: string
  warehouse?: string
  subInventoryCode?: string
  dateCode?: string
  currentQty: number
  allocatedQty: number
  availableQty: number
  _rowKey: string
  parentId: string | null
  hasChild: boolean
  [key: string]: any
}

const LEVEL_ORDER: InventoryStatLevel[] = [
  'brand',
  'item',
  'warehouse',
  'sub_inventory',
  'date_code'
]

const EMPTY_SUMMARY: InventoryStatSummary = {
  currentQty: 0,
  allocatedQty: 0,
  availableQty: 0
}

export function nextInventoryStatLevel(
  level: InventoryStatLevel
): InventoryStatLevel | null {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[idx + 1]
}

export function createEmptyInventoryStatFilter(): InventoryStatFilterForm {
  return {
    level: '',
    brand: '',
    itemNo: '',
    warehouse: ''
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

export function buildParentsFromRow(row: InventoryStatRow) {
  const parents: Record<string, any> = {}
  if (row.brand) parents.parentBrand = row.brand
  if (row.itemNo) parents.parentItemNo = row.itemNo
  if (row.warehouse) parents.parentWarehouse = row.warehouse
  if (row.subInventoryCode) parents.parentSubInventoryCode = row.subInventoryCode
  return parents
}

export function mapInventoryStatRow(
  item: any,
  parentId: string | null = null
): InventoryStatRow {
  return {
    ...item,
    level: item.level,
    key: item.key,
    label: item.label,
    hasChildren: !!item.hasChildren,
    brand: item.brand,
    itemNo: item.itemNo,
    warehouse: item.warehouse,
    subInventoryCode: item.subInventoryCode,
    dateCode: item.dateCode,
    currentQty: Math.round(Number(item.currentQty ?? 0)),
    allocatedQty: Math.round(Number(item.allocatedQty ?? 0)),
    availableQty: Math.round(Number(item.availableQty ?? 0)),
    _rowKey: item.key,
    parentId,
    hasChild: !!item.hasChildren
  }
}

export function formatInventoryStatQty(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-US')
}

export function useInventoryStat() {
  const filterForm = reactive<InventoryStatFilterForm>(createEmptyInventoryStatFilter())
  const summary = ref<InventoryStatSummary>({ ...EMPTY_SUMMARY })
  const loading = ref(false)

  function buildFilterBody() {
    return omitEmpty({
      brand: filterForm.brand,
      itemNo: filterForm.itemNo,
      warehouse: filterForm.warehouse
    })
  }

  async function fetchInventoryStat(
    options: {
      level?: InventoryStatLevel
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

    const res = await clientApi.instance.post('/v1/ms/oracle/wcl/inventory-stat', body, {
      baseURL: '/apis'
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = (data.list || []).map((item: any) => mapInventoryStatRow(item, null))
    const rawSummary = data.summary || {}
    const nextSummary: InventoryStatSummary = {
      ...EMPTY_SUMMARY,
      ...rawSummary,
      currentQty: Math.round(Number(rawSummary.currentQty ?? 0)),
      allocatedQty: Math.round(Number(rawSummary.allocatedQty ?? 0)),
      availableQty: Math.round(Number(rawSummary.availableQty ?? 0))
    }
    return {
      list,
      summary: nextSummary,
      currentLevel: data.currentLevel as InventoryStatLevel | undefined
    }
  }

  async function fetchRoot() {
    loading.value = true
    try {
      const result = await fetchInventoryStat({ asRoot: true })
      summary.value = result.summary
      return result
    } finally {
      loading.value = false
    }
  }

  async function fetchChildren(row: InventoryStatRow) {
    const next = nextInventoryStatLevel(row.level)
    if (!next) return []
    const { list } = await fetchInventoryStat({
      level: next,
      parents: buildParentsFromRow(row)
    })
    return list.map((item) => mapInventoryStatRow(item, row._rowKey))
  }

  function resetFilter() {
    Object.assign(filterForm, createEmptyInventoryStatFilter())
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
