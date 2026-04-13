<script lang="ts" setup>
import type { Database } from '../../types/database'
import { useDatabase } from '../../composables/useDatabase'
import { Download } from '@element-plus/icons-vue'

const emit = defineEmits<{
  select: [database: Database]
}>()

const { databases, createDatabase, deleteDatabase } = useDatabase()

// Dialog state
const showCreateDialog = ref(false)
const newDbName = ref('')
const newDbDescription = ref('')
const newDbColor = ref('#3b82f6')

const colorOptions = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

// Table columns
const columns = [
  {
    field: 'name',
    title: 'Database Name',
    width: 250,
    sortable: true,
    slots: { default: 'cell_name' }
  },
  {
    field: 'description',
    title: 'Description',
    minWidth: 300,
    showOverflow: true,
    sortable: true
  },
  {
    field: 'tables',
    title: 'Tables',
    width: 120,
    align: 'center',
    sortable: true,
    slots: { default: 'cell_tables' }
  },
  {
    field: 'updatedAt',
    title: 'Last Updated',
    width: 180,
    sortable: true,
    slots: { default: 'cell_date' }
  }
]

// Mock API function for useVxeTable
async function mockDatabaseApi() {
  return {
    data: {
      entryList: databases.value,
      totalSize: databases.value.length
    }
  }
}

// Use project standard useVxeTable
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'database-list-table',
  columns,
  api: mockDatabaseApi,
  pagination: false,
  dblClickAction: ({ row }: { row: Database }) => {
    handleSelectDatabase(row)
  },
  bodyActions: [
    [
      {
        code: 'open',
        name: 'Open',
        action: ({ row }: { row: Database }) => {
          handleSelectDatabase(row)
        }
      },
      {
        code: 'delete',
        name: 'Delete',
        action: ({ row }: { row: Database }) => {
          if (confirm(`Are you sure you want to delete "${row.name}"?`)) {
            deleteDatabase(row.id)
            reload()
          }
        }
      }
    ]
  ]
})

function handleCreateDatabase() {
  if (!newDbName.value.trim()) return
  
  createDatabase({
    name: newDbName.value.trim(),
    description: newDbDescription.value.trim(),
    color: newDbColor.value
  })
  
  // Reset form
  newDbName.value = ''
  newDbDescription.value = ''
  newDbColor.value = '#3b82f6'
  showCreateDialog.value = false
  
  // Reload table
  reload()
}

function handleSelectDatabase(db: Database) {
  emit('select', db)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Export to Excel
function handleExportExcel() {
  const $table = tableRef.value as any
  if (!$table) return

  $table.exportData({
    filename: `Databases_${new Date().toISOString().split('T')[0]}`,
    type: 'xlsx',
    mode: 'all'
  })
}
</script>

<template>
  <div class="database-list">
    

    <div class="table-container">
      <vxe-grid
        ref="tableRef"
        v-bind="tableConfig"
        v-on="tableEvent"
      >
        <!-- Name column with color indicator -->
        <template #cell_name="{ row }">
          <div class="name-cell">
            <div class="db-color" :style="{ backgroundColor: row.color }" />
            <span class="db-name">{{ row.name }}</span>
          </div>
        </template>

        <!-- Tables count column -->
        <template #cell_tables="{ row }">
          <el-tag size="small" type="primary">
            {{ row.tables.length }} {{ row.tables.length === 1 ? 'table' : 'tables' }}
          </el-tag>
        </template>

        <!-- Date column -->
        <template #cell_date="{ row }">
          <span class="date-cell">{{ formatDate(row.updatedAt) }}</span>
        </template>
      </vxe-grid>
    </div>

    <!-- Create Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="Create New Database"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Name" required>
          <el-input
            v-model="newDbName"
            placeholder="Enter database name"
            @keydown.enter="handleCreateDatabase"
          />
        </el-form-item>
        <el-form-item label="Description">
          <el-input
            v-model="newDbDescription"
            type="textarea"
            :rows="3"
            placeholder="Enter description (optional)"
          />
        </el-form-item>
        <el-form-item label="Color">
          <div class="color-picker">
            <button
              v-for="color in colorOptions"
              :key="color"
              class="color-option"
              :class="{ selected: newDbColor === color }"
              :style="{ backgroundColor: color }"
              :aria-label="`Select color ${color}`"
              @click="newDbColor = color"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" :disabled="!newDbName.trim()" @click="handleCreateDatabase">
          Create
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.database-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-bg-color-page);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-m) var(--app-space-l);
  background: var(--app-paper);
  border-bottom: 1px solid var(--app-border-color);

  h1 {
    font-size: var(--app-font-size-xxl);
    font-weight: var(--app-font-weight-title);
    color: var(--app-text-color-primary);
    margin: 0;
  }

  .icon {
    font-size: var(--app-font-size-l);
    font-weight: 400;
    margin-right: var(--app-space-xxs);
  }
}

.header-actions {
  display: flex;
  gap: var(--app-space-s);
}

.table-container {
  flex: 1;
  overflow: hidden;
  padding: var(--app-space-m);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.db-color {
  width: 24px;
  height: 24px;
  border-radius: var(--app-border-radius-s);
  flex-shrink: 0;
}

.db-name {
  font-weight: 500;
  color: var(--app-text-color-primary);
}

.date-cell {
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.color-picker {
  display: flex;
  gap: var(--app-space-s);
  flex-wrap: wrap;
}

.color-option {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: all 0.2s ease;

  &.selected {
    border-color: var(--app-text-color-primary);
    transform: scale(1.1);
  }

  &:hover {
    transform: scale(1.1);
  }
}
</style>

