<script lang="ts" setup>
import { ElMessage, ElNotification } from 'element-plus'
import { useImportRelationAnalysisState, dismissGuess } from '../../../../composables/import/useImportRelationAnalysis'
import type { RelationGuess } from '../../../../composables/import/relationGuesser'

const props = defineProps<{
  id: string
  detailId: string | null
  detailType: 'root' | 'folder' | 'master_table' | 'view' | 'dashboard',
  item_id: string
  pageType: string
  viewId: string
  tableId: string
}>()
const { database, menuActionsRef, getDatabaseById, databaseMenuRouteParams, currentUserPermission, checkMenuItemPermission } = useSingleDatabase()

const canManageDatabase = computed(() => currentUserPermission.value === 'Manage')
const canManageTable = computed(() => databaseMenuRouteParams.value.detailId && checkMenuItemPermission(databaseMenuRouteParams.value.detailId, 'Manage'))
const canEditTable = computed(() => databaseMenuRouteParams.value.detailId && checkMenuItemPermission(databaseMenuRouteParams.value.detailId, 'Edit') )
const canOpenSetting = computed(() => {
  if (databaseMenuRouteParams.value.detailType === 'root') return canManageDatabase.value
  return canManageTable.value
})

const analysis = useImportRelationAnalysisState()
const pendingGuesses = computed(() => analysis.value.guesses.filter((g) => !g.dismissed))
const showAnalysisStatus = computed(() => analysis.value.status !== 'idle')

const groupedGuesses = computed(() => {
  const map = new Map<string, RelationGuess[]>()
  for (const guess of pendingGuesses.value) {
    const key = guess.sourceTableName
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(guess)
  }
  return map
})

const analysisPopoverRef = ref()
const analysisStatusRef = ref<HTMLElement>()

function analysisStatusLabel() {
  const s = analysis.value.status
  if (s === 'analyzing') return 'Analyzing...'
  if (s === 'error') return 'Analysis failed'
  const count = pendingGuesses.value.length
  if (count > 0) return `${count} relation${count === 1 ? '' : 's'} found`
  return 'No relations found'
}

function analysisDotClass() {
  const s = analysis.value.status
  if (s === 'analyzing') return 'is-analyzing'
  if (s === 'error') return 'is-error'
  if (pendingGuesses.value.length > 0) return 'is-success'
  return ''
}

function openAnalysisPopover() {
  if (analysis.value.status === 'analyzing' || analysis.value.status === 'idle') return
  if (!analysisStatusRef.value) return
  analysisPopoverRef.value?.open(analysisStatusRef.value)
}

function dismissGuessAndClose(index: number) {
  dismissGuess(index)
  if (pendingGuesses.value.length === 0) {
    analysisPopoverRef.value?.close()
  }
}

function dismissAllGuesses() {
  analysis.value.guesses.forEach((_, i) => dismissGuess(i))
  analysisPopoverRef.value?.close()
}

// Hocuspocus awareness
const hocuspocusManager = useHocuspocusManager()
const roomName = computed(() => `dynamic-db:${props.id}`)

const remoteChanges = computed(() => {
  return hocuspocusManager.roomMeta.value[roomName.value]?.remoteChanges ?? []
})

watch(
  roomName,
  (newRoom, oldRoom) => {
    if (oldRoom && oldRoom !== newRoom) {
      hocuspocusManager.leaveRoom(oldRoom)
    }
    if (newRoom) {
      hocuspocusManager.joinRoom(newRoom)
    }
  },
  { immediate: true }
)

watch(
  databaseMenuRouteParams,
  () => {
    hocuspocusManager.setFocus(roomName.value, { menuId: databaseMenuRouteParams.value.tableId || databaseMenuRouteParams.value.detailId})
  }, {
    deep: true
  }
)

onBeforeUnmount(() => {
  if (roomName.value) {
    hocuspocusManager.leaveRoom(roomName.value)
  }
})

const awarenessStates = computed(() => {
  const room = hocuspocusManager.getRoomState(roomName.value)
  return room?.awarenessStates ?? []
})

const updatedRows = computed(() => {
  const room = hocuspocusManager.getRoomState(roomName.value)
  return room?.updatedRows ?? []
})

const connected = computed(() => {
  return hocuspocusManager.roomMeta.value[roomName.value]?.connected ?? false
})

const localAwareness = computed(() => {
  const room = hocuspocusManager.getRoomState(roomName.value)
  const state = room?.provider?.awareness?.getLocalState()
  return (state as any) || {}
})

function setAwareness(focus: {
  menuId?: string
  rowId?: string | null
  cellId?: string | null
  editingCell?: boolean
  editingRow?: boolean
  editingColumn?: boolean
  status?: 'editing' | 'saved'
}) {
  hocuspocusManager.setFocus(roomName.value, focus)
}

