<script setup lang="ts">
import type { ImportReport, ImportJob, ImportRowError } from '../../../composables/useImportQueue'

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

function downloadErrorReport() {
  if (!report.value) return
  
  const errorData: any[] = []
  
  for (const job of report.value.jobs) {
    for (const error of job.progress.errors) {
      errorData.push({
        Table: job.tableDisplayName,
        'Row Number': error.rowIndex,
        Error: error.error,
        ...error.rowData
      })
    }
  }
  
  if (errorData.length === 0) return
  
  // Create CSV
  const headers = Object.keys(errorData[0])
  const csv = [
    headers.join(','),
    ...errorData.map(row => 
      headers.map(h => {
        const val = row[h]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(',')
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

defineExpose({ open, close })
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Import Report"
    width="big"
    :close-on-click-modal="true"
    @close="close"
  >
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
        <div class="stat-card">
          <div class="stat-value">{{ formatDuration(report.startedAt, report.completedAt) }}</div>
          <div class="stat-label">Duration</div>
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
                  <span class="table-stats">
                    {{ job.progress.imported }} / {{ job.progress.total }} rows
                  </span>
                </div>
              </div>
              
              <div class="table-status">
                <template v-if="job.progress.errors.length > 0">
                  <el-tag type="warning" size="small">
                    {{ job.progress.errors.length }} error(s)
                  </el-tag>
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
            <div v-if="report.jobs.filter(j => j.progress.errors.length > 0).length > 1" class="job-selector">
              <label>Select table:</label>
              <el-select v-model="selectedJob" value-key="id" placeholder="Select a table">
                <el-option
                  v-for="job in report.jobs.filter(j => j.progress.errors.length > 0)"
                  :key="job.id"
                  :label="`${job.tableDisplayName} (${job.progress.errors.length} errors)`"
                  :value="job"
                />
              </el-select>
            </div>

            <!-- Auto-select first job with errors -->
            <template v-if="!selectedJob && report.jobs.some(j => j.progress.errors.length > 0)">
              {{ (selectedJob = report.jobs.find(j => j.progress.errors.length > 0) || null, '') }}
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

              <el-table
                :data="selectedJob.progress.errors"
                border
                size="small"
                max-height="300"
                class="errors-table"
              >
                <el-table-column prop="rowIndex" label="Row" width="70" />
                <el-table-column prop="error" label="Error" min-width="200" show-overflow-tooltip />
                <el-table-column label="Data" min-width="250">
                  <template #default="{ row }">
                    <el-tooltip placement="top">
                      <template #content>
                        <pre class="row-data-tooltip">{{ JSON.stringify(row.rowData, null, 2) }}</pre>
                      </template>
                      <span class="row-data-preview">
                        {{ Object.values(row.rowData).slice(0, 3).join(', ') }}...
                      </span>
                    </el-tooltip>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="report?.totalErrors" @click="downloadErrorReport">
          <Icon name="material-symbols:download" />
          Download Error Report
        </el-button>
        <el-button type="primary" @click="close">
          Close
        </el-button>
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
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
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
</style>
