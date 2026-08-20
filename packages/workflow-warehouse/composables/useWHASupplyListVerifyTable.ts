import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { newClientApi, postDynamicActions } from 'api'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../utils/variableMapping'
import { COUNTRY_STATIC_ALIASES } from '../utils/countryAliases'

export type VerificationStatusFilter = 'all' | 'ok' | 'unVerified'

export type HighlightMatchKey = {
  supplierPn: string | number
  poLine: string | number
}

const SEARCH_FIELDS = [SGLA_ITEMS.Carton, SGLA_ITEMS.Supplier_PN, SGLA_ITEMS.WCL_PN, SGLA_ITEMS.Qty, SGLA_ITEMS.PoLine] as const

function matchSearchValue(value: unknown, query: string): boolean {
  if (value == null || value === '') return false
  return String(value).toLowerCase().includes(query)
}

function rowMatchKey(supplierPn: unknown, poLine: unknown) {
  return `${String(supplierPn ?? '').trim()}::${String(poLine ?? '').trim()}`
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
        autofocus: '.vxe-input--inner',
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
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
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
      field: SGLA_ITEMS.Qty,
      title: t('workflowWarehouse.qty'),
      minWidth: 90,
      type: 'number',
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('number')
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

export type VerificationTableColumn = ReturnType<typeof createVerificationTableColumns>[number]

export interface WHASupplyListVerifyTableContext {
  loading: Ref<boolean>
  creatingRow: Ref<boolean>
  tableData: Ref<any[]>
  tableConfig: any
  tableEvent: any
  tableRef: Ref<any>
  statusFilter: Ref<VerificationStatusFilter>
  statusCounts: Ref<Record<VerificationStatusFilter, number>>
  searchQuery: Ref<string>
  columns: VerificationTableColumn[]
  reload: () => void
  SGLA_ITEMS: typeof SGLA_ITEMS
  batchEditDialogVisible: Ref<boolean>
  selectedColumn: Ref<string | undefined>
  applyBatchEdit: (val: string) => void
  /** 按 Supplier_PN + PoLine 高亮匹配行（红底），可传单条或数组 */
  highlightMatchingRows: (matches: HighlightMatchKey | HighlightMatchKey[]) => void
  clearMatchingRowHighlight: () => void
  addRow: () => Promise<void>
  saveTableData: () => Promise<void>
}

export const WHASupplyListVerifyTableKey: InjectionKey<WHASupplyListVerifyTableContext> = Symbol('WHASupplyListVerifyTable')

function generateParams(masterTableId: string) {
  return {
    tableId: SGLA_ITEMS_TABLE_ID,
    columns: [{ name: '*' }],
    orderBy: [
      { column: 'created_at', desc: false }
      // { column: SGLA_ITEMS.Carton, desc: false }
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
  const creatingRow = ref(false)
  const statusFilter = ref<VerificationStatusFilter>('all')
  const searchQuery = ref('')
  const tableData = ref<Record<string, any>[]>([])
  const countryList = ref<SelectOption[]>([])
  /** Supplier_PN::PoLine → 高亮 */
  const highlightedMatchKeys = ref<Set<string>>(new Set())

  function highlightMatchingRows(matches: HighlightMatchKey | HighlightMatchKey[]) {
    const list = Array.isArray(matches) ? matches : [matches]
    highlightedMatchKeys.value = new Set(list.map((m) => rowMatchKey(m.supplierPn, m.poLine)))
    nextTick(() => {
      tableRef.value?.updateData?.()
      const first = tableData.value.find((row) => highlightedMatchKeys.value.has(rowMatchKey(row[SGLA_ITEMS.Supplier_PN], row[SGLA_ITEMS.PoLine])))
      if (first) tableRef.value?.scrollToRow?.(first)
    })
  }

  function clearMatchingRowHighlight() {
    highlightedMatchKeys.value = new Set()
    nextTick(() => tableRef.value?.updateData?.())
  }
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

  const requiredColumns = verificationTableColumns.filter((col: any) => col.required && col.field)

  /** 返回未填必填列标题；空数组表示可勾选 */
  function getMissingRequiredLabels(row: Record<string, any>) {
    return requiredColumns.filter((col: any) => row[col.field] == null || row[col.field] === '').map((col: any) => col.title)
  }

  /** 勾选为 true 时校验必填；不通过则回滚。cancelWarn 用于批量时由外层统一提示 */
  function assertCanVerify(row: Record<string, any>, options?: { silent?: boolean }) {
    const missing = getMissingRequiredLabels(row)
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
      nextHighlightedKeys.delete(rowMatchKey(row[SGLA_ITEMS.Supplier_PN], row[SGLA_ITEMS.PoLine]))
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
    headerActions: [
      [
        {
          code: 'batchEdit',
          name: 'BatchEdit',
          action: ({ menu, row, column }) => {
            batchEditDialogVisible.value = true
            selectedColumn.value = column.field
          }
        }
      ]
    ],
    bodyActions: [
      [
        {
          code: 'delete',
          name: t('mdTable.deleteRow'),
          action: ({ row }) => deleteRow(row)
        }
      ]
    ],
    permissionMethod: ({ row }) => {
      return {
        visible: !!row,
        disabled: false
      }
    },
    editRender: {
      editClosed: () => undefined,
      editConfig: {
        trigger: 'click',
        mode: 'cell',
        showIcon: false,
        showStatus: false,
        autoFocus: true
      }
    },
    optionalConfig: {
      border: 'inner',
      stripe: false,
      mouseConfig: {
        selected: true
      },
      keyboardConfig: {
        isEsc: true
      },
      pagerConfig: { enabled: false },
      rowClassName: ({ row }: { row: Record<string, any> }) =>
        highlightedMatchKeys.value.has(rowMatchKey(row[SGLA_ITEMS.Supplier_PN], row[SGLA_ITEMS.PoLine])) ? 'wha-verify-row-highlight' : '',
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
      }
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

  // selected column for batch edit //
  const selectedColumn = ref<string | undefined>(undefined)
  const batchEditDialogVisible = ref(false)
  function applyBatchEdit(val: string) {
    if (!selectedColumn.value) return
    const { tableData } = tableRef.value.getTableData()
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

  function createEmptyRow(masterId: string) {
    return {
      [SGLA_ITEMS.MasterId]: masterId,
      [SGLA_ITEMS.Carton]: '',
      [SGLA_ITEMS.Supplier_PN]: '',
      [SGLA_ITEMS.WCL_PN]: '',
      [SGLA_ITEMS.Qty]: null,
      [SGLA_ITEMS.PoLine]: '',
      [SGLA_ITEMS.SupplierItemRefNo]: '',
      [SGLA_ITEMS.DateCode]: '',
      [SGLA_ITEMS.CountryOfOrigin]: '',
      [SGLA_ITEMS.CountryOfWafer]: '',
      [SGLA_ITEMS.DrawingNo]: '',
      [SGLA_ITEMS.Remark]: '',
      [SGLA_ITEMS.Checked]: false
    }
  }

  async function addRow() {
    const masterId = selectedInvoice.value?.id
    if (!masterId || creatingRow.value) return

    creatingRow.value = true
    try {
      const { data } = await newClientApi.postDynamicDbTableTableidData(SGLA_ITEMS_TABLE_ID, {
        data: createEmptyRow(masterId)
      })
      const insertedRow = normalizeCountryFields([
        {
          id: data?.id,
          ...(data?.data?.data ?? {}),
          [SGLA_ITEMS.Qty]: data?.data?.data?.[SGLA_ITEMS.Qty] ?? null,
          [SGLA_ITEMS.Checked]: !!data?.data?.data?.[SGLA_ITEMS.Checked]
        }
      ])[0]

      if (!insertedRow?.id) return

      tableData.value.unshift(insertedRow)
      statusFilter.value = 'all'
      const grid = tableRef.value as any
      grid?.loadData?.(getFilteredItems(tableData.value))

      nextTick(() => {
        grid?.scrollToRow?.(insertedRow)
        grid?.setEditCell?.(insertedRow, SGLA_ITEMS.Supplier_PN)
        const supplierPnColumn = verificationTableColumns.find((col: any) => col.field === SGLA_ITEMS.Supplier_PN)
        focusEditCell(supplierPnColumn as any, insertedRow)
      })
    } catch (error) {
      console.error(error)
    } finally {
      creatingRow.value = false
    }
  }

  const debouncedReload = useDebounceFn(() => reload(), 300)

  watch([() => statusFilter.value, () => searchQuery.value, () => selectedInvoice.value?.id], () => debouncedReload())

  function getFormData() {
    // checkbox 列用 checkField 绑定，列上没有 field，需显式带上 Checked
    const fields = verificationTableColumns.map((column: any) => column.field).filter((item): item is string => item !== undefined)
    const formFields = [...new Set([...fields, SGLA_ITEMS.Checked, 'id'])]
    return tableData.value.map((item) => {
      const data: Record<string, any> = {}
      formFields.forEach((field) => {
        if (field === SGLA_ITEMS.Checked) {
          data[field] = !!item[field]
          return
        }
        const fieldColumn = verificationTableColumns.find((column: any) => column.field === field)
        if (fieldColumn?.type === 'number') {
          data[field] = Number(item[field])
        } else {
          data[field] = item[field] ?? ''
        }
      })
      return data
    })
  }

  async function saveTableData() {
    const data = getFormData()
    await newClientApi.patchDynamicDbTableTableidDataBatchTransactional(SGLA_ITEMS_TABLE_ID, { data })
  }

  const context: WHASupplyListVerifyTableContext = {
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
    SGLA_ITEMS,
    batchEditDialogVisible,
    selectedColumn,
    applyBatchEdit,
    highlightMatchingRows,
    clearMatchingRowHighlight,
    addRow,
    saveTableData
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
