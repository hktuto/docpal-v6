<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { useRelationAnalysisInject, type RelationCandidate } from '../../../composables/useRelationAnalysis'

const { analysis, analysisList, dismissGuess, dismissAll, runAnalysis } = useRelationAnalysisInject()
const { database, databaseMenuRouteParams } = useSingleDatabaseContext()

const popoverRef = ref()
const confirmPopoverRef = ref()

const currentTableId = computed(() => databaseMenuRouteParams.value.tableId ?? databaseMenuRouteParams.value.item_id ?? '')

const groupedAnalysisList = computed(() => {
  const map = new Map<string, RelationCandidate[]>()
  for (const item of analysisList.value) {
    const key = item.sourceTableName
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(item)
  }

  const entries = Array.from(map.entries())
  const matchedIndex = entries.findIndex(([, items]) => items.some((item) => item.sourceTableId === currentTableId.value))
  if (matchedIndex > 0) {
    const [matchedEntry] = entries.splice(matchedIndex, 1)
    entries.unshift(matchedEntry)
  }

  return new Map(entries)
})

function open(target: HTMLElement) {
  popoverRef.value?.open(target)
}

function close() {
  popoverRef.value?.close()
}

function handleDismissGuess(candidate: RelationCandidate) {
  dismissGuess(candidate)
  if (analysisList.value.length === 0) {
    close()
  }
}

function handleConfirm(guess: RelationCandidate) {
  close()
  confirmPopoverRef.value?.open(guess)
}

async function handleReanalyze() {
  close()
  const dbId = database.value?.id
  if (!dbId) {
    ElMessage.warning('No database selected')
    return
  }
  await runAnalysis(dbId)
}

function handleDismissAll() {
  dismissAll()
  close()
}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiPopoverDialog
    ref="popoverRef"
    title="Potential Relations"
    :width="420"
    placement="bottom-end"
    :close-on-click-outside="true"
    :show-highlight="false"
  >
    <div class="analysis-popover-content">
      <div v-if="analysisList.length === 0" class="analysis-empty">
        No strong relations detected.
      </div>
      <div v-else class="analysis-groups">
        <div
          v-for="[tableName, items] in groupedAnalysisList"
          :key="tableName"
          class="analysis-group"
        >
          <div class="analysis-group-title">{{ tableName }} </div>
          <div class="analysis-guess-list">
            <div
              v-for="item in items"
              :key="`${item.sourceTableId}-${item.sourceFieldName}-${item.targetTableId}-${item.targetFieldName}`"
              class="analysis-guess-row"
            >
              <div class="analysis-guess-fields">
                <span class="guess-source-field">{{ item.sourceFieldAlias }}</span>
                <span class="guess-arrow">→</span>
                <span class="guess-target-table">「{{ item.targetTableName }}」</span>
                <span class="guess-target-field">{{ item.targetFieldAlias }}</span>
              </div>
              <div class="analysis-guess-actions">
                <el-tag size="small" :type="item.confidence > 0.7 ? 'success' : 'warning'">
                  {{ Math.round(item.confidence * 100) }}%
                </el-tag>
                <el-button
                  size="small"
                  text
                  type="danger"
                  :disabled="item.disabled"
                  @click="handleDismissGuess(item)"
                >
                  Ignore
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="item.disabled"
                  @click="handleConfirm(item)"
                >
                  Confirm
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="analysis-popover-footer">
        <el-button size="small" text @click="close()">Close</el-button>
        <el-button
          v-if="!analysis.jobId || analysis.status === 'completed' || analysis.status === 'failed'"
          size="small"
          type="primary"
          text
          :loading="(analysis.status === 'pending' && !!analysis.jobId) || analysis.status === 'processing'"
          @click="handleReanalyze"
        >
          Re-analyze
        </el-button>
        <el-button v-if="analysisList.length > 0" size="small" type="primary" text @click="handleDismissAll">
          Dismiss All
        </el-button>
      </div>
    </div>
  </UiPopoverDialog>

  <DatabaseRelationConfirmPopover ref="confirmPopoverRef" />
</template>

<style lang="scss" scoped>
.analysis-popover-content {
  .analysis-empty {
    font-size: var(--app-font-size-s);
    color: var(--app-grey-500);
    padding: var(--app-space-m) 0;
    text-align: center;
  }

  .analysis-groups {
    max-height: 420px;
    overflow-y: auto;
  }

  .analysis-group {
    margin-bottom: var(--app-space-s);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .analysis-group-title {
    font-size: var(--app-font-size-s);
    font-weight: 600;
    color: var(--app-text-color-primary);
    padding: var(--app-space-xs) var(--app-space-s);
    background: var(--el-fill-color-light);
    border-radius: var(--app-border-radius-s);
    margin-bottom: var(--app-space-xs);
  }

  .analysis-guess-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .analysis-guess-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--app-space-xs);
    padding: 6px var(--app-space-s);
    border-radius: var(--app-border-radius-s);
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .analysis-guess-fields {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    font-size: var(--app-font-size-s);
  }

  .guess-source-field {
    font-weight: 500;
    color: var(--app-text-color-primary);
  }

  .guess-arrow {
    color: var(--app-grey-500);
  }

  .guess-target-table {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  .guess-target-field {
    color: var(--app-text-color-secondary);
  }

  .analysis-guess-actions {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    flex-shrink: 0;
  }

  .analysis-popover-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--app-space-xs);
    margin-top: var(--app-space-s);
    padding-top: var(--app-space-s);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
