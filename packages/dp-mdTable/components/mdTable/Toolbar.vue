<template>
  <div v-if="showToolbar" class="table-toolbar">
    <div class="toolbar-left">
      <el-input v-if="showSearch" v-model="searchValue" placeholder="Filter..." style="width: 200px" @input="handleSearch">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <slot name="toolbar-left">
        <el-button type="primary" @click="handleAddRow">
          <el-icon><Plus /></el-icon>
          Add Row
        </el-button>
      </slot>
      <ToolsColumnVisibilityPopover
      />
      <ToolsGroupingButton :groupableColumns="groupableColumns" @grouping-change="emit('grouping-change', $event)" />
      <ToolsFilterButton :available-columns="groupableColumns" @filter-change="handleFilterChange" />
      <ToolsSortButton :available-columns="groupableColumns" @sort-change="handleSortChange" />
    </div>
    <div class="toolbar-right">
      <slot name="toolbar-right">
        <el-button v-if="showImport" @click="handleImport">
          <el-icon><Upload /></el-icon>
          Import
        </el-button>
        <el-button v-if="showExport" type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          Export
        </el-button>
        <el-button type="primary" @click="handleSaveView"> Save View </el-button>
      </slot>
    </div>
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
  showSearch?: boolean
  showRefresh?: boolean
  showExport?: boolean
  showImport?: boolean
  groupableColumns?: ColumnConfig[]
  activeGroupFields?: string[]
}

interface Emits {
  (e: 'refresh'): void
  (e: 'search', value: string): void
  (e: 'export'): void
  (e: 'import'): void
  (e: 'group-toggle', field: string): void
  (e: 'update:activeGroupFields', fields: string[]): void
  (e: 'grouping-change', rules: any[]): void
  (e: 'filter-change', group: FilterGroup): void
  (e: 'sort-change', rules: SortRule[]): void
  (e: 'save-view'): void
  (e: 'add-row'): void
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  showSearch: true,
  showRefresh: true,
  showExport: true,
  showImport: true,
  groupableColumns: () => [],
  activeGroupFields: () => []
})

const emit = defineEmits<Emits>()

const searchValue = ref('')

// 使用 computed 来管理 activeGroupFields，支持 v-model
const activeGroupFields = computed({
  get: () => props.activeGroupFields || [],
  set: (value: string[]) => {
    emit('update:activeGroupFields', value)
  }
})
const handleRefresh = () => {
  emit('refresh')
}

const handleSearch = (value: string) => {
  emit('search', value)
}

const handleSaveView = () => {
  emit('save-view')
}

const handleExport = () => {
  emit('export')
}

const handleImport = () => {
  emit('import')
}

const handleAddRow = () => {
  emit('add-row')
}

const handleFilterChange = (group: FilterGroup) => {
  console.log('handleFilterChange', group)
  emit('filter-change', group)
}

const handleSortChange = (rules: SortRule[]) => {
  console.log('handleSortChange', rules)
  emit('sort-change', rules)
}

const handleGroupCommand = (field: string) => {
  toggleGroup(field)
}

const toggleGroup = (field: string) => {
  const currentFields = [...activeGroupFields.value]
  const index = currentFields.indexOf(field)
  if (index > -1) {
    currentFields.splice(index, 1)
  } else {
    currentFields.push(field)
  }
  activeGroupFields.value = currentFields
  emit('group-toggle', field)
}

// 暴露方法
defineExpose({
  searchValue,
  get activeGroupFields() {
    return activeGroupFields.value
  },
  toggleGroup
})
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
    gap: 8px;
  }
}
</style>
