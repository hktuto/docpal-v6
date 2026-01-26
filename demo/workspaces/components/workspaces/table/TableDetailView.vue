<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { TreeItem } from '../../../composables/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord, CaseViewRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: TreeItem
  dataTableId: string
}>()

const { query } = usePglite()
const { navigateToRecord } = useSingleWorkspaceContext()

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

// Import Dialog
const importToTableDialogRef = ref()

// Drag-and-drop state for file import
const isDraggingFile = ref(false)
let dragCounter = 0 // Track nested drag events

// Relation Suggestions
const { getPendingSuggestions, acceptSuggestion, analyzeTableForRelations, dismissSuggestionsByTargetTable, dismissSuggestion } = useRelationSuggestions()
const suggestionStatus = ref<string>('none')
const suggestionCount = ref(0)
const isAnalyzing = ref(false)

// Track suggestions by field for column badges
const suggestionsByField = ref<Map<string, { count: number; fieldId: string }>>(new Map())
const columnSuggestionPopoverRef = ref()

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

/**
 * Load suggestions grouped by field name for column header badges
 */
async function loadSuggestionsByField() {
  try {
    const suggestions = await getPendingSuggestions(props.dataTableId)
    
    // Build map of fieldName -> suggestion count
    const fieldMap = new Map<string, { count: number; fieldId: string }>()
    for (const suggestion of suggestions) {
      // Get field name for this field ID
      const fieldData = await query<CaseFieldRecord>(
        `SELECT "fieldName" FROM case_fields WHERE id = $1`,
        [suggestion.sourceFieldId]
      )
      if (fieldData.length > 0) {
        const fieldName = fieldData[0].fieldName
        const existing = fieldMap.get(fieldName)
        if (existing) {
          existing.count++
        } else {
          fieldMap.set(fieldName, { count: 1, fieldId: suggestion.sourceFieldId })
        }
      }
    }
    suggestionsByField.value = fieldMap
  } catch (error) {
    console.error('Error loading suggestions by field:', error)
  }
}

async function loadSuggestionStatus() {
  try {
    // Get table's suggestion status from database
    const tableData = await query<CaseTableRecord>(
      `SELECT "suggestionStatus", "entityId" FROM case_tables WHERE id = $1`,
      [props.dataTableId]
    )
    
    if (tableData.length > 0) {
      const currentStatus = tableData[0].suggestionStatus || 'none'
      suggestionStatus.value = currentStatus
      
      // If ready, count pending suggestions and group by field
      if (currentStatus === 'ready') {
        const suggestions = await getPendingSuggestions(props.dataTableId)
        suggestionCount.value = suggestions.length
        await loadSuggestionsByField()
      } else {
        suggestionsByField.value = new Map()
      }
      
      // If pending, trigger analysis immediately
      if (currentStatus === 'pending' && !isAnalyzing.value) {
         runAnalysis(tableData[0].entityId)
      }
    }
  } catch (error) {
    console.error('Error loading suggestion status:', error)
  }
}

async function runAnalysis(entityId: string) {
  if (isAnalyzing.value) {
    console.log('[TableDetailView] Analysis already in progress, skipping')
    return
  }
  
  try {
    isAnalyzing.value = true
    suggestionStatus.value = 'processing'
    
    // Update database status to 'processing'
    await query(
      `UPDATE case_tables 
       SET "suggestionStatus" = 'processing', "updatedAt" = $1 
       WHERE id = $2`,
      [new Date(), props.dataTableId]
    )
    
    console.log(`[TableDetailView] Starting analysis for table: ${props.dataTableId}`)
    
    // Run the analysis
    const suggestionsCount = await analyzeTableForRelations(props.dataTableId, entityId)
    
    console.log(`[TableDetailView] Analysis complete. Found ${suggestionsCount} suggestions`)
    
    // Update status based on results
    const newStatus = suggestionsCount > 0 ? 'ready' : 'none'
    await query(
      `UPDATE case_tables 
       SET "suggestionStatus" = $1, "updatedAt" = $2 
       WHERE id = $3`,
      [newStatus, new Date(), props.dataTableId]
    )
    
    // Update local state
    suggestionStatus.value = newStatus
    suggestionCount.value = suggestionsCount
    
    // Reload suggestionsByField to update column header badges
    if (suggestionsCount > 0) {
      await loadSuggestionsByField()
    } else {
      suggestionsByField.value = new Map()
    }
    
    // Show notification if suggestions found
    if (suggestionsCount > 0) {
      ElMessage.success({
        message: `Found ${suggestionsCount} relation suggestion${suggestionsCount > 1 ? 's' : ''}!`,
        duration: 5000
      })
    }
  } catch (error) {
    console.error('[TableDetailView] Error during analysis:', error)
    
    // Update status to 'error'
    await query(
      `UPDATE case_tables 
       SET "suggestionStatus" = 'error', "updatedAt" = $1 
       WHERE id = $2`,
      [new Date(), props.dataTableId]
    )
    
    suggestionStatus.value = 'error'
    
    ElMessage.error('Failed to analyze table for relation suggestions')
  } finally {
    isAnalyzing.value = false
  }
}

