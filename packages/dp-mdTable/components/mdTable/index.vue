<template>
  <div class="multi-dimension-table" :style="{ height: height || '100%' }">
    <!-- 工具栏 -->
    <ToolsBar
      :disabled="isMirror || !canManageTable"
      :showMirrorButton="!isMirror && canManageTable"
      :showAutomationButton="!isMirror && canManageTable"
      :showAddRowButton="canEditTable"
      @refresh="handleRefresh"
      @add-row="handleAddRow"
    >
      <template #toolbar-left>
        <slot name="toolbar-left" />
      </template>
    </ToolsBar>
    <!-- 表格内容区域 -->
    <div class="table-content">
      <!-- 主表格 -->
      <div class="table-left-panel" style="max-height: 90vh; overflow-y: hidden">
        <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents" class="multi-dimension-grid">
          <!-- 插槽透传 -->
          <template #checkboxIndex="checkboxProps">
            <ToolsCheckboxIndex
              ref="checkboxIndexRef"
              :row="checkboxProps.row"
              :seq="checkboxProps.seq"
              :props="checkboxProps"
              @expand-click="handleExpandClick"
            />
          </template>
          <template v-for="(_, slotName) in filteredSlots" #[slotName]="slotProps">
            <slot :name="slotName" v-bind="slotProps" />
          </template>
          <template #footerCount="footerProps">
            <ToolsFooterCount :column="getColumn(footerProps.column.field)" :row="footerProps.row" />
          </template>
          <template #header="headerProps">
            <MdTableHeader v-if="headerProps.column.field" :headerProps="headerProps" :column="headerProps.column" />
          </template>
        </vxe-grid>
      </div>
      <!-- 右侧区域 -->
      <div class="table-right-panel">
        <div ref="rightPanelHeaderRef" class="table-right-panel-header" @click="(e) => handleAddColumn(e)">
          <slot name="right-panel">
            <el-icon><Plus /></el-icon>
          </slot>
        </div>
      </div>
      <MdTableAddColumnPopover ref="addColumnPopoverRef" placement="left-start" popper-class="add-popover-content" @refresh="handleRefresh" />
      <MdFormPopover ref="MdFormPopoverRef" :columns="columns" :systemFieldsTypes="systemFieldsTypes" showMoveButtons @submit="handleAddRowSubmit" />
      <MdTableHeaderPopover ref="mdTableHeaderPopoverRef" />
      <VirtualColumnDialog ref="virtualColumnDialogRef" @select="handleVirtualColumnSelect" />
      <RecordCardDialog ref="recordCardDialogRef" />
    </div>
    <ToolsRightClickCellPopover ref="rightClickCellPopoverRef" />
  </div>
</template>

<script setup lang="ts">
import type { VxeGridProps, VxeGridListeners, VxeGridInstance } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import VirtualColumnDialog from './addColumn/VirtualColumnDialog.vue'
import RecordCardDialog from './RecordCardDialog.vue'
import { onClickOutside } from '@vueuse/core'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import type { ColumnConfig } from '../../types/column-context'
import type { SortRule } from '../tools/sort/configPopover.vue'
import { createFieldId } from '../../utils/mdTableHelper'
// 导入并注册自定义渲染器（必须在组件加载时执行）
const slots = useSlots()

interface ColumnVisibilityItem {
  fieldId: string
  title: string
  display: boolean
}

interface Props {
  tableId?: string
  editable?: boolean
  isMirror?: boolean
  canEditTable: boolean
  canManageTable: boolean
  extraColumnConfig?: {
    columns: Ref<ColumnConfig[]>
    deleteColumn: (column: ColumnConfig) => void
    updateColumn: (column: ColumnConfig) => void
    addColumn: (column: ColumnConfig) => void
    tableFields: Ref<any[]>
    currentView?: Ref<any>
    updatedViewColumnsConfig: (updates: Array<{ fieldId: string; display: boolean }>) => void
    updateViewColumnCountMethod?: (fieldId: string, countMethod: string) => Promise<void>
    saveColumnOrder: (columnId: string, position: number) => void
    columnFilterRules: Ref<any[]>
    columnGroupRules: Ref<any[]>
    columnSortRules: Ref<any[]>
  }
}

