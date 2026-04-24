<script setup lang="ts">
import type { RelationSuggestion, AnalysisResult } from '../../../composables/useRelationAnalyzer'
import { ElMessage } from 'element-plus'
const props = defineProps<{
  modelValue: boolean
  analysisResult: AnalysisResult | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [selectedSuggestions: RelationSuggestion[]]
  'cancel': []
}>()

const { createRelationFields } = useRelationAnalyzer()

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Track selected suggestions and their directions
const selectedIds = ref<Set<string>>(new Set())
const flippedIds = ref<Set<string>>(new Set())  // Track which suggestions have flipped direction
const isCreating = ref(false)

// Initialize with high confidence suggestions selected
watch(() => props.analysisResult, (result) => {
  if (result) {
    selectedIds.value = new Set(
      result.suggestions
        .filter(s => s.confidence === 'high')
        .map(s => s.id)
    )
    flippedIds.value = new Set()
  }
}, { immediate: true })

function toggleSelection(suggestionId: string) {
  if (selectedIds.value.has(suggestionId)) {
    selectedIds.value.delete(suggestionId)
  } else {
    selectedIds.value.add(suggestionId)
  }
  // Trigger reactivity
  selectedIds.value = new Set(selectedIds.value)
}

function toggleDirection(suggestionId: string, event: Event) {
  event.stopPropagation()
  
  if (flippedIds.value.has(suggestionId)) {
    flippedIds.value.delete(suggestionId)
  } else {
    flippedIds.value.add(suggestionId)
  }
  // Trigger reactivity
  flippedIds.value = new Set(flippedIds.value)
}

function isFlipped(suggestionId: string): boolean {
  return flippedIds.value.has(suggestionId)
}

function selectAll() {
  if (props.analysisResult) {
    selectedIds.value = new Set(props.analysisResult.suggestions.map(s => s.id))
  }
}

function selectNone() {
  selectedIds.value = new Set()
}

function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high': return 'var(--el-color-success)'
    case 'medium': return 'var(--el-color-warning)'
    case 'low': return 'var(--el-color-info)'
  }
}

/**
 * Get the final suggestion with direction applied
 */
function getFinalSuggestion(suggestion: RelationSuggestion): RelationSuggestion {
  if (!isFlipped(suggestion.id)) {
    return suggestion
  }
  
  // Flip source and target
  return {
    ...suggestion,
    sourceTable: suggestion.targetTable,
    sourceField: suggestion.targetField,
    targetTable: suggestion.sourceTable,
    targetField: suggestion.sourceField,
  }
}

async function handleConfirm() {
  if (!props.analysisResult) return
  
  const selectedSuggestions = props.analysisResult.suggestions
    .filter(s => selectedIds.value.has(s.id))
    .map(s => getFinalSuggestion(s))
  
  if (selectedSuggestions.length === 0) {
    ElMessage.warning('Please select at least one relationship to create')
    return
  }
  
  isCreating.value = true
  
  try {
    await createRelationFields(selectedSuggestions)
    ElMessage.success(`Created ${selectedSuggestions.length} relation field(s)`)
    emit('confirm', selectedSuggestions)
    isVisible.value = false
  } catch (error) {
    console.error('Error creating relation fields:', error)
    ElMessage.error('Failed to create relation fields')
  } finally {
    isCreating.value = false
  }
}

function handleCancel() {
  emit('cancel')
  isVisible.value = false
}

function handleSkip() {
  emit('cancel')
  isVisible.value = false
  ElMessage.info('Relationship analysis skipped. You can run it later from the table settings.')
}
</script>

