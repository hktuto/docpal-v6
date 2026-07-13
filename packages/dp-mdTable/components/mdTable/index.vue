<template>
  <div class="multi-dimension-table" :style="{ height: height || '100%' }">
    <!-- 工具栏 -->
    <ToolsBar
      :disabled="isMirror || !canManageTable"
      :showMirrorButton="!isMirror && canManageTable"
      :showAutomationButton="!isMirror && canManageTable"
      :showAuditLogButton="!isMirror && canManageTable"
      :showAddRowButton="canEditTable"
      @refresh="handleRefresh"
      @add-row="handleAddRow"
      @filter-change="handleRefreshSearch"
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
      <MdTableAddColumnPopover
        ref="addColumnPopoverRef"
        placement="left-start"
        popper-class="add-popover-content"
        @refresh="handleRefresh"
        @config-edit-start="handleColumnConfigEditStart"
        @config-edit-finish="handleColumnConfigEditFinish"
      />
      <MdFormPopover
        ref="MdFormPopoverRef"
        :table-id="props.tableId"
        :columns="columns"
        :systemFieldsTypes="systemFieldsTypes"
        showMoveButtons
        @submit="handleAddRowSubmit"
        @closed="handleFinishEdit"
        @current-row-change="handleExpandIndexChange"
      />
      <MdFormPopover
        ref="relationFormPopoverRef"
        :tableId="relationFormTableId"
        :systemFieldsTypes="systemFieldsTypes"
        showSourceButton
        @submit="handleRelationFormSubmit"
      />
      <MdTableHeaderPopover ref="mdTableHeaderPopoverRef" />
      <VirtualColumnDialog ref="virtualColumnDialogRef" @select="handleVirtualColumnSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VxeGridProps, VxeGridInstance } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import VirtualColumnDialog from './addColumn/VirtualColumnDialog.vue'
import { useMDTable } from '../../composables/useMDTable'
import { useGridEvents } from '../../composables/mdTableEvent'
import { onClickOutside } from '@vueuse/core'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { convertFilterRuleToCondition } from '@packages/dynamic-db/utils/PostgreSQLHelper'
import type { ColumnConfig } from '../../types/column-context'
import type { SortRule } from '../tools/sort/configPopover.vue'
import type { FilterRules } from '../tools/filter/ConfigPopover.vue'
import { createFieldId } from '../../utils/mdTableHelper'
// 导入并注册自定义渲染器（必须在组件加载时执行）
const slots = useSlots()

