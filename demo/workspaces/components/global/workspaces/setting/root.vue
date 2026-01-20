<script lang="ts" setup>
// Navigation state
const activeSection = ref('general')

const settingsSections = [
  {
    group: 'GENERAL',
    items: [
      { id: 'general', label: 'General', icon: 'lucide:settings' }
    ]
  },
  {
    group: 'ACCESS & SECURITY',
    items: [
      { id: 'permissions', label: 'Permissions', icon: 'lucide:shield' }
    ]
  },
  {
    group: 'SETTINGS',
    items: [
      { id: 'danger', label: 'Danger Zone', icon: 'lucide:alert-triangle' }
    ]
  }
]

function switchSection(sectionId: string) {
  activeSection.value = sectionId
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'general':
      return 'LazyWorkspacesSettingRootGeneral'
    case 'permissions':
      return 'LazyWorkspacesSettingRootPermissions'
    case 'danger':
      return 'LazyWorkspacesSettingRootDanger'
    default:
      return 'LazyWorkspacesSettingRootGeneral'
  }
})
</script>

<template>
  <div class="setting-page">
    <!-- Navigation Sidebar -->
    <div class="setting-nav">
      <div class="nav-title">Settings</div>
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
      <component :is="sectionComponent" />
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
