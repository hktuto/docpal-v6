<template>
  <div class="multi-dimension-table" :style="{ height: height || '100%' }">
    <!-- 工具栏 -->
    <Toolbar :groupable-columns="columns" @refresh="handleRefresh" @search="handleSearch" @grouping-change="handleGroupToggle">
      <template #toolbar-left>
        <slot name="toolbar-left" />
      </template>
      <template #toolbar-right>
        <slot name="toolbar-right" />
      </template>
    </Toolbar>
    <!-- 表格内容区域 -->
    <div class="table-content">
      <!-- 主表格 -->
      <div class="table-left-panel" style="max-height: 90vh; overflow-y: hidden">
        <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents" class="multi-dimension-grid">
          <!-- 插槽透传 -->
          <template v-for="(_, slotName) in filteredSlots" #[slotName]="slotProps">
            <slot :name="slotName" v-bind="slotProps" />
          </template>
          <template #footerCount="footerProps">
            <ToolsFooterCount :column="footerProps.column" :row="footerProps.row" />
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
        <MdTableAddColumnPopover
          ref="addColumnPopoverRef"
          :existing-fields="existingFields"
          placement="left-start"
          popper-class="add-popover-content"
          @submit="addColumn"
        />
      </div>
      <MdTableHeaderPopover ref="mdTableHeaderPopoverRef" @headerClick="handleHeaderClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VxeGridProps, VxeGridListeners, VxeGridInstance } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useTableData } from '../../composables/useTableData'
import { useTableConfig } from '../../composables/useTableConfig'
import Toolbar from './Toolbar.vue'
// 导入并注册自定义渲染器（必须在组件加载时执行）
const slots = useSlots()

interface Props {
  tableName: string
  editable: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tableName: '',
  editable: false
})

const emit = defineEmits<{
  refresh: []
  search: [value: string]
  'edit-closed': [params: any]
  'cell-click': [params: any]
  'row-add': []
  'column-add': [column: ColumnConfig]
}>()

// 引用
const activeGroupFields = ref<string[]>([])
const addPopoverRef = ref()
const addColumnPopoverRef = ref()
const { columns, addColumn, columnGroupRules, gridOptions, gridRef, refreshTableData, editable, saveColumnOrder } = useMDTable(props)

// 表格事件
const gridEvents = computed<VxeGridListeners>(() => ({
  'edit-closed': (params: any) => {
    emit('edit-closed', params)
  },
  'cell-click': (params: any) => {
    emit('cell-click', params)
  },
  columnDragend({ newColumn, oldColumn, dragPos }) {
    console.log(`拖拽完成，被拖拽列：${oldColumn.field} 目标列：${newColumn.field} 目标位置：${dragPos}`)
    saveColumnOrder({ newColumn, oldColumn, dragPos })
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
  ElMessage.success('刷新成功')
}

const handleSearch = (value: string) => {
  emit('search', value)
}

const handleGroupToggle = (rules: GroupingRule[]) => {
  columnGroupRules.value = rules
}

// 处理添加列
const rightPanelHeaderRef = ref<HTMLElement>()
const handleAddColumn = (e: MouseEvent) => {
  if (addColumnPopoverRef.value) {
    addColumnPopoverRef.value.show(rightPanelHeaderRef.value || null)
  }
}
const handleHeaderClick = (type: string, triggerEl: HTMLElement, column: any) => {
  switch (type) {
    case 'edit':
      addColumnPopoverRef.value.show(triggerEl, column)
      break
    case 'sortAz':
      gridRef.value.sort(column.field, 'asc')
      break
    case 'sortZa':
      gridRef.value.sort(column.field, 'desc')
      break
    case 'insertLeft':
      const defaultNewColumn = {
        field: createFieldId(),
        title: `New Column`,
        type: ColumnFieldType.MultiText
      } as unknown as ColumnConfig
      //
      addColumn(defaultNewColumn, column.field, 'left')
      console.log('insertLeft', column)
      break
    case 'insertRight':
      const defaultNewColumnRight = {
        field: createFieldId(),
        title: `New Column`,
        type: ColumnFieldType.MultiText
      } as unknown as ColumnConfig
      //
      addColumn(defaultNewColumnRight, column.field, 'right')
      console.log('insertRight', column)
      break
    case 'editDescription':
      break
    case 'permission':
      break
    case 'hide':
      break
    case 'delete':
      break
  }
}
const mdTableHeaderPopoverRef = ref()
provide('mdTableHeaderPopover', mdTableHeaderPopoverRef)
// 暴露方法
defineExpose({
  gridRef,
  columns
})

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
          color: #409eff;
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
    padding-left: var(--app-space-xs) !important;
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
    color: #409eff;
    text-decoration: underline;
  }

  &:focus-within {
    .el-input__wrapper {
      background-color: #fff !important;
      box-shadow: 0 0 0 1px #409eff inset !important;
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
:deep(.mdTable-input-edit) {
  .el-input__wrapper,
  .el-select__wrapper,
  textarea {
    border-radius: 2px;
  }
}
:deep(.mdTable-singleSelect-edit) {
  height: 100%;
  .el-select__wrapper,
  .el-select__selection {
    height: 100%;
  }
}
</style>
