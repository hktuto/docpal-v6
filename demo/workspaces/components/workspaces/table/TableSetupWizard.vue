<script setup lang="ts">
import { v7 as uuidv7 } from 'uuid'
import type { MenuItem } from '../../../utils/db/schema/workspaces'
import type { DataTableColumnType } from '../../../utils/db/schema/table'
import { ColumnFieldType } from '../../../utils/tableColumnType'
import { ElMessage } from 'element-plus'
const props = defineProps<{
  menuItem: MenuItem
  workspaceId: string
}>()

const emit = defineEmits<{
  (e: 'complete', data: { dataTableId: string }): void
  (e: 'delete'): void
}>()

const { recursiveUpdateItem, menuState, saveMenuToDb } = useSingleWorkspaceContext()
const { generateSlug, getDefaultColumns, createDataTable, importDataRows } = useTableSchema()

// Wizard state
const currentStep = ref(0)
const isLoading = ref(false)

// Step 1: Basic info
const tableInfo = ref({
  name: props.menuItem.label || '',
  description: props.menuItem.description || ''
})

// Step 2: Import data
const importMode = ref<'skip' | 'excel' | 'manual'>('skip')
const importedColumns = ref<Partial<DataTableColumnType>[]>([])
const importedRows = ref<Record<string, any>[]>([])

// Step 3: Review
const isCreating = ref(false)

const steps = [
  { title: 'Basic Info', description: 'Name and description' },
  { title: 'Import Data', description: 'Optional: Import from Excel' },
  { title: 'Review', description: 'Confirm and create' }
]

// Computed
const canProceedStep1 = computed(() => {
  return tableInfo.value.name.trim().length > 0
})

const canProceedStep2 = computed(() => {
  return importMode.value === 'skip' || 
    (importMode.value === 'excel' && importedColumns.value.length > 0)
})

const finalColumns = computed(() => {
  if (importMode.value === 'skip') {
    return getDefaultColumns(props.workspaceId, '')
  }
  return importedColumns.value
})

// Handlers
function handleNext() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function handleBack() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function handleImport(data: { columns: Partial<DataTableColumnType>[]; rows: Record<string, any>[] }) {
  importedColumns.value = data.columns
  importedRows.value = data.rows
  importMode.value = 'excel'
}

function handleCancelImport() {
  importMode.value = 'skip'
  importedColumns.value = []
  importedRows.value = []
}

function handleSkipImport() {
  importMode.value = 'skip'
  importedColumns.value = []
  importedRows.value = []
  handleNext()
}

async function handleDelete() {
  emit('delete')
}

async function handleCreate() {
  if (isCreating.value) return
  isCreating.value = true
  
  try {
    const dataTableId = uuidv7()
    const slug = generateSlug(tableInfo.value.name)
    
    // Create the data table with columns
    const result = await createDataTable(
      {
        id: dataTableId,
        name: tableInfo.value.name,
        slug,
        workspaceId: props.workspaceId,
        description: tableInfo.value.description
      },
      importMode.value === 'excel' ? importedColumns.value : [],
      undefined // createdBy - could be passed from user context
    )
    
    // Import data rows if any
    if (importMode.value === 'excel' && importedRows.value.length > 0) {
      await importDataRows(
        result.dataTable.tableName,
        result.columns,
        importedRows.value,
        undefined // createdBy
      )
    }
    
    // Update the menu item with the new table ID
    recursiveUpdateItem(menuState.value.items, props.menuItem.id, {
      itemId: dataTableId,
      label: tableInfo.value.name,
      description: tableInfo.value.description,
      slug
    })
    
    await saveMenuToDb()
    
    emit('complete', { dataTableId })
  } catch (error) {
    console.error('Error creating table:', error)
    ElMessage.error('Failed to create table. Please try again.')
  } finally {
    isCreating.value = false
  }
}

function getColumnTypeLabel(type: ColumnFieldType): string {
  const typeLabels: Record<number, string> = {
    [ColumnFieldType.Text]: 'Text',
    [ColumnFieldType.MultiText]: 'Multi-line Text',
    [ColumnFieldType.Number]: 'Number',
    [ColumnFieldType.SingleSelect]: 'Single Select',
    [ColumnFieldType.MultiSelect]: 'Multi Select',
    [ColumnFieldType.DateTime]: 'Date & Time',
    [ColumnFieldType.Document]: 'Document',
    [ColumnFieldType.URL]: 'URL',
    [ColumnFieldType.Email]: 'Email',
    [ColumnFieldType.Phone]: 'Phone',
    [ColumnFieldType.Checkbox]: 'Checkbox',
    [ColumnFieldType.Rating]: 'Rating',
    [ColumnFieldType.Member]: 'Member',
    [ColumnFieldType.Relation]: 'Relation',
    [ColumnFieldType.Formula]: 'Formula',
    [ColumnFieldType.Currency]: 'Currency',
    [ColumnFieldType.Percent]: 'Percent',
    [ColumnFieldType.CreatedTime]: 'Created Time',
    [ColumnFieldType.LastModifiedTime]: 'Last Modified Time',
    [ColumnFieldType.CreatedBy]: 'Created By',
    [ColumnFieldType.LastModifiedBy]: 'Last Modified By'
  }
  return typeLabels[type] || 'Unknown'
}

