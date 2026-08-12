import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { postDynamicActions } from 'api'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../utils/variableMapping'
import { COUNTRY_STATIC_ALIASES } from '../utils/countryAliases'
import { useWHASupplyListVerifyInject } from './useWHASupplyListVerify'

export type VerificationStatusFilter = 'all' | 'ok' | 'unVerified'

const SEARCH_FIELDS = [SGLA_ITEMS.Carton, SGLA_ITEMS.Supplier_PN, SGLA_ITEMS.WCL_PN, SGLA_ITEMS.Qty, SGLA_ITEMS.PoLine] as const

function matchSearchValue(value: unknown, query: string): boolean {
  if (value == null || value === '') return false
  return String(value).toLowerCase().includes(query)
}

type EditableColumnType = 'text' | 'number' | 'select'

type SelectOption = { label: string; value: string | number }

function editableColumn(type: EditableColumnType = 'text', selectOptions: SelectOption[] = []) {
  if (type === 'number') {
    return {
      editRender: {
        name: 'VxeInput',
        autofocus: '.vxe-input--inner',
        props: { type: 'number' }
      }
    }
  }

  if (type === 'select') {
    return {
      editRender: {
        name: 'VxeSelect',
        options: selectOptions,
        props: {
          clearable: true,
          filterable: true,
          transfer: true,
          popupClassName: 'wha-verify-select-panel'
        }
      }
    }
  }

  return {
    editRender: {
      name: 'VxeTextarea',
      autofocus: '.vxe-textarea--inner',
      props: { rows: 2, autosize: { minRows: 2, maxRows: 6 } }
    }
  }
}

export function createVerificationTableColumns(t: (key: string) => string) {
  return [
    {
      type: 'seq',
      width: 50,
      align: 'right',
      fixed: 'left'
    },
    {
      field: SGLA_ITEMS.Carton,
      title: t('workflowWarehouse.carton'),
      minWidth: 70,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.Supplier_PN,
      title: t('workflowWarehouse.supplierPn'),
      minWidth: 150,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.WCL_PN,
      title: t('workflowWarehouse.wclPn'),
      minWidth: 170,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.Qty,
      title: t('workflowWarehouse.qty'),
      minWidth: 90,
      type: 'number',
      ...editableColumn('number')
    },
    {
      field: SGLA_ITEMS.PoLine,
      title: t('workflowWarehouse.po'),
      minWidth: 140,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.SupplierItemRefNo,
      title: t('workflowWarehouse.SupplierItemRefNo'),
      minWidth: 140,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.DateCode,
      title: t('workflowWarehouse.dateCode'),
      minWidth: 140,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.CountryOfOrigin,
      title: t('workflowWarehouse.countryOfOrigin'),
      minWidth: 140,
      ...editableColumn('select')
    },
    {
      field: SGLA_ITEMS.CountryOfWafer,
      title: t('workflowWarehouse.countryOfWafer'),
      minWidth: 140,
      ...editableColumn('select')
    },
    {
      field: SGLA_ITEMS.DrawingNo,
      title: t('workflowWarehouse.drawingNo'),
      minWidth: 140,
      ...editableColumn()
    },
    {
      type: 'checkbox',
      title: t('workflowWarehouse.verified'),
      fixed: 'right',
      width: 88,
      align: 'center'
    }
  ]
}

export type VerificationTableColumn = ReturnType<typeof createVerificationTableColumns>[number]

export interface WHASupplyListVerifyTableContext {
  loading: Ref<boolean>
  tableData: Ref<any[]>
  tableConfig: any
  tableEvent: any
  tableRef: Ref<any>
  statusFilter: Ref<VerificationStatusFilter>
  statusCounts: Ref<Record<VerificationStatusFilter, number>>
  searchQuery: Ref<string>
  columns: VerificationTableColumn[]
  reload: () => void
  SGLA_ITEMS: typeof SGLA_ITEMS,
  batchEditDialogVisible: Ref<boolean>
  selectedColumn: Ref<string | undefined>
  applyBatchEdit: (val: string) => void
}

export const WHASupplyListVerifyTableKey: InjectionKey<WHASupplyListVerifyTableContext> = Symbol('WHASupplyListVerifyTable')

function generateParams(masterTableId: string) {
  return {
    tableId: SGLA_ITEMS_TABLE_ID,
    columns: [{ name: '*' }],
    orderBy: [
      { column: SGLA_ITEMS.Carton, desc: false },
      { column: 'created_at', desc: false }
    ],
    conditions: [
      {
        value: [
          {
            column: SGLA_ITEMS.MasterId,
            type: 'EQ',
            value: masterTableId
          }
        ],
        type: 'AND'
      }
    ]
  }
}

