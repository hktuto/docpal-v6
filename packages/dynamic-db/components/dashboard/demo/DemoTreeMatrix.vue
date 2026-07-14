<template>
  <VxeGrid
    v-bind="gridOptions"
    :data="displayData"
    :loading="loading"
    height="100%"
    @cell-click="onCellClick"
    @sort-change="onSortChange"
  >
    <template #rich="{ row, column }">
      <slot name="cell" :row="row" :column="column" />
    </template>
  </VxeGrid>
</template>

<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table'

export interface MatrixColumn {
  field: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  /** First column defaults to the tree node column. */
  treeNode?: boolean
  /** Plain-text cell formatter (receives the row). */
  formatter?: (row: any) => string
  /** Rich cells render through the widget's #cell slot instead of a formatter. */
  rich?: boolean
  /** Enables header-click sorting; tree siblings sort at every level. */
  sortable?: boolean
  /** Node field or accessor used for sorting; defaults to `field`. */
  sortField?: string | ((row: any) => number)
}

const props = withDefaults(
  defineProps<{
    treeData: any[]
    columns: MatrixColumn[]
    loading?: boolean
    /** Row class for styling clickable rows (vxe rowClassName: string or ({ row }) => string). */
    rowClassName?: string | ((params: { row: any }) => string)
  }>(),
  { loading: false }
)

const emit = defineEmits<{
  'cell-click': [params: { row: any; column: any; $event: MouseEvent; triggerTreeNode?: boolean }]
}>()

function onCellClick(params: any) {
  emit('cell-click', params)
}

// ---- Remote sorting: we reorder the tree ourselves, vxe only renders the header arrows ----

const sortState = ref<{ field: string; order: 'asc' | 'desc' } | null>(null)

function onSortChange({ column, order }: any) {
  sortState.value = order ? { field: column.field, order } : null
}

function compareValues(a: any, b: any): number {
  const aEmpty = a == null || a === '' || (typeof a === 'number' && Number.isNaN(a))
  const bEmpty = b == null || b === '' || (typeof b === 'number' && Number.isNaN(b))
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

function sortTreeNodes(nodes: any[], col: MatrixColumn, order: 'asc' | 'desc'): any[] {
  const sf = col.sortField ?? col.field
  const getValue = typeof sf === 'function' ? sf : (row: any) => row[sf]
  const dir = order === 'asc' ? 1 : -1
  return nodes
    .map((node) => (node.children ? { ...node, children: sortTreeNodes(node.children, col, order) } : node))
    .sort((a, b) => compareValues(getValue(a), getValue(b)) * dir)
}

const displayData = computed(() => {
  if (!sortState.value) return props.treeData
  const col = props.columns.find((c) => c.field === sortState.value!.field)
  if (!col) return props.treeData
  return sortTreeNodes(props.treeData, col, sortState.value.order)
})

const gridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  scrollY: { enabled: true, gt: 100 },
  rowConfig: { keyField: 'id' },
  rowClassName: props.rowClassName,
  treeConfig: { childrenField: 'children', showLine: true, indent: 16 },
  columnConfig: { resizable: true },
  sortConfig: { remote: true },
  columns: props.columns.map((col, index) => ({
    field: col.field,
    title: col.title,
    width: col.width,
    minWidth: col.width ? undefined : 120,
    align: col.align || (index === 0 ? 'left' : 'right'),
    fixed: col.fixed,
    treeNode: col.treeNode ?? index === 0,
    sortable: col.sortable,
    slots: col.rich ? { default: 'rich' } : undefined,
    formatter: col.formatter ? ({ row }: any) => col.formatter!(row) : undefined
  }))
}))
</script>

<style scoped lang="scss">
// vxe-table reads its base font size from this CSS var; keep it rem-based
// (0.875rem == vxe's 14px default at the app's 16px root)
.vxe-grid {
  --vxe-ui-font-size-default: 0.875rem;
}
</style>
