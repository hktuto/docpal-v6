<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'
import type { CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'
import draggable from 'vuedraggable'

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
// Initialize tableView composable which provides column management
const tableView = useTableView()
const isDragging = ref(false)

// Column editor state
const columnPopoverRef = ref()
const editingColumn = ref<CaseFieldRecord | null>(null)
const addButtonRef = ref()
const tableReady = ref(false)

// Column type labels
const columnTypeLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Text', color: '#409EFF' },
  2: { label: 'Number', color: '#67C23A' },
  3: { label: 'Single Select', color: '#E6A23C' },
  4: { label: 'Multi Select', color: '#E6A23C' },
  5: { label: 'Date', color: '#F56C6C' },
  6: { label: 'Checkbox', color: '#909399' },
  7: { label: 'User', color: '#409EFF' },
  8: { label: 'Attachment', color: '#909399' },
  9: { label: 'Relation', color: '#F56C6C' },
  10: { label: 'Formula', color: '#67C23A' }
}

function getColumnTypeLabel(type: number) {
  return columnTypeLabels[type] || { label: 'Unknown', color: '#909399' }
}

async function initializeTable() {
  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || treeItem.itemType !== 'table' || !treeItem.itemId) return

  try {
    await tableView.initializeTableView(treeItem.itemId)
    tableReady.value = true
  } catch (error) {
    console.error('Error initializing table:', error)
    ElMessage.error('Failed to load table')
  }
}

function handleAddColumn() {
  editingColumn.value = null
  columnPopoverRef.value?.show(addButtonRef.value, null)
}

function handleEditColumn(field: CaseFieldRecord, event: Event) {
  editingColumn.value = field
  // Convert CaseFieldRecord to column format expected by MdTableAddColumnPopover
  const columnData = {
    field: field.fieldName,
    title: field.fieldNameAlias,
    type: field.displayStructure?.type,
    properties: field.displayStructure?.properties || {}
  }
  columnPopoverRef.value?.show(event.target, columnData)
}

