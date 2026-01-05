<script lang="ts" setup>
import type { Database, Table, Column } from '../../../types/database'
import { useTable } from '../../../composables/useDatabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import ColumnEditor from '../ColumnEditor.vue'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

const { deleteColumn, reorderColumns } = useTable(props.database.id, props.table.id)

// Column editor state
const showColumnEditor = ref(false)
const editingColumn = ref<Column | null>(null)

// Drag state
const isDragging = ref(false)

// Local columns for drag-drop
const localColumns = ref<Column[]>([])

// Initialize local columns
watchEffect(() => {
  localColumns.value = [...props.table.columns]
})

// Column type labels and icons
const columnTypeInfo: Record<string, { label: string; icon: string; color: string }> = {
  'text': { label: 'Text', icon: '📝', color: '#409EFF' },
  'textarea': { label: 'Long Text', icon: '📄', color: '#409EFF' },
  'number': { label: 'Number', icon: '#️⃣', color: '#67C23A' },
  'single-select': { label: 'Single Select', icon: '🔽', color: '#E6A23C' },
  'multi-select': { label: 'Multi Select', icon: '☑️', color: '#E6A23C' },
  'date': { label: 'Date', icon: '📅', color: '#F56C6C' },
  'checkbox': { label: 'Checkbox', icon: '☑️', color: '#909399' },
  'switch': { label: 'Switch', icon: '🔘', color: '#909399' },
  'user': { label: 'User', icon: '👤', color: '#409EFF' },
  'rating': { label: 'Rating', icon: '⭐', color: '#E6A23C' },
  'email': { label: 'Email', icon: '📧', color: '#409EFF' },
  'url': { label: 'URL', icon: '🔗', color: '#409EFF' },
  'attachment': { label: 'Attachment', icon: '📎', color: '#909399' },
  'relation': { label: 'Relation', icon: '🔗', color: '#F56C6C' },
  'fx': { label: 'Formula', icon: 'ƒ', color: '#67C23A' },
  'rollup': { label: 'Rollup', icon: '∑', color: '#67C23A' }
}

function getColumnTypeInfo(type: string) {
  return columnTypeInfo[type] || { label: type, icon: '❓', color: '#909399' }
}

function handleAddColumn() {
  editingColumn.value = null
  showColumnEditor.value = true
}

function handleEditColumn(column: Column) {
  editingColumn.value = column
  showColumnEditor.value = true
}

function handleDeleteColumn(column: Column) {
  ElMessageBox.confirm(
    `Are you sure you want to delete the column "${column.title}"? This action cannot be undone.`,
    'Delete Column',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    deleteColumn(column.id)
    ElMessage.success(`Column "${column.title}" deleted`)
    emit('updated')
  }).catch(() => {})
}

function handleColumnSaved() {
  showColumnEditor.value = false
  editingColumn.value = null
  emit('updated')
}

function handleDragEnd() {
  isDragging.value = false
  // Reorder columns based on new order
  const columnIds = localColumns.value.map(c => c.id)
  reorderColumns(columnIds)
  ElMessage.success('Column order updated')
  emit('updated')
}

function handleDragStart() {
  isDragging.value = true
}

function getColumnDescription(column: Column): string {
  const parts: string[] = []
  
  if (column.required) parts.push('Required')
  
  switch (column.type) {
    case 'number':
      if (column.decimalPlaces) parts.push(`${column.decimalPlaces} decimals`)
      break
    case 'single-select':
    case 'multi-select':
      if (column.options) parts.push(`${column.options.length} options`)
      break
    case 'rating':
      if (column.maxRating) parts.push(`Max: ${column.maxRating}`)
      break
    case 'relation':
      if (column.relationConfig) {
        const table = props.database.tables.find(t => t.id === column.relationConfig?.tableId)
        if (table) parts.push(`→ ${table.name}`)
      }
      break
  }
  
  return parts.join(' • ') || 'No configuration'
}
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <div class="header-content">
        <div>
          <h2 class="section-title">Fields</h2>
          <p class="section-description">
            Manage table columns, types, and properties. Drag to reorder.
          </p>
        </div>
        <el-button type="primary" @click="handleAddColumn">
          <el-icon><Plus /></el-icon>
          Add Field
        </el-button>
      </div>
    </div>

    <div class="section-content">
      <!-- Column Count -->
      <div class="columns-info">
        <el-icon><Grid /></el-icon>
        <span>{{ localColumns.length }} {{ localColumns.length === 1 ? 'field' : 'fields' }}</span>
      </div>

      <!-- Columns List -->
      <draggable
        v-model="localColumns"
        :animation="200"
        handle=".drag-handle"
        item-key="id"
        class="columns-list"
        ghost-class="column-ghost"
        @start="handleDragStart"
        @end="handleDragEnd"
      >
        <template #item="{ element: column }">
          <div class="column-item" :class="{ dragging: isDragging }">
            <!-- Drag Handle -->
            <div class="drag-handle">
              <el-icon><Grid /></el-icon>
            </div>

            <!-- Column Info -->
            <div class="column-info">
              <div class="column-header">
                <span class="column-title">{{ column.title }}</span>
                <el-tag size="small" :color="getColumnTypeInfo(column.type).color + '20'">
                  {{ getColumnTypeInfo(column.type).label }}
                </el-tag>
              </div>
              <div class="column-meta">
                <span class="column-field">{{ column.field }}</span>
                <span v-if="getColumnDescription(column)" class="column-desc">
                  {{ getColumnDescription(column) }}
                </span>
              </div>
            </div>

            <!-- Column Actions -->
            <div class="column-actions">
              <el-button size="small" @click="handleEditColumn(column)">
                <el-icon><Edit /></el-icon>
                Edit
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteColumn(column)"
              >
                <el-icon><Delete /></el-icon>
                Delete
              </el-button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty State -->
      <div v-if="localColumns.length === 0" class="empty-state">
        <el-icon :size="48"><Document /></el-icon>
        <h3>No fields yet</h3>
        <p>Add fields to start building your table structure</p>
        <el-button type="primary" @click="handleAddColumn">
          <el-icon><Plus /></el-icon>
          Add First Field
        </el-button>
      </div>
    </div>

    <!-- Column Editor -->
    <ColumnEditor
      v-if="showColumnEditor"
      :database="database"
      :table-id="table.id"
      :column="editingColumn"
      @close="showColumnEditor = false"
      @saved="handleColumnSaved"
    />
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 1000px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-title {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-xxl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
}

.section-content {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
  min-height: 400px;
}

.columns-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-s);
  margin-bottom: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
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
  background: var(--app-fill-color-light);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-fill-color);
    border-color: var(--app-primary-color-light-7);
    
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
  color: var(--app-text-color-placeholder);
  opacity: 0;
  transition: opacity 0.2s ease;

  &:active {
    cursor: grabbing;
  }

  .el-icon {
    font-size: var(--app-font-size-l);
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
  color: var(--app-text-color-primary);
}

.column-meta {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.column-field {
  font-family: monospace;
  padding: 2px 6px;
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-xs);
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

  .el-icon {
    color: var(--app-text-color-placeholder);
  }

  h3 {
    margin: 0;
    font-size: var(--app-font-size-xl);
    color: var(--app-text-color-primary);
  }

  p {
    margin: 0;
    color: var(--app-text-color-secondary);
  }
}
</style>

