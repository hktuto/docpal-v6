import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { newClientApi, postDynamicActions } from 'api'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../utils/variableMapping'
import {
  applyBatchValueToColumn,
  applySelectOptionsToColumns,
  createRowFromColumns,
  createVerificationTableColumns,
  createVerificationTableOptions,
  fetchCountryList,
  filterTableItems,
  generateVerificationItemsParams,
  getFormDataFromColumns,
  getMissingRequiredLabels,
  getStatusCounts,
  normalizeCheckedField,
  normalizeCountryFields,
  rowMatchKey,
  toNumberOrNull,
  VERIFY_TABLE_COUNTRY_FIELDS,
  VERIFY_TABLE_SEARCH_FIELDS,
  type HighlightMatchKey,
  type SelectOption,
  type VerificationStatusFilter,
  type VerificationTableColumn,
  type VerificationTableContext
} from '../utils/tableHelper'

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
  /** Supplier_PN::PoLine → 高亮 */
  const highlightedMatchKeys = ref<Set<string>>(new Set())

  function itemMatchKey(row: Record<string, any>) {
    return rowMatchKey(row[SGLA_ITEMS.Supplier_PN], row[SGLA_ITEMS.PoLine])
  }

  function highlightMatchingRows(matches: HighlightMatchKey | HighlightMatchKey[]) {
    const list = Array.isArray(matches) ? matches : [matches]
    highlightedMatchKeys.value = new Set(list.map((m) => rowMatchKey(m.supplierPn, m.poLine)))
    nextTick(() => {
      tableRef.value?.updateData?.()
      const first = tableData.value.find((row) => highlightedMatchKeys.value.has(itemMatchKey(row)))
      if (first) tableRef.value?.scrollToRow?.(first)
    })
  }

  function clearMatchingRowHighlight() {
    highlightedMatchKeys.value = new Set()
    nextTick(() => tableRef.value?.updateData?.())
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
      applySelectOptionsToColumns(verificationTableColumns, VERIFY_TABLE_COUNTRY_FIELDS, countryList.value)
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
      searchFields: VERIFY_TABLE_SEARCH_FIELDS
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
      getRowClassName: (row) => (highlightedMatchKeys.value.has(itemMatchKey(row)) ? 'wha-verify-row-highlight' : ''),
      checkboxField: SGLA_ITEMS.Checked
    }),
    api: async () => {
      if (!countryList.value.length) await getCountryList()
      const data = await fetchTableData()
      const normalized = normalizeCountryFields(data, countryList.value)
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
    batchEditDialogVisible.value = false
  }
  const statusCounts = computed(() => getStatusCounts(tableData.value, SGLA_ITEMS.Checked))

  async function fetchTableData() {
    const masterId = selectedInvoice.value?.id
    if (!masterId) return []

    loading.value = true
    try {
      const params = generateVerificationItemsParams(masterId)
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

  /** insertRow 切 filter 时跳过一次 watch reload，避免冲掉滚到首行 */
  let skipNextFilterReload = false

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
        countryList.value
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
