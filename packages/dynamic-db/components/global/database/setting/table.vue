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
      { id: 'detail', label: 'Dashboard', icon: 'lucide:file-text' },
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
    group: 'AUDIT',
    items: [{ id: 'auditLog', label: 'Audit Log', icon: 'lucide:history' }]
  },
  {
    group: 'SETTINGS',
    items: [{ id: 'settings', label: 'Delete Table', icon: 'lucide:trash-2' }]
  }
]

function switchSection(sectionId: string) {
  activeSection.value = sectionId
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'info':
      return 'LazyDatabaseSettingTableGeneral'
    case 'detail':
      return 'LazyDatabaseSettingTableDetail'

    case 'automation':
      return 'LazyDatabaseSettingTableAutomation'
    case 'auditLog':
      return 'LazyDatabaseSettingTableAuditLog'
    case 'permissions':
      return 'LazyDatabaseSettingMenuPermission'
    case 'settings':
      return 'LazyDatabaseSettingTableSettings'
    default:
      return 'LazyDatabaseSettingTableGeneral'
  }
})
</script>

<template>
  <div class="setting-page">
    <div class="layout-wrapper">
      <!-- Sidebar navigation -->
      <aside class="setting-nav">
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

      <!-- Main content -->
      <main class="setting-container">
        <component
          :is="sectionComponent"
          :active-sub-section="activeSection"
          :menu-item="currentMenuItem"
          :id="databaseMenuRouteParams.detailId"
        />
      </main>
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
</style>