export function useWHASupplyListVerifyTableProvider(selectedInvoice: Ref<Record<string, any> | null>) {
  const { t } = useI18n()
  const verificationTableColumns = createVerificationTableColumns(t)
  const loading = ref(false)
  const statusFilter = ref<VerificationStatusFilter>('all')
  const searchQuery = ref('')
  const tableData = ref<Record<string, any>[]>([])
  const countryList = ref<SelectOption[]>([])



  /** U.S.A. / USA 等统一成可比较 key */
  function normalizeCountryKey(value: unknown): string {
    return String(value ?? '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^a-z0-9]+/g, '')
  }

  function buildCountryLookup(list: SelectOption[]) {
    const map = new Map<string, string | number>()
    const add = (key: unknown, code: string | number) => {
      const raw = String(key ?? '').trim()
      if (!raw) return
      map.set(raw.toLowerCase(), code)
      const normalized = normalizeCountryKey(raw)
      if (normalized) map.set(normalized, code)
    }
    for (const item of list) {
      add(item.label, item.value)
      add(item.value, item.value)
      const code = String(item.value ?? '')
        .trim()
        .toUpperCase()
      const aliases = COUNTRY_STATIC_ALIASES[code] ?? []
      aliases.forEach((alias) => add(alias, item.value))
    }
    return map
  }

  function normalizeCountryFields(rows: Record<string, any>[]) {
    if (!countryList.value.length) return rows
    const lookup = buildCountryLookup(countryList.value)
    const fields = [SGLA_ITEMS.CountryOfOrigin, SGLA_ITEMS.CountryOfWafer]
    return rows.map((row) => {
      const next = { ...row }
      fields.forEach((field) => {
        const raw = next[field]
        if (raw == null || raw === '') return
        const code = lookup.get(String(raw).toLowerCase()) ?? lookup.get(normalizeCountryKey(raw))
        if (code != null) next[field] = code
      })
      return next
    })
  }

  async function getCountryList() {
    try {
      const { data } = await postDynamicActions({
        table: 'cfg_country_dict',
        columns: [{ name: '*' }]
      })
      countryList.value = (data?.data ?? []).map((item: any) => ({
        label: item.country_name_en,
        value: item.country_code
      }))
      const selectFields = [SGLA_ITEMS.CountryOfOrigin, SGLA_ITEMS.CountryOfWafer]
      selectFields.forEach((field) => {
        const column = verificationTableColumns.find((col: any) => col.field === field) as any
        if (column?.editRender) {
          column.editRender.options = countryList.value
        }
      })
    } catch (error) {
      console.error(error)
      countryList.value = []
    }
  }
  function getFilteredItems(data: Record<string, any>[]) {
    let list = data
    if (statusFilter.value === 'ok') {
      list = list.filter((row) => !!row[SGLA_ITEMS.Checked])
    } else if (statusFilter.value === 'unVerified') {
      list = list.filter((row) => !row[SGLA_ITEMS.Checked])
    }
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((row) => SEARCH_FIELDS.some((field) => matchSearchValue(row[field], q)))
  }

  const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
    id: 'wha-receiving-verification-items',
    height: '100%',
    refresh: false,
    zoom: false,
    saveColumnOrder: false,
    columns: verificationTableColumns as any,
    virtualScroll: true,
    api: async () => {
      if (!countryList.value.length) await getCountryList()
      const data = await fetchTableData()
      const normalized = normalizeCountryFields(data)
      tableData.value = normalized
      return getFilteredItems(normalized)
    },
    headerActions:[
      [{
        code: 'batchEdit', name: 'BatchEdit', action: ({ menu, row, column }) => {
          batchEditDialogVisible.value = true
          selectedColumn.value = column.field
        }
      },]
    ],
    editRender: {
      editClosed: () => undefined,
      editConfig: {
        trigger: 'click',
        mode: 'cell',
        showIcon: false,
        showStatus: false
      }
    },
    optionalConfig: {
      border: 'inner',
      stripe: false,
      pagerConfig: { enabled: false },
      // type=checkbox 列上的 field 是 label，不是勾选绑定；勾选状态靠 checkField
      checkboxConfig: {
        checkField: SGLA_ITEMS.Checked,
        highlight: true,
        range: true
      },
      toolbarConfig: {
        custom: false,
        zoom: false,
        refresh: false,
        slots: { buttons: 'toolbar_buttons' }
      },
    }
  })

  // selected column for batch edit //
  const selectedColumn = ref<string | undefined>(undefined)
  const batchEditDialogVisible = ref(false)
  function applyBatchEdit(val: string) {
    if (!selectedColumn.value) return
    const {tableData} = tableRef.value.getTableData()
    tableData.forEach((row: any) => {
      row[selectedColumn.value] = val
    })
    batchEditDialogVisible.value = false
  }
  const statusCounts = computed(() => {
    const list = tableData.value
    return {
      all: list.length,
      unVerified: list.filter((row: any) => !row[SGLA_ITEMS.Checked]).length,
      ok: list.filter((row: any) => !!row[SGLA_ITEMS.Checked]).length
    }
  })

  async function fetchTableData() {
    const masterId = selectedInvoice.value?.id
    if (!masterId) return []

    loading.value = true
    try {
      const params = generateParams(masterId)
      const { data } = await postDynamicActions(params)
      // checkField 要求严格 boolean，接口可能返回 null/0/1/'true' 等
      return (data?.data ?? []).map((row: Record<string, any>) => ({
        ...row,
        [SGLA_ITEMS.Checked]: row[SGLA_ITEMS.Checked] === true || row[SGLA_ITEMS.Checked] === 1 || row[SGLA_ITEMS.Checked] === 'true'
      }))
    } catch (error) {
      console.error(error)
      return []
    } finally {
      loading.value = false
    }
  }

  const debouncedReload = useDebounceFn(() => reload(), 300)

  watch([() => statusFilter.value, () => searchQuery.value, () => selectedInvoice.value?.id], () => debouncedReload())
  const context: WHASupplyListVerifyTableContext = {
    loading,
    tableData,
    tableConfig,
    tableEvent,
    tableRef,
    statusFilter,
    statusCounts,
    searchQuery,
    columns: verificationTableColumns,
    reload,
    SGLA_ITEMS,
    batchEditDialogVisible,
    selectedColumn,
    applyBatchEdit
  }

  provide(WHASupplyListVerifyTableKey, context)

  return context
}

export function useWHASupplyListVerifyTableInject(): WHASupplyListVerifyTableContext {
  const context = inject(WHASupplyListVerifyTableKey)
  if (!context) {
    throw new Error('WHASupplyListVerifyTable context not found. Make sure useWHASupplyListVerifyTableProvider is called in a parent component.')
  }
  return context
}
