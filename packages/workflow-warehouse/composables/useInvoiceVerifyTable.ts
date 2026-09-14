import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import {
  createInvoiceVerificationTableColumns,
  createVerificationTableOptions,
  filterTableItems,
  rowMatchKey,
  type HighlightMatchKey,
  type VerificationStatusFilter,
  type VerificationTableContext
} from '../utils/tableHelper'
import {
  createEmptyGitInvoiceLine,
  getGitLineStatusCounts,
  GIT_INVOICE_SEARCH_FIELDS,
  isGitLineMatched,
  type GitInvoice,
  type GitInvoiceLineItem
} from '../utils/gitInvoice'
import type { InvoiceVerifyContext } from './useInvoiceVerify'

export const InvoiceVerifyTableKey: InjectionKey<VerificationTableContext> = Symbol('InvoiceVerifyTable')

export function useInvoiceVerifyTableProvider(
  selectedInvoice: Ref<GitInvoice | null>,
  invoiceCtx: Pick<InvoiceVerifyContext, 'updateInvoiceData' | 'runMatching' | 'fetchGroupId' | 'refreshSelectedInvoice'>
) {
  const { t } = useI18n()
  const verificationTableColumns = createInvoiceVerificationTableColumns(t)
  const loading = ref(false)
  const matchingLoading = ref(false)
  const creatingRow = ref(false)
  const statusFilter = ref<VerificationStatusFilter>('all')
  const searchQuery = ref('')
  const tableData = ref<GitInvoiceLineItem[]>([])
  const highlightedMatchKeys = ref<Set<string>>(new Set())
  const dirtyRowIds = ref(new Set<string>())

  function markRowDirty(row: Record<string, any> | null | undefined) {
    if (row?.id) dirtyRowIds.value.add(String(row.id))
  }

  function itemMatchKey(row: Record<string, any>) {
    return rowMatchKey(row.vendor_item_no, row.po_no)
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

  function getFilteredItems(data: Record<string, any>[]) {
    return filterTableItems(data, {
      statusFilter: statusFilter.value,
      searchQuery: searchQuery.value,
      isOk: isGitLineMatched,
      searchFields: GIT_INVOICE_SEARCH_FIELDS
    })
  }

  async function deleteRow(row: Record<string, any>) {
    const invoiceId = selectedInvoice.value?.id
    if (!invoiceId || !row?.id || matchingLoading.value) return

    try {
      await ElMessageBox.confirm(t('contextMenu.confirmDelete'), t('dpTip_warning'), {
        type: 'warning',
        confirmButtonText: t('common_delete'),
        cancelButtonText: t('common_cancel')
      })
      await newClientApi.deleteWmsGitInvoiceIdItemItemid(invoiceId, row.id)
      tableData.value = tableData.value.filter((item) => item.id !== row.id)
      if (selectedInvoice.value) selectedInvoice.value.items = tableData.value
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
    id: 'wha-invoice-verification-items',
    ...createVerificationTableOptions({
      t,
      columns: verificationTableColumns,
      enableHeaderActions: false,
      onCopy: (row) => {
        if (matchingLoading.value) return
        copyRow(row)
      },
      onDelete: (row) => {
        if (matchingLoading.value) return
        deleteRow(row)
      },
      getRowClassName: (row) => {
        const classes: string[] = []
        if (isGitLineMatched(row)) classes.push('wha-invoice-row-matched')
        if (highlightedMatchKeys.value.has(itemMatchKey(row))) classes.push('wha-verify-row-highlight')
        return classes.join(' ')
      },
      onEditClosed: ({ row }) => markRowDirty(row),
      beforeEditMethod: ({ row }) => !matchingLoading.value && !isGitLineMatched(row)
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

  const statusCounts = computed(() => getGitLineStatusCounts(tableData.value))

  async function fetchTableData() {
    const invoiceId = selectedInvoice.value?.id
    if (!invoiceId) return []
    loading.value = true
    try {
      const res = await newClientApi.getWmsGitInvoiceId(invoiceId)
      const invoice = res?.data
      if (invoice && selectedInvoice.value?.id === invoiceId) {
        Object.assign(selectedInvoice.value, invoice)
      }
      return [...(invoice?.items ?? [])]
    } catch (error) {
      console.error(error)
      return []
    } finally {
      loading.value = false
    }
  }

  let skipNextFilterReload = false

  async function insertRow(payload: GitInvoiceLineItem) {
    const invoiceId = selectedInvoice.value?.id
    if (!invoiceId || creatingRow.value) return false

    creatingRow.value = true
    try {
      const res = await newClientApi.postWmsGitInvoiceIdItemAdd(invoiceId, {
        po_no: payload.po_no,
        po_line: payload.po_line ?? undefined,
        shipment_num: payload.shipment_num ?? undefined,
        vendor_item_no: payload.vendor_item_no,
        wcl_item_no: payload.wcl_item_no,
        inv_item_id: payload.inv_item_id,
        line_qty: payload.line_qty ?? undefined,
        unit_price: payload.unit_price ?? undefined,
        line_amount: payload.line_amount ?? undefined,
        status: payload.status,
        apply_changes: payload.apply_changes,
        koaName: payload.koaName,
        invoice_line_num: payload.invoice_line_num
      })
      const insertedRow = res?.data
      if (!insertedRow?.id) return false

      tableData.value.unshift(insertedRow)
      if (selectedInvoice.value) selectedInvoice.value.items = tableData.value
      if (statusFilter.value !== 'all') {
        skipNextFilterReload = true
        statusFilter.value = 'all'
      }
      const grid = tableRef.value as any
      await grid?.loadData?.(getFilteredItems(tableData.value))
      await nextTick()
      grid?.scrollTo?.(0, 0)
      grid?.setEditCell?.(insertedRow, 'po_no')
      const poColumn = verificationTableColumns.find((col: any) => col.field === 'po_no')
      focusEditCell(poColumn as any, insertedRow)
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
    if (!selectedInvoice.value?.id || matchingLoading.value) return
    await insertRow(createEmptyGitInvoiceLine())
  }

  async function copyRow(row: Record<string, any>) {
    if (!selectedInvoice.value?.id || !row || matchingLoading.value) return
    const { id: _id, status: _status, ...rest } = row
    const ok = await insertRow({
      ...createEmptyGitInvoiceLine(),
      po_no: rest.po_no,
      po_line: rest.po_line ?? undefined,
      shipment_num: rest.shipment_num ?? undefined,
      vendor_item_no: rest.vendor_item_no,
      wcl_item_no: rest.wcl_item_no,
      inv_item_id: rest.inv_item_id,
      line_qty: rest.line_qty ?? undefined,
      unit_price: rest.unit_price ?? undefined,
      line_amount: rest.line_amount ?? undefined,
      status: undefined
    })
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
    () => selectedInvoice.value?.id,
    () => {
      dirtyRowIds.value.clear()
    }
  )

  watch(
    () => selectedInvoice.value?.items,
    (items) => {
      if (!items) return
      tableData.value = [...items]
      nextTick(() => tableRef.value?.loadData?.(getFilteredItems(tableData.value)))
    }
  )

  async function saveTableData() {
    const invoiceId = selectedInvoice.value?.id
    if (!invoiceId || dirtyRowIds.value.size === 0) return

    const rowIds = [...dirtyRowIds.value]
    for (const rowId of rowIds) {
      const row = tableData.value.find((item) => String(item.id) === rowId)
      if (!row?.id) {
        dirtyRowIds.value.delete(rowId)
        continue
      }
      await newClientApi.putWmsGitInvoiceIdItemItemid(invoiceId, row.id, row)
      dirtyRowIds.value.delete(rowId)
    }
  }

  async function runMatchingAndReload() {
    if (matchingLoading.value) return null
    matchingLoading.value = true
    await new Promise((resolve) => setTimeout(resolve, 3000))
    try {
      ;(tableRef.value as any)?.clearEdit?.()
      await saveTableData()
      const invoice = await invoiceCtx.runMatching()
      if (invoice?.items) {
        tableData.value = [...invoice.items]
        await nextTick()
        tableRef.value?.loadData?.(getFilteredItems(tableData.value))
      }
      return invoice
    } finally {
      matchingLoading.value = false
    }
  }

  async function fetchGroupId() {
    await saveTableData()
    return invoiceCtx.fetchGroupId(tableData.value)
  }

  const context: VerificationTableContext & {
    matchingLoading: Ref<boolean>
    runMatchingAndReload: () => Promise<GitInvoice | null>
    fetchGroupId: () => Promise<string | null>
  } = {
    loading,
    matchingLoading,
    creatingRow,
    tableData,
    tableConfig,
    tableEvent,
    tableRef,
    statusFilter,
    statusCounts,
    searchQuery,
    columns: verificationTableColumns as any,
    reload,
    highlightMatchingRows,
    clearMatchingRowHighlight,
    addRow,
    saveTableData,
    runMatchingAndReload,
    fetchGroupId
  }

  provide(InvoiceVerifyTableKey, context)

  return context
}

export function useInvoiceVerifyTableInject() {
  const context = inject(InvoiceVerifyTableKey) as
    | (VerificationTableContext & {
        matchingLoading: Ref<boolean>
        runMatchingAndReload: () => Promise<GitInvoice | null>
        fetchGroupId: () => Promise<string | null>
      })
    | undefined
  if (!context) {
    throw new Error('InvoiceVerifyTable context not found. Make sure useInvoiceVerifyTableProvider is called in a parent component.')
  }
  return context
}
