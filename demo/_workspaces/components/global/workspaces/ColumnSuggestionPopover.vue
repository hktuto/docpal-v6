<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { CaseFieldRecord } from '../../../utils/db/schema/newTableSchema'

interface SuggestionItem {
  id: string
  sourceTableName: string
  sourceFieldName: string
  targetTableName: string
  targetFieldName: string
  matchReason: string
  matchCount: number
  totalCount: number
  sampleValues: string[]
  suggestedType: string
  sourceTableId: string
  sourceFieldId: string
  targetTableId: string
  targetFieldId: string
}

interface SuggestionWithState extends SuggestionItem {
  selectedDisplayFieldNames: string[]
  displayFieldOptions: CaseFieldRecord[]
  loading: boolean
}

const emit = defineEmits<{
  accepted: [data: { suggestion: SuggestionItem; displayFieldNames: string[] }]
  dismissed: [suggestionId: string]
}>()

const { query } = usePglite()

const popoverRef = ref()
const loading = ref(false)
const suggestions = ref<SuggestionWithState[]>([])
const currentFieldId = ref('')
const currentFieldName = ref('')
const currentTableId = ref('')

async function open(fieldId: string, fieldName: string, tableId: string, target: HTMLElement) {
  currentFieldId.value = fieldId
  currentFieldName.value = fieldName
  currentTableId.value = tableId
  
  await loadSuggestions()
  popoverRef.value?.open(target)
}

function close() {
  popoverRef.value?.close()
}

async function loadSuggestions() {
  loading.value = true
  try {
    // Get suggestions for this specific field
    const baseSuggestions = await query<SuggestionItem>(
      `SELECT 
        s.*,
        st.name as "sourceTableName",
        sf."fieldNameAlias" as "sourceFieldName",
        tt.name as "targetTableName",
        tf."fieldNameAlias" as "targetFieldName"
       FROM relation_suggestions s
       JOIN case_tables st ON s."sourceTableId" = st.id
       JOIN case_fields sf ON s."sourceFieldId" = sf.id
       JOIN case_tables tt ON s."targetTableId" = tt.id
       JOIN case_fields tf ON s."targetFieldId" = tf.id
       WHERE s."sourceTableId" = $1 
       AND s."sourceFieldId" = $2
       AND s.status = 'pending'
       ORDER BY s."matchCount" DESC`,
      [currentTableId.value, currentFieldId.value]
    )
    
    // Load display field options for each suggestion
    suggestions.value = await Promise.all(
      baseSuggestions.map(async (suggestion) => {
        // Get all fields from target table for display options
        const fields = await query<CaseFieldRecord>(
          `SELECT * FROM case_fields 
           WHERE "tableId" = $1 
           AND "businessType" != 'relation'
           ORDER BY "fieldNameAlias"`,
          [suggestion.targetTableId]
        )
        
        // Find the matched field to get its fieldName
        const matchedField = fields.find(f => f.id === suggestion.targetFieldId)
        
        return {
          ...suggestion,
          selectedDisplayFieldNames: matchedField ? [matchedField.fieldName] : [],
          displayFieldOptions: fields,
          loading: false
        }
      })
    )
  } catch (error) {
    console.error('Error loading suggestions:', error)
    ElMessage.error('Failed to load suggestions')
  } finally {
    loading.value = false
  }
}

async function handleAccept(suggestion: SuggestionWithState) {
  if (!suggestion.selectedDisplayFieldNames || suggestion.selectedDisplayFieldNames.length === 0) {
    ElMessage.warning('Please select at least one display field')
    return
  }
  
  suggestion.loading = true
  
  // Convert to plain array to avoid DataCloneError
  emit('accepted', {
    suggestion,
    displayFieldNames: [...suggestion.selectedDisplayFieldNames]
  })
}

async function handleDismiss(suggestionId: string) {
  emit('dismissed', suggestionId)
  // Remove from local list
  suggestions.value = suggestions.value.filter(s => s.id !== suggestionId)
  
  // Close popover if no more suggestions
  if (suggestions.value.length === 0) {
    close()
  }
}

function markComplete(suggestionId: string) {
  suggestions.value = suggestions.value.filter(s => s.id !== suggestionId)
  if (suggestions.value.length === 0) {
    close()
  }
}

