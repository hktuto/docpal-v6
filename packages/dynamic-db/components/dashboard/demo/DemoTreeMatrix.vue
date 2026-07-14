<template>
  <VxeGrid v-bind="gridOptions" :data="treeData" :loading="loading" height="100%" @cell-click="onCellClick">
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

const gridOptions = computed<VxeGridProps>(() => ({
  border: true,
  showOverflow: true,
  scrollY: { enabled: true, gt: 100 },
  rowConfig: { keyField: 'id' },
  rowClassName: props.rowClassName,
  treeConfig: { childrenField: 'children', showLine: true, indent: 16 },
  columnConfig: { resizable: true },
  columns: props.columns.map((col, index) => ({
    field: col.field,
    title: col.title,
    width: col.width,
    minWidth: col.width ? undefined : 120,
    align: col.align || (index === 0 ? 'left' : 'right'),
    fixed: col.fixed,
    treeNode: col.treeNode ?? index === 0,
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