function isSystemColumn(type: ColumnFieldType): boolean {
  return [
    ColumnFieldType.CreatedTime,
    ColumnFieldType.LastModifiedTime,
    ColumnFieldType.CreatedBy,
    ColumnFieldType.LastModifiedBy
  ].includes(type)
}

// Watch for name changes to update menu item
watch(() => tableInfo.value.name, (newName) => {
  // Could auto-save here if needed
})
</script>

<template>
  <div class="table-setup-wizard">
    <!-- Stepper Header -->
    <div class="wizard-header">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
        />
      </el-steps>
    </div>

    <!-- Step Content -->
    <div class="wizard-content">
      <!-- Step 1: Basic Info -->
      <div v-show="currentStep === 0" class="step-content step-basic-info">
        <div class="step-header">
          <h3>Set up your table</h3>
          <p>Give your table a name and optional description</p>
        </div>

        <el-form label-position="top" class="basic-info-form">
          <el-form-item label="Table Name" required>
            <el-input
              v-model="tableInfo.name"
              placeholder="e.g., Projects, Customers, Tasks"
              maxlength="100"
              show-word-limit
              size="large"
              autofocus
            />
          </el-form-item>

          <el-form-item label="Description">
            <el-input
              v-model="tableInfo.description"
              type="textarea"
              :rows="3"
              placeholder="Optional: Describe what this table is for"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div class="delete-section">
          <el-button type="danger" text @click="handleDelete">
            <Icon name="material-symbols:delete-outline" />
            Delete this table
          </el-button>
        </div>
      </div>

      <!-- Step 2: Import Data -->
      <div v-show="currentStep === 1" class="step-content step-import">
        <div class="step-header">
          <h3>Import data (Optional)</h3>
          <p>Import existing data from an Excel file, or skip to create an empty table</p>
        </div>

        <div v-if="importMode === 'skip'" class="import-options">
          <div class="import-option" @click="importMode = 'excel'">
            <div class="option-icon">
              <Icon name="material-symbols:table-chart-outline" />
            </div>
            <div class="option-content">
              <h4>Import from Excel</h4>
              <p>Upload an Excel or CSV file to import columns and data</p>
            </div>
            <Icon name="material-symbols:chevron-right" class="option-arrow" />
          </div>

          <div class="skip-option">
            <el-button type="primary" size="large" @click="handleSkipImport">
              Skip & Create Empty Table
            </el-button>
            <p class="skip-hint">You can add columns manually later</p>
          </div>
        </div>

        <div v-else-if="importMode === 'excel'" class="import-excel-container">
          <WorkspacesTableImportFromExcel
            :workspace-id="workspaceId"
            @import="handleImport"
            @cancel="handleCancelImport"
          />
          
          <div v-if="importedColumns.length > 0" class="import-success">
            <el-alert
              type="success"
              :closable="false"
              show-icon
            >
              <template #title>
                <span>{{ importedColumns.length }} columns and {{ importedRows.length }} rows ready to import</span>
              </template>
            </el-alert>
          </div>
        </div>
      </div>

      <!-- Step 3: Review -->
      <div v-show="currentStep === 2" class="step-content step-review">
        <div class="step-header">
          <h3>Review & Create</h3>
          <p>Review your table configuration before creating</p>
        </div>

        <div class="review-sections">
          <!-- Table Info -->
          <div class="review-section">
            <h4>
              <Icon name="material-symbols:info-outline" />
              Table Information
            </h4>
            <div class="review-grid">
              <div class="review-item">
                <label>Name</label>
                <span>{{ tableInfo.name }}</span>
              </div>
              <div class="review-item" v-if="tableInfo.description">
                <label>Description</label>
                <span>{{ tableInfo.description }}</span>
              </div>
            </div>
          </div>

          <!-- Columns -->
          <div class="review-section">
            <h4>
              <Icon name="material-symbols:view-column-outline" />
              Columns
            </h4>
            
            <div v-if="importMode === 'excel' && importedColumns.length > 0" class="columns-list">
              <div class="column-group">
                <h5>Imported Columns ({{ importedColumns.length }})</h5>
                <div class="column-tags">
                  <el-tag
                    v-for="col in importedColumns"
                    :key="col.id"
                    class="column-tag"
                  >
                    {{ col.title }}
                    <span class="column-type">{{ getColumnTypeLabel(col.type as ColumnFieldType) }}</span>
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="column-group">
              <h5>System Columns (auto-generated)</h5>
              <div class="column-tags system-tags">
                <el-tag type="info" class="column-tag">
                  Created At
                  <span class="column-type">Timestamp</span>
                </el-tag>
                <el-tag type="info" class="column-tag">
                  Created By
                  <span class="column-type">User</span>
                </el-tag>
                <el-tag type="info" class="column-tag">
                  Updated At
                  <span class="column-type">Timestamp</span>
                </el-tag>
                <el-tag type="info" class="column-tag">
                  Updated By
                  <span class="column-type">User</span>
                </el-tag>
              </div>
            </div>
          </div>

          <!-- Data Import -->
          <div v-if="importMode === 'excel' && importedRows.length > 0" class="review-section">
            <h4>
              <Icon name="material-symbols:database-outline" />
              Data Import
            </h4>
            <div class="review-grid">
              <div class="review-item">
                <label>Rows to Import</label>
                <span>{{ importedRows.length }} rows</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Wizard Footer -->
    <div class="wizard-footer">
      <div class="footer-left">
        <el-button
          v-if="currentStep > 0"
          @click="handleBack"
          :disabled="isCreating"
        >
          <Icon name="material-symbols:arrow-back" />
          Back
        </el-button>
      </div>
      
      <div class="footer-right">
        <template v-if="currentStep === 0">
          <el-button
            type="primary"
            @click="handleNext"
            :disabled="!canProceedStep1"
          >
            Next
            <Icon name="material-symbols:arrow-forward" />
          </el-button>
        </template>

        <template v-else-if="currentStep === 1">
          <el-button
            v-if="importMode === 'excel' && importedColumns.length > 0"
            type="primary"
            @click="handleNext"
          >
            Next
            <Icon name="material-symbols:arrow-forward" />
          </el-button>
        </template>

        <template v-else-if="currentStep === 2">
          <el-button
            type="primary"
            size="large"
            @click="handleCreate"
            :loading="isCreating"
          >
            <Icon v-if="!isCreating" name="material-symbols:check" />
            {{ isCreating ? 'Creating...' : 'Create Table' }}
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-setup-wizard {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: var(--app-max-width);
  margin: 0 auto;
  width: 100%;
  padding: var(--app-space-m);
}

