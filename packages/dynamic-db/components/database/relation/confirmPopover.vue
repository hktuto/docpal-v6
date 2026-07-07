<script lang="ts" setup>
import { ElMessage, ElLoading } from 'element-plus'
import type { TableFieldDTO } from 'api/src/generate/newClient'
import { newClientApi } from 'api'
import { useRelationAnalysisInject, type RelationCandidate } from '../../../composables/useRelationAnalysis'

const { dismissGuess, submitEstablishJob, pollEstablishJob } = useRelationAnalysisInject()

const visible = ref(false)
const activeGuess = ref<RelationCandidate | null>(null)
const targetFields = ref<TableFieldDTO[]>([])
const loadingFields = ref(false)

const relationLabel = ref('')
const selectedDisplayFields = ref<string[]>([])
const isArray = ref(true)

const submitting = ref(false)

const canSubmit = computed(() => {
  return (
    relationLabel.value.trim().length > 0 &&
    selectedDisplayFields.value.length > 0 &&
    !submitting.value
  )
})

async function loadTargetFields() {
  const guess = activeGuess.value
  if (!guess) {
    targetFields.value = []
    return
  }
  loadingFields.value = true
  try {
    const res: any = await newClientApi.getDynamicDbTableTableidFields(guess.targetTableId)
    const fields: TableFieldDTO[] = res?.data ?? []
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

async function open(guess: RelationCandidate) {
  activeGuess.value = guess
  isArray.value = true
  visible.value = true
  await loadTargetFields()
}

function handleClose() {
  visible.value = false
  activeGuess.value = null
}

function handleEstablished(guess: RelationCandidate) {
  dismissGuess(guess)
}

async function handleSubmit() {
  const guess = activeGuess.value
  if (!guess) return

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
    text: 'Establishing relation...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const jobId = await submitEstablishJob({
      source_table_id: guess.sourceTableId,
      target_table_id: guess.targetTableId,
      source_match_field_id: guess.sourceFieldId,
      target_match_field_id: guess.targetFieldId,
      relation_field_name: relationLabel.value.trim(),
      display_field_ids: selectedDisplayFields.value,
      is_array: isArray.value
    })

    if (!jobId) {
      submitting.value = false
      loadingInstance.close()
      return
    }

    guess.jobId = jobId
    guess.status = 'pending'
    guess.progress = 0

    const finalStatus = await pollEstablishJob(jobId, guess, (status) => {
      if (status.status === 'processing') {
        loadingInstance.setText(
          `Processing... ${status.matched_rows ?? 0}/${status.total_source_rows ?? '?'} rows matched`
        )
      }
    })

    loadingInstance.close()
    submitting.value = false

    if (!finalStatus) {
      ElMessage.warning('Timed out waiting for relation establishment.')
      return
    }

    if (finalStatus.status === 'completed') {
      ElMessage.success(
        `Relation created successfully! ${finalStatus.total_links_created ?? 0} links created.`
      )
      handleEstablished(guess)
      handleClose()
    } else {
      ElMessage.error(finalStatus.error_message || 'Relation establishment failed.')
    }
  } catch (err: any) {
    loadingInstance.close()
    submitting.value = false
    ElMessage.error(err?.message || 'An unexpected error occurred.')
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Confirm Relation"
    width="480px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="activeGuess" class="confirm-dialog-body">
      <div class="relation-summary">
        <div class="summary-row">
          <span class="summary-label">From</span>
          <span class="summary-value">{{ activeGuess.sourceTableName }} — {{ activeGuess.sourceFieldAlias }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">To</span>
          <span class="summary-value">{{ activeGuess.targetTableName }} — {{ activeGuess.targetFieldAlias }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Confidence</span>
          <el-tag size="small" :type="activeGuess.confidence > 0.7 ? 'success' : 'warning'">
            {{ Math.round(activeGuess.confidence * 100) }}%
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
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" :disabled="!canSubmit" :loading="submitting" @click="handleSubmit">
        Confirm
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
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
