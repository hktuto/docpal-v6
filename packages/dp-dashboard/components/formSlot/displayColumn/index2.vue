<template>
  <div class="display-columns-setting">
    <div class="display-columns-setting-title">{{ $t('singleCase.displayColumns') }}</div>
    <!-- {{allColumns}} -->
    <div class="display-columns-setting-list left-list">
      <el-button style="width: fit-content" type="danger" size="small" @click="handleRemoveAllColumn">Remove All Column</el-button>
      <draggable class="list-group" :list="displayColumns" group="tableColumn" :clone="cloneColumn" @change="moveColumn" item-key="id">
        <template #item="{ element }">
          <div class="list-group-item" @dblclick="handleRemoveColumn(element)">
            {{ element.label }}
            <SvgIcon src="/icons/edit.svg" @click="handleEditColumn(element)" />
          </div>
        </template>
      </draggable>
    </div>
    <div class="display-columns-setting-list right-list">
      <el-button style="width: fit-content" type="primary" size="small" @click="filterSelectedColumn(!isFilter)">
        {{ isFilter ? 'Show All Column' : 'Filter Selected Column' }}
      </el-button>
      <draggable class="list-group" :list="selectableColumns" :group="{ name: 'tableColumn', pull: 'clone', put: true }" @change="moveColumn" item-key="id">
        <template #item="{ element }">
          <div class="list-group-item" @dblclick="handleAddColumn(element)">
            {{ element.label }}
          </div>
        </template>
      </draggable>
    </div>
    <FormSlotDisplayColumnSetting ref="settingRef" @refresh="handleRefreshColumn" />
  </div>
</template>
<script lang="ts" setup>
import draggable from 'vuedraggable'
const allColumns = ref([])
const selectableColumns = ref([])
const displayColumns = ref([])
const isFilter = ref(true)
function initColumns(data: any) {
  console.log('initColumns', data)
  try {
    if (!data.fields) return
    const fields = JSON.parse(data.fields)
    displayColumns.value = data.displayColumns || []
    allColumns.value = fields.map((item: any) => ({
      ...item,
      id: `${item.value}-${new Date().getTime()}`
    }))
    filterSelectedColumn(isFilter.value)
  } catch (error) {
    console.error(error)
  }
}
function getData() {
  return displayColumns.value
}
function moveColumn(event: any) {
  if (isFilter.value) filterSelectedColumn(true)
}
function filterSelectedColumn(_isFilter: boolean = false) {
  if (_isFilter) {
    isFilter.value = true
    selectableColumns.value = allColumns.value.filter((item: any) => !displayColumns.value.some((displayItem: any) => displayItem.value === item.value))
  } else {
    isFilter.value = false
    selectableColumns.value = [...allColumns.value]
  }
}
function handleAddColumn(column: any) {
  displayColumns.value.push(column)
  if (isFilter.value) filterSelectedColumn(true)
}
function handleRemoveColumn(column: any) {
  displayColumns.value = displayColumns.value.filter((item: any) => item.value !== column.value)
  if (isFilter.value) filterSelectedColumn(true)
}
function handleRemoveAllColumn() {
  displayColumns.value = []
  if (isFilter.value) filterSelectedColumn(true)
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
function cloneColumn(column: any) {
  return {
    ...column,
    id: `${column.value}-${new Date().getTime()}`
  }
}
defineExpose({
  initColumns,
  getData
})
</script>
<style lang="scss" scoped>
.display-columns-setting {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: min-content 1fr;
  grid-column-gap: var(--app-space-s);
  grid-row-gap: var(--app-space-s);
  .display-columns-setting-title {
    grid-area: 1 / 1 / 2 / 3;
  }
  .left-list {
    grid-area: 2 / 1 / 3 / 2;
  }
  .right-list {
    grid-area: 2 / 2 / 3 / 3;
  }
}
.display-columns-setting-list {
  flex: 1;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: auto;
  padding: var(--app-space-s);
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  height: 300px;
  .list-group {
    width: 100%;
    overflow: hidden;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-xs);
    justify-content: flex-start;
    align-content: flex-start;
  }
  .list-group-item {
    padding: var(--app-space-xs) var(--app-space-s);
    margin-bottom: var(--app-space-xs);
    background-color: #fff;
    border-radius: 4px;
    width: fit-content;
    height: fit-content;
    // 禁止选中文字
    user-select: none;
    // cursor 移动
    cursor: move;
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}
</style>
