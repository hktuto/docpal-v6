<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'
import type { CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'
import draggable from 'vuedraggable'

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
const { query } = usePglite()

const fields = ref<CaseFieldRecord[]>([])
const loading = ref(false)
const isDragging = ref(false)

// Column editor state
const showColumnEditor = ref(false)
const editingColumn = ref<CaseFieldRecord | null>(null)

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

async function loadFields() {
  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || treeItem.itemType !== 'table' || !treeItem.itemId) return

  loading.value = true
  try {
    const data = await query<CaseFieldRecord[]>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt" ASC`,
      [treeItem.itemId]
    )
    fields.value = data
  } catch (error) {
    console.error('Error loading fields:', error)
    ElMessage.error('Failed to load columns')
  } finally {
    loading.value = false
  }
}

function handleAddColumn() {
  editingColumn.value = null
  showColumnEditor.value = true
}

function handleEditColumn(field: CaseFieldRecord) {
  editingColumn.value = field
  showColumnEditor.value = true
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

    const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
    if (!treeItem || !treeItem.itemId) return

    // Delete field from case_fields
    await query(`DELETE FROM case_fields WHERE id = $1`, [field.id])
    
    // Remove from local state
    fields.value = fields.value.filter(f => f.id !== field.id)
    
    ElMessage.success(`Column "${field.fieldNameAlias}" deleted`)
  } catch (error) {
    // User cancelled or error occurred
    if (error !== 'cancel') {
      console.error('Error deleting column:', error)
      ElMessage.error('Failed to delete column')
    }
  }
}

function handleColumnSaved() {
  showColumnEditor.value = false
  editingColumn.value = null
  loadFields()
}

function handleDragStart() {
  isDragging.value = true
}

async function handleDragEnd() {
  isDragging.value = false
  // TODO: Implement column reordering in database
  ElMessage.success('Column order updated')
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
  loadFields()
})

watch(
  () => workspaceRouteParams.value.detailId,
  () => {
    loadFields()
  }
)
</script>

<template>
  <el-card class="setting-section" v-loading="loading">
    <template #header>
      <div class="card-header">
        <h3>Columns</h3>
        <el-button type="primary" size="small" @click="handleAddColumn">
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
        <span>{{ fields.length }} {{ fields.length === 1 ? 'column' : 'columns' }}</span>
      </div>

      <!-- Columns List -->
      <draggable
        v-if="fields.length > 0"
        v-model="fields"
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
              <div class="column-meta">
                <span class="column-field">{{ field.fieldName }}</span>
                <span v-if="getColumnDescription(field)" class="column-desc">
                  {{ getColumnDescription(field) }}
                </span>
              </div>
            </div>

            <!-- Column Actions -->
            <div class="column-actions">
              <el-button size="small" @click="handleEditColumn(field)">
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

    <!-- Column Editor Dialog -->
    <WorkspacesSettingTableColumnsEditor
      v-if="showColumnEditor"
      :column="editingColumn"
      @close="showColumnEditor = false"
      @saved="handleColumnSaved"
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
  background: var(--app-grey-50);
  border-radius: var(--app-border-radius);
  min-height: 300px;
}

.columns-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-grey-100);
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
  border: 1px solid var(--app-grey-200);
  border-radius: var(--app-border-radius);
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-grey-50);
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
  color: var(--app-grey-900);
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