const props = withDefaults(defineProps<Props>(), {
  tableId: '',
  editable: false,
  isMirror: false,
  canEditTable: false,
  canManageTable: false,
  extraColumnConfig: () => ({
    columns: [],
    deleteColumn: () => {},
    updateColumn: () => {},
    addColumn: () => {},
    tableFields: [],
    currentView: undefined,
    updatedViewColumnsConfig: () => {},
    updateViewColumnCountMethod: async () => {},
    saveColumnOrder: () => {},
    columnFilterRules: [],
    columnGroupRules: [],
    columnSortRules: []
  })
})

const emit = defineEmits<{
  refresh: []
  search: [value: string]
  'edit-closed': [params: any]
  'cell-click': [params: any]
  'cell-mouseenter': [params: any]
  'cell-mouseleave': [params: any]
  'start-edit': [params: any]
  'exit-edit': [params: any]
  'row-dblclick': [params: { row: any; rowIndex: number }]
  'expand-click': [params: { row: any; rowIndex: number }]
  'open-record': [params: { tableId: string; recordId: string; row: any }]
  'row-add': []
  'column-add': [column: ColumnConfig]
  'save-view': []
  import: []
  'add-row': []
  'add-row-submit': [data: any]
  'add-mirror': []
}>()

// 引用
const activeGroupFields = ref<string[]>([])
const addPopoverRef = ref()
const { tableData, columns, gridOptions, gridRef, refreshTableData, updateRow, addVirtualColumn, addColumnPopoverRef, addRow, systemFieldsTypes } =
  useMDTable(props)
const { getAgg } = useCount(props)

// Import update status composable
await new Promise((resolve) => setTimeout(resolve, 1000))
const { setLoading, setSuccess, setError, getCellClass } = useUpdateStatus()
const rightClickCellPopoverRef = ref()
const recordCardDialogRef = ref()
function handleMove(direction: 'up' | 'down') {
  moveCurrentRow(direction)
}

// 表格事件
const gridEvents = computed<VxeGridListeners>(() => ({
  'relation-cell-click': (params: any) => {
    const { targetElement, targetTableId, recordId, displayValue, row } = params
    if (targetTableId && recordId && recordCardDialogRef.value) {
      recordCardDialogRef.value.open(targetElement, {
        targetTableId,
        recordId,
        displayValue
      })
    }
  },
  editClosed: async (params: any) => {
    const { column, row } = params
    // need to check if the row data is changed
    const newData = row[column.field]
    const recordset = gridRef.value.getRecordset()
    const hasChanged = recordset.updateRecords.length > 0
    if (!hasChanged) {
      return
    }
    const updateData = {
      [column.field]: row[column.field]
    }

    // Set loading state
    setLoading(row.id, column.field)

    try {
      console.log('updateRow', row.id, updateData)
      await updateRow(row.id, updateData)
      // Set success state - will auto-clear after delay
      setSuccess(row.id, column.field)
    } catch (error) {
      console.error('Failed to update row:', error)
      setError(row.id, column.field, error instanceof Error ? error.message : 'Update failed')
      ElMessage.error('Failed to update cell')
    } finally {
      await getAgg()
    }
    emit('edit-closed', params)
  },
  'cell-click': (params: any) => {
    emit('cell-click', params)
  },
  'cell-mouseenter': (params: any) => {
    emit('cell-mouseenter', params)
  },
  'cell-mouseleave': (params: any) => {
    emit('cell-mouseleave', params)
  },

  'start-edit': (params: any) => {
    const { row, column } = params
    console.log("start-edit")
    emit('start-edit', { row, column })
  },
  'edit-closed': ({ row, column }: any) => {
    emit('exit-edit', { row, column })
  },
  columnDragend({ newColumn, oldColumn, dragPos }) {
    const newFullColumn = columns.value.find((item: any) => item.field_name === newColumn.field)
    const oldFullColumn = columns.value.find((item: any) => item.field_name === oldColumn.field)
    props.extraColumnConfig.saveColumnOrder(oldFullColumn.id, newFullColumn.id, dragPos)
  },
  'cell-menu': ({ row, column, $event }: any) => {
    $event?.preventDefault()
    rightClickCellPopoverRef.value?.open($event?.target, { row, column })
  },
  'checkbox-all': ({ checked }: any) => {
    const { fullData } = gridRef.value?.getTableData()
    const setChecked = (row: any) => {
      if (row.children && row.children.length > 0) {
        row.children.forEach((child: any) => {
          setChecked(child)
        })
      }
      row.checked = checked
    }
    fullData.forEach((row: any) => {
      setChecked(row)
    })
  },
  'toggle-tree-expand': (params: any) => {
    console.log('toggle-tree-expand', params)
  }
}))

