<template>
  <el-dialog
    v-model="visible"
    title="Create Relation"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="create-relation-dialog">
      <div class="description">
        Create a relation column by matching values from "{{ sourceColumn?.title }}" with another table's field.
      </div>

      <!-- Suggestions Section -->
      <div v-if="suggestions.length > 0" class="suggestions-section">
        <div class="suggestions-header">
          <Icon name="lucide:lightbulb" class="suggestion-icon" />
          <span class="suggestions-title">Suggested Relations</span>
        </div>
        <div class="suggestions-list">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
          >
            <div class="suggestion-content">
              <div class="suggestion-label">
                {{ suggestion.targetTableName }}.{{ suggestion.targetFieldName }}
              </div>
              <el-tag size="small" type="info">
                {{ suggestion.matchCount }}/{{ suggestion.totalCount }} matched
              </el-tag>
            </div>
            <div class="suggestion-actions">
              <el-button
                type="primary"
                size="small"
                link
                @click="applySuggestion(suggestion)"
              >
                Use This
              </el-button>
              <el-button
                size="small"
                link
                @click="dismissSuggestionItem(suggestion.id)"
              >
                Dismiss
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="Target Table" prop="targetTableId">
          <el-select
            v-model="formData.targetTableId"
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

        <el-form-item label="Match Column" prop="targetFieldId">
          <el-select
            v-model="formData.targetFieldId"
            placeholder="Select Column to match against"
            style="width: 100%"
            :disabled="!formData.targetTableId"
          >
            <el-option
              v-for="field in targetFields"
              :key="field.id"
              :label="field.fieldNameAlias"
              :value="field.id"
            >
              <div class="field-option">
                <span>{{ field.fieldNameAlias }}</span>
                <span class="field-name">{{ field.fieldName }}</span>
              </div>
            </el-option>
          </el-select>
          <div class="field-hint">
            Match "{{ sourceColumn?.title }}" values with this field in the target table
          </div>
        </el-form-item>

        <el-form-item label="Display Columns" prop="displayFieldNames">
          <el-select
            v-model="formData.displayFieldNames"
            placeholder="Select columns to display"
            style="width: 100%"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :disabled="!formData.targetTableId"
          >
            <el-option
              v-for="field in targetFields"
              :key="field.fieldName"
              :label="field.fieldNameAlias"
              :value="field.fieldName"
            >
              <div class="field-option">
                <span>{{ field.fieldNameAlias }}</span>
                <span class="field-name">{{ field.fieldName }}</span>
              </div>
            </el-option>
          </el-select>
          <div class="field-hint">
            These fields from the target table will be shown in the relation column
          </div>
        </el-form-item>

        <el-form-item label="New Relation Column Name" prop="relationColumnName">
          <el-input
            v-model="formData.relationColumnName"
            placeholder="Enter name for the new relation column"
          />
        </el-form-item>

        <div v-if="matchPreview" class="match-preview">
          <div class="preview-header">
            <Icon name="lucide:info" />
            <span>Preview</span>
          </div>
          <div class="preview-content">
            <div class="preview-stat">
              <span class="label">Match Rate:</span>
              <span class="value">{{ matchPreview.matchPercentage }}%</span>
            </div>
            <div class="preview-stat">
              <span class="label">Matched Rows:</span>
              <span class="value">{{ matchPreview.matchedCount }} / {{ matchPreview.totalCount }}</span>
            </div>
            <div v-if="matchPreview.samples.length > 0" class="preview-samples">
              <div class="samples-title">Sample Matches:</div>
              <div v-for="(sample, idx) in matchPreview.samples" :key="idx" class="sample-item">
                <span class="sample-value">{{ sample.sourceValue }}</span>
                <Icon name="lucide:arrow-right" />
                <span class="sample-value">{{ sample.targetValue }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          Create Relation
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CaseTableRecord, CaseFieldRecord } from '../../../utils/db/schema/newTableSchema'

interface MatchPreview {
  matchPercentage: number
  matchedCount: number
  totalCount: number
  samples: Array<{
    sourceValue: string
    targetValue: string
  }>
}
const { query } = usePglite()
const { getAvailableTablesForRelation, getFieldsForTable } = useColumnsInject()
const { getSuggestionsForField, dismissSuggestion } = useRelationSuggestions()

