<script setup lang="ts">
import { importQueueState, useImportQueue, type ImportReport, type ImportJob } from '../../../composables/useImportQueue'
import type { AnalysisResult } from '../../../composables/useRelationAnalyzer'
import { ElMessage } from 'element-plus'
const emit = defineEmits<{
  (e: 'view-report', report: ImportReport): void
}>()

const { onImportEvent } = useImportQueue()
const { analyzeWorkspace } = useRelationAnalyzer()
const { workspace } = useSingleWorkspaceContext()

// Relation analysis state
const showRelationDialog = ref(false)
const analysisResult = ref<AnalysisResult | null>(null)
const isAnalyzing = ref(false)

const isVisible = ref(false)
const isMinimized = ref(false)
const currentJob = computed(() => importQueueState.currentJob.value)
const isProcessing = computed(() => importQueueState.isProcessing.value)
const queue = computed(() => importQueueState.importQueue.value)
const latestReport = ref<ImportReport | null>(null)
const showCompletedBanner = ref(false)

// Progress for current job
const progressPercent = computed(() => {
  if (!currentJob.value) return 0
  const { imported, total } = currentJob.value.progress
  return total > 0 ? Math.round((imported / total) * 100) : 0
})

// Subscribe to events
onMounted(() => {
  onImportEvent('import-started', () => {
    isVisible.value = true
    isMinimized.value = false
    showCompletedBanner.value = false
  })

  onImportEvent('job-progress', (job: ImportJob) => {
    // Force reactivity update
  })

  onImportEvent('import-completed', async (report: ImportReport) => {
    latestReport.value = report
    showCompletedBanner.value = true

    // Run relationship analysis if import was successful and we have a workspace
    if (report.totalTables > 0 && workspace.value?.id) {
      // TODO: need to redesign the relationship analysis
      // await runRelationshipAnalysis()
    }

    // Auto-hide after 10 seconds if no errors (and no relation dialog)
    if (report.totalErrors === 0 && !showRelationDialog.value) {
      setTimeout(() => {
        if (showCompletedBanner.value && !isProcessing.value && !showRelationDialog.value) {
          isVisible.value = false
        }
      }, 10000)
    }
  })
})

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

function handleViewReport() {
  if (latestReport.value) {
    emit('view-report', latestReport.value)
    showCompletedBanner.value = false
  }
}

function handleDismiss() {
  isVisible.value = false
  showCompletedBanner.value = false
}

/**
 * Run relationship analysis after import completes
 */
async function runRelationshipAnalysis() {
  if (!workspace.value?.id) return

  isAnalyzing.value = true

  try {
    const result = await analyzeWorkspace(workspace.value.id)
    console.log('result', result)
    // Only show dialog if we found potential relationships
    if (result.suggestions.length > 0) {
      analysisResult.value = result
      showRelationDialog.value = true
    }
  } catch (error) {
    console.error('Error analyzing relationships:', error)
  } finally {
    isAnalyzing.value = false
  }
}

function handleRelationConfirm() {
  showRelationDialog.value = false
  analysisResult.value = null
  ElMessage.success('Relation fields created successfully')
}