function connect() {
  hocuspocusManager.joinRoom(roomName.value)
}

function broadcastChange(change: {
  type: string
  rowId?: string
  rowIds?: string[]
  fieldId?: string
  fieldName?: string
  viewId?: string
  tableId: string
  menuId: string
}) {
  const fullChange = {
    ...change,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    userId: getSessionAwarenessId()
  }
  hocuspocusManager.broadcastChanges(roomName.value, [fullChange as any])
}

provide('databaseHocuspocus', {
  awarenessStates,
  updatedRows,
  localAwareness,
  connected,
  remoteChanges,
  setAwareness,
  broadcastChange,
  connect
})

// Consume remote changes at page level for toast notifications
watch(remoteChanges, (events) => {
  for (const event of events) {
    const { change, userName } = event
    if (change.menuId !== databaseMenuRouteParams.value.detailId) continue
    if (change.type === 'row_created') {
      ElNotification({
        title: 'New Record',
        message: `${userName} created a new row`,
        type: 'info'
      })
    } else if (change.type === 'rows_deleted') {
      ElNotification({
        title: 'Rows Deleted',
        message: `${userName} deleted ${change.rowIds?.length || 0} rows`,
        type: 'warning'
      })
    }
  }
})

function openSetting() {
  if (!canManageDatabase.value) {
    ElMessage.warning('You do not have permission to access settings')
    return
  }
  databaseMenuRouteParams.value.pageType = 'setting'
}

const openDetail = () => {
  databaseMenuRouteParams.value.pageType = 'detail'
}

const detailComponent = computed(() => {
  switch (databaseMenuRouteParams.value.detailType) {
    case 'root':
      if (databaseMenuRouteParams.value.pageType === 'setting') {
        return 'LazyDatabaseSettingRoot'
      }
      if (!databaseMenuRouteParams.value.detailId) {
        return 'LazyDatabaseDetailRoot'
      }
    case 'folder':
      return 'LazyDatabaseDetailFolder'
    case 'view':
    case 'master_table':
      if (databaseMenuRouteParams.value.pageType === 'setting') {
        return 'LazyDatabaseSettingTable'
      }
      return 'LazyDatabaseDetailTable'
    case 'dashboard':
      if (databaseMenuRouteParams.value.pageType === 'setting') {
        return 'LazyDatabaseSettingDashboard'
      }
      return 'LazyDatabaseDetailDashboard'
    case 'record':
      return 'LazyDatabaseDetailRecord'
    default:
      return 'LazyDatabaseDetailRoot'
  }
})