// 过滤插槽（排除 toolbar_buttons 和 add-popover）
const filteredSlots = computed(() => {
  const filtered: Record<string, any> = {}
  for (const [name] of Object.entries(slots)) {
    if (name !== 'toolbar_buttons' && name !== 'toolbar-left' && name !== 'toolbar-right' && name !== 'add-popover') {
      filtered[name] = slots[name]
    }
  }
  return filtered
})

// 方法
const handleRefresh = async () => {
  await refreshTableData()
  emit('refresh')
}

const handleAddRow = () => {
  MdFormPopoverRef.value.open({})
}
const handleAddRowSubmit = async (data: any, id: string) => {
  if (id) {
    await updateRow(id, data)
    await handleRefresh()
  } else {
    await addRow(data)
  }
}
// Handle expand click from checkbox column
const MdFormPopoverRef = ref()
const handleExpandClick = (row: any) => {
  const rowIndex = tableData.value.findIndex((r: any) => r.id === row.id)
  emit('expand-click', { row, rowIndex })
  MdFormPopoverRef.value.open(row, 'edit')
}

// 处理添加列
const rightPanelHeaderRef = ref<HTMLElement>()
const handleAddColumn = (e: MouseEvent) => {
  if (addColumnPopoverRef.value) {
    addColumnPopoverRef.value.show(rightPanelHeaderRef.value || null)
  }
}
const handleCreateRelation = inject<((column: any) => void) | undefined>('handleCreateRelation', undefined)

const mdTableHeaderPopoverRef = ref()
const virtualColumnDialogRef = ref()
const checkboxIndexRef = ref()
provide('mdTableHeaderPopover', mdTableHeaderPopoverRef)
function handleClick() {
  console.log('handleClick', mdTableHeaderPopoverRef)
}
// Handle virtual column selection from dialog
const handleVirtualColumnSelect = async (relationFieldName: string, displayFieldName: string) => {
  // Use the injected addVirtualColumn or fall back to context

  if (addVirtualColumn) {
    try {
      await addVirtualColumn(relationFieldName, displayFieldName)
      ElMessage.success(`Virtual column "${displayFieldName}" added`)
    } catch (error: any) {
      ElMessage.error(error.message || 'Failed to add virtual column')
    }
  } else {
    console.warn('addVirtualColumn not available in context')
  }
}
function getColumn(field: string) {
  return columns.value.find((col: any) => String(col.field_name) === String(field))
}
// 暴露方法
defineExpose({
  gridRef,
  columns
})
onClickOutside(
  checkboxIndexRef,
  (event) => {
    const selectedRows = gridRef.value?.getCheckboxRecords() || []
    if (selectedRows.length > 0) {
      selectedRows.forEach((row) => {
        row.checked = false
      })
    }
    gridRef.value?.clearCheckboxRow()
  },
  { ignore: ['.col--checkbox'] }
)
// 监听 tableName 变化，重新加载数据
</script>

