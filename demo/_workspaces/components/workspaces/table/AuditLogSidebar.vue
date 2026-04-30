<script setup lang="ts">
import type { AuditLogRecord, AuditOperation } from '../../../utils/db/schema/newTableSchema'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  visible: boolean
  tableName: string
  caseTableId: string
  entityId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'rollback', auditLog: AuditLogRecord): void
}>()

const { getAuditLogs, rollbackAuditLog, getAuditStats } = useAuditLog()

const loading = ref(false)
const auditLogs = ref<AuditLogRecord[]>([])
const stats = ref<{
  totalChanges: number
  inserts: number
  updates: number
  deletes: number
  rolledBack: number
}>({
  totalChanges: 0,
  inserts: 0,
  updates: 0,
  deletes: 0,
  rolledBack: 0
})

// Filters
const filterOperation = ref<AuditOperation | ''>('')
const filterStatus = ref<'active' | 'rolled_back' | ''>('')

// Pagination
const page = ref(1)
const pageSize = ref(50)
const hasMore = ref(false)

const drawerVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

async function loadAuditLogs() {
  loading.value = true
  try {
    const options: any = {
      tableName: props.tableName,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value
    }

    if (filterOperation.value) {
      options.operation = filterOperation.value
    }

    if (filterStatus.value) {
      options.status = filterStatus.value
    }

    if (props.caseTableId) {
      options.caseTableId = props.caseTableId
    }

    const result = await getAuditLogs(options)
    auditLogs.value = result
    hasMore.value = result.length === pageSize.value

    // Load stats
    stats.value = await getAuditStats(props.tableName, props.entityId)
  } catch (error) {
    console.error('Failed to load audit logs:', error)
    ElMessage.error('Failed to load audit history')
  } finally {
    loading.value = false
  }
}

