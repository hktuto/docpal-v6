<template>
  <el-dialog
    v-model="visible"
    title="Create Relation"
    width="420px"
    :close-on-click-modal="false"
    @close="close"
  >
    <div v-if="loading" class="dialog-loading">
      <Icon name="svg-spinners:180-ring" size="24" />
      <span>Analyzing possible relations...</span>
    </div>

    <div v-else-if="suggestions.length === 0" class="dialog-empty">
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
import { ref } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useSingleDatabaseContext } from '@packages/dynamic-db/composables/useSignleDatabase'
import {
  fetchTableSnapshot,
  captureTableNameMap,
  guessRelations,
  type TableSnapshot
} from '@packages/dynamic-db/composables/import/relationGuesser'
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
const loading = ref(false)
const suggestions = ref<any[]>([])
const selectedSuggestion = ref<any>(null)
const submitting = ref(false)

const { database, databaseMenuRouteParams } = useSingleDatabaseContext()

async function open() {
  visible.value = true
  loading.value = true
  selectedSuggestion.value = null
  suggestions.value = []

  try {
    await loadSuggestions()
  } catch (e) {
    console.error('Failed to load relation suggestions', e)
    ElMessage.error('Failed to analyze relations')
  } finally {
    loading.value = false
  }
}

async function loadSuggestions() {
  const databaseId = database.value?.id
  const sourceTableId = databaseMenuRouteParams.value?.detailId
  if (!databaseId || !sourceTableId || !props.sourceColumn?.id) {
    return
  }

  const nameMap = await captureTableNameMap(databaseId)

  // Fetch source table snapshot
  const sourceSnapshot = await fetchTableSnapshot(sourceTableId, nameMap)
  if (!sourceSnapshot) return

  // Fetch other tables (bounded)
  const res: any = await newClientApi.getDynamicDbMenusTree({
    referenceEntityType: 'case',
    referenceEntityId: databaseId
  })
  const menus = res?.data ?? []
  const allTableIds = flattenMenuItems(menus)
    .filter((item: any) => item.item_type === 'master_table' && item.item_id && item.item_id !== sourceTableId)
    .map((item: any) => item.item_id)
    .slice(0, 20)

  const targetSnapshots = (
    await Promise.all(allTableIds.map((id: string) => fetchTableSnapshot(id, nameMap)))
  ).filter((t): t is TableSnapshot => t !== null)

  if (targetSnapshots.length === 0) return

  // Run scoring for just the source table against all targets
  const guesses = guessRelations([sourceSnapshot], targetSnapshots)

  // Filter to only suggestions for this specific source column
  const columnGuesses = guesses.filter(
    (g) => g.sourceFieldName === props.sourceColumn.field_name || g.sourceFieldName === props.sourceColumn.field
  )

  // Get top 5 unique target suggestions
  const seen = new Set<string>()
  suggestions.value = columnGuesses.filter((g) => {
    const key = `${g.targetTableId}-${g.targetFieldId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 5)
}

function selectSuggestion(suggestion: any) {
  selectedSuggestion.value = suggestion
}

async function confirmCreate() {
  if (!selectedSuggestion.value || !props.sourceColumn?.id) return

  const sourceTableId = databaseMenuRouteParams.value?.detailId
  if (!sourceTableId) return

  submitting.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: 'Creating relation...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
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
  suggestions.value = []
}

function flattenMenuItems(items: any[]): any[] {
  const result: any[] = []
  for (const item of items) {
    result.push(item)
    if (item.children && item.children.length > 0) {
      result.push(...flattenMenuItems(item.children))
    }
  }
  return result
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.dialog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-m) 0;
  color: var(--app-grey-500);
  font-size: var(--app-font-size-s);
}

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
