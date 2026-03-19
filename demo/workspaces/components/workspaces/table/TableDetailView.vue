<script setup lang="ts">
import { ElMessage } from 'element-plus'

const props = defineProps<{
  dataTableId: string
}>()

const { query } = usePglite()
const isLoading = ref(false)

const tableView = useTableView()
const suggestionState = useTableDetailSuggestionState(props.dataTableId, tableView)

// Dialog / UI refs（组件只持有 ref，不持有业务状态）
const createRelationDialogRef = ref()
const relationSuggestionsDialogRef = ref()
const importToTableDialogRef = ref()
const addRowDialogRef = ref()
const columnSuggestionPopoverRef = ref()
const auditLogVisible = ref(false)

const fileDrop = useFileDropImport({
  onDrop(file: File) {
    importToTableDialogRef.value?.openWithFile(file, {
      physicalTableName: tableView.physicalTableName,
      fields: tableView.fields,
      query,
      tableIdValue: props.dataTableId
    })
  }
})
// 解构出 ref，模板里才能自动解包得到 boolean（否则 fileDrop.isDraggingFile 是 Ref 对象，typeof 为 'object'）
const isDraggingFile = fileDrop.isDraggingFile

// —— 仅做绑定与派发：关联建议 ——
provide('handleCreateRelation', handleCreateRelation)
provide('columnSuggestions', {
  suggestionsByField: suggestionState.suggestionsByField,
  openSuggestionPopover(fieldName: string, fieldId: string, target: HTMLElement) {
    columnSuggestionPopoverRef.value?.open(fieldId, fieldName, props.dataTableId, target)
  }
})

function openSuggestionsDialog(e: Event) {
  e.preventDefault()
  relationSuggestionsDialogRef.value?.open(props.dataTableId, e.target)
}

function handleCreateRelation(column: any) {
  suggestionState.setPendingRelationColumn(column)
  createRelationDialogRef.value?.open(column, tableView.tableId.value, tableView.physicalTableName.value)
}

async function handleRelationCreated(data: {
  targetTableId: string
  targetFieldId: string
  displayFieldNames: string[]
  relationColumnName: string
}) {
  const result = await suggestionState.relationCreated(data)
  if (result.success) {
    relationSuggestionsDialogRef.value?.removeSuggestionsForTargetTable(result.targetTableId)
  }
}

async function handleSuggestionAccepted(data: { suggestion: any; displayFieldNames: string[] }) {
  const result = await suggestionState.acceptSuggestionAndCreateRelation(data)
  if (result.success) {
    relationSuggestionsDialogRef.value?.markSuggestionComplete(result.suggestion.id, result.suggestion.targetTableId)
  } else if (result.resetLoadingId) {
    relationSuggestionsDialogRef.value?.resetSuggestionLoading(result.resetLoadingId)
  }
}

async function handleSuggestionDismissed() {
  await suggestionState.onSuggestionDismissed()
}

async function handleAllSuggestionsDismissed() {
  await suggestionState.onAllSuggestionsDismissed()
}

async function handleColumnSuggestionAccepted(data: { suggestion: any; displayFieldNames: string[] }) {
  const result = await suggestionState.acceptSuggestionAndCreateRelation(data)
  if (result.success) {
    columnSuggestionPopoverRef.value?.markComplete(data.suggestion.id)
  } else if (result.resetLoadingId) {
    columnSuggestionPopoverRef.value?.resetLoading(result.resetLoadingId)
  }
}

async function handleColumnSuggestionDismissed(suggestionId: string) {
  try {
    await suggestionState.dismissColumnSuggestion(suggestionId)
  } catch (error) {
    console.error('Error dismissing suggestion:', error)
  }
}

// —— 仅做绑定与派发：表格 / 导入 / 审计 / 加行 ——


function handleImport() {
  importToTableDialogRef.value?.open({
    physicalTableName: tableView.physicalTableName,
    fields: tableView.fields,
    query,
    tableIdValue: props.dataTableId
  })
}

async function handleImportComplete(result: any) {
  if (result.inserted > 0 || result.updated > 0) {
    await tableView.refresh()
  }
}

