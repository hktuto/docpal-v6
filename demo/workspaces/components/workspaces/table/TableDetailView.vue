<script setup lang="ts">
import { ElMessage } from 'element-plus'
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

// Create Relation Dialogs
const createRelationDialogRef = ref()
const createReverseRelationDialogRef = ref()
const pendingRelationColumn = ref<any>(null)
const pendingReverseRelationColumn = ref<any>(null)

async function loadTableData() {
  isLoading.value = true
  realTableError.value = null
  tableReady.value = false

  try {
    // Fetch case_tables record
    await tableView.initializeTableView(props.dataTableId)

    tableReady.value = true
  } catch (error) {
    console.error('Error loading table data:', error)
    realTableError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

function handleCreateRelation(column: any) {
  pendingRelationColumn.value = column
  createRelationDialogRef.value?.open(
    column,
    tableView.tableId.value,
    tableView.physicalTableName.value
  )
}

async function handleRelationCreated(data: {
  targetTableId: string
  targetFieldId: string
  displayFieldId: string
  relationColumnName: string
  allowMultiple: boolean
}) {
  if (!pendingRelationColumn.value) return

  try {
    await tableView.createRelationFromColumn(
      pendingRelationColumn.value.field,
      data.targetTableId,
      data.targetFieldId,
      data.displayFieldId,
      data.relationColumnName,
      data.allowMultiple
    )
    
    ElMessage.success('Relation column created successfully')
    pendingRelationColumn.value = null
  } catch (error) {
    console.error('Error creating relation:', error)
    ElMessage.error('Failed to create relation column')
  }
}

function handleCreateReverseRelation(column: any) {
  pendingReverseRelationColumn.value = column
  
  // Get the current table name for display
  const currentTable = tableView.tableId.value
  query<any>(`SELECT name FROM case_tables WHERE id = $1`, [currentTable])
    .then(result => {
      const tableName = result[0]?.name || 'Current Table'
      createReverseRelationDialogRef.value?.open(
        column,
        tableView.tableId.value,
        tableName,
        tableView.physicalTableName.value
      )
    })
}

async function handleReverseRelationCreated(data: {
  targetTableId: string
  targetFieldId: string
  relationColumnName: string
  displayFieldId: string
  allowMultiple: boolean
}) {
  if (!pendingReverseRelationColumn.value) return

  try {
    await tableView.createReverseRelationToOtherTable(
      pendingReverseRelationColumn.value.field,
      data.targetTableId,
      data.targetFieldId,
      data.relationColumnName,
      data.displayFieldId,
      data.allowMultiple
    )
    
    ElMessage.success('Reverse relation column created successfully in target table')
    pendingReverseRelationColumn.value = null
  } catch (error) {
    console.error('Error creating reverse relation:', error)
    ElMessage.error('Failed to create reverse relation column')
  }
}

// Provide the create relation handlers so MdTable can access them
provide('handleCreateRelation', handleCreateRelation)
provide('handleCreateReverseRelation', handleCreateReverseRelation)

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

    <!-- Create Relation Dialogs -->
    <WorkspacesDialogsCreateRelationDialog
      ref="createRelationDialogRef"
      @created="handleRelationCreated"
    />
    <WorkspacesDialogsCreateReverseRelationDialog
      ref="createReverseRelationDialogRef"
      @created="handleReverseRelationCreated"
    />

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