<template>
  <el-dialog
    v-model="isVisible"
    title="Detected Relationships"
    width="680px"
    :close-on-click-modal="false"
    :close-on-press-escape="!isCreating"
    class="relation-suggest-dialog"
  >
    <!-- Header Stats -->
    <div class="analysis-stats">
      <div class="stat-item">
        <Icon name="material-symbols:table-chart" />
        <span>{{ analysisResult?.analyzedTables || 0 }} tables</span>
      </div>
      <div class="stat-item">
        <Icon name="material-symbols:link" />
        <span>{{ analysisResult?.suggestions.length || 0 }} found</span>
      </div>
    </div>

    <!-- No suggestions found -->
    <div v-if="!analysisResult?.suggestions.length" class="empty-state">
      <Icon name="material-symbols:search-off" class="empty-icon" />
      <p>No potential relationships detected.</p>
    </div>

    <!-- Suggestions list -->
    <div v-else class="suggestions-container">
      <div class="selection-actions">
        <el-button size="small" text @click="selectAll">Select All</el-button>
        <el-button size="small" text @click="selectNone">Select None</el-button>
        <span class="selection-count">{{ selectedIds.size }} selected</span>
      </div>

      <div class="suggestions-list">
        <div
          v-for="suggestion in analysisResult.suggestions"
          :key="suggestion.id"
          class="suggestion-item"
          :class="{ selected: selectedIds.has(suggestion.id) }"
          @click="toggleSelection(suggestion.id)"
        >
          <el-checkbox
            :model-value="selectedIds.has(suggestion.id)"
            @click.stop
            @change="toggleSelection(suggestion.id)"
          />
          
          <div class="relation-row">
            <!-- Left Side (Source or Target depending on flip) -->
            <div class="table-card" :class="isFlipped(suggestion.id) ? 'target' : 'source'">
              <div class="table-name">
                <Icon name="material-symbols:table-chart" />
                <span>{{ isFlipped(suggestion.id) ? suggestion.targetTable.name : suggestion.sourceTable.name }}</span>
              </div>
              <div class="field-name">
                {{ isFlipped(suggestion.id) ? suggestion.targetField.fieldNameAlias : suggestion.sourceField.fieldNameAlias }}
              </div>
            </div>

            <!-- Arrow (Clickable to flip direction) -->
            <div 
              class="direction-arrow"
              :class="{ flipped: isFlipped(suggestion.id) }"
              @click="toggleDirection(suggestion.id, $event)"
              v-tooltip="'Click to flip direction'"
            >
              <Icon name="material-symbols:arrow-forward" class="arrow-icon" />
              <div class="match-rate" :style="{ color: getConfidenceColor(suggestion.confidence) }">
                {{ suggestion.matchPercentage }}%
              </div>
            </div>

            <!-- Right Side (Target or Source depending on flip) -->
            <div class="table-card" :class="isFlipped(suggestion.id) ? 'source' : 'target'">
              <div class="table-name">
                <Icon name="material-symbols:table-chart" />
                <span>{{ isFlipped(suggestion.id) ? suggestion.sourceTable.name : suggestion.targetTable.name }}</span>
              </div>
              <div class="field-name">
                {{ isFlipped(suggestion.id) ? suggestion.sourceField.fieldNameAlias : suggestion.targetField.fieldNameAlias }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hint-text">
        <Icon name="material-symbols:info-outline" />
        <span>Click the arrow to change link direction. The relation field will be added to the <strong>left</strong> table.</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleSkip" :disabled="isCreating">
          Skip
        </el-button>
        <el-button @click="handleCancel" :disabled="isCreating">
          Cancel
        </el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :loading="isCreating"
          :disabled="selectedIds.size === 0"
        >
          Create {{ selectedIds.size }} Relation(s)
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.relation-suggest-dialog {
  :deep(.el-dialog__body) {
    padding-top: 12px;
  }
}

.analysis-stats {
  display: flex;
  gap: 24px;
  padding: 8px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    
    .iconify {
      font-size: 16px;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
  }
}

.suggestions-container {
  .selection-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .selection-count {
      margin-left: auto;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-lighter);
  }
  
  &.selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  
  .el-checkbox {
    flex-shrink: 0;
  }
}

.relation-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.table-card {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border: 1px solid transparent;
  
  &.source {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  
  &.target {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
  }
  
  .table-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
    
    .iconify {
      font-size: 14px;
      opacity: 0.7;
    }
    
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .field-name {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.direction-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: var(--el-fill-color);
    
    .arrow-icon {
      color: var(--el-color-primary);
      transform: scale(1.2);
    }
  }
  
  .arrow-icon {
    font-size: 20px;
    color: var(--el-text-color-secondary);
    transition: all 0.2s;
  }
  
  &.flipped .arrow-icon {
    transform: rotate(180deg);
  }
  
  &.flipped:hover .arrow-icon {
    transform: rotate(180deg) scale(1.2);
  }
  
  .match-rate {
    font-size: 11px;
    font-weight: 600;
  }
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  
  .iconify {
    font-size: 14px;
    flex-shrink: 0;
  }
  
  strong {
    color: var(--el-color-primary);
  }
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
