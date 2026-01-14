<script setup lang="ts">
import type { TreeItem } from '../../../composables/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord, CaseViewRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: TreeItem
  dataTableId: string
}>()

const { query } = usePglite()

// Data for detail view
const caseTable = ref<CaseTableRecord | null>(null)

const realTableError = ref<string | null>(null)
const isLoading = ref(false)

// useTableView() sets up the ColumnContext and TableDataContext providers
// that MdTable expects to inject
const tableView = useTableView()
const tableReady = ref(false)

async function loadTableData() {
  isLoading.value = true
  realTableError.value = null
  tableReady.value = false

  try {
    // Fetch case_tables record
    const tables = await query<CaseTableRecord>('SELECT * FROM case_tables WHERE id = $1', [props.dataTableId])
    caseTable.value = tables[0] || null

    if (!caseTable.value?.tableName) {
      console.error('Table not found or has no physical table name')
      return
    }

    // Set IDs on tableView - this is needed for getAllColumns() and getTableData()
    tableView.physicalTableName.value = caseTable.value.tableName
    tableView.tableId.value = caseTable.value.id
    console.log('caseTable.value', caseTable.value)

    // Load columns and table data through tableView
    // This populates the contexts that MdTable will inject
    await Promise.all([
      tableView.getAllColumns(), // Uses tableId to fetch from case_fields
      tableView.getViews() // Uses tableId to fetch from case_views
      // tableView.getTableData() // Uses physicalTableName to fetch from actual table
    ])

    tableReady.value = true
  } catch (error) {
    console.error('Error loading table data:', error)
    realTableError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadTableData()
})

watch(
  () => props.dataTableId,
  async () => {
    await loadTableData()
  }
)
</script>

<template>
  <div class="table-detail-view">
    <!-- Main Content Area -->
    <div class="table-main">
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading">
          <Icon name="material-symbols:progress-activity" />
        </el-icon>
        <span>Loading table data...</span>
      </div>

      <div v-else class="table-content">
        <!-- Use wrapper component that sets up MdTable providers -->
        <MdTable v-if="tableReady" />
      </div>
    </div>

    <!-- Debug Sidebar -->
    <!-- <WorkspacesTableDataDebugSidebar
      v-if="!isLoading"
      :menu-item="menuItem"
      :case-table="caseTable"
      :case-fields="caseFields"
      :case-views="caseViews"
      :real-table-data="realTableData"
      :real-table-error="realTableError"
    /> -->
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
  overflow: auto;

  .empty-icon {
    font-size: 80px;
    color: var(--el-text-color-placeholder);
  }

  :deep(.el-empty__image) {
    width: auto;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--el-text-color-secondary);

  p {
    margin: 0;
  }
}
</style>