function resetLoading(suggestionId: string) {
  const suggestion = suggestions.value.find(s => s.id === suggestionId)
  if (suggestion) {
    suggestion.loading = false
  }
}

defineExpose({
  open,
  close,
  markComplete,
  resetLoading
})
</script>

<template>
  <UiPopoverDialog
    ref="popoverRef"
    title="Relation Suggestions"
    width="400px"
    placement="bottom"
    :show-footer="false"
  >
    <div class="column-suggestion-content">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="2" animated />
      </div>
      
      <div v-else-if="suggestions.length === 0" class="empty-state">
        <Icon name="lucide:check-circle" class="empty-icon" />
        <span>No suggestions for this column</span>
      </div>
      
      <div v-else class="suggestions-list">
        <div class="field-info">
          <Icon name="lucide:sparkles" class="sparkle-icon" />
          <span>{{ suggestions.length }} suggestion{{ suggestions.length > 1 ? 's' : '' }} for "{{ currentFieldName }}"</span>
        </div>
        
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-card"
        >
          <div class="suggestion-header">
            <div class="target-info">
              <Icon name="lucide:arrow-right" class="arrow-icon" />
              <span class="target-table">{{ suggestion.targetTableName }}</span>
              <span class="target-field">.{{ suggestion.targetFieldName }}</span>
            </div>
          </div>
          
          <div class="suggestion-details">
            <div class="match-info">
              <el-tag size="small" :type="suggestion.matchCount === suggestion.totalCount ? 'success' : 'info'">
                {{ suggestion.matchCount }}/{{ suggestion.totalCount }} matched
                ({{ Math.round((suggestion.matchCount / suggestion.totalCount) * 100) }}%)
              </el-tag>
              <el-tag v-if="suggestion.matchReason === 'name_and_value'" size="small" type="success">
                Name Match
              </el-tag>
            </div>
            
            <div v-if="suggestion.sampleValues?.length > 0" class="sample-values">
              <span class="sample-label">Sample:</span>
              <span class="sample-text">{{ suggestion.sampleValues.slice(0, 3).join(', ') }}</span>
            </div>
            
            <div class="display-field-select">
              <span class="select-label">Display:</span>
              <el-select
                v-model="suggestion.selectedDisplayFieldNames"
                size="small"
                multiple
                collapse-tags
                collapse-tags-tooltip
                style="flex: 1"
                placeholder="Select fields"
              >
                <el-option
                  v-for="field in suggestion.displayFieldOptions"
                  :key="field.fieldName"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </div>
          </div>
          
          <div class="suggestion-actions">
            <el-button
              type="primary"
              size="small"
              :loading="suggestion.loading"
              @click="handleAccept(suggestion)"
            >
              Create
            </el-button>
            <el-button
              size="small"
              text
              :disabled="suggestion.loading"
              @click="handleDismiss(suggestion.id)"
            >
              Dismiss
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.column-suggestion-content {
  min-height: 100px;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-l);
  gap: var(--app-space-s);
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 24px;
  color: var(--el-color-success);
}

.field-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  margin-bottom: var(--app-space-s);
  background: var(--el-color-primary-light-9);
  border-radius: var(--app-border-radius);
  font-size: var(--app-font-size-s);
  color: var(--el-color-primary);
  
  .sparkle-icon {
    font-size: 16px;
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.suggestion-card {
  padding: var(--app-space-m);
  background: var(--el-fill-color-lighter);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--el-border-color-lighter);
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
  }
}

.suggestion-header {
  margin-bottom: var(--app-space-s);
}

.target-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-m);
  
  .arrow-icon {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
  
  .target-table {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .target-field {
    color: var(--el-text-color-secondary);
    font-family: monospace;
  }
}

.suggestion-details {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  margin-bottom: var(--app-space-s);
}

.match-info {
  display: flex;
  gap: var(--app-space-xs);
  flex-wrap: wrap;
}

.sample-values {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  
  .sample-label {
    margin-right: var(--app-space-xs);
  }
  
  .sample-text {
    font-family: monospace;
    background: var(--el-fill-color);
    padding: 2px 6px;
    border-radius: var(--app-border-radius-s);
  }
}

.display-field-select {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  
  .select-label {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
}

.suggestion-actions {
  display: flex;
  gap: var(--app-space-s);
  justify-content: flex-end;
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
