import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createVerificationTableOptions,
  createRowFromColumns,
  editableColumn,
  filterTableItems,
  getMissingRequiredLabels,
  getStatusCounts,
  rowMatchKey,
  type HighlightMatchKey,
  type VerificationStatusFilter,
  type VerificationTableContext
} from '../utils/tableHelper'
import {
  CUST_PO_LINE,
  CUST_PO_SEARCH_FIELDS,
  addPoLine,
  createEmptyCustPoLine,
  deletePoLine,
  fetchPoLines,
  savePoLines,
  type CustPoHeader,
  type CustPoLine
} from '../utils/custPo'

function createCustPoTableColumns(t: (key: string) => string) {
  return [
    {
      type: 'seq',
      width: 56,
      align: 'right',
      fixed: 'left',
      title: t('workflowWarehouse.lineNo')
    },
    {
      field: CUST_PO_LINE.lineNum,
      title: t('workflowWarehouse.poLine'),
      minWidth: 90,
      type: 'number',
      ...editableColumn('number')
    },
    {
      field: CUST_PO_LINE.custPartNum,
      title: t('workflowWarehouse.customerPartNo'),
      minWidth: 160,
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
    },
    {
      field: CUST_PO_LINE.partNum,
      title: t('workflowWarehouse.wclPn'),
      minWidth: 140,
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
    },
    {
      field: CUST_PO_LINE.quantity,
      title: t('workflowWarehouse.qty'),
      minWidth: 100,
      type: 'number',
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('number')
    },
    {
      field: CUST_PO_LINE.unitPrice,
      title: t('workflowWarehouse.unitPrice'),
      minWidth: 120,
      type: 'number',
      ...editableColumn('number', { digits: 6, step: 0.000001 })
    },
    {
      field: CUST_PO_LINE.requestDate,
      title: t('workflowWarehouse.requestDate'),
      minWidth: 130,
      ...editableColumn()
    },
    {
      field: CUST_PO_LINE.piRemark,
      title: t('workflowWarehouse.piRemark'),
      minWidth: 120,
      ...editableColumn()
    },
    {
      field: CUST_PO_LINE.custPoNum,
      title: t('workflowWarehouse.linePoNo'),
      minWidth: 130,
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

export const WHPOListTableKey: InjectionKey<VerificationTableContext> = Symbol('WHPOListTable')

export function useWHPOListTableProvider(selectedPo: Ref<CustPoHeader | null>) {
  const { t } = useI18n()
  const verificationTableColumns = createCustPoTableColumns(t)
  const loading = ref(false)
  const creatingRow = ref(false)
  const statusFilter = ref<VerificationStatusFilter>('all')
  const searchQuery = ref('')
  const tableData = ref<CustPoLine[]>([])
  const highlightedMatchKeys = ref<Set<string>>(new Set())
  const hasHighlightedRows = computed(() => highlightedMatchKeys.value.size > 0)
  const locatedMatchKey = ref('')
  let skipNextFilterReload = false

  function itemMatchKey(row: Record<string, any>) {
    return rowMatchKey(row[CUST_PO_LINE.custPartNum], row[CUST_PO_LINE.lineNum])
  }

  function getFilteredItems(data: Record<string, any>[]) {
    return filterTableItems(data, {
      statusFilter: statusFilter.value,
      searchQuery: searchQuery.value,
      checkedField: CUST_PO_LINE.checked,
      searchFields: CUST_PO_SEARCH_FIELDS
    })
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

  function resetVerifiedMatches(matches: HighlightMatchKey | HighlightMatchKey[]) {
    const list = Array.isArray(matches) ? matches : [matches]
    const keys = new Set(list.map((m) => rowMatchKey(m.supplierPn, m.poLine)))
    let changed = false
    for (const row of tableData.value) {
      if (!keys.has(itemMatchKey(row)) || !row[CUST_PO_LINE.checked]) continue
      row[CUST_PO_LINE.checked] = false
      tableRef.value?.setCheckboxRow?.(row, false)
      changed = true
    }
    if (changed) nextTick(() => tableRef.value?.updateData?.())
    return changed
  }

  const requiredColumns = verificationTableColumns.filter((col: any) => col.required && col.field)

  function assertCanVerify(row: Record<string, any>, options?: { silent?: boolean }) {
    const missing = getMissingRequiredLabels(row, requiredColumns as Array<{ field: string; title: string }>)
    if (!missing.length) return true
    row[CUST_PO_LINE.checked] = false
    nextTick(() => tableRef.value?.setCheckboxRow?.(row, false))
    if (!options?.silent) {
      ElMessage.warning(t('render.hint.fieldRequired', { name: missing.join(', ') }))
    }
    return false
  }

  async function deleteRow(row: Record<string, any>) {
    if (!row?.id || !selectedPo.value) return
    try {
      await ElMessageBox.confirm(t('contextMenu.confirmDelete'), t('dpTip_warning'), {
        type: 'warning',
        confirmButtonText: t('common_delete'),
        cancelButtonText: t('common_cancel')
      })
      await deletePoLine(selectedPo.value, row.id)
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

  const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
    id: 'wh-po-list-verification-items',
    applyDefaultMinWidth: false,
    ...createVerificationTableOptions({
      t,
      columns: verificationTableColumns,
      enableHeaderActions: false,
      onCopy: (row) => copyRow(row),
      onDelete: (row) => deleteRow(row),
      getRowClassName: (row) => {
        const key = itemMatchKey(row)
        if (locatedMatchKey.value === key) return 'wha-verify-row-located'
        if (highlightedMatchKeys.value.has(key)) return 'wha-verify-row-highlight'
        return ''
      },
      checkboxField: CUST_PO_LINE.checked
    }),
    api: async () => {
      const data = await fetchTableData()
      tableData.value = data
      return getFilteredItems(data)
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
      const invalid = (tableRef.value?.getCheckboxRecords?.() || []).filter(
        (row: Record<string, any>) => !assertCanVerify(row, { silent: true })
      )
      if (invalid.length) {
        ElMessage.warning(t('render.hint.fieldRequired', { name: requiredColumns.map((col: any) => col.title).join(', ') }))
      }
    })
  }

  tableEvent.checkboxRangeChange = () => {
    nextTick(() => {
      ;(tableRef.value?.getCheckboxRecords?.() || []).forEach((row: Record<string, any>) => {
        if (row[CUST_PO_LINE.checked]) assertCanVerify(row, { silent: true })
      })
    })
  }

  const statusCounts = computed(() => getStatusCounts(tableData.value, CUST_PO_LINE.checked))

  async function fetchTableData() {
    const header = selectedPo.value
    if (!header) return []
    loading.value = true
    try {
      return await fetchPoLines(header)
    } catch (error) {
      console.error(error)
      return []
    } finally {
      loading.value = false
    }
  }

  async function insertRow(payload: CustPoLine) {
    if (!selectedPo.value || creatingRow.value) return false
    creatingRow.value = true
    try {
      const insertedRow = await addPoLine(selectedPo.value, payload)
      tableData.value.unshift(insertedRow)
      if (statusFilter.value !== 'all') {
        skipNextFilterReload = true
        statusFilter.value = 'all'
      }
      const grid = tableRef.value as any
      await grid?.loadData?.(getFilteredItems(tableData.value))
      await nextTick()
      grid?.scrollTo?.(0, 0)
      grid?.setEditCell?.(insertedRow, CUST_PO_LINE.custPartNum)
      const column = verificationTableColumns.find((col: any) => col.field === CUST_PO_LINE.custPartNum)
      focusEditCell(column as any, insertedRow)
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
    const headerId = selectedPo.value?.id
    if (!headerId) return
    await insertRow(createEmptyCustPoLine(headerId, { cust_po_num: selectedPo.value?.cust_po_num ?? '' }))
  }

  async function copyRow(row: Record<string, any>) {
    const headerId = selectedPo.value?.id
    if (!headerId || !row) return
    const payload = createRowFromColumns(
      verificationTableColumns,
      {
        id: undefined,
        header_id: headerId,
        checked: false
      },
      row
    ) as CustPoLine
    const ok = await insertRow(createEmptyCustPoLine(headerId, { ...payload, id: undefined, checked: false }))
    if (ok) ElMessage.success(t('common_copySuccess'))
  }

  const debouncedReload = useDebounceFn(() => reload(), 300)

  watch([() => statusFilter.value, () => searchQuery.value, () => selectedPo.value?.id], () => {
    if (skipNextFilterReload) {
      skipNextFilterReload = false
      return
    }
    debouncedReload()
  })

  async function saveTableData() {
    if (!selectedPo.value) return
    await savePoLines(selectedPo.value, tableData.value)
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
    highlightMatchingRows,
    clearMatchingRowHighlight,
    hasHighlightedRows,
    scrollToMatchingRow,
    resetVerifiedMatches,
    addRow,
    saveTableData
  }

  provide(WHPOListTableKey, context)
  return context
}

export function useWHPOListTableInject(): VerificationTableContext {
  const context = inject(WHPOListTableKey)
  if (!context) {
    throw new Error('WHPOListTable context not found. Make sure useWHPOListTableProvider is called in a parent component.')
  }
  return context
}
