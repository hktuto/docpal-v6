<script setup lang="ts">
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
const { tableFields, updatedViewColumnsConfig, columns, saveColumnOrder } = inject('viewTools')
const { t } = useI18n()

const columnVisibilityList = ref<Array<{ id: string; title: string; hidden: boolean }>>([])

function buildColumnVisibilityList() {
  const tableFieldList = tableFields.value || []
  const columnList = columns?.value || []
  const fieldByName = new Map(tableFieldList.map((field: any) => [field.field_name, field]))
  const visibleFieldNameSet = new Set(columnList.map((col: any) => col.field_name))
  const list: Array<{ id: string; title: string; display: boolean }> = []
  const usedFieldIdSet = new Set<string>()

  // 优先按当前视图 columns 顺序渲染（与拖拽持久化顺序保持一致）
  columnList.forEach((col: any) => {
    const field = fieldByName.get(col.field_name)
    if (!field) {
      return
    }
    list.push({
      id: field.id,
      title: field.field_name_alias || field.field_name || field.id,
      hidden: col.hidden
    })
    usedFieldIdSet.add(field.id)
  })

  tableFieldList.forEach((field: any) => {
    if (usedFieldIdSet.has(field.id)) {
      return
    }
    list.push({
      id: field.id,
      title: field.field_name_alias || field.field_name || field.id,
      hidden: false
    })
  })

  return list
}

function hasMinOneColumn(list: Array<{ id: string; title?: string; hidden: boolean }>) {
  if (list.length === 0) {
    return false
  }
  return list.some((item) => !item.hidden)
}

async function handleColumnVisibilityChange(fieldId: string, hidden: boolean) {
  const target = columnVisibilityList.value.find((item) => item.id === fieldId)
  if (target) {
    if (!hasMinOneColumn(columnVisibilityList.value)) {
      ElMessage.error(t('mdTable.columnConfig.minOneColumn'))
      target.hidden = false
      return
    }
    target.hidden = hidden
  }
  if (!updatedViewColumnsConfig) {
    return
  }
  await updatedViewColumnsConfig([{ id: fieldId, hidden }])
}

async function handleColumnDragEnd(event: { oldIndex?: number; newIndex?: number }) {
  const oldIndex = event.oldIndex
  const newIndex = event.newIndex
  if (oldIndex == null || newIndex == null || oldIndex === newIndex || !saveColumnOrder) {
    return
  }
  const dragPos = newIndex > oldIndex ? 'right' : 'left'
  const targetIndex = dragPos === 'left' ? newIndex + 1 : newIndex - 1
  const movingColumn = columnVisibilityList.value[newIndex]
  const targetColumn = columnVisibilityList.value[targetIndex]
  if (!movingColumn || !targetColumn) {
    return
  }
  await saveColumnOrder(movingColumn.id, targetColumn.id, dragPos)
}

async function handleHideAllColumns() {
  columnVisibilityList.value.forEach((item, index) => {
    item.hidden = index !== 0
  })
  if (!updatedViewColumnsConfig) {
    return
  }
  const updates = columnVisibilityList.value.map((item) => ({
    id: item.id,
    hidden: item.hidden
  }))

  await updatedViewColumnsConfig(updates)
}

async function handleShowAllColumns() {
  columnVisibilityList.value.forEach((item) => {
    item.hidden = false
  })
  if (!updatedViewColumnsConfig) {
    return
  }
  const updates = (tableFields.value || []).map((field: any) => ({ id: field.id, hidden: false }))
  await updatedViewColumnsConfig(updates)
}

watch(
  () => tableFields.value,
  () => {
    columnVisibilityList.value = buildColumnVisibilityList()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="md-card-setting-column">
    <div class="setting-title column-title">{{ t('mdTable.columnConfig.title') }}</div>
    <div class="column-list">
      <draggable v-model="columnVisibilityList" item-key="id" handle=".drag-handle" ghost-class="column-item-ghost" :animation="180" @end="handleColumnDragEnd">
        <template #item="{ element }">
          <div class="column-item">
            <span class="drag-handle" :aria-label="t('mdTable.columnConfig.dragToSort')">⋮⋮</span>
            <span class="column-name">{{ element.title }}</span>
            <el-switch
              v-model="element.hidden"
              :active-value="false"
              :inactive-value="true"
              @change="(val: boolean) => handleColumnVisibilityChange(element.id, val)"
            />
          </div>
        </template>
      </draggable>
    </div>
    <div class="column-actions">
      <el-button size="small" @click="handleHideAllColumns">{{ t('mdTable.columnConfig.hideAll') }}</el-button>
      <el-button size="small" type="primary" @click="handleShowAllColumns">{{ t('mdTable.columnConfig.showAll') }}</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.md-card-setting-column {
  .setting-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #606266;
  }

  .column-title {
    margin-top: 12px;
  }

  .column-list {
    max-height: 220px;
    overflow-y: auto;
    margin-bottom: 8px;
  }

  .column-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .drag-handle {
    color: #909399;
    cursor: move;
    line-height: 1;
    user-select: none;
    font-size: 12px;
    letter-spacing: -1px;
  }

  .drag-handle:active {
    cursor: move;
  }

  .column-item-ghost {
    opacity: 0.6;
  }

  .column-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .column-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
