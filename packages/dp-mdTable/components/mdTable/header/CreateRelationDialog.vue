<template>
  <el-dialog
    v-model="visible"
    title="Create Relation"
    width="420px"
    :close-on-click-modal="false"
    @close="close"
  >
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
        :class="{ selected: selectedSuggestion === suggestion }"
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

    <template v-if="selectedSuggestion" #footer>
      <el-button @click="selectedSuggestion = null">Back</el-button>
      <el-button type="primary" :loading="submitting" @click="confirmCreate">
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
  const fieldName = props.sourceColumn.field_name || props.sourceColumn.field
  const seen = new Set<string>()
  return analysis.value.guesses
    .filter((g) =>
      !g.dismissed &&
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

function open() {
  visible.value = true
  selectedSuggestion.value = null
}

function selectSuggestion(suggestion: any) {
  selectedSuggestion.value = suggestion
}

async function confirmCreate() {
  if (!selectedSuggestion.value || !props.sourceColumn?.id) return

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

    // Fetch target fields to auto-select display fields
    const fieldsRes: any = await newClientApi.getDynamicDbTableTableidFields(selectedSuggestion.value.targetTableId)
    const fields = fieldsRes?.data ?? []
    const defaultIds = new Set<string>()
    if (selectedSuggestion.value.targetFieldId) defaultIds.add(selectedSuggestion.value.targetFieldId)
    for (const f of fields) {
      if (defaultIds.size >= 3) break
      const name = (f.field_name || '').toLowerCase()
      if (name.includes('name') || name.includes('title') || name.includes('label')) {
        if (f.id) defaultIds.add(f.id)
      }
    }
    const displayFieldIds = Array.from(defaultIds).filter((id) =>
      fields.some((f: any) => f.id === id)
    )

    const jobId = await establishRelation({
      source_table_id: sourceTableId,
      target_table_id: selectedSuggestion.value.targetTableId,
      source_match_field_id: props.sourceColumn.id,
      target_match_field_id: selectedSuggestion.value.targetFieldId,
      relation_field_name: selectedSuggestion.value.targetTableName,
      display_field_ids: displayFieldIds.length > 0 ? displayFieldIds : [selectedSuggestion.value.targetFieldId],
      is_array: true
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

  &.selected {
    background: var(--el-color-primary-light-9);
    outline: 1px solid var(--el-color-primary-light-5);
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
</style>
