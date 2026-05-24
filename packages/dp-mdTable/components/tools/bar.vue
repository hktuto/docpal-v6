<template>
  <div v-if="showToolbar" class="table-toolbar">
    <div class="toolbar-left">
      <slot name="toolbar-left-before" />
      <ToolsColumnConfigPopover v-if="showColumnConfig" :disabled="disabled" />
      <ToolsGroupingButton
        v-if="showGroupingButton"
        :disabled="disabled"
        :groupableColumns="columns"
        :groupMaxCount="groupMaxCount"
        @grouping-change="(v) => handleRefresh('groupInfo', v)"
      />
      <ToolsFilterButton :disabled="disabled" :available-columns="columns" @filter-change="(v) => handleRefresh('filterInfo', v)" />
      <ToolsSortButton :disabled="disabled" :available-columns="columns" @sort-change="(v) => handleRefresh('sortInfo', v)" />
      <slot name="toolbar-left">
        <el-button v-if="showAddRowButton" :icon="Plus" type="primary" @click="handleAddRow">
          Add Row
        </el-button>
      </slot>
    </div>
    <div class="toolbar-right">
      <ToolsAutomationButton :show="showAutomationButton" />
      <ToolsAuditLogButton :show="showAuditLogButton" />
      <ToolsMirrorButton :show="showMirrorButton" />
      <slot name="toolbar-right"> </slot>
    </div>
    <MdFormPopover ref="MdFormPopoverRef" :columns="columns" :systemFieldsTypes="systemFieldsTypes" showMoveButtons @submit="handleAddRowSubmit" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Refresh, Search, Download, Upload, Operation, DataAnalysis, Plus } from '@element-plus/icons-vue'
import type { FilterGroup, SortRule } from '#imports'

interface ColumnConfig {
  field: string
  title: string
  type?: string
  [key: string]: any
}

interface Props {
  showToolbar?: boolean
  disabled?: boolean
  showColumnConfig?: boolean
  showMirrorButton?: boolean
  showAddRowButton?: boolean
  showGroupingButton?: boolean
  showAutomationButton?: boolean
  showAuditLogButton?: boolean
  groupMaxCount?: number
}

interface Emits {
  (e: 'refresh'): void
  (e: 'add-row'): void
}
const { columns, updateViewFilterSortGroup, systemFieldsTypes } = inject('viewTools')
const tableDataContext = useTableDataInject({ required: false })
const addRow = tableDataContext?.addRow
if (!updateViewFilterSortGroup) {
  throw new Error('updateViewFilterSortGroup is not found')
}
const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  disabled: false,
  showColumnConfig: true,
  showMirrorButton: true,
  showAddRowButton: true,
  showGroupingButton: true,
  showAutomationButton: true,
  showAuditLogButton: true
})

const emit = defineEmits<Emits>()

const handleRefresh = (type: 'sortInfo' | 'groupInfo' | 'filterInfo', value: any) => {
  updateViewFilterSortGroup(type, value)
  emit('refresh')
}
const MdFormPopoverRef = ref()
const handleAddRow = () => {
  MdFormPopoverRef.value.open({})
}
const handleAddRowSubmit = async (data: any) => {
  if (!addRow) {
    return
  }
  await addRow(data)
}
// 暴露方法
defineExpose({})
</script>

<style scoped lang="scss">
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  padding-inline: var(--app-space-s);
  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    :deep(.el-button) {
      padding: var(--app-space-xs);
    }
    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}
</style>
