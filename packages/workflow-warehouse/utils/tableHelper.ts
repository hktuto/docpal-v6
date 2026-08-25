import type { Ref } from 'vue'
import { postDynamicActions } from 'api'
import { COUNTRY_STATIC_ALIASES } from './countryAliases'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from './variableMapping'

export type VerificationStatusFilter = 'all' | 'ok' | 'unVerified'

export type HighlightMatchKey = {
  supplierPn: string | number
  poLine: string | number
}

export type EditableColumnType = 'text' | 'number' | 'select'

export type SelectOption = { label: string; value: string | number }

export const VERIFY_TABLE_SEARCH_FIELDS = [
  SGLA_ITEMS.Carton,
  SGLA_ITEMS.Supplier_PN,
  SGLA_ITEMS.WCL_PN,
  SGLA_ITEMS.Qty,
  SGLA_ITEMS.PoLine
] as const

export const VERIFY_TABLE_COUNTRY_FIELDS = [SGLA_ITEMS.CountryOfOrigin, SGLA_ITEMS.CountryOfWafer]

export function matchSearchValue(value: unknown, query: string): boolean {
  if (value == null || value === '') return false
  return String(value).toLowerCase().includes(query)
}

export function rowMatchKey(...parts: unknown[]) {
  return parts.map((part) => String(part ?? '').trim()).join('::')
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function toCheckedBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 'true'
}

export function editableColumn(type: EditableColumnType = 'text', selectOptions: SelectOption[] = []) {
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

export function createInvoiceVerificationTableColumns(t: (key: string) => string) {
  return [
    {
      type: 'seq',
      width: 56,
      align: 'right',
      fixed: 'left',
      title: t('workflowWarehouse.lineNo')
    },
    {
      field: 'po_no',
      title: t('workflowWarehouse.poNo'),
      minWidth: 130,
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
    },
    {
      field: 'po_line',
      title: t('workflowWarehouse.poLine'),
      minWidth: 90,
      type: 'number',
      ...editableColumn('number')
    },
    {
      field: 'vendor_item_no',
      title: t('workflowWarehouse.vendorItemNo'),
      minWidth: 150,
      required: true,
      headerClassName: 'is-required',
      ...editableColumn()
    },
    {
      field: 'line_qty',
      title: t('workflowWarehouse.lineQty'),
      minWidth: 100,
      type: 'number',
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('number')
    },
    {
      field: 'unit_price',
      title: t('workflowWarehouse.unitPrice'),
      minWidth: 110,
      type: 'number',
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('number')
    },
    {
      field: 'line_amount',
      title: t('workflowWarehouse.lineAmount'),
      minWidth: 120,
      type: 'number',
      required: true,
      headerClassName: 'is-required',
      ...editableColumn('number')
    },
    {
      field: 'status',
      title: t('workflowWarehouse.lineStatus'),
      minWidth: 160,
      showOverflow: true
    }
  ]
}

export type InvoiceVerificationTableColumn = ReturnType<typeof createInvoiceVerificationTableColumns>[number]

export interface VerificationTableContext {
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
  batchEditDialogVisible: Ref<boolean>
  selectedColumn: Ref<string | undefined>
  applyBatchEdit: (val: string) => void
  /** 按 Supplier_PN + PoLine 高亮匹配行（红底），可传单条或数组 */
  highlightMatchingRows: (matches: HighlightMatchKey | HighlightMatchKey[]) => void
  clearMatchingRowHighlight: () => void
  addRow: () => Promise<void>
  saveTableData: () => Promise<void>
}

export type CreateVerificationTableOptionsParams = {
  t: (key: string) => string
  columns: VerificationTableColumn[] | InvoiceVerificationTableColumn[]
  onBatchEdit: (columnField: string | undefined) => void
  onCopy: (row: Record<string, any>) => void
  onDelete: (row: Record<string, any>) => void
  getRowClassName: (row: Record<string, any>) => string
  onEditClosed?: (params: { row: Record<string, any> }) => void
  /** supply-list verify uses checkbox; invoice verify uses status text */
  checkboxField?: string
}

/** useVxeTable 共用配置（height / actions / edit / optionalConfig） */
export function createVerificationTableOptions(params: CreateVerificationTableOptionsParams) {
  const { t, columns, onBatchEdit, onCopy, onDelete, getRowClassName, onEditClosed, checkboxField } = params

  return {
    height: '100%',
    refresh: false,
    zoom: false,
    saveColumnOrder: false,
    columns: columns as any,
    virtualScroll: true,
    headerActions: [
      [
        {
          code: 'batchEdit',
          name: 'BatchEdit',
          action: (params: any) => {
            onBatchEdit(params.column?.field)
          }
        }
      ]
    ],
    bodyActions: [
      [
        {
          code: 'copy',
          name: t('actions.duplicate'),
          action: (params: any) => onCopy(params.row)
        },
        {
          code: 'delete',
          name: t('mdTable.deleteRow'),
          action: (params: any) => onDelete(params.row)
        }
      ]
    ],
    permissionMethod: ({ row, code }: any) => {
      if (code === 'batchEdit') {
        return { visible: true, disabled: false }
      }
      return {
        visible: !!row,
        disabled: false
      }
    },
    editRender: {
      editClosed: (params: any) => onEditClosed?.(params),
      editConfig: {
        trigger: 'click' as const,
        mode: 'cell' as const,
        showIcon: false,
        showStatus: false,
        autoFocus: true
      }
    },
    optionalConfig: {
      border: 'inner' as const,
      stripe: false,
      mouseConfig: {
        selected: true
      },
      keyboardConfig: {
        isEsc: true
      },
      pagerConfig: { enabled: false },
      rowClassName: ({ row }: { row: Record<string, any> }) => getRowClassName(row),
      ...(checkboxField
        ? {
            checkboxConfig: {
              checkField: checkboxField,
              highlight: true,
              range: true
            }
          }
        : {}),
      toolbarConfig: {
        custom: false,
        zoom: false,
        refresh: false,
        slots: { buttons: 'toolbar_buttons' }
      }
    }
  }
}

export function generateMasterDetailParams(tableId: string, masterColumn: string, masterId: string) {
  return {
    tableId,
    columns: [{ name: '*' }],
    orderBy: [{ column: 'created_at', desc: false }],
    conditions: [
      {
        value: [
          {
            column: masterColumn,
            type: 'EQ',
            value: masterId
          }
        ],
        type: 'AND'
      }
    ]
  }
}

export function generateVerificationItemsParams(masterTableId: string) {
  return generateMasterDetailParams(SGLA_ITEMS_TABLE_ID, SGLA_ITEMS.MasterId, masterTableId)
}

export function normalizeCountryKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
}