.wizard-header {
  margin-bottom: 32px;
  
  :deep(.el-steps) {
    .el-step__title {
      font-size: 14px;
      font-weight: 500;
    }
    
    .el-step__description {
      font-size: 12px;
    }
  }
}

.wizard-content {
  flex:  0 0 auto;
  overflow-y: auto;
  padding-bottom: var(--app-space-m);
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  margin-bottom: 24px;
  
  h3 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

// Step 1: Basic Info
.step-basic-info {
  .basic-info-form {
    // max-width: 500px;
    
    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }
  
  .delete-section {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    
    .el-button {
      color: var(--el-color-danger);
      
      &:hover {
        background: var(--el-color-danger-light-9);
      }
    }
  }
}

// Step 2: Import
.step-import {
  .import-options {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .import-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      
      .option-arrow {
        transform: translateX(4px);
      }
    }
    
    .option-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary-light-8);
      border-radius: 10px;
      font-size: 24px;
      color: var(--el-color-primary);
    }
    
    .option-content {
      flex: 1;
      
      h4 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .option-arrow {
      font-size: 20px;
      color: var(--el-text-color-secondary);
      transition: transform 0.2s;
    }
  }
  
  .skip-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
    
    .skip-hint {
      margin: 0;
      font-size: 13px;
      color: var(--el-text-color-placeholder);
    }
  }
  
  .import-excel-container {
    .import-success {
      margin-top: 16px;
    }
  }
}

// Step 3: Review
.step-review {
  .review-sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .review-section {
    padding: 20px;
    background: var(--el-fill-color-light);
    border-radius: 12px;
    
    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      
      .iconify {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }
    
    .review-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .review-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      label {
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      span {
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }
  }
  
  .columns-list {
    margin-bottom: 16px;
  }
  
  .column-group {
    h5 {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }
    
    & + .column-group {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed var(--el-border-color);
    }
  }
  
  .column-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    &.system-tags {
      .column-tag {
        background: var(--el-fill-color);
      }
    }
  }
  
  .column-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 13px;
    
    .column-type {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      padding-left: 6px;
      border-left: 1px solid var(--el-border-color);
    }
  }
}

.wizard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  
  .footer-left,
  .footer-right {
    display: flex;
    gap: 12px;
  }
}
</style>