watch(
  props,
  async () => {
    await getDatabaseById(props.id)
    if (props.detailId) {
      databaseMenuRouteParams.value.detailId = props.detailId
      databaseMenuRouteParams.value.detailType = props.detailType
      databaseMenuRouteParams.value.item_id = props.item_id
      databaseMenuRouteParams.value.pageType = props.pageType
      databaseMenuRouteParams.value.viewId = props.viewId
      databaseMenuRouteParams.value.tableId = props.tableId
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="page-container">
    <template v-if="!database">
      <NuxtLoadingIndicator />
    </template>
    <template v-else>
      <el-splitter>
        <el-splitter-panel size="220">
          <aside class="sidebar">
            <DatabaseMenuHeader />
            <DatabaseMenu :workspace-id="database?.id" :initialMenu="[]" :is-admin="canManageDatabase" />
          </aside>
        </el-splitter-panel>
        <el-splitter-panel>
          <main class="main-content">
            <DatabaseDetailHeader>
              <template #left>
                <div />
              </template>
              <template #right>
                <div id="database-table-header-right" />
                <DatabaseAwarenessAvatars />

                <!-- Post-import relation analysis status -->
                <div
                  v-if="showAnalysisStatus"
                  ref="analysisStatusRef"
                  class="analysis-status"
                  :class="{ 'is-clickable': analysis.status === 'completed' }"
                  @click="openAnalysisPopover"
                >
                  <span class="analysis-dot" :class="analysisDotClass()" />
                  <span class="analysis-text">{{ analysisStatusLabel() }}</span>
                  <Icon v-if="analysis.status === 'analyzing'" name="svg-spinners:180-ring" size="14" class="analysis-spinner" />
                </div>

                <div class="connection-status" :class="{ 'is-online': connected }">
                  <span class="connection-dot" />
                  <span class="connection-text">{{ connected ? 'Online' : 'Offline' }}</span>
                  <button v-if="!connected" class="connection-btn" @click="connect">Connect</button>
                </div>
                <template v-if="databaseMenuRouteParams.pageType !== 'setting' && canOpenSetting">
                  <Icon name="lucide:settings" class="header-action" @click="openSetting" />
                </template>
                <template v-if="databaseMenuRouteParams.pageType === 'setting'  && canOpenSetting">
                  <Icon name="lucide:table" class="header-action" @click="openDetail" />
                </template>
              </template>
            </DatabaseDetailHeader>

            <div class="content-area">
              <component :is="detailComponent" :is-admin="canManageDatabase" />
            </div>
          </main>
        </el-splitter-panel>
      </el-splitter>
      <DatabaseMenuActions ref="menuActionsRef" />
    </template>
  </div>

  <!-- Relation analysis popover dialog -->
  <UiPopoverDialog
    ref="analysisPopoverRef"
    title="Potential Relations"
    :width="420"
    placement="bottom-end"
    :close-on-click-outside="true"
    :show-highlight="false"
  >
    <div class="analysis-popover-content">
      <div v-if="pendingGuesses.length === 0" class="analysis-empty">
        No strong relations detected.
      </div>
      <div v-else class="analysis-groups">
        <div
          v-for="[tableName, guesses] in groupedGuesses"
          :key="tableName"
          class="analysis-group"
        >
          <div class="analysis-group-title">{{ tableName }} Table</div>
          <div class="analysis-guess-list">
            <div
              v-for="guess in guesses"
              :key="`${guess.sourceTableId}-${guess.sourceFieldName}-${guess.targetTableId}-${guess.targetFieldName}`"
              class="analysis-guess-row"
            >
              <div class="analysis-guess-fields">
                <span class="guess-source-field">{{ guess.sourceFieldAlias }}</span>
                <span class="guess-arrow">→</span>
                <span class="guess-target-table">{{ guess.targetTableName }}</span>
                <span class="guess-target-field">{{ guess.targetFieldAlias }}</span>
              </div>
              <div class="analysis-guess-actions">
                <el-tag size="small" :type="guess.confidence > 0.7 ? 'success' : 'warning'">
                  {{ Math.round(guess.confidence * 100) }}%
                </el-tag>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click="dismissGuessAndClose(analysis.guesses.indexOf(guess))"
                >
                  Ignore
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="analysis-popover-footer">
        <el-button size="small" text @click="analysisPopoverRef?.close()">Close</el-button>
        <el-button v-if="pendingGuesses.length > 0" size="small" type="primary" text @click="dismissAllGuesses">
          Dismiss All
        </el-button>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<style lang="scss">
</style>
<style lang="scss" scoped>
.page-container {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  --sidebar-width: 220px;
  --header-height: 48px;
}

.layout-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

// ============================================
// Sidebar
// ============================================
.sidebar {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  background: var(--app-grey-950);
  overflow: hidden;
}

// ============================================
// Resize handle (desktop only)
// ============================================
.resize-handle {
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  flex-shrink: 0;

  &:hover {
    background: var(--el-color-primary-light-7);
  }
}

// ============================================
// Main content
// ============================================
.main-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-paper);
  overflow: hidden;
}

.content-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

// ============================================
// Header actions
// ============================================
.header-action {
  cursor: pointer;
  color: var(--app-grey-600);

  &:hover {
    color: var(--app-grey-300);
  }
}

// ============================================
// Connection status
// ============================================
.connection-status {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  margin-right: var(--app-space-s);
  font-size: var(--app-font-size-s);
  color: var(--app-grey-500);

  .connection-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--app-grey-600);
    transition: background-color 0.2s;
  }

  .connection-text {
    white-space: nowrap;
  }

  .connection-btn {
    padding: 2px 8px;
    font-size: 11px;
    border: 1px solid var(--el-color-primary);
    background: transparent;
    color: var(--el-color-primary);
    border-radius: var(--app-border-radius-s);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--el-color-primary);
      color: white;
    }
  }

  &.is-online {
    .connection-dot {
      background-color: #10b981;
    }
  }
}

// ============================================
// Analysis status
// ============================================
.analysis-status {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  margin-right: var(--app-space-s);
  font-size: var(--app-font-size-s);
  color: var(--app-grey-500);
  user-select: none;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .analysis-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--app-grey-600);
    transition: background-color 0.2s;

    &.is-analyzing {
      background-color: var(--el-color-primary);
      animation: analysis-pulse 1.5s infinite;
    }

    &.is-success {
      background-color: #10b981;
    }

    &.is-error {
      background-color: var(--el-color-danger);
    }
  }

  .analysis-text {
    white-space: nowrap;
  }

  .analysis-spinner {
    color: var(--el-color-primary);
  }
}

@keyframes analysis-pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

// ============================================
// Analysis popover content
// ============================================
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
