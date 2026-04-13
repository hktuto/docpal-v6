<template>
  <DashboardCard
    :title="$t('detailWidget.auditHistory')"
    :hide-setting="hideSetting"
    :setting-ref="settingRef"
    :setting="effectiveSetting"
    @delete="handleDelete"
  >
    <template #action_prefix>
      <el-button size="small" text :loading="loading" @click="loadAuditLogs">
        <Icon name="lucide:refresh-cw" size="14" />
      </el-button>
    </template>

    <!-- Widget Content -->
    <div class="widget-content">
      <!-- Loading State -->
      <div v-if="loading && auditLogs.length === 0" class="loading-state">
        <el-icon class="is-loading" :size="24">
          <Icon name="lucide:loader-2" />
        </el-icon>
        <span>Loading history...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="auditLogs.length === 0" class="empty-state">
        <Icon name="lucide:file-clock" size="32" />
        <span>{{ $t('detailWidget.noAuditHistory') }}</span>
      </div>

      <!-- Audit Log List -->
      <div v-else class="audit-list">
        <div
          v-for="log in displayLogs"
          :key="log.id"
          class="audit-item"
          :class="{ 'is-rolled-back': log.status === 'rolled_back' }"
        >
          <div class="audit-icon" :style="{ color: getOperationColor(log.operation) }">
            <Icon :name="getOperationIcon(log.operation)" size="16" />
          </div>

          <div class="audit-content">
            <div class="audit-header">
              <el-tag :type="getOperationTag(log.operation)" size="small">
                {{ formatOperation(log.operation) }}
              </el-tag>
              <el-tag v-if="log.status === 'rolled_back'" type="warning" size="small">
                Rolled Back
              </el-tag>
            </div>

            <div class="audit-time">
              {{ formatDate(log.createdAt) }}
            </div>

            <div v-if="log.changedFields && log.changedFields.length > 0" class="audit-fields">
              <span class="field-label">Changed:</span>
              <span class="field-list">{{ formatChangedFields(log) }}</span>
            </div>

            <!-- Show changes for updates -->
            <div v-if="effectiveSetting.showDetails && log.operation === 'UPDATE' && log.changedFields" class="audit-changes">
              <div
                v-for="field in log.changedFields.slice(0, effectiveSetting.maxFieldsToShow || 3)"
                :key="field"
                class="change-item"
              >
                <span class="field-name">{{ field }}:</span>
                <span class="old-value">{{ getOldValue(log, field) }}</span>
                <Icon name="lucide:arrow-right" size="12" />
                <span class="new-value">{{ getNewValue(log, field) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Show More -->
        <div v-if="auditLogs.length > effectiveSetting.maxItems" class="show-more">
          <el-button size="small" text @click="showAll = !showAll">
            {{ showAll ? 'Show Less' : `Show ${auditLogs.length - effectiveSetting.maxItems} More` }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Settings Dialog -->
    <RecordAuditHistorySetting
      ref="settingRef"
      :setting="effectiveSetting"
      @refresh="handleRefreshSetting"
      @delete="handleDelete"
    />
  </DashboardCard>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { RecordAuditHistoryWidgetSetting } from '../../../utils/detailWidgetHelper'
import type { AuditLogRecord, AuditOperation } from '@demo/workspaces/utils/db/schema/newTableSchema'

const props = defineProps<{
  setting: RecordAuditHistoryWidgetSetting
  hideSetting?: boolean
  record?: Record<string, any>
  tableName?: string
  tableId?: string
  entityId?: string
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'refresh-setting', setting: RecordAuditHistoryWidgetSetting): void
}>()

const { t: $t } = useI18n()
const { query } = usePglite()

const settingRef = ref()
const loading = ref(false)
const auditLogs = ref<AuditLogRecord[]>([])
const showAll = ref(false)

const defaultSetting: RecordAuditHistoryWidgetSetting = {
  i: props.setting?.i || '',
  x: props.setting?.x || 0,
  y: props.setting?.y || 0,
  w: props.setting?.w || 6,
  h: props.setting?.h || 4,
  widgetName: 'RecordAuditHistory',
  maxItems: 5,
  showDetails: true,
  maxFieldsToShow: 3
}

const effectiveSetting = computed(() => ({
  ...defaultSetting,
  ...props.setting
}))

const displayLogs = computed(() => {
  if (showAll.value) {
    return auditLogs.value
  }
  return auditLogs.value.slice(0, effectiveSetting.value.maxItems)
})

async function loadAuditLogs() {
  if (!props.record?.id || !props.tableName) {
    return
  }

  loading.value = true
  try {
    // Query for both direct recordId matches and bulk operations where record is in affectedRecordIds
    const result = await query<AuditLogRecord>(
      `SELECT * FROM audit_logs 
       WHERE "tableName" = $1 AND (
         "recordId" = $2 
         OR $2 = ANY("affectedRecordIds")
       )
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [props.tableName, props.record.id]
    )
    auditLogs.value = result
  } catch (error) {
    console.error('Failed to load audit logs:', error)
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

function formatOperation(operation: AuditOperation): string {
  switch (operation) {
    case 'INSERT':
      return 'Created'
    case 'UPDATE':
      return 'Updated'
    case 'DELETE':
      return 'Deleted'
    default:
      return operation.replace('_', ' ')
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now'
  }
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins} min${mins > 1 ? 's' : ''} ago`
  }
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  // Default to date string
  return d.toLocaleDateString()
}

function formatChangedFields(log: AuditLogRecord): string {
  if (!log.changedFields || log.changedFields.length === 0) return ''
  if (log.changedFields.length <= 3) {
    return log.changedFields.join(', ')
  }
  return `${log.changedFields.slice(0, 3).join(', ')} +${log.changedFields.length - 3} more`
}

function getOldValue(log: AuditLogRecord, field: string): string {
  const oldValues = log.oldValues as Record<string, any> | null
  if (!oldValues) return '-'
  const value = oldValues[field]
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value).slice(0, 20) + (String(value).length > 20 ? '...' : '')
}

function getNewValue(log: AuditLogRecord, field: string): string {
  const newValues = log.newValues as Record<string, any> | null
  if (!newValues) return '-'
  const value = newValues[field]
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value).slice(0, 20) + (String(value).length > 20 ? '...' : '')
}

function handleDelete() {
  emit('delete')
}

function handleRefreshSetting(newSetting: RecordAuditHistoryWidgetSetting) {
  emit('refresh-setting', newSetting)
}

// Watch for record changes
watch(() => props.record?.id, () => {
  loadAuditLogs()
}, { immediate: true })

onMounted(() => {
  loadAuditLogs()
})
</script>

<style scoped lang="scss">
.widget-content {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  gap: 8px;

  span {
    font-size: 13px;
  }
}

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color);
  }

  &.is-rolled-back {
    opacity: 0.6;
  }
}

.audit-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--el-fill-color);
  border-radius: 6px;
  flex-shrink: 0;
}

.audit-content {
  flex: 1;
  min-width: 0;
}

.audit-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.audit-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.audit-fields {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .field-label {
    margin-right: 4px;
  }

  .field-list {
    color: var(--el-text-color-regular);
  }
}

.audit-changes {
  margin-top: 8px;
  padding: 8px;
  background: var(--el-fill-color);
  border-radius: 4px;
  font-size: 11px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  .field-name {
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  .old-value {
    color: var(--el-color-danger);
    text-decoration: line-through;
  }

  .new-value {
    color: var(--el-color-success);
  }
}

.show-more {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
</style>
