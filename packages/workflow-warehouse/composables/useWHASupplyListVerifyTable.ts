import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { clientApi, newClientApi, postDynamicActions } from 'api'
import { SGLA, SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../utils/variableMapping'
import {
  applyBatchValueToColumn,
  applySelectOptionsToColumns,
  createRowFromColumns,
  createVerificationTableOptions,
  editableColumn,
  fetchCountryList,
  filterTableItems,
  generateMasterDetailParams,
  getFormDataFromColumns,
  getMissingRequiredLabels,
  getStatusCounts,
  normalizeCheckedField,
  normalizeCountryFields,
  rowMatchKey,
  toNumberOrNull,
  type HighlightMatchKey,
  type SelectOption,
  type VerificationStatusFilter,
  type VerificationTableContext
} from '../utils/tableHelper'

const SEARCH_FIELDS = [
  SGLA_ITEMS.Carton,
  SGLA_ITEMS.Supplier_PN,
  SGLA_ITEMS.WCL_PN,
  SGLA_ITEMS.Qty,
  SGLA_ITEMS.PoLine
] as const

const COUNTRY_FIELDS = [SGLA_ITEMS.CountryOfOrigin, SGLA_ITEMS.CountryOfWafer]

function createVerificationTableColumns(t: (key: string) => string) {
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
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('select')
    },
    {
      field: SGLA_ITEMS.WCL_PN,
      title: t('workflowWarehouse.wclPn'),
      minWidth: 170,
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.DrawingNo,
      title: t('workflowWarehouse.drawingNo'),
      minWidth: 140,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.Qty,
      title: t('workflowWarehouse.qty'),
      minWidth: 90,
      type: 'number',
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('number')
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
      field: SGLA_ITEMS.PoLine,
      title: t('workflowWarehouse.po'),
      minWidth: 140,
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.SupplierItemRefNo,
      title: t('workflowWarehouse.SupplierItemRefNo'),
      minWidth: 140,
      ...editableColumn()
    },
    {
      field: SGLA_ITEMS.Remark,
      title: t('workflowWarehouse.remark'),
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

export const WHASupplyListVerifyTableKey: InjectionKey<VerificationTableContext> = Symbol('WHASupplyListVerifyTable')

export function useWHASupplyListVerifyTableProvider(selectedInvoice: Ref<Record<string, any> | null>) {
  const { t } = useI18n()
  const verificationTableColumns = createVerificationTableColumns(t)
  const loading = ref(false)
  const creatingRow = ref(false)
  const statusFilter = ref<VerificationStatusFilter>('all')
  const searchQuery = ref('')
  const tableData = ref<Record<string, any>[]>([])
  const countryList = ref<SelectOption[]>([])
  const vendorItemOptions = ref<SelectOption[]>([])
  /** vendor_item_no → wcl_item_no */
  const vendorItemToWclMap = ref<Map<string, string>>(new Map())
  let lastFetchedInvoiceNum = ''
  /** Supplier_PN::PoLine → 问题行红底 */
  const highlightedMatchKeys = ref<Set<string>>(new Set())
  /** 当前点击定位的行 → 黄底 */
  const locatedMatchKey = ref('')
  /** insertRow / 定位行切 filter 时跳过一次 watch reload */
  let skipNextFilterReload = false

  function itemMatchKey(row: Record<string, any>) {
    return rowMatchKey(row[SGLA_ITEMS.Supplier_PN], row[SGLA_ITEMS.PoLine])
  }

  function syncWclPnFromVendorItem(row: Record<string, any>, vendorItemNo?: unknown) {
    const value = String(vendorItemNo ?? row[SGLA_ITEMS.Supplier_PN] ?? '').trim()
    row[SGLA_ITEMS.Supplier_PN] = value
    row[SGLA_ITEMS.WCL_PN] = value ? (vendorItemToWclMap.value.get(value) ?? '') : ''
  }

  function applyVendorItemOptions(options: SelectOption[]) {
    vendorItemOptions.value = options
    applySelectOptionsToColumns(verificationTableColumns, [SGLA_ITEMS.Supplier_PN], options)
  }

  function bindSupplierPnSelectEvents() {
    const column = verificationTableColumns.find((col: any) => col.field === SGLA_ITEMS.Supplier_PN)
    if (!column?.editRender) return
    column.editRender.events = {
      change: ({ row }: { row: Record<string, any> }, eventParams?: { value?: unknown }) => {
        syncWclPnFromVendorItem(row, eventParams?.value)
      }
    }
  }
  bindSupplierPnSelectEvents()

  function mergeExistingVendorItemOptions(rows: Record<string, any>[]) {
    if (!rows.length) return
    const existing = new Set(vendorItemOptions.value.map((item) => String(item.value)))
    const extras: SelectOption[] = []
    for (const row of rows) {
      const value = String(row[SGLA_ITEMS.Supplier_PN] ?? '').trim()
      if (!value || existing.has(value)) continue
      existing.add(value)
      extras.push({ label: value, value })
    }
    if (extras.length) applyVendorItemOptions([...vendorItemOptions.value, ...extras])
  }

  async function fetchVendorItemOptions() {
    const invoiceNum = String(selectedInvoice.value?.[SGLA.Name] ?? '').trim()
    if (!invoiceNum) {
      lastFetchedInvoiceNum = ''
      vendorItemToWclMap.value = new Map()
      applyVendorItemOptions([])
      return
    }
    if (invoiceNum === lastFetchedInvoiceNum) return

    try {
      const { data } = await clientApi.instance.get('/v1/ms/oracle/rcv-shipments', {
        baseURL: '/apis',
        params: { invoiceNum }
      })
      const items = data?.items ?? []
      const map = new Map<string, string>()
      const options: SelectOption[] = []
      const seen = new Set<string>()
      for (const item of items) {
        const vendorItemNo = String(item?.vendor_item_no ?? '').trim()
        if (!vendorItemNo || seen.has(vendorItemNo)) continue
        seen.add(vendorItemNo)
        options.push({ label: vendorItemNo, value: vendorItemNo })
        const wclItemNo = String(item?.wcl_item_no ?? '').trim()
        if (wclItemNo) map.set(vendorItemNo, wclItemNo)
      }
      vendorItemToWclMap.value = map
      applyVendorItemOptions(options)
      lastFetchedInvoiceNum = invoiceNum
    } catch (error) {
      console.error(error)
      vendorItemToWclMap.value = new Map()
      applyVendorItemOptions([])
      lastFetchedInvoiceNum = ''
    }
  }

  function highlightMatchingRows(matches: HighlightMatchKey | HighlightMatchKey[]) {
    const list = Array.isArray(matches) ? matches : [matches]
    highlightedMatchKeys.value = new Set(list.map((m) => rowMatchKey(m.supplierPn, m.poLine)))
    locatedMatchKey.value = ''
    nextTick(() => tableRef.value?.updateData?.())
  }

  function clearMatchingRowHighlight() {
    highlightedMatchKeys.value = new Set()
    locatedMatchKey.value = ''
    nextTick(() => tableRef.value?.updateData?.())
  }

  async function scrollToMatchingRow(match: HighlightMatchKey) {
    const key = rowMatchKey(match.supplierPn, match.poLine)
    const row = tableData.value.find((item) => itemMatchKey(item) === key)
    if (!row) return

    const isVisible = getFilteredItems(tableData.value).some((item) => itemMatchKey(item) === key)
    if (!isVisible) {
      skipNextFilterReload = true
      statusFilter.value = 'all'
      searchQuery.value = ''
      await (tableRef.value as any)?.loadData?.(getFilteredItems(tableData.value))
    }

    locatedMatchKey.value = key
    await nextTick()
    tableRef.value?.updateData?.()
    tableRef.value?.scrollToRow?.(row)
  }

  /** 将匹配行的 verified(Checked) 置为 false，返回是否有变更 */
  function resetVerifiedMatches(matches: HighlightMatchKey | HighlightMatchKey[]) {
    const list = Array.isArray(matches) ? matches : [matches]
    const keys = new Set(list.map((m) => rowMatchKey(m.supplierPn, m.poLine)))
    let changed = false
    for (const row of tableData.value) {
      if (!keys.has(itemMatchKey(row)) || !row[SGLA_ITEMS.Checked]) continue
      row[SGLA_ITEMS.Checked] = false
      tableRef.value?.setCheckboxRow?.(row, false)
      changed = true
    }
    if (changed) nextTick(() => tableRef.value?.updateData?.())
    return changed
  }

  async function getCountryList() {
    try {
      countryList.value = await fetchCountryList()
      applySelectOptionsToColumns(verificationTableColumns, COUNTRY_FIELDS, countryList.value)
    } catch (error) {
      console.error(error)
      countryList.value = []
    }
  }

  function getFilteredItems(data: Record<string, any>[]) {
    return filterTableItems(data, {
      statusFilter: statusFilter.value,
      searchQuery: searchQuery.value,
      checkedField: SGLA_ITEMS.Checked,
      searchFields: SEARCH_FIELDS
    })
  }

  const requiredColumns = verificationTableColumns.filter((col: any) => col.required && col.field)

  /** 勾选为 true 时校验必填；不通过则回滚。cancelWarn 用于批量时由外层统一提示 */
  function assertCanVerify(row: Record<string, any>, options?: { silent?: boolean }) {
    const missing = getMissingRequiredLabels(row, requiredColumns as Array<{ field: string; title: string }>)
    if (!missing.length) return true
    row[SGLA_ITEMS.Checked] = false
    nextTick(() => tableRef.value?.setCheckboxRow?.(row, false))
    if (!options?.silent) {
      ElMessage.warning(t('render.hint.fieldRequired', { name: missing.join(', ') }))
    }
    return false
  }

  async function deleteRow(row: Record<string, any>) {
    if (!row?.id) return

    try {
      await ElMessageBox.confirm(t('contextMenu.confirmDelete'), t('dpTip_warning'), {
        type: 'warning',
        confirmButtonText: t('common_delete'),
        cancelButtonText: t('common_cancel')
      })
      await newClientApi.deleteDynamicDbTableTableidDataDataid(SGLA_ITEMS_TABLE_ID, row.id)
      tableData.value = tableData.value.filter((item) => item.id !== row.id)
      const nextHighlightedKeys = new Set(highlightedMatchKeys.value)
      nextHighlightedKeys.delete(itemMatchKey(row))
      highlightedMatchKeys.value = nextHighlightedKeys
      const grid = tableRef.value as any
      grid?.loadData?.(getFilteredItems(tableData.value))
      ElMessage.success(t('common_deleteSuccess'))
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      console.error(error)
      ElMessage.error(t('common_deleteFail'))
    }
  }

  // selected column for batch edit
  const selectedColumn = ref<string | undefined>(undefined)
  const batchEditDialogVisible = ref(false)

  const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
    id: 'wha-receiving-verification-items',
    ...createVerificationTableOptions({
      t,
      columns: verificationTableColumns,
      onBatchEdit: (field) => {
        batchEditDialogVisible.value = true
        selectedColumn.value = field
      },
      onCopy: (row) => copyRow(row),
      onDelete: (row) => deleteRow(row),
      getRowClassName: (row) => {
        const key = itemMatchKey(row)
        if (locatedMatchKey.value === key) return 'wha-verify-row-located'
        if (highlightedMatchKeys.value.has(key)) return 'wha-verify-row-highlight'
        return ''
      },
      checkboxField: SGLA_ITEMS.Checked,
      onEditClosed: ({ row, column }) => {
        // fallback：清空/离开单元格时再对齐一次
        if (column?.field === SGLA_ITEMS.Supplier_PN) syncWclPnFromVendorItem(row)
      }
    }),
    api: async () => {
      if (!countryList.value.length) await getCountryList()
      await fetchVendorItemOptions()
      const data = await fetchTableData()
      const normalized = normalizeCountryFields(data, countryList.value, COUNTRY_FIELDS)
      mergeExistingVendorItemOptions(normalized)
      tableData.value = normalized
      return getFilteredItems(normalized)
    }
  })

  const { focusEditCell, keyboardConfig, onEditActivated } = useVxeGridCellKeyboard(tableRef, {
    getVisibleRows: () => getFilteredItems(tableData.value)
  })
  Object.assign(tableConfig.keyboardConfig ?? {}, keyboardConfig)
  tableEvent.editActivated = onEditActivated

  tableEvent.checkboxChange = ({ checked, row }: { checked: boolean; row: Record<string, any> }) => {
    if (checked) assertCanVerify(row)
  }

  tableEvent.checkboxAll = ({ checked }: { checked: boolean }) => {
    if (!checked) return
    nextTick(() => {
      const invalid = (tableRef.value?.getCheckboxRecords?.() || []).filter((row: Record<string, any>) => !assertCanVerify(row, { silent: true }))
      if (invalid.length) {
        ElMessage.warning(t('render.hint.fieldRequired', { name: requiredColumns.map((col: any) => col.title).join(', ') }))
      }
    })
  }

  tableEvent.checkboxRangeChange = () => {
    nextTick(() => {
      ;(tableRef.value?.getCheckboxRecords?.() || []).forEach((row: Record<string, any>) => {
        if (row[SGLA_ITEMS.Checked]) assertCanVerify(row, { silent: true })
      })
    })
  }

  function applyBatchEdit(val: string) {
    applyBatchValueToColumn(tableRef.value, selectedColumn.value, val)
    if (selectedColumn.value === SGLA_ITEMS.Supplier_PN) {
      const wcl = String(val ?? '').trim() ? (vendorItemToWclMap.value.get(String(val).trim()) ?? '') : ''
      applyBatchValueToColumn(tableRef.value, SGLA_ITEMS.WCL_PN, wcl)
    }
    batchEditDialogVisible.value = false
  }
  const statusCounts = computed(() => getStatusCounts(tableData.value, SGLA_ITEMS.Checked))

  async function fetchTableData() {
    const masterId = selectedInvoice.value?.id
    if (!masterId) return []

    loading.value = true
    try {
      const orderBy = [
        { column: SGLA_ITEMS.Carton, desc: false },
        { column: SGLA_ITEMS.PoLine, desc: false },
      ]
      const params = generateMasterDetailParams(SGLA_ITEMS_TABLE_ID, SGLA_ITEMS.MasterId, masterId, orderBy)
      const { data } = await postDynamicActions(params)
      return normalizeCheckedField(data?.data ?? [], SGLA_ITEMS.Checked)
    } catch (error) {
      console.error(error)
      return []
    } finally {
      loading.value = false
    }
  }

  function createEmptyRow(masterId: string) {
    return createRowFromColumns(verificationTableColumns, {
      [SGLA_ITEMS.MasterId]: masterId,
      [SGLA_ITEMS.Checked]: false
    })
  }

  function createRowPayloadFromSource(masterId: string, source: Record<string, any>) {
    return createRowFromColumns(
      verificationTableColumns,
      {
        [SGLA_ITEMS.MasterId]: masterId,
        [SGLA_ITEMS.Checked]: false
      },
      source
    )
  }

  async function insertRow(payload: Record<string, any>) {
    if (creatingRow.value) return false

    creatingRow.value = true
    try {
      const { data } = await newClientApi.postDynamicDbTableTableidData(SGLA_ITEMS_TABLE_ID, {
        data: payload
      })
      const insertedRow = normalizeCountryFields(
        [
          {
            id: data?.id,
            ...(data?.data?.data ?? {}),
            [SGLA_ITEMS.Qty]: toNumberOrNull(data?.data?.data?.[SGLA_ITEMS.Qty]),
            [SGLA_ITEMS.Checked]: !!data?.data?.data?.[SGLA_ITEMS.Checked]
          }
        ],
        countryList.value,
        COUNTRY_FIELDS
      )[0]

      if (!insertedRow?.id) return false

      tableData.value.unshift(insertedRow)
      if (statusFilter.value !== 'all') {
        skipNextFilterReload = true
        statusFilter.value = 'all'
      }
      const grid = tableRef.value as any
      await grid?.loadData?.(getFilteredItems(tableData.value))

      await nextTick()
      // 新行在顶部；虚拟滚动下 scrollToRow 不稳定，直接滚到第一行
      grid?.scrollTo?.(0, 0)
      grid?.setEditCell?.(insertedRow, SGLA_ITEMS.Supplier_PN)
      const supplierPnColumn = verificationTableColumns.find((col: any) => col.field === SGLA_ITEMS.Supplier_PN)
      focusEditCell(supplierPnColumn as any, insertedRow)
      return true
    } catch (error) {
      console.error(error)
      ElMessage.error(t('common_addFail'))
      return false
    } finally {
      creatingRow.value = false
    }
  }

  async function addRow() {
    const masterId = selectedInvoice.value?.id
    if (!masterId) return
    await insertRow(createEmptyRow(masterId))
  }

  async function copyRow(row: Record<string, any>) {
    const masterId = selectedInvoice.value?.id
    if (!masterId || !row) return
    const ok = await insertRow(createRowPayloadFromSource(masterId, row))
    if (ok) ElMessage.success(t('common_copySuccess'))
  }

  const debouncedReload = useDebounceFn(() => reload(), 300)

  watch([() => statusFilter.value, () => searchQuery.value, () => selectedInvoice.value?.id], () => {
    if (skipNextFilterReload) {
      skipNextFilterReload = false
      return
    }
    debouncedReload()
  })

  watch(
    () => selectedInvoice.value?.[SGLA.Name],
    () => {
      lastFetchedInvoiceNum = ''
    }
  )

  function getFormData() {
    return getFormDataFromColumns(tableData.value, verificationTableColumns, [SGLA_ITEMS.Checked, 'id'], [SGLA_ITEMS.Checked])
  }

  async function saveTableData() {
    const data = getFormData()
    await newClientApi.patchDynamicDbTableTableidDataBatchTransactional(SGLA_ITEMS_TABLE_ID, { data })
  }

  const context: VerificationTableContext = {
    loading,
    creatingRow,
    tableData,
    tableConfig,
    tableEvent,
    tableRef,
    statusFilter,
    statusCounts,
    searchQuery,
    columns: verificationTableColumns,
    reload,
    batchEditDialogVisible,
    selectedColumn,
    applyBatchEdit,
    highlightMatchingRows,
    clearMatchingRowHighlight,
    scrollToMatchingRow,
    resetVerifiedMatches,
    addRow,
    saveTableData
  }

  provide(WHASupplyListVerifyTableKey, context)

  return context
}

export function useWHASupplyListVerifyTableInject(): VerificationTableContext {
  const context = inject(WHASupplyListVerifyTableKey)
  if (!context) {
    throw new Error('WHASupplyListVerifyTable context not found. Make sure useWHASupplyListVerifyTableProvider is called in a parent component.')
  }
  return context
}