const emit = defineEmits<{
  created: [data: {
    targetTableId: string
    targetFieldId: string
    displayFieldNames: string[]  // Array of field names for multiple display fields
    relationColumnName: string
  }]
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const sourceColumn = ref<any>(null)
const sourceTableId = ref<string>('')
const sourceTableName = ref<string>('')
const availableTables = ref<CaseTableRecord[]>([])
const targetFields = ref<CaseFieldRecord[]>([])
const matchPreview = ref<MatchPreview | null>(null)
const suggestions = ref<any[]>([])

const formData = reactive({
  targetTableId: '',
  targetFieldId: '',
  displayFieldNames: [] as string[],  // Array of field names for multiple display fields
  relationColumnName: '',
})

const rules: FormRules = {
  targetTableId: [{ required: true, message: 'Please select a target table', trigger: 'change' }],
  targetFieldId: [{ required: true, message: 'Please select a match field', trigger: 'change' }],
  displayFieldNames: [{ 
    required: true, 
    validator: (_rule: any, value: string[], callback: any) => {
      if (!value || value.length === 0) {
        callback(new Error('Please select at least one display field'))
      } else {
        callback()
      }
    },
    trigger: 'change' 
  }],
  relationColumnName: [{ required: true, message: 'Please enter a column name', trigger: 'blur' }]
}

const canCreate = computed(() => {
  return formData.targetTableId && formData.targetFieldId && formData.displayFieldNames.length > 0 && formData.relationColumnName && !loading.value
})

async function open(column: any, tableId: string, tableName: string) {
  sourceColumn.value = column
  sourceTableId.value = tableId
  sourceTableName.value = tableName
  visible.value = true
  
  // Set default relation column name
  formData.relationColumnName = `${column.title} (Relation)`
  
  // Load available tables
  await loadAvailableTables()
  
  // Load suggestions for this field
  await loadSuggestions()
}

async function loadSuggestions() {
  try {
    // Get the field name from the column
    const fieldName = sourceColumn.value?.field
    if (!fieldName) return
    
    // Query to get the field ID from field name
    const fieldData = await query<CaseFieldRecord>(
      `SELECT id FROM case_fields WHERE "tableId" = $1 AND "fieldName" = $2`,
      [sourceTableId.value, fieldName]
    )
    
    if (fieldData.length === 0) return
    
    const fieldId = fieldData[0].id
    const fieldSuggestions = await getSuggestionsForField(sourceTableId.value, fieldId)
    suggestions.value = fieldSuggestions
  } catch (error) {
    console.error('Error loading suggestions:', error)
    // Don't show error to user, just silently fail
  }
}

async function applySuggestion(suggestion: any) {
  // Auto-fill form with suggestion values
  formData.targetTableId = suggestion.targetTableId
  formData.targetFieldId = suggestion.targetFieldId
  
  // Load target fields first
  await handleTableChange()
  
  // Use matched field name as default display field
  const matchedField = targetFields.value.find(f => f.id === suggestion.targetFieldId)
  if (matchedField) {
    formData.displayFieldNames = [matchedField.fieldName]
  }
  
  // Remove this suggestion from the list
  suggestions.value = suggestions.value.filter(s => s.id !== suggestion.id)
}

async function dismissSuggestionItem(suggestionId: string) {
  try {
    await dismissSuggestion(suggestionId)
    suggestions.value = suggestions.value.filter(s => s.id !== suggestionId)
    ElMessage.success('Suggestion dismissed')
  } catch (error) {
    console.error('Error dismissing suggestion:', error)
    ElMessage.error('Failed to dismiss suggestion')
  }
}

async function loadAvailableTables() {
  try {
    if (!getAvailableTablesForRelation) {
      console.error('getAvailableTablesForRelation not available')
      ElMessage.error('Failed to load tables')
      return
    }
    
    // Get all tables from the same entity, excluding current table
    const tables = await getAvailableTablesForRelation(true)
    availableTables.value = tables
  } catch (error) {
    console.error('Error loading tables:', error)
    ElMessage.error('Failed to load tables')
  }
}

async function handleTableChange() {
  formData.targetFieldId = ''
  formData.displayFieldNames = []
  targetFields.value = []
  matchPreview.value = null
  
  if (!formData.targetTableId) return
  
  try {
    if (!getFieldsForTable) {
      console.error('getFieldsForTable not available')
      ElMessage.error('Failed to load fields')
      return
    }
    
    // Load fields for the selected table
    const fields = await getFieldsForTable(formData.targetTableId)
    targetFields.value = fields
    
    // Set default display field to the first field (usually 'name' or similar)
    if (fields.length > 0) {
      formData.displayFieldNames = [fields[0].fieldName]
    }
  } catch (error) {
    console.error('Error loading fields:', error)
    ElMessage.error('Failed to load fields')
  }
}

watch(() => formData.targetFieldId, async (newValue) => {
  if (!newValue) {
    matchPreview.value = null
    return
  }
  
  await generateMatchPreview()
})

async function generateMatchPreview() {
  if (!formData.targetTableId || !formData.targetFieldId) return
  
  try {
    const targetTable = availableTables.value.find(t => t.id === formData.targetTableId)
    const targetField = targetFields.value.find(f => f.id === formData.targetFieldId)
    
    if (!targetTable || !targetField) return
    
    // Get source values
    const sourceRows = await query<Record<string, any>>(
      `SELECT "${sourceColumn.value.field}" FROM "${sourceTableName.value}" 
       WHERE "${sourceColumn.value.field}" IS NOT NULL`
    )
    const sourceValues = sourceRows.map(r => String(r[sourceColumn.value.field]))
    
    // Get target values
    const targetRows = await query<Record<string, any>>(
      `SELECT "${targetField.fieldName}" FROM "${targetTable.tableName}" 
       WHERE "${targetField.fieldName}" IS NOT NULL`
    )
    const targetValueSet = new Set(targetRows.map(r => String(r[targetField.fieldName])))
    
    // Calculate matches
    const matches = sourceValues.filter(v => targetValueSet.has(v))
    const matchPercentage = sourceValues.length > 0 
      ? Math.round((matches.length / sourceValues.length) * 100)
      : 0
    
    // Get sample matches
    const samples = matches.slice(0, 5).map(v => ({
      sourceValue: v,
      targetValue: v
    }))
    
    matchPreview.value = {
      matchPercentage,
      matchedCount: matches.length,
      totalCount: sourceValues.length,
      samples
    }
  } catch (error) {
    console.error('Error generating preview:', error)
  }
}

async function handleCreate() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // Convert to plain array to avoid DataCloneError when passing through Worker postMessage
    emit('created', {
      targetTableId: formData.targetTableId,
      targetFieldId: formData.targetFieldId,
      displayFieldNames: [...formData.displayFieldNames],
      relationColumnName: formData.relationColumnName,
    })
    
    handleClose()
  } catch (error) {
    console.error('Validation failed:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  formRef.value?.resetFields()
  sourceColumn.value = null
  sourceTableId.value = ''
  sourceTableName.value = ''
  targetFields.value = []
  matchPreview.value = null
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.create-relation-dialog {
  .description {
    margin-bottom: var(--app-space-l);
    padding: var(--app-space-m);
    background: var(--app-grey-950);
    border-radius: var(--app-border-radius);
    color: var(--app-grey-400);
    font-size: var(--app-font-size-s);
  }
}

.suggestions-section {
  margin-bottom: var(--app-space-l);
  padding: var(--app-space-m);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--app-border-radius);
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
  font-weight: 500;
  color: var(--el-color-primary);
  
  .suggestion-icon {
    font-size: 18px;
  }
  
  .suggestions-title {
    font-size: var(--app-font-size-m);
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--el-bg-color);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--el-border-color);
  
  &:hover {
    border-color: var(--el-color-primary);
  }
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  flex: 1;
}