async function handleDeleteColumn(field: CaseFieldRecord) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the column "${field.fieldNameAlias}"? This action cannot be undone.`,
      'Delete Column',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // Use tableView's deleteField method which handles both case_fields and view updates
    await tableView.deleteField(field.fieldName)
    
    ElMessage.success(`Column "${field.fieldNameAlias}" deleted`)
  } catch (error) {
    // User cancelled or error occurred
    if (error !== 'cancel') {
      console.error('Error deleting column:', error)
      ElMessage.error('Failed to delete column')
    }
  }
}

async function handleColumnSubmit(columnConfig: any) {
  try {
    if (editingColumn.value) {
      // Update existing column using tableView's updateField method
      await tableView.updateField(editingColumn.value.fieldName, {
        fieldName: columnConfig.field,
        fieldNameAlias: columnConfig.title,
        displayStructure: {
          type: columnConfig.type,
          properties: columnConfig.properties || {}
        }
      })
      ElMessage.success(`Column "${columnConfig.title}" updated`)
    } else {
      // Add new column using tableView's addField method
      await tableView.addField({
        fieldName: columnConfig.field,
        fieldNameAlias: columnConfig.title,
        displayStructure: {
          type: columnConfig.type,
          properties: columnConfig.properties || {}
        }
      })
      ElMessage.success(`Column "${columnConfig.title}" added`)
    }
    
    editingColumn.value = null
  } catch (error) {
    console.error('Error saving column:', error)
    ElMessage.error('Failed to save column')
  }
}

function handleDragStart() {
  isDragging.value = true
}

async function handleDragEnd() {
  isDragging.value = false
  try {
    // Update the view's field order with the new order from draggable
    if (tableView.currentView.value) {
      const newFieldOrder = tableView.fields.value.map(f => f.fieldName)
      await tableView.updateView(tableView.currentView.value.id, { fields: newFieldOrder })
      ElMessage.success('Column order updated')
    }
  } catch (error) {
    console.error('Error updating column order:', error)
    ElMessage.error('Failed to update column order')
  }
}

function getColumnDescription(field: CaseFieldRecord): string {
  const parts: string[] = []
  
  if (field.isRequired) parts.push('Required')
  if (field.isUnique) parts.push('Unique')
  if (field.isHidden) parts.push('Hidden')
  
  if (field.defaultValue) parts.push(`Default: ${field.defaultValue}`)
  
  return parts.join(' • ')
}

onMounted(() => {
  initializeTable()
})

watch(
  () => workspaceRouteParams.value.detailId,
  () => {
    initializeTable()
  }
)
</script>

<template>
  <el-card class="setting-section" v-loading="tableView.loading.value">
    <template #header>
      <div class="card-header">
        <h3>Columns</h3>
        <el-button ref="addButtonRef" type="primary" size="small" @click="handleAddColumn">
          <Icon name="lucide:plus" />
          Add Column
        </el-button>
      </div>
    </template>
    
    <div class="description">
      Manage table columns, types, and properties. Drag to reorder.
    </div>

    <div class="section-content">
      <!-- Column Count -->
      <div class="columns-info">
        <Icon name="lucide:columns" />
        <span>{{ tableView.fields.value.length }} {{ tableView.fields.value.length === 1 ? 'column' : 'columns' }}</span>
      </div>

      <!-- Columns List -->
      <draggable
        v-if="tableView.fields.value.length > 0"
        v-model="tableView.fields.value"
        :animation="200"
        handle=".drag-handle"
        item-key="id"
        class="columns-list"
        ghost-class="column-ghost"
        @start="handleDragStart"
        @end="handleDragEnd"
      >
        <template #item="{ element: field }">
          <div class="column-item" :class="{ dragging: isDragging }">
            <!-- Drag Handle -->
            <div class="drag-handle">
              <Icon name="lucide:grip-vertical" />
            </div>

            <!-- Column Info -->
            <div class="column-info">
              <div class="column-header">
                <span class="column-title">{{ field.fieldNameAlias }}</span>
                <el-tag 
                  v-if="field.displayStructure?.type"
                  size="small" 
                  :style="{ backgroundColor: getColumnTypeLabel(field.displayStructure.type).color + '20' }"
                >
                  {{ getColumnTypeLabel(field.displayStructure.type).label }}
                </el-tag>
              </div>
              <!-- <div class="column-meta">
                <span class="column-field">{{ field.fieldName }}</span>
                <span v-if="getColumnDescription(field)" class="column-desc">
                  {{ getColumnDescription(field) }}
                </span>
              </div> -->
            </div>

            <!-- Column Actions -->
            <div class="column-actions">
              <el-button size="small" @click="handleEditColumn(field, $event)">
                <Icon name="lucide:edit" />
                Edit
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteColumn(field)"
              >
                <Icon name="lucide:trash-2" />
                Delete
              </el-button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <Icon name="lucide:columns" :size="48" />
        <h3>No columns yet</h3>
        <p>Add columns to start building your table structure</p>
        <el-button type="primary" @click="handleAddColumn">
          <Icon name="lucide:plus" />
          Add First Column
        </el-button>
      </div>
    </div>

    <!-- Column Editor Popover -->
    <MdTableAddColumnPopover
      ref="columnPopoverRef"
      @submit="handleColumnSubmit"
    />
  </el-card>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }

  .description {
    color: var(--app-grey-500);
    font-size: var(--app-font-size-s);
    margin-bottom: var(--app-space-m);
  }
}

.section-content {
  padding: var(--app-space-m);
  background: var(--app-grey-900);
  border-radius: var(--app-border-radius);
  min-height: 300px;
}

.columns-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-grey-850);
  border-radius: var(--app-border-radius);
  margin-bottom: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--app-grey-600);
}

.columns-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.column-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  background: white;
  
  border-radius: var(--app-border-radius-s);
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-grey-950);
    border-color: var(--app-primary-color);
    
    .drag-handle {
      opacity: 1;
    }
  }

  &.dragging {
    opacity: 0.5;
  }
}

.column-ghost {
  opacity: 0.4;
  background: var(--app-primary-color-light-9);
}

.drag-handle {
  display: flex;
  align-items: center;
  cursor: grab;
  color: var(--app-grey-400);
  opacity: 0;
  transition: opacity 0.2s ease;

  &:active {
    cursor: grabbing;
  }
}

.column-info {
  flex: 1;
  min-width: 0;
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-xxs);
}

.column-title {
  font-size: var(--app-font-size-m);
  font-weight: 500;
  color: var(--app-grey-300);
}

.column-meta {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-size: var(--app-font-size-s);
  color: var(--app-grey-600);
}

.column-field {
  font-family: monospace;
  padding: 2px 6px;
  background: var(--app-grey-100);
  border-radius: var(--app-border-radius);
  color: var(--app-grey-700);
}

.column-desc {
  &::before {
    content: '•';
    margin-right: var(--app-space-xs);
  }
}

.column-actions {
  display: flex;
  gap: var(--app-space-xs);
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xxl);
  text-align: center;
  gap: var(--app-space-m);
  color: var(--app-grey-500);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-xl);
    color: var(--app-grey-700);
  }

  p {
    margin: 0;
    color: var(--app-grey-600);
  }
}
</style>
