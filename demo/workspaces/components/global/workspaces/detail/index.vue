<script lang="ts" setup>
import { ElSplitter } from 'element-plus'
import { useSingleWorkspace } from '../../../../composables/useSingleWorkspace'
import type { ImportReport } from '../../../../composables/useImportQueue'

const props = defineProps<{
  id: string
  detailId: string | null
  detailType: 'root' | 'folder' | 'table' | 'view' | 'dashboard'
}>()
const { workspace, menuActionsRef, getWorkspaceById, workspaceRouteParams } = useSingleWorkspace()

const importReportDialogRef = ref()

// Responsive sidebar state
const isSidebarVisible = ref(true)
const pageContainerRef = ref<HTMLElement | null>(null)
const isMobileView = ref(false)

// Check container size on mount and resize
function checkContainerSize() {
  if (!pageContainerRef.value) return

  const containerWidth = pageContainerRef.value.offsetWidth
  isMobileView.value = containerWidth < 800

  // Auto-hide sidebar on mobile if it's visible
  if (isMobileView.value && isSidebarVisible.value) {
    isSidebarVisible.value = false
  }
}

onMounted(() => {
  checkContainerSize()

  // Use ResizeObserver to detect container size changes
  if (pageContainerRef.value) {
    const resizeObserver = new ResizeObserver(checkContainerSize)
    resizeObserver.observe(pageContainerRef.value)

    // Cleanup on unmount
    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})

// Toggle sidebar with mobile awareness
function toggleSidebar() {
  isSidebarVisible.value = !isSidebarVisible.value
}

function handleViewImportReport(report: ImportReport) {
  importReportDialogRef.value?.open(report)
}

const detailComponent = computed(() => {
  switch (workspaceRouteParams.value.detailType) {
    case 'root':
      return 'LazyWorkspacesDetailRoot'
    case 'folder':
      return 'LazyWorkspacesDetailFolder'
    case 'table':
      if (workspaceRouteParams.value.detailId === 'setting') {
        return 'LazyWorkspacesDetailTableSetting'
      }
      return 'LazyWorkspacesDetailTable'
    case 'view':
      if (workspaceRouteParams.value.detailId === 'setting') {
        return 'LazyWorkspacesDetailViewSetting'
      }
      return 'LazyWorkspacesDetailView'
    case 'dashboard':
      if (workspaceRouteParams.value.detailId === 'setting') {
        return 'LazyWorkspacesDetailDashboardSetting'
      }
      return 'LazyWorkspacessDetailDashboard'
    default:
      return 'LazyWorkspaceDetailRoot'
  }
})

// Expose toggle function and state to child components
provide('isSidebarVisible', readonly(isSidebarVisible))
provide('isMobileView', readonly(isMobileView))

watch(
  workspaceRouteParams,
  () => {
    if (isMobileView.value && isSidebarVisible.value) {
      isSidebarVisible.value = false
    }
  },
  {
    deep: true
  }
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
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="pageContainer" ref="pageContainerRef">
    <template v-if="!workspace">
      <NuxtLoadingIndicator />
    </template>
    <template v-else>
      <!-- Desktop layout with splitter (sidebar always visible) -->
      <template v-if="!isMobileView">
        <ElSplitter>
          <ElSplitterPanel :min="120" size="220px">
            <div class="sideBarContainer">
              <WorkspacesMenuHeader />
              <WorkspacesMenu :workspace-id="workspace?.id" :initialMenu="[]" :is-admin="true"> </WorkspacesMenu>
            </div>
          </ElSplitterPanel>
          <ElSplitterPanel>
            <div class="detailContainer">
              <WorkspacesDetailHeader>
                <template #left>
                  <el-button v-if="isMobileView" class="sidebar-toggle-btn" @click="toggleSidebar" circle plain size="small" type="primary">
                    <el-icon><Menu /></el-icon>
                  </el-button>
                </template>
              </WorkspacesDetailHeader>
              <component :is="detailComponent" :is-admin="true" />
            </div>
          </ElSplitterPanel>
        </ElSplitter>
      </template>

      <!-- Mobile layout (sidebar as overlay) -->
      <template v-else>
        <!-- Sidebar overlay for mobile -->
        <div class="sideBarContainer" :class="{ 'sidebar-hidden': !isSidebarVisible }">
          <WorkspacesMenuHeader />
          <WorkspacesMenu :workspace-id="workspace?.id" :initialMenu="[]" :is-admin="true"> </WorkspacesMenu>
        </div>

        <!-- Main content (always full width on mobile) -->
        <div class="detailContainer" @click="isSidebarVisible = false">
          <WorkspacesDetailHeader>
            <template #left>
              <Icon name="lucide:menu" @click.stop="toggleSidebar" />
            </template>
          </WorkspacesDetailHeader>
          <component :is="detailComponent" :is-admin="true" />
        </div>

        <!-- Backdrop overlay for mobile sidebar -->
        <div v-if="isSidebarVisible" class="sidebar-backdrop" @click="isSidebarVisible = false"></div>
      </template>
      <WorkspacesMenuActions ref="menuActionsRef" />

      <!-- Import Progress Indicator (bottom-left) -->
      <WorkspacesTableImportProgressIndicator @view-report="handleViewImportReport" />

      <!-- Import Report Dialog -->
      <WorkspacesTableImportReportDialog ref="importReportDialogRef" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  width: 100%;
  --app-header-height: 48px;
  container-type: inline-size;
  container-name: workspace-container;
  transform: translateX(0);
}

.sideBarContainer {
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0;
  overflow: hidden;

  @container workspace-container (max-width: 800px) {
    display: grid;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 220px;
    z-index: 1001;
    background: var(--app-grey-950);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.sidebar-hidden {
      transform: translateX(-100%);
    }

    &:not(.sidebar-hidden) {
      transform: translateX(0);
    }
  }
}

.detailContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--app-paper);
  position: relative;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0;
}

:deep(.actionIcon) {
  font-size: var(--app-font-size-m);
  cursor: pointer;
  color: var(--app-grey-600);
  line-height: 0;
  &:hover {
    color: var(--app-grey-300);
  }
}

// Container query for responsive behavior
@container workspace-container (max-width: 800px) {
  // Show backdrop when sidebar is visible on mobile
  .sidebar-backdrop {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    cursor: pointer;
  }
}

// Hide backdrop on larger screens
.sidebar-backdrop {
  display: none;
}

// Auto-hide sidebar on mobile when clicking on main content
@container workspace-container (max-width: 800px) {
  .detailContainer {
    cursor: pointer;
    height: 100%;
    width: 100%;
  }
}

// Toggle button styling
.sidebar-toggle-btn {
  margin-right: var(--app-space-s);

  @container workspace-container (min-width: 800px) {
    display: none;
  }

  .el-icon {
    font-size: var(--app-font-size-l);
  }
}
</style>
