<template>
  <div class="display-columns-setting">
    <div class="display-columns-setting-header">
      <div class="display-columns-setting-title">{{ $t('singleCase.displayColumns') }}</div>
      <el-button type="primary" link size="small" @click="handleOpenAddDialog">
        {{ $t('Add') }}
      </el-button>
    </div>
    <div class="display-columns-setting-list">
      <draggable class="list-group" :list="displayColumns" item-key="id" handle=".drag-handle">
        <template #item="{ element }">
          <div class="list-group-item">
            <SvgIcon src="/icons/move-handle.svg" class="drag-handle" />
            <span class="column-label">{{ element.label }}</span>
            <SvgIcon src="/icons/edit.svg" class="action-icon" @click.stop="handleEditColumn(element)" />
            <SvgIcon src="/icons/close.svg" class="action-icon" @click.stop="handleRemoveColumn(element)" />
          </div>
        </template>
      </draggable>
    </div>
    <!-- Add Column Dialog -->
    <el-dialog
      v-model="addDialogVisible"
      :title="$t('Add')"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="add-column-dialog">
        <div class="add-column-dialog-header">
          <el-input
            v-model="searchQuery"
            :placeholder="$t('tip.input')"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <div class="added-columns-count">
            {{ $t('singleCase.displayColumns') }}: {{ displayColumns.length }}
          </div>
        </div>
        <div class="selectable-columns-list">
          <div
            v-for="column in filteredSelectableColumns"
            :key="column.id"
            class="selectable-column-item"
            @click="handleAddColumn(column)"
          >
            {{ column.label }}
          </div>
          <div v-if="filteredSelectableColumns.length === 0" class="empty-state">
            {{ $t('noData') }}
          </div>
        </div>
      </div>
    </el-dialog>
    <FormSlotDisplayColumnSetting ref="settingRef" @refresh="handleRefreshColumn" />
  </div>
</template>
<script lang="ts" setup>
import draggable from 'vuedraggable'
import { Search } from '@element-plus/icons-vue'

const allColumns = ref([])
const selectableColumns = ref([])
const displayColumns = ref([])
const addDialogVisible = ref(false)
const searchQuery = ref('')
const filteredSelectableColumns = ref([])

function initColumns(data: any) {
  console.log('initColumns', data)
  try {
    if (!data.fields) return
    const fields = JSON.parse(data.fields)
    displayColumns.value = (data.displayColumns || []).map((item: any) => ({
      ...item,
      id: item.id || `${item.value}-${new Date().getTime()}`
    }))
    allColumns.value = fields.map((item: any) => ({
      ...item,
      id: `${item.value}-${new Date().getTime()}`
    }))
    updateSelectableColumns()
  } catch (error) {
    console.error(error)
  }
}

function getData() {
  return displayColumns.value
}

function updateSelectableColumns() {
  selectableColumns.value = allColumns.value.filter((item: any) => 
    !displayColumns.value.some((displayItem: any) => displayItem.value === item.value)
  )
  handleSearch()
}

function handleSearch() {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    filteredSelectableColumns.value = [...selectableColumns.value]
  } else {
    filteredSelectableColumns.value = selectableColumns.value.filter((item: any) =>
      item.label?.toLowerCase().includes(query)
    )
  }
}

function handleOpenAddDialog() {
  updateSelectableColumns()
  addDialogVisible.value = true
  searchQuery.value = ''
}

function handleAddColumn(column: any) {
  const newColumn = {
    ...column,
    id: `${column.value}-${new Date().getTime()}`
  }
  displayColumns.value.push(newColumn)
  updateSelectableColumns()
  addDialogVisible.value = false
  searchQuery.value = ''
}

function handleRemoveColumn(column: any) {
  displayColumns.value = displayColumns.value.filter((item: any) => item.id !== column.id)
  updateSelectableColumns()
}

const settingRef = ref()

function handleEditColumn(column: any) {
  console.log('column', column)
  settingRef.value.handleOpen(column)
}

function handleRefreshColumn(data: any) {
  const index = displayColumns.value.findIndex((item: any) => item.id === data.id)
  if (index !== -1) {
    displayColumns.value[index] = data
  }
  console.log(displayColumns.value)
}

defineExpose({
  initColumns,
  getData
})
</script>
<style lang="scss" scoped>
.display-columns-setting {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.display-columns-setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.display-columns-setting-title {
  font-weight: 500;
}

.display-columns-setting-list {
  flex: 1;
  min-height: 200px;
  padding: var(--app-space-s);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background-color: #fafafa;

  .list-group {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);
  }

  .list-group-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    padding: var(--app-space-xs) var(--app-space-s);
    background-color: #fff;
    border: 1px solid #e0e7ff;
    border-radius: 4px;
    user-select: none;
    transition: all 0.2s;

    &:hover {
      border-color: var(--app-primary-color);
    }

    .drag-handle {
      cursor: move;
      color: #999;
      width: 16px;
      height: 16px;
      flex-shrink: 0;

      &:hover {
        color: var(--app-primary-color);
      }
    }

    .column-label {
      flex: 1;
      color: var(--app-primary-color);
      font-size: 14px;
    }

    .action-icon {
      cursor: pointer;
      width: 16px;
      height: 16px;
      color: var(--app-primary-color);
      flex-shrink: 0;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.7;
      }
    }
  }
}

.add-column-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);

  .add-column-dialog-header {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);
  }

  .added-columns-count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    padding: 0 var(--app-space-xs);
  }

  .selectable-columns-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    padding: var(--app-space-xs);

    .selectable-column-item {
      padding: var(--app-space-xs) var(--app-space-s);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background-color: var(--el-color-primary-light-9);
        color: var(--app-primary-color);
      }
    }

    .empty-state {
      padding: var(--app-space-m);
      text-align: center;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>