function handleRelationCancel() {
  showRelationDialog.value = false
  analysisResult.value = null
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="isVisible" class="import-progress-indicator" :class="{ minimized: isMinimized }">
        <!-- Minimized View -->
        <div v-if="isMinimized" class="minimized-view" @click="toggleMinimize">
          <div class="mini-icon">
            <el-icon v-if="isProcessing" class="is-loading">
              <Icon name="material-symbols:progress-activity" />
            </el-icon>
            <Icon v-else-if="latestReport?.totalErrors" name="material-symbols:warning" class="warning-icon" />
            <Icon v-else name="material-symbols:check-circle" class="success-icon" />
          </div>
          <span v-if="isProcessing" class="mini-text"> Importing... {{ progressPercent }}% </span>
          <span v-else class="mini-text"> Import complete </span>
        </div>

        <!-- Expanded View -->
        <template v-else>
          <!-- Header -->
          <div class="indicator-header">
            <div class="header-title">
              <el-icon v-if="isProcessing" class="is-loading">
                <Icon name="material-symbols:progress-activity" />
              </el-icon>
              <Icon v-else-if="latestReport?.totalErrors" name="material-symbols:warning" class="warning-icon" />
              <Icon v-else name="material-symbols:check-circle" class="success-icon" />
              <span>{{ isProcessing ? 'Importing Data' : 'Import Complete' }}</span>
            </div>
            <div class="header-actions">
              <el-button text size="small" @click="toggleMinimize">
                <Icon name="material-symbols:minimize" />
              </el-button>
              <el-button v-if="!isProcessing" text size="small" @click="handleDismiss">
                <Icon name="material-symbols:close" />
              </el-button>
            </div>
          </div>

          <!-- Content - Importing -->
          <div v-if="isProcessing && currentJob" class="indicator-content">
            <div class="current-job">
              <div class="job-name">
                <Icon name="material-symbols:table-outline" />
                <span>{{ currentJob.tableDisplayName }}</span>
              </div>
              <div class="job-progress">
                <el-progress :percentage="progressPercent" :stroke-width="8" :show-text="false" />
                <span class="progress-text"> {{ currentJob.progress.imported }} / {{ currentJob.progress.total }} rows </span>
              </div>
              <div v-if="currentJob.progress.errors.length > 0" class="job-errors">
                <Icon name="material-symbols:error-outline" class="error-icon" />
                <span>{{ currentJob.progress.errors.length }} error(s)</span>
              </div>
            </div>

            <div v-if="queue.length > 1" class="queue-info">
              <span>{{ queue.length - 1 }} more table(s) in queue</span>
            </div>
          </div>

          <!-- Content - Completed -->
          <div v-else-if="showCompletedBanner && latestReport" class="indicator-content completed">
            <div class="completion-summary">
              <div class="summary-item">
                <Icon name="material-symbols:table-outline" />
                <span
                  ><strong>{{ latestReport.totalTables }}</strong> table(s)</span
                >
              </div>
              <div class="summary-item">
                <Icon name="material-symbols:check" />
                <span
                  ><strong>{{ latestReport.totalRowsImported }}</strong> rows imported</span
                >
              </div>
              <div v-if="latestReport.totalErrors > 0" class="summary-item error">
                <Icon name="material-symbols:error-outline" />
                <span
                  ><strong>{{ latestReport.totalErrors }}</strong> error(s)</span
                >
              </div>
            </div>

            <div class="completion-actions">
              <el-button size="small" @click="handleViewReport"> View Report </el-button>
              <el-button size="small" type="primary" @click="handleDismiss"> Done </el-button>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>

  <!-- Relationship Analysis Dialog -->
  <WorkspacesTableRelationSuggestDialog
    v-model="showRelationDialog"
    :analysis-result="analysisResult"
    @confirm="handleRelationConfirm"
    @cancel="handleRelationCancel"
  />
</template>

<style lang="scss" scoped>
.import-progress-indicator {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 2000;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 400px;
  overflow: hidden;

  &.minimized {
    min-width: auto;
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }
}

.minimized-view {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;

  .mini-icon {
    font-size: 20px;
  }

  .mini-text {
    font-size: 13px;
    font-weight: 500;
  }
}

.indicator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;

    .el-icon {
      font-size: 18px;
    }
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }
}

.indicator-content {
  padding: 16px;

  &.completed {
    .completion-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .iconify {
        font-size: 16px;
        color: var(--el-color-success);
      }

      &.error .iconify {
        color: var(--el-color-danger);
      }
    }

    .completion-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }
}

.current-job {
  .job-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    margin-bottom: 12px;

    .iconify {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .job-progress {
    margin-bottom: 8px;

    .progress-text {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      text-align: right;
    }
  }

  .job-errors {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-color-warning);

    .error-icon {
      font-size: 14px;
    }
  }
}

.queue-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.success-icon {
  color: var(--el-color-success);
}

.warning-icon {
  color: var(--el-color-warning);
}

.error-icon {
  color: var(--el-color-danger);
}

// Transitions
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
