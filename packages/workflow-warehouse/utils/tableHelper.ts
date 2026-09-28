import type { Ref } from 'vue'
import { postDynamicActions } from 'api'
import { COUNTRY_STATIC_ALIASES } from './countryAliases'
import { normalizeMatchText } from './workflowHelper'

export type VerificationStatusFilter = 'all' | 'ok' | 'unVerified'

export type HighlightMatchKey = {
  supplierPn: string | number
  poLine: string | number
}

export type EditableColumnType = 'text' | 'number' | 'select'

export type SelectOption = { label: string; value: string | number }

export function matchSearchValue(value: unknown, query: string): boolean {
  if (value == null || value === '') return false
  return String(value).toLowerCase().includes(query)
}

export function rowMatchKey(...parts: unknown[]) {
  return parts.map((part) => normalizeMatchText(part)).join('::')
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** 数字展示：千分位；空值返回空字符串 */
export function formatThousandNumber(value: unknown): string {
  if (value === '' || value == null) return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('en-US')
}

export function toCheckedBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 'true'
}

export function editableColumn(type: EditableColumnType = 'text', props: Record<string, any> = {}) {
  if (type === 'number') {
    return {
      align: 'right',
      formatter: ({ cellValue }: { cellValue: unknown }) => formatThousandNumber(cellValue),
      editRender: {
        name: 'VxeNumberInput',
        autofocus: '.vxe-number-input--input',
        props: {
          type: 'amount',
          min: 0,
          autoFill: false,
          align: 'right',
          showCurrency: false,
          ...props
        }
      }
    }
  }

  if (type === 'select') {
    return {
      editRender: {
        name: 'VxeSelect',
        autofocus: '.vxe-input--inner',
        props: {
          clearable: true,
          filterable: true,
          transfer: true,
          popupClassName: 'wha-verify-select-panel',
          ...props
        }
      }
    }
  }

  return {
    editRender: {
      name: 'VxeTextarea',
      autofocus: '.vxe-textarea--inner',
      props: { rows: 2, autosize: { minRows: 2, maxRows: 6 }, ...props }
    }
  }
}

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
  columns: any[]
  reload: () => void
  batchEditDialogVisible?: Ref<boolean>
  selectedColumn?: Ref<string | undefined>
  applyBatchEdit?: (val: string) => void
  /** 按 Supplier_PN + PoLine 高亮匹配行（红底），可传单条或数组 */
  highlightMatchingRows: (matches: HighlightMatchKey | HighlightMatchKey[]) => void
  clearMatchingRowHighlight: () => void
  /** 当前是否存在红底高亮（未匹配）行 */
  hasHighlightedRows: Ref<boolean>
  scrollToMatchingRow?: (match: HighlightMatchKey) => void
  /** 将匹配行的 verified 勾选重置为 false */
  resetVerifiedMatches?: (matches: HighlightMatchKey | HighlightMatchKey[]) => boolean
  addRow: () => Promise<void>
  saveTableData: () => Promise<void>
}

export type CreateVerificationTableOptionsParams = {
  t: (key: string) => string
  columns: any[]
  onCopy: (row: Record<string, any>) => void
  onDelete: (row: Record<string, any>) => void
  getRowClassName: (row: Record<string, any>) => string
  onBatchEdit?: (columnField: string | undefined) => void
  onEditClosed?: (params: { row: Record<string, any>; column?: { field?: string } }) => void
  beforeEditMethod?: (params: { row: Record<string, any>; column?: any }) => boolean
  /** return false to lock cell edit and row actions */
  isEditable?: () => boolean
  /** supply-list verify uses checkbox; invoice verify uses status text */
  checkboxField?: string
  /** default true; invoice verify disables header batch edit */
  enableHeaderActions?: boolean
}

/** useVxeTable 共用配置（height / actions / edit / optionalConfig） */
export function createVerificationTableOptions(params: CreateVerificationTableOptionsParams) {
  const { t, columns, onBatchEdit, onCopy, onDelete, getRowClassName, onEditClosed, beforeEditMethod, isEditable, checkboxField, enableHeaderActions = true } = params

  function canEdit() {
    return isEditable?.() ?? true
  }

  return {
    height: '100%',
    refresh: false,
    zoom: false,
    saveColumnOrder: true,
    columns: columns as any,
    virtualScroll: true,
    ...(enableHeaderActions && onBatchEdit
      ? {
          headerActions: [
            [
              {
                code: 'batchEdit',
                name: t('button.batchEdit'),
                action: (actionParams: any) => {
                  onBatchEdit(actionParams.column?.field)
                }
              }
            ]
          ]
        }
      : {}),
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
    permissionMethod: ({ row, code, column }: any) => {
      const editable = canEdit()
      if (code === 'batchEdit') {
        return { visible: editable && Boolean(column?.editRender), disabled: !editable }
      }
      return {
        visible: !!row && editable,
        disabled: !editable
      }
    },
    editRender: {
      editClosed: (params: any) => onEditClosed?.(params),
      editConfig: {
        trigger: 'click' as const,
        mode: 'cell' as const,
        showIcon: false,
        showStatus: false,
        autoFocus: true,
        beforeEditMethod: (params: any) => {
          if (!canEdit()) return false
          return beforeEditMethod?.(params) ?? true
        }
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

export type DynamicOrderBy = { column: string; desc: boolean }

export function generateMasterDetailParams(tableId: string, masterColumn: string, masterId: string, orderBy: DynamicOrderBy[]) {
  return {
    tableId,
    columns: [{ name: '*' }],
    orderBy,
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

export function normalizeCountryFields(rows: Record<string, any>[], countryList: SelectOption[], fields: readonly string[]) {
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

export function getMissingRequiredLabels(row: Record<string, any>, requiredColumns: Array<{ field: string; title: string }>) {
  return requiredColumns.filter((col) => row[col.field] == null || row[col.field] === '').map((col) => col.title)
}

export function createRowFromColumns(columns: Array<{ field?: string; type?: string }>, extras: Record<string, any>, source?: Record<string, any>) {
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