interface Props {
  tableId?: string
  editable?: boolean
  isMirror?: boolean
  canEditTable: boolean
  canManageTable: boolean
  extraColumnConfig?: {
    columns: Ref<ColumnConfig[]>
    deleteColumn: (fieldId: string) => Promise<void> | void
    updateColumn: (fieldName: string, updates: Partial<ColumnConfig>) => Promise<void> | void
    addColumn: (columns: ColumnConfig[], targetFieldId?: string, dragPos?: 'left' | 'right') => Promise<void> | void
    tableFields: Ref<any[]>
    currentView?: Ref<any>
    updatedViewColumnsConfig: (updates: Array<{ fieldId: string; hidden: boolean }>) => void
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
  'exit-edit-row': []
  'row-dblclick': [params: { row: any; rowIndex: number }]
  'row-context-menu': [params: { event: MouseEvent; row: any; rowIndex?: number; column?: any }]
  'expand-click': [params: { row: any; rowIndex: number }]
  'open-record': [params: { tableId: string; recordId: string; row: any }]
  'row-add': []
  'column-add': [column: ColumnConfig]
  'save-view': []
  import: []
  'add-row': []
  'add-row-submit': [data: any]
  'add-mirror': []
  'column-config-edit-start': [column: any]
  'column-config-edit-finish': [payload: { column: any; changed: boolean }]
}>()

// 引用
const isGroupingEnabled = computed(() => (props.extraColumnConfig?.columnGroupRules?.value?.length ?? 0) > 0)
const addPopoverRef = ref()
const {
  tableData,
  columns,
  gridOptions,
  gridRef,
  refreshTableData,
  setSearchExtraParams,
  updateRow,
  syncRowAndGroupAncestors,
  currentEditing,
  addVirtualColumn,
  addColumnPopoverRef,
  addRow,
  systemFieldsTypes,
  updateExpandedRows,
  clearCheckboxRow
} = useMDTable(props)
const { getAgg } = useCount(props)

function handleMove(direction: 'up' | 'down') {
  moveCurrentRow(direction)
}

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

const handleRefresh = async () => {
  updateExpandedRows()
  gridRef.value?.clearTreeExpandLoaded?.()
  await refreshTableData({ silent: true, keepPage: true })
  await getAgg()
  emit('refresh')
}

const {
  gridEvents,
  relationFormPopoverRef,
  relationFormTableId,
  handleRelationFormSubmit
} = useGridEvents({
  gridRef,
  columns,
  updateRow,
  syncRowAndGroupAncestors,
  getAgg,
  isGroupingEnabled,
  updateExpandedRows,
  updateColumn: props.extraColumnConfig.updateColumn,
  saveColumnOrder: props.extraColumnConfig.saveColumnOrder,
  callbacks: {
    onCellClick: (params) => emit('cell-click', params),
    onCellMouseenter: (params) => emit('cell-mouseenter', params),
    onCellMouseleave: (params) => emit('cell-mouseleave', params),
    onRowDblclick: (params) => {
      const { row } = params
      const rowIndex = tableData.value.findIndex((r: any) => r.id === row.id)
      emit('row-dblclick', { row, rowIndex })
    },
    onRowContextMenu: (params) => {
      emit('row-context-menu', params)
    },
    onColumnResize:(params:any) => {

    },
    onStartEdit: (params) => emit('start-edit', params),
    onExitEdit: (params) => emit('exit-edit', params),
    onRefresh: handleRefresh
  }
})

const handleRefreshSearch = async (rules: FilterRules) => {
  const isDateField = (field: string) => {
    const column = columns.value?.find((col: any) => col.field === field)
    return column?.business_type === ColumnFieldType.DateTime
  }
  const conditionItems = (rules?.conditions || [])
    .filter((rule) => rule.field && rule.operator)
    .flatMap((rule) => {
      const condition = convertFilterRuleToCondition(rule as any, isDateField) as any
      return condition?.type === 'AND' ? condition.value || [] : [condition]
    })
  const extraParams = conditionItems.length
    ? {
        conditions: [
          {
            type: rules?.conjunction || 'AND',
            value: conditionItems
          }
        ]
      }
    : undefined
  setSearchExtraParams(extraParams)
  updateExpandedRows()
  gridRef.value?.clearTreeExpandLoaded?.()
  await refreshTableData({ silent: false })
  await getAgg()
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
function handleFinishEdit() {
  emit('exit-edit-row')
}
// Handle expand click from checkbox column
const MdFormPopoverRef = ref()
const handleExpandClick = (row: any) => {
  const rowIndex = tableData.value.findIndex((r: any) => r.id === row.id)
  const mode = currentEditing.value.includes(row.id)  ? 'default' : (props.canEditTable ? 'edit' : 'default')
  const columnName = columns.value[0]?.field_name
  const title = columnName ? row[columnName] : ''
  MdFormPopoverRef.value.open(row, mode, title)
  emit('expand-click', { row, rowIndex, mode })
}
function handleExpandIndexChange(row: any) {
  const rowIndex = tableData.value.findIndex((r: any) => r.id === row.id)
  emit('expand-click', { row, rowIndex })
}

// 处理添加列
const rightPanelHeaderRef = ref<HTMLElement>()
const handleAddColumn = (e: MouseEvent) => {
  if (addColumnPopoverRef.value) {
    addColumnPopoverRef.value.show(rightPanelHeaderRef.value || null)
  }
}
function handleColumnConfigEditStart(column: any) {
  emit('column-config-edit-start', column)
}
function handleColumnConfigEditFinish(payload: { column: any; changed: boolean }) {
  emit('column-config-edit-finish', payload)
}

const mdTableHeaderPopoverRef = ref()
const virtualColumnDialogRef = ref()
const checkboxIndexRef = ref()
provide('mdTableHeaderPopover', mdTableHeaderPopoverRef)

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
  columns,
  refreshTableData,
  clearCheckboxRow
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
:deep(.vxe-body--row){
    &:has(.cell-update-deleted) {
        td{
            background-color: var(--app-grey-800) !important;
        }
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
:deep(.cell-update-deleted) {

  &::after {
    content: '';
    position: absolute;
    top: calc(50% - 1px);
    left: 0;
    width:100%;
    height: 2px;
    background: rgba(0, 0, 0, 0.4);
    text-decoration: line-through;
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
::deep(.column-config-editing) {
  background-color: rgba(64, 158, 255, 0.08) !important;

  .vxe-cell {
    position: relative;
  }
}

::deep(th.column-config-editing),
::deep(.vxe-header--column.column-config-editing) {
  background-color: rgba(64, 158, 255, 0.14) !important;
}

::deep(.vxe-body--column.column-config-editing) {
  cursor: not-allowed;
}
</style>
