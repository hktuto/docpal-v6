<template>
  <div class="multi-dimension-table" :style="{ height: props.height || '100%' }">
    <!-- 工具栏 -->
    <Toolbar
      :groupable-columns="groupableColumns"
      v-model:active-group-fields="activeGroupFields"
      @refresh="handleRefresh"
      @search="handleSearch"
      @group-toggle="handleGroupToggle"
    >
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
        </vxe-grid>
      </div>
      <!-- 右侧区域 -->
      <div class="table-right-panel">
        <div ref="addColumnTriggerRef" class="table-right-panel-header" @click="handleAddColumn">
          <slot name="right-panel">
            <el-icon><Plus /></el-icon>
          </slot>
        </div>
        <AddColumnPopover
          ref="addColumnPopoverRef"
          :existing-fields="existingFields"
          :virtual-ref="addColumnTriggerRef"
          :width="addColumnPopoverWidth"
          placement="left-start"
          :popper-class="addColumnPopoverClass"
          @submit="addColumn"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, useSlots } from 'vue'
import type { VxeGridProps, VxeGridListeners, VxeGridInstance } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useTableData } from '../../composables/useTableData'
import { useColumns, type ColumnConfig, ColumnFieldType } from '../../composables/useColumns'
import { useTableConfig } from '../../composables/useTableConfig'
import Toolbar from './Toolbar.vue'
import AddColumnPopover from './AddColumnPopover.vue'
// 导入并注册自定义渲染器（必须在组件加载时执行）
const slots = useSlots()

interface Props {
  tableName: string
  /** 查询参数 */
  queryParams?: string | Record<string, any>
  /** 表格高度 */
  height?: string | number
  /** 是否自动调整大小 */
  autoResize?: boolean
  /** 是否显示斑马纹 */
  stripe?: boolean
  /** 是否显示边框 */
  border?: boolean
  /** 是否可调整列宽 */
  resizable?: boolean
  /** 是否保持原始数据 */
  keepSource?: boolean
  /** 行ID字段 */
  rowId?: string
  /** 编辑配置 */
  editConfig?: boolean | object
  /** AddColumnPopover 宽度 */
  addColumnPopoverWidth?: number | string
  /** AddColumnPopover 类名 */
  addColumnPopoverClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  tableName: '',
  height: '100%',
  autoResize: true,
  stripe: true,
  border: true,
  resizable: true,
  keepSource: true,
  rowId: 'id',
  addColumnPopoverWidth: 300,
  addColumnPopoverClass: 'add-popover-content'
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
const addColumnTriggerRef = ref<HTMLElement>()

// 1. 表格数据模块（通过 tableName 获取数据）
const {
  loading,
  refresh: refreshTableData,
  addRow: addTableRow,
  updateRow: updateTableRow,
  deleteRow: deleteTableRow,
  getTableData
} = useTableData(props.tableName, {
  queryParams: props.queryParams,
  autoLoad: true
})

// 2. 列模块（从数据自动推断列配置）
const { columns, getExistingFields, addColumn, inferColumns, mergeColumnsFromData } = useColumns(props.tableName)

// 可分组列
const groupableColumns = computed(() => {
  return columns.value.filter((col) => col.field && col.type !== 'action')
})

// 已存在的字段列表（用于添加列时的验证）
const existingFields = computed(() => {
  return getExistingFields()
})

// 3. 表格配置模块
const { gridOptions, gridRef, processedColumns } = useTableConfig({
  height: props.height,
  autoResize: props.autoResize,
  stripe: props.stripe,
  border: props.border,
  resizable: props.resizable,
  keepSource: props.keepSource,
  rowId: props.rowId,
  editConfig: props.editConfig,
  groupBy: activeGroupFields,
  columns,
  loading,
  apiMethod: getTableData
})

// 表格事件
const gridEvents = computed<VxeGridListeners>(() => ({
  'edit-closed': (params: any) => {
    emit('edit-closed', params)
  },
  'cell-click': (params: any) => {
    emit('cell-click', params)
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

const handleGroupToggle = (field: string) => {
  console.log('handleGroupToggle', field)
  nextTick(() => {
    if (gridRef.value) {
      gridRef.value.reloadData()
    }
  })
}

// 处理添加列
const handleAddColumn = () => {
  if (addColumnPopoverRef.value) {
    // 使用虚拟触发时，手动控制显示/隐藏
    addColumnPopoverRef.value.show()
  }
}

// 暴露方法
defineExpose({
  gridRef
})

// 监听 tableName 变化，重新加载数据
watch(
  () => props.tableName,
  (newTableName) => {
    if (newTableName) {
      refreshTableData()
    }
  }
)
</script>

<style scoped lang="scss">
.multi-dimension-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;

  .table-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 0;
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
</style>