async function handleRollback(log: AuditLogRecord) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to rollback this ${log.operation.toLowerCase()} operation? This will restore the previous state.`,
      'Confirm Rollback',
      {
        confirmButtonText: 'Rollback',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    loading.value = true
    const result = await rollbackAuditLog(log.id)

    if (result) {
      ElMessage.success('Successfully rolled back the change')
      emit('rollback', log)
      await loadAuditLogs()
    } else {
      ElMessage.warning('Rollback was not performed')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Rollback failed:', error)
      ElMessage.error('Failed to rollback change')
    }
  } finally {
    loading.value = false
  }
}

function getOperationIcon(operation: AuditOperation): string {
  switch (operation) {
    case 'INSERT':
    case 'BULK_INSERT':
      return 'lucide:plus-circle'
    case 'UPDATE':
    case 'BULK_UPDATE':
      return 'lucide:edit'
    case 'DELETE':
    case 'BULK_DELETE':
      return 'lucide:trash-2'
    default:
      return 'lucide:activity'
  }
}

function getOperationColor(operation: AuditOperation): string {
  switch (operation) {
    case 'INSERT':
    case 'BULK_INSERT':
      return 'var(--el-color-success)'
    case 'UPDATE':
    case 'BULK_UPDATE':
      return 'var(--el-color-primary)'
    case 'DELETE':
    case 'BULK_DELETE':
      return 'var(--el-color-danger)'
    default:
      return 'var(--el-color-info)'
  }
}

function getOperationTag(operation: AuditOperation): 'success' | 'primary' | 'danger' | 'info' {
  switch (operation) {
    case 'INSERT':
    case 'BULK_INSERT':
      return 'success'
    case 'UPDATE':
    case 'BULK_UPDATE':
      return 'primary'
    case 'DELETE':
    case 'BULK_DELETE':
      return 'danger'
    default:
      return 'info'
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString()
}

function formatChangedFields(log: AuditLogRecord): string {
  if (!log.changedFields || log.changedFields.length === 0) return ''
  if (log.changedFields.length <= 3) {
    return log.changedFields.join(', ')
  }
  return `${log.changedFields.slice(0, 3).join(', ')} +${log.changedFields.length - 3} more`
}

function handleFilterChange() {
  page.value = 1
  loadAuditLogs()
}

function loadMore() {
  page.value++
  loadAuditLogs()
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    page.value = 1
    loadAuditLogs()
  }
})
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="Audit History"
    direction="rtl"
    size="480px"
    :destroy-on-close="false"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-title">
          <Icon name="lucide:history" size="20" />
          <span>Audit History</span>
        </div>
        <div class="header-stats">
          <el-tag size="small" type="success">{{ stats.inserts }} inserts</el-tag>
          <el-tag size="small" type="primary">{{ stats.updates }} updates</el-tag>
          <el-tag size="small" type="danger">{{ stats.deletes }} deletes</el-tag>
        </div>
      </div>
    </template>

    <div class="audit-content">
      <!-- Filters -->
      <div class="filter-bar">
        <el-select
          v-model="filterOperation"
          placeholder="All Operations"
          clearable
          size="small"
          @change="handleFilterChange"
        >
          <el-option label="Insert" value="INSERT" />
          <el-option label="Update" value="UPDATE" />
          <el-option label="Delete" value="DELETE" />
          <el-option label="Bulk Insert" value="BULK_INSERT" />
          <el-option label="Bulk Update" value="BULK_UPDATE" />
          <el-option label="Bulk Delete" value="BULK_DELETE" />
        </el-select>

        <el-select
          v-model="filterStatus"
          placeholder="All Status"
          clearable
          size="small"
          @change="handleFilterChange"
        >
          <el-option label="Active" value="active" />
          <el-option label="Rolled Back" value="rolled_back" />
        </el-select>

        <el-button size="small" :loading="loading" @click="loadAuditLogs">
          <Icon name="lucide:refresh-cw" size="14" />
        </el-button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && auditLogs.length === 0" class="loading-state">
        <el-icon class="is-loading" :size="32">
          <Icon name="lucide:loader-2" />
        </el-icon>
        <span>Loading audit history...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="auditLogs.length === 0" class="empty-state">
        <Icon name="lucide:file-clock" size="48" class="empty-icon" />
        <p>No audit logs found</p>
        <span class="empty-hint">Changes to this table will appear here</span>
      </div>

      <!-- Audit Log List -->
      <div v-else class="audit-list">
        <div
          v-for="log in auditLogs"
          :key="log.id"
          class="audit-item"
          :class="{ 'is-rolled-back': log.status === 'rolled_back' }"
        >
          <div class="audit-icon" :style="{ color: getOperationColor(log.operation) }">
            <Icon :name="getOperationIcon(log.operation)" size="18" />
          </div>

          <div class="audit-content-inner">
            <div class="audit-header">
              <el-tag :type="getOperationTag(log.operation)" size="small">
                {{ log.operation.replace('_', ' ') }}
              </el-tag>
              <el-tag v-if="log.status === 'rolled_back'" type="warning" size="small">
                Rolled Back
              </el-tag>
              <span class="audit-time">{{ formatDate(log.createdAt) }}</span>
            </div>

            <div class="audit-description">
              {{ log.description || `${log.operation} on ${log.tableName}` }}
            </div>

            <div v-if="log.changedFields && log.changedFields.length > 0" class="audit-fields">
              <Icon name="lucide:edit-3" size="12" />
              <span>{{ formatChangedFields(log) }}</span>
            </div>

            <div v-if="log.affectedCount && log.affectedCount > 1" class="audit-count">
              <Icon name="lucide:layers" size="12" />
              <span>{{ log.affectedCount }} records affected</span>
            </div>

            <div class="audit-actions">
              <el-button
                v-if="log.status === 'active' && ['INSERT', 'UPDATE', 'DELETE'].includes(log.operation)"
                type="warning"
                size="small"
                text
                @click="handleRollback(log)"
              >
                <Icon name="lucide:undo-2" size="14" />
                Rollback
              </el-button>

              <el-popover
                placement="left"
                :width="400"
                trigger="click"
              >
                <template #reference>
                  <el-button type="info" size="small" text>
                    <Icon name="lucide:info" size="14" />
                    Details
                  </el-button>
                </template>
                <div class="detail-popover">
                  <h4>Change Details</h4>
                  <div v-if="log.oldValues" class="detail-section">
                    <strong>Previous Values:</strong>
                    <pre>{{ JSON.stringify(log.oldValues, null, 2) }}</pre>
                  </div>
                  <div v-if="log.newValues" class="detail-section">
                    <strong>New Values:</strong>
                    <pre>{{ JSON.stringify(log.newValues, null, 2) }}</pre>
                  </div>
                  <div v-if="log.recordId" class="detail-section">
                    <strong>Record ID:</strong>
                    <code>{{ log.recordId }}</code>
                  </div>
                </div>
              </el-popover>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="load-more">
          <el-button :loading="loading" @click="loadMore">
            Load More
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.header-stats {
  display: flex;
  gap: 8px;
}

.audit-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-bar {
  display: flex;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;

  .el-select {
    flex: 1;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--el-text-color-secondary);

  .empty-icon {
    opacity: 0.5;
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 16px;
  }

  .empty-hint {
    font-size: 13px;
    margin-top: 4px;
  }
}

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.audit-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color);
  }

  &.is-rolled-back {
    opacity: 0.6;
    background: var(--el-fill-color-light);
  }
}

.audit-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--el-fill-color);
  border-radius: 8px;
  flex-shrink: 0;
}

.audit-content-inner {
  flex: 1;
  min-width: 0;
}

.audit-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.audit-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.audit-description {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.audit-fields,
.audit-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.audit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.detail-popover {
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
  }

  .detail-section {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }

    pre {
      margin: 0;
      padding: 8px;
      background: var(--el-fill-color-lighter);
      border-radius: 4px;
      font-size: 11px;
      max-height: 150px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    code {
      padding: 2px 6px;
      background: var(--el-fill-color-lighter);
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
</style>
