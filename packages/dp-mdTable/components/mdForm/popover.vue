<template>
  <el-dialog v-model="visible" class="scroll-dialog md-form-detail-dialog" :fullscreen="fullscreen" @close="resetForm">
    <template v-if="mode === 'edit'" #header>
      <div class="el-dialog__title mdForm-title">
        {{ title }}
        <el-button class="source-button" type="info" link :icon="Position" v-if="showSourceButton" @click="handleSourceClick">{{
          $t('common_goToSourceTable')
        }}</el-button>
        <div class="action-container">
          <div v-if="showMoveButtons" class="action">
            <el-icon
              style="font-size: var(--app-font-size-m)"
              :class="disabledUp ? 'cursor-not-allowed' : 'cursor-pointer'"
              role="button"
              tabindex="0"
              :aria-label="t('common_moveUp')"
              :aria-disabled="disabledUp"
              @click="!disabledUp && handleMove('up')"
              @keydown.enter.space.prevent="!disabledUp && handleMove('up')"
            >
              <Top />
            </el-icon>
            <el-icon
              style="font-size: var(--app-font-size-m)"
              :class="disabledDown ? 'cursor-not-allowed' : 'cursor-pointer'"
              role="button"
              tabindex="0"
              :aria-label="t('common_moveDown')"
              :aria-disabled="disabledDown"
              @click="!disabledDown && handleMove('down')"
              @keydown.enter.space.prevent="!disabledDown && handleMove('down')"
            >
              <Bottom />
            </el-icon>
          </div>
          <div class="fullscreen-toggle">
            <el-icon :class="fullscreen ? 'fullscreen-exit' : 'fullscreen-enter'" @click="fullscreen = !fullscreen">
              <FullScreen />
            </el-icon>
          </div>
        </div>
      </div>
    </template>
    <el-tabs v-model="activeTab" class="md-form-tabs">
      <el-tab-pane :label="t('common_form')" name="form">
        <MdForm ref="formRef" :columns="formColumns" :systemFieldsTypes="systemFieldsTypes" :form-data="formData" :mode="mode" />
      </el-tab-pane>
      <el-tab-pane v-if="formData.id" :label="t('common_dashboard')" name="dashboard">
        <RecordDashboard :record-id="formData.id" :table-id="tableId" :record="formData" :can-manage="canManageTable" />
      </el-tab-pane>
      <el-tab-pane v-if="formData.id" :label="t('auditLog_title')" name="auditLog">
        <div
          class="audit-log-panel"
          v-infinite-scroll="handleLoadMore"
          :infinite-scroll-disabled="!hasMore || loading"
          :infinite-scroll-immediate="false"
          infinite-scroll-distance="3"
          v-loading="loading && list.length === 0"
        >
          <el-empty v-if="!loading && list.length === 0" :description="t('auditLog_empty')" />
          <el-timeline v-else>
            <template v-for="group in groupedList" :key="group.date">
              <el-timeline-item class="date-header-item">
                <template #dot>
                  <div class="date-dot" />
                </template>
                <div class="date-header">{{ group.date === 'Unknown' ? t('auditLog_unknownDate') : formatAuditTime(group.date) }}</div>
              </el-timeline-item>
              <el-timeline-item v-for="item in group.items" :key="item._key" :timestamp="formatDate(item.timestamp, 'HH:mm')">
                <div
                  class="timeline-summary"
                  role="button"
                  tabindex="0"
                  :aria-expanded="expandedIds.has(item._key)"
                  :aria-label="t('auditLog_toggleDetails')"
                  @click="handleToggleExpand(item._key)"
                  @keydown.enter.space.prevent="handleToggleExpand(item._key)"
                >
                  <span class="user">{{ item.user_id }}</span>
                  <span class="action">{{ t(item.event_type) }}</span>
                </div>
                <div v-if="expandedIds.has(item._key)" class="payload">
                  <pre>{{ JSON.stringify(item.details, null, 2) }}</pre>
                </div>
              </el-timeline-item>
            </template>
          </el-timeline>
          <div v-if="loading && list.length > 0" class="load-more-indicator">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <div class="form-actions">
        <el-button @click="handleCancel">{{ $t('cancelText') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { newClientApi, clientApi } from 'api'
import { EventType, useEventBus } from 'eventbus'
import { Top, Bottom, Position, Loading, FullScreen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { updateRelationFields } from '../../utils/relationHelper'
import { computed, formatDate, groupAuditLogsByDate, ref, watch } from '#imports'
import dayjs from 'dayjs'
import RecordDashboard from '@packages/dynamic-db/components/dashboard/RecordDashboard.vue'

const fullscreen = ref(false)
const { updateRow } = useTableDataInject()
const viewTools = inject('viewTools')
const navigateToTableMenu = (viewTools as any)?.navigateToTableMenu
const canManageTable = computed(() => (viewTools as any)?.canManageTable?.value ?? false)
provide('mdFormTableId', computed(() => props.tableId))
const visible = ref(false)
const formData = ref<any>({})
const mode = ref('edit')
const activeTab = ref('form')
const props = defineProps<{
  showMoveButtons: boolean
  showSourceButton: boolean
  columns: any[]
  tableId: string
  systemFieldsTypes: any[]
}>()
const emits = defineEmits(['submit', 'closed', 'current-row-change'])
const { t } = useI18n()
const title = ref(t('common_add'))
const { currentRow, setCurrentRow, moveCurrentRow, disabledUp, disabledDown } = useCurrentRow()
const formColumns = ref<any[]>([])

const resetForm = () => {
  activeTab.value = 'form'
  emits('closed')
}
function handleCancel() {
  visible.value = false
  activeTab.value = 'form'
  emits('closed')
}
const formRef = ref()
const relationRefreshBus = useEventBus(EventType.MD_TABLE_RELATION_NEED_REFRESH)
/**
 * Handle relation form data refresh
 * @param payload { data: any, relationTableId: string, relationRowId: string, relationField: string }
 */
const stopRelationRefresh = relationRefreshBus.on((payload: any) => {
  if (props.showSourceButton) return
  if (!visible.value) return
  if (payload?.data) {
    updateRelationFields(payload.relationRowId, payload.data, formData.value, payload.relationField)
  }
})
onBeforeUnmount(() => {
  stopRelationRefresh()
})

async function handleSubmit() {
  const _formData = await formRef.value.getFormData()
  if (!_formData) return
  visible.value = false
  activeTab.value = 'form'
  emits('submit', _formData, formData.value.id)
}
async function open(row: any, _mode: 'default' | 'edit' = 'edit', _title: string = '') {
  formData.value = JSON.parse(JSON.stringify(row))
  mode.value = _mode
  activeTab.value = row?.id ? 'dashboard' : 'form'
  visible.value = true
  if (props.showMoveButtons) setCurrentRow(row)
  if (_title) {
    title.value = _title
  } else {
    title.value = mode.value === 'edit' ? t('common_edit') : t('common_add')
  }
  await getFormColumns()
}
function handleMove(direction: 'up' | 'down') {
  moveCurrentRow(direction)
  const titleColumn = props.columns[0]?.field_name
  if (titleColumn) {
    title.value = currentRow.value[titleColumn]
  }
  formData.value = { ...currentRow.value }
  emits('current-row-change', { ...currentRow.value })
}
const close = () => {
  visible.value = false
}
async function getFormColumns() {
  if (props.columns && props.columns.length > 0) {
    formColumns.value = props.columns
  } else {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId: props.tableId, userId: 'master' })
    const configStr = res.data.tableConfig
    let config = []
    try {
      config = configStr ? JSON.parse(configStr) : []
    } catch {
      config = []
    }
    let result = []
    const displayFieldsInFirstView = config.length > 0 ? (config[0].columns.length > 0 ? config[0].columns : res.data.tableFields) : res.data.tableFields
    if (config.length > 0 && config[0].columns.length > 0) {
      displayFieldsInFirstView.forEach((field: any) => {
        const fieldItem = res.data.tableFields.find((item: any) => item.id === field.id)
        if (fieldItem) {
          result.push({ ...fieldItem, ...field })
        }
      })
    } else {
      result = res.data.tableFields
    }
    formColumns.value = result
  }
}
function handleSourceClick() {
  if (navigateToTableMenu) {
    navigateToTableMenu(props.tableId)
  }
}

// Audit log timeline
const list = ref<any[]>([])
const pageNum = ref(0)
const pageSize = ref(20)
const loading = ref(false)
const hasMore = ref(true)
const expandedIds = ref<Set<string>>(new Set())
const pendingReset = ref(false)
const itemKeyMap = new WeakMap<object, string>()
let itemKeyCounter = 0

function ensureItemKey(item: any) {
  if (item.event_id) return item.event_id
  if (!itemKeyMap.has(item)) {
    itemKeyMap.set(item, `audit-log-popover-${itemKeyCounter++}`)
  }
  return itemKeyMap.get(item)!
}

const keyedList = computed(() =>
  list.value.map((item) => ({
    ...item,
    _key: ensureItemKey(item)
  }))
)

const groupedList = computed(() => groupAuditLogsByDate(keyedList.value))

async function fetchAuditLogs(reset = false) {
  if (loading.value) {
    if (reset) pendingReset.value = true
    return
  }
  if (reset) {
    list.value = []
    pageNum.value = 0
    hasMore.value = true
    expandedIds.value = new Set()
    pendingReset.value = false
  }
  if (!hasMore.value) return
  if (!formData.value.id) return
  loading.value = true
  try {
    const res: any = await clientApi.api.postAuditLogPage({
      page_size: pageSize.value,
      page_num: pageNum.value,
      source_id: formData.value.id
    })
    const rows = res?.data?.entryList || []
    rows.forEach((row: any) => ensureItemKey(row))
    list.value.push(...rows)
    hasMore.value = res?.data?.isNextPageAvailable ?? false
    pageNum.value += 1
  } catch (e) {
    ElMessage.error(t('auditLog_loadError'))
  } finally {
    loading.value = false
    if (pendingReset.value) {
      pendingReset.value = false
      await fetchAuditLogs(true)
    }
  }
}

function formatAuditTime(date: string): string {
  if (!date) return '-'

  return dayjs(date).format('YYYY-MM-DD')
}

function handleLoadMore() {
  fetchAuditLogs(false)
}

function handleToggleExpand(eventId: string) {
  const next = new Set(expandedIds.value)
  if (next.has(eventId)) {
    next.delete(eventId)
  } else {
    next.add(eventId)
  }
  expandedIds.value = next
}

watch(
  [() => formData.value.id, () => activeTab.value],
  ([id, tab]) => {
    if (!id || tab !== 'auditLog') {
      if (!id) {
        list.value = []
        hasMore.value = false
      }
      return
    }
    fetchAuditLogs(true)
  },
  { immediate: true }
)

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.action-container {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
}

.mdForm-title {
  display: flex;
  justify-content: space-between;
}
.cursor-not-allowed {
  cursor: not-allowed;
  color: var(--app-grey-400);
}

.source-button {
  font-size: var(--app-font-size-m);
}

.md-form-tabs {
  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
  }

  :deep(.el-tab-pane[name='dashboard']) {
    height: 100%;
  }
}

.audit-log-panel {
  height: 100%;
  min-height: 300px;
  overflow: auto;
}

.load-more-indicator {
  display: flex;
  justify-content: center;
  padding: var(--app-space-s);
}

.date-header-item {
  :deep(.el-timeline-item__content) {
    padding-top: 0;
  }
}

.date-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
}

.date-header {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.timeline-summary {
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  align-items: center;

  .user {
    font-weight: 600;
  }

  .action {
    color: var(--el-text-color-regular);
  }
}

.timeline-summary:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.payload {
  margin-top: var(--app-space-xs);
  max-height: 200px;
  overflow: auto;
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-xs);

  pre {
    margin: 0;
    font-size: var(--app-font-size-s);
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>

<style lang="scss">
// el-dialog is teleported to body, so this override must be unscoped
.md-form-detail-dialog {
  width: 90vw;

  &.is-fullscreen {
    width: 100%;
  }
}
</style>
