<script setup lang="ts">
import draggable from 'vuedraggable'

const { tableFields, updatedViewColumnsConfig, columns, saveColumnOrder } = useMDCardInject()

const columnVisibilityList = ref<Array<{ id: string; title: string; display: boolean }>>([])

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
      display: true
    })
    usedFieldIdSet.add(field.id)
  })

  // 补齐未显示字段（隐藏字段）
  tableFieldList.forEach((field: any) => {
    if (usedFieldIdSet.has(field.id)) {
      return
    }
    list.push({
      id: field.id,
      title: field.field_name_alias || field.field_name || field.id,
      display: visibleFieldNameSet.has(field.field_name)
    })
  })

  return list
}

function initializeColumnVisibilityList() {
  columnVisibilityList.value = buildColumnVisibilityList()
}

onMounted(() => {
  initializeColumnVisibilityList()
})

async function handleColumnVisibilityChange(fieldId: string, display: boolean) {
  const target = columnVisibilityList.value.find((item) => item.id === fieldId)
  if (target) {
    target.display = display
  }
  if (!updatedViewColumnsConfig) {
    return
  }
  await updatedViewColumnsConfig([{ id: fieldId, display }])
}

async function handleColumnDragEnd(event: { oldIndex?: number; newIndex?: number }) {
  const oldIndex = event.oldIndex
  const newIndex = event.newIndex
  if (oldIndex == null || newIndex == null || oldIndex === newIndex || !saveColumnOrder) {
    return
  }

  const movedColumn = columnVisibilityList.value[newIndex]
  if (!movedColumn) {
    return
  }

  let targetFieldId = ''
  let dragPos: 'left' | 'right' = 'left'

  if (newIndex > oldIndex) {
    const previousColumn = columnVisibilityList.value[newIndex - 1]
    if (!previousColumn) {
      return
    }
    targetFieldId = previousColumn.id
    dragPos = 'right'
  } else {
    const nextColumn = columnVisibilityList.value[newIndex + 1]
    if (nextColumn) {
      targetFieldId = nextColumn.id
      dragPos = 'left'
    } else {
      const previousColumn = columnVisibilityList.value[newIndex - 1]
      if (!previousColumn) {
        return
      }
      targetFieldId = previousColumn.id
      dragPos = 'right'
    }
  }
  await saveColumnOrder(movedColumn.id, targetFieldId, dragPos)
}

async function handleHideAllColumns() {
  columnVisibilityList.value.forEach((item) => {
    item.display = false
  })
  if (!updatedViewColumnsConfig) {
    return
  }
  const updates = (tableFields.value || []).map((field: any) => ({ id: field.id, display: false }))
  await updatedViewColumnsConfig(updates)
}

async function handleShowAllColumns() {
  columnVisibilityList.value.forEach((item) => {
    item.display = true
  })
  if (!updatedViewColumnsConfig) {
    return
  }
  const updates = (tableFields.value || []).map((field: any) => ({ id: field.id, display: true }))
  await updatedViewColumnsConfig(updates)
}
</script>

<template>
  <div class="md-card-setting-column">
    <div class="setting-title column-title">列显示与隐藏</div>
    <div class="column-list">
      <draggable
        v-model="columnVisibilityList"
        item-key="id"
        handle=".drag-handle"
        ghost-class="column-item-ghost"
        :animation="180"
        @end="handleColumnDragEnd"
      >
        <template #item="{ element }">
          <div class="column-item">
            <span class="drag-handle" aria-label="拖拽排序">⋮⋮</span>
            <span class="column-name">{{ element.title }}</span>
            <el-switch :model-value="element.display" @update:model-value="(v) => handleColumnVisibilityChange(element.id, !!v)" />
          </div>
        </template>
      </draggable>
    </div>
    <div class="column-actions">
      <el-button size="small" @click="handleHideAllColumns">隐藏所有</el-button>
      <el-button size="small" type="primary" @click="handleShowAllColumns">显示所有</el-button>
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
    cursor: grabbing;
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