function openSuggestionsDialog(e: Event) {
  e.preventDefault()
  relationSuggestionsDialogRef.value?.open(props.dataTableId, e.target)
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
  displayFieldNames: string[]
  relationColumnName: string
}) {
  if (!pendingRelationColumn.value) return

  try {
    await tableView.createRelationFromColumn(
      pendingRelationColumn.value.field,
      data.targetTableId,
      data.targetFieldId,
      data.displayFieldNames,
      data.relationColumnName
    )
    
    // Dismiss any pending suggestions for this target table
    await dismissSuggestionsByTargetTable(props.dataTableId, data.targetTableId)
    
    // Remove suggestions from the dialog UI if it's open
    relationSuggestionsDialogRef.value?.removeSuggestionsForTargetTable(data.targetTableId)
    
    // Reload suggestion status
    await updateSuggestionStatusAfterChange()
    
    // Success message is now handled by createRelationFromColumn
    pendingRelationColumn.value = null
  } catch (error) {
    console.error('Error creating relation:', error)
    ElMessage.error('Failed to create relation column')
  }
}

async function handleSuggestionAccepted(data: { suggestion: any; displayFieldNames: string[] }) {
  const { suggestion, displayFieldNames } = data
  
  try {
    // Get the source field by ID from database
    const sourceFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [suggestion.sourceFieldId]
    )
    
    if (sourceFieldData.length === 0) {
      ElMessage.error('Source field not found')
      relationSuggestionsDialogRef.value?.resetSuggestionLoading(suggestion.id)
      return
    }
    
    const sourceField = sourceFieldData[0]

    // Create the relation using the suggestion with multiple display fields
    await tableView.createRelationFromColumn(
      sourceField.fieldName,
      suggestion.targetTableId,
      suggestion.targetFieldId,
      displayFieldNames, // Use user-selected display field names (array)
      `${sourceField.fieldNameAlias} → ${suggestion.targetTableName}`
    )
    
    // Mark suggestion as accepted
    await acceptSuggestion(suggestion.id)
    
    // Dismiss all other suggestions for the same target table
    await dismissSuggestionsByTargetTable(props.dataTableId, suggestion.targetTableId)
    
    // Mark suggestion complete and remove all suggestions for this target table from the dialog
    relationSuggestionsDialogRef.value?.markSuggestionComplete(suggestion.id, suggestion.targetTableId)
    
    // Reload suggestion status and check if we need to update table status
    await updateSuggestionStatusAfterChange()
    
    ElMessage.success('Relation created from suggestion')
  } catch (error) {
    console.error('Error creating relation from suggestion:', error)
    ElMessage.error('Failed to create relation')
    // Reset the loading state on error
    relationSuggestionsDialogRef.value?.resetSuggestionLoading(suggestion.id)
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

// Provide suggestion info for column headers
// Note: We expose the ref directly so headers can establish reactive dependency
provide('columnSuggestions', {
  suggestionsByField, // Expose the ref for reactivity
  openSuggestionPopover: (fieldName: string, fieldId: string, target: HTMLElement) => {
    columnSuggestionPopoverRef.value?.open(fieldId, fieldName, props.dataTableId, target)
  }
})

// Handlers for column suggestion popover
async function handleColumnSuggestionAccepted(data: { suggestion: any; displayFieldNames: string[] }) {
  const { suggestion, displayFieldNames } = data
  
  try {
    // Get the source field by ID from database
    const sourceFieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE id = $1`,
      [suggestion.sourceFieldId]
    )
    
    if (sourceFieldData.length === 0) {
      ElMessage.error('Source field not found')
      columnSuggestionPopoverRef.value?.resetLoading(suggestion.id)
      return
    }
    
    const sourceField = sourceFieldData[0]

    // Create the relation using the suggestion with multiple display fields
    await tableView.createRelationFromColumn(
      sourceField.fieldName,
      suggestion.targetTableId,
      suggestion.targetFieldId,
      displayFieldNames,
      `${sourceField.fieldNameAlias} → ${suggestion.targetTableName}`
    )
    
    // Mark suggestion as accepted
    await acceptSuggestion(suggestion.id)
    
    // Dismiss all other suggestions for the same target table
    await dismissSuggestionsByTargetTable(props.dataTableId, suggestion.targetTableId)
    
    // Mark complete in popover
    columnSuggestionPopoverRef.value?.markComplete(suggestion.id)
    
    // Reload suggestion status
    await updateSuggestionStatusAfterChange()
    
    ElMessage.success('Relation created from suggestion')
  } catch (error) {
    console.error('Error creating relation from column suggestion:', error)
    ElMessage.error('Failed to create relation')
    columnSuggestionPopoverRef.value?.resetLoading(suggestion.id)
  }
}

async function handleColumnSuggestionDismissed(suggestionId: string) {
  try {
    await dismissSuggestion(suggestionId)
    await updateSuggestionStatusAfterChange()
  } catch (error) {
    console.error('Error dismissing suggestion:', error)
  }
}

onMounted(async () => {
  await loadTableData()
})

function handleSaveView() {
  tableView.saveViewFilterSortGroup()
}

function handleImport() {
  importToTableDialogRef.value?.open({
    physicalTableName: tableView.physicalTableName,
    fields: tableView.fields,
    query,
    tableDisplayName: props.menuItem?.label || 'Table',
    tableIdValue: props.dataTableId
  })
}

async function handleImportComplete(result: any) {
  // Refresh table data after import
  if (result.inserted > 0 || result.updated > 0) {
    await tableView.refresh()
  }
}

/**
 * Handle expand click to open record detail view
 */
function handleExpandClick(params: { row: any; rowIndex: number }) {
  const { row } = params
  if (row?.id && props.dataTableId) {
    navigateToRecord(props.dataTableId, row.id)
  }
}

// Drag-and-drop file import handlers
function isValidExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
  const validExtensions = ['xlsx', 'xls', 'csv']
  const extension = file.name.split('.').pop()?.toLowerCase()
  return validTypes.includes(file.type) || validExtensions.includes(extension || '')
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  
  // Check if files are being dragged
  if (e.dataTransfer?.types.includes('Files')) {
    isDraggingFile.value = true
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  // Needed to allow drop
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  dragCounter--
  
  // Only hide overlay when all drag events have left
  if (dragCounter === 0) {
    isDraggingFile.value = false
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDraggingFile.value = false
  dragCounter = 0
  
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  
  const file = files[0]
  
  if (!isValidExcelFile(file)) {
    ElMessage.warning('Please drop an Excel (.xlsx, .xls) or CSV file')
    return
  }
  
  // Open import dialog with the dropped file
  importToTableDialogRef.value?.openWithFile(file, {
    physicalTableName: tableView.physicalTableName,
    fields: tableView.fields,
    query,
    tableDisplayName: props.menuItem?.label || 'Table',
    tableIdValue: props.dataTableId
  })
}

watch(
  () => props.dataTableId,
  async () => {
    await loadTableData()
  }
)
</script>

<template>
  <div 
    class="table-detail-view"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Drop overlay for file import -->
    <Transition name="fade">
      <div v-if="isDraggingFile" class="drop-overlay">
        <div class="drop-content">
          <Icon name="lucide:file-spreadsheet" class="drop-icon" />
          <div class="drop-text">Drop Excel file to import</div>
          <div class="drop-hint">Supports .xlsx, .xls, .csv</div>
        </div>
      </div>
    </Transition>

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
            <!-- Ready: Show badge with count -->
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
            
            <!-- Pending: Queued for analysis -->
            <el-tag v-else-if="suggestionStatus === 'pending'" type="info" size="large">
              <Icon name="lucide:clock" class="badge-icon" />
              Queued for analysis...
            </el-tag>
            
            <!-- Processing: Currently analyzing -->
            <el-tag v-else-if="suggestionStatus === 'processing'" type="info" size="large">
              <Icon name="lucide:loader-2" class="badge-icon spinning" />
              Analyzing relations...
            </el-tag>
            
            <!-- Error: Analysis failed -->
            <el-tag v-else-if="suggestionStatus === 'error'" type="danger" size="large">
              <Icon name="lucide:alert-circle" class="badge-icon" />
              Error analyzing relations
            </el-tag>
          </Teleport>
        </div>
        
        <!-- Use wrapper component that sets up MdTable providers -->
        <MdTable 
          v-if="tableReady" 
          :editable="true" 
          @saveView="handleSaveView" 
          @import="handleImport"
          @expand-click="handleExpandClick"
        />
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

    <!-- Column Suggestion Popover (for individual column badges) -->
    <WorkspacesColumnSuggestionPopover
      ref="columnSuggestionPopoverRef"
      @accepted="handleColumnSuggestionAccepted"
      @dismissed="handleColumnSuggestionDismissed"
    />

    <!-- Import To Table Dialog -->
    <WorkspacesDialogsImportToTableDialog
      ref="importToTableDialogRef"
      @complete="handleImportComplete"
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
  position: relative; // Needed for drop overlay positioning
}

.table-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
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

// Drop overlay for file import
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px dashed var(--el-color-primary);
  border-radius: var(--app-border-radius);
  pointer-events: none;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-xl);
  background: var(--el-bg-color);
  border-radius: var(--app-border-radius);
  box-shadow: var(--el-box-shadow-light);
}

.drop-icon {
  font-size: 64px;
  color: var(--el-color-primary);
}

.drop-text {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.drop-hint {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
}

// Fade transition for drop overlay
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
