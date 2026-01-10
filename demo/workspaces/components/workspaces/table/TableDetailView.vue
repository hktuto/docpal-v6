<script setup lang="ts">
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import type { DataTableType, DataTableColumnType, TableMigrationType } from '../../../utils/db/schema/table'

const props = defineProps<{
  menuItem: MenuItem
  dataTableId: string
}>()

const { query } = usePglite()

// Data for detail view
// Note: DB returns snake_case but TypeScript type uses camelCase
const dataTableRecord = ref<(DataTableType & { table_name?: string }) | null>(null)
const dataTableColumns = ref<DataTableColumnType[]>([])
const tableMigrations = ref<TableMigrationType[]>([])
const realTableData = ref<any[]>([])
const realTableError = ref<string | null>(null)
const isLoading = ref(false)

const tableView = useTableView()

async function loadTableData() {
  isLoading.value = true
  realTableError.value = null
  try {
    // Fetch data_tables record
    const tables = await query<DataTableType>(
      'SELECT * FROM data_tables WHERE id = $1',
      [props.dataTableId]
    )
    dataTableRecord.value = tables[0] || null

    // Fetch data_table_columns
    const columns = await query<DataTableColumnType>(
      'SELECT * FROM data_table_columns WHERE data_table_id = $1 ORDER BY created_at ASC',
      [props.dataTableId]
    )
    dataTableColumns.value = columns

    // Fetch table_migrations
    const migrations = await query<TableMigrationType>(
      'SELECT * FROM table_migrations WHERE data_table_id = $1 ORDER BY version ASC',
      [props.dataTableId]
    )
    tableMigrations.value = migrations

    // Fetch data from the real/dynamic table
    if (dataTableRecord.value?.table_name) {
      try {
        const realData = await query<any>(
          `SELECT * FROM "${dataTableRecord.value.table_name}" ORDER BY created_at DESC LIMIT 100`
        )
        realTableData.value = realData
      } catch (err: any) {
        console.error('Error fetching real table data:', err)
        realTableError.value = err.message || 'Failed to fetch table data'
        realTableData.value = []
      }
    }
    
    tableView.tableId.value = dataTableRecord.value?.table_name || ''
    tableView.dataTableId.value = dataTableRecord.value?.id || ''
    console.log('tableView.dataTableId', dataTableRecord.value)
    tableView.getAllColumns()
    // tableView.getTableData()
  } catch (error) {
    console.error('Error loading table data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTableData()
})

watch(() => props.dataTableId, () => {
  loadTableData()
})
</script>

<template>
  <div class="table-detail-view">
    <!-- Main Content Area -->
    <div class="table-main">
      <!-- <div class="table-header">
        <h2>{{ menuItem.label }}</h2>
        <p v-if="menuItem.description">{{ menuItem.description }}</p>
      </div> -->
      
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading">
          <Icon name="material-symbols:progress-activity" />
        </el-icon>
        <span>Loading table data...</span>
      </div>

      <div v-else class="table-content">
        <!-- Table will be added here -->
        <MdTable ref="tableRef" ></MdTable>
      </div>
    </div>

    <!-- Debug Sidebar -->
    <WorkspacesTableDataDebugSidebar
      v-if="!isLoading"
      :menu-item="menuItem"
      :data-table-record="dataTableRecord"
      :data-table-columns="dataTableColumns"
      :table-migrations="tableMigrations"
      :real-table-data="realTableData"
      :real-table-error="realTableError"
    />
  </div>
</template>

<style lang="scss" scoped>
.table-detail-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.table-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--app-space-m);
  overflow: hidden;
  min-width: 0;
}

.table-header {
  flex-shrink: 0;
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: var(--el-text-color-secondary);
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

.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;
  
  .empty-icon {
    font-size: 80px;
    color: var(--el-text-color-placeholder);
  }
  
  :deep(.el-empty__image) {
    width: auto;
  }
}
</style>