export function buildCountryLookup(list: SelectOption[]) {
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

export function normalizeCountryFields(
  rows: Record<string, any>[],
  countryList: SelectOption[],
  fields: readonly string[] = VERIFY_TABLE_COUNTRY_FIELDS
) {
  if (!countryList.length) return rows
  const lookup = buildCountryLookup(countryList)
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

export function mapCountryOptions(data: any[]): SelectOption[] {
  return (data ?? []).map((item: any) => ({
    label: item.country_name_en,
    value: item.country_code
  }))
}

export function applySelectOptionsToColumns(columns: any[], fields: readonly string[], options: SelectOption[]) {
  fields.forEach((field) => {
    const column = columns.find((col: any) => col.field === field)
    if (column?.editRender) {
      column.editRender.options = options
    }
  })
}

export async function fetchCountryList(): Promise<SelectOption[]> {
  const { data } = await postDynamicActions({
    table: 'cfg_country_dict',
    columns: [{ name: '*' }]
  })
  return mapCountryOptions(data?.data ?? [])
}

export function filterTableItems(
  data: Record<string, any>[],
  options: {
    statusFilter: VerificationStatusFilter
    searchQuery: string
    checkedField?: string
    isOk?: (row: Record<string, any>) => boolean
    searchFields: readonly string[]
  }
) {
  const isOk = options.isOk ?? ((row) => !!row[options.checkedField!])
  let list = data
  if (options.statusFilter === 'ok') {
    list = list.filter((row) => isOk(row))
  } else if (options.statusFilter === 'unVerified') {
    list = list.filter((row) => !isOk(row))
  }
  const q = options.searchQuery.trim().toLowerCase()
  if (!q) return list
  return list.filter((row) => options.searchFields.some((field) => matchSearchValue(row[field], q)))
}

export function getStatusCounts(
  list: Record<string, any>[],
  checkedFieldOrIsOk: string | ((row: Record<string, any>) => boolean)
): Record<VerificationStatusFilter, number> {
  const isOk = typeof checkedFieldOrIsOk === 'function' ? checkedFieldOrIsOk : (row: Record<string, any>) => !!row[checkedFieldOrIsOk]
  return {
    all: list.length,
    unVerified: list.filter((row) => !isOk(row)).length,
    ok: list.filter((row) => isOk(row)).length
  }
}

export function getMissingRequiredLabels(
  row: Record<string, any>,
  requiredColumns: Array<{ field: string; title: string }>
) {
  return requiredColumns.filter((col) => row[col.field] == null || row[col.field] === '').map((col) => col.title)
}

export function createRowFromColumns(
  columns: Array<{ field?: string; type?: string }>,
  extras: Record<string, any>,
  source?: Record<string, any>
) {
  const row: Record<string, any> = { ...extras }
  columns.forEach((col) => {
    if (!col.field) return
    if (source) {
      row[col.field] = col.type === 'number' ? toNumberOrNull(source[col.field]) : (source[col.field] ?? '')
      return
    }
    row[col.field] = col.type === 'number' ? null : ''
  })
  return row
}

export function getFormDataFromColumns(
  rows: Record<string, any>[],
  columns: Array<{ field?: string; type?: string }>,
  extraFields: string[],
  booleanFields: string[] = []
) {
  const fields = columns.map((column) => column.field).filter((item): item is string => item !== undefined)
  const formFields = [...new Set([...fields, ...extraFields])]
  return rows.map((item) => {
    const data: Record<string, any> = {}
    formFields.forEach((field) => {
      if (booleanFields.includes(field)) {
        data[field] = !!item[field]
        return
      }
      const fieldColumn = columns.find((column) => column.field === field)
      if (fieldColumn?.type === 'number') {
        data[field] = toNumberOrNull(item[field])
      } else {
        data[field] = item[field] ?? ''
      }
    })
    return data
  })
}

export function applyBatchValueToColumn(tableRef: any, field: string | undefined, val: string) {
  if (!field || !tableRef) return
  const { tableData } = tableRef.getTableData()
  tableData.forEach((row: any) => {
    row[field] = val
  })
}

export function normalizeCheckedField(rows: Record<string, any>[], checkedField: string) {
  return rows.map((row) => ({
    ...row,
    [checkedField]: toCheckedBoolean(row[checkedField])
  }))
}
