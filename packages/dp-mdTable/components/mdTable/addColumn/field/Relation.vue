<template>
  <div class="relation-config">
    <el-form-item label="Target Table" prop="relationTableId">
      <el-select
        v-model="formData.relationTableId"
        placeholder="Select target table"
        style="width: 100%"
        @change="handleTableChange"
      >
        <el-option
          v-for="table in availableTables"
          :key="table.id"
          :label="table.name"
          :value="table.id"
        />
      </el-select>
    </el-form-item>

    <!-- Existing relation warning -->
    <div v-if="existingRelation && !isEditingExisting" class="existing-relation-notice">
      <Icon name="lucide:info" size="16" />
      <span>A relation to this table already exists: <strong>{{ existingRelation.fieldNameAlias }}</strong>. Adding display fields will update the existing relation.</span>
    </div>

    <el-form-item label="Display Fields" prop="displayFields">
      <div class="display-fields-container">
        <!-- Draggable list of selected fields -->
        <div v-if="selectedDisplayFields.length > 0" class="selected-fields-list">
          <draggable
            v-model="selectedDisplayFields"
            item-key="id"
            handle=".drag-handle"
            ghost-class="ghost"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div class="field-item">
                <div class="drag-handle">
                  <Icon name="lucide:grip-vertical" size="14" />
                </div>
                <div class="field-info">
                  <span class="field-label">{{ element.fieldNameAlias }}</span>
                </div>
                <el-button
                  type="danger"
                  text
                  size="small"
                  class="remove-btn"
                  @click="removeDisplayField(element)"
                >
                  <Icon name="lucide:x" size="14" />
                </el-button>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <span>No display fields selected</span>
        </div>

        <!-- Add field dropdown -->
        <div class="add-field-section">
          <el-select
            v-model="fieldToAdd"
            placeholder="Add a display field..."
            style="width: 100%"
            :disabled="!formData.relationTableId || availableFieldsToAdd.length === 0"
            @change="handleAddField"
          >
            <el-option
              v-for="field in availableFieldsToAdd"
              :key="field.fieldName"
              :label="field.fieldNameAlias"
              :value="field.fieldName"
            >
              <div class="field-option">
                <span>{{ field.fieldNameAlias }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>
    </el-form-item>

    <!-- Info section -->
    <!-- <div v-if="formData.relationTableId && selectedDisplayFields.length > 0" class="relation-info">
      <div class="info-header">
        <Icon name="lucide:info" size="14" />
        <span>Relation Info</span>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="label">Target Table:</span>
          <span class="value">{{ getTableName(formData.relationTableId) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Display Fields:</span>
          <span class="value">{{ selectedDisplayFields.length }} selected</span>
        </div>
        <div class="info-item">
          <span class="label">Type:</span>
          <span class="value">One-to-Many (Array)</span>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, inject } from 'vue'
import draggable from 'vuedraggable'
import { ColumnContextKey } from '../../../../types/column-context'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../../demo/workspaces/utils/db/schema/newTableSchema'

const props = defineProps<{
  formData: any
}>()

// Inject column context from parent
const columnContext = inject(ColumnContextKey)

const availableTables = ref<CaseTableRecord[]>([])
const targetFields = ref<CaseFieldRecord[]>([])
const selectedDisplayFields = ref<CaseFieldRecord[]>([])
const fieldToAdd = ref<string>('')
const existingRelation = ref<CaseFieldRecord | null>(null)
const isEditingExisting = ref(false)

// Compute available fields (not yet selected)
const availableFieldsToAdd = computed(() => {
  const selectedIds = new Set(selectedDisplayFields.value.map(f => f.id))
  return targetFields.value.filter(f => !selectedIds.has(f.id))
})

// Initialize form data with defaults
const initializeFormData = () => {
  if (!props.formData.relationTableId) {
    props.formData.relationTableId = ''
  }
  // Initialize displayFieldNames as array if not present
  if (!props.formData.displayFieldNames) {
    props.formData.displayFieldNames = []
  }
  // Migrate from old single displayField to displayFieldNames array
  if (props.formData.displayField && !props.formData.displayFieldNames?.length) {
    // Will be handled after loading target fields
  }
}

// Sync selectedDisplayFields to formData.displayFieldNames
function syncToFormData() {
  props.formData.displayFieldNames = selectedDisplayFields.value.map(f => f.fieldName)
  // Also set displayField to first field for backwards compatibility
  props.formData.displayField = selectedDisplayFields.value[0]?.fieldName || ''
}

// Handle adding a field
function handleAddField(fieldName: string) {
  if (!fieldName) return
  
  const field = targetFields.value.find(f => f.fieldName === fieldName)
  if (field && !selectedDisplayFields.value.find(f => f.fieldName === fieldName)) {
    selectedDisplayFields.value.push(field)
    syncToFormData()
  }
  
  // Reset the select
  fieldToAdd.value = ''
}

// Handle removing a field
function removeDisplayField(field: CaseFieldRecord) {
  selectedDisplayFields.value = selectedDisplayFields.value.filter(f => f.fieldName !== field.fieldName)
  syncToFormData()
}

// Handle drag end
function handleDragEnd() {
  syncToFormData()
}

// Load available tables using context
async function loadAvailableTables() {
  try {
    if (!columnContext?.getAvailableTablesForRelation) {
      console.error('getAvailableTablesForRelation not available in context')
      return
    }
    
    const tables = await columnContext.getAvailableTablesForRelation(false)
    availableTables.value = tables
  } catch (error) {
    console.error('Error loading tables:', error)
  }
}

// Handle table selection change
async function handleTableChange() {
  // Clear selected fields when table changes
  selectedDisplayFields.value = []
  targetFields.value = []
  existingRelation.value = null
  syncToFormData()
  
  if (!props.formData.relationTableId) return
  
  try {
    if (!columnContext?.getFieldsForTable) {
      console.error('getFieldsForTable not available in context')
      return
    }
    
    const fields = await columnContext.getFieldsForTable(props.formData.relationTableId)
    targetFields.value = fields
    
    // Check if a relation to this table already exists (only for new columns)
    if (!isEditingExisting.value && columnContext?.getExistingRelationToTable) {
      existingRelation.value = await columnContext.getExistingRelationToTable(props.formData.relationTableId)
      
      if (existingRelation.value) {
        // Pre-populate with existing display fields
        const existingFieldNames = existingRelation.value.displayFieldNames || []
        const fieldMap = new Map(fields.map(f => [f.fieldName, f]))
        selectedDisplayFields.value = existingFieldNames
          .map((name: string) => fieldMap.get(name))
          .filter(Boolean) as CaseFieldRecord[]
        syncToFormData()
        return // Don't auto-select, use existing fields
      }
    }
    
    // Auto-select first text field as display field if no fields selected
    if (selectedDisplayFields.value.length === 0) {
      const firstTextField = fields.find(f => 
        f.displayStructure?.type === 1 || // Text
        f.displayStructure?.type === 2    // MultiText
      )
      if (firstTextField) {
        selectedDisplayFields.value = [firstTextField]
        syncToFormData()
      }
    }
  } catch (error) {
    console.error('Error loading fields:', error)
  }
}

// Get table name by ID
function getTableName(tableId: string): string {
  const table = availableTables.value.find(t => t.id === tableId)
  return table?.name || 'Unknown'
}

// Load fields and restore selection from displayFieldNames
async function loadFieldsAndRestoreSelection() {
  if (!props.formData.relationTableId) return
  
  try {
    if (!columnContext?.getFieldsForTable) {
      console.error('getFieldsForTable not available in context')
      return
    }
    
    const fields = await columnContext.getFieldsForTable(props.formData.relationTableId)
    targetFields.value = fields
    
    // Restore selection from displayFieldNames
    if (props.formData.displayFieldNames?.length) {
      const fieldMap = new Map(fields.map(f => [f.fieldName, f]))
      selectedDisplayFields.value = props.formData.displayFieldNames
        .map((fieldName: string) => fieldMap.get(fieldName))
        .filter(Boolean) as CaseFieldRecord[]
    } 
    // Migrate from old single displayField format
    else if (props.formData.displayField) {
      const field = fields.find(f => f.fieldName === props.formData.displayField)
      if (field) {
        selectedDisplayFields.value = [field]
        syncToFormData()
      }
    }
    // Auto-select first text field if nothing selected
    else if (selectedDisplayFields.value.length === 0) {
      const firstTextField = fields.find(f => 
        f.displayStructure?.type === 1 || // Text
        f.displayStructure?.type === 2    // MultiText
      )
      if (firstTextField) {
        selectedDisplayFields.value = [firstTextField]
        syncToFormData()
      }
    }
  } catch (error) {
    console.error('Error loading fields:', error)
  }
}

// Watch for relationTableId changes from parent (edit mode)
watch(
  () => props.formData.relationTableId,
  async (newValue, oldValue) => {
    if (newValue && newValue !== oldValue && targetFields.value.length === 0) {
      await loadFieldsAndRestoreSelection()
    }
  }
)

// Initialize on mount
onMounted(async () => {
  initializeFormData()
  await loadAvailableTables()
  
  // If editing existing relation with a table selected, load target fields
  if (props.formData.relationTableId) {
    // Mark as editing existing if relationTableId is already set
    isEditingExisting.value = true
    await loadFieldsAndRestoreSelection()
  }
})
</script>

<style scoped lang="scss">
.relation-config {
  .existing-relation-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: var(--el-border-radius-base);
    color: var(--el-color-primary);
    font-size: 13px;
    line-height: 1.5;

    strong {
      font-weight: 600;
    }
  }

  .display-fields-container {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
  }

  .selected-fields-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .field-item {
  width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: background-color 0.2s;

    &:hover {
      background: var(--el-fill-color-light);
    }

    &:last-child {
      border-bottom: none;
    }

    .drag-handle {
      cursor: grab;
      color: var(--el-text-color-placeholder);
      display: flex;
      align-items: center;

      &:active {
        cursor: grabbing;
      }
    }

    .field-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .field-label {
        font-size: var(--app-font-size-s);
        color: var(--el-text-color-primary);
        font-weight: 500;
      }

      .field-name {
        font-size: var(--app-font-size-xs);
        color: var(--el-text-color-secondary);
        font-family: monospace;
      }
    }

    .remove-btn {
      opacity: 0.6;
      padding: 4px;

      &:hover {
        opacity: 1;
      }
    }
  }

  .ghost {
    opacity: 0.5;
    background: var(--el-color-primary-light-9);
  }

  .empty-state {
    padding: 20px;
    text-align: center;
    color: var(--el-text-color-placeholder);
    font-size: var(--app-font-size-s);
  }

  .add-field-section {
    padding: 8px;
    background: var(--el-fill-color-lighter);
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .field-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .field-name-hint {
      font-size: var(--app-font-size-xs);
      color: var(--el-text-color-secondary);
      font-family: monospace;
    }
  }

  .relation-info {
    margin-top: var(--app-space-m);
    padding: var(--app-space-m);
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    border: 1px solid var(--el-border-color-lighter);
    
    .info-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-xs);
      margin-bottom: var(--app-space-s);
      font-weight: 600;
      color: var(--el-text-color-primary);
      font-size: var(--app-font-size-s);
    }
    
    .info-content {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-xs);
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--app-font-size-s);
      
      .label {
        color: var(--el-text-color-secondary);
      }
      
      .value {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }
}
</style>
