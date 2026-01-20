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

// Create Relation Dialog
const createRelationDialogRef = ref()
const relationSuggestionsDialogRef = ref()
const pendingRelationColumn = ref<any>(null)

// Relation Suggestions
const { getPendingSuggestions, acceptSuggestion } = useRelationSuggestions()
const suggestionStatus = ref<string>('none')
const suggestionCount = ref(0)

async function loadTableData() {
  isLoading.value = true
  realTableError.value = null
  tableReady.value = false

  try {
    // Fetch case_tables record
    await tableView.initializeTableView(props.dataTableId)

    tableReady.value = true
    
    // Load suggestion status
    await loadSuggestionStatus()
  } catch (error) {
    console.error('Error loading table data:', error)
    realTableError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function loadSuggestionStatus() {
  try {
    // Get table's suggestion status
    const tableData = await query<CaseTableRecord>(
      `SELECT "suggestionStatus" FROM case_tables WHERE id = $1`,
      [props.dataTableId]
    )
    
    if (tableData.length > 0) {
      suggestionStatus.value = tableData[0].suggestionStatus || 'none'
      
      // If ready, count pending suggestions
      if (suggestionStatus.value === 'ready') {
        const suggestions = await getPendingSuggestions(props.dataTableId)
        suggestionCount.value = suggestions.length
      }
    }
  } catch (error) {
    console.error('Error loading suggestion status:', error)
  }
}

function openSuggestionsDialog() {
  relationSuggestionsDialogRef.value?.open(props.dataTableId)
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

async function handleSuggestionAccepted(data: { suggestion: any; displayFieldId: string }) {
  const { suggestion, displayFieldId } = data
  
  try {
    // Get the source field by ID from database
    const sourceFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [suggestion.sourceFieldId]
    )
    
    if (sourceFieldData.length === 0) {
      ElMessage.error('Source field not found')
      return
    }
    
    const sourceField = sourceFieldData[0]

    // Create the relation using the suggestion (always multiple)
    await tableView.createRelationFromColumn(
      sourceField.fieldName,
      suggestion.targetTableId,
      suggestion.targetFieldId,
      displayFieldId, // Use user-selected display field
      `${sourceField.fieldNameAlias} → ${suggestion.targetTableName}`,
      true // Always create as multiple relation
    )
    
    // Mark suggestion as accepted
    await acceptSuggestion(suggestion.id)
    
    // Reload suggestion status and check if we need to update table status
    await updateSuggestionStatusAfterChange()
    
    ElMessage.success('Relation created from suggestion')
  } catch (error) {
    console.error('Error creating relation from suggestion:', error)
    ElMessage.error('Failed to create relation')
  }
}

async function handleSuggestionDismissed() {
  // Reload suggestion status after dismissal
  await updateSuggestionStatusAfterChange()
}

async function handleAllSuggestionsDismissed() {
  // All suggestions dismissed, update table status to 'none'
  await query(
    `UPDATE case_tables SET "suggestionStatus" = 'none', "updatedAt" = $1 WHERE id = $2`,
    [new Date(), props.dataTableId]
  )
  await loadSuggestionStatus()
}

async function updateSuggestionStatusAfterChange() {
  // Reload suggestion status to update badge
  await loadSuggestionStatus()
  
  // If no more pending suggestions, update table status to 'none'
  if (suggestionCount.value === 0 && suggestionStatus.value === 'ready') {
    await query(
      `UPDATE case_tables SET "suggestionStatus" = 'none', "updatedAt" = $1 WHERE id = $2`,
      [new Date(), props.dataTableId]
    )
    suggestionStatus.value = 'none'
  }
}

// Provide the create relation handler so MdTable can access it
provide('handleCreateRelation', handleCreateRelation)

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
        <!-- Suggestion Status Badge -->
        <div v-if="suggestionStatus !== 'none'" class="suggestion-badge-container">
          <Teleport to="#database-table-header-right">
            <el-badge
              v-if="suggestionStatus === 'ready' && suggestionCount > 0"
              :value="suggestionCount"
              class="suggestion-badge"
            >
              <el-button
                type="primary"
                size="small"
                @click="openSuggestionsDialog"
              >
                <Icon name="lucide:lightbulb" class="badge-icon" />
                View Relation Suggestions
              </el-button>
            </el-badge>
            
            <el-tag v-else-if="suggestionStatus === 'analyzing'" type="info" size="large">
              <Icon name="lucide:loader-2" class="badge-icon spinning" />
              Analyzing relations...
            </el-tag>
            
            <el-tag v-else-if="suggestionStatus === 'error'" type="danger" size="large">
              <Icon name="lucide:alert-circle" class="badge-icon" />
              Error analyzing relations
            </el-tag>
          </Teleport>
        </div>
        
        <!-- Use wrapper component that sets up MdTable providers -->
        <MdTable v-if="tableReady" />
      </div>
    </div>

    <!-- Create Relation Dialog -->
    <WorkspacesDialogsCreateRelationDialog
      ref="createRelationDialogRef"
      @created="handleRelationCreated"
    />

    <!-- Relation Suggestions Dialog -->
    <WorkspacesDialogsRelationSuggestionsDialog
      ref="relationSuggestionsDialogRef"
      @accepted="handleSuggestionAccepted"
      @dismissed="handleSuggestionDismissed"
      @dismissed-all="handleAllSuggestionsDismissed"
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

.suggestion-badge-container {
  margin-bottom: var(--app-space-m);
  display: flex;
  justify-content: center;
}

.suggestion-badge {
  .badge-icon {
    margin-right: var(--app-space-xs);
    vertical-align: middle;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
