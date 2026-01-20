<script setup lang="ts">
// Navigation state
const activeSection = ref('info')

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
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'info':
      return 'LazyWorkspacesSettingTableGeneral'
    case 'columns':
      return 'LazyWorkspacesSettingTableColumns'
    case 'detail':
    case 'form':
    case 'card':
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
</script>

<template>
  <div class="setting-page">
    <!-- Navigation Sidebar -->
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

    <!-- Content Area -->
    <div class="setting-container">
      <component 
        :is="sectionComponent" 
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
