<script lang="ts" setup>
import { ElMessage } from 'element-plus'
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

// Hocuspocus awareness
const hocuspocusManager = useHocuspocusManager()
const roomName = computed(() => `dynamic-db:${props.id}`)

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
  (params) => {
    hocuspocusManager.setFocus(roomName.value, {
      ...params
    })
  },
  { deep: true }
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

const connected = computed(() => {
  return hocuspocusManager.isConnected(roomName.value)
})

function setAwareness(focus: { tableId?: string; rowId?: string; cellId?: string }) {
  hocuspocusManager.setFocus(roomName.value, focus)
}

provide('databaseHocuspocus', {
  awarenessStates,
  connected,
  setAwareness
})

// Responsive sidebar state
const pageContainerRef = ref<HTMLElement | null>(null)
const isSidebarOpen = ref(true) // Sidebar visibility state (for mobile toggle)
const isMobileView = ref(false)

// Check container size on mount and resize
function checkContainerSize() {
  if (!pageContainerRef.value) return

  const containerWidth = pageContainerRef.value.offsetWidth
  const wasMobile = isMobileView.value
  isMobileView.value = containerWidth < 800

  // Auto-close sidebar when transitioning to mobile
  if (!wasMobile && isMobileView.value) {
    isSidebarOpen.value = false
  }
  // Auto-open sidebar when transitioning to desktop
  if (wasMobile && !isMobileView.value) {
    isSidebarOpen.value = true
  }
}

onMounted(() => {
  // Initial check
  nextTick(() => {
    checkContainerSize()
  })


  // Use ResizeObserver to detect container size changes
  if (pageContainerRef.value) {
    const resizeObserver = new ResizeObserver(checkContainerSize)
    resizeObserver.observe(pageContainerRef.value)

    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})

// Toggle sidebar
function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Close sidebar on mobile when navigating
function closeSidebarOnMobile() {
  if (isMobileView.value) {
    isSidebarOpen.value = false
  }
}

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

// Expose toggle function and state to child components
provide('isSidebarOpen', readonly(isSidebarOpen))
provide('isMobileView', readonly(isMobileView))
provide('toggleSidebar', toggleSidebar)

// Close sidebar on navigation in mobile mode
watch(
  databaseMenuRouteParams,
  () => {
    closeSidebarOnMobile()
  },
  { deep: true }
)

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
  <div
    ref="pageContainerRef"
    class="page-container"
    :class="{
      'is-mobile': isMobileView,
      'sidebar-open': isSidebarOpen
    }"
  >
    <template v-if="!database">
      <NuxtLoadingIndicator />
    </template>
    <template v-else>
      <el-splitter v-if="!isMobileView">
        <el-splitter-panel size="220">
          <aside class="sidebar" :class="{ 'is-open': isSidebarOpen }">
            <DatabaseMenuHeader />
            <DatabaseMenu :workspace-id="database?.id" :initialMenu="[]" :is-admin="canManageDatabase" />
          </aside>
        </el-splitter-panel>
        <el-splitter-panel>
          <main class="main-content">
            <DatabaseDetailHeader>
              <template #left>
                <button v-if="isMobileView" class="menu-toggle-btn" @click.stop="toggleSidebar" aria-label="Toggle menu">
                  <Icon name="lucide:menu" size="20" />
                </button>
              </template>
              <template #right>
                <div id="database-table-header-right" />
                <div v-if="awarenessStates.length > 0" class="awareness-avatars">
                  <el-tooltip
                    v-for="(state, idx) in awarenessStates.slice(0, 5)"
                    :key="state.user?.id || idx"
                    :content="state.user?.name || 'Unknown'"
                    placement="bottom"
                  >
                    <div
                      class="awareness-avatar"
                      :style="{ backgroundColor: state.user?.color || '#999' }"
                    >
                      {{ (state.user?.name || '?').charAt(0).toUpperCase() }}
                    </div>
                  </el-tooltip>
                  <div v-if="awarenessStates.length > 5" class="awareness-avatar awareness-avatar--more">
                    +{{ awarenessStates.length - 5 }}
                  </div>
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
      <template v-else>
        <aside class="sidebar" :class="{ 'is-open': isSidebarOpen }">
          <DatabaseMenuHeader />
          <DatabaseMenu :workspace-id="database?.id" :initialMenu="[]" :is-admin="canManageDatabase" />
        </aside>
        <main class="main-content">
          <DatabaseDetailHeader>
            <template #left>
              <button v-if="isMobileView" class="menu-toggle-btn" @click.stop="toggleSidebar" aria-label="Toggle menu">
                <Icon name="lucide:menu" size="20" />
              </button>
            </template>
            <template #right>
              <div id="database-table-header-right" />
              <div v-if="awarenessStates.length > 0" class="awareness-avatars">
                <el-tooltip
                  v-for="(state, idx) in awarenessStates.slice(0, 5)"
                  :key="state.user?.id || idx"
                  :content="state.user?.name || 'Unknown'"
                  placement="bottom"
                >
                  <div
                    class="awareness-avatar"
                    :style="{ backgroundColor: state.user?.color || '#999' }"
                  >
                    {{ (state.user?.name || '?').charAt(0).toUpperCase() }}
                  </div>
                </el-tooltip>
                <div v-if="awarenessStates.length > 5" class="awareness-avatar awareness-avatar--more">
                  +{{ awarenessStates.length - 5 }}
                </div>
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
        <div v-if="isMobileView && isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false" />
      </template>
      <!-- Single layout structure - CSS handles responsive behavior -->

      <DatabaseMenuActions ref="menuActionsRef" />
    </template>
  </div>
</template>

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

.menu-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--el-border-radius-base);
  color: var(--app-grey-400);

  &:hover {
    background: var(--app-grey-800);
    color: var(--app-grey-200);
  }
}

// ============================================
// Sidebar backdrop (mobile)
// ============================================
.sidebar-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

// ============================================
// Mobile responsive styles
// ============================================
.page-container.is-mobile {
  .layout-wrapper {
    display: block;
    position: relative;
  }

  .sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);

    &.is-open {
      width: 220px;
      transform: translateX(0);
    }
  }

  .resize-handle {
    display: none;
  }

  .main-content {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}

// ============================================
// Desktop styles (hide mobile-only elements)
// ============================================
.page-container:not(.is-mobile) {
  .menu-toggle-btn {
    display: none;
  }

  .sidebar-backdrop {
    display: none;
  }
}

// ============================================
// Awareness avatars
// ============================================
.awareness-avatars {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  margin-right: var(--app-space-s);
}

.awareness-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  border: 2px solid var(--app-paper);
  margin-left: -6px;

  &:first-child {
    margin-left: 0;
  }

  &--more {
    background-color: var(--app-grey-600);
  }
}
</style>
