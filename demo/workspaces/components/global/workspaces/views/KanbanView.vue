<script setup lang="ts">
import type { CaseViewRecord } from '../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  view: CaseViewRecord
  tableView: ReturnType<typeof useTableView>
}>()

const emit = defineEmits<{
  saveView: []
}>()

const groupByField = computed(() => {
  return props.view.viewSettings?.kanban?.groupByField || ''
})

const groupByFieldLabel = computed(() => {
  if (!groupByField.value) return 'Not configured'
  const field = props.tableView.fields.value.find(f => f.fieldName === groupByField.value)
  return field?.fieldNameAlias || groupByField.value
})

// Group data by the specified field
const groupedData = computed(() => {
  if (!groupByField.value || !props.tableView.tableData.value) {
    return new Map<string, any[]>()
  }
  
  const groups = new Map<string, any[]>()
  
  for (const row of props.tableView.tableData.value) {
    const groupValue = row[groupByField.value] || 'Uncategorized'
    if (!groups.has(groupValue)) {
      groups.set(groupValue, [])
    }
    groups.get(groupValue)!.push(row)
  }
  
  return groups
})

const columns = computed(() => {
  return Array.from(groupedData.value.keys())
})

const isLoading = ref(true)

async function loadData() {
  isLoading.value = true
  try {
    await props.tableView.getTableData()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="kanban-view-container">
    <!-- Configuration Info -->
    <div class="kanban-header">
      <div class="config-info">
        <span class="config-label">Grouped by:</span>
        <el-tag size="small" type="info">{{ groupByFieldLabel }}</el-tag>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading kanban data...</span>
    </div>
    
    <!-- Kanban Board -->
    <div v-else class="kanban-board">
      <div 
        v-for="column in columns" 
        :key="column" 
        class="kanban-column"
      >
        <div class="column-header">
          <span class="column-title">{{ column }}</span>
          <el-badge :value="groupedData.get(column)?.length || 0" type="info" />
        </div>
        <div class="column-content">
          <div 
            v-for="item in groupedData.get(column)" 
            :key="item.id" 
            class="kanban-card"
          >
            <div class="card-content">
              <!-- Display first few fields as card content -->
              <template v-for="field in tableView.fields.value.slice(0, 3)" :key="field.id">
                <div v-if="field.fieldName !== groupByField" class="card-field">
                  <span class="field-label">{{ field.fieldNameAlias }}:</span>
                  <span class="field-value">{{ item[field.fieldName] || '-' }}</span>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Empty column state -->
          <div v-if="!groupedData.get(column)?.length" class="empty-column">
            No items
          </div>
        </div>
      </div>
      
      <!-- No data state -->
      <div v-if="columns.length === 0" class="empty-board">
        <Icon name="material-symbols:view-kanban-outline" class="empty-icon" />
        <p>No data to display</p>
        <p class="hint">Add records to see them organized in the kanban view</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.kanban-view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.kanban-header {
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.config-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  
  .config-label {
    color: var(--el-text-color-secondary);
    font-size: var(--app-font-size-s);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    font-size: 32px;
  }
}

.kanban-board {
  flex: 1;
  display: flex;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  overflow-x: auto;
  overflow-y: hidden;
}

.kanban-column {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--el-border-color);
  max-height: 100%;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-m);
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
  
  .column-title {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.kanban-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius);
  padding: var(--app-space-m);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.card-field {
  display: flex;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  
  .field-label {
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
  
  .field-value {
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-l);
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.empty-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--el-text-color-secondary);
  text-align: center;
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: var(--app-space-m);
    color: var(--el-text-color-placeholder);
  }
  
  p {
    margin: 0;
  }
  
  .hint {
    font-size: var(--app-font-size-s);
    margin-top: var(--app-space-xs);
  }
}
</style>
