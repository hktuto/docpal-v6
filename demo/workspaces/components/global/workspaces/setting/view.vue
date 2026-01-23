<script setup lang="ts">
import type { CaseViewRecord } from '../../../../utils/db/schema/newTableSchema'

const { workspaceRouteParams, menuState, findItemById } = useSingleWorkspaceContext()

// Get current view from menu
const currentMenuItem = computed(() => {
  if (!workspaceRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, workspaceRouteParams.value.detailId as string)
})

// Navigation state
const activeSection = ref('info')

const settingsSections = [
  {
    group: 'GENERAL',
    items: [
      { id: 'info', label: 'View Info', icon: 'lucide:info' },
      { id: 'fields', label: 'Fields', icon: 'lucide:columns' }
    ]
  },
  {
    group: 'VIEW SETTINGS',
    items: [
      { id: 'type-settings', label: 'Type Settings', icon: 'lucide:settings-2' },
      { id: 'filters', label: 'Filters', icon: 'lucide:filter' },
      { id: 'sorting', label: 'Sorting', icon: 'lucide:arrow-up-down' },
      { id: 'grouping', label: 'Grouping', icon: 'lucide:group' }
    ]
  },
  {
    group: 'ACCESS & SECURITY',
    items: [
      { id: 'permissions', label: 'Permissions', icon: 'lucide:shield' }
    ]
  },
  {
    group: 'DANGER ZONE',
    items: [
      { id: 'delete', label: 'Delete View', icon: 'lucide:trash-2' }
    ]
  }
]

function switchSection(sectionId: string) {
  activeSection.value = sectionId
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'info':
      return 'LazyWorkspacesSettingViewGeneral'
    case 'fields':
      return 'LazyWorkspacesSettingViewFields'
    case 'type-settings':
      return 'LazyWorkspacesSettingViewTypeSettings'
    case 'filters':
      return 'LazyWorkspacesSettingViewFilters'
    case 'sorting':
      return 'LazyWorkspacesSettingViewSorting'
    case 'grouping':
      return 'LazyWorkspacesSettingViewGrouping'
    case 'permissions':
      return 'LazyWorkspacesSettingViewPermissions'
    case 'delete':
      return 'LazyWorkspacesSettingViewDelete'
    default:
      return 'LazyWorkspacesSettingViewGeneral'
  }
})
</script>

<template>
  <div class="setting-page">
    <!-- Navigation Sidebar -->
    <div class="setting-nav">
      <div class="nav-title">View Settings</div>
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
                tabindex="0"
                :aria-label="`Go to ${item.label}`"
                @click="switchSection(item.id)"
                @keydown.enter="switchSection(item.id)"
              >
                <Icon :name="item.icon" />
                <span>{{ item.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Content Area -->
    <div class="setting-container">
      <component 
        :is="sectionComponent" 
        :menu-item="currentMenuItem"
        :active-sub-section="activeSection"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-page {
  height: 100%;
  display: grid;
  grid-template-columns: 220px 1fr;
  overflow: hidden;
}

.setting-nav {
  height: 100%;
  background: var(--app-grey-950);
  border-right: 1px solid var(--app-grey-800);
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
}

.setting-container {
  height: 100%;
  overflow-y: auto;
  padding: var(--app-space-m);
}
</style>