<style scoped lang="scss">
.multi-dimension-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;

  .table-content {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr min-content;
    grid-template-rows: 1fr;
    position: relative;
    overflow: hidden;
    position: relative;
    .table-left-panel {
      height: 100%;
      flex: 1 0 auto;
      position: relative;
      overflow: hidden;
    }
    .multi-dimension-grid {
      flex: 1;
      overflow: hidden;
      height: 100%;
    }

    .table-right-panel {
      height: 100%;
      width: 2rem;
      overflow: auto;
      min-width: 0; // 允许 flex 收缩
      border-right: 1px solid #ebeef5;
      border-top: 1px solid #ebeef5;
      border-bottom: 1px solid #ebeef5;
      .table-right-panel-header {
        height: 47px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s;
        // inner border
        border-bottom: 1px solid #ebeef5;

        &:hover {
          background-color: #f5f7fa;
        }

        .el-icon {
          font-size: 18px;
          color: var(--app-accent-color);
        }
      }
    }
  }
}

// 覆盖 vxe-table 样式以优化性能
:deep(.vxe-table) {
  .vxe-table--body-wrapper {
    // 虚拟滚动优化
    contain: layout style paint;
  }
  .vxe-cell--tree-node {
    // padding-left: var(--app-space-xs) !important;
  }
  .vxe-table--footer-wrapper {
    .vxe-table--footer {
      background-color: #fafafa;
      font-weight: 500;

      .vxe-cell {
        color: #606266;
      }
    }
  }

  // Header添加按钮样式
  .add-button-header {
    margin: 0;
  }
}

// 添加Popover内容样式
.add-popover-content {
  padding: 10px;

  p {
    margin: 0;
    color: #606266;
  }
}
:deep(.vxe-grid--toolbar-wrapper) {
  display: none;
}

// URL 编辑输入框样式
:deep(.url-edit-input) {
  .el-input__wrapper {
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .el-input__inner {
    padding: 0 !important;
    color: var(--app-accent-color);
    text-decoration: underline;
  }

  &:focus-within {
    .el-input__wrapper {
      background-color: #fff !important;
      box-shadow: 0 0 0 1px var(--app-accent-color) inset !important;
    }

    .el-input__inner {
      color: #606266;
      text-decoration: none;
    }
  }
}
:deep(.vxe-header--row) {
  .vxe-cell {
    padding: 0 !important;
  }
}
:deep(.col--active) {
  position: relative;
  overflow: visible;
  .vxe-cell {
    padding: 0 !important;
    .vxe-cell-absolute {
      position: absolute;
      top: 0;
      left: 0;
      width: calc(100% - 1px);
      z-index: 1000;
    }
  }
}
:deep(.mdTable-input-radius) {
  .el-input__wrapper,
  .el-select__wrapper,
  textarea {
    border-radius: 2px;
  }
}
:deep(.mdTable-multiSelect-edit) {
  min-height: 48px;
  .el-select__wrapper {
    min-height: 48px;
  }
}
:deep(.mdTable-height-edit) {
  height: 100%;
  .el-select__wrapper,
  .el-select__selection {
    height: 100%;
  }
}

// Cell update status animations
:deep(.cell-update-loading) {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(64, 158, 255, 0.1);
    animation: pulse 1.5s ease-in-out infinite;
    pointer-events: none;
  }
}

:deep(.cell-update-success) {
  animation: successFlash 0.6s ease-out;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 6px;
    height: 6px;
    background: var(--app-success-color);
    border-radius: 50%;
    animation: successDot 0.6s ease-out;
  }
}

:deep(.cell-update-error) {
  animation: errorShake 0.5s ease-out;
  background-color: rgba(245, 108, 108, 0.1) !important;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 6px;
    height: 6px;
    background: var(--app-danger-color);
    border-radius: 50%;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes successFlash {
  0% {
    background-color: rgba(103, 194, 58, 0.3);
  }
  100% {
    background-color: transparent;
  }
}

@keyframes successDot {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}
</style>
