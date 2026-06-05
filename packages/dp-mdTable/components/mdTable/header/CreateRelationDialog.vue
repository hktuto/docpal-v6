<template>
  <el-dialog
    v-model="visible"
    title="Create Relation"
    width="480px"
    :close-on-click-modal="false"
    @close="close"
  >
    <!-- Step 1: Pick a suggestion -->
    <div v-if="!selectedSuggestion">
      <div v-if="suggestions.length === 0" class="dialog-empty">
        <Icon name="lucide:info" size="20" />
        <span>No strong relation suggestions found for this column.</span>
      </div>

      <div v-else class="suggestions-list">
        <div class="suggestions-title">Suggested relations</div>
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          <div class="suggestion-info">
            <span class="suggestion-target-table">{{ suggestion.targetTableName }}</span>
            <span class="suggestion-arrow">→</span>
            <span class="suggestion-target-field">{{ suggestion.targetFieldAlias }}</span>
          </div>
          <div class="suggestion-meta">
            <el-tag size="small" :type="suggestion.confidence > 0.7 ? 'success' : 'warning'">
              {{ Math.round(suggestion.confidence * 100) }}%
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Configure relation -->
    <div v-else class="confirm-dialog-body">
      <div class="relation-summary">
        <div class="summary-row">
          <span class="summary-label">From</span>
          <span class="summary-value">{{ sourceTableName }} — {{ sourceFieldAlias }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">To</span>
          <span class="summary-value">{{ selectedSuggestion.targetTableName }} — {{ selectedSuggestion.targetFieldAlias }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Confidence</span>
          <el-tag size="small" :type="selectedSuggestion.confidence > 0.7 ? 'success' : 'warning'">
            {{ Math.round(selectedSuggestion.confidence * 100) }}%
          </el-tag>
        </div>
      </div>

      <el-form label-position="top" class="relation-form">
        <el-form-item label="Relation Label" required>
          <el-input
            v-model="relationLabel"
            placeholder="e.g. Company, Assigned To, Project"
            clearable
          />
        </el-form-item>

        <el-form-item label="Display Fields" required>
          <el-select
            v-model="selectedDisplayFields"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="Select fields to show"
            :loading="loadingFields"
            style="width: 100%"
          >
            <el-option
              v-for="field in targetFields"
              :key="field.id"
              :label="field.field_name_alias || field.field_name || field.id"
              :value="field.id!"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="isArray">Allow multiple links (one-to-many)</el-checkbox>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button v-if="selectedSuggestion" @click="selectedSuggestion = null">Back</el-button>
      <el-button v-if="selectedSuggestion" type="primary" :disabled="!canSubmit" :loading="submitting" @click="confirmCreate">
        Create Relation
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useImportRelationAnalysisState } from '@packages/dynamic-db/composables/import/useImportRelationAnalysis'
import {
  establishRelation,
  pollRelationJobStatus
} from '@packages/dynamic-db/composables/import/useImportRelationEstablish'
import { newClientApi } from 'api'

const props = defineProps<{
  sourceColumn: any
}>()

const emit = defineEmits<{
  success: []
}>()

const visible = ref(false)
const selectedSuggestion = ref<any>(null)
const submitting = ref(false)

const analysis = useImportRelationAnalysisState()

const suggestions = computed(() => {
  if (!props.sourceColumn) return []
  const tableId = props.sourceColumn.master_table_id || props.sourceColumn.tableId
  const fieldName = props.sourceColumn.field_name || props.sourceColumn.field
  const seen = new Set<string>()
  return analysis.value.guesses
    .filter((g) =>
      !g.dismissed &&
      g.sourceTableId === tableId &&
      g.sourceFieldName === fieldName
    )
    .filter((g) => {
      const key = `${g.targetTableId}-${g.targetFieldId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 5)
})

const sourceTableName = computed(() => {
  const tableId = props.sourceColumn?.master_table_id || props.sourceColumn?.tableId
  const guess = analysis.value.guesses.find(g => g.sourceTableId === tableId)
  return guess?.sourceTableName || 'Current Table'
})

const sourceFieldAlias = computed(() => {
  return props.sourceColumn?.field_name_alias || props.sourceColumn?.field_name || props.sourceColumn?.field || 'Current Column'
})

// Configuration step state
const targetFields = ref<any[]>([])
const loadingFields = ref(false)
const relationLabel = ref('')
const selectedDisplayFields = ref<string[]>([])
const isArray = ref(true)

const canSubmit = computed(() => {
  return (
    relationLabel.value.trim().length > 0 &&
    selectedDisplayFields.value.length > 0 &&
    !submitting.value
  )
})

async function loadTargetFields() {
  const guess = selectedSuggestion.value
  if (!guess) {
    targetFields.value = []
    return
  }
  loadingFields.value = true
  try {
    const res: any = await newClientApi.getDynamicDbTableTableidFields(guess.targetTableId)
    const fields: any[] = res?.data ?? []
    targetFields.value = fields.filter(
      (f) => f.field_name && !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(f.field_name)
    )

    const defaultIds = new Set<string>()
    if (guess.targetFieldId) defaultIds.add(guess.targetFieldId)
    for (const f of fields) {
      if (defaultIds.size >= 3) break
      const name = (f.field_name || '').toLowerCase()
      if (name.includes('name') || name.includes('title') || name.includes('label')) {
        if (f.id) defaultIds.add(f.id)
      }
    }
    selectedDisplayFields.value = Array.from(defaultIds).filter((id) =>
      targetFields.value.some((f) => f.id === id)
    )

    relationLabel.value = guess.targetTableName
  } catch {
    ElMessage.error('Failed to load target table fields')
  } finally {
    loadingFields.value = false
  }
}

function open() {
  visible.value = true
  selectedSuggestion.value = null
  targetFields.value = []
  selectedDisplayFields.value = []
  relationLabel.value = ''
  isArray.value = true
}

async function selectSuggestion(suggestion: any) {
  selectedSuggestion.value = suggestion
  await loadTargetFields()
}

async function confirmCreate() {
  if (!selectedSuggestion.value || !props.sourceColumn?.id) return

  if (!relationLabel.value.trim()) {
    ElMessage.warning('Please enter a relation label')
    return
  }
  if (selectedDisplayFields.value.length === 0) {
    ElMessage.warning('Please select at least one display field')
    return
  }

  submitting.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: 'Creating relation...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const sourceTableId = props.sourceColumn.master_table_id || props.sourceColumn.tableId
    if (!sourceTableId) {
      ElMessage.error('Unable to determine source table ID')
      loadingInstance.close()
      submitting.value = false
      return
    }

    const jobId = await establishRelation({
      source_table_id: sourceTableId,
      target_table_id: selectedSuggestion.value.targetTableId,
      source_match_field_id: props.sourceColumn.id,
      target_match_field_id: selectedSuggestion.value.targetFieldId,
      relation_field_name: relationLabel.value.trim(),
      display_field_ids: selectedDisplayFields.value,
      is_array: isArray.value
    })

    if (!jobId) {
      submitting.value = false
      loadingInstance.close()
      return
    }

    const finalStatus = await pollRelationJobStatus(jobId, (status) => {
      if (status.status === 'processing') {
        loadingInstance.setText(
          `Processing... ${status.matched_rows ?? 0}/${status.total_source_rows ?? '?'} rows matched`
        )
      }
    })

    loadingInstance.close()
    submitting.value = false

    if (!finalStatus) {
      ElMessage.warning('Timed out waiting for relation creation.')
      return
    }

    if (finalStatus.status === 'completed') {
      ElMessage.success(
        `Relation created! ${finalStatus.total_links_created ?? 0} links created.`
      )
      emit('success')
      close()
    } else {
      ElMessage.error(finalStatus.error_message || 'Relation creation failed.')
    }
  } catch (err: any) {
    loadingInstance.close()
    submitting.value = false
    ElMessage.error(err?.message || 'An unexpected error occurred.')
  }
}

function close() {
  visible.value = false
  selectedSuggestion.value = null
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.dialog-empty {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-xs);
  padding: var(--app-space-m);
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius-s);
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.suggestions-title {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color-primary);
  margin-bottom: var(--app-space-xs);
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-xs);
  padding: 8px var(--app-space-s);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--app-font-size-s);
}

.suggestion-target-table {
  font-weight: 500;
  color: var(--el-color-primary);
}

.suggestion-arrow {
  color: var(--app-grey-500);
}

.suggestion-target-field {
  color: var(--app-text-color-secondary);
}

.suggestion-meta {
  flex-shrink: 0;
}

.confirm-dialog-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.relation-summary {
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius-s);
  padding: var(--app-space-s);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
}

.summary-label {
  color: var(--app-grey-500);
  width: 72px;
  flex-shrink: 0;
}

.summary-value {
  color: var(--app-text-color-primary);
  font-weight: 500;
}

.relation-form {
  :deep(.el-form-item__label) {
    font-size: var(--app-font-size-s);
    font-weight: 500;
    padding-bottom: 4px;
  }
}
</style>
