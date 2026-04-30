<script setup lang="ts">
import type { ImportReport, ImportJob, ImportRowError } from '../../../composables/import/useImportQueue'
import { formatErrorForDisplay, generateErrorSummary, type ParsedImportError } from '../../../utils/importErrorParser'

const dialogVisible = ref(false)
const report = ref<ImportReport | null>(null)
const activeTab = ref('summary')
const selectedJob = ref<ImportJob | null>(null)

function open(importReport: ImportReport) {
  report.value = importReport
  dialogVisible.value = true
  activeTab.value = 'summary'
  selectedJob.value = null
}

function close() {
  dialogVisible.value = false
  report.value = null
}

function selectJob(job: ImportJob) {
  selectedJob.value = job
  activeTab.value = 'errors'
}

function formatDuration(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()

  if (diffMs < 1000) return `${diffMs}ms`
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`
  return `${(diffMs / 60000).toFixed(1)}m`
}

function getErrorTagType(errorType: string): string {
  const typeMap: Record<string, string> = {
    null: 'warning',
    unique: 'danger',
    data_type: 'warning',
    length: 'info',
    format: 'info',
    validation: 'warning',
    constraint: 'danger',
    foreign_key: 'danger',
    unknown: 'info'
  }
  return typeMap[errorType] || 'info'
}

function formatErrorType(errorType: string): string {
  const typeMap: Record<string, string> = {
    null: 'Missing',
    unique: 'Duplicate',
    data_type: 'Type',
    length: 'Length',
    format: 'Format',
    validation: 'Validation',
    constraint: 'Constraint',
    foreign_key: 'Reference',
    unknown: 'Unknown'
  }
  return typeMap[errorType] || errorType
}

function downloadErrorReport() {
  if (!report.value) return

  const errorData: any[] = []

  for (const job of report.value.jobs) {
    for (const error of job.progress.errors) {
      const rowData: any = {
        Table: job.tableDisplayName,
        'Row Number': error.rowIndex,
        'Error Type': error.parsedError?.errorType || 'unknown',
        'User-Friendly Error': error.error,
        'Technical Error': error.parsedError?.technicalError || error.error,
        'Affected Column': error.parsedError?.columnName || '',
        'Suggested Fix': error.parsedError?.suggestedFix || ''
      }

      // Add row data
      Object.entries(error.rowData).forEach(([key, value]) => {
        rowData[key] = value
      })

      errorData.push(rowData)
    }
  }

  if (errorData.length === 0) return

  // Create CSV
  const headers = Object.keys(errorData[0])
  const csv = [
    headers.join(','),
    ...errorData.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          // Escape quotes and wrap in quotes if contains comma
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return val
        })
        .join(',')
    )
  ].join('\n')

  // Download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Generate error summary for display
const errorSummary = computed(() => {
  if (!report.value) return null

  const allErrors: ParsedImportError[] = []
  for (const job of report.value.jobs) {
    for (const error of job.progress.errors) {
      if (error.parsedError) {
        allErrors.push(error.parsedError)
      }
    }
  }

  return generateErrorSummary(allErrors)
})

// Format error for display with parsed details
function formatErrorDisplay(error: ImportRowError): string {
  if (error.parsedError) {
    return formatErrorForDisplay(error.parsedError, error.rowIndex)
  }
  return `Row ${error.rowIndex}: ${error.error}`
}

defineExpose({ open, close })
</script>

<template>
  <el-dialog v-model="dialogVisible" title="Import Report" width="big" :close-on-click-modal="true" @close="close">
    <div v-if="report" class="import-report-dialog">
      <!-- Summary Stats -->
      <div class="report-summary">
        <div class="stat-card">
          <div class="stat-value">{{ report.totalTables }}</div>
          <div class="stat-label">Tables Created</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ report.totalRowsImported }}</div>
          <div class="stat-label">Rows Imported</div>
        </div>
        <div class="stat-card" :class="{ error: report.totalErrors > 0 }">
          <div class="stat-value">{{ report.totalErrors }}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div v-if="report.skippedSheets && report.skippedSheets.length > 0" class="stat-card warning">
          <div class="stat-value">{{ report.skippedSheets.length }}</div>
          <div class="stat-label">Skipped</div>
        </div>
        <!-- <div class="stat-card">
          <div class="stat-value">{{ formatDuration(report.startedAt, report.completedAt) }}</div>
          <div class="stat-label">Duration</div>
        </div> -->
      </div>

      <!-- Error Summary Banner -->
      <div v-if="report.totalErrors > 0 && errorSummary" class="error-summary-banner">
        <div class="error-summary-content">
          <Icon name="material-symbols:info" class="summary-icon" />
          <div class="summary-text">
            <div class="summary-message">{{ errorSummary.summaryMessage }}</div>
            <div v-if="errorSummary.columnsWithErrors.length > 0" class="summary-columns">
              <span class="columns-label">Columns with issues:</span>
              <div class="columns-list">
                <el-tag v-for="column in errorSummary.columnsWithErrors" :key="column" size="small" type="info" class="column-tag">
                  {{ column }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="report-tabs">
        <!-- Summary Tab -->
        <el-tab-pane label="Tables" name="summary">
          <div class="tables-list">
            <div
              v-for="job in report.jobs"
              :key="job.id"
              class="table-row"
              :class="{ 'has-errors': job.progress.errors.length > 0 }"
              @click="job.progress.errors.length > 0 && selectJob(job)"
            >
              <div class="table-info">
                <Icon name="material-symbols:table-outline" class="table-icon" />
                <div class="table-details">
                  <span class="table-name">{{ job.tableDisplayName }}</span>
                  <span class="table-stats"> {{ job.progress.imported }} / {{ job.progress.total }} rows </span>
                </div>
              </div>

              <div class="table-status">
                <template v-if="job.progress.errors.length > 0">
                  <el-tag type="warning" size="small"> {{ job.progress.errors.length }} error(s) </el-tag>
                  <Icon name="material-symbols:chevron-right" class="chevron" />
                </template>
                <template v-else>
                  <el-tag type="success" size="small">
                    <Icon name="material-symbols:check" />
                    Complete
                  </el-tag>
                </template>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Errors Tab -->
        <el-tab-pane label="Errors" name="errors" :disabled="report.totalErrors === 0">
          <div v-if="report.totalErrors === 0" class="no-errors">
            <Icon name="material-symbols:check-circle" class="success-icon" />
            <span>No errors occurred during import</span>
          </div>

          <template v-else>
            <!-- Job selector if multiple jobs have errors -->
            <div v-if="report.jobs.filter((j) => j.progress.errors.length > 0).length > 1" class="job-selector">
              <label>Select table:</label>
              <el-select v-model="selectedJob" value-key="id" placeholder="Select a table">
                <el-option
                  v-for="job in report.jobs.filter((j) => j.progress.errors.length > 0)"
                  :key="job.id"
                  :label="`${job.tableDisplayName} (${job.progress.errors.length} errors)`"
                  :value="job"
                />
              </el-select>
            </div>

            <!-- Auto-select first job with errors -->
            <template v-if="!selectedJob && report.jobs.some((j) => j.progress.errors.length > 0)">
              {{ ((selectedJob = report.jobs.find((j) => j.progress.errors.length > 0) || null), '') }}
            </template>

            <!-- Error list -->
            <div v-if="selectedJob" class="errors-list">
              <div class="errors-header">
                <span>Errors in "{{ selectedJob.tableDisplayName }}"</span>
                <el-button size="small" @click="downloadErrorReport">
                  <Icon name="material-symbols:download" />
                  Download CSV
                </el-button>
              </div>

              <el-table :data="selectedJob.progress.errors" border max-height="300" class="errors-table">
                <el-table-column prop="rowIndex" label="Row" width="70" />
                <el-table-column label="Error Type" width="100">
                  <template #default="{ row }">
                    <template v-if="row.parsedError">
                      <el-tag :type="getErrorTagType(row.parsedError.errorType)" size="small" class="error-type-tag">
                        {{ formatErrorType(row.parsedError.errorType) }}
                      </el-tag>
                    </template>
                    <template v-else>
                      <span class="error-type-unknown">Unknown</span>
                    </template>
                  </template>
                </el-table-column>
                <el-table-column label="Column" width="120">
                  <template #default="{ row }">
                    <template v-if="row.parsedError?.columnName">
                      <span class="error-column">{{ row.parsedError.columnName }}</span>
                    </template>
                    <template v-else>
                      <span class="error-column-empty">—</span>
                    </template>
                  </template>
                </el-table-column>
                <el-table-column label="Error Details" min-width="250">
                  <template #default="{ row }">
                    <div class="error-cell">
                      <div class="error-message">{{ row.error }}</div>
                      <template v-if="row.parsedError?.suggestedFix">
                        <div class="error-suggestion">
                          <Icon name="material-symbols:lightbulb" class="suggestion-icon" />
                          <span class="suggestion-text">{{ row.parsedError.suggestedFix }}</span>
                        </div>
                      </template>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Data" min-width="200">
                  <template #default="{ row }">
                    <el-tooltip placement="top">
                      <template #content>
                        <pre class="row-data-tooltip">{{ JSON.stringify(row.rowData, null, 2) }}</pre>
                      </template>
                      <span class="row-data-preview"> {{ Object.values(row.rowData).slice(0, 3).join(', ') }}... </span>
                    </el-tooltip>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-tab-pane>

        <!-- Skipped Sheets Tab -->
        <el-tab-pane v-if="report.skippedSheets && report.skippedSheets.length > 0" label="Skipped" name="skipped">
          <div class="skipped-sheets-list">
            <div v-for="skipped in report.skippedSheets" :key="skipped.sheetIndex" class="skipped-sheet-row">
              <div class="skipped-sheet-info">
                <Icon name="material-symbols:hide-source" class="skipped-icon" />
                <div class="skipped-sheet-details">
                  <span class="sheet-name">{{ skipped.sheetName }}</span>
                  <span class="skip-reason">{{ skipped.details }}</span>
                </div>
              </div>
              <div class="skip-badge">
                <el-tag v-if="skipped.reason === 'hidden'" type="info" size="small">Hidden</el-tag>
                <el-tag v-else-if="skipped.reason === 'no_headers'" type="warning" size="small">No Headers</el-tag>
                <el-tag v-else-if="skipped.reason === 'empty'" type="info" size="small">Empty</el-tag>
                <el-tag v-else type="info" size="small">{{ skipped.reason }}</el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="report?.totalErrors" @click="downloadErrorReport">
          <Icon name="material-symbols:download" />
          Download Error Report
        </el-button>
        <el-button type="primary" @click="close"> Close </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.import-report-dialog {
  min-height: 300px;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.error-summary-banner {
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-8);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;

  .error-summary-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .summary-icon {
      font-size: 20px;
      color: var(--el-color-warning);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .summary-text {
      flex: 1;

      .summary-message {
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--el-text-color-primary);
      }

      .summary-columns {
        display: flex;
        align-items: center;
        gap: 8px;

        .columns-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          white-space: nowrap;
        }

        .columns-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;

          .column-tag {
            font-size: 11px;
          }
        }
      }
    }
  }
}

.stat-card {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &.success .stat-value {
    color: var(--el-color-success);
  }

  &.error .stat-value {
    color: var(--el-color-danger);
  }
}

.report-tabs {
  :deep(.el-tabs__content) {
    padding: 0;
  }
}

.tables-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  transition: background 0.2s;

  &.has-errors {
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .table-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .table-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }

    .table-details {
      display: flex;
      flex-direction: column;

      .table-name {
        font-weight: 500;
      }

      .table-stats {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .table-status {
    display: flex;
    align-items: center;
    gap: 8px;

    .chevron {
      font-size: 18px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.no-errors {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--el-text-color-secondary);

  .success-icon {
    font-size: 48px;
    color: var(--el-color-success);
    margin-bottom: 12px;
  }
}

.job-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  label {
    font-weight: 500;
    white-space: nowrap;
  }

  .el-select {
    flex: 1;
  }
}

.errors-list {
  .errors-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-weight: 500;
  }

  .errors-table {
    border-radius: 6px;
    overflow: hidden;

    .error-cell {
      .error-message {
        font-size: 13px;
        line-height: 1.4;
        margin-bottom: 4px;
      }

      .error-suggestion {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 12px;
        color: var(--el-color-info);
        background: var(--el-color-info-light-9);
        padding: 6px 8px;
        border-radius: 4px;
        margin-top: 4px;

        .suggestion-icon {
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .suggestion-text {
          line-height: 1.3;
        }
      }
    }

    .error-type-tag {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .error-type-unknown {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      font-style: italic;
    }

    .error-column {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-color-primary);
    }

    .error-column-empty {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      font-style: italic;
    }
  }

  .row-data-preview {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    cursor: help;
  }
}

.row-data-tooltip {
  max-width: 400px;
  max-height: 200px;
  overflow: auto;
  font-size: 11px;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// Skipped sheets styles
.skipped-sheets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skipped-sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  .skipped-sheet-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .skipped-icon {
      font-size: 24px;
      color: var(--el-text-color-placeholder);
    }

    .skipped-sheet-details {
      display: flex;
      flex-direction: column;

      .sheet-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .skip-reason {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.stat-card {
  &.warning .stat-value {
    color: var(--el-color-warning);
  }
}
</style>
