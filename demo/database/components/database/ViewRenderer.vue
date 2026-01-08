<script lang="ts" setup>
import type { Table, View, Row, Column, SelectOption, Database, ViewType, ViewConfig } from '../../types/database'
import { useDatabase, useTable } from '../../composables/useDatabase'
import { Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import TableView from './views/TableView.vue'
import KanbanView from './views/KanbanView.vue'
import PlaceholderView from './views/PlaceholderView.vue'
import ColumnEditor from './ColumnEditor.vue'
import AddViewDialog from './AddViewDialog.vue'
import UnifiedHeader from './UnifiedHeader.vue'
import type { BreadcrumbItem, HeaderAction } from './UnifiedHeader.vue'

const props = withDefaults(defineProps<{
  database: Database
  table: Table
  view: View
  hideHeader?: boolean
}>(), {
  hideHeader: false
})

const emit = defineEmits<{
  openRecord: [tableId: string, recordId: string]
  columnsChanged: []
  viewCreated: [view: any]
  openTableSettings: []
}>()

const { createRow, deleteColumn, createColumn, reorderColumns, createView } = useTable(props.database.id, props.table.id)
const { getUsers } = useDatabase()

// Column editor state
const showColumnEditor = ref(false)
const editingColumn = ref<Column | null>(null)
const addColumnPosition = ref<{ position: 'left' | 'right'; referenceColumn: Column } | null>(null)

// Add view dialog state
const showAddViewDialog = ref(false)

// Version key to force re-render when columns change
const columnsVersion = ref(0)

// Generate a key based on view column configuration to force re-render when columns change
const viewColumnsKey = computed(() => {
  if (!props.view.columns || props.view.columns.length === 0) {
    return 'default'
  }
  // Create a simple hash based on visible columns and their order
  return props.view.columns
    .filter(c => c.visible)
    .sort((a, b) => a.order - b.order)
    .map(c => `${c.id}:${c.visible}:${c.order}`)
    .join('|')
})

function handleAddColumn() {
  editingColumn.value = null
  addColumnPosition.value = null
  showColumnEditor.value = true
}

function handleEditColumn(column: Column) {
  editingColumn.value = column
  addColumnPosition.value = null
  showColumnEditor.value = true
}

function handleAddColumnAt(position: 'left' | 'right', referenceColumn: Column) {
  editingColumn.value = null
  addColumnPosition.value = { position, referenceColumn }
  showColumnEditor.value = true
}

function handleDeleteColumn(column: Column) {
  if (confirm(`Are you sure you want to delete column "${column.title}"?`)) {
    deleteColumn(column.id)
    columnsVersion.value++
    emit('columnsChanged')
  }
}

function handleColumnSaved(newColumn: Column) {
  // If we're adding a column at a specific position, reorder columns
  if (addColumnPosition.value && newColumn) {
    const currentColumns = props.table.columns
    const referenceIndex = currentColumns.findIndex(c => c.id === addColumnPosition.value!.referenceColumn.id)
    
    if (referenceIndex !== -1) {
      // Remove the new column from its current position (it's at the end)
      const columnIds = currentColumns.filter(c => c.id !== newColumn.id).map(c => c.id)
      
      // Insert at the correct position
      const insertIndex = addColumnPosition.value.position === 'left' ? referenceIndex : referenceIndex + 1
      columnIds.splice(insertIndex, 0, newColumn.id)
      
      // Reorder
      reorderColumns(columnIds)
    }
  }
  
  columnsVersion.value++
  emit('columnsChanged')
  addColumnPosition.value = null
}

// Search state (shared with child views)
const searchQuery = ref('')

// Dialog state for creating new record
const showCreateDialog = ref(false)
const newRecordData = ref<Record<string, any>>({})

function handleCreate() {
  newRecordData.value = {}
  // Set default values
  for (const col of props.table.columns) {
    if (col.type === 'checkbox' || col.type === 'switch') {
      newRecordData.value[col.field] = false
    } else if (col.type === 'rating') {
      newRecordData.value[col.field] = 0
    } else if (col.type === 'multi-select') {
      newRecordData.value[col.field] = []
    } else if (col.type === 'relation' && col.relationConfig?.multiple) {
      newRecordData.value[col.field] = []
    } else if (col.type === 'attachment') {
      newRecordData.value[col.field] = []
    }
  }
  showCreateDialog.value = true
}

function handleSaveNewRecord() {
  createRow(newRecordData.value)
  showCreateDialog.value = false
}

function handleOpenRecord(tableId: string, recordId: string) {
  emit('openRecord', tableId, recordId)
}

// Handle add view
function handleAddView() {
  showAddViewDialog.value = true
}

// Handle create view from dialog
function handleCreateView(data: {
  name: string
  type: ViewType
  groupByField?: string
  startDateField?: string
  endDateField?: string
  dateField?: string
  titleField?: string
}) {
  if (!data.name) return
  
  // Build view config based on type
  const config: ViewConfig = {}
  
  switch (data.type) {
    case 'kanban':
      if (data.groupByField) {
        config.groupByField = data.groupByField
      }
      break
    case 'gantt':
      if (data.startDateField && data.endDateField) {
        config.startDateField = data.startDateField
        config.endDateField = data.endDateField
        if (data.titleField) config.titleField = data.titleField
      }
      break
    case 'calendar':
      if (data.dateField) {
        config.dateField = data.dateField
      }
      break
    case 'gallery':
      if (data.titleField) {
        config.titleField = data.titleField
      }
      break
  }
  
  const newView = createView({
    name: data.name,
    type: data.type,
    config
  })
  
  if (newView) {
    // ElMessage.success(`View "${data.name}" created successfully`)
    emit('viewCreated', {...newView, baseTableId:props.table.id})
  }
}

// View type icons
function getViewTypeIcon(type: View['type']): string {
  const icons: Record<View['type'], string> = {
    'table': '📋',
    'kanban': '📌',
    'gantt': '📊',
    'calendar': '📅',
    'gallery': '🖼️'
  }
  return icons[type] || '📋'
}

// Breadcrumb for UnifiedHeader
const breadcrumb = computed<BreadcrumbItem[]>(() => {
  if (props.hideHeader) return []
  
  return [
    {
      label: props.database.name
    },
    {
      label: props.table.name
    },
    {
      label: props.view.name
    }
  ]
})

// Header actions for UnifiedHeader
const headerActions = computed<HeaderAction[]>(() => {
  if (props.hideHeader) return []
  
  return [
    {
      code: 'add-record',
      label: 'Add Record',
      action: handleCreate
    },
    {
      code: 'add-view',
      label: 'Add New View',
      action: handleAddView
    },
    {
      code: 'manage-columns',
      label: 'Manage Columns',
      action: handleAddColumn
    },
    {
      code: 'table-settings',
      label: 'Table Settings',
      divided: true,
      action: () => emit('openTableSettings')
    }
  ]
})
</script>

<template>
  <div class="view-renderer" :class="{ 'no-header': hideHeader }">
    <!-- Unified Header -->
    <UnifiedHeader
      v-if="!hideHeader"
      :breadcrumb="breadcrumb"
      :context="{
        type: 'table',
        database: props.database,
        table: props.table,
        view: props.view
      }"
      :actions="headerActions"
      :show-collaborators="true"
    />

    <!-- View Content -->
    <div class="view-content">
      <!-- Table View -->
      <TableView
        v-if="view.type === 'table'"
        :key="`table-${columnsVersion}-${viewColumnsKey}`"
        :database="database"
        :table="table"
        :view="view"
        @open-record="handleOpenRecord"
        @edit-column="handleEditColumn"
        @add-column="handleAddColumnAt"
      />

      <!-- Kanban View -->
      <KanbanView
        v-else-if="view.type === 'kanban'"
        :key="`kanban-${columnsVersion}`"
        :database="database"
        :table="table"
        :view="view"
        @open-record="handleOpenRecord"
      />

      <!-- Placeholder for other views -->
      <PlaceholderView
        v-else
        :view="view"
      />
    </div>

    <!-- Create Record Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="New Record"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item
          v-for="column in table.columns.filter(c => c.type !== 'fx')"
          :key="column.id"
          :label="column.title"
          :required="column.required"
        >
          <!-- Text/Email/URL -->
          <el-input
            v-if="column.type === 'text' || column.type === 'email' || column.type === 'url'"
            v-model="newRecordData[column.field]"
            :type="column.type === 'email' ? 'email' : 'text'"
            :placeholder="`Enter ${column.title.toLowerCase()}`"
          />

          <!-- Textarea -->
          <el-input
            v-else-if="column.type === 'textarea'"
            v-model="newRecordData[column.field]"
            type="textarea"
            :rows="3"
            :placeholder="`Enter ${column.title.toLowerCase()}`"
          />

          <!-- Number -->
          <el-input-number
            v-else-if="column.type === 'number'"
            v-model="newRecordData[column.field]"
            :precision="column.decimalPlaces || 0"
            style="width: 100%"
          />

          <!-- Date -->
          <el-date-picker
            v-else-if="column.type === 'date'"
            v-model="newRecordData[column.field]"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />

          <!-- Single Select -->
          <el-select
            v-else-if="column.type === 'single-select'"
            v-model="newRecordData[column.field]"
            placeholder="Select..."
            style="width: 100%"
          >
            <el-option
              v-for="opt in column.options"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>

          <!-- User Select -->
          <el-select
            v-else-if="column.type === 'user'"
            v-model="newRecordData[column.field]"
            placeholder="Select user..."
            style="width: 100%"
          >
            <el-option
              v-for="user in getUsers()"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>

          <!-- Switch -->
          <el-switch
            v-else-if="column.type === 'switch'"
            v-model="newRecordData[column.field]"
          />

          <!-- Checkbox -->
          <el-checkbox
            v-else-if="column.type === 'checkbox'"
            v-model="newRecordData[column.field]"
          >
            {{ column.title }}
          </el-checkbox>

          <!-- Rating -->
          <el-rate
            v-else-if="column.type === 'rating'"
            v-model="newRecordData[column.field]"
            :max="column.maxRating || 5"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleSaveNewRecord">Create</el-button>
      </template>
    </el-dialog>

    <!-- Column Editor Dialog -->
    <ColumnEditor
      v-if="showColumnEditor"
      :database="database"
      :table-id="table.id"
      :column="editingColumn"
      @close="showColumnEditor = false"
      @saved="handleColumnSaved"
    />

    <!-- Add View Dialog -->
    <AddViewDialog
      v-model="showAddViewDialog"
      :columns="table.columns"
      @create="handleCreateView"
    />
  </div>
</template>

<style lang="scss" scoped>
.view-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  
  &.no-header {
    padding-top: 0;
  }
}

.view-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  // padding: var(--app-space-s);
}
</style>
