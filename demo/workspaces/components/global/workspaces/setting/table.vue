<script setup lang="ts">
// Navigation state
const activeSection = ref('info')

// Responsive state
const pageContainerRef = ref<HTMLElement | null>(null)
const isMobileView = ref(false)
const isSidebarVisible = ref(true)

const settingsSections = [
  {
    group: 'GENERAL',
    items: [
      { id: 'info', label: 'Info', icon: 'lucide:info' },
      { id: 'columns', label: 'Columns', icon: 'lucide:columns' }
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
    items: [
      { id: 'permissions', label: 'Permissions', icon: 'lucide:shield' }
    ]
  },
  {
    group: 'AUTOMATION',
    items: [
      { id: 'automation', label: 'Workflows', icon: 'lucide:workflow' }
    ]
  },
  {
    group: 'SETTINGS',
    items: [
      { id: 'settings', label: 'Delete Table', icon: 'lucide:trash-2' }
    ]
  }
]

function switchSection(sectionId: string) {
  activeSection.value = sectionId
  // Auto-hide sidebar on mobile after selection
  if (isMobileView.value) {
    isSidebarVisible.value = false
  }
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'info':
      return 'LazyWorkspacesSettingTableGeneral'
    case 'columns':
      return 'LazyWorkspacesSettingTableColumns'
    case 'card':
      return 'LazyWorkspacesSettingTableCard'
    case 'detail':
      return 'LazyWorkspacesSettingTableDetail'
    case 'form':
    case 'list':
      return 'LazyWorkspacesSettingTableData'
    case 'automation':
      return 'LazyWorkspacesSettingTableAutomation'
    case 'permissions':
      return 'LazyWorkspacesSettingTablePermissions'
    case 'settings':
      return 'LazyWorkspacesSettingTableSettings'
    default:
      return 'LazyWorkspacesSettingTableGeneral'
  }
})

// Responsive handling
function checkContainerSize() {
  if (!pageContainerRef.value) return
  const containerWidth = pageContainerRef.value.offsetWidth
  isMobileView.value = containerWidth < 700
  
  // Auto-hide sidebar on mobile
  if (isMobileView.value && isSidebarVisible.value) {
    isSidebarVisible.value = false
  } else if (!isMobileView.value) {
    isSidebarVisible.value = true
  }
}

function toggleSidebar() {
  isSidebarVisible.value = !isSidebarVisible.value
}

onMounted(() => {
  checkContainerSize()
  
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
  <div ref="pageContainerRef" class="setting-page">
    <!-- Toggle button teleported to header for mobile -->
    <Teleport to="#database-table-header-right">
      <el-button 
        v-if="isMobileView" 
        size="small" 
        @click="toggleSidebar"
      >
        <Icon :name="isSidebarVisible ? 'lucide:panel-left-close' : 'lucide:panel-left'" size="16" />
      </el-button>
    </Teleport>

    <!-- Desktop: Splitter layout -->
    <template v-if="!isMobileView">
      <el-splitter>
        <el-splitter-panel :min="180" size="220px" collapsible>
          <div class="setting-nav">
            <div class="nav-title">Table Settings</div>
            <div class="nav-content">
              <template v-for="section in settingsSections" :key="section.group">
                <div class="settings-group">
                  <div class="group-title">{{ section.group }}</div>
                  <div class="group-items">
                    <div
                      v-for="item in section.items"
                      :key="item.id"
                      class="nav-item"
                      :class="{ active: activeSection === item.id }"
                      @click="switchSection(item.id)"
                    >
                      <Icon :name="item.icon" />
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </el-splitter-panel>
        <el-splitter-panel>
          <div class="setting-container">
            <component 
              :is="sectionComponent" 
              :active-sub-section="activeSection"
            />
          </div>
        </el-splitter-panel>
      </el-splitter>
    </template>

    <!-- Mobile: Overlay sidebar -->
    <template v-else>
      <!-- Sidebar overlay -->
      <Transition name="slide">
        <div v-if="isSidebarVisible" class="setting-nav mobile-sidebar">
          <div class="nav-title">Table Settings</div>
          <div class="nav-content">
            <template v-for="section in settingsSections" :key="section.group">
              <div class="settings-group">
                <div class="group-title">{{ section.group }}</div>
                <div class="group-items">
                  <div
                    v-for="item in section.items"
                    :key="item.id"
                    class="nav-item"
                    :class="{ active: activeSection === item.id }"
                    @click="switchSection(item.id)"
                  >
                    <Icon :name="item.icon" />
                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </Transition>

      <!-- Backdrop -->
      <Transition name="fade">
        <div v-if="isSidebarVisible" class="sidebar-backdrop" @click="isSidebarVisible = false" />
      </Transition>

      <!-- Main content -->
      <div class="setting-container">
        <component 
          :is="sectionComponent" 
          :active-sub-section="activeSection"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.setting-page {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.setting-nav {
  height: 100%;
  background: var(--app-grey-950);
  padding: var(--app-space-m) 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

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

  &.mobile-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 260px;
    z-index: 1001;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
}

.setting-container {
  height: 100%;
  overflow-y: auto;
  padding: var(--app-space-m);
  background: var(--app-paper);
}

.sidebar-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

// Transitions
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
