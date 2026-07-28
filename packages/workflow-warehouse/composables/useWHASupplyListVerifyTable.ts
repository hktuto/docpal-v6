import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { postDynamicActions } from 'api'
import { SGLA_ITEMS, SGLA_ITEMS_TABLE_ID } from '../utils/variableMapping'
import { useWHASupplyListVerifyInject } from './useWHASupplyListVerify'

export type VerificationStatusFilter = 'all' | 'ok' | 'unVerified'

const SEARCH_FIELDS = [SGLA_ITEMS.Carton, SGLA_ITEMS.KoaCode, SGLA_ITEMS.CustomerPn, SGLA_ITEMS.PoLine] as const

type EditableColumnType = 'text' | 'number'

function editableColumn(type: EditableColumnType = 'text') {
  if (type === 'number') {
    return {
      editRender: {
        name: 'VxeInput',
        autofocus: '.vxe-input--inner',
        props: { type: 'number' }
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

export const verificationTableColumns = [
  {
    field: SGLA_ITEMS.Carton,
    title: 'CARTON',
    minWidth: 70,
    ...editableColumn()
  },
  {
    field: SGLA_ITEMS.KoaCode,
    title: 'KOA CODE',
    minWidth: 150,
    ...editableColumn()
  },
  {
    field: SGLA_ITEMS.CustomerPn,
    title: 'CUSTOMER PN',
    minWidth: 170,
    ...editableColumn()
  },
  {
    field: SGLA_ITEMS.Qty,
    title: 'QTY',
    minWidth: 90,
    type: 'number',
    ...editableColumn('number')
  },
  {
    field: SGLA_ITEMS.PoLine,
    title: 'PO / LINE',
    minWidth: 140,
    ...editableColumn()
  },
  {
    type: 'checkbox',
    title: 'Verified',
    width: 88,
    align: 'left'
  }
]

export interface WHASupplyListVerifyTableContext {
  loading: Ref<boolean>
  tableData: Ref<any[]>
  tableConfig: any
  tableEvent: any
  tableRef: Ref<any>
  statusFilter: Ref<VerificationStatusFilter>
  statusCounts: Ref<Record<VerificationStatusFilter, number>>
  searchQuery: Ref<string>
  columns: typeof verificationTableColumns
  reload: () => void
  SGLA_ITEMS: typeof SGLA_ITEMS
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
  const loading = ref(false)
  const statusFilter = ref<VerificationStatusFilter>('all')
  const searchQuery = ref('')
  const tableData = ref<Record<string, any>[]>([])
  function getFilteredItems(data: Record<string, any>[]) {
    let list = data
    if (statusFilter.value === 'ok') {
      list = list.filter((row) => !!row[SGLA_ITEMS.Checked])
    } else if (statusFilter.value === 'unVerified') {
      list = list.filter((row) => !row[SGLA_ITEMS.Checked])
    }
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((row) =>
      SEARCH_FIELDS.some((field) =>
        String(row[field] ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
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
      const data = await fetchTableData()
      tableData.value = data
      return getFilteredItems(data)
    },
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
      // 覆盖 useVxeTable 默认的 labelField，避免勾选旁显示 true/false
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
      return data?.data ?? []
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
    SGLA_ITEMS
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