async function handleAuditRollback() {
  await tableView.refresh()
}

function handleExpandClick(params: { row: any; rowIndex: number }) {
  const { row } = params
  console.log('handleExpandClick', row)
}

function handleAddRow() {
  addRowDialogRef.value?.open()
}

async function handleAddRowSubmit(data: Record<string, any>) {
  try {
    await tableView.addRow(data)
    ElMessage.success('Row added successfully')
  } catch (error) {
    console.error('Error adding row:', error)
    ElMessage.error('Failed to add row')
  }
}

onMounted(() => {
  if (props.dataTableId) {
    suggestionState.loadSuggestionStatus()
  }
})
</script>

<template>
  <div
    class="table-detail-view"
    @dragenter="fileDrop.handleDragEnter"
    @dragover="fileDrop.handleDragOver"
    @dragleave="fileDrop.handleDragLeave"
    @drop="fileDrop.handleDrop"
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
        <div v-if="suggestionState?.suggestionStatus !== 'none'" class="suggestion-badge-container">
          <Teleport to="#database-table-header-right">
            <!-- Ready: Show badge with count -->
            <el-badge
              v-if="suggestionState?.suggestionStatus === 'ready' && suggestionState.suggestionCount > 0"
              :value="suggestionState.suggestionCount"
              class="suggestion-badge"
            >
              <el-button type="primary" size="small" @click="openSuggestionsDialog">
                <Icon name="lucide:lightbulb" class="badge-icon" />
                View Relation Suggestions
              </el-button>
            </el-badge>

            <!-- Pending: Queued for analysis -->
            <el-tag v-else-if="suggestionState?.suggestionStatus === 'pending'" type="info" size="large">
              <Icon name="lucide:clock" class="badge-icon" />
              Queued for analysis...
            </el-tag>

            <!-- Processing: Currently analyzing -->
            <el-tag v-else-if="suggestionState?.suggestionStatus === 'processing'" type="info" size="large">
              <Icon name="lucide:loader-2" class="badge-icon spinning" />
              Analyzing relations...
            </el-tag>

            <!-- Error: Analysis failed -->
            <el-tag v-else-if="suggestionState?.suggestionStatus === 'error'" type="danger" size="large">
              <Icon name="lucide:alert-circle" class="badge-icon" />
              Error analyzing relations
            </el-tag>
          </Teleport>
        </div>

        <!-- Audit Log Button -->
        <Teleport to="#database-table-header-right">
          <el-tooltip content="View Audit History" placement="bottom">
            <el-button size="small" @click="auditLogVisible = true">
              <Icon name="lucide:history" size="16" />
            </el-button>
          </el-tooltip>
        </Teleport>
        
        <!-- Use wrapper component that sets up MdTable providers -->
        <MdTable v-if="props.dataTableId"
          :editable="true"
          :table-id="props.dataTableId"
          @import="handleImport"
          @expand-click="handleExpandClick"
          @add-row="handleAddRow"
        />
      </div>
    </div>

    <!-- Create Relation Dialog -->
    <!-- <WorkspacesDialogsCreateRelationDialog ref="createRelationDialogRef" @created="handleRelationCreated" /> -->

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
    <WorkspacesDialogsImportToTableDialog ref="importToTableDialogRef" @complete="handleImportComplete" />

    <!-- Add Row Dialog -->
    <!-- <WorkspacesTableAddRowDialog
      v-if="tableView.tableId.value && tableView.physicalTableName.value"
      ref="addRowDialogRef"
      :table-id="tableView.tableId.value"
      :physical-table-name="tableView.physicalTableName.value"
      @submit="handleAddRowSubmit"
    /> -->

    <!-- Audit Log Sidebar -->
    <WorkspacesTableAuditLogSidebar
      v-if="tableView.physicalTableName.value && tableView.tableId.value"
      v-model:visible="auditLogVisible"
      :table-name="tableView.physicalTableName.value"
      :case-table-id="tableView.tableId.value"
      :entity-id="tableView.reference_entity_id.value"
      @rollback="handleAuditRollback"
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
