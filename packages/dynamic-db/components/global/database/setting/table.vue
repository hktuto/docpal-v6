<script setup lang="ts">
import type { TreeItem } from '../../../../composables/workspace/useSingleWorkspace'

// Get current menu item from workspace context
const { databaseMenuRouteParams, menuState, findItemById } = useSingleDatabaseContext()

// Get current table menu item
const currentMenuItem = computed<TreeItem | undefined>(() => {
  if (!databaseMenuRouteParams.value.detailId) return undefined
  return findItemById(menuState.value.items, databaseMenuRouteParams.value.detailId as string)
})

// Navigation state
const activeSection = ref('info')

// Responsive state
const pageContainerRef = ref<HTMLElement | null>(null)
const isMobileView = ref(false)
const isSidebarOpen = ref(true)

const settingsSections = [
  {
    group: 'GENERAL',
    items: [
      { id: 'info', label: 'Info', icon: 'lucide:info' },
    ]
  },
  {
    group: 'DATA',
    items: [
      { id: 'detail', label: 'Detail', icon: 'lucide:file-text' },
      { id: 'form', label: 'Form', icon: 'lucide:form-input' },
      { id: 'card', label: 'Card', icon: 'lucide:credit-card' },
      { id: 'list', label: 'List', icon: 'lucide:list' }
    ]
  },
  {
    group: 'ACCESS & SECURITY',
    items: [{ id: 'permissions', label: 'Permissions', icon: 'lucide:shield' }]
  },
  {
    group: 'AUTOMATION',
    items: [{ id: 'automation', label: 'Workflows', icon: 'lucide:workflow' }]
  },
  {
    group: 'SETTINGS',
    items: [{ id: 'settings', label: 'Delete Table', icon: 'lucide:trash-2' }]
  }
]

function switchSection(sectionId: string) {
  activeSection.value = sectionId
  // Auto-hide sidebar on mobile after selection
  if (isMobileView.value) {
    isSidebarOpen.value = false
  }
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'info':
      return 'LazyDatabaseSettingTableGeneral'
    case 'card':
      return 'LazyDatabaseSettingTableCard'
    case 'detail':
      return 'LazyDatabaseSettingTableDetail'
    case 'form':
      return 'LazyDatabaseSettingTableForm'
    case 'list':
      return 'LazyDatabaseSettingTableData'
    case 'automation':
      return 'LazyDatabaseSettingTableAutomation'
    case 'permissions':
      return 'LazyDatabaseSettingTablePermissions'
    case 'settings':
      return 'LazyDatabaseSettingTableSettings'
    default:
      return 'LazyDatabaseSettingTableGeneral'
  }
})

// Responsive handling
function checkContainerSize() {
  if (!pageContainerRef.value) return
  const containerWidth = pageContainerRef.value.offsetWidth
  const wasMobile = isMobileView.value
  isMobileView.value = containerWidth < 700

  // Auto-hide sidebar when transitioning to mobile
  if (!wasMobile && isMobileView.value) {
    isSidebarOpen.value = false
  }
  // Auto-show sidebar when transitioning to desktop
  if (wasMobile && !isMobileView.value) {
    isSidebarOpen.value = true
  }
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

onMounted(() => {
  nextTick(() => {
    checkContainerSize()
  })

  if (pageContainerRef.value) {
    const resizeObserver = new ResizeObserver(checkContainerSize)
    resizeObserver.observe(pageContainerRef.value)

    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})
</script>

<template>
  <div
    ref="pageContainerRef"
    class="setting-page"
    :class="{
      'is-mobile': isMobileView,
      'sidebar-open': isSidebarOpen
    }"
  >
    <!-- Toggle button teleported to header for mobile -->
    <Teleport to="#database-table-header-right">
      <el-button v-if="isMobileView" size="small" @click="toggleSidebar">
        <Icon :name="isSidebarOpen ? 'lucide:panel-left-close' : 'lucide:panel-left'" size="16" />
      </el-button>
    </Teleport>

    <!-- Single layout structure - CSS handles responsive -->
    <div class="layout-wrapper">
      <!-- Sidebar navigation -->
      <aside class="setting-nav" :class="{ 'is-open': isSidebarOpen }">
        <div class="nav-title">Table Settings</div>
        <div class="nav-content">
          <template v-for="section in settingsSections" :key="section.group">
            <div class="settings-group">
              <div class="group-title">{{ section.group }}</div>
              <div class="group-items">
                <div
                  v-for="item in section.items"
                  :key="item.id"
                  :class="{ 'nav-item': true, active: activeSection === item.id }"
                  @click="switchSection(item.id)"
                >
                  <Icon :name="item.icon" />
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Resize handle (desktop only) -->
      <div class="resize-handle" />

      <!-- Main content - never re-renders on resize -->
      <main class="setting-container">
        <component
          :is="sectionComponent"
          :active-sub-section="activeSection"
          :menu-item="currentMenuItem"
        />
      </main>

      <!-- Backdrop for mobile sidebar -->
      <div v-if="isMobileView && isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-page {
  height: 100%;
  overflow: hidden;
  position: relative;
  --sidebar-width: 220px;
}

.layout-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

// ============================================
// Sidebar Navigation
// ============================================
.setting-nav {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100%;
  background: var(--app-grey-950);
  padding: var(--app-space-m) 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  transition: transform 0.3s ease;

  .nav-title {
    font-size: var(--app-font-size-xl);
    font-weight: 600;
    color: var(--app-grey-300);
    padding: var(--app-space-s) var(--app-space-m);
    margin-bottom: var(--app-space-m);
  }

  .nav-content {
    display: flex;
    flex-direction: column;
  }

  .settings-group {
    margin-bottom: var(--app-space-l);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .group-title {
    padding: 0 var(--app-space-m);
    margin-bottom: var(--app-space-xs);
    font-size: var(--app-font-size-xs);
    font-weight: 600;
    color: var(--app-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .group-items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: var(--app-space-s);
    padding: var(--app-space-xs) var(--app-space-m);
    cursor: pointer;
    transition: all 0.2s;
    color: var(--app-grey-300);
    font-size: var(--app-font-size-m);

    &:hover {
      background: var(--app-grey-800);
      color: var(--app-grey-100);
    }

    &.active {
      background: var(--app-primary-color);
      color: white;
      font-weight: 500;
      border-right: 2px solid var(--app-primary-color);
    }
  }
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
.setting-container {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding: var(--app-space-m);
  background: var(--app-paper);
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
.setting-page.is-mobile {
  .layout-wrapper {
    display: block;
    position: relative;
  }

  .setting-nav {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 260px;
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

  .setting-container {
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
// Desktop styles
// ============================================
.setting-page:not(.is-mobile) {
  .sidebar-backdrop {
    display: none;
  }
}
</style>
