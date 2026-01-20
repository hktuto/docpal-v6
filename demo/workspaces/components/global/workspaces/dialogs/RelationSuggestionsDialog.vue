<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { CaseFieldRecord } from '../../../../utils/db/schema/newTableSchema'

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
  selectedDisplayFieldId: string
  displayFieldOptions: CaseFieldRecord[]
  loading: boolean
}

const emit = defineEmits<{
  accepted: [data: { suggestion: SuggestionItem; displayFieldId: string }]
  dismissed: [suggestionId: string]
  dismissedAll: []
}>()

const { query } = usePglite()
const { 
  getPendingSuggestions, 
  dismissSuggestion, 
  dismissAllSuggestions,
  ANALYSIS_ROW_LIMIT 
} = useRelationSuggestions()

const popoverRef = ref()
const loading = ref(false)
const suggestions = ref<SuggestionWithState[]>([])
const currentTableId = ref('')
const currentTableName = ref('')

async function open(tableId: string, target: HTMLElement) {
  currentTableId.value = tableId

  
  // Get current table name
  const tableData = await query<any>(
    `SELECT name FROM case_tables WHERE id = $1`,
    [tableId]
  )
  currentTableName.value = tableData[0]?.name || 'Current Table'
  
  await loadSuggestions()
  popoverRef.value.open(target)
}

async function loadSuggestions() {
  loading.value = true
  try {
    const baseSuggestions = await getPendingSuggestions(currentTableId.value)
    
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
        
        return {
          ...suggestion,
          selectedDisplayFieldId: fields[0]?.id || '', // Default to first field
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
  if (!suggestion.selectedDisplayFieldId) {
    ElMessage.warning('Please select a display field')
    return
  }
  
  suggestion.loading = true
  
  try {
    emit('accepted', {
      suggestion,
      displayFieldId: suggestion.selectedDisplayFieldId
    })
    
    // Remove from list after successful creation
    await nextTick()
    suggestions.value = suggestions.value.filter(s => s.id !== suggestion.id)
    
    if (suggestions.value.length === 0) {
      popoverRef.value.close()
    }
  } catch (error) {
    suggestion.loading = false
  }
}

async function handleDismiss(suggestionId: string) {
  try {
    await dismissSuggestion(suggestionId)
    suggestions.value = suggestions.value.filter(s => s.id !== suggestionId)
    ElMessage.success('Suggestion dismissed')
    
    if (suggestions.value.length === 0) {
      popoverRef.value.close()
    }
    
    emit('dismissed', suggestionId)
  } catch (error) {
    console.error('Error dismissing suggestion:', error)
    ElMessage.error('Failed to dismiss suggestion')
  }
}

async function handleDismissAll() {
  try {
    await dismissAllSuggestions(currentTableId.value)
    suggestions.value = []
    popoverRef.value.close()
    ElMessage.success('All suggestions dismissed')
    emit('dismissedAll')
  } catch (error) {
    console.error('Error dismissing all suggestions:', error)
    ElMessage.error('Failed to dismiss suggestions')
  }
}

function getMatchPercentage(suggestion: SuggestionItem): number {
  return Math.round((suggestion.matchCount / suggestion.totalCount) * 100)
}

defineExpose({ open })
</script>

<template>
  <UiPopoverDialog
    ref="popoverRef"
    width="700px"
    :close-on-click-modal="false"
  >
    <h3>Suggested Relations</h3>
    <div v-loading="loading" class="suggestions-content">
      <div v-if="suggestions.length === 0 && !loading" class="empty-state">
        <el-empty description="No suggestions found" />
      </div>

      <div v-else class="suggestions-list">
        <div class="suggestions-header">
          <p class="description">
            We found {{ suggestions.length }} potential relation{{ suggestions.length > 1 ? 's' : '' }} 
            by analyzing the first {{ ANALYSIS_ROW_LIMIT }} rows of data.
          </p>
        </div>

        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-item"
        >
          <div class="suggestion-main">
            <div class="suggestion-info">
              <div class="relation-title">
                <span class="table-name">{{ currentTableName }}</span>
                <Icon name="lucide:arrow-left" class="arrow-icon" />
                <span class="table-name">{{ suggestion.targetTableName }}</span>
              </div>
              
              <div class="relation-details">
                <span class="detail-label">Match field:</span>
                <span class="detail-value">{{ suggestion.sourceFieldName }} ↔ {{ suggestion.targetFieldName }}</span>
              </div>
              
              <div class="suggestion-meta">
                <el-tag size="small" type="info">
                  {{ suggestion.matchCount }}/{{ suggestion.totalCount }} matched
                  ({{ getMatchPercentage(suggestion) }}%)
                </el-tag>
                <el-tag v-if="suggestion.matchReason === 'name_and_value'" size="small" type="success">
                  Name + Value Match
                </el-tag>
                <el-tag v-else size="small">
                  Value Match
                </el-tag>
              </div>

              <div v-if="suggestion.sampleValues.length > 0" class="sample-values">
                <span class="sample-label">Sample:</span>
                <span class="sample-text">{{ suggestion.sampleValues.join(', ') }}</span>
              </div>
              
              <div class="display-field-select">
                <span class="select-label">Display field:</span>
                <el-select
                  v-model="suggestion.selectedDisplayFieldId"
                  size="small"
                  style="width: 200px"
                >
                  <el-option
                    v-for="field in suggestion.displayFieldOptions"
                    :key="field.id"
                    :label="field.fieldNameAlias"
                    :value="field.id"
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
                :disabled="suggestion.loading"
                @click="handleDismiss(suggestion.id)"
              >
                Dismiss
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dialog-footer">
        <el-button @click="handleDismissAll">
          Dismiss All
        </el-button>
        <el-button type="primary" @click="popoverRef.close()">
          Close
        </el-button>
      </div>
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.suggestions-content {
  min-height: 200px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-l);
}

.suggestions-header {
  margin-bottom: var(--app-space-m);
  
  .description {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.suggestion-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: var(--app-space-m);
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}

.suggestion-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--app-space-m);
}

.suggestion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.relation-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: var(--app-space-xs);

  .table-name {
    color: var(--el-text-color-primary);
  }

  .arrow-icon {
    color: var(--el-color-primary);
    font-size: 18px;
  }
}

.relation-details {
  display: flex;
  gap: var(--app-space-xs);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--app-space-s);
  
  .detail-label {
    font-weight: 500;
  }
  
  .detail-value {
    font-family: monospace;
  }
}

.display-field-select {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-top: var(--app-space-s);
  
  .select-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }
}

.suggestion-meta {
  display: flex;
  gap: var(--app-space-s);
  flex-wrap: wrap;
}

.sample-values {
  display: flex;
  gap: var(--app-space-xs);
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .sample-label {
    font-weight: 500;
  }

  .sample-text {
    font-family: monospace;
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.suggestion-actions {
  display: flex;
  gap: var(--app-space-s);
  flex-shrink: 0;
}

.dialog-footer {
  padding-block: var(--app-space-s);
  display: flex;
  justify-content: space-between;
}
</style>

