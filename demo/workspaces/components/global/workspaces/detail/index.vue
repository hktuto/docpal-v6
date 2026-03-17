<script lang="ts" setup>
import type { ImportReport } from '../../../../composables/import/useImportQueue'

const props = defineProps<{
  id: string
  detailId: string | null
  detailType: 'root' | 'folder' | 'master_table' | 'view' | 'dashboard'
}>()
const { workspace, menuActionsRef, getWorkspaceById, workspaceRouteParams } = useSingleWorkspace()

const importReportDialogRef = ref()

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

function handleViewImportReport(report: ImportReport) {
  importReportDialogRef.value?.open(report)
}

function openSetting() {
  workspaceRouteParams.value.pageType = 'setting'
}

const openDetail = () => {
  workspaceRouteParams.value.pageType = 'detail'
}

const detailComponent = computed(() => {
  switch (workspaceRouteParams.value.detailType) {
    case 'root':
      if (workspaceRouteParams.value.pageType === 'setting') {
        return 'LazyWorkspacesSettingRoot'
      }
      if (!workspaceRouteParams.value.detailId) {
        return 'LazyWorkspacesDetailRoot'
      }
    case 'folder':
      return 'LazyWorkspacesDetailFolder'
    case 'master_table':
      if (workspaceRouteParams.value.pageType === 'setting') {
        return 'LazyWorkspacesSettingTable'
      }
      return 'LazyWorkspacesDetailTableViews'
    case 'view':
      if (workspaceRouteParams.value.pageType === 'setting') {
        return 'LazyWorkspacesSettingView'
      }
      return 'LazyWorkspacesDetailView'
    case 'dashboard':
      if (workspaceRouteParams.value.pageType === 'setting') {
        return 'LazyWorkspacesSettingDashboard'
      }
      return 'LazyWorkspacesDetailDashboard'
    case 'record':
      return 'LazyWorkspacesDetailRecord'
    default:
      return 'LazyWorkspacesDetailRoot'
  }
})

// Expose toggle function and state to child components
provide('isSidebarOpen', readonly(isSidebarOpen))
provide('isMobileView', readonly(isMobileView))
provide('toggleSidebar', toggleSidebar)

// Close sidebar on navigation in mobile mode
watch(
  workspaceRouteParams,
  () => {
    closeSidebarOnMobile()
  },
  { deep: true }
)

watch(
  props,
  async () => {
    await getWorkspaceById(props.id)

    if (props.detailId) {
      workspaceRouteParams.value.detailId = props.detailId
      workspaceRouteParams.value.detailType = props.detailType
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
    <template v-if="!workspace">
      <NuxtLoadingIndicator />
    </template>
    <template v-else>
      <!-- Single layout structure - CSS handles responsive behavior -->
      <div class="layout-wrapper">
        <!-- Sidebar -->
        <aside class="sidebar" :class="{ 'is-open': isSidebarOpen }">
          <WorkspacesMenuHeader />
          <WorkspacesMenu :workspace-id="workspace?.id" :initialMenu="[]" :is-admin="true" />
        </aside>

        <!-- Resize handle (desktop only) -->
        <div class="resize-handle" />

        <!-- Main content - never re-renders on resize -->
        <main class="main-content">
          <WorkspacesDetailHeader>
            <template #left>
              <button v-if="isMobileView" class="menu-toggle-btn" @click.stop="toggleSidebar" aria-label="Toggle menu">
                <Icon name="lucide:menu" size="20" />
              </button>
            </template>
            <template #right>
              <div id="database-table-header-right" />
              <template v-if="workspaceRouteParams.pageType !== 'setting'">
                <Icon name="lucide:settings" class="header-action" @click="openSetting" />
              </template>
              <template v-if="workspaceRouteParams.pageType === 'setting'">
                <Icon name="lucide:table" class="header-action" @click="openDetail" />
              </template>
            </template>
          </WorkspacesDetailHeader>
          <div class="content-area">
            <component :is="detailComponent" :is-admin="true" />
          </div>
        </main>

        <!-- Backdrop for mobile sidebar -->
        <div v-if="isMobileView && isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false" />
      </div>

      <WorkspacesMenuActions ref="menuActionsRef" />
      <WorkspacesTableImportProgressIndicator @view-report="handleViewImportReport" />
      <WorkspacesTableImportReportDialog ref="importReportDialogRef" />
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
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-grey-950);
  overflow: hidden;
  flex-shrink: 0;
  transition:
    transform 0.3s ease,
    width 0.3s ease;
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
  overflow: hidden;
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
</style>