.suggestion-label {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.suggestion-actions {
  display: flex;
  gap: var(--app-space-s);
  flex-shrink: 0;
}

.field-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .field-name {
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-500);
    font-family: monospace;
  }
}

.match-preview {
  margin-top: var(--app-space-l);
  padding: var(--app-space-m);
  background: var(--app-grey-950);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--app-grey-800);
  
  .preview-header {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    margin-bottom: var(--app-space-m);
    font-weight: 600;
    color: var(--app-grey-300);
  }
  
  .preview-content {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }
  
  .preview-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--app-space-xs) 0;
    
    .label {
      color: var(--app-grey-500);
      font-size: var(--app-font-size-s);
    }
    
    .value {
      color: var(--app-grey-200);
      font-weight: 500;
    }
  }
  
  .preview-samples {
    margin-top: var(--app-space-s);
    padding-top: var(--app-space-s);
    border-top: 1px solid var(--app-grey-800);
    
    .samples-title {
      color: var(--app-grey-500);
      font-size: var(--app-font-size-xs);
      margin-bottom: var(--app-space-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .sample-item {
      display: flex;
      align-items: center;
      gap: var(--app-space-s);
      padding: var(--app-space-xs);
      font-size: var(--app-font-size-s);
      
      .sample-value {
        flex: 1;
        padding: var(--app-space-xxs) var(--app-space-xs);
        background: var(--app-grey-900);
        border-radius: var(--app-border-radius-s);
        color: var(--app-grey-300);
        font-family: monospace;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
